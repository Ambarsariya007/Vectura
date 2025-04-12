import { useState, useEffect, useRef } from "react";
import { Send, Bot } from "lucide-react";
import "./AiBot.css"; // CSS file for styling

const AiBot = () => {
  const [messages, setMessages] = useState([]);
  const [userInput, setUserInput] = useState("");
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userResponses, setUserResponses] = useState({});
  const chatEndRef = useRef(null);

  const questions = [
    "👋 Hi there! I'm Ventura, your personal debt assistant. Let's work together to understand your current financial situation and guide you toward smarter debt management. This will only take a few minutes!",
    "📌 Section 1: Personal Information\n\n⿡ What is your full name or what should I call you?",
    "⿢ How old are you?",
    "⿣ Which country do you currently live in?",
    "⿤ What currency are your loans and income based in? (e.g., USD, INR, EUR)",
    "💼 Section 2: Employment & Income\n\n⿥ What best describes your employment status? (Salaried, Self-employed, Freelancer, Student, Unemployed)",
    "⿦ Which industry do you work in? (Optional but helpful)",
    "⿧ What is your monthly income? (Exact amount if fixed, or range like ₹50,000–₹90,000)",
    "🧾 Section 3: Expenses & Assets\n\n⿨ What is your average total monthly expense? (Include rent, groceries, utilities, medical bills, etc.)",
    "⿩ Do you own any significant assets or savings? If yes, please estimate their total value.",
    "💳 Section 4: Debt Details\n\n🔟 How many loans do you currently have? (List each like: One loan of ₹X, EMI over Y months at Z% interest per annum)",
    "⿡⿡ Do you miss payments often? If yes, estimate the frequency annually (e.g., 0.10 = 10%)",
    "📉 Section 5: Risk & Emotional Insight\n\n⿡⿢ On a scale from 1 to 5, how do you feel about your current debt situation? (1 = Very anxious, 5 = Very confident)",
    "🧠 Thank you! I’ll now analyze your inputs and calculate your personalized debt risk score. Hang tight!"

  ];

  useEffect(() => {
    if (messages.length === 0) {
      setMessages([{ sender: "bot", text: questions[0] }]);
    }
  }, [messages]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleUserInput = () => {
    if (!userInput.trim()) return;

    const updatedMessages = [
      ...messages,
      { sender: "user", text: userInput },
    ];
    setMessages(updatedMessages);

    setUserResponses((prev) => ({
      ...prev,
      [currentQuestionIndex]: userInput,
    }));

    setUserInput("");

    setTimeout(() => {
      const nextQuestion = questions[currentQuestionIndex + 1];
      if (nextQuestion) {
        setMessages((prevMessages) => [
          ...prevMessages,
          { sender: "bot", text: nextQuestion },
        ]);
      }

      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }, 500);
  };

  const handleGenerateReport = async () => {
    try {
      // First save the consultation
      const saveResponse = await fetch("http://127.0.0.1:8000/save_consultation/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          responses: userResponses,
          mlResult: "Not Available",
        }),
      });

      const saveResult = await saveResponse.json();

      if (!saveResponse.ok) {
        throw new Error(saveResult.error || "Failed to save report");
      }

      // Then download the PDF directly
      const pdfResponse = await fetch(`http://127.0.0.1:8000/generate_pdf/${saveResult.report_id}/`, {
        credentials: "include",
      });

      if (!pdfResponse.ok) {
        throw new Error("Failed to generate PDF");
      }

      // Convert the PDF to a blob
      const pdfBlob = await pdfResponse.blob();

      // Create a download link
      const url = window.URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `debt_consultation_report_${saveResult.report_id}.pdf`;
      document.body.appendChild(a);
      a.click();

      // Clean up
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

    } catch (error) {
      console.error("Error:", error);
      alert(error.message || "Error generating report");
    }
  };

  return (
    <div className="ai-chat-container">
      <div className="chat-header">
        <Bot size={24} />
        <span>Ventura Debt Assistant</span>
      </div>
      <div className="chat-messages">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`message ${message.sender === "bot" ? "bot" : "user"}`}
          >
            {message.text}
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>

      {currentQuestionIndex >= questions.length ? (
        <div className="chat-footer">
          <button className="submit-btn" onClick={handleGenerateReport}>
            Generate Report
          </button>
        </div>
      ) : (
        <div className="chat-footer">
          <input
            type="text"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            placeholder={questions[currentQuestionIndex]}
            className="chat-input"
          />
          <button className="send-btn" onClick={handleUserInput}>
            <Send size={18} />
          </button>
        </div>
      )}
    </div>
  );
};

export default AiBot;
