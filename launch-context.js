(function () {
  const DEMO_URL = "https://akbar-whoop-share-g87m2q.netlify.app";
  const GITHUB_URL = "https://github.com/AkbarDevop/whoop-insights";

  const style = document.createElement("style");
  style.textContent = `
    .wi-launch-wrap {
      border: 1px solid hsl(var(--border));
      border-radius: 16px;
      padding: 20px;
      background: hsl(var(--card));
      color: hsl(var(--card-foreground));
      box-shadow: 0 1px 2px rgba(15, 23, 42, 0.06);
    }
    .wi-launch-kicker {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 6px 10px;
      border-radius: 999px;
      background: hsl(var(--primary) / 0.1);
      color: hsl(var(--primary));
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }
    .wi-launch-title {
      margin: 14px 0 8px;
      font-size: 22px;
      line-height: 1.2;
      font-weight: 700;
      letter-spacing: -0.02em;
    }
    .wi-launch-copy {
      margin: 0;
      max-width: 56ch;
      font-size: 14px;
      line-height: 1.7;
      color: hsl(var(--muted-foreground));
    }
    .wi-launch-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      margin-top: 18px;
    }
    .wi-launch-button {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      min-height: 42px;
      padding: 0 16px;
      border-radius: 10px;
      text-decoration: none;
      font-size: 13px;
      font-weight: 700;
      transition: transform 160ms ease, border-color 160ms ease, background 160ms ease;
    }
    .wi-launch-button:hover {
      transform: translateY(-1px);
    }
    .wi-launch-button-primary {
      background: hsl(var(--primary));
      color: hsl(var(--primary-foreground));
    }
    .wi-launch-button-secondary {
      border: 1px solid hsl(var(--border));
      background: hsl(var(--muted) / 0.45);
      color: hsl(var(--foreground));
    }
    .wi-launch-button-secondary:hover {
      background: hsl(var(--muted) / 0.75);
    }
    .wi-launch-disclosure {
      margin-top: 16px;
      border-radius: 14px;
      border: 1px solid hsl(var(--border));
      background: hsl(var(--muted) / 0.2);
      overflow: hidden;
    }
    .wi-launch-summary {
      list-style: none;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 14px 16px;
      cursor: pointer;
      font-size: 13px;
      font-weight: 600;
      color: hsl(var(--foreground));
    }
    .wi-launch-summary::-webkit-details-marker {
      display: none;
    }
    .wi-launch-chevron {
      font-size: 16px;
      line-height: 1;
      color: hsl(var(--muted-foreground));
      transition: transform 160ms ease;
    }
    .wi-launch-disclosure[open] .wi-launch-chevron {
      transform: rotate(180deg);
    }
    .wi-launch-body {
      padding: 0 16px 16px;
    }
    .wi-launch-grid {
      display: grid;
      gap: 14px;
      margin-top: 4px;
    }
    .wi-launch-card {
      border-radius: 14px;
      padding: 16px;
      background: hsl(var(--muted) / 0.35);
      border: 1px solid hsl(var(--border));
    }
    .wi-launch-label {
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: hsl(var(--muted-foreground));
      margin-bottom: 10px;
    }
    .wi-launch-pill-row {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
    .wi-launch-pill {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 8px 11px;
      border-radius: 999px;
      font-size: 12px;
      line-height: 1;
      border: 1px solid hsl(var(--border));
      background: hsl(var(--background));
      color: hsl(var(--foreground));
    }
    .wi-launch-pill[data-tone="ready"] {
      color: hsl(var(--primary));
      border-color: hsl(var(--primary) / 0.25);
      background: hsl(var(--primary) / 0.1);
    }
    .wi-launch-pill[data-tone="next"] {
      color: hsl(var(--foreground));
      border-color: hsl(var(--border));
      background: hsl(var(--background));
    }
    .wi-launch-privacy {
      margin-top: 18px;
      padding: 14px 16px;
      border-radius: 14px;
      border: 1px solid hsl(var(--border));
      background: hsl(var(--muted) / 0.35);
      font-size: 12px;
      line-height: 1.65;
      color: hsl(var(--muted-foreground));
    }
    .wi-launch-privacy strong {
      color: hsl(var(--foreground));
    }
    @media (min-width: 860px) {
      .wi-launch-grid {
        grid-template-columns: 1.3fr 1fr;
      }
    }
    @media (max-width: 640px) {
      .wi-launch-wrap {
        padding: 18px;
        border-radius: 14px;
      }
      .wi-launch-title {
        font-size: 20px;
      }
      .wi-launch-button {
        width: 100%;
      }
      .wi-launch-actions {
        flex-direction: column;
      }
    }
  `;
  document.head.appendChild(style);

  function createPill(label, tone) {
    const pill = document.createElement("span");
    pill.className = "wi-launch-pill";
    pill.dataset.tone = tone;
    pill.textContent = label;
    return pill;
  }

  function buildLaunchBlock() {
    const wrapper = document.createElement("section");
    wrapper.className = "wi-launch-wrap";
    wrapper.dataset.launchContext = "true";

    const kicker = document.createElement("div");
    kicker.className = "wi-launch-kicker";
    kicker.textContent = "Before you upload";

    const title = document.createElement("h2");
    title.className = "wi-launch-title";
    title.textContent = "Try the live demo or upload your own exports.";

    const copy = document.createElement("p");
    copy.className = "wi-launch-copy";
    copy.textContent =
      "WHOOP Insights connects recovery, sleep, lifting, activity, and routes in one place. If you want to get the idea first, open the demo. If you already have your files, drop them in below.";

    const actions = document.createElement("div");
    actions.className = "wi-launch-actions";
    actions.innerHTML = `
      <a class="wi-launch-button wi-launch-button-primary" href="${DEMO_URL}" target="_blank" rel="noreferrer">Open demo dashboard</a>
      <a class="wi-launch-button wi-launch-button-secondary" href="${GITHUB_URL}" target="_blank" rel="noreferrer">Star on GitHub</a>
    `;

    const supportCard = document.createElement("div");
    supportCard.className = "wi-launch-card";
    supportCard.innerHTML = '<div class="wi-launch-label">Supported now</div>';
    const supportRow = document.createElement("div");
    supportRow.className = "wi-launch-pill-row";
    ["WHOOP CSV", "Strong CSV", "Apple Health XML", "GPX routes", "Pulse AI assistant"].forEach((label) => {
      supportRow.appendChild(createPill(label, "ready"));
    });
    supportCard.appendChild(supportRow);

    const roadmapCard = document.createElement("div");
    roadmapCard.className = "wi-launch-card";
    roadmapCard.innerHTML = '<div class="wi-launch-label">Coming next</div>';
    const roadmapRow = document.createElement("div");
    roadmapRow.className = "wi-launch-pill-row";
    ["Strava", "MyFitnessPal", "Oura", "Hevy"].forEach((label) => {
      roadmapRow.appendChild(createPill(label, "next"));
    });
    roadmapCard.appendChild(roadmapRow);

    const privacy = document.createElement("p");
    privacy.className = "wi-launch-privacy";
    privacy.innerHTML =
      "<strong>Privacy note:</strong> core dashboard analysis stays in your browser. Pulse only sends a compact structured summary after you opt in, and your raw files stay local unless you choose to use AI.";

    const disclosure = document.createElement("details");
    disclosure.className = "wi-launch-disclosure";

    const summary = document.createElement("summary");
    summary.className = "wi-launch-summary";
    summary.innerHTML = `
      <span>Supported files, privacy, and what’s next</span>
      <span class="wi-launch-chevron">⌄</span>
    `;

    const body = document.createElement("div");
    body.className = "wi-launch-body";

    const grid = document.createElement("div");
    grid.className = "wi-launch-grid";
    grid.appendChild(supportCard);
    grid.appendChild(roadmapCard);

    body.appendChild(grid);
    body.appendChild(privacy);
    disclosure.appendChild(summary);
    disclosure.appendChild(body);

    wrapper.appendChild(kicker);
    wrapper.appendChild(title);
    wrapper.appendChild(copy);
    wrapper.appendChild(actions);
    wrapper.appendChild(disclosure);

    return wrapper;
  }

  function injectLaunchContext() {
    const uploadArea = document.querySelector('[data-testid="upload-area"]');
    if (!uploadArea || document.querySelector("[data-launch-context]")) {
      return;
    }

    const container = uploadArea.parentElement;
    if (!container) {
      return;
    }

    container.insertBefore(buildLaunchBlock(), uploadArea);
  }

  let attempts = 0;
  const interval = window.setInterval(() => {
    injectLaunchContext();
    attempts += 1;
    if (document.querySelector("[data-launch-context]") || attempts > 60) {
      window.clearInterval(interval);
    }
  }, 300);
})();
