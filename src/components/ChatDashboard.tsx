import { useState, useEffect, useRef } from "react";
import { MessageSquare, Bot, Users, Send, Sparkles, Compass, UserCheck, Volume2 } from "lucide-react";
import { ChatMessage, OnlineUser } from "../types";

interface ChatDashboardProps {
  nickname: string;
  xp: number;
  onAddXp: (amount: number) => void;
}

export default function ChatDashboard({ nickname, xp, onAddXp }: ChatDashboardProps) {
  const [chatTab, setChatTab] = useState<"ai" | "tribe">("ai");

  // Chat message arrays
  const [aiHistory, setAiHistory] = useState<ChatMessage[]>([]);
  const [tribeHistory, setTribeHistory] = useState<ChatMessage[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);

  // Input states
  const [aiInput, setAiInput] = useState("");
  const [tribeInput, setTribeInput] = useState("");

  const [isAiTyping, setIsAiTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  // SSE Stream Listener for authentic real-time multi-user synchronization
  useEffect(() => {
    // 1. Fetch initial state for online users & tribe chat log
    fetch("/api/online-users")
      .then(res => res.json())
      .then(data => setOnlineUsers(data))
      .catch(err => console.error("Error fetching online users:", err));

    fetch("/api/chat/messages/tribe")
      .then(res => res.json())
      .then(data => setTribeHistory(data))
      .catch(err => console.error("Error fetching tribe messages:", err));

    // Fetch AI messages history from backend for nickname
    if (nickname) {
      fetch(`/api/chat/messages/companion/${nickname}`)
        .then(res => res.json())
        .then(data => {
          if (data.length === 0) {
            // Seed a supportive welcoming message
            setAiHistory([
              {
                id: "ai-seed",
                sender: "AI",
                senderName: "Moonbug Bot",
                text: `Welcome, ${nickname}! I am your supportive Moonbug AI Companion, trained in astronomical alignments and cosmic reflection. Ask me how to coordinate your routines, or request a proactive insight below!`,
                timestamp: new Date().toISOString()
              }
            ]);
          } else {
            setAiHistory(data);
          }
        })
        .catch(err => console.error(err));
    }

    // 2. Open Real-Time Server-Sent Events (SSE) Stream
    const eventSource = new EventSource("/api/stream");

    eventSource.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        const { type, data } = payload;

        if (type === "tribe_message") {
          setTribeHistory(prev => [...prev, data]);
        } else if (type === "users_list") {
          setOnlineUsers(data);
        } else if (type === "user_login") {
          // Display user login notification or just rely on users_list update
        } else if (type === "user_logout") {
          // Display user logout
        }
      } catch (err) {
        console.error("Error parsing SSE payload:", err);
      }
    };

    return () => {
      eventSource.close();
    };
  }, [nickname]);

  // Scroll chat window to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [aiHistory, tribeHistory, isAiTyping]);

  // 1. Post to AI Companion with support triggers
  const handleSendAiMessage = async () => {
    if (!aiInput.trim()) return;
    const text = aiInput.trim();
    setAiInput("");

    // Optimistically update frontend user message
    const tempUserMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      sender: nickname,
      senderName: nickname,
      text,
      timestamp: new Date().toISOString()
    };
    setAiHistory(prev => [...prev, tempUserMsg]);
    setIsAiTyping(true);

    try {
      // Package recent logs as snapshot context for high quality dialogue
      const savedJournals = localStorage.getItem("mb_journals");
      const notesSnapshot = savedJournals ? JSON.parse(savedJournals).slice(0, 2).map((j: any) => j.content).join("\n") : "";

      const response = await fetch("/api/chat/messages/companion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nickname,
          text,
          appMetrics: { xp },
          notesSnapshot
        })
      });

      const data = await response.json();
      if (data.success && data.messages) {
        // Update history with complete list returned from server (user and AI message)
        setAiHistory(prev => {
          // Filter out our temporary optimist message and append verified server messages
          const filtered = prev.filter(m => m.id !== tempUserMsg.id);
          return [...filtered, ...data.messages];
        });
        onAddXp(5);
      }
    } catch (err) {
      console.error("AI Companion error:", err);
    } finally {
      setIsAiTyping(false);
    }
  };

  // 2. Post to Tribe Chat
  const handleSendTribeMessage = async () => {
    if (!tribeInput.trim()) return;
    const text = tribeInput.trim();
    setTribeInput("");

    try {
      await fetch("/api/chat/messages/tribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nickname,
          text
        })
      });
      onAddXp(5);
    } catch (err) {
      console.error(err);
    }
  };

  // 3. Proactive bot triggers based on localized time / metrics / triggers
  const handleRequestProactiveInsight = async (triggerType: "morning" | "night" | "general") => {
    setIsAiTyping(true);
    try {
      const savedJournals = localStorage.getItem("mb_journals");
      const notesSnapshot = savedJournals ? JSON.parse(savedJournals).slice(0, 1).map((j: any) => j.content).join("\n") : "";

      const res = await fetch("/api/chat/proactive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nickname,
          triggerType,
          appMetrics: { xp },
          notesSnapshot
        })
      });

      const data = await res.json();
      if (data.success && data.message) {
        setAiHistory(prev => [...prev, data.message]);
        onAddXp(10);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsAiTyping(false);
    }
  };

  const handleSpeakText = (text: string) => {
    if (!("speechSynthesis" in window)) {
      alert("TTS is not supported in this browser.");
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 p-4 max-w-6xl mx-auto text-slate-200">
      
      {/* Sidebar: Online Users list (active tribe members) */}
      <div className="space-y-4 bg-slate-900/50 p-5 rounded-2xl border border-slate-800 backdrop-blur-md">
        <h3 className="text-xs font-bold font-mono text-yellow-400 tracking-wider uppercase flex items-center gap-2">
          <Users className="w-4 h-4 text-yellow-500" />
          <span>Active Lunar Tribe</span>
        </h3>

        <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
          {onlineUsers.length === 0 ? (
            <span className="text-[10px] text-slate-500 font-mono italic">No other tribe members logged on.</span>
          ) : (
            onlineUsers.map((user) => (
              <div
                key={user.id}
                className="flex items-center gap-2.5 p-2 rounded-xl border border-slate-800/80 bg-slate-950/40 hover:border-slate-700"
              >
                <div className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </div>
                <div>
                  <span className="text-xs font-bold font-mono text-slate-200 block truncate">
                    {user.nickname}
                  </span>
                  <span className="text-[9px] font-mono text-slate-500 block truncate">
                    Phase: {user.activePhase}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Trigger Proactive bot controls inside sidebar */}
        <div className="border-t border-slate-800/80 pt-4 space-y-2.5">
          <h4 className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-yellow-500" />
            <span>AI Proactive Spark</span>
          </h4>
          <p className="text-[9px] text-slate-500 leading-relaxed font-mono">
            Directly command the bot to analyze your profile details and push customized checks.
          </p>
          <div className="flex flex-col gap-1.5">
            <button
              onClick={() => handleRequestProactiveInsight("morning")}
              className="w-full text-center py-1.5 rounded-lg bg-slate-950/80 border border-slate-800 hover:border-yellow-500/50 hover:bg-slate-900 text-[10px] font-bold font-mono text-yellow-400 transition-colors"
            >
              🌅 Morning Support Align
            </button>
            <button
              onClick={() => handleRequestProactiveInsight("night")}
              className="w-full text-center py-1.5 rounded-lg bg-slate-950/80 border border-slate-800 hover:border-yellow-500/50 hover:bg-slate-900 text-[10px] font-bold font-mono text-yellow-400 transition-colors"
            >
              🌌 Late-Night Stargaze Check
            </button>
          </div>
        </div>
      </div>

      {/* Main Chat Workspace */}
      <div className="md:col-span-3 flex flex-col h-[520px] rounded-2xl border border-slate-800 bg-slate-900/50 backdrop-blur-xl">
        
        {/* Tabs selector */}
        <div className="flex border-b border-slate-800 p-2 gap-2 bg-slate-950/30 rounded-t-2xl">
          <button
            onClick={() => setChatTab("ai")}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold font-mono transition-all duration-300 focus:outline-none ${
              chatTab === "ai"
                ? "bg-yellow-500/10 border border-yellow-500/30 text-yellow-300"
                : "text-slate-500 hover:text-slate-300 hover:bg-slate-900/30"
            }`}
          >
            <Bot className="w-4 h-4 text-yellow-500" />
            <span>AI Companion</span>
          </button>
          <button
            onClick={() => setChatTab("tribe")}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold font-mono transition-all duration-300 focus:outline-none ${
              chatTab === "tribe"
                ? "bg-yellow-500/10 border border-yellow-500/30 text-yellow-300"
                : "text-slate-500 hover:text-slate-300 hover:bg-slate-900/30"
            }`}
          >
            <MessageSquare className="w-4 h-4 text-yellow-500" />
            <span>Tribe Chat (SSE Sync)</span>
          </button>
        </div>

        {/* Messages Stream Container */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin">
          {chatTab === "ai" ? (
            aiHistory.map((m) => {
              const isAi = m.sender === "AI";
              return (
                <div
                  key={m.id}
                  className={`flex flex-col max-w-[85%] rounded-2xl p-3 border leading-relaxed text-xs shadow-md ${
                    isAi
                      ? "mr-auto rounded-tl-none border-slate-800/80 bg-slate-950/50 text-slate-200"
                      : "ml-auto rounded-tr-none border-yellow-500/20 bg-yellow-500/10 text-yellow-100"
                  }`}
                >
                  <div className="flex items-center justify-between border-b border-slate-800/40 pb-1 mb-1.5 text-[9px] font-mono font-semibold">
                    <span className={isAi ? "text-yellow-400" : "text-slate-400"}>
                      {isAi ? "🤖 Moonbug Companion" : `👤 ${m.senderName}`}
                    </span>
                    {isAi && m.isProactive && (
                      <span className="text-[8px] uppercase tracking-widest px-1 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30 animate-pulse">
                        Proactive Insight
                      </span>
                    )}
                  </div>
                  <p className="whitespace-pre-line font-sans">{m.text}</p>
                  
                  {isAi && (
                    <div className="flex justify-end mt-1.5 pt-1 border-t border-slate-900">
                      <button
                        onClick={() => handleSpeakText(m.text)}
                        className="p-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-yellow-400 flex items-center gap-1 text-[8px] font-mono transition-colors"
                        title="Read Response Out"
                      >
                        <Volume2 className="w-3 h-3" />
                        <span>Narration</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            tribeHistory.map((m) => {
              const isMe = m.sender.toLowerCase() === nickname.toLowerCase();
              return (
                <div
                  key={m.id}
                  className={`flex flex-col max-w-[85%] rounded-2xl p-3 border leading-relaxed text-xs shadow-md ${
                    !isMe
                      ? "mr-auto rounded-tl-none border-slate-800/85 bg-[#10121e]/50 text-slate-200"
                      : "ml-auto rounded-tr-none border-yellow-500/20 bg-yellow-500/10 text-yellow-100"
                  }`}
                >
                  <div className="flex items-center justify-between border-b border-slate-800/40 pb-1 mb-1.5 text-[9px] font-mono font-semibold">
                    <span className={!isMe ? "text-cyan-400" : "text-yellow-400"}>
                      {m.senderName}
                    </span>
                    <span className="text-[8px] text-slate-500">
                      {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="whitespace-pre-line font-sans">{m.text}</p>
                </div>
              );
            })
          )}

          {isAiTyping && (
            <div className="flex gap-1.5 items-center mr-auto rounded-2xl rounded-tl-none border border-slate-800/80 bg-slate-950/50 p-3 max-w-[150px]">
              <div className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce" />
              <div className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce delay-100" />
              <div className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce delay-200" />
              <span className="text-[10px] font-mono text-slate-400 pl-1">Consulting skies...</span>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input Bar */}
        <div className="p-3 border-t border-slate-800 bg-[#0c0d16]/60 rounded-b-2xl">
          {chatTab === "ai" ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendAiMessage();
              }}
              className="flex gap-2"
            >
              <input
                type="text"
                value={aiInput}
                onChange={(e) => setAiInput(e.target.value)}
                placeholder="Coordinate with AI: Ask about your journal, metrics, alignments..."
                className="flex-1 p-2.5 rounded-xl border border-slate-800 bg-slate-950 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-yellow-500/60"
              />
              <button
                type="submit"
                className="p-2.5 rounded-xl bg-yellow-500 text-slate-950 hover:bg-yellow-400 transition-colors focus:outline-none"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendTribeMessage();
              }}
              className="flex gap-2"
            >
              <input
                type="text"
                value={tribeInput}
                onChange={(e) => setTribeInput(e.target.value)}
                placeholder="Broadcast a real-time message to active tribe members..."
                className="flex-1 p-2.5 rounded-xl border border-slate-800 bg-slate-950 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-yellow-500/60"
              />
              <button
                type="submit"
                className="p-2.5 rounded-xl bg-yellow-500 text-slate-950 hover:bg-yellow-400 transition-colors focus:outline-none"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          )}
        </div>

      </div>

    </div>
  );
}
