/**
 * ============================================================
 *  AURA Restaurant System — Global Application Context
 * ============================================================
 *  Manages:
 *    - Auth session (who is logged in, which table/role)
 *    - Menu items list (shared between RobotUI & AdminDashboard)
 *    - App-wide theme ('dark' | 'light')
 *
 *  All mock data clearly marked with [BACKEND INTEGRATION: TODO].
 * ============================================================
 */

import { createContext, useContext, useState, useCallback, useEffect } from 'react';

const MENU_STORAGE_KEY = 'aura_menu_items';
const MENU_STORAGE_VER = 1;

function loadInitialMenuItems() {
  try {
    const raw = localStorage.getItem(MENU_STORAGE_KEY);
    if (!raw) return INITIAL_MENU_ITEMS;
    const parsed = JSON.parse(raw);
    if (parsed.__v !== MENU_STORAGE_VER || !Array.isArray(parsed.items)) {
      return INITIAL_MENU_ITEMS;
    }
    return parsed.items;
  } catch {
    return INITIAL_MENU_ITEMS;
  }
}

// ─── Mock Credentials Map ─────────────────────────────────────────────────────
// [BACKEND INTEGRATION: TODO] - POST /api/auth/login
// Description: Replace this static map with a real API call.
//   - Send { username, password } to the backend.
//   - Receive a JWT token (store in localStorage or httpOnly cookie) and a user
//     object containing { role, tableNumber, displayName }.
//   - On failure the backend returns 401; show an error message.
// ─────────────────────────────────────────────────────────────────────────────
const MOCK_CREDENTIALS = {
  table1:  { password: 'table_pwd_1', role: 'table',   tableNumber: 'T1', displayName: 'Table 1' },
  table2:  { password: 'table_pwd_2', role: 'table',   tableNumber: 'T2', displayName: 'Table 2' },
  table3:  { password: 'table_pwd_3', role: 'table',   tableNumber: 'T3', displayName: 'Table 3' },
  table4:  { password: 'table_pwd_4', role: 'table',   tableNumber: 'T4', displayName: 'Table 4' },
  admin:   { password: 'admin123',    role: 'admin',   tableNumber: null, displayName: 'Admin' },
  kitchen: { password: 'kitchen123', role: 'kitchen',  tableNumber: null, displayName: 'Kitchen Staff' },
};

// ─── Initial Mock Menu Data ───────────────────────────────────────────────────
// [BACKEND INTEGRATION: TODO] - GET /api/menu
// Description: On app boot call GET /api/menu.
//   Returns: [{ id, name, price, category, emoji, prepTime, rating, available }]
//   Replace with fetched data. Use React Query for caching; invalidate when admin
//   adds or removes items via POST/DELETE /api/menu.
// ─────────────────────────────────────────────────────────────────────────────
const INITIAL_MENU_ITEMS = [
  { id: 1,  name: 'Truffle Wagyu Burger',    price: 28.99, category: 'popular',  emoji: '🍔', time: '15 min', rating: 4.9 },
  { id: 2,  name: 'Lobster Risotto',         price: 34.50, category: 'popular',  emoji: '🦞', time: '20 min', rating: 4.8 },
  { id: 3,  name: 'Dragon Roll Sushi',       price: 22.00, category: 'popular',  emoji: '🍣', time: '12 min', rating: 4.7 },
  { id: 4,  name: 'Grilled Salmon Fillet',   price: 26.50, category: 'mains',    emoji: '🐟', time: '18 min', rating: 4.6 },
  { id: 5,  name: 'Herb Crusted Lamb',       price: 32.00, category: 'mains',    emoji: '🍖', time: '25 min', rating: 4.8 },
  { id: 6,  name: 'Mushroom Ravioli',        price: 19.50, category: 'mains',    emoji: '🍝', time: '14 min', rating: 4.5 },
  { id: 7,  name: 'Quinoa Buddha Bowl',      price: 16.00, category: 'healthy',  emoji: '🥗', time: '10 min', rating: 4.4 },
  { id: 8,  name: 'Acai Power Bowl',         price: 14.50, category: 'healthy',  emoji: '🫐', time: '8 min',  rating: 4.5 },
  { id: 9,  name: 'Avocado Poke Bowl',       price: 18.00, category: 'healthy',  emoji: '🥑', time: '10 min', rating: 4.6 },
  { id: 10, name: 'Molten Lava Cake',        price: 12.00, category: 'desserts', emoji: '🍫', time: '12 min', rating: 4.9 },
  { id: 11, name: 'Crème Brûlée',           price: 10.50, category: 'desserts', emoji: '🍮', time: '10 min', rating: 4.7 },
  { id: 12, name: 'Tiramisu Tower',          price: 13.00, category: 'desserts', emoji: '🍰', time: '8 min',  rating: 4.8 },
  { id: 13, name: 'Matcha Latte',            price: 6.50,  category: 'drinks',   emoji: '🍵', time: '4 min',  rating: 4.3 },
  { id: 14, name: 'Fresh Mango Smoothie',    price: 8.00,  category: 'drinks',   emoji: '🥭', time: '5 min',  rating: 4.5 },
  { id: 15, name: 'Sparkling Rose Lemonade', price: 7.50,  category: 'drinks',   emoji: '🍋', time: '3 min',  rating: 4.4 },
];

// ─── Context ──────────────────────────────────────────────────────────────────
const AppContext = createContext(null);

export function AppProvider({ children }) {
  // ── Auth state ──
  const [session, setSession]       = useState(null);
  const [loginError, setLoginError] = useState('');

  // ── Menu state ── (shared: RobotUI reads, AdminDashboard reads + writes)
  const [menuItems, setMenuItems]   = useState(loadInitialMenuItems);

  // [API ENDPOINT]: GET /api/v1/menu
  // [DATA SYNC]: Persist menu state locally so Admin edits remain visible after refresh and in parallel tabs until backend sync is wired.
  useEffect(() => {
    try {
      localStorage.setItem(
        MENU_STORAGE_KEY,
        JSON.stringify({ items: menuItems, __v: MENU_STORAGE_VER })
      );
    } catch {}
  }, [menuItems]);

  // [API ENDPOINT]: GET /api/v1/menu
  // [DATA SYNC]: Mirror menu changes from other tabs so Robot UI immediately reflects Admin-added items.
  useEffect(() => {
    const handleStorage = (event) => {
      if (event.key !== MENU_STORAGE_KEY || !event.newValue) return;
      try {
        const payload = JSON.parse(event.newValue);
        if (payload.__v !== MENU_STORAGE_VER || !Array.isArray(payload.items)) return;
        setMenuItems(payload.items);
      } catch {}
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  // ── Theme state ── ('dark' | 'light')  persisted to localStorage
  const [theme, setTheme] = useState(() => {
    try { return localStorage.getItem('aura_theme') || 'dark'; }
    catch { return 'dark'; }
  });

  const toggleTheme = useCallback(() => {
    setTheme((t) => {
      const next = t === 'dark' ? 'light' : 'dark';
      try { localStorage.setItem('aura_theme', next); } catch {}
      return next;
    });
  }, []);

  // ── Login ─────────────────────────────────────────────────────────────────
  // [BACKEND INTEGRATION: TODO] - POST /api/auth/login
  // Replace with: const res = await axiosInstance.post('/auth/login', { username, password });
  //               setSession(res.data.user); localStorage.setItem('aura_token', res.data.token);
  // ─────────────────────────────────────────────────────────────────────────
  const login = useCallback((username, password) => {
    setLoginError('');
    const cred = MOCK_CREDENTIALS[username.trim().toLowerCase()];
    if (cred && cred.password === password) {
      setSession({
        role:        cred.role,
        tableNumber: cred.tableNumber,
        displayName: cred.displayName,
        username:    username.trim().toLowerCase(),
      });
      return true;
    }
    setLoginError('Invalid username or password. Please try again.');
    return false;
  }, []);

  // ── Verify credentials WITHOUT logging in (used by Secure Logout modal) ──
  // [BACKEND INTEGRATION: TODO] - POST /api/auth/verify-logout
  // Description: Validates staff credentials server-side before destroying the
  //   customer session. Replace mock check below with:
  //   const res = await axiosInstance.post('/auth/verify-logout', { username, password });
  //   return res.data.valid; // boolean
  // ─────────────────────────────────────────────────────────────────────────
  const verifyCredentials = useCallback((username, password) => {
    const cred = MOCK_CREDENTIALS[username.trim().toLowerCase()];
    return !!(cred && cred.password === password);
  }, []);

  // ── Logout ────────────────────────────────────────────────────────────────
  // [BACKEND INTEGRATION: TODO] - POST /api/auth/logout
  // Description: Invalidate JWT on backend, clear localStorage token.
  // ─────────────────────────────────────────────────────────────────────────
  const logout = useCallback(() => {
    setSession(null);
    setLoginError('');
  }, []);

  // ── Add Menu Item (Admin only) ────────────────────────────────────────────
  // [API ENDPOINT]: POST /api/v1/menu
  // [DATA SYNC]: Additions are written to shared context + local storage so Robot and Admin screens stay consistent.
  // ─────────────────────────────────────────────────────────────────────────
  const addMenuItem = useCallback((newItem) => {
    const itemWithId = {
      ...newItem,
      id:     Date.now(),        // MOCK id — backend assigns real DB id
      rating: 0,
      time:   newItem.time || '15 min',
    };
    setMenuItems((prev) => [...prev, itemWithId]);
    return itemWithId;
  }, []);

  // ── Delete Menu Item (Admin only) ─────────────────────────────────────────
  // [API ENDPOINT]: DELETE /api/v1/menu/:id
  // [DATA SYNC]: Deletes are applied to shared context + local storage to prevent stale menu rows on Robot UI.
  // ─────────────────────────────────────────────────────────────────────────
  const deleteMenuItem = useCallback((itemId) => {
    setMenuItems((prev) => prev.filter((item) => item.id !== itemId));
  }, []);

  const value = {
    session, loginError,
    login, logout, verifyCredentials,
    theme, toggleTheme,
    menuItems, addMenuItem, deleteMenuItem,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppContext must be used inside <AppProvider>');
  return ctx;
}

export default AppContext;
