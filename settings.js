/**
 * App settings — editable defaults persisted in localStorage.
 * Generic defaults (not customer-specific).
 */
(function (global) {
  "use strict";

  var SETTINGS_KEY = "pm_app_settings_v1";

  /** Known keys this app may write — used by Clear all data. */
  var ALL_STORAGE_KEYS = [
    "pm_unified_deals_v1",
    "pm_unified_deals_meta_v1",
    "pm_app_settings_v1",
    "pm_last_deals_file",
    "pm_last_accounts_file"
  ];

  var DEFAULTS = {
    factorRate: 2.0,
    myCog: 5000,
    competitorCog: 5000,
    newBwSvcCents: 0.5,
    newColourSvcCents: 5,
    contractTermMonths: 60,
    escalationPercent: 6,
    escalationEveryMonths: 6,
    earlyTerminationExtraMonths: 1,
    rollSoonWindowMonths: 6
  };

  function cloneDefaults() {
    var o = {};
    Object.keys(DEFAULTS).forEach(function (k) { o[k] = DEFAULTS[k]; });
    return o;
  }

  function load() {
    var out = cloneDefaults();
    try {
      var raw = localStorage.getItem(SETTINGS_KEY);
      if (!raw) return out;
      var saved = JSON.parse(raw);
      Object.keys(DEFAULTS).forEach(function (k) {
        if (saved[k] != null && saved[k] !== "" && isFinite(Number(saved[k]))) {
          out[k] = Number(saved[k]);
        }
      });
    } catch (e) {}
    return out;
  }

  function save(partial) {
    var current = load();
    Object.keys(DEFAULTS).forEach(function (k) {
      if (partial[k] != null && partial[k] !== "" && isFinite(Number(partial[k]))) {
        current[k] = Number(partial[k]);
      }
    });
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(current));
    } catch (e) {
      console.warn("Could not save settings", e);
    }
    applyToCalc(current);
    return current;
  }

  function resetToDefaults() {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(cloneDefaults()));
    } catch (e) {}
    var d = cloneDefaults();
    applyToCalc(d);
    return d;
  }

  /** Wipe every key this app writes (deals + settings + legacy). */
  function clearAllData() {
    ALL_STORAGE_KEYS.forEach(function (k) {
      try { localStorage.removeItem(k); } catch (e) {}
    });
    // Also remove any pm_ prefixed leftovers
    try {
      var toRemove = [];
      for (var i = 0; i < localStorage.length; i++) {
        var key = localStorage.key(i);
        if (key && key.indexOf("pm_") === 0) toRemove.push(key);
      }
      toRemove.forEach(function (k) { localStorage.removeItem(k); });
    } catch (e) {}
    applyToCalc(cloneDefaults());
  }

  function applyToCalc(s) {
    s = s || load();
    if (global.PMCalc && typeof global.PMCalc.applySettings === "function") {
      global.PMCalc.applySettings(s);
    }
  }

  function fieldLabels() {
    return {
      factorRate: "Default factor rate (e.g. 2.0 → $100,000 finances at $2,000/month)",
      myCog: "Default My COG ($)",
      competitorCog: "Default Competitor COG ($)",
      newBwSvcCents: "Default new-deal B/W service rate (¢ per page)",
      newColourSvcCents: "Default new-deal colour service rate (¢ per page)",
      contractTermMonths: "Contract term (months)",
      escalationPercent: "Escalation percent (e.g. 6 = +6%)",
      escalationEveryMonths: "Escalation every N months from start",
      earlyTerminationExtraMonths: "Extra months on competitor (external) payout",
      rollSoonWindowMonths: "“Roll soon” window (months before latest safe)"
    };
  }

  // Apply on load if PMCalc already present
  if (global.document) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", function () { applyToCalc(); });
    } else {
      applyToCalc();
    }
  } else {
    applyToCalc();
  }

  global.AppSettings = {
    SETTINGS_KEY: SETTINGS_KEY,
    ALL_STORAGE_KEYS: ALL_STORAGE_KEYS,
    DEFAULTS: DEFAULTS,
    load: load,
    save: save,
    resetToDefaults: resetToDefaults,
    clearAllData: clearAllData,
    applyToCalc: applyToCalc,
    fieldLabels: fieldLabels,
    cloneDefaults: cloneDefaults
  };
})(typeof window !== "undefined" ? window : globalThis);
