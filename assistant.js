(function () {
  const STORAGE_KEY = "whoop-insights-ai-consent";
  const MAX_HISTORY_TURNS = 4;
  const MAX_RECENT_ROWS = 45;

  const state = {
    files: [],
    fingerprint: "",
    summary: null,
    isOpen: false,
    isSending: false,
    consent: localStorage.getItem(STORAGE_KEY) === "true",
    messages: [
      {
        role: "assistant",
        text:
          "Ask about recovery, sleep, strain, workouts, or trends in your uploaded data. I’ll stay grounded in the files you loaded and call out anything missing.",
      },
    ],
  };

  const style = document.createElement("style");
  style.textContent = `
    .wi-ai-shell {
      position: fixed;
      right: 20px;
      bottom: 20px;
      z-index: 9998;
      font-family: Inter, system-ui, sans-serif;
    }
    .wi-ai-fab {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      border: 0;
      border-radius: 999px;
      padding: 14px 18px;
      background: linear-gradient(135deg, #0f222c, #173642);
      color: #f4fbff;
      box-shadow: 0 18px 42px rgba(0, 0, 0, 0.28);
      cursor: pointer;
      font-weight: 700;
      font-size: 14px;
    }
    .wi-ai-fab-dot {
      width: 10px;
      height: 10px;
      border-radius: 999px;
      background: #4de2c5;
      box-shadow: 0 0 0 6px rgba(77, 226, 197, 0.14);
    }
    .wi-ai-panel {
      position: absolute;
      right: 0;
      bottom: 70px;
      width: min(420px, calc(100vw - 24px));
      max-height: min(720px, calc(100vh - 110px));
      display: none;
      flex-direction: column;
      overflow: hidden;
      border-radius: 24px;
      border: 1px solid rgba(77, 226, 197, 0.16);
      background: rgba(8, 19, 25, 0.96);
      color: #eef7fa;
      box-shadow: 0 28px 70px rgba(0, 0, 0, 0.36);
      backdrop-filter: blur(14px);
    }
    .wi-ai-panel[data-open="true"] {
      display: flex;
    }
    .wi-ai-header {
      padding: 18px 18px 14px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      background:
        radial-gradient(circle at top left, rgba(77, 226, 197, 0.14), transparent 34%),
        linear-gradient(180deg, rgba(19, 40, 48, 0.95), rgba(8, 19, 25, 0.92));
    }
    .wi-ai-kicker {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 5px 10px;
      border-radius: 999px;
      background: rgba(77, 226, 197, 0.12);
      color: #4de2c5;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }
    .wi-ai-title {
      margin: 12px 0 6px;
      font-size: 22px;
      font-weight: 700;
      line-height: 1.15;
    }
    .wi-ai-subtitle {
      margin: 0;
      font-size: 13px;
      line-height: 1.55;
      color: #9cb4bd;
    }
    .wi-ai-status {
      margin-top: 12px;
      font-size: 12px;
      color: #d6f4ee;
    }
    .wi-ai-body {
      display: flex;
      flex-direction: column;
      min-height: 0;
    }
    .wi-ai-messages {
      flex: 1;
      overflow: auto;
      padding: 16px 16px 8px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      background: linear-gradient(180deg, rgba(8, 19, 25, 0.9), rgba(8, 19, 25, 1));
    }
    .wi-ai-bubble {
      padding: 12px 14px;
      border-radius: 16px;
      font-size: 13px;
      line-height: 1.6;
      white-space: pre-wrap;
    }
    .wi-ai-bubble[data-role="assistant"] {
      align-self: flex-start;
      background: rgba(255, 255, 255, 0.06);
      border: 1px solid rgba(255, 255, 255, 0.06);
      color: #ecf7fb;
    }
    .wi-ai-bubble[data-role="user"] {
      align-self: flex-end;
      background: rgba(77, 226, 197, 0.12);
      border: 1px solid rgba(77, 226, 197, 0.16);
      color: #f2fffc;
    }
    .wi-ai-suggestions {
      padding: 0 16px 10px;
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }
    .wi-ai-suggestion {
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 999px;
      padding: 8px 12px;
      background: rgba(255, 255, 255, 0.04);
      color: #d3e9ef;
      cursor: pointer;
      font-size: 12px;
    }
    .wi-ai-footer {
      padding: 14px 16px 16px;
      border-top: 1px solid rgba(255, 255, 255, 0.08);
      background: rgba(7, 17, 22, 0.98);
    }
    .wi-ai-consent {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      margin-bottom: 12px;
      font-size: 12px;
      line-height: 1.5;
      color: #a8c1c9;
    }
    .wi-ai-consent input {
      margin-top: 2px;
    }
    .wi-ai-input {
      width: 100%;
      min-height: 86px;
      resize: vertical;
      border-radius: 16px;
      border: 1px solid rgba(255, 255, 255, 0.1);
      background: rgba(255, 255, 255, 0.04);
      color: #f2fbff;
      padding: 12px 14px;
      font: inherit;
      outline: none;
      box-sizing: border-box;
    }
    .wi-ai-input::placeholder {
      color: #6d8993;
    }
    .wi-ai-actions {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      margin-top: 10px;
    }
    .wi-ai-hint {
      font-size: 11px;
      line-height: 1.45;
      color: #7e9aa4;
      max-width: 220px;
    }
    .wi-ai-send {
      border: 0;
      border-radius: 14px;
      padding: 10px 14px;
      min-width: 110px;
      background: linear-gradient(135deg, #4de2c5, #79c8ff);
      color: #081216;
      font-weight: 700;
      cursor: pointer;
    }
    .wi-ai-send[disabled],
    .wi-ai-suggestion[disabled] {
      opacity: 0.55;
      cursor: not-allowed;
    }
    @media (max-width: 640px) {
      .wi-ai-shell {
        right: 12px;
        left: 12px;
        bottom: 12px;
      }
      .wi-ai-panel {
        right: 0;
        left: 0;
        width: auto;
        bottom: 64px;
      }
      .wi-ai-fab {
        width: 100%;
        justify-content: center;
      }
    }
  `;
  document.head.appendChild(style);

  const shell = document.createElement("div");
  shell.className = "wi-ai-shell";
  shell.innerHTML = `
    <div class="wi-ai-panel" data-open="false">
      <div class="wi-ai-header">
        <div class="wi-ai-kicker"><span class="wi-ai-fab-dot"></span> Gemini Assistant</div>
        <div class="wi-ai-title">Ask about your fitness data</div>
        <p class="wi-ai-subtitle">Grounded answers from your uploaded WHOOP, Strong, and route files. Apple Health XML is not yet fully summarized in v1 because those exports are often very large.</p>
        <div class="wi-ai-status" data-ai-status>Waiting for uploaded data…</div>
      </div>
      <div class="wi-ai-body">
        <div class="wi-ai-messages" data-ai-messages></div>
        <div class="wi-ai-suggestions">
          <button type="button" class="wi-ai-suggestion" data-question="What stands out in my recovery over the past 2 weeks?">Recovery trends</button>
          <button type="button" class="wi-ai-suggestion" data-question="How is my sleep affecting my workouts lately?">Sleep vs workouts</button>
          <button type="button" class="wi-ai-suggestion" data-question="What should I focus on tomorrow based on my latest data?">What to do tomorrow</button>
        </div>
        <div class="wi-ai-footer">
          <label class="wi-ai-consent">
            <input type="checkbox" data-ai-consent />
            <span>I agree to send a structured summary of my uploaded data and my question to Gemini for analysis. This is not medical advice.</span>
          </label>
          <textarea class="wi-ai-input" data-ai-input placeholder="Ask a question about recovery, sleep, strain, workouts, or trends in your data…"></textarea>
          <div class="wi-ai-actions">
            <div class="wi-ai-hint">Tip: ask for specifics like “last 7 days”, “red recovery days”, or “which workouts hit me hardest?”.</div>
            <button type="button" class="wi-ai-send" data-ai-send>Ask Gemini</button>
          </div>
        </div>
      </div>
    </div>
    <button type="button" class="wi-ai-fab" data-ai-toggle>
      <span class="wi-ai-fab-dot"></span>
      <span>AI Assistant</span>
    </button>
  `;
  document.body.appendChild(shell);

  const panel = shell.querySelector(".wi-ai-panel");
  const toggle = shell.querySelector("[data-ai-toggle]");
  const messagesEl = shell.querySelector("[data-ai-messages]");
  const statusEl = shell.querySelector("[data-ai-status]");
  const consentEl = shell.querySelector("[data-ai-consent]");
  const inputEl = shell.querySelector("[data-ai-input]");
  const sendEl = shell.querySelector("[data-ai-send]");
  const suggestionEls = Array.from(shell.querySelectorAll("[data-question]"));

  consentEl.checked = state.consent;

  function normalizeKey(value) {
    return String(value || "")
      .toLowerCase()
      .replace(/[%()]/g, "")
      .replace(/[^a-z0-9]+/g, " ")
      .trim();
  }

  function parseCsv(text) {
    const rows = [];
    let row = [];
    let field = "";
    let inQuotes = false;

    for (let i = 0; i < text.length; i += 1) {
      const char = text[i];
      const next = text[i + 1];

      if (char === '"') {
        if (inQuotes && next === '"') {
          field += '"';
          i += 1;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === "," && !inQuotes) {
        row.push(field);
        field = "";
      } else if ((char === "\n" || char === "\r") && !inQuotes) {
        if (char === "\r" && next === "\n") {
          i += 1;
        }
        row.push(field);
        field = "";
        if (row.some((cell) => cell !== "")) {
          rows.push(row);
        }
        row = [];
      } else {
        field += char;
      }
    }

    if (field !== "" || row.length > 0) {
      row.push(field);
      rows.push(row);
    }

    if (rows.length === 0) {
      return [];
    }

    const headers = rows[0].map((header) => header.trim());
    return rows.slice(1).map((cells) => {
      const record = {};
      headers.forEach((header, index) => {
        record[header] = (cells[index] || "").trim();
      });
      return record;
    });
  }

  function toNumber(value) {
    if (value === null || value === undefined || value === "") {
      return null;
    }
    const number = Number(String(value).replace(/,/g, ""));
    return Number.isFinite(number) ? number : null;
  }

  function pickFirst(obj, candidates) {
    const keys = Object.keys(obj || {});
    const normalizedMap = new Map(keys.map((key) => [normalizeKey(key), key]));

    for (const candidate of candidates) {
      if (normalizedMap.has(candidate)) {
        return obj[normalizedMap.get(candidate)];
      }
    }

    for (const candidate of candidates) {
      const match = Array.from(normalizedMap.entries()).find(([normalized]) => normalized.includes(candidate));
      if (match) {
        return obj[match[1]];
      }
    }

    return "";
  }

  function sortByDateDesc(rows, key) {
    return rows
      .filter((row) => row[key])
      .slice()
      .sort((a, b) => new Date(b[key]).getTime() - new Date(a[key]).getTime());
  }

  function average(values) {
    const filtered = values.filter((value) => Number.isFinite(value));
    if (!filtered.length) {
      return null;
    }
    return filtered.reduce((sum, value) => sum + value, 0) / filtered.length;
  }

  function round(value, digits) {
    if (!Number.isFinite(value)) {
      return null;
    }
    const factor = 10 ** (digits || 0);
    return Math.round(value * factor) / factor;
  }

  function formatDate(value) {
    if (!value) {
      return "";
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return String(value);
    }
    return date.toISOString().slice(0, 10);
  }

  function summarizeWhoopCycles(rows) {
    const mapped = rows.map((row) => ({
      date: formatDate(pickFirst(row, ["cycle start time", "date"])),
      recovery: toNumber(pickFirst(row, ["recovery score", "recovery score %"])),
      hrv: toNumber(pickFirst(row, ["heart rate variability ms", "heart rate variability", "heart rate variability rmssd ms"])),
      rhr: toNumber(pickFirst(row, ["resting heart rate bpm", "resting heart rate"])),
      strain: toNumber(pickFirst(row, ["day strain"])),
      energy: toNumber(pickFirst(row, ["energy burned cal", "energy burned kj", "energy burned"])),
      spo2: toNumber(pickFirst(row, ["blood oxygen", "spo2", "blood oxygen %"])),
    }));
    const recent = sortByDateDesc(mapped, "date").slice(0, MAX_RECENT_ROWS);
    return {
      totalEntries: mapped.length,
      recentAverageRecovery: round(average(recent.map((item) => item.recovery)), 1),
      recentAverageHrv: round(average(recent.map((item) => item.hrv)), 1),
      recentAverageRhr: round(average(recent.map((item) => item.rhr)), 1),
      recentAverageStrain: round(average(recent.map((item) => item.strain)), 1),
      lowestRecoveryDays: recent
        .filter((item) => Number.isFinite(item.recovery))
        .sort((a, b) => a.recovery - b.recovery)
        .slice(0, 5),
      recentRows: recent,
    };
  }

  function summarizeSleeps(rows) {
    const mapped = rows.map((row) => ({
      date: formatDate(pickFirst(row, ["sleep onset", "cycle start time", "date"])),
      sleepHours: round(toNumber(pickFirst(row, ["asleep duration min", "total sleep time ms", "total sleep time"])) / 60, 2),
      sleepPerformance: toNumber(pickFirst(row, ["sleep performance", "sleep performance %"])),
      sleepEfficiency: toNumber(pickFirst(row, ["sleep efficiency", "sleep efficiency %"])),
      sleepConsistency: toNumber(pickFirst(row, ["sleep consistency", "sleep consistency %"])),
      respiratoryRate: toNumber(pickFirst(row, ["respiratory rate rpm", "respiratory rate"])),
      disturbances: toNumber(pickFirst(row, ["disturbance count", "disturbances", "awake duration min"])),
      nap: String(pickFirst(row, ["nap"])).toLowerCase() === "true",
    }));
    const nights = sortByDateDesc(
      mapped.filter((item) => !item.nap && item.date),
      "date"
    ).slice(0, MAX_RECENT_ROWS);
    return {
      totalEntries: mapped.length,
      nightsTracked: nights.length,
      recentAverageSleepHours: round(average(nights.map((item) => item.sleepHours)), 2),
      recentAverageSleepPerformance: round(average(nights.map((item) => item.sleepPerformance)), 1),
      recentAverageSleepEfficiency: round(average(nights.map((item) => item.sleepEfficiency)), 1),
      recentAverageRespiratoryRate: round(average(nights.map((item) => item.respiratoryRate)), 1),
      recentRows: nights,
    };
  }

  function summarizeWhoopWorkouts(rows) {
    const mapped = rows.map((row) => ({
      date: formatDate(pickFirst(row, ["workout start time", "cycle start time", "date"])),
      activity: pickFirst(row, ["activity name", "sport name", "sport"]),
      durationMin: toNumber(pickFirst(row, ["duration min", "duration minutes", "duration"])),
      strain: toNumber(pickFirst(row, ["activity strain"])),
      avgHr: toNumber(pickFirst(row, ["average hr bpm", "average heart rate", "average hr"])),
      maxHr: toNumber(pickFirst(row, ["max hr bpm", "max heart rate", "max hr"])),
      energy: toNumber(pickFirst(row, ["energy burned cal", "kilojoule", "kj"])),
    }));
    const recent = sortByDateDesc(mapped, "date").slice(0, MAX_RECENT_ROWS);
    const activityCounts = {};
    recent.forEach((item) => {
      const key = item.activity || "Unknown";
      activityCounts[key] = (activityCounts[key] || 0) + 1;
    });
    return {
      totalEntries: mapped.length,
      recentAverageWorkoutStrain: round(average(recent.map((item) => item.strain)), 1),
      activityBreakdown: Object.entries(activityCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(([activity, count]) => ({ activity, count })),
      recentRows: recent,
    };
  }

  function summarizeJournal(rows) {
    const mapped = rows.map((row) => ({
      date: formatDate(pickFirst(row, ["cycle start time", "date", "created at"])),
      question: pickFirst(row, ["question", "question text"]),
      answer: pickFirst(row, ["answer", "answer text"]),
    }));
    return {
      totalEntries: mapped.length,
      recentRows: sortByDateDesc(mapped, "date").slice(0, 50),
    };
  }

  function summarizeStrong(rows) {
    const mapped = rows.map((row) => {
      const weight = toNumber(pickFirst(row, ["weight"]));
      const reps = toNumber(pickFirst(row, ["reps"]));
      return {
        date: formatDate(pickFirst(row, ["date"])),
        workoutName: pickFirst(row, ["workout name"]),
        exerciseName: pickFirst(row, ["exercise name"]),
        duration: pickFirst(row, ["duration"]),
        weight,
        reps,
        volume: Number.isFinite(weight) && Number.isFinite(reps) ? weight * reps : null,
      };
    });

    const grouped = new Map();
    mapped.forEach((item) => {
      const key = `${item.date}__${item.workoutName}`;
      if (!grouped.has(key)) {
        grouped.set(key, {
          date: item.date,
          workoutName: item.workoutName,
          duration: item.duration,
          exercises: new Set(),
          totalSets: 0,
          totalVolume: 0,
        });
      }
      const current = grouped.get(key);
      current.totalSets += 1;
      current.exercises.add(item.exerciseName);
      if (Number.isFinite(item.volume)) {
        current.totalVolume += item.volume;
      }
    });

    const recentSessions = Array.from(grouped.values())
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 25)
      .map((session) => ({
        date: session.date,
        workoutName: session.workoutName,
        duration: session.duration,
        totalSets: session.totalSets,
        distinctExercises: session.exercises.size,
        totalVolume: round(session.totalVolume, 0),
      }));

    const topExercises = {};
    mapped.forEach((item) => {
      if (!item.exerciseName) {
        return;
      }
      topExercises[item.exerciseName] = topExercises[item.exerciseName] || { exercise: item.exerciseName, sets: 0, volume: 0 };
      topExercises[item.exerciseName].sets += 1;
      if (Number.isFinite(item.volume)) {
        topExercises[item.exerciseName].volume += item.volume;
      }
    });

    return {
      totalRows: mapped.length,
      sessionsTracked: grouped.size,
      recentSessions,
      topExercises: Object.values(topExercises)
        .sort((a, b) => b.volume - a.volume)
        .slice(0, 12)
        .map((item) => ({ ...item, volume: round(item.volume, 0) })),
    };
  }

  function summarizeRoutes(files) {
    const names = files
      .filter((file) => file.name.toLowerCase().endsWith(".gpx"))
      .map((file) => file.name)
      .sort();
    return {
      totalRoutes: names.length,
      recentRoutes: names.slice(-10),
    };
  }

  function buildFingerprint(files) {
    return files
      .map((file) => `${file.name}:${file.size}:${file.lastModified}`)
      .sort()
      .join("|");
  }

  async function buildDatasetSummary(files) {
    const summary = {
      generatedAt: new Date().toISOString(),
      files: files.map((file) => ({
        name: file.name,
        sizeKb: round(file.size / 1024, 1),
      })),
      whoopCycles: null,
      sleeps: null,
      whoopWorkouts: null,
      journal: null,
      strong: null,
      routes: summarizeRoutes(files),
      appleHealth: {
        uploaded: files.some((file) => file.name.toLowerCase() === "export.xml"),
        includedInPrompt: false,
        note: "Apple Health export.xml is not yet fully summarized in assistant v1 because those exports are often very large.",
      },
    };

    for (const file of files) {
      const lower = file.name.toLowerCase();
      if (!lower.endsWith(".csv")) {
        continue;
      }

      const text = await file.text();
      const rows = parseCsv(text);

      if (lower.includes("physiological_cycles")) {
        summary.whoopCycles = summarizeWhoopCycles(rows);
      } else if (lower.includes("sleeps")) {
        summary.sleeps = summarizeSleeps(rows);
      } else if (lower.includes("workouts") && !lower.includes("strong")) {
        summary.whoopWorkouts = summarizeWhoopWorkouts(rows);
      } else if (lower.includes("journal_entries")) {
        summary.journal = summarizeJournal(rows);
      } else if (lower.includes("strong")) {
        summary.strong = summarizeStrong(rows);
      }
    }

    return summary;
  }

  function setStatus(text) {
    statusEl.textContent = text;
  }

  function renderMessages() {
    messagesEl.innerHTML = "";
    state.messages.forEach((message) => {
      const bubble = document.createElement("div");
      bubble.className = "wi-ai-bubble";
      bubble.dataset.role = message.role;
      bubble.textContent = message.text;
      messagesEl.appendChild(bubble);
    });
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function syncOpenState() {
    panel.dataset.open = String(state.isOpen);
  }

  function appendMessage(role, text) {
    state.messages.push({ role, text });
    renderMessages();
  }

  function updateDataStatus() {
    if (!state.files.length) {
      setStatus("Waiting for uploaded data…");
      return;
    }
    const fileNames = state.files.map((file) => file.name).slice(0, 3);
    const extraCount = Math.max(0, state.files.length - fileNames.length);
    setStatus(
      `Data ready from ${state.files.length} file${state.files.length === 1 ? "" : "s"}: ${fileNames.join(", ")}${extraCount ? ` + ${extraCount} more` : ""}`
    );
  }

  async function ensureSummary() {
    const fingerprint = buildFingerprint(state.files);
    if (state.summary && state.fingerprint === fingerprint) {
      return state.summary;
    }
    setStatus("Preparing a structured summary of your uploaded data…");
    state.summary = await buildDatasetSummary(state.files);
    state.fingerprint = fingerprint;
    updateDataStatus();
    return state.summary;
  }

  function captureFiles(fileList) {
    const files = Array.from(fileList || []);
    if (!files.length) {
      return;
    }
    state.files = files;
    state.summary = null;
    state.fingerprint = "";
    updateDataStatus();
  }

  async function sendQuestion() {
    const question = inputEl.value.trim();

    if (!state.files.length) {
      appendMessage("assistant", "Upload data first, then I can answer questions grounded in those files.");
      return;
    }
    if (!consentEl.checked) {
      appendMessage("assistant", "Check the consent box first so I can send a structured summary of your data to Gemini.");
      return;
    }
    if (!question) {
      appendMessage("assistant", "Ask a specific question like “Why was my recovery lower this week?” or “What should I focus on tomorrow?”");
      return;
    }
    if (state.isSending) {
      return;
    }

    state.isSending = true;
    sendEl.disabled = true;
    suggestionEls.forEach((button) => {
      button.disabled = true;
    });

    appendMessage("user", question);
    inputEl.value = "";
    setStatus("Thinking with Gemini…");

    try {
      const datasetSummary = await ensureSummary();
      const conversation = state.messages
        .filter((message) => message.role === "user" || message.role === "assistant")
        .slice(-MAX_HISTORY_TURNS * 2);

      const response = await fetch("/.netlify/functions/gemini-assistant", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question,
          datasetSummary,
          conversation,
        }),
      });

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload.error || "Gemini request failed.");
      }

      appendMessage("assistant", payload.answer || "I couldn’t generate an answer from the current data.");
      setStatus("Data ready for follow-up questions.");
    } catch (error) {
      appendMessage(
        "assistant",
        `I hit an issue while answering that. ${error instanceof Error ? error.message : "Unknown error."}`
      );
      updateDataStatus();
    } finally {
      state.isSending = false;
      sendEl.disabled = false;
      suggestionEls.forEach((button) => {
        button.disabled = false;
      });
    }
  }

  toggle.addEventListener("click", () => {
    state.isOpen = !state.isOpen;
    syncOpenState();
  });

  consentEl.addEventListener("change", () => {
    state.consent = consentEl.checked;
    localStorage.setItem(STORAGE_KEY, String(state.consent));
  });

  sendEl.addEventListener("click", sendQuestion);

  inputEl.addEventListener("keydown", (event) => {
    if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
      event.preventDefault();
      sendQuestion();
    }
  });

  suggestionEls.forEach((button) => {
    button.addEventListener("click", () => {
      inputEl.value = button.dataset.question || "";
      inputEl.focus();
    });
  });

  document.addEventListener(
    "change",
    (event) => {
      const target = event.target;
      if (target instanceof HTMLInputElement && target.matches('[data-testid="file-input"]')) {
        captureFiles(target.files);
      }
    },
    true
  );

  updateDataStatus();
  renderMessages();
  syncOpenState();
})();
