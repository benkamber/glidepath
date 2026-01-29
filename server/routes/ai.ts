import type { Express } from "express";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export function registerAIRoutes(app: Express) {
  /**
   * POST /api/ai/parse-financial-data
   * Use Claude AI to parse raw spreadsheet data into structured entries
   */
  app.post("/api/ai/parse-financial-data", async (req, res) => {
    try {
      const { rawData } = req.body;

      if (!rawData || typeof rawData !== "string") {
        return res.status(400).json({ error: "Invalid input data" });
      }

      // Use Claude to parse the raw data
      const message = await anthropic.messages.create({
        model: "claude-sonnet-4-5-20250929",
        max_tokens: 4096,
        messages: [
          {
            role: "user",
            content: `You are a financial data parser. Parse the following raw data (from spreadsheets, CSVs, or text) and extract financial entries.

For each entry, identify:
- date: in ISO format (YYYY-MM-DD)
- totalNetWorth: total net worth amount (number)
- cash: cash/liquid assets amount (number)
- investment: investment amount if explicitly stated (optional - if not stated, it will be calculated as totalNetWorth - cash)

Return ONLY a JSON object with this exact structure, no other text:
{
  "entries": [
    {
      "date": "YYYY-MM-DD",
      "totalNetWorth": number,
      "cash": number,
      "investment": number (optional),
      "source": "brief description of where this data came from in the input"
    }
  ]
}

Raw data to parse:
${rawData}

Remember: Return ONLY the JSON object, no markdown, no explanation, no other text.`,
          },
        ],
      });

      // Extract the text content
      const textContent = message.content.find((c) => c.type === "text");
      if (!textContent || textContent.type !== "text") {
        throw new Error("No text response from Claude");
      }

      // Parse the JSON response
      let parsed;
      try {
        // Remove any markdown code blocks if present
        let jsonText = textContent.text.trim();
        if (jsonText.startsWith("```")) {
          jsonText = jsonText.replace(/```json\n?/g, "").replace(/```\n?/g, "");
        }
        parsed = JSON.parse(jsonText);
      } catch (parseError) {
        console.error("Failed to parse Claude response:", textContent.text);
        return res.status(500).json({
          error: "Failed to parse AI response",
          details: textContent.text,
        });
      }

      // Validate the response
      if (!parsed.entries || !Array.isArray(parsed.entries)) {
        return res.status(500).json({
          error: "Invalid response format from AI",
          response: parsed,
        });
      }

      // Validate and clean each entry
      const validEntries = parsed.entries
        .filter((entry: any) => {
          return (
            entry.date &&
            typeof entry.totalNetWorth === "number" &&
            typeof entry.cash === "number"
          );
        })
        .map((entry: any) => ({
          date: entry.date,
          totalNetWorth: Math.round(entry.totalNetWorth),
          cash: Math.round(entry.cash),
          investment: entry.investment
            ? Math.round(entry.investment)
            : Math.round(entry.totalNetWorth - entry.cash),
          source: entry.source || "imported data",
        }));

      res.json({ entries: validEntries });
    } catch (error) {
      console.error("AI parsing error:", error);
      res.status(500).json({
        error: "Failed to parse data with AI",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });
}
