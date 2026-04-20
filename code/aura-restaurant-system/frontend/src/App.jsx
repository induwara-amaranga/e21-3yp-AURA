/**
 * ============================================================
 *  AURA Restaurant System — Root App Component
 * ============================================================
 *  Routing logic:
 *    - No session      → LoginPage  (public)
 *    - role = 'table'  → RobotUI    (NO navbar — customer sees only ordering screen)
 *    - role = 'admin'  → AdminDashboard  (with navbar)
 *    - role = 'kitchen'→ KitchenDisplay  (with navbar)
 *
 *  The BrowserRouter is kept so that deep links still work for
 *  admin/kitchen views. Table view ignores URL entirely.
 * ============================================================
 */

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useAppContext } from './context/AppContext';
import { RestaurantProvider } from './context/RestaurantContext';
import Navbar from './components/layout/Navbar';
import LoginPage from './pages/LoginPage/LoginPage';
import RobotUI from './pages/RobotUI/RobotUI';
import AdminDashboard from './pages/AdminDashboard/AdminDashboard';
import KitchenDisplay from './pages/KitchenDisplay/KitchenDisplay';

// ── Protected route shell ─────────────────────────────────────────────────────
// Shows navbar only for staff roles (admin / kitchen), not for table customers.
function AppShell() {
  const { session } = useAppContext();
  const isAdmin = session?.role === 'admin';
  const isKitchen = session?.role === 'kitchen';

  // Not authenticated → always show Login
  if (!session) return <LoginPage />;

  // Table role → full-screen ordering UI, no navbar, no back navigation
  if (session.role === 'table') {
    return (
      <div className="min-h-screen bg-[#0f0f0f]">
        <RobotUI />
      </div>
    );
  }

  // Admin / Kitchen → standard layout with navbar
  return (
    <Router>
      <div className="min-h-screen bg-dark-950 bg-grid">
        <Navbar />
        <main>
          <Routes>
            {/* Role-aware root redirect */}
            <Route path="/" element={<Navigate to={isAdmin ? '/admin' : '/kitchen'} replace />} />

            {/* [API ENDPOINT]: GET /api/v1/auth/me */}
            {/* [DATA SYNC]: Role guard keeps staff users on authorized pages even if browser restores an old URL. */}
            {isAdmin && (
              <>
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/kitchen" element={<KitchenDisplay />} />
              </>
            )}

            {isKitchen && (
              <>
                <Route path="/kitchen" element={<KitchenDisplay />} />
                <Route path="/admin" element={<Navigate to="/kitchen" replace />} />
              </>
            )}

            {/* Catch-all keeps users within role-scoped pages */}
            <Route path="*" element={<Navigate to={isAdmin ? '/admin' : '/kitchen'} replace />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

// ── Root export ───────────────────────────────────────────────────────────────
function App() {
  return (
    <AppProvider>
      <RestaurantProvider>
        <AppShell />
      </RestaurantProvider>
    </AppProvider>
  );
}

export default App;
