const MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

function json(statusCode, body) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
    body: JSON.stringify(body),
  };
}

function extractText(payload) {
  const candidates = payload?.candidates || [];
  const parts = candidates[0]?.content?.parts || [];
  return parts
    .map((part) => part.text || "")
    .join("")
    .trim();
}

exports.handler = async function handler(event) {
  if (event.httpMethod !== "POST") {
    return json(405, { error: "Method not allowed." });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return json(500, { error: "Gemini API key is not configured on the server." });
  }

  let parsed;
  try {
    parsed = JSON.parse(event.body || "{}");
  } catch {
    return json(400, { error: "Invalid JSON body." });
  }

  const question = String(parsed.question || "").trim();
  const datasetSummary = parsed.datasetSummary;
  const conversation = Array.isArray(parsed.conversation) ? parsed.conversation.slice(-8) : [];

  if (!question) {
    return json(400, { error: "Question is required." });
  }

  if (!datasetSummary || typeof datasetSummary !== "object") {
    return json(400, { error: "Dataset summary is required." });
  }

  const systemInstruction = [
    "You are WHOOP Insights Assistant, an analytics-focused fitness assistant.",
    "Use only the provided dataset summary and conversation.",
    "Be grounded, specific, and practical.",
    "Cite dates and metrics when possible.",
    "If data is missing or omitted, say that clearly.",
    "Do not claim certainty when the data does not support it.",
    "Do not provide diagnosis or emergency medical advice.",
    "Prefer concise paragraphs or flat bullets over long essays.",
  ].join(" ");

  const userPrompt = {
    task: "Answer the user's question using only the uploaded fitness data summary.",
    answer_style: {
      tone: "supportive, direct, actionable",
      format: "short paragraphs or flat bullets",
      requirements: [
        "Start with the main takeaway.",
        "Reference concrete dates/metrics when available.",
        "If useful, include 2-4 actionable next steps.",
        "Call out uncertainty or omitted data explicitly.",
      ],
    },
    datasetSummary,
    conversation,
    question,
  };

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        system_instruction: {
          parts: [{ text: systemInstruction }],
        },
        contents: [
          {
            role: "user",
            parts: [{ text: JSON.stringify(userPrompt) }],
          },
        ],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 900,
        },
      }),
    });

    const payload = await response.json();

    if (!response.ok) {
      return json(response.status, {
        error: payload?.error?.message || "Gemini request failed.",
      });
    }

    const answer = extractText(payload);
    if (!answer) {
      return json(502, { error: "Gemini returned an empty response." });
    }

    return json(200, { answer, model: MODEL });
  } catch (error) {
    return json(500, {
      error: error instanceof Error ? error.message : "Unknown server error.",
    });
  }
};
