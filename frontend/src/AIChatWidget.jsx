import React, { useState } from 'react';
import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://nagrik-nova.onrender.com',
});

const API_URL = import.meta.env.VITE_API_URL || 'https://nagrik-nova.onrender.com';

export default function AIChatWidget() {
    const [isOpen, setIsOpen] = useState(false);
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState([
        { role: 'agent', text: 'Hi! I am Nova, the nationwide AI assistant for Nagrik Nova. You can report an issue anywhere in India or ask about existing ones. How can I help?' }
    ]);
    const [loading, setLoading] = useState(false);

    const sendMessage = async (e) => {
        e.preventDefault();
        if (!input.trim()) return;

        const userMessage = input;
        setMessages((prev) => [...prev, { role: 'user', text: userMessage }]);
        setInput('');
        setLoading(true);

        try {
            const userStr = localStorage.getItem('nn-user');
            const userObj = userStr ? JSON.parse(userStr) : null;
            const response = await axios.post(`${API_URL}/ai/chat`, {
                message: userMessage,
                history: messages,
                userId: userObj ? userObj.id : null
            });
            setMessages((prev) => [...prev, { role: 'agent', text: response.data.message }]);
        } catch (error) {
            console.error('Chat error:', error);
            setMessages((prev) => [...prev, { role: 'agent', text: 'Sorry, I lost connection to the server. Please try again.' }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="chat-widget" style={{ position: 'fixed', bottom: '25px', right: '25px', zIndex: 9999, fontFamily: 'inherit' }}>
            {isOpen ? (
                <div className="chat-window" style={{ width: '340px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

                    {/* THE FIX: Replaced hardcoded #182937 with dynamic var(--ink) and inherit */}
                    <div className="chat-header" style={{ padding: '16px', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--ink)' }}>
                        <span>Nova AI Agent</span>
                        <button onClick={() => setIsOpen(false)} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontSize: '18px' }}>✖</button>
                    </div>

                    <div style={{ height: '320px', overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', background: 'transparent' }}>
                        {messages.map((msg, idx) => (
                            <div key={idx} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                                <div style={{
                                    padding: '10px 14px',
                                    borderRadius: '12px',
                                    maxWidth: '85%',
                                    background: msg.role === 'user' ? 'rgba(47, 116, 94, 0.85)' : 'rgba(255, 255, 255, 0.6)',
                                    backdropFilter: 'blur(10px)',
                                    border: '1px solid rgba(255,255,255,0.3)',
                                    color: msg.role === 'user' ? '#fff' : '#1f2937',
                                    fontSize: '14px',
                                    lineHeight: '1.4',
                                    boxShadow: '0 4px 10px rgba(0,0,0,0.05)'
                                }}>
                                    {msg.text}
                                </div>
                            </div>
                        ))}
                        {loading && <div style={{ fontSize: '13px', color: '#6b7280', fontStyle: 'italic' }}>Nova is thinking...</div>}
                    </div>

                    <form onSubmit={sendMessage} style={{ padding: '12px', background: 'transparent', borderTop: '1px solid rgba(255, 255, 255, 0.4)', display: 'flex', gap: '8px' }}>
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Type your message..."
                            style={{ flex: 1, padding: '10px', fontSize: '14px' }}
                        />
                        <button type="submit" className="btn small" disabled={loading} style={{ opacity: loading ? 0.7 : 1 }}>
                            Send
                        </button>
                    </form>
                </div>
            ) : (
                <button
                    className="chat-bubble"
                    onClick={() => setIsOpen(true)}
                    style={{ padding: '16px 24px', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', border: 'none' }}
                >
                    💬 Chat with Nova
                </button>
            )}
        </div>
    );
}