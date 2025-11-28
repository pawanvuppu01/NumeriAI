
import React, { useState } from "react";
import { fetchAnswer } from "./api";

export default function App() {
  const [prompt, setPrompt] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    setLoading(true);
    setAnswer("");
    try {
      const res = await fetchAnswer(prompt);
      setAnswer(res.answer);
    } catch (e) {
      setAnswer("Error: " + e.message);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded shadow w-full max-w-md">
        <h1 className="text-2xl font-bold mb-4 text-center">NumeriAI</h1>
        <input
          className="w-full border p-2 rounded mb-4"
          type="text"
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          placeholder="Enter a math question (e.g. 2+3)"
        />
        <button
          className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600"
          onClick={handleSend}
          disabled={loading || !prompt}
        >
          {loading ? "Thinking..." : "Send"}
        </button>
        <div className="mt-6 text-lg text-center min-h-[2em]">
          {answer}
        </div>
      </div>
    </div>
  );
}
