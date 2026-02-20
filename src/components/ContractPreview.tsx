import { motion, AnimatePresence } from "framer-motion";
import type { SettlementTerm } from "@/hooks/useSession";
import { FileText, ShieldCheck } from "lucide-react";

interface ContractPreviewProps {
  terms: SettlementTerm[];
  caseName: string;
  isVisible: boolean;
}

export function ContractPreview({ terms, caseName, isVisible }: ContractPreviewProps) {
  const acceptedTerms = terms.filter((t) => t.status === "accepted");

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 40 }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="fixed inset-4 z-50 flex items-center justify-center"
        >
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" />
          <div className="relative glass-panel w-full max-w-3xl max-h-[80vh] overflow-y-auto p-8">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-border">
              <FileText className="w-5 h-5 text-primary" />
              <div>
                <h2 className="text-lg font-semibold">Contract Preview</h2>
                <p className="text-sm text-muted-foreground">{caseName}</p>
              </div>
            </div>

            {acceptedTerms.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No accepted terms to display</p>
            ) : (
              <div className="space-y-6">
                {acceptedTerms.map((term, idx) => (
                  <div key={term.id} className="space-y-2">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-status-accepted" />
                      <h3 className="text-sm font-semibold uppercase tracking-wide">
                        Article {idx + 1}: {term.clause_title}
                      </h3>
                    </div>
                    <p className="font-mono-legal text-sm leading-relaxed text-muted-foreground pl-6">
                      {term.clause_content}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
