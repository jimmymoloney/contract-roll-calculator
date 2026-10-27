/**
 * Shared shell: sidebar + topbar helpers + data-status card.
 * Thin UI glue only — uses SheetStore / AppSettings APIs as-is.
 */
(function (global) {
  "use strict";

  var ICONS = {
    dashboard: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/></svg>',
    accounts: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
    calc: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="2" width="16" height="20" rx="2"/><line x1="8" y1="6" x2="16" y2="6"/><line x1="8" y1="10" x2="10" y2="10"/><line x1="14" y1="10" x2="16" y2="10"/><line x1="8" y1="14" x2="10" y2="14"/><line x1="14" y1="14" x2="16" y2="14"/><line x1="8" y1="18" x2="10" y2="18"/><line x1="14" y1="18" x2="16" y2="18"/></svg>',
    data: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg>',
    settings: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>',
    help: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>'
  };

  function navItem(href, key, label, active) {
    var cls = active === key ? "active" : "";
    return '<a class="' + cls + '" href="' + href + '">' + ICONS[key] + '<span class="label">' + label + "</span></a>";
  }

  function getMeta() {
    if (global.SheetStore && SheetStore.meta) {
      var m = SheetStore.meta();
      if (m) return m;
    }
    if (global.SheetStore && SheetStore.load) {
      var d = SheetStore.load();
      if (d && d.rows && d.rows.length) {
        return { fileName: d.fileName || "Saved deals", count: d.rows.length };
      }
    }
    return null;
  }

  function updateStatusCard() {
    var nameEl = document.getElementById("dsFileName");
    var countEl = document.getElementById("dsDealCount");
    if (!nameEl || !countEl) return;
    var m = getMeta();
    if (!m || !m.count) {
      nameEl.textContent = "No data loaded";
      countEl.textContent = "Upload on the Data page";
    } else {
      nameEl.textContent = m.fileName || "Saved deals";
      countEl.textContent = m.count + (m.count === 1 ? " deal" : " deals");
    }
  }

  function wireClear() {
    var btn = document.getElementById("dsClearBtn");
    if (!btn) return;
    btn.addEventListener("click", function () {
      if (!confirm("Clear all deals and settings from this browser? This cannot be undone.")) return;
      if (global.AppSettings && AppSettings.clearAllData) {
        AppSettings.clearAllData();
      } else if (global.SheetStore && SheetStore.clear) {
        SheetStore.clear();
      }
      updateStatusCard();
      window.location.reload();
    });
  }

  function setEmptyState(isEmpty, contentId) {
    var emptyEl = document.getElementById("emptyState");
    var contentEl = document.getElementById(contentId || "dashContent") ||
      document.getElementById("accountsContent");
    if (emptyEl) {
      if (isEmpty) emptyEl.removeAttribute("hidden");
      else emptyEl.setAttribute("hidden", "");
    }
    if (contentEl) {
      if (isEmpty) contentEl.setAttribute("hidden", "");
      else contentEl.removeAttribute("hidden");
    }
  }

  /** Display money: $ with commas, 2 decimals, minus for negatives (UI only). */
  function formatMoney(n) {
    if (global.PMCalc && typeof PMCalc.money === "function") return PMCalc.money(n);
    if (n == null || !isFinite(Number(n))) return "—";
    var v = Number(n);
    var sign = v < 0 ? "-" : "";
    return sign + "$" + Math.abs(v).toLocaleString("en-AU", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  function toast(message) {
    var el = document.getElementById("appToast");
    if (!el) {
      el = document.createElement("div");
      el.id = "appToast";
      el.className = "app-toast";
      el.setAttribute("role", "status");
      el.setAttribute("aria-live", "polite");
      document.body.appendChild(el);
    }
    el.textContent = message || "Saved";
    el.classList.add("visible");
    clearTimeout(toast._t);
    toast._t = setTimeout(function () {
      el.classList.remove("visible");
    }, 2200);
  }

  function mountSidebar(activeKey) {
    var root = document.getElementById("sidebar-root");
    if (!root) return;
    var helpActive = activeKey === "help" ? " active" : "";
    root.innerHTML =
      '<aside class="sidebar" aria-label="Main">' +
      '<a class="sidebar-brand" href="index.html">Contract Roll Calculator</a>' +
      '<nav class="sidebar-nav">' +
      navItem("index.html", "dashboard", "Dashboard", activeKey) +
      navItem("accounts-to-roll.html", "accounts", "Accounts to roll", activeKey) +
      navItem("roll-calculator.html", "calc", "Roll calculator", activeKey) +
      navItem("data.html", "data", "Data", activeKey) +
      navItem("settings.html", "settings", "Settings", activeKey) +
      '<div class="nav-divider" role="separator" aria-hidden="true"></div>' +
      '<a class="nav-help-link' + helpActive + '" href="help.html">' +
      ICONS.help + '<span class="label">Help</span></a>' +
      "</nav>" +
      '<div class="data-status-card">' +
      '<div class="ds-label">Data</div>' +
      '<div class="ds-name" id="dsFileName">…</div>' +
      '<div class="ds-count" id="dsDealCount"></div>' +
      '<div class="ds-actions">' +
      '<a href="data.html">Replace</a>' +
      '<button type="button" id="dsClearBtn">Clear</button>' +
      "</div></div></aside>";
    updateStatusCard();
    wireClear();
  }

  function mountTopbar(title, description, extrasHtml) {
    var root = document.getElementById("topbar-root");
    if (!root) return;
    root.innerHTML =
      '<header class="topbar">' +
      '<div class="topbar-text"><h1>' + title + "</h1>" +
      (description ? '<p class="page-desc">' + description + "</p>" : "") +
      "</div>" +
      '<div class="topbar-actions">' +
      (extrasHtml || "") +
      '<a class="btn primary" href="data.html">Upload data</a>' +
      "</div></header>";
  }

  function hasData() {
    var m = getMeta();
    return !!(m && m.count);
  }

  function mountDemoFooter() {
    var content = document.querySelector(".content");
    if (!content) return;
    document.querySelectorAll(".footer-note").forEach(function (el) {
      el.remove();
    });
    if (document.getElementById("demoFooter")) return;
    var f = document.createElement("p");
    f.id = "demoFooter";
    f.className = "footer-note demo-footer";
    f.textContent = "Demo with fictional data · Data never leaves your browser";
    content.appendChild(f);
  }

  function init(opts) {
    opts = opts || {};
    mountSidebar(opts.active || "dashboard");
    if (opts.title) mountTopbar(opts.title, opts.description || "", opts.topbarExtra || "");
    updateStatusCard();
    mountDemoFooter();
    document.documentElement.classList.add("shell-ready");
  }

  global.AppShell = {
    init: init,
    updateStatusCard: updateStatusCard,
    setEmptyState: setEmptyState,
    hasData: hasData,
    getMeta: getMeta,
    formatMoney: formatMoney,
    toast: toast
  };
})(typeof window !== "undefined" ? window : globalThis);
