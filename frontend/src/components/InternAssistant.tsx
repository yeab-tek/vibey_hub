"use client";

import { useState, useRef, useEffect } from "react";
import { X, Send, Loader2 } from "lucide-react";
import Image from "next/image";
import { aiChatApi, type ChatMessage } from "@/lib/api";

export default function InternAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "assistant", content: "Hi! Ask me anything about how Vibey Hub works, or about your current tasks." },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isOpen]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || loading) return;
    const nextMessages: ChatMessage[] = [...messages, { role: "user", content: text }];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);
    try {
      const history = nextMessages.slice(-6);
      const result = await aiChatApi.send(text, history);
      setMessages((prev) => [...prev, { role: "assistant", content: result.reply }]);
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: "Sorry, I couldn't get an answer just now. Try again in a moment." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-5 right-5 z-50">
      {isOpen && (
        <div className="mb-3 w-80 h-96 bg-[#141414] border border-[#222] rounded-xl shadow-2xl flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-3 py-2.5 border-b border-[#222] bg-[#1a1a1a]">
            <div className="flex items-center gap-2">
              <Image src="/vibey-logo.png" alt="Vibey" width={16} height={16} className="rounded" />
              <span className="text-xs font-medium text-white">Vibey Assistant</span>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-[#666] hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-3 space-y-2.5">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] rounded-lg px-2.5 py-1.5 text-xs leading-relaxed ${
                    m.role === "user"
                      ? "bg-[#2bb673] text-[#0A0A0A]"
                      : "bg-[#1f1f1f] text-[#ddd] border border-[#2a2a2a]"
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-[#1f1f1f] border border-[#2a2a2a] rounded-lg px-2.5 py-1.5">
                  <Loader2 className="w-3 h-3 text-[#666] animate-spin" />
                </div>
              </div>
            )}
          </div>

          <div className="p-2 border-t border-[#222] flex items-center gap-1.5">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Ask a question..."
              className="flex-1 bg-[#0A0A0A] border border-[#333] rounded-md px-2.5 py-1.5 text-xs text-white placeholder:text-[#555] focus:outline-none focus:border-[#2bb673]/50"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || loading}
              className="h-7 w-7 flex items-center justify-center rounded-md bg-[#2bb673] hover:bg-[#25a065] disabled:opacity-40 disabled:hover:bg-[#2bb673] transition-colors"
            >
              <Send className="w-3.5 h-3.5 text-[#0A0A0A]" />
            </button>
          </div>
        </div>
      )}

      <button
        onClick={() => setIsOpen((v) => !v)}
        className="h-12 w-12 rounded-full bg-[#2bb673] hover:bg-[#25a065] shadow-lg flex items-center justify-center transition-transform hover:scale-105"
        aria-label="Open assistant"
      >
        {isOpen ? <X className="w-5 h-5 text-[#0A0A0A]" /> : <Image src="/vibey-logo.png" alt="Vibey" width={28} height={28} className="rounded-md" />}
      </button>
    </div>
  );
}
