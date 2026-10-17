// Renders the guide from GUIDE (content) and LINKS (workbook URLs per language).
const LANGS = [["python", "Python"], ["java", "Java"], ["go", "Go"]];
const ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI"];

function practiceLinks(ch) {
  return LANGS.filter(([k]) => LINKS[k]).map(([k, name]) => `<a class="lang-link" href="${esc(LINKS[k])}#ch-${ch}" target="_blank" rel="noopener">${name} workbook ↗</a>`).join("");
}

function renderPage() {
  document.title = GUIDE.title;
  $(".brand-mark").textContent = GUIDE.mark;
  $(".brand-name").textContent = GUIDE.name;
  $(".brand-sub").textContent = GUIDE.sub;
  const [h1a, h1b, h1c] = GUIDE.heroTitle;
  const hero = `<section class="panel hero" id="top">
    <div>
      <div class="eyebrow">${esc(GUIDE.eyebrow)}</div>
      <h1>${esc(h1a)} <em>${esc(h1b)}</em>${esc(h1c)}</h1>
      <p>${rich(GUIDE.heroText)}</p>
      <div class="langs"><span class="eyebrow">Workbooks</span>${LANGS.filter(([k]) => LINKS[k]).map(([k, n]) => `<a class="lang-link" href="${esc(LINKS[k])}" target="_blank" rel="noopener">${n} ↗</a>`).join("")}</div>
    </div>
    <div class="howto">${GUIDE.heroPoints.map(([b, s]) => `<div><b>${esc(b)}</b><span>${rich(s)}</span></div>`).join("")}</div>
  </section>`;

  const chapters = GUIDE.chapters.map(c => `
  <section class="panel chapter" id="ch-${c.ch}" data-ch="${c.ch}" data-text="${esc((c.title + " " + c.short + " " + c.idea + " " + c.body.join(" ")).toLowerCase())}">
    <div class="chapter-head">
      <div class="chapter-num">${String(c.ch).padStart(2, "0")}</div>
      <h2 class="chapter-title">${esc(c.title)}</h2>
      <div class="chapter-focus">${rich(c.idea)}</div>
      <div class="chapter-meta"><span class="file-chip" title="Exercises in the workbooks">Ex ${esc(c.ex)}</span></div>
    </div>
    <div class="ch-grid">
      <div class="prose">${c.body.map(p => `<p>${rich(p)}</p>`).join("")}</div>
      <div class="viz-host" data-widget="${esc(c.widget)}"><div class="viz"><p class="viz-note">Loading the visualizer…</p></div></div>
      <div class="two">
        <div class="box"><h3>Mental model</h3><ul class="model">${c.model.map(m => `<li>${rich(m)}</li>`).join("")}</ul></div>
        <div class="box"><h3>What it costs</h3><table class="costs">${c.costs.map(([op, o, why]) => `<tr><td>${rich(op)}<span class="why">${rich(why)}</span></td><td>${cx(o)}</td></tr>`).join("")}</table></div>
      </div>
      <div class="pseudo-wrap"><span class="pseudo-tag">pseudocode</span><pre class="pseudo">${highlight(c.pseudo)}</pre></div>
      <div class="pitfall"><b class="tag">Watch out</b><span>${rich(c.pitfall)}</span></div>
      <div class="practice"><span class="eyebrow">Practice</span><span>Exercises <code>${esc(c.ex)}</code> in</span>${practiceLinks(c.ch)}</div>
    </div>
  </section>`).join("");

  const summary = GUIDE.summaries.map((s, i) => `<section class="panel chapter" id="summary-${i + 1}" data-ch="summary-${i + 1}" data-summary>
    <div class="chapter-head" style="grid-template-areas:'title title meta' 'focus focus meta'"><h2 class="chapter-title">${esc(s.title)}</h2><div class="chapter-focus">${esc(s.focus)}</div></div>
    <div class="sum-scroll"><table class="sumt"><tr><th></th>${s.cols.map(c => `<th>${esc(c)}</th>`).join("")}</tr>
      ${s.rows.map(r => `<tr><td>${esc(r[0])}</td>${r.slice(1, -1).map(v => `<td>${/^O\(/.test(v) ? cx(v) : esc(v)}</td>`).join("")}<td class="for">${esc(r[r.length - 1])}</td></tr>`).join("")}</table></div>
    <p class="viz-note">${rich(s.note)}</p>
  </section>`).join("");

  $("main").innerHTML = hero + chapters + summary + `<p class="empty" id="noHits" hidden>No chapter matches that search.</p>`;

  // Rail
  const rail = $(".rail");
  rail.innerHTML = GUIDE.parts.map((p, i) => `<div class="rail-part">Part ${ROMAN[i]} · ${esc(p[0])}</div>` + p[1].map(ch => {
    const c = GUIDE.chapters.find(x => x.ch === ch);
    return `<a href="#ch-${ch}" data-ch="${ch}"><span class="rail-num">${String(ch).padStart(2, "0")}</span><span class="rail-name">${esc(c.short)}</span><span class="rail-count"></span></a>`;
  }).join("")).join("") + `<div class="rail-part">At a glance</div>` + GUIDE.summaries.map((s, i) => `<a href="#summary-${i + 1}" data-ch="summary-${i + 1}"><span class="rail-num">∑</span><span class="rail-name">${esc(s.title)}</span><span class="rail-count"></span></a>`).join("");
  const links = $$("a", rail);
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      links.forEach(a => a.classList.toggle("active", a.dataset.ch === e.target.dataset.ch));
      const active = links.find(a => a.dataset.ch === e.target.dataset.ch);
      if (active && getComputedStyle(rail).display === "flex") rail.scrollTo({ left: active.offsetLeft - rail.clientWidth / 2 + active.offsetWidth / 2, behavior: "smooth" });
    });
  }, { rootMargin: "-30% 0px -60% 0px" });
  $$(".chapter").forEach(s => io.observe(s));

  // Mount visualizers when they come near the viewport.
  const mount = host => {
    if (host.dataset.mounted) return;
    host.dataset.mounted = 1;
    const fn = W[host.dataset.widget];
    host.innerHTML = "";
    if (!fn) { host.innerHTML = `<div class="viz"><p class="viz-note">Visualizer unavailable.</p></div>`; return; }
    try { host._viz = fn(host); } catch (e) { console.error(e); host.innerHTML = `<div class="viz"><p class="viz-note">This visualizer failed to load: ${esc(e.message)}</p></div>`; }
  };
  const vio = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { vio.unobserve(e.target); mount(e.target); } }), { rootMargin: "600px 0px" });
  $$(".viz-host").forEach(h => vio.observe(h));
  window.__mountAll = () => $$(".viz-host").forEach(mount); // used by tests

  // Search
  $("#q").addEventListener("input", e => {
    const q = e.target.value.trim().toLowerCase();
    let hits = 0;
    $$("section.chapter[data-text]").forEach(sec => {
      const show = !q || sec.dataset.text.includes(q);
      sec.hidden = !show; if (show) hits++;
      const a = links.find(l => l.dataset.ch === sec.dataset.ch); if (a) a.hidden = !show;
    });
    $$("[data-summary]").forEach(s => { s.hidden = !!q; }); $("#top").hidden = !!q;
    $("#noHits").hidden = hits > 0;
  });
  $("#q").placeholder = `Search ${GUIDE.chapters.length} chapters: heap, recursion, treap, bloom…`;

  const syncHeader = () => document.documentElement.style.setProperty("--header-h", ($(".top")?.offsetHeight || 64) + "px");
  addEventListener("resize", syncHeader); syncHeader();
  if (location.hash) { const el = document.getElementById(location.hash.slice(1)); if (el) setTimeout(() => el.scrollIntoView({ block: "start" }), 50); }
}
renderPage();
