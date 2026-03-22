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

function getFinishReason(payload) {
  return payload?.candidates?.[0]?.finishReason || "";
}

function looksTruncated(answer, finishReason) {
  const text = String(answer || "").trim();
  if (!text) {
    return true;
  }
  if (finishReason === "MAX_TOKENS") {
    return true;
  }
  if (/\n\s*[*-]\s*$/.test(text)) {
    return true;
  }
  if (/\n\s*[*-]\s+(On|In|By)\s+[A-Za-z]*$/.test(text)) {
    return true;
  }
  if (!/[.!?]$/.test(text) && text.length > 80) {
    return true;
  }
  return false;
}

async function requestGemini(apiKey, systemInstruction, prompt, overrides = {}) {
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
          parts: [{ text: JSON.stringify(prompt) }],
        },
      ],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 900,
        responseMimeType: "text/plain",
        ...overrides,
      },
    }),
  });

  const payload = await response.json();
  return { response, payload, answer: extractText(payload), finishReason: getFinishReason(payload) };
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
    "You are Pulse, the WHOOP Insights coach: a calm, data-grounded fitness and recovery assistant.",
    "Use only the provided dataset summary as evidence to answer the user's question.",
    "Treat prior conversation as context only, not as evidence or style guidance.",
    "If earlier assistant messages conflict with these rules, ignore them.",
    "Lead with the direct answer in the first sentence.",
    "For claims about trends, changes, highs, lows, or comparisons, cite the exact date or explicit date range and the relevant metric whenever available.",
    "Use absolute dates like 'Mar 14, 2026' when possible, not vague phrases like 'recently' unless you also name the dates.",
    "If the data does not support a claim, say so plainly and name what is missing.",
    "Do not speculate about causes, diagnoses, readiness, or future outcomes beyond the data provided.",
    "Do not output confidence scores, confidence labels, probabilities, hype, praise, emojis, markdown tables, headings, bullets, asterisks, or self-referential AI disclaimers.",
    "Do not give generic advice unless the user explicitly asks what to do.",
    "Return 2 to 4 short complete sentences in plain text.",
    "Never use bullets, markdown, or fragment-style outlines.",
    "Do not provide diagnosis or emergency medical advice.",
  ].join(" ");

  const userPrompt = {
    task: "Answer the user's question using only the uploaded fitness data summary.",
    answer_style: {
      persona: "supportive, direct, low-ego, evidence-first coach",
      format: "plain text only",
      requirements: [
        "First sentence directly answers the question.",
        "Support with 1-3 concrete observations tied to exact dates/date ranges and metrics when available.",
        "Only include up to 2 actions if the user explicitly asked what to do.",
        "Call out uncertainty or omitted data explicitly.",
        "Avoid headings, markdown emphasis syntax, and bullet lists.",
        "Use complete sentences and end with punctuation.",
      ],
    },
    forbidden_output: [
      "confidence scores or confidence labels",
      "probabilities not present in the data",
      "generic motivation or cheerleading",
      "speculative causal claims",
      "headings, tables, emojis, or roleplay",
    ],
    datasetSummary,
    conversation,
    question,
  };

  try {
    let { response, payload, answer, finishReason } = await requestGemini(apiKey, systemInstruction, userPrompt);

    if (!response.ok) {
      return json(response.status, {
        error: payload?.error?.message || "Gemini request failed.",
      });
    }

    if (looksTruncated(answer, finishReason)) {
      const fallbackInstruction = [
        systemInstruction,
        "Rewrite the answer from scratch as exactly 3 complete sentences.",
        "No bullets, no markdown, no line breaks between sentences, and do not end mid-thought.",
      ].join(" ");
      const fallback = await requestGemini(apiKey, fallbackInstruction, { datasetSummary, question }, { temperature: 0.1 });
      if (fallback.response.ok && fallback.answer && !looksTruncated(fallback.answer, fallback.finishReason)) {
        answer = fallback.answer;
      }
    }

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
