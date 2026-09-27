import React, { useState, useRef } from "react";
import { Camera, LoaderCircle, CheckCircle2 } from "lucide-react";
import { api } from "./main.jsx";

export default function IssueScanner({ data, setData }) {
  const [scanning, setScanning] = useState(false);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef(null);

  const handleCapture = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setScanning(true);
    setSuccess(false);

    const formData = new FormData();
    formData.append("image", file);

    try {
      // Routing the image to your Render backend's Gemini Vision endpoint
      const response = await api.post("/ai/scan", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      // Inject the AI-generated title and description directly into the Dashboard form state
      setData({
        ...data,
        title: response.data.title || data.title,
        description: response.data.description || data.description,
      });
      
      setSuccess(true);
      setTimeout(() => setSuccess(false), 4000);
    } catch (error) {
      console.error("Gemini Vision API Error:", error);
      alert("The AI couldn't analyze the image clearly. Please enter the details manually.");
    } finally {
      setScanning(false);
      if (fileInputRef.current) fileInputRef.current.value = ""; // Reset input
    }
  };

  return (
    <div style={{ marginBottom: "20px" }}>
      {/* Hidden file input that triggers the mobile camera */}
      <input
        type="file"
        accept="image/*"
        capture="environment"
        ref={fileInputRef}
        onChange={handleCapture}
        style={{ display: "none" }}
      />
      
      <button
        type="button"
        disabled={scanning}
        onClick={() => fileInputRef.current?.click()}
        style={{ 
          width: "100%", padding: "14px", display: "flex", 
          justifyContent: "center", alignItems: "center", gap: "10px",
          background: scanning ? "#1e293b" : "rgba(16, 185, 129, 0.1)",
          border: "1px solid #10b981", color: "#10b981", borderRadius: "8px",
          fontWeight: "bold", cursor: scanning ? "not-allowed" : "pointer",
          fontSize: "15px"
        }}
      >
        {scanning ? (
          <><LoaderCircle size={18} className="spin" /> Analyzing with Gemini Vision...</>
        ) : success ? (
          <><CheckCircle2 size={18} /> Issue Auto-Filled!</>
        ) : (
          <><Camera size={18} /> Smart Scan with Camera</>
        )}
      </button>
    </div>
  );
}