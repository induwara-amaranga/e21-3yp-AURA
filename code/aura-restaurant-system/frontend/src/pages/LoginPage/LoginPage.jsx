/**
 * ============================================================
 *  AURA Restaurant System — Login Page
 * ============================================================
 *  This is the entry point for ALL users (table staff, admin,
 *  kitchen). A staff member initializes the tablet then hands
 *  it to customers — the customer never sees the nav bar again.
 *
 *  Mock Credentials (remove after backend integration):
 *    table1 / table_pwd_1  →  Robot UI locked to Table 1
 *    table2 / table_pwd_2  →  Robot UI locked to Table 2
 *    admin  / admin123     →  Admin Dashboard
 *    kitchen/ kitchen123   →  Kitchen Display
 *
 * [BACKEND INTEGRATION: TODO] - POST /api/auth/login
 *   Replace the mock login() call with a real API request.
 *   Expected payload:  { username: string, password: string }
 *   Expected response: { token: string, user: { role, tableNumber, displayName } }
 *   Store JWT in localStorage under key 'aura_token'.
 *   On 401 → display the error message from the response body.
 * ============================================================
 */

import { useState } from 'react';
import { Zap, User, Lock, Eye, EyeOff, Bot } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';

export default function LoginPage() {
  const { login, loginError } = useAppContext();

  const [username, setUsername]       = useState('');
  const [password, setPassword]       = useState('');
  const [showPass, setShowPass]       = useState(false);
  const [loading, setLoading]         = useState(false);
  const [shakeKey, setShakeKey]       = useState(0); // triggers shake animation on error

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) return;

    setLoading(true);

    // ── MOCK: simulate a tiny network delay ──────────────────────────────────
    // [BACKEND INTEGRATION: TODO] - POST /api/auth/login
    // Replace the setTimeout block below with:
    //   const res = await axiosInstance.post('/auth/login', { username, password });
    //   login(res.data.token, res.data.user);   ← adjust AppContext.login signature
    // ────────────────────────────────────────────────────────────────────────
    await new Promise((r) => setTimeout(r, 600));

    const ok = login(username, password);
    setLoading(false);

    if (!ok) {
      // Trigger shake animation on the card
      setShakeKey((k) => k + 1);
    }
  };

  // Quick-fill helpers (Dev convenience — remove in production)
  const quickFill = (user, pass) => { setUsername(user); setPassword(pass); };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0d1117] via-[#181e30] to-[#0d1117] flex items-center justify-center p-4">

      {/* Background grid */}
      <div className="absolute inset-0 bg-grid opacity-50 pointer-events-none" />

      <div className="w-full max-w-md relative z-10">

        {/* ── Logo ── */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-orange-500 to-orange-600 shadow-2xl shadow-orange-500/30 mb-4 animate-float">
            <Bot size={40} className="text-white" />
          </div>
          <h1 className="font-display text-4xl font-extrabold text-white tracking-tight">
            AURA
          </h1>
          <p className="text-dark-400 mt-1 text-sm tracking-widest uppercase">
            Smart Restaurant System
          </p>
        </div>

        {/* ── Card ── */}
        <div
          key={shakeKey}
          className={`glass rounded-3xl p-8 shadow-2xl shadow-black/40 border border-white/5 ${
            shakeKey > 0 ? 'animate-shake' : ''
          }`}
        >
          <h2 className="font-display text-2xl font-bold text-white mb-1">Staff Sign In</h2>
          <p className="text-dark-400 text-sm mb-8">
            Enter your credentials to initialise this terminal.
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Username */}
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-1.5">
                Username
              </label>
              <div className="relative">
                <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-dark-500" />
                <input
                  id="login-username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. table1, admin, kitchen"
                  autoComplete="username"
                  className="w-full bg-dark-800 border border-dark-600 rounded-xl pl-11 pr-4 py-3.5
                             text-white placeholder-dark-500 text-sm
                             focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20
                             transition-all duration-200"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-dark-500" />
                <input
                  id="login-password"
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  autoComplete="current-password"
                  className="w-full bg-dark-800 border border-dark-600 rounded-xl pl-11 pr-12 py-3.5
                             text-white placeholder-dark-500 text-sm
                             focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20
                             transition-all duration-200"
                />
                <button
                  type="button"
                  onClick={() => setShowPass((s) => !s)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-dark-500 hover:text-dark-200 transition-colors"
                >
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Error message */}
            {loginError && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-sm text-red-400 animate-slide-up">
                ⚠️ {loginError}
              </div>
            )}

            {/* Submit */}
            <button
              id="login-submit"
              type="submit"
              disabled={loading || !username || !password}
              className="w-full py-4 rounded-2xl font-bold text-lg text-white
                         bg-gradient-to-r from-orange-500 to-orange-600
                         hover:from-orange-400 hover:to-orange-500
                         shadow-lg shadow-orange-500/30
                         active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed
                         transition-all duration-200 flex items-center justify-center gap-3"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in…
                </>
              ) : (
                <>
                  <Zap size={20} />
                  Sign In
                </>
              )}
            </button>
          </form>

          {/* ── Dev Quick-Fill Panel (remove in production) ── */}
          <details className="mt-8">
            <summary className="text-xs text-dark-500 cursor-pointer hover:text-dark-300 transition-colors select-none">
              🔧 Dev: Quick fill credentials
            </summary>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {[
                ['table1', 'table_pwd_1'],
                ['table2', 'table_pwd_2'],
                ['admin',  'admin123'],
                ['kitchen','kitchen123'],
              ].map(([u, p]) => (
                <button
                  key={u}
                  onClick={() => quickFill(u, p)}
                  className="text-xs px-3 py-2 rounded-lg bg-dark-700 hover:bg-dark-600
                             text-dark-300 hover:text-white transition-all text-left"
                >
                  <span className="font-mono">{u}</span>
                </button>
              ))}
            </div>
          </details>
        </div>

        {/* Footer note */}
        <p className="text-center text-dark-600 text-xs mt-6">
          © {new Date().getFullYear()} Project AURA — for authorised staff use only
        </p>
      </div>
    </div>
  );
}
