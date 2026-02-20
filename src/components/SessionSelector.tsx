import { useState } from "react";
import { Scale, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";

interface SessionSelectorProps {
  onSelectSession: (sessionId: string) => void;
  onSelectRole: (role: "party_a" | "party_b") => void;
}

export function SessionSelector({ onSelectSession, onSelectRole }: SessionSelectorProps) {
  const [caseName, setCaseName] = useState("");
  const [creating, setCreating] = useState(false);
  const [joinId, setJoinId] = useState("");
  const [role, setRole] = useState<"party_a" | "party_b">("party_a");

  const handleCreate = async () => {
    if (!caseName.trim()) return;
    setCreating(true);
    const { data, error } = await supabase
      .from("sessions")
      .insert({ case_name: caseName.trim() })
      .select()
      .single();

    if (data && !error) {
      onSelectRole(role);
      onSelectSession(data.id);
    }
    setCreating(false);
  };

  const handleJoin = () => {
    if (!joinId.trim()) return;
    onSelectRole(role);
    onSelectSession(joinId.trim());
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-panel w-full max-w-md p-8 space-y-8"
      >
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/20 mb-2">
            <Scale className="w-6 h-6 text-primary" />
          </div>
          <h1 className="text-2xl font-semibold">Legal Negotiator</h1>
          <p className="text-sm text-muted-foreground">Bilingual settlement negotiation platform</p>
        </div>

        {/* Role selection */}
        <div className="space-y-2">
          <label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Your Role</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setRole("party_a")}
              className={`px-3 py-2.5 rounded-lg text-sm font-medium transition-all border ${
                role === "party_a"
                  ? "bg-party-a/20 border-party-a/50 text-foreground"
                  : "bg-secondary border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              Requester (A)
            </button>
            <button
              onClick={() => setRole("party_b")}
              className={`px-3 py-2.5 rounded-lg text-sm font-medium transition-all border ${
                role === "party_b"
                  ? "bg-party-b/20 border-party-b/50 text-foreground"
                  : "bg-secondary border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              Respondent (B)
            </button>
          </div>
        </div>

        {/* Create new */}
        <div className="space-y-3">
          <label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">New Session</label>
          <input
            value={caseName}
            onChange={(e) => setCaseName(e.target.value)}
            placeholder="Case name (e.g., 'Smith v. Jones - Settlement')"
            className="w-full px-3 py-2.5 rounded-lg bg-secondary text-foreground placeholder:text-muted-foreground text-sm border border-border focus:outline-none focus:ring-1 focus:ring-ring"
          />
          <button
            onClick={handleCreate}
            disabled={creating || !caseName.trim()}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-40"
          >
            Create Session
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-border" />
          <span className="text-xs text-muted-foreground">or</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        {/* Join existing */}
        <div className="space-y-3">
          <label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Join Session</label>
          <input
            value={joinId}
            onChange={(e) => setJoinId(e.target.value)}
            placeholder="Paste session ID..."
            className="w-full px-3 py-2.5 rounded-lg bg-secondary text-foreground placeholder:text-muted-foreground text-sm font-mono border border-border focus:outline-none focus:ring-1 focus:ring-ring"
          />
          <button
            onClick={handleJoin}
            disabled={!joinId.trim()}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-secondary text-secondary-foreground text-sm font-medium hover:bg-secondary/80 transition-colors disabled:opacity-40"
          >
            Join Session
          </button>
        </div>
      </motion.div>
    </div>
  );
}
