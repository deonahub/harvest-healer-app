import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageBase64 } = await req.json();

    if (!imageBase64) {
      return new Response(JSON.stringify({ error: "No image provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `You are an expert agricultural crop analyst. Analyze the crop image and return a JSON object with these exact fields:
{
  "damageType": one of "safe", "animal_damage", "crop_lodging", "combined",
  "severity": one of "low", "medium", "high",
  "confidence": number 0-100,
  "areaAffected": number 0-100 (percentage of visible area affected),
  "description": "A clear 1-2 sentence description of the crop condition",
  "recommendations": ["array", "of", "3-5", "actionable", "recommendations"]
}

Guidelines:
- "safe" means healthy crops with no visible damage
- "animal_damage" means signs of grazing, nibbling, trampling by animals
- "crop_lodging" means crops bent/flattened due to wind, rain, or weak stems
- "combined" means both animal damage and lodging detected
- Be specific in recommendations (mention techniques, products, timelines)
- If the image is not a crop/farm image, still return valid JSON with damageType "safe" and a description noting it doesn't appear to be a crop image`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Analyze this crop image. Return ONLY the JSON object, no markdown formatting.",
              },
              {
                type: "image_url",
                image_url: { url: imageBase64 },
              },
            ],
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "crop_analysis",
              description: "Return structured crop analysis results",
              parameters: {
                type: "object",
                properties: {
                  damageType: {
                    type: "string",
                    enum: ["safe", "animal_damage", "crop_lodging", "combined"],
                  },
                  severity: { type: "string", enum: ["low", "medium", "high"] },
                  confidence: { type: "number" },
                  areaAffected: { type: "number" },
                  description: { type: "string" },
                  recommendations: {
                    type: "array",
                    items: { type: "string" },
                  },
                },
                required: ["damageType", "severity", "confidence", "areaAffected", "description", "recommendations"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "crop_analysis" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const text = await response.text();
      console.error("AI gateway error:", response.status, text);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const aiResult = await response.json();
    const toolCall = aiResult.choices?.[0]?.message?.tool_calls?.[0];
    
    let analysis;
    if (toolCall?.function?.arguments) {
      analysis = JSON.parse(toolCall.function.arguments);
    } else {
      // Fallback: try to parse content directly
      const content = aiResult.choices?.[0]?.message?.content || "";
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("Could not parse AI response");
      }
    }

    // Sanitize values
    analysis.confidence = Math.round((analysis.confidence || 85) * 10) / 10;
    analysis.areaAffected = Math.round((analysis.areaAffected || 0) * 10) / 10;

    return new Response(JSON.stringify(analysis), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("analyze-crop error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Analysis failed" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
