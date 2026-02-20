import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/useSession";
import { ChatInterface } from "@/components/ChatInterface";
import { SettlementLedger } from "@/components/SettlementLedger";
import { ProgressTracker } from "@/components/ProgressTracker";
import { ActionBar } from "@/components/ActionBar";
import { ContractPreview } from "@/components/ContractPreview";
import { SessionSelector } from "@/components/SessionSelector";
import { FileText, Copy, Check, Share2, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const NegotiationDashboard = () => {
  const [searchParams] = useSearchParams();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [currentRole, setCurrentRole] = useState<"party_a" | "party_b">("party_a");
  const [showContract, setShowContract] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareLink, setShareLink] = useState("");

  const { session, messages, terms, loading } = useSession(sessionId);

  const acceptedCount = terms.filter((t) => t.status === "accepted").length;
  const canRatify = terms.length > 0 && acceptedCount === terms.length;

  // Auto-join from URL param
  useEffect(() => {
    const joinId = searchParams.get("join");
    if (joinId && !sessionId) {
      setCurrentRole("party_b");
      setSessionId(joinId);
    }
  }, [searchParams, sessionId]);

  const handleSessionCreated = (id: string) => {
    setSessionId(id);
    const link = `${window.location.origin}/?join=${id}`;
    setShareLink(link);
    setShowShareModal(true);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendMessage = async (content: string, language: string) => {
    if (!sessionId) return;

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
        onSelectSession={handleSessionCreated}
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
      {/* Share Modal */}
      <AnimatePresence>
        {showShareModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-card border border-border rounded-xl p-6 max-w-md w-full space-y-4 shadow-2xl"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Share2 className="w-5 h-5 text-primary" />
                  <h2 className="text-lg font-semibold">Session Created!</h2>
                </div>
                <button onClick={() => setShowShareModal(false)} className="text-muted-foreground hover:text-foreground">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-sm text-muted-foreground">
                Share this link with the other party so they can join the negotiation:
              </p>

              <div className="flex items-center gap-2">
                <input
                  readOnly
                  value={shareLink}
                  className="flex-1 px-3 py-2 rounded-lg bg-secondary text-foreground text-xs font-mono border border-border"
                />
                <button
                  onClick={handleCopyLink}
                  className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
                >
                  {copied ? "Copied!" : "Copy"}
                </button>
              </div>

              <button
                onClick={() => setShowShareModal(false)}
                className="w-full py-2 rounded-lg bg-secondary text-secondary-foreground text-sm hover:bg-secondary/80 transition-colors"
              >
                Continue to Session
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
              onClick={() => {
                const link = `${window.location.origin}/?join=${sessionId}`;
                setShareLink(link);
                setShowShareModal(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary/20 text-primary text-xs hover:bg-primary/30 transition-colors"
            >
              <Share2 className="w-3 h-3" />
              Share Link
            </button>

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
        <motion.div layout className="flex-1 border-r border-border flex flex-col">
          <ChatInterface
            messages={messages}
            currentRole={currentRole}
            onSendMessage={handleSendMessage}
            isTranslating={isTranslating}
          />
        </motion.div>

        <motion.div layout className="w-80 shrink-0 flex flex-col bg-card">
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
