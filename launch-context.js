(function () {
  const DEMO_URL = "https://akbar-whoop-share-g87m2q.netlify.app";
  const GITHUB_URL = "https://github.com/AkbarDevop/whoop-insights";
  const THEME_KEY = "whoop-insights-theme";
  const LIGHT_THEME_COLOR = "#eef2f6";
  const DARK_THEME_COLOR = "#07131a";

  const style = document.createElement("style");
  style.textContent = `
    .wi-global-theme-toggle {
      position: fixed;
      top: 14px;
      right: 14px;
      z-index: 9997;
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 4px;
      border-radius: 999px;
      border: 1px solid hsl(var(--border));
      background: hsl(var(--card) / 0.92);
      box-shadow: 0 8px 30px rgba(15, 23, 42, 0.08);
      backdrop-filter: blur(10px);
    }
    .wi-global-theme-toggle[data-visible="false"] {
      display: none;
    }
    .wi-global-theme-option {
      border: 0;
      min-width: 64px;
      height: 34px;
      padding: 0 12px;
      border-radius: 999px;
      background: transparent;
      color: hsl(var(--muted-foreground));
      font-size: 12px;
      font-weight: 700;
      cursor: pointer;
    }
    .wi-global-theme-option[data-active="true"] {
      background: hsl(var(--primary));
      color: hsl(var(--primary-foreground));
    }
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
    .wi-launch-topbar {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 16px;
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
    .recharts-tooltip-wrapper .recharts-default-tooltip {
      background: hsl(var(--popover)) !important;
      border: 1px solid hsl(var(--border)) !important;
      border-radius: 12px !important;
      box-shadow: 0 14px 34px rgba(15, 23, 42, 0.14) !important;
      padding: 10px 12px !important;
    }
    .recharts-tooltip-wrapper .recharts-tooltip-label,
    .recharts-tooltip-wrapper .recharts-tooltip-item,
    .recharts-tooltip-wrapper .recharts-tooltip-item-name,
    .recharts-tooltip-wrapper .recharts-tooltip-item-value,
    .recharts-tooltip-wrapper .recharts-tooltip-item-separator {
      color: hsl(var(--popover-foreground)) !important;
      fill: hsl(var(--popover-foreground)) !important;
    }
    .recharts-tooltip-wrapper * {
      color: hsl(var(--popover-foreground)) !important;
    }
    .recharts-tooltip-wrapper .recharts-tooltip-label {
      margin-bottom: 4px !important;
      font-weight: 700 !important;
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
      .wi-global-theme-toggle {
        top: 10px;
        right: 10px;
      }
      .wi-global-theme-option {
        min-width: 58px;
      }
      .wi-launch-topbar {
        flex-direction: column;
        align-items: flex-start;
        gap: 10px;
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

  const themeToggle = document.createElement("div");
  themeToggle.className = "wi-global-theme-toggle";
  themeToggle.dataset.visible = "false";
  themeToggle.innerHTML = `
    <button type="button" class="wi-global-theme-option" data-theme="light">Light</button>
    <button type="button" class="wi-global-theme-option" data-theme="dark">Dark</button>
  `;
  document.body.appendChild(themeToggle);

  const themeButtons = Array.from(themeToggle.querySelectorAll("[data-theme]"));

  function getCurrentTheme() {
    try {
      const stored = localStorage.getItem(THEME_KEY);
      if (stored === "light" || stored === "dark") {
        return stored;
      }
    } catch (error) {}
    return document.documentElement.classList.contains("dark") ? "dark" : "light";
  }

  function setTheme(theme) {
    const isDark = theme === "dark";
    document.documentElement.classList.toggle("dark", isDark);
    themeButtons.forEach((button) => {
      button.dataset.active = String(button.dataset.theme === theme);
    });
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) {
      meta.setAttribute("content", isDark ? DARK_THEME_COLOR : LIGHT_THEME_COLOR);
    }
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch (error) {}
  }

  setTheme(getCurrentTheme());
  themeButtons.forEach((button) => {
    button.addEventListener("click", () => {
      setTheme(button.dataset.theme);
    });
  });

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

    const topbar = document.createElement("div");
    topbar.className = "wi-launch-topbar";
    topbar.appendChild(kicker);

    wrapper.appendChild(topbar);
    wrapper.appendChild(title);
    wrapper.appendChild(copy);
    wrapper.appendChild(actions);
    wrapper.appendChild(disclosure);

    return wrapper;
  }

  function injectLaunchContext() {
    const uploadArea = document.querySelector('[data-testid="upload-area"]');
    themeToggle.dataset.visible = String(Boolean(uploadArea));

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
    if (attempts > 60) {
      window.clearInterval(interval);
    }
  }, 300);

  const observer = new MutationObserver(() => {
    themeToggle.dataset.visible = String(Boolean(document.querySelector('[data-testid="upload-area"]')));
  });
  observer.observe(document.body, { childList: true, subtree: true });
})();
