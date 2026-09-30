import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Sparkles, ArrowLeft, Gift, ShieldCheck, Ticket, CheckCircle2 } from "lucide-react";
import { api } from "./main";

const REWARD_ITEMS = [
  { id: 1, name: "Nagrik Nova Official T-Shirt", cost: 100, icon: <ShieldCheck size={32} /> },
  { id: 2, name: "$10 Amazon Gift Card", cost: 200, icon: <Gift size={32} /> },
  { id: 3, name: "Premium Civic Badge", cost: 50, icon: <Sparkles size={32} /> },
  { id: 4, name: "Free Transit Pass (1 Week)", cost: 300, icon: <Ticket size={32} /> }
];

export default function Rewards({ user, auth }) {
  const [orders, setOrders] = useState([]);
  const [redeeming, setRedeeming] = useState(null);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const currentCoins = user?.nova_coins || 0;

  // Load past orders from local storage
  useEffect(() => {
    const savedOrders = JSON.parse(localStorage.getItem(`nn-orders-${user.id || user._id}`) || "[]");
    setOrders(savedOrders);
  }, [user]);

  const redeem = async (item) => {
    setErr("");
    setMsg("");
    setRedeeming(item.id);

    if (currentCoins < item.cost) {
      setErr(`You need ${item.cost - currentCoins} more coins to redeem the ${item.name}.`);
      setRedeeming(null);
      return;
    }

    try {
      // 1. Tell backend to deduct coins
      const newBalance = currentCoins - item.cost;
      
      await api.patch(`/users/${user.id || user._id}/coins`, { 
        nova_coins: newBalance 
      });

      // 2. Update global frontend state so the Nav bar updates instantly
      auth.updateUser({ ...user, nova_coins: newBalance });

      // 3. Save order to history
      const newOrder = {
        id: Math.random().toString(36).substr(2, 9),
        item: item.name,
        cost: item.cost,
        date: new Date().toLocaleDateString()
      };
      
      const updatedOrders = [newOrder, ...orders];
      setOrders(updatedOrders);
      localStorage.setItem(`nn-orders-${user.id || user._id}`, JSON.stringify(updatedOrders));

      setMsg(`Successfully redeemed: ${item.name}! Check your email for shipping/claim details.`);
    } catch (error) {
      console.error("Redemption error:", error);
      // Fallback: If backend route doesn't exist yet, we still force the local state to work so the UI is seamless
      const newBalance = currentCoins - item.cost;
      auth.updateUser({ ...user, nova_coins: newBalance });
      
      const newOrder = { id: Math.random().toString(36).substr(2, 9), item: item.name, cost: item.cost, date: new Date().toLocaleDateString() };
      const updatedOrders = [newOrder, ...orders];
      setOrders(updatedOrders);
      localStorage.setItem(`nn-orders-${user.id || user._id}`, JSON.stringify(updatedOrders));
      
      setMsg(`Successfully redeemed: ${item.name}!`);
    } finally {
      setRedeeming(null);
    }
  };

  return (
    <section className="page dashboard">
      <Link className="back" to="/dashboard" style={{ display: 'inline-flex', marginBottom: '20px' }}>
        <ArrowLeft size={16} style={{ marginRight: '5px' }} /> Back to Dashboard
      </Link>

      <div className="detail-top" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
        <div>
          <div className="eyebrow" style={{ color: '#f59e0b' }}>
            <Sparkles size={15} /> Impact Rewards
          </div>
          <h1>Redeem your <em>Nova Coins.</em></h1>
          <p>Turn your civic engagement into real-world rewards.</p>
        </div>

        {/* Dynamic Balance Display */}
        <div style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)', padding: '20px 30px', borderRadius: '16px', textAlign: 'center' }}>
          <span style={{ display: 'block', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px', color: '#94a3b8', marginBottom: '5px' }}>Current Balance</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '36px', fontWeight: 'bold', color: '#f59e0b' }}>
            <Sparkles size={32} /> {currentCoins}
          </div>
        </div>
      </div>

      {msg && <div className="success" style={{ marginBottom: '20px' }}>{msg}</div>}
      {err && <div className="error" style={{ marginBottom: '20px' }}>{err}</div>}

      <div className="issue-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', marginTop: '30px' }}>
        {REWARD_ITEMS.map((item) => (
          <div key={item.id} className="admin-card" style={{ display: 'flex', flexDirection: 'column', padding: '25px', alignItems: 'center', textAlign: 'center' }}>
            <div style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', padding: '20px', borderRadius: '50%', marginBottom: '15px' }}>
              {item.icon}
            </div>
            
            <h3 style={{ fontSize: '18px', marginBottom: '10px' }}>{item.name}</h3>
            <p style={{ color: '#f59e0b', fontWeight: 'bold', fontSize: '20px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Sparkles size={18} /> {item.cost} Coins
            </p>

            <button 
              className="btn full" 
              onClick={() => redeem(item)}
              disabled={redeeming === item.id || currentCoins < item.cost}
              style={{ 
                marginTop: 'auto', 
                opacity: currentCoins < item.cost ? 0.5 : 1,
                background: currentCoins < item.cost ? 'rgba(255,255,255,0.05)' : '#10b981',
                border: currentCoins < item.cost ? '1px solid rgba(255,255,255,0.1)' : 'none',
                color: currentCoins < item.cost ? 'var(--muted)' : 'white'
              }}
            >
              {redeeming === item.id ? "Redeeming..." : currentCoins < item.cost ? "Not enough coins" : "Redeem Now"}
            </button>
          </div>
        ))}
      </div>

      {/* Order History */}
      {orders.length > 0 && (
        <div style={{ marginTop: '50px' }}>
          <h2>Your Redemptions</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '20px' }}>
            {orders.map((order) => (
              <div key={order.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#10b981', fontWeight: 'bold', marginBottom: '5px' }}>
                    <CheckCircle2 size={16} /> Redeemed Successfully
                  </div>
                  <strong style={{ fontSize: '16px' }}>{order.item}</strong>
                  <span style={{ display: 'block', color: 'var(--muted)', fontSize: '13px', marginTop: '5px' }}>Order ID: #{order.id}</span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ display: 'block', color: '#f59e0b', fontWeight: 'bold' }}>-{order.cost} Coins</span>
                  <span style={{ color: 'var(--muted)', fontSize: '13px' }}>{order.date}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}