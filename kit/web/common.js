// Shared helpers for both pages.
const DATA = JSON.parse(document.getElementById("data").textContent);
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const slug = id => "ex-" + id.replace(".", "-");

// `code` spans become <code>; arrows outside code become a proper arrow.
function rich(text) {
  return String(text).split("`").map((part, i) =>
    i % 2 ? `<code>${esc(part)}</code>` : esc(part).replace(/ -&gt; /g, " → ").replace(/-&gt;/g, "→")
  ).join("");
}

// Pull O(...) terms (balanced parentheses) out of a Big O sentence.
function bigOTerms(text) {
  const out = [];
  for (let i = 0; i < text.length; i++) {
    if (text[i] === "O" && text[i + 1] === "(" && !/[A-Za-z]/.test(text[i - 1] || "")) {
      let depth = 0, j = i + 1;
      for (; j < text.length; j++) {
        if (text[j] === "(") depth++;
        else if (text[j] === ")" && --depth === 0) break;
      }
      const term = text.slice(i, j + 1);
      if (!out.includes(term)) out.push(term);
      i = j;
    }
  }
  return out;
}
function cxClass(term) {
  const t = term.replace(/\s+/g, " ");
  if (/!|\d+\^N|2\^N|\^N\)/.test(t)) return "oexp";
  if (/N\^[23]|N \* M|N\^2|V\^2/.test(t)) return "on2";
  if (/log/.test(t) && /[NKVR] log|\) log|log N\)$/.test(t) && !/^O\(log/.test(t)) return "onlogn";
  if (/^O\(log/.test(t)) return "ologn";
  if (/^O\(1\)$/.test(t)) return "o1";
  return "on";
}
function cxChips(text, max = 3) {
  return bigOTerms(text).slice(0, max).map(t => `<span class="cx ${cxClass(t)}">${esc(t)}</span>`).join("");
}

function toast(msg) {
  let t = $(".toast");
  if (!t) { t = document.createElement("div"); t.className = "toast"; t.setAttribute("role", "status"); document.body.append(t); }
  t.textContent = msg; t.classList.add("show");
  clearTimeout(toast.timer); toast.timer = setTimeout(() => t.classList.remove("show"), 1600);
}
async function copyText(text, el) {
  try { await navigator.clipboard.writeText(text); toast("Copied"); }
  catch {
    const r = document.createRange(); r.selectNodeContents(el);
    const s = getSelection(); s.removeAllRanges(); s.addRange(r);
    toast("Selected. Press Ctrl+C or Cmd+C to copy");
  }
}
function syncHeaderHeight() {
  const h = $(".top")?.offsetHeight || 64;
  document.documentElement.style.setProperty("--header-h", h + "px");
}
addEventListener("resize", syncHeaderHeight);

// Rail: chapters grouped by part, with a highlight that follows scrolling.
function buildRail(rail, counts) {
  rail.innerHTML = DATA.parts.map(p => `
    <div class="rail-part">${esc(p.label)} · ${esc(p.name)}</div>
    ${p.chs.map(ch => {
      const c = DATA.chapters.find(c => c.ch === ch);
      return `<a href="#ch-${ch}" data-ch="${ch}"><span class="rail-num">${String(ch).padStart(2, "0")}</span><span class="rail-name">${esc(c.short)}</span><span class="rail-count" data-count="${ch}">${counts ? counts(ch) : ""}</span><span class="rail-bar"><i data-bar="${ch}"></i></span></a>`;
    }).join("")}`).join("");
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
}
