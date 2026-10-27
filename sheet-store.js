/**
 * Unified sales spreadsheet parse + localStorage share across pages.
 */
(function (global) {
  "use strict";

  var STORAGE_KEY = "pm_unified_deals_v1";
  var META_KEY = "pm_unified_deals_meta_v1";

  var HEADER_MAP = {
    "customer": "customer",
    "account name": "customer",
    "account": "customer",
    "customer name": "customer",
    "date of deal won": "date",
    "deal date": "date",
    "date": "date",
    "new devices": "devices",
    "new devices sold": "devices",
    "devices": "devices",
    "revenue": "revenue",
    "gp": "gp",
    "gross profit": "gp",
    "fixed rental": "fixedRental",
    "rental": "fixedRental",
    "b/w included": "bwVol",
    "bw included": "bwVol",
    "b/w volume": "bwVol",
    "copy cost b/w": "bwSvcCents",
    "copy cost bw": "bwSvcCents",
    "b/w service cents": "bwSvcCents",
    "rental capital b/w": "bwCapCents",
    "rental capital bw": "bwCapCents",
    "b/w capital cents": "bwCapCents",
    "colour included": "colourVol",
    "color included": "colourVol",
    "colour volume": "colourVol",
    "copy cost colour": "colourSvcCents",
    "copy cost color": "colourSvcCents",
    "colour service cents": "colourSvcCents",
    "rental capital colour": "colourCapCents",
    "rental capital color": "colourCapCents",
    "colour capital cents": "colourCapCents",
    "minimum monthly commitment": "minMonthly",
    "min monthly commitment": "minMonthly",
    "total customer commitment": "totalCommit",
    "total commitment": "totalCommit",
    "new business": "newBusiness",
    "deal print management?": "dealPrintManagement",
    "deal print management": "dealPrintManagement",
    "print management": "dealPrintManagement",
    "deal print advantage?": "dealPrintAdvantage",
    "deal print advantage": "dealPrintAdvantage",
    "print advantage": "dealPrintAdvantage",
    "deal rental?": "dealRental",
    "deal rental": "dealRental",
    "rental deal": "dealRental",
    "b/w overs": "bwOvers",
    "bw overs": "bwOvers",
    "colour overs": "colourOvers",
    "color overs": "colourOvers",
    "factor": "factor",
    "factor rate": "factor",
    "my cog": "myCog",
    "competitor cog": "compCog",
    "months elapsed": "elapsed",
    "start date": "startDate"
  };

  function normHeader(h) {
    return String(h || "").trim().toLowerCase().replace(/\s+/g, " ");
  }

  function parseDate(v) {
    if (v == null || v === "") return null;
    if (v instanceof Date && !isNaN(v.getTime())) return v;
    if (typeof v === "number" && global.XLSX) {
      var d = XLSX.SSF.parse_date_code(v);
      if (d) return new Date(d.y, d.m - 1, d.d);
    }
    var s = String(v).trim();
    if (/^\d{4}-\d{2}-\d{2}/.test(s)) return new Date(s.slice(0, 10) + "T00:00:00");

    // Month/year only: M/YYYY or MM/YYYY (e.g. 10/2026) → day 1 of that month
    var my = s.match(/^(\d{1,2})[\/\-](\d{4})$/);
    if (my) {
      var monthOnly = Number(my[1]);
      var yearOnly = Number(my[2]);
      if (monthOnly >= 1 && monthOnly <= 12) {
        return new Date(yearOnly, monthOnly - 1, 1);
      }
    }

    // Day/month/year: D/M/YYYY or M/D/YYYY — treat as D/M/YYYY (AU-style) when day ≤ 31
    var m = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
    if (m) {
      var y = Number(m[3]); if (y < 100) y += 2000;
      return new Date(y, Number(m[2]) - 1, Number(m[1]));
    }
    var iso = new Date(s);
    return isNaN(iso.getTime()) ? null : iso;
  }

  function ymd(d) {
    if (!d) return "";
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  }

  function num(v) {
    if (v == null || v === "") return null;
    if (typeof v === "number") return v;
    // Strip $ , spaces — handles "$7,265.98" and "1,550"
    var n = Number(String(v).replace(/[$,\s]/g, ""));
    return isFinite(n) ? n : null;
  }

  /**
   * Click rates on the sheet may be $/page (0.005, 0.05, 0.094) or ¢/page (0.5, 5, 7.5).
   * Rule: value > 0 and < 0.1 → dollars/page; otherwise → cents/page.
   * Always returns cents (for storage) and dollars (for calc).
   */
  function normalizeClickRate(raw) {
    var n = num(raw);
    if (n == null || n === 0) {
      return { cents: 0, dollars: 0, unit: "cents", raw: 0 };
    }
    if (n > 0 && n < 0.1) {
      return { cents: n * 100, dollars: n, unit: "dollars", raw: n };
    }
    return { cents: n, dollars: n / 100, unit: "cents", raw: n };
  }

  function formatDealDate(d) {
    if (!d) return "Unknown date";
    return d.toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" });
  }

  function displayName(row) {
    if (row.customer) return row.customer;
    var typeLabel = row.typeValid && row.dealType
      ? (global.PMCalc ? PMCalc.TYPE_LABELS[row.dealType] : row.dealType)
      : "Needs review";
    var rev = row.revenue != null ? " · $" + Math.round(row.revenue).toLocaleString("en-AU") : "";
    return "Deal " + formatDealDate(row.date) + " · " + typeLabel + rev;
  }

  function mapAoa(aoa) {
    if (!aoa || !aoa.length) return { rows: [], newBizMode: "flag" };
    var headers = aoa[0].map(normHeader);
    var idx = {};
    headers.forEach(function (h, i) {
      if (HEADER_MAP[h]) idx[HEADER_MAP[h]] = i;
    });
    if (idx.date == null) throw new Error("Could not find a “Date of Deal Won” column.");

    var rows = [];
    var flagHits = 0, numHits = 0;
    var C = global.PMCalc;

    for (var r = 1; r < aoa.length; r++) {
      var line = aoa[r];
      if (!line || !line.length) continue;
      var date = parseDate(line[idx.date]);
      if (!date) continue;

      var flags = {
        dealPrintManagement: idx.dealPrintManagement != null ? line[idx.dealPrintManagement] : "",
        dealPrintAdvantage: idx.dealPrintAdvantage != null ? line[idx.dealPrintAdvantage] : "",
        dealRental: idx.dealRental != null ? line[idx.dealRental] : ""
      };
      var resolved = C
        ? C.resolveType(flags)
        : { type: null, valid: false, reason: "Calc library missing" };

      var nbRaw = idx.newBusiness != null ? line[idx.newBusiness] : "";
      if (nbRaw !== "" && nbRaw != null) {
        var nbStr = String(nbRaw).replace(/[$,\s]/g, "");
        if (/^-?\d+(\.\d+)?$/.test(nbStr) && !C.isTruthyFlag(nbRaw) && String(nbRaw).toLowerCase() !== "no") numHits++;
        else flagHits++;
      }

      var startDate = idx.startDate != null ? parseDate(line[idx.startDate]) : null;
      var startYmd = startDate ? ymd(startDate) : ymd(date);
      var elapsedRaw = idx.elapsed != null ? num(line[idx.elapsed]) : null;
      var elapsed = elapsedRaw;
      if (elapsed == null && C) elapsed = C.monthsElapsedFromStart(startYmd);
      if (elapsed == null) elapsed = 0;

      var bwSvcR = normalizeClickRate(idx.bwSvcCents != null ? line[idx.bwSvcCents] : 0);
      var colSvcR = normalizeClickRate(idx.colourSvcCents != null ? line[idx.colourSvcCents] : 0);
      var bwCapR = normalizeClickRate(idx.bwCapCents != null ? line[idx.bwCapCents] : 0);
      var colCapR = normalizeClickRate(idx.colourCapCents != null ? line[idx.colourCapCents] : 0);
      var rateUnits = [bwSvcR, colSvcR, bwCapR, colCapR]
        .filter(function (x) { return x.raw; })
        .map(function (x) { return x.unit; });
      var rateUnitNote = "cents";
      if (rateUnits.indexOf("dollars") >= 0 && rateUnits.indexOf("cents") >= 0) rateUnitNote = "mixed";
      else if (rateUnits.indexOf("dollars") >= 0) rateUnitNote = "dollars";

      var row = {
        id: "row-" + r,
        customer: idx.customer != null ? String(line[idx.customer] || "").trim() : "",
        date: date,
        dateYmd: ymd(date),
        startDate: startYmd,
        elapsed: Math.max(0, Math.min(60, Math.round(elapsed))),
        devices: num(idx.devices != null ? line[idx.devices] : 0) || 0,
        revenue: num(idx.revenue != null ? line[idx.revenue] : 0) || 0,
        gp: num(idx.gp != null ? line[idx.gp] : 0) || 0,
        fixedRental: num(idx.fixedRental != null ? line[idx.fixedRental] : 0) || 0,
        bwVol: num(idx.bwVol != null ? line[idx.bwVol] : 0) || 0,
        colourVol: num(idx.colourVol != null ? line[idx.colourVol] : 0) || 0,
        bwSvcCents: bwSvcR.cents,
        colourSvcCents: colSvcR.cents,
        bwCapCents: bwCapR.cents,
        colourCapCents: colCapR.cents,
        bwSvcDollars: bwSvcR.dollars,
        colourSvcDollars: colSvcR.dollars,
        bwCapDollars: bwCapR.dollars,
        colourCapDollars: colCapR.dollars,
        rateUnitNote: rateUnitNote,
        minMonthly: num(idx.minMonthly != null ? line[idx.minMonthly] : 0) || 0,
        totalCommit: num(idx.totalCommit != null ? line[idx.totalCommit] : 0) || 0,
        newBusinessRaw: nbRaw,
        newBusinessFlag: C ? C.isTruthyFlag(nbRaw) : false,
        newBusinessNum: num(nbRaw) || 0,
        dealPrintManagement: flags.dealPrintManagement,
        dealPrintAdvantage: flags.dealPrintAdvantage,
        dealRental: flags.dealRental,
        dealType: resolved.type,
        typeValid: resolved.valid,
        typeIssue: resolved.reason,
        bwOvers: idx.bwOvers != null ? (num(line[idx.bwOvers]) || 0) : 0,
        colourOvers: idx.colourOvers != null ? (num(line[idx.colourOvers]) || 0) : 0,
        factor: idx.factor != null && num(line[idx.factor]) != null
          ? num(line[idx.factor])
          : (global.AppSettings ? AppSettings.load().factorRate : 2.0),
        myCog: idx.myCog != null && num(line[idx.myCog]) != null
          ? num(line[idx.myCog])
          : (global.AppSettings ? AppSettings.load().myCog : 5000),
        compCog: idx.compCog != null && num(line[idx.compCog]) != null
          ? num(line[idx.compCog])
          : (global.AppSettings ? AppSettings.load().competitorCog : 5000)
      };
      row.displayName = displayName(row);
      rows.push(row);
    }

    return {
      rows: rows,
      newBizMode: numHits > flagHits ? "numeric" : "flag"
    };
  }

  function serializeRows(rows) {
    return rows.map(function (r) {
      var copy = Object.assign({}, r);
      copy.date = r.dateYmd || ymd(r.date);
      return copy;
    });
  }

  function reviveRows(rows) {
    return (rows || []).map(function (r) {
      var copy = Object.assign({}, r);
      copy.date = parseDate(r.date) || parseDate(r.dateYmd);
      copy.dateYmd = r.dateYmd || ymd(copy.date);
      copy.displayName = displayName(copy);
      return copy;
    });
  }

  function save(payload) {
    var data = {
      rows: serializeRows(payload.rows || []),
      newBizMode: payload.newBizMode || "flag",
      fileName: payload.fileName || "",
      savedAt: new Date().toISOString()
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      localStorage.setItem(META_KEY, JSON.stringify({ fileName: data.fileName, savedAt: data.savedAt, count: data.rows.length }));
    } catch (e) {
      console.warn("Could not save deals to localStorage", e);
    }
    return data;
  }

  function load() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      var data = JSON.parse(raw);
      return {
        rows: reviveRows(data.rows),
        newBizMode: data.newBizMode || "flag",
        fileName: data.fileName || "",
        savedAt: data.savedAt || null
      };
    } catch (e) {
      return null;
    }
  }

  function clear() {
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(META_KEY);
    } catch (e) {}
  }

  function meta() {
    try {
      return JSON.parse(localStorage.getItem(META_KEY) || "null");
    } catch (e) {
      return null;
    }
  }

  /** Convert a stored deal row into calculator inputs. */
  function toCalcInput(row, overrides) {
    overrides = overrides || {};
    return Object.assign({
      dealType: row.dealType,
      customer: row.customer || row.displayName,
      fixedRental: row.fixedRental,
      bwVol: row.bwVol,
      colourVol: row.colourVol,
      bwCapCents: row.bwCapCents,
      colourCapCents: row.colourCapCents,
      bwSvcCents: row.bwSvcCents,
      colourSvcCents: row.colourSvcCents,
      bwCapDollars: row.bwCapDollars,
      colourCapDollars: row.colourCapDollars,
      bwSvcDollars: row.bwSvcDollars,
      colourSvcDollars: row.colourSvcDollars,
      factor: row.factor,
      myCog: row.myCog,
      compCog: row.compCog,
      bwOvers: row.bwOvers,
      colourOvers: row.colourOvers,
      newBwSvcCents: global.AppSettings ? AppSettings.load().newBwSvcCents : 0.5,
      newColourSvcCents: global.AppSettings ? AppSettings.load().newColourSvcCents : 5,
      startDate: row.startDate || row.dateYmd,
      elapsed: row.elapsed
    }, overrides);
  }

  function ensureXlsx() {
    if (!global.XLSX) {
      throw new Error(
        "Spreadsheet library (SheetJS) did not load. Open this page in Chrome, Edge, or Safari (not Cursor’s preview), and keep the vendor/xlsx.full.min.js file next to these pages."
      );
    }
  }

  function parseFileArrayBuffer(buffer) {
    ensureXlsx();
    var wb = XLSX.read(new Uint8Array(buffer), { type: "array", cellDates: true });
    var aoa = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1, defval: "" });
    return mapAoa(aoa);
  }

  function parseCsvText(text) {
    ensureXlsx();
    var wb = XLSX.read(text, { type: "string" });
    var aoa = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1, defval: "" });
    return mapAoa(aoa);
  }

  /** Prefer embedded sample (no network / no file:// fetch). */
  function loadSampleData() {
    if (global.SAMPLE_DEALS_CSV) {
      return parseCsvText(global.SAMPLE_DEALS_CSV);
    }
    throw new Error(
      "Embedded sample missing. Use “Download sample CSV”, then “Choose spreadsheet” to pick that file."
    );
  }

  global.SheetStore = {
    STORAGE_KEY: STORAGE_KEY,
    HEADER_MAP: HEADER_MAP,
    mapAoa: mapAoa,
    save: save,
    load: load,
    clear: clear,
    meta: meta,
    toCalcInput: toCalcInput,
    ensureXlsx: ensureXlsx,
    parseFileArrayBuffer: parseFileArrayBuffer,
    parseCsvText: parseCsvText,
    parseDate: parseDate,
    normalizeClickRate: normalizeClickRate,
    num: num,
    loadSampleData: loadSampleData,
    displayName: displayName,
    ymd: ymd,
    moneyDash: function (n) {
      return global.PMCalc ? PMCalc.money(n) : String(n);
    }
  };
})(typeof window !== "undefined" ? window : globalThis);
