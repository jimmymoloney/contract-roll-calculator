/**
 * Shared deal engines: Print Management | Print Advantage | Rental.
 * External payout includes configurable early-termination extra months (default +1).
 * Business knobs come from AppSettings when available.
 */
(function (global) {
  "use strict";

  var cfg = {
    termMonths: 60,
    escalationFactor: 1.06,
    escalationEveryMonths: 6,
    earlyTerminationExtraMonths: 1,
    factorRate: 2.0,
    myCog: 5000,
    competitorCog: 5000,
    newBwSvcCents: 0.5,
    newColourSvcCents: 5,
    rollSoonWindowMonths: 6
  };

  function applySettings(s) {
    if (!s) return;
    if (s.contractTermMonths != null) cfg.termMonths = Math.max(1, Number(s.contractTermMonths) || 60);
    if (s.escalationPercent != null) {
      cfg.escalationFactor = 1 + (Number(s.escalationPercent) || 0) / 100;
    }
    if (s.escalationEveryMonths != null) {
      cfg.escalationEveryMonths = Math.max(1, Number(s.escalationEveryMonths) || 6);
    }
    if (s.earlyTerminationExtraMonths != null) {
      cfg.earlyTerminationExtraMonths = Math.max(0, Number(s.earlyTerminationExtraMonths) || 0);
    }
    if (s.factorRate != null) cfg.factorRate = Number(s.factorRate) || cfg.factorRate;
    if (s.myCog != null) cfg.myCog = Number(s.myCog) || 0;
    if (s.competitorCog != null) cfg.competitorCog = Number(s.competitorCog) || 0;
    if (s.newBwSvcCents != null) cfg.newBwSvcCents = Number(s.newBwSvcCents);
    if (s.newColourSvcCents != null) cfg.newColourSvcCents = Number(s.newColourSvcCents);
    if (s.rollSoonWindowMonths != null) {
      cfg.rollSoonWindowMonths = Math.max(0, Number(s.rollSoonWindowMonths) || 0);
    }
  }

  // Pull settings if already loaded
  if (global.AppSettings) {
    try { applySettings(global.AppSettings.load()); } catch (e) {}
  }

  var TYPES = {
    printManagement: "printManagement",
    printAdvantage: "printAdvantage",
    rental: "rental"
  };
  var TYPE_LABELS = {
    printManagement: "Print Management",
    printAdvantage: "Print Advantage",
    rental: "Rental"
  };

  function round2(n) {
    return Math.round(n * 100) / 100;
  }

  function centsToDollars(c) {
    return (Number(c) || 0) / 100;
  }

  function money(n) {
    if (!isFinite(n)) return "—";
    var sign = n < 0 ? "-" : "";
    return sign + "$" + Math.abs(n).toLocaleString("en-AU", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  function escalationCount(monthElapsed) {
    var every = cfg.escalationEveryMonths || 6;
    return Math.floor(Math.max(0, monthElapsed) / every);
  }

  function isTruthyFlag(v) {
    if (v === true || v === 1) return true;
    var s = String(v == null ? "" : v).trim().toLowerCase();
    return s === "yes" || s === "y" || s === "true" || s === "1" || s === "x";
  }

  /** Resolve exactly one deal type from flag fields. */
  function resolveType(flags) {
    var hits = [];
    if (isTruthyFlag(flags.dealPrintManagement)) hits.push(TYPES.printManagement);
    if (isTruthyFlag(flags.dealPrintAdvantage)) hits.push(TYPES.printAdvantage);
    if (isTruthyFlag(flags.dealRental)) hits.push(TYPES.rental);
    if (hits.length === 1) return { type: hits[0], valid: true, reason: null };
    if (hits.length === 0) return { type: null, valid: false, reason: "No deal type flagged" };
    return { type: null, valid: false, reason: "More than one deal type flagged" };
  }

  function rateDollars(inp, centsKey, dollarsKey) {
    if (inp[dollarsKey] != null) return Number(inp[dollarsKey]) || 0;
    return centsToDollars(inp[centsKey]);
  }

  function newDealBaseService(inp, type) {
    if (type === TYPES.rental) return 0;
    var bwCents = inp.newBwSvcCents != null ? inp.newBwSvcCents : cfg.newBwSvcCents;
    var colCents = inp.newColourSvcCents != null ? inp.newColourSvcCents : cfg.newColourSvcCents;
    var bw = inp.newBwSvcDollars != null ? Number(inp.newBwSvcDollars) : centsToDollars(bwCents);
    var col = inp.newColourSvcDollars != null ? Number(inp.newColourSvcDollars) : centsToDollars(colCents);
    return round2((Number(inp.bwVol) || 0) * bw + (Number(inp.colourVol) || 0) * col);
  }

  function derivedForType(inp) {
    var type = inp.dealType || TYPES.printManagement;
    var bwVol = Number(inp.bwVol) || 0;
    var colourVol = Number(inp.colourVol) || 0;
    var fixedRental = Number(inp.fixedRental) || 0;
    var bwCap = rateDollars(inp, "bwCapCents", "bwCapDollars");
    var colCap = rateDollars(inp, "colourCapCents", "colourCapDollars");
    var bwCopy = rateDollars(inp, "bwSvcCents", "bwSvcDollars"); // copy cost
    var colCopy = rateDollars(inp, "colourSvcCents", "colourSvcDollars");

    if (type === TYPES.printManagement) {
      var capital = bwVol * bwCap + colourVol * colCap;
      var service = bwVol * bwCopy + colourVol * colCopy;
      return {
        type: type,
        fixedRental: 0,
        capitalMonthly: round2(capital),
        serviceMonthly: round2(service),
        totalMonthly: round2(capital + service),
        bwCap: bwCap,
        colourCap: colCap,
        bwCopy: bwCopy,
        colourCopy: colCopy
      };
    }

    if (type === TYPES.printAdvantage) {
      var svc = bwVol * bwCopy + colourVol * colCopy;
      return {
        type: type,
        fixedRental: round2(fixedRental),
        capitalMonthly: round2(fixedRental), // "capital" for payout = rental
        serviceMonthly: round2(svc),
        totalMonthly: round2(fixedRental + svc),
        bwCap: 0,
        colourCap: 0,
        bwCopy: bwCopy,
        colourCopy: colCopy
      };
    }

    // Rental — minimum is rental only
    return {
      type: type,
      fixedRental: round2(fixedRental),
      capitalMonthly: round2(fixedRental),
      serviceMonthly: 0,
      totalMonthly: round2(fixedRental),
      bwCap: 0,
      colourCap: 0,
      bwCopy: bwCopy,
      colourCopy: colCopy
    };
  }

  function oversCredit(inp, d) {
    // Overs only reduce internal payout on Print Management
    if (d.type !== TYPES.printManagement) return 0;
    var bwOvers = Number(inp.bwOvers) || 0;
    var colourOvers = Number(inp.colourOvers) || 0;
    return round2(bwOvers * d.bwCap + colourOvers * d.colourCap);
  }

  /** Totals at month M depending on deal type. */
  function totalsAtMonth(d, monthElapsed) {
    var n = escalationCount(monthElapsed);

    if (d.type === TYPES.rental) {
      return {
        total: d.totalMonthly,
        service: 0,
        capital: d.capitalMonthly,
        escalations: 0
      };
    }

    if (d.type === TYPES.printAdvantage) {
      // Escalation % on service portion only; rental flat
      var service = round2(d.serviceMonthly * Math.pow(cfg.escalationFactor, n));
      var total = round2(d.fixedRental + service);
      return {
        total: total,
        service: service,
        capital: d.fixedRental,
        escalations: n
      };
    }

    // Print Management — escalation on whole total; capital fixed; extra on service
    var totalPM = round2(d.totalMonthly * Math.pow(cfg.escalationFactor, n));
    var servicePM = round2(totalPM - d.capitalMonthly);
    return {
      total: totalPM,
      service: servicePM,
      capital: d.capitalMonthly,
      escalations: n
    };
  }

  function buildRows(inp) {
    var type = inp.dealType || TYPES.printManagement;
    inp = Object.assign({}, inp, { dealType: type });
    var d = derivedForType(inp);
    var credit = oversCredit(inp, d);
    var baseSvcNew = newDealBaseService(inp, type);
    var factor = Number(inp.factor);
    if (!factor) factor = cfg.factorRate;
    var myCog = inp.myCog != null && inp.myCog !== "" ? Number(inp.myCog) : cfg.myCog;
    var compCog = inp.compCog != null && inp.compCog !== "" ? Number(inp.compCog) : cfg.competitorCog;
    var TERM = cfg.termMonths;
    var extra = cfg.earlyTerminationExtraMonths;
    var rows = [];
    var m;
    for (m = 0; m <= TERM; m++) {
      var rem = TERM - m;
      var t = totalsAtMonth(d, m);
      var intBase = d.capitalMonthly * rem; // rental or capital monthly
      var intPayout = round2(Math.max(0, intBase - credit));
      var extMonths = rem + extra;
      var extPayout = round2(t.total * extMonths);
      var compFinMonthly = factor > 0 ? (extPayout + compCog) * factor / 100 : 0;
      var replica = round2(compFinMonthly + baseSvcNew);
      var atRisk = replica <= t.total;
      var financeRoom = round2(t.total - baseSvcNew);
      var maxPrincipal = factor > 0 ? financeRoom * 100 / factor : 0;
      var gp = maxPrincipal - intPayout - myCog;
      rows.push({
        month: m,
        remaining: rem,
        totalMin: t.total,
        serviceMonthly: t.service,
        capitalMonthly: d.capitalMonthly,
        fixedRental: d.fixedRental,
        escalations: t.escalations,
        oversCredit: credit,
        intPayout: intPayout,
        extPayout: extPayout,
        extMonthsUsed: extMonths,
        compFinMonthly: round2(compFinMonthly),
        replica: replica,
        atRisk: atRisk,
        baseSvcNew: baseSvcNew,
        financeRoom: financeRoom,
        maxPrincipal: round2(maxPrincipal),
        gp: round2(gp),
        dealType: type
      });
    }
    return { rows: rows, derived: d, oversCredit: credit, baseSvcNew: baseSvcNew, dealType: type };
  }

  function findSafe(rows) {
    var firstRisk = null;
    var lastSafe = null;
    var TERM = cfg.termMonths;
    var i;
    for (i = 0; i < rows.length; i++) {
      var r = rows[i];
      if (r.atRisk && firstRisk === null) firstRisk = r;
      if (!r.atRisk && r.month < TERM) lastSafe = r;
    }
    return { firstRisk: firstRisk, lastSafe: lastSafe };
  }

  function snapshotAt(inp, monthElapsed) {
    var built = buildRows(inp);
    var TERM = cfg.termMonths;
    var m = Math.max(0, Math.min(TERM, Math.round(Number(monthElapsed) || 0)));
    var row = built.rows[m];
    var safe = findSafe(built.rows);
    var monthsUntilRisk = safe.firstRisk ? safe.firstRisk.month - m : null;
    var pastSafe = safe.lastSafe ? m > safe.lastSafe.month : true;
    return {
      month: m,
      row: row,
      derived: built.derived,
      oversCredit: built.oversCredit,
      dealType: built.dealType,
      lastSafeMonth: safe.lastSafe ? safe.lastSafe.month : null,
      firstRiskMonth: safe.firstRisk ? safe.firstRisk.month : null,
      monthsUntilRisk: monthsUntilRisk,
      atRiskNow: row.atRisk,
      pastSafe: pastSafe,
      rows: built.rows
    };
  }

  function priorityBucket(snap, soonWindow) {
    var n = soonWindow == null ? cfg.rollSoonWindowMonths : Number(soonWindow);
    if (snap.atRiskNow || snap.pastSafe) return "now";
    if (snap.lastSafeMonth == null) return "now";
    if (snap.lastSafeMonth - snap.month <= n) return "soon";
    return "build";
  }

  function monthsElapsedFromStart(startDateStr, asOfDate) {
    if (!startDateStr) return null;
    var start = new Date(startDateStr + (String(startDateStr).length === 10 ? "T00:00:00" : ""));
    if (isNaN(start.getTime())) return null;
    var asOf = asOfDate || new Date();
    var months = (asOf.getFullYear() - start.getFullYear()) * 12 + (asOf.getMonth() - start.getMonth());
    if (asOf.getDate() < start.getDate()) months -= 1;
    return Math.max(0, Math.min(cfg.termMonths, months));
  }

  function toQuery(inp) {
    var p = new URLSearchParams();
    var keys = [
      "dealType", "customer", "fixedRental", "bwVol", "colourVol",
      "bwCapCents", "colourCapCents", "bwSvcCents", "colourSvcCents",
      "factor", "myCog", "compCog", "bwOvers", "colourOvers",
      "newBwSvcCents", "newColourSvcCents", "startDate", "elapsed"
    ];
    keys.forEach(function (k) {
      if (inp[k] != null && inp[k] !== "") p.set(k, String(inp[k]));
    });
    return p.toString();
  }

  global.PMCalc = {
    get TERM() { return cfg.termMonths; },
    get ESCALATION() { return cfg.escalationFactor; },
    getConfig: function () { return Object.assign({}, cfg); },
    applySettings: applySettings,
    TYPES: TYPES,
    TYPE_LABELS: TYPE_LABELS,
    round2: round2,
    centsToDollars: centsToDollars,
    money: money,
    escalationCount: escalationCount,
    isTruthyFlag: isTruthyFlag,
    resolveType: resolveType,
    derivedForType: derivedForType,
    derivedFrom: derivedForType,
    oversCredit: oversCredit,
    totalsAtMonth: function (baseOrDerived, capitalOrMonth, maybeMonth) {
      // Back-compat: totalsAtMonth(derived, month) OR legacy (baseTotal, capital, month)
      if (typeof baseOrDerived === "object" && baseOrDerived.type) {
        return totalsAtMonth(baseOrDerived, capitalOrMonth);
      }
      var fake = {
        type: TYPES.printManagement,
        totalMonthly: baseOrDerived,
        capitalMonthly: capitalOrMonth,
        fixedRental: 0,
        serviceMonthly: round2(baseOrDerived - capitalOrMonth)
      };
      return totalsAtMonth(fake, maybeMonth);
    },
    buildRows: buildRows,
    findSafe: findSafe,
    snapshotAt: snapshotAt,
    priorityBucket: priorityBucket,
    monthsElapsedFromStart: monthsElapsedFromStart,
    toQuery: toQuery,
    newDealBaseService: newDealBaseService
  };
})(typeof window !== "undefined" ? window : globalThis);
