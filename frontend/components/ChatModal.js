import { useState } from "react";
import ReactMarkdown from "react-markdown";

export default function ChatModal({ open, onClose }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim()) return;
    setLoading(true);
    setMessages((msgs) => [...msgs, { from: "user", text: input }]);
    try {
      const res = await fetch("http://localhost:8000/chat/advisor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input }),
      });
      if (!res.ok) throw new Error("Backend error");
      const data = await res.json();
      setMessages((msgs) => [...msgs, { from: "bot", text: data.response }]);
    } catch (err) {
      setMessages((msgs) => [...msgs, { from: "bot", text: "Error contacting chatbot." }]);
    }
    setInput("");
    setLoading(false);
  };

  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-4">
        <button className="float-right" onClick={onClose}>✕</button>
        <h2 className="text-lg font-bold mb-2">Ask the Price Advisor</h2>
        <div className="h-64 overflow-y-auto border p-2 mb-2 bg-gray-50">
          {messages.map((msg, i) => (
            <div key={i} className={msg.from === "user" ? "text-right" : "text-left"}>
              {msg.from === "user" ? (
                <span className="text-blue-600">You: {msg.text}</span>
              ) : (
                <span className="text-green-600">
                  Bot: <ReactMarkdown>{msg.text}</ReactMarkdown>
                </span>
              )}
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            className="flex-1 border rounded p-2"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && sendMessage()}
            disabled={loading}
            placeholder="Type your question..."
          />
          <button className="bg-blue-500 text-white px-4 py-2 rounded" onClick={sendMessage} disabled={loading}>
            Send
          </button>
        </div>
      </div>
    </div>
  );
} 