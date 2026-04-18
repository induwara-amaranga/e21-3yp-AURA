/**
 * ============================================================
 *  AURA Restaurant System — Restaurant Context
 * ============================================================
 *  Single source of truth for ALL order state.
 *
 *  ┌─────────────────────────────────────────────────────────┐
 *  │  ROOT CAUSE FIX — Cross-Tab Sync                        │
 *  │                                                         │
 *  │  React Context lives only in ONE tab's memory.          │
 *  │  Robot UI (table1 tab) and Kitchen Display (kitchen     │
 *  │  tab) are SEPARATE browser tabs → separate memory →     │
 *  │  they can't share a React Context instance directly.    │
 *  │                                                         │
 *  │  Solution: persist state to localStorage on every       │
 *  │  change, and listen to the browser's `storage` event    │
 *  │  to reload state when another tab writes to it.         │
 *  │                                                         │
 *  │  When backend is ready, replace the localStorage layer  │
 *  │  with a WebSocket subscription:                         │
 *  │  // [FUTURE WEBSOCKET/API] /api/orders/sync             │
 *  └─────────────────────────────────────────────────────────┘
 *
 *  Data flow:
 *    Robot UI  → placeOrder()           → localStorage → KDS reads via storage event
 *    Kitchen   → acceptOrder()          → localStorage → Robot UI reads via storage event
 *    Kitchen   → markDelivered()        → localStorage → Robot UI shows "Delivered!"
 *    Robot UI  → markTablePaid()        → localStorage → Grand total resets to $0
 * ============================================================
 */

import {
  createContext, useContext, useCallback, useReducer, useEffect,
} from 'react';

// ── Constants ─────────────────────────────────────────────────────────────────
const STORAGE_KEY   = 'aura_restaurant_state';
const STORAGE_VER   = 1; // bump this to wipe stale data on breaking changes
const DAY_IN_MS     = 24 * 60 * 60 * 1000;

const INITIAL_STATE = { orderHistory: [], ticketCounter: 1 };

export const ORDER_STATUS = {
  PENDING:   'PENDING',    // Customer placed, kitchen hasn't accepted yet
  PREPARING: 'PREPARING',  // Kitchen accepted and is cooking
  READY:     'READY',      // Done cooking, robot picking up
  DELIVERED: 'DELIVERED',  // Robot delivered to table
};

// ─────────────────────────────────────────────────────────────────────────────
// Helper: hydrate Date objects after JSON.parse (serialises createdAt as string)
// ─────────────────────────────────────────────────────────────────────────────
const hydrate = (raw) => ({
  ...raw,
  orderHistory: (raw.orderHistory || []).map((o) => ({
    ...o,
    createdAt: new Date(o.createdAt),
    deliveredAt: o.deliveredAt ? new Date(o.deliveredAt) : null,
    paidAt: o.paidAt ? new Date(o.paidAt) : null,
  })),
  ticketCounter: raw.ticketCounter || 1,
});

// ─────────────────────────────────────────────────────────────────────────────
// Helper: read initial state from localStorage (or use empty state)
// ─────────────────────────────────────────────────────────────────────────────
function loadInitialState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return INITIAL_STATE;
    const parsed = JSON.parse(raw);
    // Version guard — wipe state if schema changed
    if (parsed.__v !== STORAGE_VER) return INITIAL_STATE;
    return hydrate(parsed);
  } catch {
    return INITIAL_STATE;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Reducer — pure state transitions
// ─────────────────────────────────────────────────────────────────────────────
function reducer(state, action) {
  switch (action.type) {

    case 'PLACE_ORDER': {
      // [FUTURE WEBSOCKET/API] Replace localStorage dispatch with:
      //   socket.emit('order:place', payload)
      //   Kitchen listens → server saves → broadcasts back to all clients
      const newOrder = {
        id:          `ORD-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
        tableNumber: action.payload.tableNumber,
        ticketNum:   state.ticketCounter,
        items:       action.payload.items,
        status:      ORDER_STATUS.PENDING,
        total:       action.payload.items.reduce((s, i) => s + i.price * i.quantity, 0),
        isPaid:      false,
        isAddon:     action.payload.isAddon || false,
        createdAt:   new Date(),
        deliveredAt: null,
        paidAt:      null,
      };
      return {
        ...state,
        orderHistory:  [...state.orderHistory, newOrder],
        ticketCounter: state.ticketCounter + 1,
      };
    }

    case 'UPDATE_ORDER_STATUS': {
      // [FUTURE WEBSOCKET/API] Replace with:
      //   socket.emit('order:status', { orderId, status })
      //   Robot UI listens → updates its status badge instantly
      return {
        ...state,
        orderHistory: state.orderHistory.map((o) =>
          o.id === action.payload.orderId
            ? {
              ...o,
              status: action.payload.status,
              deliveredAt:
                action.payload.status === ORDER_STATUS.DELIVERED
                  ? (o.deliveredAt || new Date())
                  : o.deliveredAt,
            }
            : o
        ),
      };
    }

    case 'MARK_TABLE_PAID': {
      // [FUTURE WEBSOCKET/API] Replace with:
      //   socket.emit('payment:confirm', { tableNumber })
      //   Server marks orders, broadcasts clearance to Robot UI
      return {
        ...state,
        orderHistory: state.orderHistory.map((o) =>
          o.tableNumber === action.payload.tableNumber && !o.isPaid
            ? { ...o, isPaid: true, paidAt: new Date() }
            : o
        ),
      };
    }

    case 'CANCEL_ORDER': {
      return {
        ...state,
        orderHistory: state.orderHistory.filter((o) => o.id !== action.payload.orderId),
      };
    }

    // ── Triggered by the `storage` event when another tab writes state ────────
    case 'SYNC_FROM_STORAGE': {
      return hydrate(action.payload);
    }

    default:
      return state;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Context + Provider
// ─────────────────────────────────────────────────────────────────────────────
const RestaurantContext = createContext(null);

export function RestaurantProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, undefined, loadInitialState);

  // ── Persist to localStorage on every state change ─────────────────────────
  //    This is what makes OTHER tabs receive the update via the storage event.
  //    [FUTURE WEBSOCKET/API] Remove this effect once real-time backend exists.
  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ ...state, __v: STORAGE_VER })
      );
    } catch (e) {
      console.warn('[AURA] Could not write to localStorage:', e);
    }
  }, [state]);

  // ── Listen for changes made by OTHER tabs ─────────────────────────────────
  //    The `storage` event fires in all tabs EXCEPT the one that wrote the data.
  //    [FUTURE WEBSOCKET/API] Replace this with websocket.on('state:sync', ...)
  useEffect(() => {
    const handleStorage = (e) => {
      if (e.key !== STORAGE_KEY || !e.newValue) return;
      try {
        const fresh = JSON.parse(e.newValue);
        // Ignore stale schema versions
        if (fresh.__v !== STORAGE_VER) return;
        dispatch({ type: 'SYNC_FROM_STORAGE', payload: fresh });
      } catch {
        // Ignore malformed storage values
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  // ── Selectors (pure derivations from state) ───────────────────────────────

  /** Unpaid orders for a specific table */
  const getUnpaidOrders = useCallback(
    (tableNumber) =>
      state.orderHistory.filter((o) => o.tableNumber === tableNumber && !o.isPaid),
    [state.orderHistory]
  );

  /** Sum of all unpaid order totals for a table — used for Grand Total display */
  const getUnpaidTotal = useCallback(
    (tableNumber) => getUnpaidOrders(tableNumber).reduce((s, o) => s + o.total, 0),
    [getUnpaidOrders]
  );

  /** Most recent unpaid order for a table — drives the status badge on Robot UI */
  const getLatestOrder = useCallback((tableNumber) => {
    const orders = state.orderHistory.filter(
      (o) => o.tableNumber === tableNumber && !o.isPaid
    );
    return orders.length ? orders[orders.length - 1] : null;
  }, [state.orderHistory]);

  /**
   * [API ENDPOINT]: GET /api/v1/admin/revenue?status=PAID
   * [DATA SYNC]: Derives confirmed revenue from persistent paid orders shared by Robot, Kitchen, and Admin views.
   */
  const getConfirmedRevenue = useCallback(
    () => state.orderHistory.filter((o) => o.isPaid).reduce((s, o) => s + o.total, 0),
    [state.orderHistory]
  );

  /**
   * [API ENDPOINT]: GET /api/v1/admin/stats
   * [DATA SYNC]: Tracks unpaid kitchen-confirmed value separately so pending totals never pollute confirmed revenue.
   */
  const getPendingOrderTotal = useCallback(
    () => state.orderHistory.filter((o) => !o.isPaid).reduce((s, o) => s + o.total, 0),
    [state.orderHistory]
  );

  /**
   * [API ENDPOINT]: GET /api/v1/orders/history?range=24h
   * [DATA SYNC]: Reads persistent delivered timestamps so kitchen history survives refresh and cross-role logins.
   */
  const getDeliveredHistory24h = useCallback(() => {
    const now = Date.now();
    return state.orderHistory
      .filter((o) => o.status === ORDER_STATUS.DELIVERED && o.deliveredAt)
      .filter((o) => now - new Date(o.deliveredAt).getTime() <= DAY_IN_MS)
      .sort((a, b) => new Date(b.deliveredAt).getTime() - new Date(a.deliveredAt).getTime());
  }, [state.orderHistory]);

  /**
   * All in-flight orders across tables — displayed on KDS.
   *
   * IMPORTANT:
   * Kitchen workflow must follow ORDER_STATUS lifecycle, not payment flag.
   * A customer may pay before cooking starts, but the ticket still needs
   * to remain visible to kitchen until it is delivered.
   *
   * [BACKEND INTEGRATION: TODO]
   * Mirror this behavior with a status-driven query such as:
   * GET /api/v1/orders?statuses=PENDING,PREPARING,READY
   */
  const activeOrders = state.orderHistory.filter((o) => o.status !== ORDER_STATUS.DELIVERED);

  // ── Mutators ──────────────────────────────────────────────────────────────

  const placeOrder = useCallback((tableNumber, items, isAddon = false) => {
    // [API ENDPOINT]: POST /api/v1/orders/addon
    // [DATA SYNC]: Persists the new ticket into shared context + localStorage for immediate Kitchen/Admin visibility.
    dispatch({ type: 'PLACE_ORDER', payload: { tableNumber, items, isAddon } });
  }, []);

  const updateOrderStatus = useCallback((orderId, status) => {
    // [API ENDPOINT]: PATCH /api/v1/orders/:orderId/status
    // [DATA SYNC]: Status changes are written once and reflected across all role views through storage synchronization.
    dispatch({ type: 'UPDATE_ORDER_STATUS', payload: { orderId, status } });
  }, []);

  const acceptOrder   = useCallback((id) => updateOrderStatus(id, ORDER_STATUS.PREPARING), [updateOrderStatus]);
  const markReady     = useCallback((id) => updateOrderStatus(id, ORDER_STATUS.READY),     [updateOrderStatus]);
  const markDelivered = useCallback((id) => updateOrderStatus(id, ORDER_STATUS.DELIVERED), [updateOrderStatus]);

  const cancelOrder = useCallback((orderId) => {
    // [API ENDPOINT]: DELETE /api/v1/orders/:orderId
    // [DATA SYNC]: Removes stale tickets from the shared store to keep kitchen board and table session consistent.
    dispatch({ type: 'CANCEL_ORDER', payload: { orderId } });
  }, []);

  const markTablePaid = useCallback((tableNumber) => {
    // [API ENDPOINT]: POST /api/v1/payments/verify
    // [DATA SYNC]: Marks all table tickets as paid so confirmed revenue updates persist for Admin analytics and refreshes.
    dispatch({ type: 'MARK_TABLE_PAID', payload: { tableNumber } });
  }, []);

  const value = {
    orderHistory: state.orderHistory,
    activeOrders,
    getUnpaidOrders,
    getUnpaidTotal,
    getLatestOrder,
    getConfirmedRevenue,
    getPendingOrderTotal,
    getDeliveredHistory24h,
    placeOrder,
    updateOrderStatus,
    acceptOrder,
    markReady,
    markDelivered,
    cancelOrder,
    markTablePaid,
  };

  return (
    <RestaurantContext.Provider value={value}>
      {children}
    </RestaurantContext.Provider>
  );
}

export function useRestaurant() {
  const ctx = useContext(RestaurantContext);
  if (!ctx) throw new Error('useRestaurant must be used inside <RestaurantProvider>');
  return ctx;
}

export default RestaurantContext;
