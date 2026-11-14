// supabase/functions/simplify-gujarati/index.ts
// Supabase Edge Function to simplify Gujarati articles/sentences for ISL signing

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { text } = await req.json();

    if (!text || typeof text !== "string" || !text.trim()) {
      return new Response(
        JSON.stringify({ ok: false, error: "Text parameter is required." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Server-side LLM Key (Gemini or OpenAI)
    const geminiKey = Deno.env.get("GEMINI_API_KEY");
    const openaiKey = Deno.env.get("OPENAI_API_KEY");

    if (!geminiKey && !openaiKey) {
      return new Response(
        JSON.stringify({
          ok: false,
          error: "LLM API key is not configured on server (set GEMINI_API_KEY or OPENAI_API_KEY).",
        }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const prompt = `You are a specialist in Gujarati language and Indian Sign Language (ISL) communication for deaf education.
Rewrite the following Gujarati text into short, simple sentences suitable for deaf students and sign language communication.
Rules:
1. Use common, high-frequency Gujarati vocabulary.
2. Break long complex sentences into simple Subject-Object-Verb statements.
3. Keep the meaning accurate without inventing facts.
4. Output ONLY the simplified Gujarati text, nothing else.

Input text:
${text}`;

    let simplifiedText = "";

    if (geminiKey) {
      const resp = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.2, maxOutputTokens: 1000 },
          }),
        }
      );
      const data = await resp.json();
      simplifiedText = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
    } else if (openaiKey) {
      const resp = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${openaiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.2,
        }),
      });
      const data = await resp.json();
      simplifiedText = data?.choices?.[0]?.message?.content?.trim() || "";
    }

    if (!simplifiedText) {
      return new Response(
        JSON.stringify({ ok: false, error: "Failed to generate simplified text from LLM." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ ok: true, simplifiedText }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ ok: false, error: err.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
