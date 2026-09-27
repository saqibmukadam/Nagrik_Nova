import React, { useState, useRef, useEffect } from "react";
import { MessageSquare, Send, X, Bot, User, Loader2 } from "lucide-react";
import axios from "axios";

// Using the verified Vercel environment variable routing
const api = axios.create({ 
  baseURL: import.meta.env.VITE_API_URL || 'https://nagrik-nova.onrender.com/api' 
});

export default function AIChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Hello! I am your Nagrik Nova AI assistant. How can I help you report or understand civic issues today?" }
  ]);
  
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      // Routing through our fixed backend endpoint
      const response = await api.post("/ai/chat", { message: userMessage.content });
      setMessages((prev) => [
        ...prev, 
        { role: "assistant", content: response.data.reply || response.data.message || "Message received." }
      ]);
    } catch (error) {
      console.error("AI Chat Error:", error);
      setMessages((prev) => [
        ...prev, 
        { role: "assistant", content: "I'm having trouble connecting to the civic intelligence servers right now. Please try again later." }
      ]);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        style={{
          position: "fixed", bottom: "20px", right: "20px",
          background: "#10b981", color: "white", border: "none",
          borderRadius: "50%", padding: "16px", cursor: "pointer",
          boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)", zIndex: 9999
        }}
      >
        <MessageSquare size={24} />
      </button>
    );
  }

  return (
    <div style={{
      position: "fixed", bottom: "20px", right: "20px", width: "350px", height: "500px",
      background: "#1e293b", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.1)",
      display: "flex", flexDirection: "column", boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
      zIndex: 9999, overflow: "hidden"
    }}>
      {/* Header */}
      <div style={{ background: "#0f172a", padding: "16px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: "bold" }}>
          <Bot size={20} color="#10b981" /> Nova AI
        </div>
        <button onClick={() => setIsOpen(false)} style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer" }}>
          <X size={20} />
        </button>
      </div>

      {/* Chat History */}
      <div style={{ flex: 1, padding: "16px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "12px" }}>
        {messages.map((msg, idx) => (
          <div key={idx} style={{
            alignSelf: msg.role === "user" ? "flex-end" : "flex-start",
            background: msg.role === "user" ? "#10b981" : "rgba(255,255,255,0.05)",
            padding: "10px 14px", borderRadius: "8px", maxWidth: "80%",
            color: msg.role === "user" ? "white" : "#e2e8f0", fontSize: "14px", lineHeight: "1.5"
          }}>
            {msg.content}
          </div>
        ))}
        {loading && (
          <div style={{ alignSelf: "flex-start", padding: "10px", color: "#94a3b8" }}>
            <Loader2 size={16} className="animate-spin" />
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <form onSubmit={handleSend} style={{ padding: "16px", borderTop: "1px solid rgba(255,255,255,0.1)", display: "flex", gap: "8px", background: "#0f172a" }}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about local infrastructure..."
          style={{ flex: 1, padding: "10px", borderRadius: "6px", border: "1px solid rgba(255,255,255,0.1)", background: "rgba(0,0,0,0.2)", color: "white" }}
          disabled={loading}
        />
        <button type="submit" disabled={loading || !input.trim()} style={{ background: "#10b981", color: "white", border: "none", borderRadius: "6px", padding: "10px", cursor: "pointer", display: "flex", alignItems: "center" }}>
          <Send size={18} />
        </button>
      </form>
    </div>
  );
}