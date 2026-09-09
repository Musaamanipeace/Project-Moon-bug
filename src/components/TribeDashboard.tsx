import React, { useState, useEffect, useRef } from "react";
import {
  Users,
  MessageSquare,
  UserPlus,
  Send,
  Sparkles,
  Check,
  X,
  Compass,
  ArrowRight,
  Circle,
  Clock,
  ShieldCheck,
} from "lucide-react";
import { motion } from "motion/react";
import { api, PublicUser, ChatMessageItem } from "../lib/api";

interface TribeMember {
  id: string;
  nickname: string;
  avatarEmoji: string;
  bio?: string;
  isOnline?: boolean;
  activeChallenge?: string;
}

interface TribeDashboardProps {
  nickname: string;
  onNavigateToView?: (view: string) => void;
}

export default function TribeDashboard({ nickname, onNavigateToView }: TribeDashboardProps) {
  const [activeTab, setActiveTab] = useState<"chat" | "explore">("chat");

  // Mutual Tribe Members (symmetric, no hierarchy/ranking)
  const [members, setMembers] = useState<TribeMember[]>(() => {
    try {
      const raw = localStorage.getItem("moonrise_tribe_members");
      if (raw) return JSON.parse(raw);
    } catch {}
    return [
      {
        id: "nebula-rae",
        nickname: "NebulaRae",
        avatarEmoji: "🌌",
        bio: "Night-sky observer & astrophotographer",
        isOnline: true,
        activeChallenge: "Sky Watcher",
      },
      {
        id: "orbit-kai",
        nickname: "OrbitKai",
        avatarEmoji: "🚀",
        bio: "Circadian rhythm enthusiast",
        isOnline: true,
        activeChallenge: "Moon Observer Live",
      },
    ];
  });

  // Pending Incoming Invites
  const [incomingInvites, setIncomingInvites] = useState<{ id: string; nickname: string; avatarEmoji: string; bio: string }[]>(() => {
    try {
      const raw = localStorage.getItem("moonrise_tribe_invites_in");
      if (raw) return JSON.parse(raw);
    } catch {}
    return [
      {
        id: "calm-sol",
        nickname: "CalmSol",
        avatarEmoji: "🌞",
        bio: "Daily mindfulness practitioner",
      },
    ];
  });

  // Outgoing Sent Invites
  const [outgoingInvites, setOutgoingInvites] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem("moonrise_tribe_invites_out");
      if (raw) return JSON.parse(raw);
    } catch {}
    return [];
  });

  // Active chat context: null means Tribe Group Chat, or string member nickname for 1:1 DM
  const [dmTarget, setDmTarget] = useState<TribeMember | null>(null);

  // Chat messages
  const [groupMessages, setGroupMessages] = useState<ChatMessageItem[]>([]);
  const [dmMessages, setDmMessages] = useState<ChatMessageItem[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Explore / Matchmaking
  const [exploreUsers, setExploreUsers] = useState<PublicUser[]>([]);
  const [selectedInterests, setSelectedInterests] = useState<string[]>(["Astronomy", "Mindfulness"]);
  const [loadingExplore, setLoadingExplore] = useState(false);

  // Persist members & invites
  useEffect(() => {
    localStorage.setItem("moonrise_tribe_members", JSON.stringify(members));
  }, [members]);

  useEffect(() => {
    localStorage.setItem("moonrise_tribe_invites_in", JSON.stringify(incomingInvites));
  }, [incomingInvites]);

  useEffect(() => {
    localStorage.setItem("moonrise_tribe_invites_out", JSON.stringify(outgoingInvites));
  }, [outgoingInvites]);

  // Load Group Chat messages
  useEffect(() => {
    api.tribeMessages()
      .then((msgs) => setGroupMessages(msgs))
      .catch((err) => console.warn("Could not load tribe messages:", err));
  }, []);

  // Load 1:1 messages if active
  useEffect(() => {
    if (dmTarget) {
      api.companionMessages(dmTarget.nickname, nickname)
        .then((msgs) => setDmMessages(msgs))
        .catch(() => setDmMessages([]));
    }
  }, [dmTarget, nickname]);

  // Real-time SSE listener
  useEffect(() => {
    const es = new EventSource("/api/stream");
    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "tribe_message") {
          setGroupMessages((prev) => [...prev, data.payload]);
        } else if (data.type === "companion_message") {
          if (dmTarget && (data.payload.key.includes(dmTarget.nickname.toLowerCase()))) {
            setDmMessages((prev) => [...prev, data.payload.message]);
          }
        }
      } catch (e) {}
    };
    return () => es.close();
  }, [dmTarget]);

  // Scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [groupMessages, dmMessages]);

  // Load Matchmaking recommendations
  const fetchExploreUsers = async () => {
    setLoadingExplore(true);
    try {
      const results = await api.matchmaking({
        nickname: nickname || "Stargazer",
        interests: selectedInterests,
        brandLinks: [],
      });
      setExploreUsers(results);
    } catch (err) {
      console.warn("Failed to load matchmaking:", err);
    } finally {
      setLoadingExplore(false);
    }
  };

  useEffect(() => {
    if (activeTab === "explore") {
      fetchExploreUsers();
    }
  }, [activeTab, selectedInterests]);

  // Send message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isSending) return;
    setIsSending(true);

    try {
      if (!dmTarget) {
        // Tribe Group Message
        const sent = await api.postTribeMessage({
          nickname: nickname || "Stargazer",
          text: chatInput.trim(),
        });
        setGroupMessages((prev) => [...prev, sent]);
      } else {
        // Direct 1:1 message
        const sent = await api.postCompanionMessage(dmTarget.nickname, {
          sender: nickname || "Stargazer",
          text: chatInput.trim(),
        });
        setDmMessages((prev) => [...prev, sent]);
      }
      setChatInput("");
    } catch (err) {
      console.warn("Failed to send message:", err);
    } finally {
      setIsSending(false);
    }
  };

  // Accept incoming invite -> mutual tribe membership!
  const acceptInvite = (inv: { id: string; nickname: string; avatarEmoji: string; bio: string }) => {
    setIncomingInvites((prev) => prev.filter((i) => i.id !== inv.id));
    setMembers((prev) => [
      ...prev,
      {
        id: inv.id,
        nickname: inv.nickname,
        avatarEmoji: inv.avatarEmoji,
        bio: inv.bio,
        isOnline: true,
      },
    ]);
  };

  const declineInvite = (invId: string) => {
    setIncomingInvites((prev) => prev.filter((i) => i.id !== invId));
  };

  // Send outgoing invite
  const sendInvite = (user: PublicUser) => {
    if (outgoingInvites.includes(user.nickname)) return;
    setOutgoingInvites((prev) => [...prev, user.nickname]);
  };

  const cancelOutgoingInvite = (name: string) => {
    setOutgoingInvites((prev) => prev.filter((n) => n !== name));
  };

  const activeMessages = dmTarget ? dmMessages : groupMessages;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6 text-slate-100">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-bold font-mono text-slate-100 flex items-center gap-2">
            <Users className="w-5 h-5 text-turquoise" />
            Mutual Tribe Collaboration
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Symmetric, invitation-based connections without leaderboards, rankings, or hierarchies.
          </p>
        </div>

        {/* Sub-tabs */}
        <div className="flex items-center gap-2 bg-slate-900/60 p-1 rounded-xl border border-slate-800 font-mono text-xs">
          <button
            onClick={() => setActiveTab("chat")}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              activeTab === "chat"
                ? "bg-turquoise-500 text-slate-950 font-bold shadow-md"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Roster &amp; Chat
          </button>
          <button
            onClick={() => setActiveTab("explore")}
            className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
              activeTab === "explore"
                ? "bg-turquoise-500 text-slate-950 font-bold shadow-md"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            Find Members
          </button>
        </div>
      </div>

      {activeTab === "chat" ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* ROSTER & INVITES COLUMN (4 cols) */}
          <div className="lg:col-span-4 space-y-6">
            {/* Mutual Members Roster */}
            <div className="rounded-2xl border border-slate-800 bg-[#0c0d16]/80 backdrop-blur-md p-4 shadow-lg space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
                  Tribe Roster ({members.length})
                </h3>
                <button
                  onClick={() => setDmTarget(null)}
                  className={`text-[11px] font-mono px-2.5 py-1 rounded-lg border transition-colors ${
                    dmTarget === null
                      ? "bg-turquoise-500/15 border-turquoise-500/40 text-turquoise"
                      : "border-slate-800 text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Group Room
                </button>
              </div>

              <div className="space-y-2">
                {members.map((member) => {
                  const isSelected = dmTarget?.id === member.id;
                  return (
                    <div
                      key={member.id}
                      onClick={() => setDmTarget(member)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? "bg-turquoise-500/10 border-turquoise-500/40 shadow-sm"
                          : "bg-slate-900/40 border-slate-800 hover:border-slate-700"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="relative w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-sm">
                          {member.avatarEmoji}
                          <span
                            className={`absolute bottom-0 right-0 w-2 h-2 rounded-full border border-slate-900 ${
                              member.isOnline ? "bg-emerald-400" : "bg-slate-500"
                            }`}
                          />
                        </div>
                        <div>
                          <span className="font-mono text-xs font-bold text-slate-200 block">
                            {member.nickname}
                          </span>
                          <span className="text-[10px] text-slate-400 font-sans block truncate max-w-[140px]">
                            {member.activeChallenge || member.bio || "Mutual Member"}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <MessageSquare
                          className={`w-3.5 h-3.5 ${
                            isSelected ? "text-turquoise" : "text-slate-500"
                          }`}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Pending Invites Section (§5) */}
            <div className="rounded-2xl border border-slate-800 bg-[#0c0d16]/80 backdrop-blur-md p-4 shadow-lg space-y-4">
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
                Pending Invites
              </h3>

              {/* Incoming */}
              <div className="space-y-2">
                <span className="text-[10px] font-mono text-slate-400 uppercase block tracking-wider">
                  Incoming ({incomingInvites.length})
                </span>
                {incomingInvites.length === 0 ? (
                  <p className="text-[11px] text-slate-500 font-mono">No pending invitations.</p>
                ) : (
                  incomingInvites.map((inv) => (
                    <div
                      key={inv.id}
                      className="p-3 rounded-xl border border-slate-800 bg-slate-900/60 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{inv.avatarEmoji}</span>
                          <div>
                            <span className="font-mono text-xs font-bold text-slate-200">
                              {inv.nickname}
                            </span>
                            <span className="text-[10px] text-slate-400 block">{inv.bio}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 pt-1">
                        <button
                          onClick={() => acceptInvite(inv)}
                          className="flex-1 py-1.5 rounded-lg bg-turquoise-500 hover:bg-turquoise-400 text-slate-950 font-mono text-[11px] font-bold uppercase flex items-center justify-center gap-1 transition-colors"
                        >
                          <Check className="w-3.5 h-3.5" /> Accept
                        </button>
                        <button
                          onClick={() => declineInvite(inv.id)}
                          className="px-3 py-1.5 rounded-lg border border-slate-700 hover:bg-slate-800 text-slate-400 font-mono text-[11px] transition-colors"
                        >
                          Decline
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Outgoing */}
              {outgoingInvites.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-slate-800/80">
                  <span className="text-[10px] font-mono text-slate-400 uppercase block tracking-wider">
                    Sent ({outgoingInvites.length})
                  </span>
                  {outgoingInvites.map((name) => (
                    <div
                      key={name}
                      className="p-2.5 rounded-xl border border-slate-800 bg-slate-900/30 flex items-center justify-between"
                    >
                      <span className="text-xs font-mono text-slate-300">{name}</span>
                      <button
                        onClick={() => cancelOutgoingInvite(name)}
                        className="text-[10px] font-mono text-rose-400 hover:text-rose-300"
                      >
                        Cancel
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* CHAT PANEL COLUMN (8 cols) */}
          <div className="lg:col-span-8 flex flex-col h-[650px] rounded-2xl border border-slate-800 bg-[#0c0d16]/90 backdrop-blur-md shadow-xl overflow-hidden">
            {/* Chat header */}
            <div className="px-5 py-4 border-b border-slate-800/80 bg-slate-950/60 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-turquoise-500/10 border border-turquoise-500/30 flex items-center justify-center text-turquoise text-sm">
                  {dmTarget ? dmTarget.avatarEmoji : <Users className="w-4 h-4" />}
                </div>
                <div>
                  <h3 className="font-mono font-bold text-xs sm:text-sm text-slate-100">
                    {dmTarget ? `Direct: ${dmTarget.nickname}` : "Tribe Group Transmission"}
                  </h3>
                  <p className="text-[10px] text-slate-400 font-mono">
                    {dmTarget
                      ? dmTarget.isOnline
                        ? "Active online"
                        : "Offline"
                      : `${members.length} mutual members synchronized`}
                  </p>
                </div>
              </div>

              {dmTarget && (
                <button
                  onClick={() => setDmTarget(null)}
                  className="text-xs font-mono text-turquoise hover:underline"
                >
                  Return to Group
                </button>
              )}
            </div>

            {/* Message stream */}
            <div className="flex-1 p-5 overflow-y-auto space-y-3.5">
              {activeMessages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-2 text-slate-500">
                  <MessageSquare className="w-8 h-8 text-slate-600" />
                  <p className="font-mono text-xs">
                    {dmTarget
                      ? `Start your direct 1:1 conversation with ${dmTarget.nickname}.`
                      : "No messages yet in the tribe group. Send the first greeting!"}
                  </p>
                </div>
              ) : (
                activeMessages.map((msg) => {
                  const isMine =
                    msg.sender.toLowerCase() === (nickname || "").toLowerCase() ||
                    msg.senderName.toLowerCase() === (nickname || "").toLowerCase();
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isMine ? "items-end" : "items-start"}`}
                    >
                      <div className="flex items-baseline gap-2 mb-1">
                        <span className="font-mono text-[10px] font-bold text-slate-400">
                          {isMine ? "You" : msg.senderName || msg.sender}
                        </span>
                        <span className="font-mono text-[9px] text-slate-600">
                          {new Date(msg.timestamp).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      <div
                        className={`px-4 py-2.5 rounded-2xl max-w-md text-xs font-sans leading-relaxed ${
                          isMine
                            ? "bg-turquoise-500 text-slate-950 font-medium rounded-tr-none shadow-sm"
                            : "bg-slate-800/90 text-slate-100 rounded-tl-none border border-slate-700/60"
                        }`}
                      >
                        {msg.text}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Chat Input */}
            <form
              onSubmit={handleSendMessage}
              className="p-3 border-t border-slate-800/80 bg-slate-950/60 flex items-center gap-2"
            >
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder={
                  dmTarget
                    ? `Message ${dmTarget.nickname}...`
                    : "Send transmission to your tribe..."
                }
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-900/90 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-turquoise-500 font-sans"
              />
              <button
                type="submit"
                disabled={!chatInput.trim() || isSending}
                className="p-2.5 rounded-xl bg-turquoise-500 hover:bg-turquoise-400 disabled:opacity-40 text-slate-950 transition-colors"
                title="Send message"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      ) : (
        /* EXPLORE / MATCHMAKING TAB (§5) */
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-800 bg-[#0c0d16]/80 p-5 space-y-4">
            <h3 className="text-sm font-mono font-bold text-slate-100">
              Discover Stargazers by Shared Interests
            </h3>
            <div className="flex flex-wrap gap-2">
              {["Astronomy", "Mindfulness", "Health", "Self-Improvement"].map((cat) => {
                const isSelected = selectedInterests.includes(cat);
                return (
                  <button
                    key={cat}
                    onClick={() => {
                      setSelectedInterests((prev) =>
                        isSelected ? prev.filter((c) => c !== cat) : [...prev, cat]
                      );
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-mono font-medium transition-all ${
                      isSelected
                        ? "bg-turquoise-500 text-slate-950 font-bold"
                        : "border border-slate-800 text-slate-400 hover:text-white"
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>

          {loadingExplore ? (
            <div className="p-12 text-center text-xs font-mono text-slate-500">
              Searching celestial peers...
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {exploreUsers.map((user) => {
                const isAlreadyMember = members.some((m) => m.nickname === user.nickname);
                const isInvited = outgoingInvites.includes(user.nickname);

                return (
                  <div
                    key={user.id}
                    className="p-5 rounded-2xl border border-slate-800 bg-[#0c0d16]/80 flex flex-col justify-between space-y-4"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-lg">
                            {user.avatarEmoji || "🌙"}
                          </div>
                          <div>
                            <h4 className="font-mono text-xs font-bold text-slate-200">
                              {user.nickname}
                            </h4>
                            <span className="text-[10px] font-mono text-turquoise-dim">
                              Match score: {user.score || 100}%
                            </span>
                          </div>
                        </div>
                      </div>

                      {user.bio && (
                        <p className="text-xs text-slate-300 font-sans leading-relaxed">
                          {user.bio}
                        </p>
                      )}

                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {user.interests.map((int) => (
                          <span
                            key={int}
                            className="px-2 py-0.5 rounded-full border border-slate-700 bg-slate-900/60 text-[9px] font-mono text-slate-400"
                          >
                            {int}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-800">
                      {isAlreadyMember ? (
                        <div className="w-full py-2 rounded-xl bg-slate-800/60 text-slate-400 font-mono text-xs text-center flex items-center justify-center gap-1.5">
                          <ShieldCheck className="w-3.5 h-3.5 text-turquoise" />
                          Mutual Member
                        </div>
                      ) : isInvited ? (
                        <button
                          onClick={() => cancelOutgoingInvite(user.nickname)}
                          className="w-full py-2 rounded-xl border border-slate-700 text-slate-400 hover:text-rose-400 font-mono text-xs text-center"
                        >
                          Invite Sent &bull; Cancel
                        </button>
                      ) : (
                        <button
                          onClick={() => sendInvite(user)}
                          className="w-full py-2 rounded-xl bg-turquoise-500 hover:bg-turquoise-400 text-slate-950 font-mono text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5"
                        >
                          <UserPlus className="w-3.5 h-3.5" />
                          Invite to Tribe
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
