// frontend/src/api/robotWebSocket.js

let socket;

function normalizeTableId(rawTableId) {
    if (rawTableId == null) return null;
    if (typeof rawTableId === 'number') {
        return Number.isInteger(rawTableId) && rawTableId > 0 ? rawTableId : null;
    }

    const text = String(rawTableId).trim();
    const digits = text.replaceAll(/\D/g, '');
    if (!digits) return null;

    const parsed = Number.parseInt(digits, 10);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

export const connectToRobot = () => {
    // Raspberry Pi එකේ IP ලිපිනය මෙතනට ලබා දෙන්න.
    // උදා: 'ws://192.168.1.100:8765'
    socket = new WebSocket('ws://localhost:8765');

    socket.onopen = () => {
        console.log("Connected to AURA Robot Controller");
    };

    socket.onmessage = (event) => {
        console.log("Message from Robot:", event.data);
    };

    socket.onerror = (error) => {
        console.error("WebSocket Error:", error);
    };
};

export const sendOrderToRobot = async (tableId, items, placeOrderFn, onDone) => {
  try {
    // 1. Save to backend (same as placeOrder)
    const order = await placeOrderFn();
    console.log('✅ Order saved to backend:', order.id);

    // 2. Send to robot via WebSocket
    if (socket?.readyState === WebSocket.OPEN) {
      const numericTableId = normalizeTableId(tableId);
      const mappedItems = items.map(item => ({
        menuItemId: item.id,
        quantity: item.quantity,
      })).filter(item => Number.isInteger(item.menuItemId) && item.quantity > 0);

      const payload = {
        type: 'PLACE_ORDER',
        tableId: numericTableId,
        orderId: order.id,
        items: mappedItems,
      };

      socket.send(JSON.stringify(payload));
      console.log('🤖 Order sent to Robot:', payload);
    } else {
      console.warn('WebSocket not connected — robot not notified');
    }

    // 3. Callback after both done
    if (typeof onDone === 'function') onDone();

    return order;
  } catch (error) {
    console.error('Failed to place order or notify robot:', error);
    throw error;
  }
};