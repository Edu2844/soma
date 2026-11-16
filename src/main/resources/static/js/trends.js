/* Trends: one chart per selected reading over the chosen period, plus a plain-language summary. */
(async function () {
  "use strict";
  const S = window.Soma;
  const user = S.requireAuth();
  const main = document.getElementById("main");
  const staff = S.isStaff(user);
  const other = S.viewingOther(user);   // staff looking at someone else's record
  S.renderShell(other ? "crew" : "trends", user);

  const astronautaId = S.targetAstronautId(user);
  if (!astronautaId) { window.location.href = "crew.html"; return; }

  const RANGES = [7, 14, 30, 180];
  const CHOICES = ["hr", "sleep", "bp", "spo2", "temp", "dose", "glucose", "mood"];
  const CHIP_LABEL = { hr: "Heart rate", sleep: "Sleep", bp: "Blood pressure", spo2: "SpO2", temp: "Temperature", dose: "Radiation", glucose: "Glucose", mood: "Mood" };
  const BANDS = {
    hr: () => [50, 85], sleep: p => [p.horasSuenoMin, 9], bp: p => [95, p.presionSistolicaMax], spo2: p => [p.spo2MinPct, 100],
    temp: p => [36.1, p.temperaturaMaxC], glucose: p => [p.glucosaMinMgDl, p.glucosaMaxMgDl], mood: () => [3, 5], dose: () => null
  };

  let days = 14;
  let selected = new Set(["hr", "sleep", "bp", "spo2"]);
  let ctx = null, params = S.params(null), metricas = [];

  try {
    ctx = await S.loadContext(astronautaId);
    params = S.params(ctx.mision);
    if (!other) S.setRailName(ctx.astronauta.nombre);
    await load();
  } catch (e) {
    S.showError(main, e);
  }

  async function load() {
    metricas = await S.metricsRange(astronautaId, days);
    render();
  }

  function series(key) {
    const def = S.METRICS[key];
    return metricas
      .map(m => ({ t: m.fecha, v: def.get(m) }))
      .filter(x => x.v !== null && x.v !== undefined)
      .sort((a, b) => S.toDate(a.t) - S.toDate(b.t))
      .map(x => ({ t: x.t, v: Number(x.v), level: S.levelOf(key, x.v, params) }));
  }

  function card(key) {
    const def = S.METRICS[key];
    const pts = series(key);
    const last = pts[pts.length - 1];
    const avg = pts.length ? pts.reduce((s, x) => s + x.v, 0) / pts.length : null;
    const out = pts.filter(x => x.level === "warn" || x.level === "crit").length;
    const note = def.range(params) + (pts.length ? " · " + (out ? out + " of " + pts.length + " readings out of range" : "all readings in range") : "");
    const unit = def.unit.startsWith("/") ? def.unit : " " + def.unit;
    return '<div class="panel chart-card"><div class="panel-head" style="align-items:flex-start"><div><h2>' + S.esc(def.label) + "</h2>" +
      '<div style="font-size:13px;color:var(--faint);margin-top:4px">' + S.esc(note) + "</div></div>" +
      '<div class="figures"><div><div class="k">Latest</div><div class="v">' + S.esc(last ? S.fmtNum(last.v, def.decimals) : "—") + "<small>" + S.esc(unit) + "</small></div></div>" +
      '<div><div class="k">Average</div><div class="v dim">' + S.esc(avg === null ? "—" : S.fmtNum(avg, def.decimals)) + "<small>" + S.esc(unit) + "</small></div></div>" +
      (last ? S.status(last.level) : S.status("none")) + "</div></div>" +
      S.lineChart(pts, { band: BANDS[key](params), decimals: def.decimals, unit: def.unit, label: def.label + " over the last " + days + " days" }) + "</div>";
  }

  function summary() {
    const lines = [];
    for (const key of selected) {
      const def = S.METRICS[key];
      const pts = series(key);
      if (!pts.length) { lines.push(["none", def.label + ": no readings in this period."]); continue; }
      const first = pts[0], last = pts[pts.length - 1];
      const out = pts.filter(x => x.level === "warn" || x.level === "crit").length;
      const unit = def.unit.startsWith("/") ? def.unit : " " + def.unit;
      let text = def.label + " ";
      if (pts.length > 1 && Math.abs(last.v - first.v) >= Math.max(0.05 * Math.abs(first.v), Math.pow(10, -def.decimals))) {
        text += (last.v > first.v ? "rose" : "fell") + " from " + S.fmtNum(first.v, def.decimals) + " to " + S.fmtNum(last.v, def.decimals) + unit + " since " + S.fmtDate(first.t) + ".";
      } else {
        text += "stayed steady around " + S.fmtNum(last.v, def.decimals) + unit + ".";
      }
      if (out) text += " " + out + " of " + pts.length + " readings out of range.";
      lines.push([out ? S.worst(pts.map(x => x.level)) : "ok", text]);
    }
    const order = { crit: 0, warn: 1, ok: 2, none: 3 };
    lines.sort((a, b) => order[a[0]] - order[b[0]]);
    return lines.map(([lv, t]) => '<div class="list-row"><span class="grow txt-' + (lv === "ok" ? "none" : lv) + '">' + S.esc(t) + "</span></div>").join("");
  }

  function render() {
    const a = ctx.astronauta;
    const rangeChips = RANGES.map(d => '<button type="button" class="chip" data-days="' + d + '" aria-pressed="' + (d === days) + '">' + d + " days</button>").join("");
    const metricChips = CHOICES.map(k => '<button type="button" class="chip" data-metric="' + k + '" aria-pressed="' + selected.has(k) + '">' + CHIP_LABEL[k] + "</button>").join("");
    const cards = CHOICES.filter(k => selected.has(k)).map(card).join("");
    main.innerHTML =
      (other ? S.viewingBanner(a, "trends") : "") +
      '<section class="page-head"><div><h1>Trends</h1><p>' + S.esc(a.nombre + " · last " + days + " days · " + metricas.length + " measurements") + "</p></div>" +
      '<div class="chips" role="group" aria-label="Period">' + rangeChips + "</div></section>" +
      '<div class="chips" role="group" aria-label="Readings"><span class="label">Readings</span>' + metricChips + "</div>" +
      '<section class="row"><div class="grow-2" style="flex-basis:640px"><div class="chart-grid">' +
      (cards || '<div class="panel"><p class="empty">Choose at least one reading.</p></div>') + "</div></div>" +
      '<div class="grow-1" style="flex-basis:300px"><div class="panel"><h2>What changed</h2>' + summary() + "</div></div></section>";

    main.querySelectorAll("[data-days]").forEach(b => b.addEventListener("click", async () => {
      days = Number(b.dataset.days);
      main.querySelector(".page-head p").textContent = "Loading…";
      try { await load(); } catch (e) { S.showError(main, e); }
    }));
    main.querySelectorAll("[data-metric]").forEach(b => b.addEventListener("click", () => {
      const k = b.dataset.metric;
      if (selected.has(k)) selected.delete(k); else selected.add(k);
      render();
    }));
  }
})();
