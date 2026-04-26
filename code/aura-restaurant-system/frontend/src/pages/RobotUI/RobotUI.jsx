import { useState, useCallback, useEffect, useMemo } from 'react';
import { ChefHat, Flame, Leaf, IceCreamCone, Coffee, UtensilsCrossed, Plus, Minus, ShoppingBag, Send, CreditCard, Trash2, LogOut, Sun, Moon, Lock, X, Clock, Bike, Sparkles, PartyPopper, CheckCircle2, Loader2 } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { useRestaurant, ORDER_STATUS } from '../../context/RestaurantContext';
import { getMenuImageSrc } from '../../utils/menuImages';
import { orderMqtt } from '../../api/mqttclient';

// Import WebSocket helpers
import { connectToRobot, sendOrderToRobot } from '../../api/robotWebSocket';

// ─── Constants ────────────────────────────────────────────────────────────────
const CATS = [
  { id: 'all', label: 'All', icon: ChefHat },
  { id: 'popular', label: 'Popular', icon: Flame },
  { id: 'mains', label: 'Mains', icon: UtensilsCrossed },
  { id: 'healthy', label: 'Healthy', icon: Leaf },
  { id: 'desserts', label: 'Desserts', icon: IceCreamCone },
  { id: 'drinks', label: 'Drinks', icon: Coffee },
];



const STATUS_CFG = {
  PENDING:   { label: 'Sent — Awaiting Kitchen',  icon: Clock,       color: 'text-sky-400',    bg: 'bg-sky-500/10',    ring: 'ring-sky-500/25'    },
  PREPARING: { label: 'Kitchen is Preparing…',    icon: ChefHat,     color: 'text-amber-400',  bg: 'bg-amber-500/10',  ring: 'ring-amber-500/25'  },
  READY:     { label: 'Robot is Delivering! 🤖',  icon: Bike,        color: 'text-orange-400', bg: 'bg-orange-500/10', ring: 'ring-orange-500/25' },
  DELIVERED: { label: 'Delivered! Enjoy 🎉',      icon: PartyPopper, color: 'text-emerald-400',bg: 'bg-emerald-500/10',ring: 'ring-emerald-500/25'},
  PAID:      { label: 'Payment Completed! 💳',    icon: CreditCard,  color: 'text-green-400',  bg: 'bg-green-500/10',  ring: 'ring-green-500/25'  },
};

const UPSELLS = [
  { menuId: 13, text: 'How about a Matcha Latte?',      price: '$6.50'  },
  { menuId: 10, text: 'Molten Lava Cake is on fire!',   price: '$12.00' },
  { menuId: 12, text: 'Treat yourself — Tiramisu?',      price: '$13.00' },
  { menuId: 15, text: 'Sparkling Rose Lemonade?',        price: '$7.50'  },
];

const MARKETING_ROTATE_MS = 4500;
const PAY = { SELECT: 'SELECT', QR: 'QR', PROC: 'PROC', DONE: 'DONE' };

// ─── CSS QR Placeholder ───────────────────────────────────────────────────────
function MockQR() {
  const cells = [1,1,1,0,1,0,1,1,1,1,0,1,0,0,0,1,0,1,1,0,1,0,1,0,1,0,1,1,1,1,0,0,1,1,1,1,0,0,0,1,1,0,0,1,0,1,1,0,1,0,1,0,1,1,1,0,1,0,0,1,0,1,1,1,0,1,1,0,0,0,1,1,0,1,0,1,1,0,1,1,1];
  return (
    <div className="inline-grid grid-cols-9 gap-[2px] p-4 bg-white rounded-2xl shadow-xl">
      {cells.map((c,i) => <div key={i} className={`w-5 h-5 rounded-sm ${c?'bg-gray-900':'bg-white'}`}/>)}
    </div>
  );
}

// ─── Payment Modal ───────────────────────────────────────────────────
function PayModal({ total, table, dark, onSuccess, onClose }) {
  const [step, setStep] = useState(PAY.SELECT);
  const bg = dark ? 'bg-[#1a1a1a] border-white/10' : 'bg-white border-gray-200';
  const tt = dark ? 'text-white' : 'text-gray-900';
  const st = dark ? 'text-gray-400' : 'text-gray-500';
  const btn2 = dark ? 'bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 border border-gray-200 text-gray-700';

  const pick = () => {
    setStep(PAY.QR);
    setTimeout(() => setStep(PAY.PROC), 3000);
    setTimeout(() => setStep(PAY.DONE), 5500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-6">
      <div className={`rounded-3xl w-full max-w-sm border shadow-2xl ${bg}`}>
        {step === PAY.SELECT && (
          <div className="p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className={`font-display text-xl font-bold ${tt}`}>Pay — {table}</h3>
                <p className={`text-sm ${st}`}>Total: <span className="font-bold text-orange-500">${total.toFixed(2)}</span></p>
              </div>
              <button onClick={onClose} className={`w-8 h-8 rounded-xl flex items-center justify-center ${btn2}`}><X size={16}/></button>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-4">
              {[{id:'card',e:'💳',l:'Credit/Debit'},{id:'qr',e:'📱',l:'Lanka QR Pay'}].map(m=>(
                <button key={m.id} onClick={pick} className={`flex flex-col items-center gap-3 p-5 rounded-2xl border-2 text-sm font-medium transition-all active:scale-95 ${dark ? 'border-white/10 hover:border-orange-500/50 bg-white/5 text-white' : 'border-gray-200 hover:border-orange-400 bg-gray-50 text-gray-800'}`}>
                  <span className="text-3xl">{m.e}</span>{m.l}
                </button>
              ))}
            </div>
            <button onClick={onClose} className={`w-full py-3 rounded-2xl text-sm font-medium transition-all ${btn2}`}>Cancel</button>
          </div>
        )}
        {step === PAY.QR && (
          <div className="p-8 text-center">
            <h3 className={`font-display text-lg font-bold mb-1 ${tt}`}>Scan to Pay</h3>
            <div className="flex justify-center mb-4"><MockQR/></div>
            <div className={`text-xs px-3 py-2 rounded-xl inline-flex items-center gap-2 ${dark ? 'bg-amber-500/10 text-amber-400' : 'bg-amber-50 text-amber-600'}`}>
              <Loader2 size={12} className="animate-spin"/> Waiting…
            </div>
          </div>
        )}
        {step === PAY.DONE && (
          <div className="p-10 text-center">
            <div className="w-20 h-20 mx-auto rounded-full bg-emerald-500/15 flex items-center justify-center mb-5">
              <CheckCircle2 size={40} className="text-emerald-400"/>
            </div>
            <h3 className={`font-display text-2xl font-bold mb-2 ${tt}`}>Payment Successful!</h3>
            <button onClick={onSuccess} className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-green-500 text-white font-bold text-base shadow-lg shadow-emerald-500/25">Done — Thank You!</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export default function RobotUI() {
  const { session, logout, verifyCredentials, menuItems, theme, toggleTheme, refreshMenu } = useAppContext();
  const { placeOrder, getUnpaidOrders, getUnpaidTotal, getLatestOrder, markTablePaid } = useRestaurant();

  // Subscribe to menu updates from MQTT (synced from AdminDashboard)
  useEffect(() => {
    orderMqtt.connect();
    const unsubMenu = orderMqtt.onMenuUpdate(() => refreshMenu());
    return () => { unsubMenu(); };
  }, [refreshMenu]);

  
  const dark       = theme === 'dark';
  const table      = session?.tableNumber || 'T?';
  const confirmed  = getUnpaidOrders(table);
  const confTotal  = getUnpaidTotal(table);
  const latest     = getLatestOrder(table);
  const status     = latest?.status || null;
  const sCfg       = status ? STATUS_CFG[status] : null;
  const delivered  = status === ORDER_STATUS.DELIVERED;

  const [draft, setDraft]                   = useState([]);
  const [cat, setCat]                       = useState('all');
  const [showPay, setShowPay]               = useState(false);
  const [showLogout, setShowLogout]         = useState(false);
  const [lUser, setLUser]                   = useState('');
  const [lPass, setLPass]                   = useState('');
  const [lErr, setLErr]                     = useState('');
  const [lLoading, setLLoading]             = useState(false);
  const [upsellIndex, setUpsellIndex]       = useState(0);

  // 1. Initialize Robot Connection on Mount
  useEffect(() => {
    connectToRobot();
  }, []);

  const recommendationItems = useMemo(
    () => UPSELLS
      .map((u) => ({ ...u, menuItem: menuItems.find((m) => m.id === u.menuId) }))
      .filter((u) => !!u.menuItem),
    [menuItems]
  );

  useEffect(() => {
    if (recommendationItems.length < 2) return;
    const timer = setInterval(() => {
      setUpsellIndex((prev) => (prev + 1) % recommendationItems.length);
    }, MARKETING_ROTATE_MS);
    return () => clearInterval(timer);
  }, [recommendationItems.length]);

  const addDraft = useCallback((item) => {
    setDraft(p => {
      const ex = p.find(i => i.id === item.id);
      return ex ? p.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i)
                : [...p, { ...item, quantity: 1 }];
    });
  }, []);

  const decDraft = useCallback((id) => {
    setDraft(p => {
      const ex = p.find(i => i.id === id);
      return ex?.quantity > 1 ? p.map(i => i.id === id ? { ...i, quantity: i.quantity - 1 } : i)
                               : p.filter(i => i.id !== id);
    });
  }, []);

  const rmDraft = useCallback((id) => setDraft(p => p.filter(i => i.id !== id)), []);
  const draftTotal = draft.reduce((s, i) => s + i.price * i.quantity, 0);
  const grand = confTotal + draftTotal;
  const items = cat === 'all' ? menuItems : menuItems.filter(i => i.category === cat);
  const hasActiveSession = confirmed.length > 0;
  const currentUpsell = recommendationItems.length ? recommendationItems[upsellIndex % recommendationItems.length] : null;

  // 2. Updated Order Handler with WebSocket Integration
  const placeOrderHandler = () => {
    if (!draft.length) return;

    // A. Original UI/Context Logic
    //placeOrder(table, draft, hasActiveSession);

    // B. WebSocket Logic: Send to Robot Controller
    sendOrderToRobot(table, draft);

    setDraft([]);
  };

  const paySuccess = async () => {
    if (draft.length > 0) {
      //placeOrder(table, draft, hasActiveSession);
      sendOrderToRobot(table, draft); // Ensure last minute additions go to robot
    }
    try {
      await markTablePaid(table);
      setShowPay(false);
      setDraft([]);
    } catch (error) {
      console.error('Failed to mark table as paid:', error);
      // Still close modal but show error
      setShowPay(false);
    }
  };

  const addRecommendationToDraft = useCallback((menuItem) => {
    if (!menuItem) return;
    addDraft(menuItem);
  }, [addDraft]);

  const confirmLogout = async () => {
    if (!lUser || !lPass) { setLErr('Enter username and password.'); return; }
    setLLoading(true);
    await new Promise(r => setTimeout(r, 500));
    const ok = verifyCredentials(lUser, lPass);
    setLLoading(false);
    if (ok) logout(); else setLErr('Incorrect credentials.');
  };

  const D = dark;
  const tc = {
    root:     D ? 'bg-[#0d0d0d]' : 'bg-gray-100',
    bar:      D ? 'bg-[#111] border-white/5' : 'bg-white border-gray-200',
    card:     D ? 'bg-[#1a1a1a] border-white/5 hover:border-orange-500/40' : 'bg-white border-gray-200 hover:border-orange-400 hover:shadow-sm',
    hero:     D ? 'from-[#222] to-[#1a1a1a]' : 'from-orange-50 to-white',
    panel:    D ? 'bg-[#111] border-white/8' : 'bg-white border-gray-200',
    confBg:   D ? 'bg-white/[0.03]' : 'bg-gray-50',
    draftBg:  D ? 'bg-[#1e1e1e]' : 'bg-white',
    row:      D ? 'bg-white/[0.03] hover:bg-white/[0.06] border-white/5' : 'bg-gray-50 hover:bg-orange-50/50 border-gray-100',
    tt:       D ? 'text-white' : 'text-gray-900',
    st:       D ? 'text-gray-400' : 'text-gray-500',
    mc:       D ? 'text-gray-600' : 'text-gray-400',
    div:      D ? 'border-white/6' : 'border-gray-200',
    catA:     'bg-orange-500 text-white shadow-md shadow-orange-500/30',
    catI:     D ? 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10' : 'bg-white text-gray-500 hover:text-gray-900 border border-gray-200',
    btn2:     D ? 'bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white' : 'bg-gray-100 hover:bg-gray-200 border border-gray-200 text-gray-700',
    modal:    D ? 'bg-[#1a1a1a] border-white/10' : 'bg-white border-gray-200',
    inp:      D ? 'bg-[#0d0d0d] border-white/10 text-white placeholder-gray-600' : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-400',
    qtyD:     D ? 'bg-white/5 hover:bg-red-500/20 text-gray-400 hover:text-red-400' : 'bg-gray-100 hover:bg-red-100 text-gray-400 hover:text-red-500',
    qtyI:     'bg-orange-500/20 hover:bg-orange-500 text-orange-500 hover:text-white',
  };

  return (
    <div className={`flex h-screen overflow-hidden font-sans transition-colors duration-300 ${tc.root}`}>
      {/* ── LEFT: MENU PANEL ── */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <div className={`flex-shrink-0 flex items-center gap-3 px-5 py-3 border-b ${tc.bar}`}>
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/30">
              <ChefHat size={20} className="text-white"/>
            </div>
            <div>
              <p className={`font-display text-base font-bold leading-tight ${tc.tt}`}>AURA Menu</p>
              <p className="text-xs text-orange-500 font-medium">{session?.displayName} — Touch to order</p>
            </div>
          </div>
          <div className="flex-1 flex gap-2 overflow-x-auto scrollbar-hide px-2">
            {CATS.map(({id, label, icon: Ic}) => (
              <button key={id} onClick={() => setCat(id)} className={`flex-shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all duration-200 active:scale-95 ${cat===id ? tc.catA : tc.catI}`}>
                <Ic size={14}/>{label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button onClick={toggleTheme} className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all active:scale-90 ${D ? 'bg-white/5 hover:bg-white/15 text-yellow-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'}`}>
              {D ? <Sun size={17}/> : <Moon size={17}/>}
            </button>
            <button onClick={() => { setLUser(''); setLPass(''); setLErr(''); setShowLogout(true); }} className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all active:scale-95 ${tc.btn2}`}>
              <LogOut size={14}/><span className="hidden sm:inline">Staff Logout</span>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {items.map(item => {
              const dQty = draft.find(i => i.id === item.id)?.quantity || 0;
              const cQty = confirmed.flatMap(o => o.items).filter(it => it.id === item.id).reduce((s,it) => s+it.quantity, 0);
              return (
                <div key={item.id} className={`border rounded-2xl overflow-hidden transition-all duration-300 group ${tc.card}`}>
                  <div className={`h-36 bg-gradient-to-br ${tc.hero} relative overflow-hidden`}>
                    <img src={getMenuImageSrc(item.imageFilename)} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    <div className={`absolute inset-0 ${D ? 'bg-black/25' : 'bg-black/10'}`} />
                    {dQty > 0 && <div className="absolute top-3 left-3 w-7 h-7 rounded-full bg-orange-500 text-white text-xs font-bold flex items-center justify-center animate-pulse-soft">{dQty}</div>}
                    {cQty > 0 && dQty === 0 && <div className={`absolute top-3 left-3 px-2 py-0.5 rounded-full text-[10px] font-bold ${D ? 'bg-emerald-500/80 text-white' : 'bg-emerald-100 text-emerald-700'}`}>×{cQty} ✓</div>}
                  </div>
                  <div className="p-4">
                    <h3 className={`font-semibold text-base leading-tight mb-1 truncate ${tc.tt}`}>{item.name}</h3>
                    <p className={`text-xs leading-5 h-10 overflow-hidden mb-2 ${tc.st}`}>{item.description || 'Chef crafted signature dish.'}</p>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-xl font-bold text-orange-500">${item.price.toFixed(2)}</span>
                      <span className={`text-xs ${tc.mc}`}>⏱ {item.time}</span>
                    </div>
                    {dQty > 0 ? (
                      <div className="flex items-center gap-2">
                        <button onClick={() => decDraft(item.id)} className={`flex-1 h-11 rounded-xl flex items-center justify-center ${tc.qtyD}`}><Minus size={18}/></button>
                        <span className={`w-8 text-center text-lg font-bold ${tc.tt}`}>{dQty}</span>
                        <button onClick={() => addDraft(item)} className={`flex-1 h-11 rounded-xl flex items-center justify-center ${tc.qtyI}`}><Plus size={18}/></button>
                      </div>
                    ) : (
                      <button onClick={() => addDraft(item)} className={`w-full h-11 rounded-xl font-semibold text-sm transition-all active:scale-95 flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-400 text-white shadow-lg shadow-orange-500/20 ${delivered ? 'ring-2 ring-orange-400/30' : ''}`}>
                        <Plus size={18}/>{delivered ? 'Add More' : 'Add to Order'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── RIGHT: BILLING PANEL ── */}
      <div className={`w-[400px] flex-shrink-0 flex flex-col border-l ${tc.panel}`}>
        <div className={`px-5 py-4 border-b ${tc.div}`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${delivered ? 'bg-emerald-500/15' : 'bg-orange-500/15'}`}>
              {delivered ? <PartyPopper size={22} className="text-emerald-400"/> : <ShoppingBag size={22} className="text-orange-400"/>}
            </div>
            <div>
              <p className={`font-display font-bold text-base ${tc.tt}`}>{delivered ? 'Enjoy your meal! 🎉' : `${table} — Order Bill`}</p>
              <p className={`text-xs ${tc.st}`}>{delivered ? 'Need more? Add items & send add-on!' : `Grand Total: $${grand.toFixed(2)}`}</p>
            </div>
          </div>
          {sCfg && (
            <div className={`mt-3 flex items-center gap-3 px-4 py-3 rounded-2xl ring-1 ${sCfg.ring} ${sCfg.bg}`}>
              <sCfg.icon size={18} className={sCfg.color}/>
              <div className="flex-1">
                <p className={`font-semibold text-sm ${sCfg.color}`}>{sCfg.label}</p>
                <div className="flex gap-1.5 mt-1.5">
                  {Object.keys(STATUS_CFG).map((k, i) => {
                    const keys = Object.keys(STATUS_CFG);
                    return <div key={k} className={`h-1 flex-1 rounded-full transition-all duration-700 ${i <= keys.indexOf(status) ? 'bg-orange-500' : D ? 'bg-white/10' : 'bg-gray-200'}`}/>;
                  })}
                </div>
              </div>
              {!delivered && <Loader2 size={16} className="text-orange-400 animate-spin flex-shrink-0"/>}
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className={`${tc.confBg} border-b ${tc.div}`}>
            <div className="px-5 pt-4 pb-2 flex items-center gap-2">
              <CheckCircle2 size={12} className="text-emerald-500"/>
              <span className={`text-[11px] font-bold uppercase tracking-widest ${tc.mc}`}>Kitchen Is Preparing</span>
            </div>
            {confirmed.length === 0 ? (
              <p className={`px-5 pb-4 text-xs ${tc.mc}`}>No unpaid confirmed tickets yet.</p>
            ) : (
              <div className="px-4 pb-3 space-y-0.5">
                {confirmed.map(order => (
                  <div key={order.id}>
                    <p className={`text-[10px] font-mono px-1 py-1 ${tc.mc}`}>#{order.ticketNum}{order.isAddon ? ' · Add-on' : ''}</p>
                    {order.items.map((it, idx) => (
                      <div key={idx} className={`flex items-center gap-3 px-3 py-2 rounded-xl border mb-1 ${D ? 'bg-white/[0.03] border-white/5' : 'bg-white border-gray-100'}`}>
                        <img src={getMenuImageSrc(it.imageFilename)} alt={it.name} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className={`text-xs font-medium truncate ${tc.tt}`}>{it.name}</p>
                          <p className={`text-[10px] ${tc.mc}`}>${it.price.toFixed(2)} × {it.quantity}</p>
                        </div>
                        <span className="text-xs font-bold text-orange-500">${(it.price*it.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className={tc.draftBg}>
            {draft.length === 0 ? (
              <div className={`text-center py-10 ${tc.mc}`}>
                <ShoppingBag size={36} className="mx-auto mb-2 opacity-25"/>
                <p className="text-sm">No draft items yet.</p>
              </div>
            ) : (
              <div className="p-4 space-y-2">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles size={12} className="text-orange-400"/>
                  <span className={`text-[11px] font-bold uppercase tracking-widest ${tc.mc}`}>Your Current Selection</span>
                </div>
                {draft.map(item => (
                  <div key={item.id} className={`flex items-center gap-3 border rounded-2xl p-3 transition-all group/r shadow-sm ${tc.row}`}>
                    <img src={getMenuImageSrc(item.imageFilename)} alt={item.name} className="w-11 h-11 rounded-xl object-cover" />
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-semibold truncate ${tc.tt}`}>{item.name}</p>
                      <p className={`text-xs ${tc.st}`}>${item.price.toFixed(2)}</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => decDraft(item.id)} className={`w-8 h-8 rounded-xl flex items-center justify-center ${tc.qtyD}`}><Minus size={14}/></button>
                      <span className={`w-6 text-center text-sm font-bold ${tc.tt}`}>{item.quantity}</span>
                      <button onClick={() => addDraft(item)} className={`w-8 h-8 rounded-xl flex items-center justify-center ${tc.qtyI}`}><Plus size={14}/></button>
                    </div>
                    <button onClick={() => rmDraft(item.id)} className={`opacity-0 group-hover/r:opacity-100 transition-all ${D ? 'text-gray-600 hover:text-red-400' : 'text-gray-300 hover:text-red-500'}`}><Trash2 size={13}/></button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className={`flex-shrink-0 p-5 border-t ${tc.div} space-y-3`}>
          <div className="space-y-1.5">
            <div className={`flex justify-between items-center pt-2`}>
              <span className={`font-bold text-base ${tc.tt}`}>Grand Total</span>
              <span className="font-bold text-2xl text-orange-500">${grand.toFixed(2)}</span>
            </div>
          </div>
          <button onClick={placeOrderHandler} disabled={!draft.length} className="w-full py-4 rounded-2xl font-bold text-base text-white bg-gradient-to-r from-orange-500 to-orange-600 shadow-lg shadow-orange-500/25 active:scale-95 disabled:opacity-30 transition-all flex items-center justify-center gap-3">
            <Send size={18}/>{hasActiveSession ? `Send Add-on — ${table}` : `Place Order — ${table}`}
          </button>
          <button onClick={() => setShowPay(true)} disabled={grand === 0} className={`w-full py-3.5 rounded-2xl font-semibold text-sm flex items-center justify-center gap-2 ${tc.btn2}`}>
            <CreditCard size={18}/>Pay & Close — ${grand.toFixed(2)}
          </button>
          
          {currentUpsell && (
            <div className={`mt-2 p-3 rounded-2xl border ${D ? 'bg-white/[0.03] border-white/10' : 'bg-orange-50/60 border-orange-100'}`}>
              <div className="flex items-center gap-3">
                <img src={getMenuImageSrc(currentUpsell.menuItem?.imageFilename)} alt={currentUpsell.text} className="w-12 h-12 rounded-xl object-cover" />
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold truncate ${tc.tt}`}>{currentUpsell.text}</p>
                  <p className="text-xs text-orange-500 font-medium">{currentUpsell.price}</p>
                </div>
                <button onClick={() => addRecommendationToDraft(currentUpsell.menuItem)} className="px-3 py-2 rounded-xl text-xs font-bold text-white bg-orange-500">Add</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {showPay && <PayModal total={grand} table={table} dark={D} onSuccess={paySuccess} onClose={() => setShowPay(false)}/>}
      {showLogout && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-6">
          <div className={`rounded-3xl p-8 w-full max-w-sm border shadow-2xl ${tc.modal}`}>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Lock size={22} className="text-red-400"/>
                <h3 className={`font-display text-lg font-bold ${tc.tt}`}>Staff Verification</h3>
              </div>
              <button onClick={() => setShowLogout(false)} className={tc.btn2}><X size={16}/></button>
            </div>
            <input type="text" value={lUser} onChange={e=>setLUser(e.target.value)} placeholder="Username" className={`w-full rounded-xl px-4 py-3 mb-4 ${tc.inp}`}/>
            <input type="password" value={lPass} onChange={e=>setLPass(e.target.value)} onKeyDown={e=>e.key==='Enter'&&confirmLogout()} placeholder="Password" className={`w-full rounded-xl px-4 py-3 mb-4 ${tc.inp}`}/>
            {lErr && <div className="mb-4 text-xs text-red-400">⚠️ {lErr}</div>}
            <button onClick={confirmLogout} disabled={lLoading} className="w-full py-3 rounded-2xl bg-red-500 text-white font-bold">{lLoading ? 'Verifying...' : 'Logout'}</button>
          </div>
        </div>
      )}
    </div>
  );
}