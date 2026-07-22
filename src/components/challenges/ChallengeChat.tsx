import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { Send, MessageCircle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { chatApi } from "@/lib/api";
import type { ChatRoom, ChatMessage } from "@/types";

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function ChallengeChat({ challengeSlug }: { challengeSlug: string }) {
  const { user } = useAuth();
  const [room, setRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!challengeSlug) return;
    chatApi
      .getRoom(challengeSlug)
      .then((data) => setRoom(data.room))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [challengeSlug]);

  useEffect(() => {
    if (!room?.id) return;
    let cancelled = false;
    const load = async () => {
      try {
        const data = await chatApi.getMessages(room.id);
        if (!cancelled) setMessages(data.messages);
      } catch {
        if (!cancelled) setMessages((m) => m);
      }
    };
    load();
    const id = setInterval(load, 3000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [room?.id]);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages]);

  const send = async () => {
    if (!room || !body.trim() || sending) return;
    setSending(true);
    try {
      const data = await chatApi.postMessage(room.id, body.trim());
      setMessages((m) => [...m, data.message]);
      setBody("");
      inputRef.current?.focus();
    } catch {
      setMessages((m) => m);
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="glass rounded-3xl p-6 text-center text-moon-dim">
        summoning the circle…
      </div>
    );
  }

  if (!room) {
    return (
      <div className="glass rounded-3xl p-6 text-center text-moon-dim">
        chat unavailable for this challenge
      </div>
    );
  }

  return (
    <div className="glass-strong flex max-h-[520px] flex-col overflow-hidden rounded-3xl border border-violet-glow/15">
      <div className="flex items-center gap-2 border-b border-violet-glow/10 px-5 py-4">
        <MessageCircle className="h-5 w-5 text-violet-glow" />
        <h3 className="font-display text-lg font-semibold text-moon">Live Chat</h3>
      </div>

      <div
        ref={listRef}
        className="flex-1 space-y-4 overflow-y-auto px-5 py-4"
      >
        {messages.length === 0 && (
          <p className="py-8 text-center text-sm text-moon-dim">
            no messages yet — start the conversation
          </p>
        )}
        {messages.map((msg, i) => {
          const isMe = msg.userId === user?.id;
          return (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i === messages.length - 1 ? 0.05 : 0 }}
              className={`flex ${isMe ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
                  isMe
                    ? "rounded-br-sm bg-gradient-to-br from-violet-glow/25 to-indigo-glow/15 text-moon"
                    : "rounded-bl-sm border border-violet-glow/15 bg-white/[0.03] text-moon"
                }`}
              >
                <div className="flex items-baseline gap-2">
                  <span className="text-xs font-medium text-violet-glow">
                    {msg.userName}
                  </span>
                  <span className="text-[11px] text-moon-dim">
                    {formatTime(msg.createdAt)}
                  </span>
                </div>
                <p className="mt-1 text-sm leading-relaxed">{msg.body}</p>
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="border-t border-violet-glow/10 px-4 py-3">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send();
          }}
          className="flex items-center gap-2"
        >
          <input
            ref={inputRef}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="send a message…"
            className="h-10 flex-1 rounded-full border border-violet-glow/15 bg-obsidian-soft/60 px-4 text-sm text-moon placeholder:text-moon-dim/60 outline-none focus:border-violet-glow/40 focus:ring-1 focus:ring-violet-glow/40"
          />
          <button
            type="submit"
            disabled={!body.trim() || sending}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gradient-to-r from-violet-glow to-indigo-glow text-white shadow-lg shadow-indigo-glow/30 transition hover:brightness-110 disabled:opacity-40"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );
}