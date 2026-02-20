import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messageId, content, sourceLanguage } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    // Translate to the other two languages (return primary target)
    const langMap: Record<string, string> = { en: "English", hi: "Hindi", mr: "Marathi" };
    const otherLangs = Object.keys(langMap).filter(l => l !== sourceLanguage);
    const targetLanguage = otherLangs[0]; // primary translation target

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `You are a legal translation and intent classification assistant. The supported languages are English (en), Hindi (hi), and Marathi (mr).
Given a message in a legal negotiation context:
1. Translate the text from ${langMap[sourceLanguage] || sourceLanguage} to ${langMap[targetLanguage] || targetLanguage}. If the source is already in the target language, provide the same text.
2. Classify the intent as one of: "offer" (proposing terms), "acceptance" (agreeing to terms), or "inquiry" (asking questions or making general statements).

Respond ONLY with valid JSON: {"translation": "...", "intent": "offer|acceptance|inquiry"}`
          },
          { role: "user", content }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "translate_and_classify",
              description: "Translate legal text and classify intent",
              parameters: {
                type: "object",
                properties: {
                  translation: { type: "string", description: "The translated text" },
                  intent: { type: "string", enum: ["offer", "acceptance", "inquiry"] }
                },
                required: ["translation", "intent"],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "translate_and_classify" } }
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited, try again later" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required" }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
      const t = await response.text();
      console.error("AI error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const aiData = await response.json();
    let translation = content;
    let intent = "inquiry";

    try {
      const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
      if (toolCall) {
        const args = JSON.parse(toolCall.function.arguments);
        translation = args.translation || content;
        intent = args.intent || "inquiry";
      }
    } catch {
      console.error("Failed to parse AI response");
    }

    return new Response(JSON.stringify({ translation, intent, messageId }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  } catch (e) {
    console.error("translate error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
