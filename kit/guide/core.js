// Shared helpers: text formatting, Big O chips, a step-through engine and drawing helpers.
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
// `code` spans and **bold**; " -> " becomes an arrow.
function rich(text) {
  return String(text).split("`").map((part, i) =>
    i % 2 ? `<code>${esc(part)}</code>`
      : esc(part).replace(/\*\*(.+?)\*\*/g, "<b>$1</b>").replace(/ -&gt; /g, " → ")
  ).join("");
}
function cxClass(t) {
  if (/!|\^N|\^n|2\^|26\^|3\^/.test(t)) return "oexp";
  if (/\^2|×/.test(t)) return "on2";
  if (/^O\(log/.test(t)) return "ologn";
  if (/log/.test(t)) return "onlogn";
  if (/^O\(1\)$/.test(t)) return "o1";
  return "on";
}
const prettyO = t => t.replace(/\^2/g, "²").replace(/log_t/g, "logₜ").replace(/\^N/g, "ᴺ");
const cx = t => `<span class="cx ${cxClass(t)}">${esc(prettyO(t))}</span>`;

// Light highlighting for the language-neutral pseudocode.
const KW = /\b(function|for|each|from|to|down|in|while|if|else|return|repeat|times|loop|break|continue|not|and|or|null|true|false|none|infinity|swap|append|push|pop|enqueue|dequeue|step|new|with|is|of|AND|OR|NOT|mod)\b/g;
function highlight(code) {
  const kw = KW.source.slice(3, -3); // the alternation inside \b(...)\b
  const re = new RegExp(`(".*?")|\\b(\\d+(?:\\.\\d+)?)\\b|\\b(${kw})\\b|\\b([a-z][A-Za-z0-9]*)(?=\\()`, "g");
  return code.split("\n").map(line => {
    const ci = line.indexOf("//");
    const body = ci >= 0 ? line.slice(0, ci) : line, com = ci >= 0 ? line.slice(ci) : "";
    const h = body.replace(/[&<>]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c])).replace(re, (m, str, n, k, f) =>
      str ? `<span class="s">${str}</span>` : n ? `<span class="n">${n}</span>` : k ? `<span class="k">${k}</span>` : `<span class="f">${f}</span>`);
    return h + (com ? `<span class="c">${esc(com)}</span>` : "");
  }).join("\n");
}

// Small seeded generator (mulberry32) so visualizers are reproducible.
function rngFrom(seed) {
  let a = seed >>> 0;
  const next = () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  return { next, int: (lo, hi) => lo + Math.floor(next() * (hi - lo + 1)) };
}
const randomSeed = () => (Math.random() * 2 ** 32) >>> 0;

function toast(msg) {
  let t = $(".toast");
  if (!t) { t = document.createElement("div"); t.className = "toast"; t.setAttribute("role", "status"); document.body.append(t); }
  t.textContent = msg; t.classList.add("show");
  clearTimeout(toast.timer); toast.timer = setTimeout(() => t.classList.remove("show"), 1600);
}

/* ---------- Step-through engine ----------
   cfg: { title, inputs (html), build(host, action) -> frames, render(frame, stage), speed, note }
   A frame is { msg, counters?, ...state }. Buttons with data-op inside the inputs call build(host, op). */
function stepper(host, cfg) {
  host.classList.add("viz");
  host.innerHTML = `
    <div class="viz-head"><span class="viz-title">${esc(cfg.title)}</span><span class="viz-badge" data-badge></span></div>
    ${cfg.inputs ? `<div class="viz-inputs">${cfg.inputs}</div>` : ""}
    <div class="viz-stage" data-stage></div>
    <p class="viz-caption" data-caption aria-live="polite"></p>
    <div class="viz-controls">
      <button class="vbtn" data-act="reset" title="Back to the first step" aria-label="Back to the first step">⟲</button>
      <button class="vbtn" data-act="prev" aria-label="Previous step">◀</button>
      <button class="vbtn primary" data-act="play">▶ Play</button>
      <button class="vbtn" data-act="next" aria-label="Next step">Step ▶</button>
      <span class="viz-counters" data-counters></span>
    </div>
    ${cfg.note ? `<p class="viz-note">${rich(cfg.note)}</p>` : ""}`;
  const stage = $("[data-stage]", host), cap = $("[data-caption]", host), badge = $("[data-badge]", host), counters = $("[data-counters]", host);
  const playBtn = $('[data-act="play"]', host);
  let frames = [{ msg: "" }], i = 0, timer = null;
  function show() {
    const f = frames[i];
    cfg.render(f, stage, host);
    cap.innerHTML = rich(f.msg || "");
    badge.textContent = frames.length > 1 ? `Step ${i} of ${frames.length - 1}` : "";
    counters.innerHTML = f.counters ? Object.entries(f.counters).map(([k, v]) => `<span><b>${esc(v)}</b> ${esc(k)}</span>`).join("") : "";
    $('[data-act="prev"]', host).disabled = $('[data-act="reset"]', host).disabled = i === 0;
    $('[data-act="next"]', host).disabled = i >= frames.length - 1;
    playBtn.disabled = frames.length < 2;
  }
  function stop() { clearInterval(timer); timer = null; playBtn.textContent = "▶ Play"; }
  function play() {
    if (timer) return stop();
    if (i >= frames.length - 1) i = 0, show();
    playBtn.textContent = "❚❚ Pause";
    timer = setInterval(() => { if (i < frames.length - 1) { i++; show(); } if (i >= frames.length - 1) stop(); }, cfg.speed || 750);
  }
  function rebuild(action, autoplay) {
    stop();
    try { frames = cfg.build(host, action); }
    catch (e) { frames = [{ msg: "Something went wrong: " + e.message }]; console.error(e); }
    if (!frames.length) frames = [{ msg: "" }];
    i = 0; show();
    if (autoplay && frames.length > 1) play();
  }
  host.addEventListener("click", e => {
    const act = e.target.closest("[data-act]")?.dataset.act;
    if (act === "prev" && i > 0) { stop(); i--; show(); }
    else if (act === "next" && i < frames.length - 1) { stop(); i++; show(); }
    else if (act === "reset") { stop(); i = 0; show(); }
    else if (act === "play") play();
    const op = e.target.closest("[data-op]")?.dataset.op;
    if (op) rebuild(op, true);
  });
  host.addEventListener("change", e => {
    if (e.target.closest(".viz-inputs") && !e.target.closest("[data-noauto]")) rebuild(null, false);
  });
  host.addEventListener("keydown", e => {
    if (e.key === "Enter" && e.target.matches(".viz-inputs input") && cfg.enterOp) { e.preventDefault(); rebuild(cfg.enterOp, true); }
  });
  rebuild(null, false);
  return { rebuild, get frames() { return frames; }, get index() { return i; }, last() { stop(); i = frames.length - 1; show(); } };
}
const val = (host, name) => $(`[name="${name}"]`, host)?.value ?? "";
const num = (host, name, lo, hi, dflt) => {
  const v = parseInt(val(host, name), 10);
  return Number.isFinite(v) ? Math.max(lo, Math.min(hi, v)) : dflt;
};

/* ---------- Drawing helpers ---------- */
// A row of array cells. o.marks: {i: class}, o.ptrs: {i: label}, o.cap: total slots, o.idx: show indexes.
function cells(arr, o = {}) {
  const n = Math.max(arr.length, o.cap || 0);
  let h = `<div class="scroller"><div class="cells">`;
  for (let i = 0; i < n; i++) {
    const v = arr[i], empty = v === undefined || v === null || v === "";
    const cls = (o.marks && o.marks[i]) || "";
    h += `<div class="cell ${cls}${empty ? " empty" : ""}${o.wide ? " wide" : ""}">${empty ? "" : esc(v)}`
      + (o.idx === false ? "" : `<span class="ci">${i}</span>`)
      + (o.ptrs && o.ptrs[i] ? `<span class="cp">${esc(o.ptrs[i])}</span>` : "") + `</div>`;
  }
  return h + `</div></div>`;
}
const chips = (items, cls = () => "") => `<div class="vchips">${items.length ? items.map((x, i) => `<span class="vchip ${cls(x, i)}">${esc(x)}</span>`).join("") : `<span class="vchip empty">empty</span>`}</div>`;

// Binary tree drawn by in-order position. Node: {k, l, r, cls, sub}. Edges into a node use node.ecls.
function binTree(root, o = {}) {
  const nodes = []; let x = 0, maxD = 0;
  (function walk(n, d) { if (!n) return; walk(n.l, d + 1); n._x = x++; n._d = d; maxD = Math.max(maxD, d); nodes.push(n); walk(n.r, d + 1); })(root, 0);
  if (!nodes.length) return `<p class="viz-note">(empty tree)</p>`;
  const W = o.w || 42, H = o.h || 56, R = o.r || 16, top = R + 6, sub = nodes.some(n => n.sub != null) ? 14 : 0;
  const w = Math.max(x * W, 120), h = maxD * H + top + R + 8 + sub;
  const off = (w - x * W) / 2, cx = n => off + n._x * W + W / 2, cy = n => n._d * H + top;
  let edges = "", body = "";
  for (const n of nodes) {
    for (const c of [n.l, n.r]) if (c) edges += `<line class="te ${c.ecls || ""}" x1="${cx(n)}" y1="${cy(n)}" x2="${cx(c)}" y2="${cy(c)}"/>`;
    body += `<g class="tn ${n.cls || ""}"><circle cx="${cx(n)}" cy="${cy(n)}" r="${R}"/><text x="${cx(n)}" y="${cy(n)}">${esc(n.k)}</text>`
      + (n.sub != null ? `<text class="tsub" x="${cx(n)}" y="${cy(n) + R + 9}">${esc(n.sub)}</text>` : "") + `</g>`;
  }
  return `<div class="svgwrap"><svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(o.label || "tree")}">${edges}${body}</svg></div>`;
}

// N-ary tree laid out by leaf order. Node: {label | keys:[], kids:[], cls, ecls}.
function naryTree(root, o = {}) {
  if (!root) return `<p class="viz-note">(empty)</p>`;
  const gap = o.gap || 10, H = o.h || 58, bh = o.bh || 30, cw = o.cw || 26;
  const width = n => n.keys ? Math.max(1, n.keys.length) * cw + 4 : Math.max(30, String(n.wl ?? n.label).length * 8.4 + 16);
  let cursor = 0, maxD = 0;
  (function lay(n, d) {
    n._d = d; n._w = width(n); maxD = Math.max(maxD, d);
    const kids = n.kids || [];
    if (!kids.length) { n._x = cursor + n._w / 2; cursor += n._w + gap; return; }
    kids.forEach(k => lay(k, d + 1));
    n._x = (kids[0]._x + kids[kids.length - 1]._x) / 2;
    const leftEdge = n._x - n._w / 2;
    if (leftEdge < 0) { const s = -leftEdge; (function shift(m) { m._x += s; (m.kids || []).forEach(shift); })(n); cursor += s; }
    cursor = Math.max(cursor, n._x + n._w / 2 + gap);
  })(root, 0);
  const w = Math.max(cursor - gap + 4, 100), h = maxD * H + bh + 8;
  let edges = "", body = "";
  (function draw(n) {
    const y = n._d * H + 4;
    for (const k of n.kids || []) {
      edges += `<line class="te ${k.ecls || ""}" x1="${n._x}" y1="${y + bh}" x2="${k._x}" y2="${k._d * H + 4}"/>`;
      draw(k);
    }
    const x0 = n._x - n._w / 2;
    let inner = `<rect x="${x0}" y="${y}" width="${n._w}" height="${bh}" rx="7"/>`;
    if (n.keys) {
      if (!n.keys.length) inner += `<text x="${n._x}" y="${y + bh / 2}">·</text>`;
      n.keys.forEach((k, i) => {
        const kx = x0 + 2 + i * cw + cw / 2;
        if (i) inner += `<line class="key-sep" x1="${x0 + 2 + i * cw}" y1="${y + 5}" x2="${x0 + 2 + i * cw}" y2="${y + bh - 5}"/>`;
        inner += `<text x="${kx}" y="${y + bh / 2}" ${n.hk === i ? 'style="fill:var(--pen)"' : ""}>${esc(k)}</text>`;
      });
    } else inner += `<text x="${n._x}" y="${y + bh / 2}">${esc(n.label)}</text>`;
    body += `<g class="tn ${n.cls || ""}">${inner}</g>`;
  })(root);
  return `<div class="svgwrap"><svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(o.label || "tree")}">${edges}${body}</svg></div>`;
}

// Fixed-position graph. nodes: [{id, x, y, cls, sub}], edges: [{a, b, w, cls}], coordinates in a W x H box.
function graphSVG(nodes, edges, o = {}) {
  const W = o.W || 420, H = o.H || 250, R = 20, directed = o.directed;
  const pos = Object.fromEntries(nodes.map(n => [n.id, n]));
  let e = "", lab = "", body = "";
  for (const ed of edges) {
    const a = pos[ed.a], b = pos[ed.b];
    const dx = b.x - a.x, dy = b.y - a.y, len = Math.hypot(dx, dy), ux = dx / len, uy = dy / len;
    const bend = ed.bend || 0, mx = (a.x + b.x) / 2 - uy * bend, my = (a.y + b.y) / 2 + ux * bend;
    const sx = a.x + ux * R, sy = a.y + uy * R, ex = b.x - ux * (R + (directed ? 3 : 0)), ey = b.y - uy * (R + (directed ? 3 : 0));
    e += bend ? `<path class="ge ${ed.cls || ""}" d="M${sx},${sy} Q${mx},${my} ${ex},${ey}" ${directed ? 'marker-end="url(#ah)"' : ""}/>`
      : `<line class="ge ${ed.cls || ""}" x1="${sx}" y1="${sy}" x2="${ex}" y2="${ey}" ${directed ? 'marker-end="url(#ah)"' : ""}/>`;
    if (ed.w != null) lab += `<text class="gw" x="${bend ? (mx + (a.x + b.x) / 2) / 2 : (a.x + b.x) / 2}" y="${bend ? (my + (a.y + b.y) / 2) / 2 : (a.y + b.y) / 2}">${esc(ed.w)}</text>`;
  }
  for (const n of nodes) body += `<g class="tn ${n.cls || ""}"><circle cx="${n.x}" cy="${n.y}" r="${R}"/><text x="${n.x}" y="${n.y}">${esc(n.label || n.id)}</text>${n.sub != null ? `<text class="tsub" x="${n.x}" y="${n.y + R + 10}">${esc(n.sub)}</text>` : ""}</g>`;
  const defs = directed ? `<defs><marker id="ah" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path class="arrowhead" d="M0,0 L10,5 L0,10 z"/></marker></defs>` : "";
  return `<div class="svgwrap"><svg viewBox="0 0 ${W} ${H}" style="width:100%;max-width:${W * 1.3}px;height:auto" role="img" aria-label="${esc(o.label || "graph")}">${defs}${e}${lab}${body}</svg></div>`;
}

// Simple vertical bar chart. bars: [{v, label, cls}], o: {max, ref, refLabel, h, fmt}
function barChart(bars, o = {}) {
  const W = o.W || 520, H = o.h || 180, padL = 34, padB = 22, padT = 10;
  const max = o.max || Math.max(1e-9, ...bars.map(b => b.v), o.ref || 0);
  const bw = (W - padL - 6) / bars.length, ih = H - padB - padT;
  const y = v => padT + ih - (v / max) * ih;
  let s = `<line class="axis" x1="${padL}" y1="${padT + ih}" x2="${W}" y2="${padT + ih}"/>`;
  for (const t of [0, 0.5, 1]) s += `<text class="axis-t" x="${padL - 5}" y="${y(max * t) + 3}" text-anchor="end">${esc((o.fmt || (v => Math.round(v)))(max * t))}</text>`;
  bars.forEach((b, i) => {
    const x = padL + i * bw + bw * 0.12, w = Math.max(1, bw * 0.76);
    s += `<rect class="bar ${b.cls || ""}" x="${x}" y="${y(b.v)}" width="${w}" height="${Math.max(0, padT + ih - y(b.v))}" rx="2"><title>${esc(b.label)}: ${esc(b.title || b.v)}</title></rect>`;
    if (b.label != null && (bars.length <= 24 || i % Math.ceil(bars.length / 16) === 0)) s += `<text class="axis-t" x="${x + w / 2}" y="${H - 6}" text-anchor="middle">${esc(b.label)}</text>`;
  });
  if (o.ref != null) s += `<line class="refline" x1="${padL}" x2="${W}" y1="${y(o.ref)}" y2="${y(o.ref)}"/><text class="axis-t" x="${W - 4}" y="${y(o.ref) - 4}" text-anchor="end">${esc(o.refLabel || "")}</text>`;
  return `<div class="svgwrap"><svg viewBox="0 0 ${W} ${H}" style="width:100%;max-width:${Math.round(W * 1.15)}px;height:auto" role="img" aria-label="${esc(o.label || "bar chart")}">${s}</svg></div>`;
}

const W = {}; // widget registry: W[name](host)
