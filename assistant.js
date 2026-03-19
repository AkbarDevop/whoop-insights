(function () {
  const ASSISTANT_NAME = "Pulse";
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
          "I’m Pulse. Ask me about recovery, sleep, strain, lifting, or what to focus on next. I’ll stay grounded in the files you loaded and I’ll call out gaps when I see them.",
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
      gap: 12px;
      border: 0;
      border-radius: 999px;
      padding: 14px 18px 14px 16px;
      background:
        radial-gradient(circle at top left, rgba(121, 200, 255, 0.25), transparent 38%),
        linear-gradient(135deg, #0e222e, #173a46);
      color: #f4fbff;
      box-shadow: 0 18px 42px rgba(0, 0, 0, 0.28);
      cursor: pointer;
      font-weight: 700;
      font-size: 14px;
      text-align: left;
    }
    .wi-ai-fab-dot {
      width: 10px;
      height: 10px;
      border-radius: 999px;
      background: #4de2c5;
      box-shadow: 0 0 0 6px rgba(77, 226, 197, 0.14);
      flex: 0 0 auto;
    }
    .wi-ai-fab-copy {
      display: flex;
      flex-direction: column;
      gap: 2px;
      line-height: 1.1;
    }
    .wi-ai-fab-title {
      font-size: 14px;
      font-weight: 700;
      color: #f4fbff;
    }
    .wi-ai-fab-subtitle {
      font-size: 11px;
      font-weight: 500;
      color: #a9c3cc;
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
        radial-gradient(circle at top right, rgba(121, 200, 255, 0.12), transparent 28%),
        linear-gradient(180deg, rgba(19, 40, 48, 0.95), rgba(8, 19, 25, 0.92));
    }
    .wi-ai-topbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
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
    .wi-ai-close {
      border: 0;
      border-radius: 999px;
      width: 34px;
      height: 34px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      background: rgba(255, 255, 255, 0.06);
      color: #cce1e9;
      font-size: 18px;
      cursor: pointer;
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
    .wi-ai-status-row {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
      margin-top: 14px;
    }
    .wi-ai-status {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      border-radius: 999px;
      font-size: 12px;
      color: #d6f4ee;
      background: rgba(255, 255, 255, 0.06);
      border: 1px solid rgba(255, 255, 255, 0.08);
    }
    .wi-ai-status::before {
      content: "";
      width: 8px;
      height: 8px;
      border-radius: 999px;
      background: #7e9aa4;
      box-shadow: 0 0 0 4px rgba(126, 154, 164, 0.14);
      flex: 0 0 auto;
    }
    .wi-ai-status[data-tone="ready"]::before {
      background: #4de2c5;
      box-shadow: 0 0 0 4px rgba(77, 226, 197, 0.14);
    }
    .wi-ai-status[data-tone="thinking"]::before {
      background: #79c8ff;
      box-shadow: 0 0 0 4px rgba(121, 200, 255, 0.14);
    }
    .wi-ai-status[data-tone="warn"]::before {
      background: #ffd166;
      box-shadow: 0 0 0 4px rgba(255, 209, 102, 0.14);
    }
    .wi-ai-powered {
      display: inline-flex;
      align-items: center;
      padding: 8px 12px;
      border-radius: 999px;
      font-size: 11px;
      color: #9dc1cf;
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid rgba(255, 255, 255, 0.06);
    }
    .wi-ai-source-strip {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
      margin-top: 12px;
    }
    .wi-ai-source-pill {
      display: inline-flex;
      align-items: center;
      padding: 7px 10px;
      border-radius: 999px;
      font-size: 11px;
      line-height: 1.2;
      color: #dceef4;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.07);
    }
    .wi-ai-source-pill[data-tone="ready"] {
      color: #defbf5;
      background: rgba(77, 226, 197, 0.11);
      border-color: rgba(77, 226, 197, 0.18);
    }
    .wi-ai-source-pill[data-tone="partial"] {
      color: #ffe7af;
      background: rgba(255, 209, 102, 0.09);
      border-color: rgba(255, 209, 102, 0.16);
    }
    .wi-ai-note {
      margin: 12px 0 0;
      font-size: 11px;
      line-height: 1.55;
      color: #8ba5af;
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
    .wi-ai-message {
      display: flex;
      flex-direction: column;
      gap: 6px;
      max-width: 88%;
    }
    .wi-ai-message[data-role="assistant"] {
      align-self: flex-start;
    }
    .wi-ai-message[data-role="user"] {
      align-self: flex-end;
    }
    .wi-ai-message-label {
      font-size: 11px;
      line-height: 1;
      color: #8aa8b2;
      padding: 0 2px;
    }
    .wi-ai-message[data-role="user"] .wi-ai-message-label {
      text-align: right;
    }
    .wi-ai-bubble {
      padding: 12px 14px;
      border-radius: 16px;
      font-size: 13px;
      line-height: 1.6;
      white-space: pre-wrap;
    }
    .wi-ai-bubble[data-role="assistant"] {
      background: rgba(255, 255, 255, 0.06);
      border: 1px solid rgba(255, 255, 255, 0.06);
      color: #ecf7fb;
    }
    .wi-ai-bubble[data-role="user"] {
      background: rgba(77, 226, 197, 0.12);
      border: 1px solid rgba(77, 226, 197, 0.16);
      color: #f2fffc;
    }
    .wi-ai-bubble[data-loading="true"] {
      display: inline-flex;
      align-items: center;
      gap: 8px;
    }
    .wi-ai-typing {
      display: inline-flex;
      align-items: center;
      gap: 5px;
    }
    .wi-ai-typing span {
      width: 6px;
      height: 6px;
      border-radius: 999px;
      background: #9dc1cf;
      animation: wi-ai-bounce 1.05s infinite ease-in-out;
    }
    .wi-ai-typing span:nth-child(2) {
      animation-delay: 0.15s;
    }
    .wi-ai-typing span:nth-child(3) {
      animation-delay: 0.3s;
    }
    @keyframes wi-ai-bounce {
      0%, 80%, 100% {
        transform: scale(0.8);
        opacity: 0.45;
      }
      40% {
        transform: scale(1);
        opacity: 1;
      }
    }
    .wi-ai-suggestions {
      padding: 0 16px 10px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .wi-ai-suggestion-label {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: #70909b;
      font-weight: 700;
    }
    .wi-ai-suggestion-list {
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
    .wi-ai-consent-card {
      margin-bottom: 12px;
      padding: 12px 12px 10px;
      border-radius: 16px;
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid rgba(255, 255, 255, 0.06);
    }
    .wi-ai-consent-card[data-checked="true"] {
      background: rgba(77, 226, 197, 0.08);
      border-color: rgba(77, 226, 197, 0.16);
    }
    .wi-ai-consent {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      font-size: 12px;
      line-height: 1.5;
      color: #a8c1c9;
    }
    .wi-ai-consent input {
      margin-top: 2px;
    }
    .wi-ai-consent-note {
      margin-top: 8px;
      font-size: 11px;
      line-height: 1.5;
      color: #7f9aa4;
    }
    .wi-ai-input {
      width: 100%;
      min-height: 96px;
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
      .wi-ai-message {
        max-width: 100%;
      }
    }
  `;
  document.head.appendChild(style);

  const shell = document.createElement("div");
  shell.className = "wi-ai-shell";
  shell.innerHTML = `
    <div class="wi-ai-panel" data-open="false">
      <div class="wi-ai-header">
        <div class="wi-ai-topbar">
          <div class="wi-ai-kicker"><span class="wi-ai-fab-dot"></span> ${ASSISTANT_NAME}</div>
          <button type="button" class="wi-ai-close" data-ai-close aria-label="Close ${ASSISTANT_NAME}">×</button>
        </div>
        <div class="wi-ai-title">Your data-grounded training coach</div>
        <p class="wi-ai-subtitle">${ASSISTANT_NAME} helps you make sense of recovery, sleep, strain, lifting, and trends across the files you loaded. Answers stay grounded in your data, not generic advice.</p>
        <div class="wi-ai-status-row">
          <div class="wi-ai-status" data-ai-status data-tone="muted">Waiting for uploaded data…</div>
          <div class="wi-ai-powered">Powered by Gemini</div>
        </div>
        <div class="wi-ai-source-strip" data-ai-sources></div>
        <p class="wi-ai-note">Only a structured summary is sent when you ask a question. Apple Health XML stays partial in v1 because those exports can be very large.</p>
      </div>
      <div class="wi-ai-body">
        <div class="wi-ai-messages" data-ai-messages></div>
        <div class="wi-ai-suggestions">
          <div class="wi-ai-suggestion-label">Try asking</div>
          <div class="wi-ai-suggestion-list" data-ai-suggestions></div>
        </div>
        <div class="wi-ai-footer">
          <div class="wi-ai-consent-card" data-ai-consent-card data-checked="false">
            <label class="wi-ai-consent">
              <input type="checkbox" data-ai-consent />
              <span>I agree to send a structured summary of my loaded data and my question to Gemini for analysis. This is not medical advice.</span>
            </label>
            <div class="wi-ai-consent-note">Raw files stay in the browser. The assistant only sends a compact summary after you opt in.</div>
          </div>
          <textarea class="wi-ai-input" data-ai-input placeholder="Ask ${ASSISTANT_NAME} about recovery, sleep, strain, lifting, or your next 3-day focus…"></textarea>
          <div class="wi-ai-actions">
            <div class="wi-ai-hint" data-ai-hint>Tip: use exact windows like “last 7 days”, “red recovery days”, or “what should I focus on over the next 3 days?”. Press Enter to send.</div>
            <button type="button" class="wi-ai-send" data-ai-send>Ask ${ASSISTANT_NAME}</button>
          </div>
        </div>
      </div>
    </div>
    <button type="button" class="wi-ai-fab" data-ai-toggle>
      <span class="wi-ai-fab-dot"></span>
      <span class="wi-ai-fab-copy">
        <span class="wi-ai-fab-title">Ask ${ASSISTANT_NAME}</span>
        <span class="wi-ai-fab-subtitle">Recovery, sleep, strain</span>
      </span>
    </button>
  `;
  document.body.appendChild(shell);

  const panel = shell.querySelector(".wi-ai-panel");
  const toggle = shell.querySelector("[data-ai-toggle]");
  const closeEl = shell.querySelector("[data-ai-close]");
  const messagesEl = shell.querySelector("[data-ai-messages]");
  const statusEl = shell.querySelector("[data-ai-status]");
  const sourcesEl = shell.querySelector("[data-ai-sources]");
  const consentEl = shell.querySelector("[data-ai-consent]");
  const consentCardEl = shell.querySelector("[data-ai-consent-card]");
  const inputEl = shell.querySelector("[data-ai-input]");
  const hintEl = shell.querySelector("[data-ai-hint]");
  const sendEl = shell.querySelector("[data-ai-send]");
  const suggestionsEl = shell.querySelector("[data-ai-suggestions]");

  consentEl.checked = state.consent;
  consentCardEl.dataset.checked = String(state.consent);

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

  function pickField(obj, candidates) {
    const keys = Object.keys(obj || {});
    const normalizedMap = new Map(keys.map((key) => [normalizeKey(key), key]));

    for (const candidate of candidates) {
      if (normalizedMap.has(candidate)) {
        const key = normalizedMap.get(candidate);
        return { key, value: obj[key] };
      }
    }

    for (const candidate of candidates) {
      const match = Array.from(normalizedMap.entries()).find(([normalized]) => normalized.includes(candidate));
      if (match) {
        return { key: match[1], value: obj[match[1]] };
      }
    }

    return { key: "", value: "" };
  }

  function pickFirst(obj, candidates) {
    return pickField(obj, candidates).value;
  }

  function toDurationHours(obj, candidates) {
    const field = pickField(obj, candidates);
    const value = toNumber(field.value);
    if (!Number.isFinite(value)) {
      return null;
    }
    const key = normalizeKey(field.key);
    if (key.includes("ms")) {
      return round(value / 3600000, 2);
    }
    if (key.includes("sec")) {
      return round(value / 3600, 2);
    }
    if (key.includes("min")) {
      return round(value / 60, 2);
    }
    if (key.includes("hour") || key.includes("hr")) {
      return round(value, 2);
    }
    if (value > 40) {
      return round(value / 60, 2);
    }
    return round(value, 2);
  }

  function toDurationMinutes(obj, candidates) {
    const field = pickField(obj, candidates);
    const value = toNumber(field.value);
    if (!Number.isFinite(value)) {
      return null;
    }
    const key = normalizeKey(field.key);
    if (key.includes("ms")) {
      return round(value / 60000, 1);
    }
    if (key.includes("sec")) {
      return round(value / 60, 1);
    }
    if (key.includes("hour") || key.includes("hr")) {
      return round(value * 60, 1);
    }
    if (value > 360) {
      return round(value / 60, 1);
    }
    return round(value, 1);
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

  function formatDateLabel(value) {
    if (!value) {
      return "";
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return String(value);
    }
    return date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
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
      sleepHours: toDurationHours(row, ["asleep duration min", "total sleep time ms", "total sleep time"]),
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
      durationMin: toDurationMinutes(row, ["duration min", "duration minutes", "duration"]),
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

  function findLatestSummaryDate(summary) {
    const candidates = [
      summary.whoopCycles?.recentRows?.[0]?.date,
      summary.sleeps?.recentRows?.[0]?.date,
      summary.whoopWorkouts?.recentRows?.[0]?.date,
      summary.journal?.recentRows?.[0]?.date,
      summary.strong?.recentSessions?.[0]?.date,
    ].filter(Boolean);

    return candidates.sort().slice(-1)[0] || "";
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
      latestDate: "",
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

    summary.latestDate = findLatestSummaryDate(summary);
    return summary;
  }

  function setStatus(text, tone) {
    statusEl.textContent = text;
    statusEl.dataset.tone = tone || "muted";
  }

  function cleanAssistantText(text) {
    return String(text || "")
      .replace(/^\s*confidence score:.*$/gim, "")
      .replace(/^\s*confidence:.*$/gim, "")
      .replace(/^#{1,6}\s*/gm, "")
      .replace(/\*\*(.*?)\*\*/g, "$1")
      .replace(/__(.*?)__/g, "$1")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  }

  function latestTrackedDate() {
    return state.summary?.latestDate || "";
  }

  function hasFileMatch(matcher) {
    return state.files.some((file) => matcher(file.name.toLowerCase()));
  }

  function getSourceDescriptors() {
    const descriptors = [];
    if (state.summary?.whoopCycles || hasFileMatch((name) => name.includes("physiological_cycles"))) {
      descriptors.push({ label: "WHOOP recovery", tone: "ready" });
    }
    if (state.summary?.sleeps || hasFileMatch((name) => name.includes("sleeps"))) {
      descriptors.push({ label: "Sleep", tone: "ready" });
    }
    if (state.summary?.whoopWorkouts || hasFileMatch((name) => name.includes("workouts") && !name.includes("strong"))) {
      descriptors.push({ label: "WHOOP workouts", tone: "ready" });
    }
    if (state.summary?.strong || hasFileMatch((name) => name.includes("strong"))) {
      descriptors.push({ label: "Strong lifts", tone: "ready" });
    }
    const routeCount = state.files.filter((file) => file.name.toLowerCase().endsWith(".gpx")).length;
    if (routeCount) {
      descriptors.push({
        label: `${routeCount} route${routeCount === 1 ? "" : "s"}`,
        tone: "ready",
      });
    }
    if (state.summary?.appleHealth?.uploaded || hasFileMatch((name) => name === "export.xml")) {
      descriptors.push({ label: "Apple Health partial", tone: "partial" });
    }
    if (!descriptors.length) {
      descriptors.push({ label: "Upload files to unlock answers", tone: "muted" });
    }
    return descriptors;
  }

  function getSuggestionItems() {
    const anchoredDate = formatDateLabel(latestTrackedDate());
    const items = [
      {
        label: "3-day focus",
        question: anchoredDate
          ? `Based on my data through ${anchoredDate}, what is the one thing I should focus on over the next 3 days?`
          : "What is the one thing I should focus on over the next 3 days?",
      },
      {
        label: "Recovery trend",
        question: "What is dragging my recovery over the last 7 days?",
      },
    ];

    if (state.summary?.sleeps || hasFileMatch((name) => name.includes("sleeps"))) {
      items.push({
        label: "Sleep impact",
        question: "How is my sleep affecting recovery lately?",
      });
    }

    if (state.summary?.strong || hasFileMatch((name) => name.includes("strong"))) {
      items.push({
        label: "Lifting vs recovery",
        question: "Is my lifting load lining up with my recovery right now?",
      });
    } else if (state.summary?.whoopWorkouts || hasFileMatch((name) => name.includes("workouts"))) {
      items.push({
        label: "Hardest sessions",
        question: "Which workouts seem to hit me hardest lately?",
      });
    } else {
      items.push({
        label: "Tomorrow plan",
        question: anchoredDate
          ? `Looking at my latest data through ${anchoredDate}, what should I do tomorrow?`
          : "What should I do tomorrow based on my latest data?",
      });
    }

    return items.slice(0, 4);
  }

  function renderSources() {
    sourcesEl.innerHTML = "";
    getSourceDescriptors().forEach((item) => {
      const pill = document.createElement("span");
      pill.className = "wi-ai-source-pill";
      pill.dataset.tone = item.tone || "muted";
      pill.textContent = item.label;
      sourcesEl.appendChild(pill);
    });
  }

  function renderSuggestions() {
    suggestionsEl.innerHTML = "";
    getSuggestionItems().forEach((item) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "wi-ai-suggestion";
      button.textContent = item.label;
      button.dataset.question = item.question;
      button.disabled = state.isSending;
      button.addEventListener("click", () => {
        inputEl.value = item.question;
        updateComposerState();
        inputEl.focus();
      });
      suggestionsEl.appendChild(button);
    });
  }

  function createMessageElement(message) {
    const wrapper = document.createElement("div");
    wrapper.className = "wi-ai-message";
    wrapper.dataset.role = message.role;

    const label = document.createElement("div");
    label.className = "wi-ai-message-label";
    label.textContent = message.role === "assistant" ? ASSISTANT_NAME : "You";

    const bubble = document.createElement("div");
    bubble.className = "wi-ai-bubble";
    bubble.dataset.role = message.role;
    bubble.textContent = message.text;

    wrapper.appendChild(label);
    wrapper.appendChild(bubble);
    return wrapper;
  }

  function createThinkingElement() {
    const wrapper = document.createElement("div");
    wrapper.className = "wi-ai-message";
    wrapper.dataset.role = "assistant";

    const label = document.createElement("div");
    label.className = "wi-ai-message-label";
    label.textContent = ASSISTANT_NAME;

    const bubble = document.createElement("div");
    bubble.className = "wi-ai-bubble";
    bubble.dataset.role = "assistant";
    bubble.dataset.loading = "true";
    bubble.innerHTML = `
      <span class="wi-ai-typing" aria-hidden="true"><span></span><span></span><span></span></span>
      <span>Looking across your loaded data…</span>
    `;

    wrapper.appendChild(label);
    wrapper.appendChild(bubble);
    return wrapper;
  }

  function renderMessages() {
    messagesEl.innerHTML = "";
    state.messages.forEach((message) => {
      messagesEl.appendChild(createMessageElement(message));
    });
    if (state.isSending) {
      messagesEl.appendChild(createThinkingElement());
    }
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function syncOpenState() {
    panel.dataset.open = String(state.isOpen);
    toggle.setAttribute("aria-expanded", String(state.isOpen));
  }

  function appendMessage(role, text) {
    const messageText = role === "assistant" ? cleanAssistantText(text) : String(text || "").trim();
    if (!messageText) {
      return;
    }
    state.messages.push({ role, text: messageText });
    renderMessages();
  }

  function updateDataStatus() {
    if (!state.files.length) {
      setStatus("Waiting for uploaded data…", "muted");
      return;
    }

    const latestDate = latestTrackedDate();
    if (latestDate) {
      setStatus(`Ready through ${formatDateLabel(latestDate)}. Ask a follow-up.`, "ready");
      return;
    }

    setStatus(
      `${state.files.length} file${state.files.length === 1 ? "" : "s"} loaded. ${ASSISTANT_NAME} will build context when you ask.`,
      "ready"
    );
  }

  function updateComposerState() {
    consentCardEl.dataset.checked = String(consentEl.checked);
    sendEl.textContent = state.isSending ? `${ASSISTANT_NAME} is thinking…` : `Ask ${ASSISTANT_NAME}`;

    let hint = `Tip: use exact windows like “last 7 days”, “red recovery days”, or “what should I focus on over the next 3 days?”. Press Enter to send.`;
    if (!state.files.length) {
      hint = "Upload WHOOP, Strong, or route files in the dashboard first, then Pulse can answer with your data.";
    } else if (!consentEl.checked) {
      hint = "Check the consent box to unlock AI answers from your loaded data.";
    } else if (!inputEl.value.trim()) {
      hint = "Try a specific question like “What changed in my recovery over the last 7 days?”";
    } else if (state.isSending) {
      hint = `${ASSISTANT_NAME} is reviewing the trends in your loaded files now.`;
    }

    hintEl.textContent = hint;
    sendEl.disabled = state.isSending || !state.files.length || !consentEl.checked || !inputEl.value.trim();
    Array.from(suggestionsEl.querySelectorAll("button")).forEach((button) => {
      button.disabled = state.isSending;
    });
  }

  async function ensureSummary() {
    const fingerprint = buildFingerprint(state.files);
    if (state.summary && state.fingerprint === fingerprint) {
      return state.summary;
    }
    setStatus("Building your data context…", "thinking");
    state.summary = await buildDatasetSummary(state.files);
    state.fingerprint = fingerprint;
    renderSources();
    renderSuggestions();
    updateDataStatus();
    updateComposerState();
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
    renderSources();
    renderSuggestions();
    updateDataStatus();
    updateComposerState();

    ensureSummary().catch(() => {
      setStatus("I found the files, but had trouble preparing the data context.", "warn");
      renderSources();
      renderSuggestions();
      updateComposerState();
    });
  }

  async function sendQuestion() {
    const question = inputEl.value.trim();
    if (!question || state.isSending || !state.files.length || !consentEl.checked) {
      updateComposerState();
      return;
    }

    state.isSending = true;
    appendMessage("user", question);
    inputEl.value = "";
    setStatus(`${ASSISTANT_NAME} is looking across your data…`, "thinking");
    updateComposerState();
    renderMessages();

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

      state.isSending = false;
      updateComposerState();
      appendMessage("assistant", payload.answer || "I couldn’t generate an answer from the current data.");
      setStatus("Ready for another question.", "ready");
    } catch (error) {
      state.isSending = false;
      updateComposerState();
      appendMessage(
        "assistant",
        `I hit an issue while answering that. ${error instanceof Error ? error.message : "Unknown error."}`
      );
      setStatus("Something went wrong while generating that answer.", "warn");
      renderSources();
    }
  }

  toggle.addEventListener("click", () => {
    state.isOpen = !state.isOpen;
    syncOpenState();
    if (state.isOpen) {
      inputEl.focus();
    }
  });

  closeEl.addEventListener("click", () => {
    state.isOpen = false;
    syncOpenState();
  });

  consentEl.addEventListener("change", () => {
    state.consent = consentEl.checked;
    localStorage.setItem(STORAGE_KEY, String(state.consent));
    updateComposerState();
  });

  sendEl.addEventListener("click", sendQuestion);

  inputEl.addEventListener("input", updateComposerState);

  inputEl.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendQuestion();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && state.isOpen) {
      state.isOpen = false;
      syncOpenState();
    }
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
  renderSources();
  renderSuggestions();
  renderMessages();
  updateComposerState();
  syncOpenState();
})();
