import { useState } from "react";
import { FilePlus, Languages, Stamp, Scale } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ActionBarProps {
  onProposeTerm: (title: string, content: string) => void;
  onRatify: () => void;
  canRatify: boolean;
  sessionStatus: string;
}

export function ActionBar({ onProposeTerm, onRatify, canRatify, sessionStatus }: ActionBarProps) {
  const [showProposal, setShowProposal] = useState(false);
  const [clauseTitle, setClauseTitle] = useState("");
  const [clauseContent, setClauseContent] = useState("");

  const handleSubmitProposal = () => {
    if (!clauseTitle.trim() || !clauseContent.trim()) return;
    onProposeTerm(clauseTitle.trim(), clauseContent.trim());
    setClauseTitle("");
    setClauseContent("");
    setShowProposal(false);
  };

  return (
    <div className="glass-panel">
      <div className="flex items-center gap-2 px-4 py-3">
        <button
          onClick={() => setShowProposal(!showProposal)}
          className="flex items-center gap-2 px-3 py-2 rounded-md bg-secondary text-secondary-foreground text-sm hover:bg-secondary/80 transition-colors"
        >
          <FilePlus className="w-4 h-4" />
          Propose New Term
        </button>

        <button
          className="flex items-center gap-2 px-3 py-2 rounded-md bg-secondary text-secondary-foreground text-sm hover:bg-secondary/80 transition-colors opacity-60 cursor-not-allowed"
          disabled
        >
          <Languages className="w-4 h-4" />
          Request Translation Review
        </button>

        <div className="flex-1" />

        <button
          onClick={onRatify}
          disabled={!canRatify || sessionStatus === "ratified"}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-semibold transition-all ${
            canRatify && sessionStatus !== "ratified"
              ? "bg-status-accepted text-primary-foreground hover:bg-status-accepted/90"
              : "bg-muted text-muted-foreground cursor-not-allowed"
          }`}
        >
          <Stamp className="w-4 h-4" />
          {sessionStatus === "ratified" ? "Agreement Ratified" : "Ratify Agreement"}
        </button>
      </div>

      <AnimatePresence>
        {showProposal && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-3 border-t border-border pt-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Scale className="w-4 h-4" />
                <span>Draft a new settlement clause</span>
              </div>
              <input
                type="text"
                value={clauseTitle}
                onChange={(e) => setClauseTitle(e.target.value)}
                placeholder="Clause title (e.g., 'Confidentiality Agreement')"
                className="w-full px-3 py-2 rounded-md bg-secondary text-foreground placeholder:text-muted-foreground text-sm border border-border focus:outline-none focus:ring-1 focus:ring-ring"
              />
              <textarea
                value={clauseContent}
                onChange={(e) => setClauseContent(e.target.value)}
                placeholder="Clause content..."
                rows={3}
                className="w-full px-3 py-2 rounded-md bg-secondary text-foreground placeholder:text-muted-foreground text-sm font-mono-legal border border-border focus:outline-none focus:ring-1 focus:ring-ring resize-none"
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowProposal(false)}
                  className="px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitProposal}
                  disabled={!clauseTitle.trim() || !clauseContent.trim()}
                  className="px-4 py-1.5 text-sm rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-40"
                >
                  Submit Proposal
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
