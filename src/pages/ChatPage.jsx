import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { io } from "socket.io-client";
import api from "../lib/api.js";
import { MessageSquare, Send, Search } from "lucide-react";
import { timeAgo } from "../lib/utils.js";
import { useAuth } from "../context/AuthContext.jsx";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";
const SOCKET_URL = API_URL.replace("/api", "");

export default function ChatPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [activeConv, setActiveConv] = useState(null);
  const [msgText, setMsgText]       = useState("");
  const [search, setSearch]         = useState("");
  const [showNewChat, setShowNewChat]     = useState(false);
  const [contactSearch, setContactSearch] = useState("");
  const [contactRole, setContactRole]     = useState("");
  const socketRef = useRef(null);
  const bottomRef = useRef(null);

  // Socket.io setup
  useEffect(() => {
    const token = localStorage.getItem("od_admin_token");
    if (!token) return;
    const socket = io(SOCKET_URL, { auth: { token }, transports: ["websocket","polling"] });
    socketRef.current = socket;
    socket.on("new_message", (msg) => {
      qc.invalidateQueries({ queryKey: ["admin-messages", msg.conversation_id] });
      qc.invalidateQueries({ queryKey: ["admin-conversations"] });
    });
    return () => socket.disconnect();
  }, []);

  // Join conversation room on active change
  useEffect(() => {
    if (activeConv && socketRef.current) {
      socketRef.current.emit("chat:join", { conversationId: activeConv.id });
    }
  }, [activeConv?.id]);

  // Scroll to bottom on new messages
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [activeConv]);

  const { data: convsData } = useQuery({
    queryKey: ["admin-conversations"],
    queryFn: async () => { const { data } = await api.get("/chat/conversations"); return data; },
    refetchInterval: 30_000,
  });

  const { data: msgsData } = useQuery({
    queryKey: ["admin-messages", activeConv?.id],
    queryFn: async () => { const { data } = await api.get(`/chat/conversations/${activeConv.id}/messages?limit=100`); return data; },
    enabled: !!activeConv,
    refetchInterval: 10_000,
  });

  // All customers & sellers the admin can start a chat with
  const { data: contactsData } = useQuery({
    queryKey: ["chat-contacts", contactRole, contactSearch],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (contactRole)   params.set("role", contactRole);
      if (contactSearch) params.set("search", contactSearch);
      const { data } = await api.get(`/chat/contacts?${params.toString()}`);
      return data;
    },
    enabled: showNewChat,
  });
  const contacts = contactsData?.contacts || [];

  const startChatMutation = useMutation({
    mutationFn: async (recipientId) => {
      const { data } = await api.post("/chat/conversations", { recipientId });
      return data;
    },
    onSuccess: async (data) => {
      setShowNewChat(false);
      const res = await qc.fetchQuery({
        queryKey: ["admin-conversations"],
        queryFn: async () => { const { data } = await api.get("/chat/conversations"); return data; },
      });
      const conv = (res?.conversations || []).find((c) => c.id === data.conversationId);
      if (conv) setActiveConv(conv);
      qc.invalidateQueries({ queryKey: ["admin-conversations"] });
    },
    onError: (e) => alert(e?.response?.data?.error || "Could not start chat"),
  });

  const sendMutation = useMutation({
    mutationFn: () => api.post(`/chat/conversations/${activeConv.id}/messages`, { body: msgText }),
    onSuccess: () => {
      setMsgText("");
      qc.invalidateQueries({ queryKey: ["admin-messages", activeConv.id] });
      qc.invalidateQueries({ queryKey: ["admin-conversations"] });
    },
  });

  const convs    = (convsData?.conversations || []).filter((c) => !search || c.participants?.toLowerCase().includes(search.toLowerCase()));
  const messages = msgsData?.messages || [];

  const sendMsg = (e) => {
    e.preventDefault();
    if (!msgText.trim() || !activeConv) return;
    sendMutation.mutate();
  };

  const typeColors = {
    user_seller: "bg-orange-500/10 text-orange-400",
    user_admin:  "bg-purple-500/10 text-purple-400",
    seller_admin:"bg-blue-500/10 text-blue-400",
    user_driver: "bg-green-500/10 text-green-400",
    seller_driver:"bg-teal-500/10 text-teal-400",
  };

  return (
    <div className="flex h-[calc(100vh-0px)] overflow-hidden">
      {/* Conversations list */}
      <div className="w-72 flex-shrink-0 bg-slate-900 border-r border-slate-800 flex flex-col">
        <div className="p-4 border-b border-slate-800 flex-shrink-0">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-white font-bold text-base flex items-center gap-2">
              <MessageSquare size={16} className="text-orange-400" /> Messages
            </h2>
            <button onClick={() => setShowNewChat(true)}
              className="text-xs font-bold bg-orange-500 hover:bg-orange-600 text-white px-2.5 py-1.5 rounded-lg transition-colors">
              + New chat
            </button>
          </div>
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search…"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-8 pr-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 text-xs" />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {convs.length === 0 && (
            <div className="text-center py-12"><MessageSquare size={28} className="mx-auto text-slate-700 mb-2" /><p className="text-slate-600 text-xs">No conversations</p></div>
          )}
          {convs.map((c) => (
            <button
              key={c.id}
              onClick={() => setActiveConv(c)}
              className={`w-full text-left px-4 py-3 border-b border-slate-800 hover:bg-slate-800 transition-colors ${activeConv?.id === c.id ? "bg-slate-800" : ""}`}
            >
              <div className="flex items-start justify-between gap-2 mb-1">
                <p className="text-white text-sm font-semibold truncate">{c.participants || "Conversation"}</p>
                {c.unread_count > 0 && (
                  <span className="flex-shrink-0 bg-orange-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">{c.unread_count}</span>
                )}
              </div>
              <p className="text-slate-500 text-xs truncate">{c.last_message || "No messages yet"}</p>
              <div className="flex items-center justify-between mt-1">
                <span className={`text-xs font-semibold px-1.5 py-0.5 rounded capitalize ${typeColors[c.type] || "bg-slate-700 text-slate-400"}`}>
                  {c.type?.replace(/_/g," ")}
                </span>
                <span className="text-slate-600 text-xs">{timeAgo(c.updated_at)}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col min-w-0 bg-slate-950">
        {!activeConv ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageSquare size={48} className="mx-auto text-slate-800 mb-4" />
              <p className="text-slate-500 font-medium">Select a conversation</p>
              <p className="text-slate-700 text-sm">Chat with customers, sellers and drivers</p>
            </div>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="px-5 py-3.5 border-b border-slate-800 flex-shrink-0 bg-slate-900">
              <p className="text-white font-bold">{activeConv.participants || "Conversation"}</p>
              <p className="text-slate-500 text-xs capitalize">{activeConv.type?.replace(/_/g," ")}</p>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((m) => {
                const isMe = m.sender_id === user?.id;
                return (
                  <div key={m.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                    {!isMe && (
                      <div className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center text-white text-xs font-bold mr-2 flex-shrink-0 mt-auto">
                        {m.sender_name?.[0]?.toUpperCase() || "?"}
                      </div>
                    )}
                    <div className={`max-w-xs lg:max-w-md ${isMe ? "items-end" : "items-start"} flex flex-col gap-0.5`}>
                      {!isMe && <p className="text-slate-500 text-xs px-1">{m.sender_name} · {m.sender_role}</p>}
                      {m.image_url ? (
                        <img src={m.image_url} alt="Image" className={`max-w-48 rounded-2xl ${isMe ? "rounded-br-sm" : "rounded-bl-sm"}`} />
                      ) : (
                        <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${isMe ? "bg-orange-500 text-white rounded-br-sm" : "bg-slate-800 text-slate-200 rounded-bl-sm"}`}>
                          {m.body}
                        </div>
                      )}
                      <p className={`text-slate-600 text-xs px-1 ${isMe ? "text-right" : ""}`}>{timeAgo(m.created_at)}</p>
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <form onSubmit={sendMsg} className="px-4 py-3 border-t border-slate-800 flex-shrink-0 bg-slate-900">
              <div className="flex items-center gap-2">
                <input
                  value={msgText}
                  onChange={(e) => setMsgText(e.target.value)}
                  placeholder="Type a message…"
                  className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 text-sm"
                />
                <button
                  type="submit"
                  disabled={!msgText.trim() || sendMutation.isPending}
                  className="w-10 h-10 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white flex items-center justify-center transition-colors flex-shrink-0"
                >
                  {sendMutation.isPending ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Send size={16} />
                  )}
                </button>
              </div>
            </form>
          </>
        )}
      </div>

      {/* New chat — pick any customer or seller */}
      {showNewChat && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 rounded-2xl w-full max-w-md border border-slate-700 shadow-2xl flex flex-col max-h-[80vh]">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <h2 className="text-white font-bold">Start a chat</h2>
              <button onClick={() => setShowNewChat(false)} className="text-slate-400 hover:text-white text-lg leading-none">✕</button>
            </div>
            <div className="p-4 space-y-3 border-b border-slate-800">
              <input value={contactSearch} onChange={(e) => setContactSearch(e.target.value)} placeholder="Search name, email or phone…"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 text-sm" />
              <div className="flex gap-2">
                {[["", "All"], ["customer", "Customers"], ["seller", "Sellers"]].map(([val, label]) => (
                  <button key={val} onClick={() => setContactRole(val)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${contactRole === val ? "bg-orange-500 text-white" : "bg-slate-800 text-slate-400 hover:text-white"}`}>
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              {contacts.length === 0 && <p className="text-slate-500 text-sm text-center py-10">No users found</p>}
              {contacts.map((c) => (
                <button key={c.id} onClick={() => startChatMutation.mutate(c.id)} disabled={startChatMutation.isPending}
                  className="w-full text-left px-5 py-3 border-b border-slate-800/60 hover:bg-slate-800 transition-colors flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                    {c.name?.[0]?.toUpperCase() || "?"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-white text-sm font-semibold truncate">{c.name}{c.shop_name ? ` · ${c.shop_name}` : ""}</p>
                    <p className="text-slate-500 text-xs truncate">{c.email}{c.phone ? ` · ${c.phone}` : ""}</p>
                  </div>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full capitalize ${c.role === "seller" ? "bg-blue-500/10 text-blue-400" : "bg-orange-500/10 text-orange-400"}`}>
                    {c.role}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
