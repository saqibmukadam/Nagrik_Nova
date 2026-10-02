import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, X, Send, LoaderCircle, MessageSquare } from 'lucide-react';
import { api } from './main'; // Imports your axios instance from main.jsx

export default function AIChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'ai', text: 'Hi! I am Nova, your civic AI assistant. How can I help you today?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Detect scroll position to shrink the button
  useEffect(() => {
    const handleScroll = () => {
      // If scrolled more than 50px down, shrink the button
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) scrollToBottom();
  }, [messages, isOpen]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg = input.trim();
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setInput('');
    setLoading(true);

    try {
      const res = await api.post('/chat', { message: userMsg }).catch(() => null);
      const reply = res?.data?.reply || "I am Nova, the civic AI. My active chat module is currently offline. Please try again later!";
      setMessages(prev => [...prev, { role: 'ai', text: reply }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'ai', text: 'Sorry, I am having trouble connecting right now.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="chat-widget-container">
      {!isOpen && (
        <button 
          className={`chat-widget-toggle ${isScrolled ? 'scrolled' : ''}`}
          onClick={() => setIsOpen(true)}
        >
          <div className="toggle-icon-wrapper">
            <MessageSquare size={20} className="message-icon" />
          </div>
          <span className="chat-text">Chat with Nova</span>
        </button>
      )}

      {isOpen && (
        <div className="chat-window">
          <div className="chat-header">
            <div className="chat-header-title">
              <Sparkles size={18} />
              <strong>Nova AI</strong>
            </div>
            <button className="close-btn" onClick={() => setIsOpen(false)}>
              <X size={18} />
            </button>
          </div>

          <div className="chat-body">
            {messages.map((m, i) => (
              <div key={i} className={`chat-bubble ${m.role}`}>
                {m.text}
              </div>
            ))}
            {loading && (
              <div className="chat-bubble ai loading-bubble">
                <LoaderCircle size={16} className="spin" /> <span>Thinking...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form className="chat-footer" onSubmit={sendMessage}>
            <input 
              type="text" 
              placeholder="Ask Nova anything..." 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
            />
            <button type="submit" disabled={!input.trim() || loading}>
              <Send size={16} />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}