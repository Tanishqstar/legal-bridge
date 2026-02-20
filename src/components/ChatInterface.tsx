import { useState, useRef, useEffect } from "react";
import { Send, Languages, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { Message } from "@/hooks/useSession";

interface ChatInterfaceProps {
  messages: Message[];
  currentRole: "party_a" | "party_b";
  onSendMessage: (content: string, language: string) => void;
  isTranslating: boolean;
}

const languageOptions = [
  { code: "en", label: "English" },
  { code: "es", label: "Español" },
  { code: "fr", label: "Français" },
  { code: "de", label: "Deutsch" },
  { code: "ar", label: "العربية" },
  { code: "zh", label: "中文" },
  { code: "ja", label: "日本語" },
];

export function ChatInterface({ messages, currentRole, onSendMessage, isTranslating }: ChatInterfaceProps) {
  const [draft, setDraft] = useState("");
  const [language, setLanguage] = useState("en");
  const [isDrafting, setIsDrafting] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!draft.trim()) return;
    onSendMessage(draft.trim(), language);
    setDraft("");
    setIsDrafting(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const intentIcons: Record<string, string> = {
    offer: "📋",
    acceptance: "✅",
    inquiry: "❓",
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <AnimatePresence initial={false}>
          {messages.map((msg) => {
            const isOwn = msg.sender_role === currentRole;
            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
              >
                <div className={`max-w-[75%] ${isOwn ? "chat-bubble-a" : "chat-bubble-b"}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                      {msg.sender_role === "party_a" ? "Requester" : "Respondent"}
                    </span>
                    <span className="text-[10px]">{intentIcons[msg.intent] || ""}</span>
                    <span className="text-[10px] text-muted-foreground ml-auto">
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>

                  {/* Original text */}
                  <p className="text-sm leading-relaxed">{msg.content_original}</p>

                  {/* Translation */}
                  {msg.content_translated && msg.content_translated !== msg.content_original && (
                    <div className="mt-2 pt-2 border-t border-border/30">
                      <div className="flex items-center gap-1 mb-1">
                        <Languages className="w-3 h-3 text-muted-foreground" />
                        <span className="text-[10px] text-muted-foreground uppercase">Translation</span>
                      </div>
                      <p className="text-sm leading-relaxed text-muted-foreground italic">
                        {msg.content_translated}
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {isTranslating && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-center"
          >
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Sparkles className="w-3 h-3 animate-pulse" />
              Translating...
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Drafting indicator */}
      {isDrafting && (
        <div className="px-4 py-1 border-t border-border/30">
          <span className="text-[10px] text-status-pending uppercase tracking-wider">⏳ Drafting...</span>
        </div>
      )}

      {/* Input area */}
      <div className="p-4 border-t border-border">
        <div className="flex items-end gap-2">
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="h-10 px-2 rounded-md bg-secondary text-secondary-foreground text-xs border border-border focus:outline-none focus:ring-1 focus:ring-ring"
          >
            {languageOptions.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.label}
              </option>
            ))}
          </select>

          <div className="flex-1 relative">
            <textarea
              value={draft}
              onChange={(e) => {
                setDraft(e.target.value);
                setIsDrafting(e.target.value.length > 0);
              }}
              onKeyDown={handleKeyDown}
              placeholder="Draft your message..."
              rows={1}
              className="w-full resize-none rounded-lg bg-secondary text-foreground placeholder:text-muted-foreground px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring border border-border"
            />
          </div>

          <button
            onClick={handleSend}
            disabled={!draft.trim()}
            className="h-10 w-10 rounded-lg bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
