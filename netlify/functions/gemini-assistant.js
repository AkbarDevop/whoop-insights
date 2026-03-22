const MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";
const FALLBACK_MODEL = process.env.GEMINI_FALLBACK_MODEL || "gemini-2.5-flash-lite";

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

function sliceRows(rows, limit) {
  return Array.isArray(rows) ? rows.slice(0, limit) : [];
}

function buildContextText(question, conversation) {
  const recentQuestions = Array.isArray(conversation)
    ? conversation
        .filter((message) => message?.role === "user")
        .map((message) => String(message.text || "").trim())
        .filter(Boolean)
        .slice(-3)
    : [];
  return [question, ...recentQuestions].join(" ").toLowerCase();
}

function isActionQuestion(text) {
  return /(recommend|what should i do|what do i do|what to do|focus on|next step|what else|how should i|what can i do)/.test(
    String(text || "").toLowerCase()
  );
}

function compactDatasetSummary(summary, question, conversation) {
  const contextText = buildContextText(question, conversation);
  const wantsAction = isActionQuestion(question) || isActionQuestion(contextText);
  const wantsSleep = wantsAction || /(sleep|recovery|hrv|rhr|resting heart)/.test(contextText);
  const wantsTraining = wantsAction || /(workout|lift|lifting|strain|strong|exercise|volume|pr|load|recovery)/.test(contextText);
  const wantsRoutes = /(route|run|walk|cardio|steps|activity|vo2|gpx)/.test(contextText);
  const wantsJournal = wantsAction || /(journal|creatine|supplement|vitamin|caffeine|habit)/.test(contextText);

  const compact = {
    generatedAt: summary?.generatedAt,
    latestDate: summary?.latestDate,
    intent: {
      wantsAction,
    },
    files: Array.isArray(summary?.files)
      ? summary.files.map((file) => ({ name: file.name, sizeKb: file.sizeKb }))
      : [],
    appleHealth: summary?.appleHealth || null,
  };

  if (summary?.whoopCycles) {
    compact.whoopCycles = {
      totalEntries: summary.whoopCycles.totalEntries,
      recentAverageRecovery: summary.whoopCycles.recentAverageRecovery,
      recentAverageHrv: summary.whoopCycles.recentAverageHrv,
      recentAverageRhr: summary.whoopCycles.recentAverageRhr,
      recentAverageStrain: summary.whoopCycles.recentAverageStrain,
      lowestRecoveryDays: sliceRows(summary.whoopCycles.lowestRecoveryDays, 5),
      recentRows: sliceRows(summary.whoopCycles.recentRows, wantsSleep || wantsTraining ? 14 : 8),
    };
  }

  if (summary?.sleeps && wantsSleep) {
    compact.sleeps = {
      totalEntries: summary.sleeps.totalEntries,
      nightsTracked: summary.sleeps.nightsTracked,
      recentAverageSleepHours: summary.sleeps.recentAverageSleepHours,
      recentAverageSleepPerformance: summary.sleeps.recentAverageSleepPerformance,
      recentAverageSleepEfficiency: summary.sleeps.recentAverageSleepEfficiency,
      recentAverageRespiratoryRate: summary.sleeps.recentAverageRespiratoryRate,
      recentRows: sliceRows(summary.sleeps.recentRows, 14),
    };
  }

  if (summary?.whoopWorkouts && wantsTraining) {
    compact.whoopWorkouts = {
      totalEntries: summary.whoopWorkouts.totalEntries,
      recentRows: sliceRows(summary.whoopWorkouts.recentRows, 12),
    };
  }

  if (summary?.strong && wantsTraining) {
    compact.strong = {
      totalRows: summary.strong.totalRows,
      sessionsTracked: summary.strong.sessionsTracked,
      recentSessions: sliceRows(summary.strong.recentSessions, 10),
      topExercises: sliceRows(summary.strong.topExercises, 8),
    };
  }

  if (summary?.routes && wantsRoutes) {
    compact.routes = {
      totalRoutes: summary.routes.totalRoutes,
      recentRoutes: sliceRows(summary.routes.recentRoutes, 6),
    };
  }

  if (summary?.journal && wantsJournal) {
    compact.journal = {
      totalEntries: summary.journal.totalEntries,
      recentRows: sliceRows(summary.journal.recentRows, 16),
    };
  }

  return compact;
}

async function requestGemini(apiKey, systemInstruction, prompt, overrides = {}, model = MODEL) {
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
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
  return { response, payload, answer: extractText(payload), finishReason: getFinishReason(payload), model };
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
    "If the user asks what to do, what to focus on, or for recommendations, give 1 to 2 concrete next steps grounded in the data even if the dataset contains no explicit recommendation field.",
    "For action questions, prioritize the clearest bottleneck or risk signal in the provided data rather than refusing because guidance is not explicitly present.",
    "Do not speculate about causes, diagnoses, readiness, or future outcomes beyond the data provided.",
    "Do not output confidence scores, confidence labels, probabilities, hype, praise, emojis, markdown tables, headings, bullets, asterisks, or self-referential AI disclaimers.",
    "Do not give generic advice unless the user explicitly asks what to do.",
    "Return 2 to 4 short complete sentences in plain text.",
    "Never use bullets, markdown, or fragment-style outlines.",
    "Do not provide diagnosis or emergency medical advice.",
  ].join(" ");

  const compactSummary = compactDatasetSummary(datasetSummary, question, conversation);

  const userPrompt = {
    task: "Answer the user's question using only the uploaded fitness data summary.",
    intent: {
      actionRequest: compactSummary.intent?.wantsAction || false,
      note:
        compactSummary.intent?.wantsAction
          ? "User is explicitly asking what to do next. Give 1-2 concrete, grounded recommendations."
          : "Answer the question directly without extra recommendations unless asked.",
    },
    answer_style: {
      persona: "supportive, direct, low-ego, evidence-first coach",
      format: "plain text only",
      requirements: [
        "First sentence directly answers the question.",
        "Support with 1-3 concrete observations tied to exact dates/date ranges and metrics when available.",
        "If the user asked what to do, include 1-2 concrete next steps tied to the most relevant metrics or dates.",
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
    datasetSummary: compactSummary,
    conversation,
    question,
  };

  try {
    let { response, payload, answer, finishReason, model: usedModel } = await requestGemini(
      apiKey,
      systemInstruction,
      userPrompt
    );

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
      const fallback = await requestGemini(
        apiKey,
        fallbackInstruction,
        { datasetSummary: compactSummary, question },
        { temperature: 0.1 },
        FALLBACK_MODEL
      );
      if (fallback.response.ok && fallback.answer && !looksTruncated(fallback.answer, fallback.finishReason)) {
        answer = fallback.answer;
        usedModel = fallback.model;
      }
    }

    if (!answer) {
      return json(502, { error: "Gemini returned an empty response." });
    }

    return json(200, { answer, model: usedModel || MODEL });
  } catch (error) {
    return json(500, {
      error: error instanceof Error ? error.message : "Unknown server error.",
    });
  }
};
