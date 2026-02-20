import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export type Session = {
  id: string;
  case_name: string;
  status: string;
  created_at: string;
  created_by: string | null;
};

export type Message = {
  id: string;
  session_id: string;
  sender_role: "party_a" | "party_b";
  content_original: string;
  content_translated: string | null;
  language_code: string;
  intent: "offer" | "acceptance" | "inquiry";
  created_at: string;
};

export type SettlementTerm = {
  id: string;
  session_id: string;
  clause_title: string;
  clause_content: string;
  status: "pending" | "accepted" | "disputed" | "rejected";
  version: number;
  proposed_by: string;
  created_at: string;
  updated_at: string;
};

export function useSession(sessionId: string | null) {
  const [session, setSession] = useState<Session | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [terms, setTerms] = useState<SettlementTerm[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!sessionId) return;

    const fetchData = async () => {
      setLoading(true);
      const [sessionRes, messagesRes, termsRes] = await Promise.all([
        supabase.from("sessions").select("*").eq("id", sessionId).single(),
        supabase.from("messages").select("*").eq("session_id", sessionId).order("created_at", { ascending: true }),
        supabase.from("settlement_terms").select("*").eq("session_id", sessionId).order("created_at", { ascending: true }),
      ]);

      if (sessionRes.data) setSession(sessionRes.data as Session);
      if (messagesRes.data) setMessages(messagesRes.data as Message[]);
      if (termsRes.data) setTerms(termsRes.data as SettlementTerm[]);
      setLoading(false);
    };

    fetchData();

    // Realtime subscriptions
    const msgChannel = supabase
      .channel(`messages-${sessionId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `session_id=eq.${sessionId}` }, (payload) => {
        setMessages((prev) => [...prev, payload.new as Message]);
      })
      .subscribe();

    const termsChannel = supabase
      .channel(`terms-${sessionId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "settlement_terms", filter: `session_id=eq.${sessionId}` }, (payload) => {
        if (payload.eventType === "INSERT") {
          setTerms((prev) => [...prev, payload.new as SettlementTerm]);
        } else if (payload.eventType === "UPDATE") {
          setTerms((prev) => prev.map((t) => (t.id === (payload.new as SettlementTerm).id ? (payload.new as SettlementTerm) : t)));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(msgChannel);
      supabase.removeChannel(termsChannel);
    };
  }, [sessionId]);

  return { session, messages, terms, loading, setMessages, setTerms, setSession };
}
