import React, { useState } from "react";
import { Mic, Volume2, CheckCircle2, Globe2 } from "lucide-react";

export default function VoiceInput({ data, setData }) {
  const questions = {
    en: [
      { field: "title", question: "What is the title of the problem?" },
      { field: "description", question: "What is happening? Please describe the problem." },
      { field: "state", question: "Which state is this problem in?" },
      { field: "city", question: "Which city is this problem in?" },
      { field: "street", question: "What is the exact street, landmark, or location?" }
    ],
    hi: [
      { field: "title", question: "समस्या का शीर्षक क्या है?" },
      { field: "description", question: "क्या समस्या हो रही है? कृपया उसके बारे में बताइए।" },
      { field: "state", question: "यह समस्या किस राज्य में है?" },
      { field: "city", question: "यह समस्या किस शहर में है?" },
      { field: "street", question: "सटीक सड़क, लैंडमार्क या स्थान क्या है?" }
    ]
  };

  const [language, setLanguage] = useState("en");
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [started, setStarted] = useState(false);
  const [listening, setListening] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [heardText, setHeardText] = useState("");

  const currentQuestions = questions[language];

  const speak = (text) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const speech = new SpeechSynthesisUtterance(text);
    speech.lang = language === "hi" ? "hi-IN" : "en-IN";
    window.speechSynthesis.speak(speech);
  };

  const listen = () => {
    // Robust browser support check
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser. Please type your report manually.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = language === "hi" ? "hi-IN" : "en-IN";
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setHeardText(transcript);

      const field = currentQuestions[currentQuestion].field;
      
      // Update parent component state
      setData((previous) => ({
        ...previous,
        [field]: transcript,
      }));

      setListening(false);

      if (currentQuestion < currentQuestions.length - 1) {
        const nextQuestion = currentQuestion + 1;
        setCurrentQuestion(nextQuestion);
        setHeardText("");
        speak(currentQuestions[nextQuestion].question);
      } else {
        setCompleted(true);
        speak(language === "hi" ? "धन्यवाद। आपकी शिकायत की जानकारी पूरी हो गई है।" : "Thank you. Your complaint information is complete.");
      }
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
      setListening(false);
      const errorMsg = language === "hi" 
        ? "आवाज़ पहचानने में समस्या हुई। कृपया फिर से कोशिश करें।" 
        : "Speech recognition failed. Please try again.";
      alert(errorMsg);
    };

    recognition.onend = () => {
      setListening(false);
    };

    setListening(true);
    try {
      recognition.start();
    } catch (err) {
      console.error("Microphone already active:", err);
    }
  };

  const startConversation = () => {
    setStarted(true);
    setCurrentQuestion(0);
    setHeardText("");
    speak(currentQuestions[0].question);
  };

  return (
    <div style={{
      padding: "20px", background: "rgba(10, 10, 10, 0.4)", border: "1px solid rgba(255, 255, 255, 0.1)",
      borderRadius: "12px", marginBottom: "24px", color: "white"
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
        <Mic color="#10b981" size={24} />
        <h3 style={{ margin: 0, fontSize: "18px" }}>Voice Accessibility Assistant</h3>
      </div>

      {!started && (
        <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
          {/* THE FIX: High Contrast Subtitle */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px", margin: "10px 0" }}>
            <Globe2 size={16} color="#e2e8f0" />
            <span style={{ color: "#e2e8f0", fontSize: "14px", fontWeight: "600" }}>Select Language / भाषा चुनें</span>
          </div>
          
          <div style={{ display: "flex", gap: "10px" }}>
            {/* THE FIX: High Contrast Active State for English */}
            <button
              type="button"
              onClick={() => setLanguage("en")}
              style={{
                flex: 1,
                padding: "10px 16px",
                borderRadius: "8px",
                fontWeight: "700",
                fontSize: "15px",
                cursor: "pointer",
                transition: "all 0.2s ease",
                background: language === "en" ? "#10b981" : "rgba(255, 255, 255, 0.08)",
                color: "#ffffff",
                border: language === "en" ? "1px solid #10b981" : "1px solid rgba(255, 255, 255, 0.2)",
                boxShadow: language === "en" ? "0 4px 12px rgba(16, 185, 129, 0.3)" : "none"
              }}
            >
              English
            </button>

            {/* THE FIX: High Contrast Active State for Hindi */}
            <button
              type="button"
              onClick={() => setLanguage("hi")}
              style={{
                flex: 1,
                padding: "10px 16px",
                borderRadius: "8px",
                fontWeight: "700",
                fontSize: "15px",
                cursor: "pointer",
                transition: "all 0.2s ease",
                background: language === "hi" ? "#10b981" : "rgba(255, 255, 255, 0.08)",
                color: "#ffffff",
                border: language === "hi" ? "1px solid #10b981" : "1px solid rgba(255, 255, 255, 0.2)",
                boxShadow: language === "hi" ? "0 4px 12px rgba(16, 185, 129, 0.3)" : "none"
              }}
            >
              हिंदी
            </button>
          </div>

          <button
            type="button"
            onClick={startConversation}
            style={{ padding: "14px", background: "#10b981", color: "white", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer", display: "flex", justifyContent: "center", alignItems: "center", gap: "8px" }}
          >
            <Volume2 size={18} /> {language === "hi" ? "वॉइस रिपोर्ट शुरू करें" : "Start Voice Report"}
          </button>
        </div>
      )}

      {started && !completed && (
        <div style={{ display: "flex", flexDirection: "column", gap: "15px", padding: "15px", background: "rgba(0,0,0,0.3)", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.05)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ color: "#10b981", fontSize: "12px", fontWeight: "bold", textTransform: "uppercase", letterSpacing: "1px" }}>
              {language === "hi" ? `प्रश्न ${currentQuestion + 1} / ${currentQuestions.length}` : `Question ${currentQuestion + 1} of ${currentQuestions.length}`}
            </span>
          </div>

          <p style={{ margin: 0, fontSize: "16px", lineHeight: "1.4" }}>
            {currentQuestions[currentQuestion].question}
          </p>

          {heardText && (
            <div style={{ padding: "10px", background: "rgba(255,255,255,0.05)", borderRadius: "6px", fontSize: "14px", color: "#e2e8f0", fontStyle: "italic" }}>
              <strong>{language === "hi" ? "मैंने सुना:" : "I heard:"}</strong> "{heardText}"
            </div>
          )}

          <button
            type="button"
            onClick={listen}
            disabled={listening}
            style={{ padding: "12px", background: listening ? "#ef4444" : "#1e293b", color: "white", border: listening ? "none" : "1px solid rgba(255,255,255,0.2)", borderRadius: "8px", cursor: "pointer", display: "flex", justifyContent: "center", alignItems: "center", gap: "8px" }}
          >
            <Mic size={16} className={listening ? "animate-pulse" : ""} />
            {listening ? (language === "hi" ? "सुन रहा हूँ..." : "Listening...") : (language === "hi" ? "अपना जवाब बोलें" : "Tap to Speak")}
          </button>
        </div>
      )}

      {completed && (
        <div style={{ padding: "15px", background: "rgba(16, 185, 129, 0.1)", border: "1px solid #10b981", borderRadius: "8px", display: "flex", alignItems: "center", gap: "10px", color: "#10b981" }}>
          <CheckCircle2 size={20} />
          <span style={{ fontWeight: "bold" }}>
            {language === "hi" ? "शिकायत की जानकारी पूरी हो गई है।" : "Complaint information successfully collected."}
          </span>
        </div>
      )}
    </div>
  );
}