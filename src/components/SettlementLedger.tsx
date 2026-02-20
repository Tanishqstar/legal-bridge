import { ShieldCheck, Clock, AlertTriangle, XCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { SettlementTerm } from "@/hooks/useSession";

interface SettlementLedgerProps {
  terms: SettlementTerm[];
  onUpdateStatus: (termId: string, status: SettlementTerm["status"]) => void;
  currentRole: "party_a" | "party_b";
}

const statusConfig = {
  accepted: {
    icon: ShieldCheck,
    className: "status-accepted",
    label: "Accepted",
    textClass: "text-status-accepted",
  },
  pending: {
    icon: Clock,
    className: "status-pending pulse-amber",
    label: "Pending",
    textClass: "text-status-pending",
  },
  disputed: {
    icon: AlertTriangle,
    className: "status-disputed",
    label: "Disputed",
    textClass: "text-status-disputed",
  },
  rejected: {
    icon: XCircle,
    className: "status-rejected",
    label: "Rejected",
    textClass: "text-status-rejected",
  },
};

export function SettlementLedger({ terms, onUpdateStatus, currentRole }: SettlementLedgerProps) {
  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-border">
        <h2 className="text-sm font-semibold tracking-wide uppercase text-muted-foreground">
          Settlement Ledger
        </h2>
        <p className="text-xs text-muted-foreground mt-1">
          {terms.length} clause{terms.length !== 1 ? "s" : ""}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        <AnimatePresence mode="popLayout">
          {terms.map((term) => {
            const config = statusConfig[term.status];
            const Icon = config.icon;

            return (
              <motion.div
                key={term.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                layout
                className={`glass-panel p-3 ${config.className}`}
              >
                <div className="flex items-start gap-2">
                  <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${config.textClass}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-sm font-medium truncate">{term.clause_title}</h3>
                      <span className={`text-xs ${config.textClass}`}>{config.label}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 font-mono-legal line-clamp-2">
                      {term.clause_content}
                    </p>
                    <div className="flex items-center gap-1 mt-2">
                      <span className="text-[10px] text-muted-foreground">v{term.version}</span>
                      {term.status === "pending" && (
                        <div className="flex gap-1 ml-auto">
                          <button
                            onClick={() => onUpdateStatus(term.id, "accepted")}
                            className="text-[10px] px-2 py-0.5 rounded bg-status-accepted/20 text-status-accepted hover:bg-status-accepted/30 transition-colors"
                          >
                            Accept
                          </button>
                          <button
                            onClick={() => onUpdateStatus(term.id, "disputed")}
                            className="text-[10px] px-2 py-0.5 rounded bg-status-disputed/20 text-status-disputed hover:bg-status-disputed/30 transition-colors"
                          >
                            Dispute
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {terms.length === 0 && (
          <div className="text-center py-8 text-muted-foreground text-sm">
            No clauses proposed yet
          </div>
        )}
      </div>
    </div>
  );
}
