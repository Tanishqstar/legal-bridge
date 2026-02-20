import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/useSession";
import { ChatInterface } from "@/components/ChatInterface";
import { SettlementLedger } from "@/components/SettlementLedger";
import { ProgressTracker } from "@/components/ProgressTracker";
import { ActionBar } from "@/components/ActionBar";
import { ContractPreview } from "@/components/ContractPreview";
import { SessionSelector } from "@/components/SessionSelector";
import { FileText, Copy, Check } from "lucide-react";
import { motion } from "framer-motion";

const NegotiationDashboard = () => {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [currentRole, setCurrentRole] = useState<"party_a" | "party_b">("party_a");
  const [showContract, setShowContract] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [copied, setCopied] = useState(false);

  const { session, messages, terms, loading } = useSession(sessionId);

  const acceptedCount = terms.filter((t) => t.status === "accepted").length;
  const canRatify = terms.length > 0 && acceptedCount === terms.length;

  const handleSendMessage = async (content: string, language: string) => {
    if (!sessionId) return;

    // Insert message
    const { data: msgData } = await supabase
      .from("messages")
      .insert({
        session_id: sessionId,
        sender_role: currentRole,
        content_original: content,
        language_code: language,
        intent: "inquiry" as const,
      })
      .select()
      .single();

    // Trigger translation via edge function
    if (msgData) {
      setIsTranslating(true);
      try {
        const { data } = await supabase.functions.invoke("translate", {
          body: { messageId: msgData.id, content, sourceLanguage: language },
        });
        if (data?.translation) {
          await supabase
            .from("messages")
            .update({
              content_translated: data.translation,
              intent: data.intent || "inquiry",
            })
            .eq("id", msgData.id);
        }
      } catch (err) {
        console.error("Translation failed:", err);
      } finally {
        setIsTranslating(false);
      }
    }
  };

  const handleProposeTerm = async (title: string, content: string) => {
    if (!sessionId) return;
    await supabase.from("settlement_terms").insert({
      session_id: sessionId,
      clause_title: title,
      clause_content: content,
      proposed_by: currentRole,
    });
  };

  const handleUpdateTermStatus = async (termId: string, status: "pending" | "accepted" | "disputed" | "rejected") => {
    await supabase.from("settlement_terms").update({ status }).eq("id", termId);
  };

  const handleRatify = async () => {
    if (!sessionId || !canRatify) return;
    await supabase.from("sessions").update({ status: "ratified" }).eq("id", sessionId);
  };

  const handleCopySessionId = () => {
    if (sessionId) {
      navigator.clipboard.writeText(sessionId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!sessionId) {
    return (
      <SessionSelector
        onSelectSession={setSessionId}
        onSelectRole={setCurrentRole}
      />
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground text-sm animate-pulse">Loading session...</div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Header */}
      <div className="border-b border-border p-3 space-y-3">
        <div className="flex items-center gap-3">
          <ProgressTracker
            total={terms.length}
            accepted={acceptedCount}
            caseName={session?.case_name || "Untitled"}
            status={session?.status || "active"}
          />

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleCopySessionId}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-secondary text-secondary-foreground text-xs hover:bg-secondary/80 transition-colors"
            >
              {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              {copied ? "Copied!" : "Session ID"}
            </button>

            <button
              onClick={() => setShowContract(!showContract)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-secondary text-secondary-foreground text-xs hover:bg-secondary/80 transition-colors"
            >
              <FileText className="w-3 h-3" />
              Preview Contract
            </button>
          </div>
        </div>

        <ActionBar
          onProposeTerm={handleProposeTerm}
          onRatify={handleRatify}
          canRatify={canRatify}
          sessionStatus={session?.status || "active"}
        />
      </div>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Chat panel */}
        <motion.div
          layout
          className="flex-1 border-r border-border flex flex-col"
        >
          <ChatInterface
            messages={messages}
            currentRole={currentRole}
            onSendMessage={handleSendMessage}
            isTranslating={isTranslating}
          />
        </motion.div>

        {/* Settlement Ledger Sidebar */}
        <motion.div
          layout
          className="w-80 shrink-0 flex flex-col bg-card"
        >
          <SettlementLedger
            terms={terms}
            onUpdateStatus={handleUpdateTermStatus}
            currentRole={currentRole}
          />
        </motion.div>
      </div>

      {/* Contract Preview Overlay */}
      <ContractPreview
        terms={terms}
        caseName={session?.case_name || "Untitled"}
        isVisible={showContract}
      />
      {showContract && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowContract(false)}
        />
      )}
    </div>
  );
};

export default NegotiationDashboard;

