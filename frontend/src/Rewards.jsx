import React, { useEffect, useState } from "react";
import axios from "axios";
import { Award, Coins, Package, CheckCircle2, Clock } from "lucide-react";
import { api } from "./main.jsx"; // Use the secure interceptor API

const mockProducts = [
  { id: 1, name: "Nagrik Nova Official Supporter T-Shirt", price: 100, image: "/watermarked_img_2354946755341967162-removebg-preview.png" },
  { id: 2, name: "LEGO Marvel Spider-Man Keyring", price: 150, image: "/854290.png" }, 
  { id: 3, name: "Domino's Pizza ₹500 E-Voucher", price: 300, image: "/32a0d627-ade5-4988-8936-330a4b22d6a4-removebg-preview.png" },
  { id: 4, name: "OnePlus Nord 4 Custom Back Cover", price: 400, image: "/868e78b2-bba0-48f0-9482-4c0d2e7fb608-removebg-preview.png" },
  { id: 5, name: "boAt Airdopes 141 TWS Wireless Earphones", price: 800, image: "/images-removebg-preview.png" }
];

export default function Rewards({ user }) {
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  
  const userId = user?.id || user?._id;

  useEffect(() => {
    if (userId) {
      // Pull balance from the live Render backend
      api.get(`/users/${userId}`)
        .then(res => setBalance(res.data.coins || 0))
        .catch(err => console.error("Could not fetch wallet", err))
        .finally(() => setLoading(false));

      const savedOrders = JSON.parse(localStorage.getItem(`nn-orders-${userId}`) || "[]");
      setOrders(savedOrders);
    }
  }, [userId]);

  const handleRedeem = async (e, item) => {
    e.preventDefault();
    e.stopPropagation();

    if (balance >= item.price) {
      const confirmRedeem = window.confirm(`Do you want to redeem '${item.name}' for ${item.price} Nova Coins?`);
      
      if (!confirmRedeem) return; 

      try {
        const res = await api.post(`/users/${userId}/redeem`, { cost: item.price });
        setBalance(res.data.coins);

        const newOrder = {
          orderId: `ORD-${Math.floor(Math.random() * 100000)}`,
          name: item.name,
          date: new Date().toLocaleDateString(),
          status: "Processing",
          image: item.image 
        };
        
        const updatedOrders = [newOrder, ...orders];
        setOrders(updatedOrders);
        localStorage.setItem(`nn-orders-${userId}`, JSON.stringify(updatedOrders));

        alert(`🎉 Success! Your ${item.name} has been redeemed.\n\nEstimated delivery: 3-5 business days to your registered address.`);
      } catch (error) {
        console.error("Redemption failed:", error);
        alert("Something went wrong while processing your redemption. Please try again.");
      }
    } else {
      alert("Not enough coins! Keep reporting civic issues to earn more rewards.");
    }
  };

  return (
    <section className="page">
      <div className="page-head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
        <div>
          <div className="eyebrow"><Award size={15} /> Changemaker Rewards</div>
          <h1>Redeem your <em>impact.</em></h1>
          <p>Use the coins you earned from reporting issues to claim rewards.</p>
        </div>
        
        <div className="chat-bubble" style={{ padding: '15px 25px', display: 'flex', alignItems: 'center', gap: '15px' }}>
          <Coins size={32} color="#fff" />
          <div style={{ color: '#fff' }}>
            <div style={{ fontSize: '12px', opacity: 0.9, textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}>Available Balance</div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}>{loading ? '...' : balance} Nova Coins</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px', marginTop: '30px' }}>
        {mockProducts.map((item) => (
          <div key={item.id} className="issue" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '15px', minHeight: 'auto' }}>
            
            <div style={{ fontSize: '70px', textAlign: 'center', padding: '10px', background: 'rgba(255, 255, 255, 0.4)', borderRadius: '12px', boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.02)', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '220px' }}>
              {item.image ? (
                <img src={item.image} alt={item.name} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
              ) : (
                <Package size={60} color="#9ca3af" />
              )}
            </div>

            <div>
              <h3 style={{ fontSize: '16px', margin: '0 0 5px 0' }}>{item.name}</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#f59e0b', fontWeight: 'bold', fontSize: '14px' }}>
                <Coins size={16} /> {item.price} Coins
              </div>
            </div>

            <button 
              className="btn full" 
              onClick={(e) => handleRedeem(e, item)}
              disabled={balance < item.price}
              style={{ 
                marginTop: 'auto',
                opacity: balance < item.price ? 0.5 : 1,
                cursor: balance < item.price ? 'not-allowed' : 'pointer',
                background: balance >= item.price ? '#10b981' : '#4b5563',
                color: 'white', border: 'none', padding: '12px', borderRadius: '8px', fontWeight: 'bold'
              }}
            >
              {balance >= item.price ? 'Redeem Reward' : 'Not enough coins'}
            </button>
          </div>
        ))}
      </div>

      {orders.length > 0 && (
        <div style={{ marginTop: '50px' }}>
          <h2>Your Redemptions</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '20px' }}>
            {orders.map(order => (
              <div key={order.orderId} className="issue" style={{ display: 'flex', alignItems: 'center', gap: '20px', padding: '15px', background: 'rgba(255,255,255,0.02)' }}>
                <div style={{ width: '60px', height: '60px', background: 'rgba(255, 255, 255, 0.4)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {order.image ? (
                     <img src={order.image} alt={order.name} style={{ maxWidth: '80%', maxHeight: '80%', objectFit: 'contain' }} />
                  ) : (
                     <Package size={30} color="#9ca3af" />
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <h4 style={{ margin: '0 0 5px 0', fontSize: '16px' }}>{order.name}</h4>
                  <div style={{ fontSize: '12px', color: '#9ca3af' }}>Order ID: {order.orderId} • Redeemed on {order.date}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#10b981', fontSize: '14px', fontWeight: 'bold' }}>
                   {order.status === 'Processing' ? <Clock size={16} color="#f59e0b" /> : <CheckCircle2 size={16} />}
                   <span style={{ color: order.status === 'Processing' ? '#f59e0b' : '#10b981' }}>{order.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}