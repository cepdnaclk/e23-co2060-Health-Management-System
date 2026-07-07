import { useState, useEffect, useRef } from "react";
import { API_BASE, readJson } from "../lib/appShared";

export default function SymptomChecker({ token, className = "" }) {
  const initialWelcome = {
    sender: "ai",
    text: "Hello! I am your AI Health Assistant. Please describe the symptoms you are experiencing today, and I will guide you to the right medical specialist."
  };

  const [messages, setMessages] = useState([initialWelcome]);
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const chatEndRef = useRef(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleReset = () => {
    setMessages([initialWelcome]);
    setInputValue("");
    setError("");
  };

  const handleSend = async (e) => {
    e.preventDefault();
    const text = inputValue.trim();
    if (!text || loading) return;

    const userMsg = { sender: "user", text };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInputValue("");
    setLoading(true);
    setError("");

    try {
      const headers = { "Content-Type": "application/json" };
      if (token) headers.Authorization = `Bearer ${token}`;

      const res = await fetch(`${API_BASE}/api/symptom-chat`, {
        method: "POST",
        headers,
        body: JSON.stringify({ messages: updatedMessages })
      });

      const data = await readJson(res);
      if (!res.ok) throw new Error(data.error || "Symptom checker error");

      setMessages((prev) => [
        ...prev,
        {
          sender: "ai",
          text: data.aiResponse,
          doctors: data.recommendedDoctors || null,
          finished: data.finished
        }
      ]);
    } catch (err) {
      setError(err.message || "Failed to contact AI Coach.");
    } finally {
      setLoading(false);
    }
  };

  const isFinished = messages[messages.length - 1]?.finished;

  return (
    <div className={`flex flex-col h-[520px] rounded-3xl border border-sky-100/80 bg-white/70 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/60 overflow-hidden shadow-xl shadow-sky-100/10 ${className}`}>
      {/* Chat Header */}
      <div className="bg-sky-50/50 dark:bg-slate-800/40 px-5 py-3 border-b border-sky-100/50 dark:border-slate-800 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="text-xl">🤖</span>
          <div>
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">AI Wellness Chat Coach</h3>
            <p className="text-[10px] text-slate-500">Conversational symptom triage & doctor recommendation</p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleReset}
          className="text-xs font-semibold text-rose-500 hover:text-rose-600 bg-rose-50 dark:bg-rose-950/20 px-2.5 py-1 rounded-lg transition-all"
          title="Restart Conversation"
        >
          Restart
        </button>
      </div>

      {/* Messages Window */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 flex flex-col scrollbar-thin scrollbar-thumb-sky-200">
        {messages.map((msg, i) => {
          const isUser = msg.sender === "user";
          return (
            <div
              key={i}
              className={`flex flex-col ${isUser ? "items-end" : "items-start"} max-w-[85%] ${
                isUser ? "self-end" : "self-start"
              }`}
            >
              <div
                className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-medium ${
                  isUser
                    ? "bg-sky-500 text-white rounded-tr-none shadow-md shadow-sky-500/15"
                    : "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200 rounded-tl-none"
                }`}
              >
                <p className="whitespace-pre-line leading-relaxed">{msg.text}</p>
              </div>

              {!isUser && msg.doctors?.length ? (
                <div className="mt-3 w-full space-y-2.5">
                  <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider pl-1">
                    Matching Specialists for you:
                  </p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {msg.doctors.map((doctor) => (
                      <div
                        key={doctor.username}
                        className="rounded-xl border border-sky-100/50 bg-white/70 p-3 text-xs text-slate-700 dark:border-slate-800 dark:bg-slate-900/80 shadow-sm"
                      >
                        <p className="font-semibold text-slate-900">Dr. {doctor.fullName}</p>
                        <p className="text-[10px] text-sky-600 font-medium mb-1.5">{doctor.specialty} · {doctor.qualification}</p>
                        <p className="text-[10px] text-slate-500 flex items-center gap-1">
                          📅 {doctor.availableDays?.slice(0, 3).join(", ")}
                        </p>
                        <p className="text-[10px] text-slate-500 flex items-center gap-1">
                          ⏰ {doctor.workingHours}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          );
        })}

        {loading ? (
          <div className="self-start flex items-center gap-1.5 bg-slate-100 text-slate-500 dark:bg-slate-800 px-4 py-2.5 rounded-2xl rounded-tl-none max-w-[80%]">
            <span className="h-1.5 w-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
            <span className="h-1.5 w-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
            <span className="h-1.5 w-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
          </div>
        ) : null}

        {error ? (
          <p className="text-xs text-rose-600 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 rounded-xl p-3 text-center self-stretch">
            ⚠️ {error}
          </p>
        ) : null}

        <div ref={chatEndRef} />
      </div>

      {/* Input area */}
      <form
        onSubmit={handleSend}
        className="p-3 border-t border-sky-100/50 dark:border-slate-800 bg-sky-50/20 dark:bg-slate-900/40 flex items-center gap-2"
      >
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          disabled={loading || isFinished}
          placeholder={
            isFinished
              ? "Triage complete. Reset chat to start a new analysis."
              : "Describe your symptoms, how long you've felt them..."
          }
          className="flex-1 field py-2 px-3 text-xs sm:text-sm bg-white dark:bg-slate-800 disabled:bg-slate-50 disabled:text-slate-400"
          required
        />
        <button
          disabled={loading || isFinished || !inputValue.trim()}
          className="btn-primary px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold h-9 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
          type="submit"
        >
          Send
        </button>
      </form>
    </div>
  );
}
