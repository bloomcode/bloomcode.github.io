// Visualizers for the concept guide. Every frame is produced by running the real algorithm on the shown data.

/* ---------- Ch 21: array operations ---------- */
W.arrayOps = host => stepper(host, {
  title: "Array operations, counted",
  inputs: `<label>Operation <select name="op">
      <option value="read">Read index 2</option><option value="search">Search for a value</option>
      <option value="ins0" selected>Insert at the start</option><option value="insMid">Insert in the middle</option><option value="insEnd">Insert at the end</option>
      <option value="del0">Delete at the start</option><option value="delMid">Delete in the middle</option><option value="delEnd">Delete at the end</option>
    </select></label>
    <label>Value <input type="number" name="v" value="6"></label>
    <button class="vbtn pen" data-op="run">Run</button>`,
  note: "Every run starts from the same five values in an array with room for eight.",
  build(host) {
    const base = [5, 8, 2, 9, 4], op = val(host, "op"), v = num(host, "v", -99, 999, 6), cap = 8;
    const a = base.slice(), F = [{ arr: a.slice(), marks: {}, msg: "Five values in one block of memory, with three free slots at the end. Press **Play** or **Step**." }];
    let steps = 0;
    const push = (marks, msg) => F.push({ arr: a.slice(), marks, msg, counters: { steps } });
    if (op === "read") {
      steps = 1; push({ 2: "ok" }, "Address of index 2 = start + 2 × cell size. The computer jumps straight there: **1 step**, however long the array is.");
    } else if (op === "search") {
      let found = -1;
      for (let i = 0; i < a.length; i++) {
        steps++;
        const hit = a[i] === v;
        push({ ...Object.fromEntries([...Array(i).keys()].map(k => [k, "dim"])), [i]: hit ? "ok" : "hl" }, hit ? `Index ${i} holds ${v}: found after **${steps} steps**.` : `Is index ${i} equal to ${v}? No (it is ${a[i]}). Move on.`);
        if (hit) { found = i; break; }
      }
      if (found < 0) push(Object.fromEntries(a.map((_, k) => [k, "dim"])), `Checked all ${a.length} cells: ${v} is not here. Linear search took **${steps} steps**, the worst case O(N).`);
    } else if (op.startsWith("ins")) {
      const at = op === "ins0" ? 0 : op === "insMid" ? 2 : a.length;
      for (let i = a.length - 1; i >= at; i--) {
        a[i + 1] = a[i]; steps++;
        push({ [i + 1]: "mv", [i]: "ghost" }, `Shift index ${i} → ${i + 1} to open a gap. (${steps} shift${steps > 1 ? "s" : ""} so far)`);
      }
      a[at] = v; steps++;
      push({ [at]: "ok" }, `Write ${v} into index ${at}. Total: ${steps - 1} shift${steps - 1 === 1 ? "" : "s"} + 1 write = **${steps} steps**.` + (at === 0 ? " Inserting at the start is the worst case: O(N)." : at === base.length ? " Nothing had to move: O(1)." : ""));
    } else {
      const at = op === "del0" ? 0 : op === "delMid" ? 2 : a.length - 1;
      steps++;
      push({ [at]: "bad" }, `Delete index ${at} (value ${a[at]}): 1 step.` + (at === a.length - 1 ? " It was the last value, so nothing else moves: **O(1)**." : " That leaves a gap in the block."));
      a[at] = null;
      for (let i = at + 1; i < base.length; i++) {
        a[i - 1] = a[i]; a[i] = null; steps++;
        push({ [i - 1]: "mv" }, `Shift index ${i} → ${i - 1} to close the gap.`);
      }
      a.length = base.length - 1;
      push({}, `Done in **${steps} steps**.` + (at === 0 ? " Deleting at the start shifts every other value: O(N)." : ""));
    }
    return F;
  },
  render(f, stage) { stage.innerHTML = cells(f.arr, { marks: f.marks, cap: 8 }); },
});

/* ---------- Ch 22: linear vs binary search ---------- */
W.binarySearch = host => stepper(host, {
  title: "Linear search vs binary search",
  inputs: `<label>Find <input type="number" name="t" value="45"></label><span class="viz-note">in 15 sorted values</span>`,
  build(host) {
    const A = [3, 7, 11, 14, 18, 22, 25, 29, 33, 38, 41, 45, 50, 54, 58], t = num(host, "t", -999, 9999, 45);
    // Linear search with early exit.
    const lin = []; let linDone = null;
    for (let i = 0; i < A.length; i++) {
      lin.push(i);
      if (A[i] === t) { linDone = { i, found: true }; break; }
      if (A[i] > t) { linDone = { i, found: false }; break; }
    }
    if (!linDone) linDone = { i: A.length - 1, found: false };
    // Binary search.
    const bin = []; let lo = 0, hi = A.length - 1, binDone = null;
    while (lo <= hi) {
      const mid = (lo + hi) >> 1; bin.push({ lo, hi, mid });
      if (A[mid] === t) { binDone = { mid, found: true }; break; }
      if (A[mid] < t) lo = mid + 1; else hi = mid - 1;
    }
    if (!binDone) { bin.push({ lo, hi, mid: -1 }); binDone = { found: false }; }
    const n = Math.max(lin.length, bin.length);
    const F = [{ A, t, li: -1, b: { lo: 0, hi: A.length - 1, mid: -1 }, msg: `Both searches look for **${t}**. Binary search keeps a window [lo, hi] and halves it each step.` }];
    for (let s = 0; s < n; s++) {
      const li = lin[Math.min(s, lin.length - 1)], b = bin[Math.min(s, bin.length - 1)];
      const linSteps = Math.min(s + 1, lin.length), binSteps = Math.min(s + 1, bin.filter(x => x.mid >= 0).length);
      let msg;
      if (s < bin.length && b.mid >= 0) {
        msg = A[b.mid] === t ? `Binary: middle of [${b.lo}, ${b.hi}] is index ${b.mid}, which holds ${t}. **Found.**`
          : `Binary: middle of [${b.lo}, ${b.hi}] is index ${b.mid} (${A[b.mid]}). ${A[b.mid] < t ? `${A[b.mid]} < ${t}, so discard the left half.` : `${A[b.mid]} > ${t}, so discard the right half.`}`;
      } else if (s < bin.length) msg = `Binary: the window is empty (lo > hi), so **${t} is not present**.`;
      else msg = `Binary search finished after ${binSteps} steps; linear search is still going.`;
      F.push({ A, t, li, linFinal: s >= lin.length - 1 ? linDone : null, b, binFinal: s >= bin.length - 1, msg, counters: { "linear steps": linSteps, "binary steps": binSteps } });
    }
    const last = F[F.length - 1];
    last.msg += ` Linear: ${lin.length} steps${linDone.found ? "" : " (stopped early at a bigger value)"}. Binary: ${bin.filter(x => x.mid >= 0).length}.`;
    return F;
  },
  render(f, stage) {
    const lm = {}, bm = {}, bp = {};
    if (f.li >= 0) {
      for (let i = 0; i < f.li; i++) lm[i] = "dim";
      lm[f.li] = f.linFinal ? (f.linFinal.found ? "ok" : "bad") : "hl";
    }
    const { lo, hi, mid } = f.b, addP = (i, t) => { bp[i] = bp[i] ? bp[i] + "·" + t : t; };
    f.A.forEach((_, i) => { if (i < lo || i > hi) bm[i] = "dim"; });
    if (mid >= 0) bm[mid] = f.A[mid] === f.t ? "ok" : "hl";
    if (lo <= hi) { addP(lo, "lo"); if (mid >= 0) addP(mid, "mid"); addP(hi, "hi"); }
    stage.innerHTML = `<div class="viz-row-label">Linear search</div>${cells(f.A, { marks: lm, idx: false })}
      <div class="viz-row-label">Binary search</div>${cells(f.A, { marks: bm, ptrs: bp })}`;
  },
});

/* ---------- Ch 11: growth ladder ---------- */
W.growth = host => {
  host.classList.add("viz");
  const Ns = [1, 2, 4, 8, 16, 32, 64, 128, 1024, 4096, 65536, 1048576, 1e9];
  host.innerHTML = `<div class="viz-head"><span class="viz-title">How steps grow with N</span><span class="viz-badge" data-n></span></div>
    <div class="viz-inputs"><label>N <input type="range" name="n" min="0" max="${Ns.length - 1}" value="4"></label></div>
    <div class="ladder" data-l></div>
    <p class="viz-caption" data-c></p>
    <p class="viz-note">Bars use a log scale: each tenfold increase adds the same length. Times assume a billion simple steps per second.</p>`;
  const fmt = v => v < 1e6 ? (Number.isInteger(v) ? v.toLocaleString("en-US") : v.toFixed(1)) : v < 1e300 ? v.toExponential(1).replace(/e\+?(\d+)/, " × 10^$1") : "beyond 10^300";
  const time = s => s < 1e-6 ? "< 1 µs" : s < 1e-3 ? (s * 1e6).toFixed(0) + " µs" : s < 1 ? (s * 1e3).toFixed(0) + " ms" : s < 120 ? s.toFixed(1) + " s" : s < 7200 ? (s / 60).toFixed(0) + " min" : s < 86400 * 365 ? (s / 3600).toFixed(0) + " h" : s < 1e300 ? (s / 31557600).toExponential(1).replace(/e\+?(\d+)/, " × 10^$1") + " years" : "forever";
  const rows = [["O(1)", "o1", n => 1], ["O(log N)", "ologn", n => Math.max(1, Math.log2(n))], ["O(N)", "on", n => n], ["O(N log N)", "onlogn", n => n * Math.max(1, Math.log2(n))], ["O(N²)", "on2", n => n * n], ["O(2ᴺ)", "oexp", n => Math.pow(2, n)]];
  function draw() {
    const n = Ns[+$('[name="n"]', host).value];
    const vals = rows.map(r => r[2](n)), top = Math.log10(Math.min(1e300, Math.max(...vals)) + 1);
    $("[data-n]", host).textContent = "N = " + n.toLocaleString("en-US");
    $("[data-l]", host).innerHTML = rows.map((r, i) => {
      const v = vals[i], w = Math.max(1, 100 * Math.log10(Math.min(v, 1e300) + 1) / top);
      return `<span class="cx ${r[1]}">${r[0]}</span><div style="min-width:0"><div class="lbar" style="width:${w}%;background:var(--${r[1]})"></div></div><span class="lnum" title="${time(v / 1e9)}">${fmt(v)}</span>`;
    }).join("");
    $("[data-c]", host).innerHTML = rich(`At N = ${n.toLocaleString("en-US")}: O(N) takes ${time(n / 1e9)}, O(N²) takes ${time(n * n / 1e9)}, and O(2ᴺ) takes ${time(Math.pow(2, n) / 1e9)}. Move the slider: doubling N adds **one** step to O(log N) but squares the growth of O(2ᴺ).`);
  }
  host.addEventListener("input", draw); draw();
};

/* ---------- Sorting visualizers (Ch 4, 5, 6, 13) ---------- */
const SORT_PRESETS = `<label>Input <select name="preset"><option value="random">random</option><option value="nearly">nearly sorted</option><option value="sorted">sorted</option><option value="reversed">reversed</option></select></label><button class="vbtn" data-op="shuffle">New random</button>`;
function presetArray(host, n, action) {
  const kind = val(host, "preset") || "random";
  if (action === "shuffle") { host._seed = randomSeed(); $('[name="preset"]', host).value = "random"; }
  const base = [...Array(n)].map((_, i) => (i + 1) * 3 + (i % 3));
  if (kind === "sorted") return base;
  if (kind === "reversed") return base.reverse();
  if (kind === "nearly") { const a = base.slice(); [a[1], a[2]] = [a[2], a[1]]; [a[n - 3], a[n - 2]] = [a[n - 2], a[n - 3]]; return a; }
  const r = rngFrom(host._seed ?? (host._seed = 7)), a = base.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = r.int(0, i); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}
const sortRender = (f, stage) => {
  stage.innerHTML = (f.temp != null ? `<div class="vchips"><span class="viz-row-label">temp</span><span class="vchip hl">${esc(f.temp)}</span></div>` : "") + cells(f.arr, { marks: f.marks, ptrs: f.ptrs });
};

W.bubble = host => stepper(host, {
  title: "Bubble sort with early exit", inputs: SORT_PRESETS, speed: 520,
  build(host, action) {
    const a = presetArray(host, 8, action), F = [{ arr: a.slice(), marks: {}, msg: "Compare neighbours left to right and swap any pair that is out of order." }];
    let comps = 0, swaps = 0, passes = 0, end = a.length - 1, sorted = false;
    const done = () => Object.fromEntries([...Array(a.length - 1 - end)].map((_, k) => [a.length - 1 - k, "ok"]));
    while (!sorted) {
      sorted = true; passes++;
      for (let i = 0; i < end; i++) {
        comps++;
        const sw = a[i] > a[i + 1];
        F.push({ arr: a.slice(), marks: { ...done(), [i]: "hl", [i + 1]: "hl" }, msg: `Pass ${passes}: compare ${a[i]} and ${a[i + 1]}. ${sw ? "Out of order: swap." : "In order: leave them."}`, counters: { comparisons: comps, swaps, passes } });
        if (sw) { [a[i], a[i + 1]] = [a[i + 1], a[i]]; swaps++; sorted = false; F.push({ arr: a.slice(), marks: { ...done(), [i]: "mv", [i + 1]: "mv" }, msg: `Swapped. The bigger value keeps bubbling right.`, counters: { comparisons: comps, swaps, passes } }); }
      }
      end--;
      F.push({ arr: a.slice(), marks: done(), msg: sorted ? `Pass ${passes} made no swaps, so the array is sorted. Stop early.` : `End of pass ${passes}: the largest unsorted value is now in place.`, counters: { comparisons: comps, swaps, passes } });
      if (end <= 0) break;
    }
    F.push({ arr: a.slice(), marks: Object.fromEntries(a.map((_, k) => [k, "ok"])), msg: `Sorted with **${comps} comparisons** and **${swaps} swaps**. For 8 values the worst case is 28 of each (8 × 7 / 2).`, counters: { comparisons: comps, swaps, passes } });
    return F;
  },
  render: sortRender,
});

W.selection = host => stepper(host, {
  title: "Selection sort: one swap per pass", inputs: SORT_PRESETS, speed: 480,
  build(host, action) {
    const a = presetArray(host, 8, action), F = [{ arr: a.slice(), marks: {}, msg: "Each pass scans the unsorted part for its lowest value, then swaps it into place once." }];
    let comps = 0, swaps = 0;
    const done = i => Object.fromEntries([...Array(i)].map((_, k) => [k, "ok"]));
    for (let i = 0; i < a.length - 1; i++) {
      let low = i;
      for (let j = i + 1; j < a.length; j++) {
        comps++;
        const better = a[j] < a[low];
        F.push({ arr: a.slice(), marks: { ...done(i), [low]: "pv", [j]: "hl" }, ptrs: { [low]: "lowest", [j]: "j" }, msg: `Is ${a[j]} lower than the lowest so far (${a[low]})? ${better ? "Yes: remember index " + j + "." : "No."}`, counters: { comparisons: comps, swaps } });
        if (better) low = j;
      }
      if (low !== i) { [a[i], a[low]] = [a[low], a[i]]; swaps++; F.push({ arr: a.slice(), marks: { ...done(i), [i]: "mv", [low]: "mv" }, msg: `Swap the lowest value, ${a[i]}, into index ${i}: the only swap this pass.`, counters: { comparisons: comps, swaps } }); }
      else F.push({ arr: a.slice(), marks: { ...done(i + 1) }, msg: `${a[i]} is already the lowest, so no swap is needed.`, counters: { comparisons: comps, swaps } });
    }
    F.push({ arr: a.slice(), marks: done(a.length), msg: `Sorted: **${comps} comparisons** (always 28 for 8 values) but only **${swaps} swaps**. Compare with bubble sort's swap count on the same input.`, counters: { comparisons: comps, swaps } });
    return F;
  },
  render: sortRender,
});

W.insertion = host => stepper(host, {
  title: "Insertion sort: best, average and worst", inputs: SORT_PRESETS, speed: 480,
  note: "Try **sorted** and then **reversed**: same algorithm, wildly different counts.",
  build(host, action) {
    const a = presetArray(host, 8, action), F = [{ arr: a.slice(), marks: { 0: "ok" }, msg: "The first value on its own is a sorted part. Each round lifts the next value out and slides it left into place." }];
    let comps = 0, shifts = 0;
    const sortedTo = k => Object.fromEntries([...Array(k)].map((_, x) => [x, "ok"]));
    for (let i = 1; i < a.length; i++) {
      const temp = a[i]; let pos = i - 1;
      const b = a.slice(); b[i] = null;
      F.push({ arr: b.slice(), temp, marks: { ...sortedTo(i) }, msg: `Lift out ${temp}, leaving a gap at index ${i}.`, counters: { comparisons: comps, shifts } });
      while (pos >= 0) {
        comps++;
        if (b[pos] > temp) {
          b[pos + 1] = b[pos]; b[pos] = null; shifts++;
          F.push({ arr: b.slice(), temp, marks: { ...sortedTo(i + 1), [pos + 1]: "mv", [pos]: "" }, msg: `${b[pos + 1]} > ${temp}: shift it right.`, counters: { comparisons: comps, shifts } });
          pos--;
        } else {
          F.push({ arr: b.slice(), temp, marks: { ...sortedTo(i + 1), [pos]: "hl", [pos + 1]: "" }, msg: `${b[pos]} ≤ ${temp}: stop here.`, counters: { comparisons: comps, shifts } });
          break;
        }
      }
      b[pos + 1] = temp; a.splice(0, a.length, ...b);
      F.push({ arr: a.slice(), marks: { ...sortedTo(i + 1), [pos + 1]: "mv" }, msg: `Drop ${temp} into index ${pos + 1}.`, counters: { comparisons: comps, shifts } });
    }
    const kind = val(host, "preset");
    F.push({ arr: a.slice(), marks: sortedTo(a.length), msg: `Sorted with **${comps} comparisons** and **${shifts} shifts**. ${kind === "sorted" ? "Sorted input is the best case: one comparison per value, O(N)." : kind === "reversed" ? "Reversed input is the worst case: every value travels all the way, 28 shifts for 8 values, O(N²)." : "Random input lands in between, about half the worst case."}`, counters: { comparisons: comps, shifts } });
    return F;
  },
  render: sortRender,
});

W.quicksort = host => stepper(host, {
  title: "Partition and quicksort", inputs: SORT_PRESETS, speed: 520,
  note: "Choose **sorted** to see the worst case: the rightmost pivot is always the largest, so each partition removes only one value.",
  build(host, action) {
    const a = presetArray(host, 9, action), F = [{ arr: a.slice(), marks: {}, msg: "Partition picks the rightmost value as the pivot and moves smaller values left, bigger ones right." }];
    let comps = 0, swaps = 0; const placed = new Set();
    const base = (lo, hi) => { const m = {}; a.forEach((_, k) => { if (placed.has(k)) m[k] = "ok"; else if (k < lo || k > hi) m[k] = "dim"; }); return m; };
    const C = () => ({ comparisons: comps, swaps });
    function partition(lo, hi) {
      const pi = hi, pivot = a[hi]; let l = lo, r = hi - 1;
      F.push({ arr: a.slice(), marks: { ...base(lo, hi), [pi]: "pv" }, ptrs: { [pi]: "pivot", ...(l <= r ? { [l]: "left", [r]: l === r ? "left right" : "right" } : {}) }, msg: `Partition indexes ${lo}–${hi} around pivot **${pivot}**.`, counters: C() });
      for (;;) {
        while (l <= r) { comps++; if (a[l] < pivot) { l++; } else break; }
        while (r >= l) { comps++; if (a[r] > pivot) { r--; } else break; }
        if (l >= r) break;
        F.push({ arr: a.slice(), marks: { ...base(lo, hi), [pi]: "pv", [l]: "hl", [r]: "hl" }, ptrs: { [pi]: "pivot", [l]: "left", [r]: "right" }, msg: `Left stopped at ${a[l]} (≥ ${pivot}), right stopped at ${a[r]} (≤ ${pivot}). Swap them.`, counters: C() });
        [a[l], a[r]] = [a[r], a[l]]; swaps++;
        F.push({ arr: a.slice(), marks: { ...base(lo, hi), [pi]: "pv", [l]: "mv", [r]: "mv" }, ptrs: { [pi]: "pivot" }, msg: `Swapped. Move both pointers inwards and keep going.`, counters: C() });
        l++; r--;
      }
      const ptrs = { [pi]: "pivot" }; if (l < a.length) ptrs[l] = l === pi ? "pivot left" : "left";
      F.push({ arr: a.slice(), marks: { ...base(lo, hi), [pi]: "pv", [l]: "hl" }, ptrs, msg: `The pointers have crossed. Everything left of index ${l} is smaller than ${pivot}; swap the pivot into index ${l}.`, counters: C() });
      [a[l], a[pi]] = [a[pi], a[l]]; if (l !== pi) swaps++;
      placed.add(l);
      F.push({ arr: a.slice(), marks: { ...base(lo, hi), [l]: "ok" }, msg: `**${pivot}** is now in its final place. Quicksort the left part (${lo}–${l - 1}) and the right part (${l + 1}–${hi}).`, counters: C() });
      return l;
    }
    (function qs(lo, hi) {
      if (hi - lo <= 0) { if (lo === hi) placed.add(lo); return; }
      const p = partition(lo, hi); qs(lo, p - 1); qs(p + 1, hi);
    })(0, a.length - 1);
    F.push({ arr: a.slice(), marks: Object.fromEntries(a.map((_, k) => [k, "ok"])), msg: `Sorted with **${comps} comparisons** and **${swaps} swaps**.`, counters: C() });
    return F;
  },
  render: sortRender,
});

/* ---------- Ch 11: classify everyday code ---------- */
W.classify = host => {
  host.classList.add("viz");
  const Q = [
    ["Running balance", "balance = 0\nfor each change in changes:\n    if balance + change >= 0: balance += change\nreturn balance", "O(N)", "One loop over the N changes; the work inside is constant."],
    ["Every pairing from a list", "for i from 0 to N - 1:\n    for j from i + 1 to N - 1:\n        append names[i] + \"-\" + names[j]", "O(N^2)", "About N²/2 pairings, and Big O drops the half."],
    ["Busiest of 24 hourly counters", "best = 0\nfor hour from 0 to 23:\n    if counts[hour] > counts[best]: best = hour", "O(1)", "Always 24 steps, however many entries were counted."],
    ["Vowels across a document", "for each line in lines:\n    for each ch in line:\n        if ch is a vowel: count += 1", "O(N)", "Nested loops, but every character is visited once. N = the total number of characters."],
    ["Every setting of N switches", "settings = [\"\"]\nrepeat N times:\n    settings = [s + b for each s in settings for each b in \"01\"]", "O(2^N)", "Each extra switch doubles the work."],
    ["Halve until one", "while n > 1:\n    n = n / 2\n    steps += 1", "O(log N)", "The loop runs once per halving."],
  ];
  const opts = ["O(1)", "O(log N)", "O(N)", "O(N^2)", "O(2^N)"];
  host.innerHTML = `<div class="viz-head"><span class="viz-title">Name the Big O</span><span class="viz-badge" data-score>0 of ${Q.length}</span></div>
    <div class="quiz">${Q.map((q, i) => `<div class="qcard" data-q="${i}"><b>${esc(q[0])}</b><pre>${esc(q[1])}</pre>
      <div class="qopts">${opts.map(o => `<button class="qopt" data-a="${o}">${esc(prettyO(o))}</button>`).join("")}</div><p class="qwhy" hidden></p></div>`).join("")}</div>`;
  let score = 0;
  host.addEventListener("click", e => {
    const b = e.target.closest(".qopt"); if (!b) return;
    const card = b.closest(".qcard"), q = Q[+card.dataset.q];
    if (card.dataset.done) return;
    card.dataset.done = 1;
    const right = b.dataset.a === q[2];
    if (right) score++;
    $$(".qopt", card).forEach(x => { if (x.dataset.a === q[2]) x.classList.add("right"); else if (x === b) x.classList.add("wrong"); x.disabled = true; });
    const why = $(".qwhy", card); why.hidden = false; why.innerHTML = (right ? "<b>Right.</b> " : `<b>It is ${esc(prettyO(q[2]))}.</b> `) + esc(q[3]);
    $("[data-score]", host).textContent = `${score} of ${Q.length}`;
  });
};

/* ---------- Ch 41: hash table with chaining ---------- */
W.hashTable = host => {
  const M = 7;
  const hash = k => [...k].reduce((s, c) => s + c.charCodeAt(0), 0);
  let base = Array.from({ length: M }, () => []);
  for (const w of ["cat", "dog", "emu", "act", "yak"]) base[hash(w) % M].push(w);
  return stepper(host, {
    title: "A hash table with 7 buckets", speed: 800, enterOp: "find",
    inputs: `<label>Key <input type="text" name="k" value="tac" maxlength="12" autocomplete="off"></label>
      <button class="vbtn pen" data-op="put">Insert</button><button class="vbtn" data-op="find">Look up</button><button class="vbtn" data-op="reset">Reset</button>`,
    note: "Toy hash function: add up the character codes, then take the remainder mod 7. Anagrams always collide, which Chapter 42 fixes.",
    build(host, op) {
      if (op === "reset") { base = Array.from({ length: M }, () => []); for (const w of ["cat", "dog", "emu", "act", "yak"]) base[hash(w) % M].push(w); }
      const t = base.map(b => b.slice());
      if (!op || op === "reset") return [{ t, b: -1, msg: "Five keys are stored. Type a key and press **Insert** or **Look up**." }];
      const k = val(host, "k").trim().toLowerCase().slice(0, 12);
      if (!k) return [{ t, b: -1, msg: "Type a key first." }];
      const h = hash(k), b = h % M, F = [];
      F.push({ t, b: -1, msg: `hash("${k}") = ${[...k].map(c => c.charCodeAt(0)).join(" + ")} = ${h}. Then ${h} mod 7 = **${b}**.` , counters: { steps: 1 } });
      F.push({ t, b, msg: `Jump straight to bucket ${b}. No scanning of other buckets.`, counters: { steps: 2 } });
      let steps = 2, found = false;
      t[b].forEach((x, i) => {
        steps++;
        const hit = x === k; found = found || hit;
        if (!found || hit) F.push({ t, b, scan: i, hit, msg: hit ? `"${x}" matches.` : `"${x}" is a different key in the same bucket (a collision). Keep scanning the chain.`, counters: { steps } });
      });
      if (op === "find") F.push({ t, b, msg: found ? `Found **"${k}"** in ${steps} steps.` : `Bucket ${b} has no "${k}", so it is not in the table (${steps} steps).`, counters: { steps } });
      else if (found) F.push({ t, b, msg: `"${k}" is already stored; a set keeps one copy.`, counters: { steps } });
      else {
        base[b].push(k); const t2 = base.map(x => x.slice());
        F.push({ t: t2, b, added: k, msg: `Append "${k}" to bucket ${b}'s chain. Chains stay short while there are enough buckets for the keys.`, counters: { steps: steps + 1 } });
      }
      return F;
    },
    render(f, stage) {
      stage.innerHTML = `<div class="buckets">${f.t.map((ch, i) => `<div class="bucket ${i === f.b ? "hl" : ""}"><span class="bi">${i}</span><div class="chain">${ch.map((x, j) => `<span class="vchip ${i === f.b && f.scan === j ? (f.hit ? "ok" : "hl") : ""} ${x === f.added && i === f.b ? "mv" : ""}">${esc(x)}</span>`).join("") || `<span class="viz-note">empty</span>`}</div></div>`).join("")}</div>`;
    },
  });
};

/* ---------- Ch 24: matching brackets with a stack ---------- */
W.brackets = host => stepper(host, {
  title: "Matching brackets with a stack", speed: 600,
  inputs: `<label>Code <input type="text" name="s" value="(x = [1, {a: 2}])" style="width:210px" autocomplete="off"></label><button class="vbtn pen" data-op="run">Run</button>`,
  note: "Try `(a[0)]` or `{ (x) ` to see the two kinds of error.",
  build(host) {
    const s = val(host, "s").slice(0, 40), st = [], F = [{ s, i: -1, st: [], msg: "Read left to right. Openers go on the stack; each closer must match the top of the stack." }];
    const pairs = { ")": "(", "]": "[", "}": "{" };
    for (let i = 0; i < s.length; i++) {
      const c = s[i];
      if ("([{".includes(c)) { st.push(c); F.push({ s, i, st: st.slice(), top: "mv", msg: `\`${c}\` opens: push it.` }); }
      else if (")]}".includes(c)) {
        if (!st.length) { F.push({ s, i, st: [], bad: true, msg: `\`${c}\` closes, but the stack is empty: **error, nothing to close**.` }); return F; }
        const top = st[st.length - 1];
        if (top !== pairs[c]) { F.push({ s, i, st: st.slice(), bad: true, top: "bad", msg: `\`${c}\` does not match the top of the stack \`${top}\`: **mismatched bracket**.` }); return F; }
        F.push({ s, i, st: st.slice(), top: "ok", msg: `\`${c}\` matches the top \`${top}\`: pop it.` });
        st.pop(); F.push({ s, i, st: st.slice(), msg: `Popped. ${st.length} opener${st.length === 1 ? "" : "s"} still waiting.` });
      }
    }
    F.push({ s, i: s.length, st: st.slice(), bad: st.length > 0, msg: st.length ? `End of input with \`${st[st.length - 1]}\` still on the stack: **unclosed bracket**.` : "End of input and the stack is empty: **every bracket is matched**." });
    return F;
  },
  render(f, stage) {
    const marks = {}; if (f.i >= 0 && f.i < f.s.length) marks[f.i] = f.bad ? "bad" : "hl";
    for (let k = 0; k < f.i && k < f.s.length; k++) marks[k] = marks[k] || "dim";
    stage.innerHTML = `<div class="split"><div style="min-width:0"><div class="viz-row-label">Input</div>${cells([...f.s].map(c => c === " " ? "␣" : c), { marks, idx: false })}</div>
      <div><div class="viz-row-label">Stack (top ↑)</div><div class="stack-col">${f.st.map((c, k) => `<span class="vchip ${k === f.st.length - 1 && f.top ? f.top : ""}">${esc(c)}</span>`).join("") || `<span class="vchip empty">empty</span>`}</div></div></div>`;
  },
});

/* ---------- Ch 71: the call stack ---------- */
W.callStack = host => stepper(host, {
  title: "factorial(n) on the call stack", speed: 700,
  inputs: `<label>n <input type="number" name="n" value="4" min="1" max="7"></label><button class="vbtn pen" data-op="run">Run</button>`,
  build(host) {
    const n = num(host, "n", 1, 7, 4), st = [], F = [{ st: [], msg: `Call factorial(${n}). Watch the stack grow until the base case, then unwind.` }];
    let depth = 0, maxDepth = 0;
    (function fact(k) {
      st.push({ k, ret: null }); depth++; maxDepth = Math.max(maxDepth, depth);
      F.push({ st: st.map(x => ({ ...x })), msg: k <= 1 ? `factorial(${k}) is the **base case**: it returns 1 without calling anything.` : `factorial(${k}) needs factorial(${k - 1}) first, so it waits and pushes a new call.`, counters: { "stack depth": depth, "max depth": maxDepth } });
      const r = k <= 1 ? 1 : k * fact(k - 1);
      st[st.length - 1].ret = r;
      F.push({ st: st.map(x => ({ ...x })), ret: true, msg: k <= 1 ? `factorial(${k}) returns 1.` : `factorial(${k}) gets ${r / k} back and returns ${k} × ${r / k} = **${r}**.`, counters: { "stack depth": depth, "max depth": maxDepth } });
      st.pop(); depth--;
      return r;
    })(n);
    F.push({ st: [], msg: `Done: factorial(${n}) = **${F[F.length - 1].st[0].ret}**. The stack was ${maxDepth} frames deep at its peak: recursion costs O(N) memory here.`, counters: { "stack depth": 0, "max depth": maxDepth } });
    return F;
  },
  render(f, stage) {
    stage.innerHTML = `<div class="viz-row-label">Call stack (top ↑)</div><div class="stack-col" style="max-width:340px">${f.st.map((x, i) => `<span class="vchip ${i === f.st.length - 1 ? (x.ret != null ? "ok" : "hl") : ""}" style="text-align:left">factorial(${x.k})${x.ret != null ? ` → returns ${x.ret}` : i === f.st.length - 1 ? "" : `  · waiting for factorial(${x.k - 1})`}</span>`).join("") || `<span class="vchip empty">empty</span>`}</div>`;
  },
});

/* ---------- Ch 71: subsets call tree ---------- */
W.subsetsTree = host => stepper(host, {
  title: "Every subset: skip it or take it", speed: 450,
  inputs: `<label>Items <input type="text" name="s" value="abc" maxlength="4" style="width:80px" autocomplete="off"></label><button class="vbtn pen" data-op="run">Run</button>`,
  note: "Each level decides one item. Left branch skips it, right branch takes it, so N items give 2ᴺ leaves.",
  build(host) {
    const items = [...new Set(val(host, "s").replace(/\s/g, ""))].slice(0, 4);
    if (!items.length) return [{ msg: "Type up to four distinct letters." }];
    let id = 0; const order = [];
    const make = (i, chosen) => {
      const node = { id: id++, depth: i, label: chosen.length ? chosen.join("") : "∅", kids: [] };
      order.push(node);
      if (i < items.length) node.kids = [make(i + 1, chosen), make(i + 1, chosen.concat(items[i]))];
      return node;
    };
    const root = make(0, []); const leaves = [];
    const F = [{ root, seen: -1, leaves: [], msg: `subsets(${items.join("")}): each call decides whether to include one item, then calls itself for the rest.` }];
    order.forEach((nd, k) => {
      const leaf = !nd.kids.length; if (leaf) leaves.push(nd.label);
      F.push({ root, seen: k, cur: nd.id, leaves: leaves.slice(), msg: leaf ? `No items left: **${nd.label}** is a complete subset.` : `Call with ${nd.label === "∅" ? "nothing chosen" : `{${[...nd.label].join(", ")}} chosen`}; next decide about "${items[nd.depth]}".`, counters: { calls: k + 1, subsets: leaves.length } });
    });
    F[F.length - 1].msg += ` All **${leaves.length} = 2^${items.length}** subsets found in ${order.length} calls.`;
    return F;
  },
  render(f, stage) {
    if (!f.root) { stage.innerHTML = ""; return; }
    let k = 0;
    (function walk(n) { n._ord = k++; n.kids.forEach(walk); })(f.root);
    (function paint(n) {
      n.cls = n._ord > f.seen ? "dim" : n.id === f.cur ? "hl" : !n.kids.length ? "ok" : "";
      n.kids.forEach(paint);
    })(f.root);
    stage.innerHTML = naryTree(f.root, { label: "subset call tree" }) + `<div class="vchips"><span class="viz-row-label">Subsets</span>${f.leaves.map(x => `<span class="vchip ok">${esc(x === "∅" ? "{ }" : "{" + [...x].join(",") + "}")}</span>`).join("")}</div>`;
  },
});

/* ---------- Ch 72: fib call tree, with and without memo ---------- */
W.fibTree = host => stepper(host, {
  title: "fib(n): the call tree", speed: 380,
  inputs: `<label>n <select name="n">${[3, 4, 5, 6, 7].map(n => `<option ${n === 5 ? "selected" : ""}>${n}</option>`).join("")}</select></label>
    <label><input type="checkbox" name="memo"> memoize</label><button class="vbtn pen" data-op="run">Run</button>`,
  note: "Dim nodes are calls still to come. With the memo on, repeated calls become cheap lookups (blue) and their subtrees disappear.",
  build(host) {
    const n = +val(host, "n") || 5, memoOn = $('[name="memo"]', host).checked, memo = new Map();
    const events = []; let id = 0;
    function fib(k) {
      const node = { id: id++, k, kids: [], label: `f(${k})`, val: null };
      events.push({ t: "call", node });
      if (memoOn && memo.has(k)) { node.val = memo.get(k); node.memo = true; events.push({ t: "memo", node }); return [node.val, node]; }
      let v;
      if (k <= 1) v = k;
      else { const [a, na] = fib(k - 1); node.kids.push(na); const [b, nb] = fib(k - 2); node.kids.push(nb); v = a + b; }
      node.val = v; if (memoOn) memo.set(k, v);
      events.push({ t: "ret", node });
      return [v, node];
    }
    const [result, root] = fib(n);
    const total = id;
    // width: use the final label so the layout never shifts
    (function wl(nd) { nd.label = `f(${nd.k})=${nd.val}`; nd.kids.forEach(wl); })(root);
    const F = [{ root, state: {}, msg: `fib(${n}) calls fib(${n - 1}) and fib(${n - 2}), and so on down to fib(1) and fib(0).${memoOn ? " With a memo, each value is computed once." : ""}`, counters: { calls: 0, "total calls": total } }];
    const state = {}; let calls = 0;
    for (const e of events) {
      if (e.t === "call") { calls++; state[e.node.id] = "hl"; F.push({ root, state: { ...state }, msg: `Call fib(${e.node.k}).`, counters: { calls, "total calls": total } }); state[e.node.id] = "cur"; }
      else if (e.t === "memo") { state[e.node.id] = "memo"; F[F.length - 1] = { root, state: { ...state }, msg: `fib(${e.node.k}) is already in the memo: return ${e.node.val} at once.`, counters: { calls, "total calls": total } }; }
      else { state[e.node.id] = "ret"; F.push({ root, state: { ...state }, msg: `fib(${e.node.k}) returns ${e.node.val}.`, counters: { calls, "total calls": total } }); }
    }
    F[F.length - 1].msg = `fib(${n}) = **${result}** after **${total} calls**. ${memoOn ? `Memoized: about 2n calls, O(N).` : `Without a memo the calls roughly double with each n (try 7), O(2ᴺ). Tick **memoize** and run again.`}`;
    return F;
  },
  render(f, stage) {
    if (!f.root) { stage.innerHTML = ""; return; }
    (function paint(nd) {
      const s = f.state[nd.id];
      nd.cls = s === undefined ? "dim" : s === "hl" ? "hl" : s === "memo" ? "mv" : s === "ret" ? "ok" : "";
      nd.shown = s === "ret" || s === "memo" ? `f(${nd.k})=${nd.val}` : `f(${nd.k})`;
      nd.kids.forEach(paint);
    })(f.root);
    // lay out with the final (widest) label so nodes never shift between frames
    const clone = (function c(nd) { return { label: nd.shown, wl: nd.label, cls: nd.cls, kids: nd.kids.map(c) }; })(f.root);
    stage.innerHTML = naryTree(clone, { label: "fib call tree", h: 50 });
  },
});

/* ---------- Ch 23: linked list ---------- */
W.linkedList = host => stepper(host, {
  title: "Linked list operations, counted", speed: 750,
  inputs: `<label>Operation <select name="op"><option value="read">Read index 3</option><option value="ins0">Insert at the start</option><option value="ins2" selected>Insert at index 2</option><option value="del2">Delete at index 2</option><option value="del0">Delete at the start</option></select></label>
    <label>Value <input type="number" name="v" value="6"></label><button class="vbtn pen" data-op="run">Run</button>`,
  note: "Compare with Chapter 1: the costs flip. Reading is now slow; changing the front is now one step.",
  build(host) {
    const list = [12, 7, 30, 5, 18], op = val(host, "op"), v = num(host, "v", -99, 999, 6);
    const F = [{ list, marks: {}, msg: "Each node holds a value and a link to the next node. The list only knows its head." }];
    let steps = 0;
    const walk = to => { for (let i = 0; i <= to; i++) { steps++; F.push({ list, marks: { [i]: "hl" }, labels: { [i]: "current" }, arrows: i ? { [i - 1]: "hl" } : {}, msg: i === 0 ? "Start at the head." : `Follow the link to index ${i}.`, counters: { steps } }); } };
    if (op === "read") { walk(3); F.push({ list, marks: { 3: "ok" }, msg: `Reached index 3 (value ${list[3]}) after **${steps} steps**. No address arithmetic: reading is O(N).`, counters: { steps } }); }
    else if (op === "ins0") {
      F.push({ list, marks: {}, extra: { v, at: 0 }, msg: `Create a node for ${v} and point its link at the current head.`, counters: { steps: 1 } });
      F.push({ list: [v, ...list], marks: { 0: "mv" }, labels: { 0: "head" }, msg: `Make it the new head. **2 steps**, however long the list is: O(1). An array would shift every value.`, counters: { steps: 2 } });
    } else if (op === "ins2") {
      walk(1);
      F.push({ list, marks: { 1: "hl" }, labels: { 1: "current" }, extra: { v, at: 2 }, msg: `Create the node for ${v}; set its link to current.next (the ${list[2]} node).`, counters: { steps: ++steps } });
      F.push({ list: [...list.slice(0, 2), v, ...list.slice(2)], marks: { 1: "hl", 2: "mv" }, arrows: { 1: "hl" }, msg: `Then point current.next at the new node. Walking took ${steps - 1} steps; relinking is O(1). Total **${steps + 1} steps**.`, counters: { steps: ++steps } });
    } else if (op === "del2") {
      walk(1);
      F.push({ list, marks: { 1: "hl", 2: "bad" }, labels: { 1: "current" }, msg: `Set current.next = current.next.next to skip the ${list[2]} node.`, counters: { steps: ++steps } });
      F.push({ list: [...list.slice(0, 2), ...list.slice(3)], marks: { 1: "hl", 2: "mv" }, arrows: { 1: "hl" }, msg: `The ${list[2]} node is no longer reachable. **${steps} steps**: the walk dominates.`, counters: { steps } });
    } else {
      F.push({ list, marks: { 0: "bad" }, msg: `Point the head at the second node.`, counters: { steps: 1 } });
      F.push({ list: list.slice(1), marks: { 0: "mv" }, labels: { 0: "head" }, msg: `Done in **1 step**: O(1). Deleting an array's first value shifts all the others.`, counters: { steps: 1 } });
    }
    return F;
  },
  render(f, stage) {
    const ns = f.list.map((x, i) => `<div class="ll-node ${f.marks?.[i] || ""}"><span>${esc(x)}</span><span>•</span>${f.labels?.[i] ? `<span class="lab">${esc(f.labels[i])}</span>` : ""}</div>${i < f.list.length - 1 ? `<div class="ll-arrow ${f.arrows?.[i] || ""}"></div>` : ""}`).join("");
    stage.innerHTML = `<div class="scroller"><div class="ll"><span class="ll-head">head →</span>${ns}<div class="ll-arrow"></div><span class="ll-null">null</span></div></div>`
      + (f.extra ? `<div class="vchips"><span class="viz-row-label">New node</span><span class="vchip mv">${esc(f.extra.v)} → ${esc(f.list[f.extra.at] ?? "null")}</span></div>` : "");
  },
});

/* ---------- Ch 51: binary search tree ---------- */
const bstFrom = keys => { let r = null; const ins = (n, k) => !n ? { k, l: null, r: null } : (k < n.k ? (n.l = ins(n.l, k)) : k > n.k ? (n.r = ins(n.r, k)) : 0, n); keys.forEach(k => r = ins(r, k)); return r; };
const cloneT = n => n ? { k: n.k, l: cloneT(n.l), r: cloneT(n.r), sub: n.sub, p: n.p } : null;
function paintT(root, marks = {}, edges = {}) { const c = cloneT(root); (function p(n) { if (!n) return; n.cls = marks[n.k] || ""; n.ecls = edges[n.k] || ""; p(n.l); p(n.r); })(c); return c; }
const BOOK_BST = [50, 25, 75, 10, 33, 56, 89, 4, 11, 30, 40, 52, 61, 82, 95];
W.bst = host => {
  let base = bstFrom(BOOK_BST);
  return stepper(host, {
    title: "Binary search tree: search, insert, delete", speed: 700, enterOp: "search",
    inputs: `<label>Value <input type="number" name="v" value="61"></label>
      <button class="vbtn" data-op="search">Search</button><button class="vbtn pen" data-op="insert">Insert</button><button class="vbtn" data-op="delete">Delete</button>
      <select name="preset" data-noauto><option value="book">Balanced, 15 nodes</option><option value="sorted">Inserted in sorted order</option></select><button class="vbtn" data-op="reset">Reset</button>`,
    note: "Delete 25 or 75 to see the two-children case, where the successor takes the node's place.",
    build(host, op) {
      if (op === "reset") base = val(host, "preset") === "sorted" ? bstFrom([4, 10, 25, 33, 50, 56, 75]) : bstFrom(BOOK_BST);
      const height = n => n ? 1 + Math.max(height(n.l), height(n.r)) : 0;
      if (!op || op === "reset") return [{ t: paintT(base), msg: `A BST with height ${height(base)}. Every left subtree holds smaller values, every right subtree larger ones.` }];
      const v = num(host, "v", -999, 9999, 61), F = []; let steps = 0;
      const path = []; let n = base, parent = null;
      while (n) {
        steps++; path.push(n.k);
        const m = Object.fromEntries(path.map(k => [k, "hl"]));
        const e = Object.fromEntries(path.slice(1).map(k => [k, "hl"]));
        if (v === n.k) { F.push({ t: paintT(base, { ...m, [n.k]: "ok" }, e), msg: `${v} equals this node: **found** after ${steps} comparisons.`, counters: { comparisons: steps } }); break; }
        F.push({ t: paintT(base, m, e), msg: `${v} ${v < n.k ? "<" : ">"} ${n.k}: go ${v < n.k ? "left" : "right"}.`, counters: { comparisons: steps } });
        parent = n; n = v < n.k ? n.l : n.r;
      }
      if (op === "search") { if (!n) F.push({ t: paintT(base), msg: `Fell off the tree: **${v} is not present** (${steps} comparisons).`, counters: { comparisons: steps } }); return F; }
      if (op === "insert") {
        if (n) { F.push({ t: paintT(base), msg: `${v} is already in the tree; nothing to insert.` }); return F; }
        const node = { k: v, l: null, r: null };
        if (!parent) base = node; else if (v < parent.k) parent.l = node; else parent.r = node;
        F.push({ t: paintT(base, { [v]: "mv" }, { [v]: "hl" }), msg: `The search fell off ${parent ? `${parent.k}'s ${v < parent.k ? "left" : "right"} side` : "an empty tree"}, so hang **${v}** there. Height is now ${height(base)}.`, counters: { comparisons: steps } });
        return F;
      }
      // delete
      if (!n) { F.push({ t: paintT(base), msg: `${v} is not in the tree; nothing to delete.` }); return F; }
      const relink = (par, old, nu) => { if (!par) base = nu; else if (par.l === old) par.l = nu; else par.r = nu; };
      if (!n.l || !n.r) {
        const child = n.l || n.r;
        F.push({ t: paintT(base, { [v]: "bad", ...(child ? { [child.k]: "mv" } : {}) }), msg: child ? `${v} has one child, ${child.k}: the child takes its place.` : `${v} is a leaf: just remove it.` });
        relink(parent, n, child);
        F.push({ t: paintT(base, child ? { [child.k]: "mv" } : {}), msg: `Deleted ${v}. The tree is still a valid BST.` });
        return F;
      }
      // two children: successor = leftmost of right subtree
      let sp = n, s = n.r; const sPath = [s.k];
      F.push({ t: paintT(base, { [v]: "bad", [s.k]: "hl" }), msg: `${v} has two children. Find its **successor**: one step right, to ${s.k}…` });
      while (s.l) { sp = s; s = s.l; sPath.push(s.k); F.push({ t: paintT(base, { [v]: "bad", ...Object.fromEntries(sPath.map(k => [k, "hl"])) }), msg: `…then left as far as possible: ${s.k}.` }); }
      F.push({ t: paintT(base, { [v]: "bad", [s.k]: "mv" }), msg: `The successor is **${s.k}**, the next bigger value. It replaces ${v}${s.r ? `, and its right child ${s.r.k} moves up into its old place` : ""}.` });
      if (sp === n) sp.r = s.r; else sp.l = s.r;
      n.k = s.k;
      F.push({ t: paintT(base, { [s.k]: "mv" }), msg: `Deleted ${v}. ${s.k} now sits where ${v} was, so everything left is still smaller and everything right is bigger.` });
      return F;
    },
    render(f, stage) { stage.innerHTML = binTree(f.t, { label: "binary search tree", w: 40 }); },
  });
};

/* ---------- Ch 52: max-heap ---------- */
W.heap = host => {
  let base = [100, 88, 25, 87, 16, 8, 12, 86, 50, 2, 15, 3];
  const toTree = (a, marks) => { const mk = i => i < a.length ? { k: a[i], l: mk(2 * i + 1), r: mk(2 * i + 2), cls: marks[i] || "" } : null; return mk(0); };
  return stepper(host, {
    title: "Max-heap: insert and remove the top", speed: 750, enterOp: "insert",
    inputs: `<label>Value <input type="number" name="v" value="90"></label><button class="vbtn pen" data-op="insert">Insert</button><button class="vbtn" data-op="pop">Remove max</button><button class="vbtn" data-op="reset">Reset</button>`,
    build(host, op) {
      if (op === "reset") base = [100, 88, 25, 87, 16, 8, 12, 86, 50, 2, 15, 3];
      const a = base.slice(), F = [];
      const push = (marks, msg, c) => F.push({ a: a.slice(), marks, msg, counters: c });
      if (!op || op === "reset") return [{ a, marks: {}, msg: "Every parent is at least as big as its children. The tree is stored level by level in the array below it." }];
      let swaps = 0;
      if (op === "insert") {
        if (a.length >= 15) return [{ a, marks: {}, msg: "Fifteen values fill four levels; remove one before inserting more." }];
        const v = num(host, "v", -999, 999, 90);
        a.push(v); let i = a.length - 1;
        push({ [i]: "mv" }, `Put ${v} in the next free slot, index ${i}: the last node, keeping the tree complete.`, { swaps });
        while (i > 0) {
          const p = (i - 1) >> 1;
          if (a[i] <= a[p]) { push({ [i]: "ok", [p]: "hl" }, `${a[i]} ≤ its parent ${a[p]}: the heap condition holds. Stop.`, { swaps }); break; }
          push({ [i]: "mv", [p]: "hl" }, `${a[i]} > its parent ${a[p]} (index ${p} = (${i} − 1) / 2): swap them.`, { swaps });
          [a[i], a[p]] = [a[p], a[i]]; swaps++; i = p;
          push({ [i]: "mv" }, `Trickled up to index ${i}.`, { swaps });
        }
        if (i === 0) push({ 0: "ok" }, `${a[0]} reached the root: it is the new maximum.`, { swaps });
      } else {
        if (!a.length) return [{ a, marks: {}, msg: "The heap is empty." }];
        const top = a[0];
        push({ 0: "bad", [a.length - 1]: "mv" }, `Remove the root, ${top}. Move the last node (${a[a.length - 1]}) into its place.`, { swaps });
        const last = a.pop(); if (a.length) a[0] = last;
        let i = 0;
        push({ 0: "mv" }, `${last} is now the root, which probably breaks the heap condition.`, { swaps });
        for (;;) {
          const l = 2 * i + 1, r = l + 1; let big = i;
          if (l < a.length && a[l] > a[big]) big = l;
          if (r < a.length && a[r] > a[big]) big = r;
          if (big === i) { push({ [i]: "ok" }, `${a[i]} is at least as big as its children. Done: removed **${top}**.`, { swaps }); break; }
          push({ [i]: "mv", [big]: "hl", ...(l < a.length && l !== big ? { [l]: "" } : {}) }, `Compare ${a[i]} with its children; the larger child is ${a[big]}. Swap with the **larger** child.`, { swaps });
          [a[i], a[big]] = [a[big], a[i]]; swaps++; i = big;
          push({ [i]: "mv" }, `Trickled down to index ${i}.`, { swaps });
        }
      }
      base = a.slice();
      return F;
    },
    render(f, stage) {
      stage.innerHTML = binTree(toTree(f.a, f.marks), { label: "heap as a tree", w: 40 }) + cells(f.a, { marks: f.marks });
    },
  });
};

/* ---------- Ch 53: trie ---------- */
W.trie = host => {
  const WORDS = ["pin", "pine", "pint", "pit", "sun", "sung", "sunk"];
  let words = WORDS.slice();
  const build = ws => { const root = { ch: "", kids: {}, end: false }; for (const w of ws) { let n = root; for (const c of w) n = n.kids[c] ||= { ch: c, kids: {}, end: false }; n.end = true; } return root; };
  const toDraw = (n, marks, prefix = "") => {
    const kids = Object.keys(n.kids).sort().map(c => toDraw(n.kids[c], marks, prefix + c));
    if (n.end) kids.push({ label: "*", kids: [], cls: marks["*" + prefix] || "" });
    return { label: n.ch || "root", kids, cls: marks[prefix] || "" };
  };
  return stepper(host, {
    title: "Trie: insert and autocomplete", speed: 650, enterOp: "complete",
    inputs: `<label>Text <input type="text" name="w" value="pi" maxlength="8" autocomplete="off"></label><button class="vbtn" data-op="complete">Autocomplete</button><button class="vbtn pen" data-op="insert">Insert word</button><button class="vbtn" data-op="reset">Reset</button>`,
    note: "A `*` child marks the end of a word, so \"pi\" (a prefix) and \"pin\" (a word) are told apart.",
    build(host, op) {
      if (op === "reset") words = WORDS.slice();
      const root = build(words);
      if (!op || op === "reset") return [{ t: toDraw(root, {}), msg: `Seven words, sharing prefixes: ${words.join(", ")}.` }];
      const w = val(host, "w").toLowerCase().replace(/[^a-z]/g, "").slice(0, 8);
      if (!w) return [{ t: toDraw(root, {}), msg: "Type some lowercase letters." }];
      const F = []; let n = root, prefix = ""; const marks = {};
      for (const c of w) {
        if (!n.kids[c]) {
          if (op === "complete") { F.push({ t: toDraw(root, { ...marks }), msg: `No "${c}" child after "${prefix}": no word starts with **${w}**.`, counters: { steps: prefix.length } }); return F; }
          break;
        }
        n = n.kids[c]; prefix += c; marks[prefix] = "hl";
        F.push({ t: toDraw(root, { ...marks }), msg: `Follow "${c}". One step per character.`, counters: { steps: prefix.length } });
      }
      if (op === "complete") {
        const found = [];
        (function collect(nd, p) { if (nd.end) found.push(p); for (const c of Object.keys(nd.kids).sort()) collect(nd.kids[c], p + c); })(n, prefix);
        const m2 = { ...marks };
        (function mark(nd, p) { if (nd.end) m2["*" + p] = "ok"; for (const c of Object.keys(nd.kids)) { if (p + c !== prefix) m2[p + c] = m2[p + c] || "ok"; mark(nd.kids[c], p + c); } })(n, prefix);
        F.push({ t: toDraw(root, m2), msg: found.length ? `Collect every word below the prefix node: **${found.join(", ")}**.` : `"${w}" is a path but no word continues from it.`, counters: { steps: prefix.length, words: found.length } });
        return F;
      }
      // insert
      if (prefix === w && n.end) { F.push({ t: toDraw(root, { ...marks, ["*" + w]: "ok" }), msg: `"${w}" is already a word (its end marker exists).` }); return F; }
      words = words.concat(w);
      const root2 = build(words), m3 = { ...marks };
      for (let i = prefix.length + 1; i <= w.length; i++) m3[w.slice(0, i)] = "mv";
      m3["*" + w] = "mv";
      F.push({ t: toDraw(root2, m3), msg: prefix.length === w.length ? `The path for "${w}" already existed; just add the end marker.` : `"${prefix || "(root)"}" already existed. Create ${w.length - prefix.length} new node${w.length - prefix.length === 1 ? "" : "s"} for "${w.slice(prefix.length)}", then the end marker.`, counters: { steps: w.length + 1 } });
      return F;
    },
    render(f, stage) { stage.innerHTML = naryTree(f.t, { label: "trie", h: 46, gap: 6 }); },
  });
};

/* ---------- Ch 61: graph traversal and Dijkstra ---------- */
const graphWidget = (host, first) => {
  const N = [{ id: "A", label: "Ame", x: 60, y: 130 }, { id: "B", label: "Ber", x: 200, y: 40 }, { id: "C", label: "Cor", x: 200, y: 215 }, { id: "D", label: "Dov", x: 360, y: 40 }, { id: "E", label: "Ede", x: 360, y: 215 }];
  const NAMES = { A: "Ames", B: "Bern", C: "Cork", D: "Dover", E: "Eden" };
  const E = [["A", "B", 4], ["A", "C", 2], ["B", "D", 5], ["C", "B", 1], ["C", "D", 8], ["C", "E", 10], ["D", "E", 2]];
  const ALGS = [["dijkstra", "Dijkstra (fastest route)"], ["bfs", "Breadth-first"], ["dfs", "Depth-first"]].sort((a, b) => (b[0] === first) - (a[0] === first));
  const adj = {}; N.forEach(n => adj[n.id] = []); E.forEach(([a, b, w]) => adj[a].push([b, w]));
  return stepper(host, {
    title: first === "dijkstra" ? "Shortest paths by travel time" : "Graph traversal", speed: 850,
    inputs: `<label>Algorithm <select name="alg">${ALGS.map(([v, l]) => `<option value="${v}">${l}</option>`).join("")}</select></label>
      <label>Start <select name="s">${N.map(n => `<option value="${n.id}">${NAMES[n.id]}</option>`).join("")}</select></label><button class="vbtn pen" data-op="run">Run</button>`,
    note: "One-way roads with travel minutes. Traversals follow the arrows; Dijkstra adds up the minutes.",
    build(host) {
      const alg = val(host, "alg") || first, s = val(host, "s") || "A", F = [];
      const nm = id => NAMES[id];
      if (alg === "dijkstra") {
        const cost = { [s]: 0 }, prev = {}, done = new Set();
        F.push({ alg, cost: { ...cost }, done: [], cur: null, msg: `Fastest known time: ${nm(s)} = 0, everything else unknown (∞).` });
        for (;;) {
          let cur = null;
          for (const id in cost) if (!done.has(id) && (cur === null || cost[id] < cost[cur])) cur = id;
          if (cur === null) break;
          done.add(cur);
          F.push({ alg, cost: { ...cost }, done: [...done], cur, prev: { ...prev }, msg: `Settle the nearest unsettled town: **${nm(cur)}** (${cost[cur]} min). Its time is now final.` });
          for (const [nb, w] of adj[cur]) {
            if (done.has(nb)) continue;
            const c = cost[cur] + w, better = !(nb in cost) || c < cost[nb];
            const old = nb in cost ? cost[nb] : "∞";
            if (better) { cost[nb] = c; prev[nb] = cur; }
            F.push({ alg, cost: { ...cost }, done: [...done], cur, edge: [cur, nb], prev: { ...prev }, upd: better ? nb : null, msg: `${nm(cur)} → ${nm(nb)} costs ${cost[cur]} + ${w} = ${c}. ${better ? `Faster than ${old}: update.` : `Not cheaper than ${old}: keep it.`}` });
          }
        }
        const path = t => { const p = [t]; while (p[0] !== s && prev[p[0]]) p.unshift(prev[p[0]]); return p[0] === s ? p : null; };
        const pe = path("E");
        F.push({ alg, cost: { ...cost }, done: [...done], prev: { ...prev }, path: pe, msg: pe && s !== "E" ? `Done. Fastest ${nm(s)} → Eden: **${cost.E} min**, via ${pe.map(nm).join(" → ")}.` : `Done: every reachable town has its fastest cost.` });
        return F;
      }
      const seen = new Set([s]), order = [], box = [s];
      F.push({ alg, box: box.slice(), seen: [...seen], order: [], msg: `Start at ${nm(s)}. ${alg === "bfs" ? "Queue" : "Stack"}: [${nm(s)}].` });
      while (box.length) {
        const cur = alg === "bfs" ? box.shift() : box.pop();
        order.push(cur);
        F.push({ alg, box: box.slice(), seen: [...seen], order: order.slice(), cur, msg: `${alg === "bfs" ? "Dequeue" : "Pop"} **${nm(cur)}** and visit it.` });
        const nbs = adj[cur].map(x => x[0]);
        const fresh = (alg === "dfs" ? nbs.slice().reverse() : nbs).filter(n => !seen.has(n));
        fresh.forEach(n => { seen.add(n); box.push(n); });
        if (fresh.length) F.push({ alg, box: box.slice(), seen: [...seen], order: order.slice(), cur, adds: fresh, msg: `Unseen neighbours: ${fresh.map(nm).join(", ")}. Mark them seen and ${alg === "bfs" ? "enqueue" : "push"} them.` });
      }
      F.push({ alg, box: [], seen: [...seen], order, msg: `Visit order: **${order.map(nm).join(" → ")}**. ${alg === "bfs" ? "Breadth-first goes level by level." : "Depth-first follows one path as far as it can before backtracking."}` });
      return F;
    },
    render(f, stage) {
      const nodes = N.map(n => {
        let cls = "", sub = null;
        if (f.alg === "dijkstra") {
          if (f.path?.includes(n.id)) cls = "ok"; else if (n.id === f.cur) cls = "hl"; else if (f.done.includes(n.id)) cls = "ok"; else if (n.id === f.upd) cls = "mv";
          sub = n.id in f.cost ? String(f.cost[n.id]) : "∞";
        } else {
          if (n.id === f.cur) cls = "hl"; else if (f.order.includes(n.id)) cls = "ok"; else if (f.adds?.includes(n.id)) cls = "mv"; else if (f.seen.includes(n.id)) cls = "";
          if (!f.seen.includes(n.id)) cls = "dim";
        }
        return { ...n, cls, sub };
      });
      const edges = E.map(([a, b, w]) => {
        let cls = "";
        if (f.edge && f.edge[0] === a && f.edge[1] === b) cls = "hl";
        else if (f.path) { const i = f.path.indexOf(a); if (i >= 0 && f.path[i + 1] === b) cls = "ok"; }
        else if (f.prev && f.prev[b] === a) cls = "ok";
        return { a, b, w: f.alg === "dijkstra" ? w : null, cls, bend: 0 };
      });
      let side;
      if (f.alg === "dijkstra") side = `<table class="vtable"><tr><th>Town</th><th>Minutes</th><th>Via</th></tr>${N.map(n => `<tr class="${n.id === f.cur ? "hl" : f.done.includes(n.id) ? "ok" : ""}"><td class="l">${NAMES[n.id]}</td><td>${n.id in f.cost ? f.cost[n.id] : "∞"}</td><td class="l">${f.prev?.[n.id] ? NAMES[f.prev[n.id]] : ""}</td></tr>`).join("")}</table>`;
      else side = `<div class="viz-row-label">${f.alg === "bfs" ? "Queue (front first)" : "Stack (top last)"}</div>${chips(f.box.map(id => NAMES[id]))}<div class="viz-row-label" style="margin-top:6px">Visited</div>${chips(f.order.map(id => NAMES[id]), () => "ok")}`;
      stage.innerHTML = `<div class="two" style="align-items:center">${graphSVG(nodes, edges, { directed: true, W: 420, H: 250, label: "road graph" })}<div style="min-width:0;overflow-x:auto">${side}</div></div>`;
    },
  });
};
W.graph = host => graphWidget(host, "bfs");
W.paths = host => graphWidget(host, "dijkstra");

/* ---------- Ch 12: space ---------- */
W.space = host => {
  host.classList.add("viz");
  host.innerHTML = `<div class="viz-head"><span class="viz-title">Extra memory as N grows</span><span class="viz-badge" data-n></span></div>
    <div class="viz-inputs"><label>N <input type="range" name="n" min="1" max="40" value="12"></label></div>
    <div data-rows style="display:grid;gap:10px"></div>
    <p class="viz-caption" data-c></p>`;
  const row = (label, n, cls, cx_) => `<div><div class="viz-row-label">${cx_} ${esc(label)} · ${n} unit${n === 1 ? "" : "s"}</div><div class="vchips" style="gap:3px">${[...Array(n)].map(() => `<span class="vchip ${cls}" style="padding:0;width:14px;height:14px"></span>`).join("")}</div></div>`;
  function draw() {
    const n = +$('[name="n"]', host).value;
    $("[data-n]", host).textContent = `N = ${n}`;
    $("[data-rows]", host).innerHTML = row("Scaled copy into a new array", n, "mv", cx("O(N)")) + row("Scale in place (one index)", 1, "ok", cx("O(1)")) + row("Reverse in place (two indexes)", 2, "ok", cx("O(1)")) + row("Recursive sum: one stack frame per call", n, "hl", cx("O(N)"));
    $("[data-c]", host).innerHTML = rich(`The input itself is not counted. At N = ${n}, copying needs ${n} new slots and recursion holds ${n} waiting frames, while the in-place versions need ${n > 0 ? "one or two" : "no"} variables whatever N is.`);
  }
  host.addEventListener("input", draw); draw();
};

/* ---------- Ch 73: two sum, two ways ---------- */
W.twoSum = host => stepper(host, {
  title: "Two sum: nested loops vs a hash lookup", speed: 550,
  inputs: `<label>Method <select name="m"><option value="nested">Nested loops</option><option value="hash">Hash lookup</option></select></label>
    <label>Target <input type="number" name="t" value="14"></label><button class="vbtn pen" data-op="run">Run</button>`,
  note: "Run both methods on the same target and compare the step counts.",
  build(host) {
    const A = [3, 9, 1, 5, 12, 2, 6, 8], t = num(host, "t", -999, 999, 14), m = val(host, "m") || "nested";
    const F = [{ A, marks: {}, seen: [], msg: `Find two values that add up to **${t}**.` }];
    let steps = 0;
    if (m === "nested") {
      for (let i = 0; i < A.length; i++) for (let j = i + 1; j < A.length; j++) {
        steps++;
        const hit = A[i] + A[j] === t;
        F.push({ A, marks: { [i]: hit ? "ok" : "hl", [j]: hit ? "ok" : "hl" }, ptrs: { [i]: "i", [j]: "j" }, msg: `${A[i]} + ${A[j]} = ${A[i] + A[j]}${hit ? ` = ${t}. **Found** after ${steps} checks.` : "."}`, counters: { checks: steps } });
        if (hit) return F;
      }
      F.push({ A, marks: {}, msg: `No pair adds up to ${t}: all ${steps} pairs checked, O(N²).`, counters: { checks: steps } });
      return F;
    }
    const seen = new Map();
    for (let i = 0; i < A.length; i++) {
      steps++;
      const need = t - A[i];
      if (seen.has(need)) { F.push({ A, marks: { [seen.get(need)]: "ok", [i]: "ok" }, ptrs: { [i]: "i" }, seen: [...seen.keys()], hit: need, msg: `${t} − ${A[i]} = ${need}, and ${need} **is** in the lookup. **Found** after ${steps} steps.`, counters: { steps } }); return F; }
      F.push({ A, marks: { [i]: "hl" }, ptrs: { [i]: "i" }, seen: [...seen.keys()], msg: `Need ${t} − ${A[i]} = ${need}. Not in the lookup yet, so add ${A[i]}.`, counters: { steps } });
      seen.set(A[i], i);
    }
    F.push({ A, marks: {}, seen: [...seen.keys()], msg: `No pair found after one pass, O(N).`, counters: { steps } });
    return F;
  },
  render(f, stage) {
    stage.innerHTML = cells(f.A, { marks: f.marks, ptrs: f.ptrs }) + (f.seen ? `<div class="vchips"><span class="viz-row-label">Lookup</span>${f.seen.map(x => `<span class="vchip ${x === f.hit ? "ok" : ""}">${esc(x)}</span>`).join("") || `<span class="vchip empty">empty</span>`}</div>` : "");
  },
});

// More visualizers. Simulations run for real in the browser; tree frames come from the real algorithms.

/* ---------- Ch 32: bottom-up mergesort ---------- */
W.mergeViz = host => stepper(host, {
  title: "Bottom-up mergesort, one merge at a time", speed: 520,
  inputs: `<label>Input <select name="preset"><option value="random">random</option><option value="reversed">reversed</option><option value="sorted">sorted</option><option value="dups">with duplicates</option></select></label><button class="vbtn" data-op="shuffle">New random</button>`,
  note: "Runs of width 1 merge into width 2, then 4, then 8. Each level moves every value once, and there are log₂ N levels.",
  build(host, action) {
    if (action === "shuffle") { host._seed = randomSeed(); $('[name="preset"]', host).value = "random"; }
    const kind = val(host, "preset") || "random";
    let a = [38, 27, 43, 3, 9, 82, 10, 19];
    if (kind === "sorted") a = a.slice().sort((x, y) => x - y);
    else if (kind === "reversed") a = a.slice().sort((x, y) => y - x);
    else if (kind === "dups") a = [5, 2, 5, 1, 2, 5, 1, 2];
    else { const r = rngFrom(host._seed ?? (host._seed = 11)); for (let i = a.length - 1; i > 0; i--) { const j = r.int(0, i); [a[i], a[j]] = [a[j], a[i]]; } }
    const n = a.length, F = [{ src: a.slice(), dst: Array(n).fill(null), width: 1, msg: "Start: every value on its own is a sorted run of width 1." }];
    let comps = 0, level = 0;
    for (let width = 1; width < n; width *= 2) {
      level++;
      const dst = Array(n).fill(null);
      for (let lo = 0; lo < n; lo += 2 * width) {
        const mid = Math.min(lo + width, n), hi = Math.min(lo + 2 * width, n);
        let i = lo, j = mid, k = lo;
        while (i < mid || j < hi) {
          let takeLeft;
          if (i < mid && j < hi) { comps++; takeLeft = a[i] <= a[j]; }
          else takeLeft = i < mid;
          const from = takeLeft ? i : j;
          dst[k] = a[from];
          F.push({ src: a.slice(), dst: dst.slice(), width, lo, mid, hi, i, j, from, k, msg: (i < mid && j < hi) ? `Compare ${a[i]} and ${a[j]}: take ${a[from]} from the ${takeLeft ? "left" : "right"} run${takeLeft && a[i] === a[j] ? " (ties take the left, which keeps the sort stable)" : ""}.` : `The ${takeLeft ? "right" : "left"} run is used up: copy ${a[from]} across.`, counters: { level, comparisons: comps } });
          if (takeLeft) i++; else j++;
          k++;
        }
      }
      a = dst;
      F.push({ src: a.slice(), dst: Array(n).fill(null), width: width * 2, msg: `Level ${level} done: sorted runs of width ${Math.min(width * 2, n)}.`, counters: { level, comparisons: comps } });
    }
    F[F.length - 1].msg = `Sorted in **${level} levels** (log₂ 8 = 3) with **${comps} comparisons**. Every input takes the same number of levels.`;
    return F;
  },
  render(f, stage) {
    const sm = {}, dm = {}, sp = {};
    if (f.lo != null) {
      f.src.forEach((_, x) => { if (x < f.lo || x >= f.hi) sm[x] = "dim"; else if (x < f.mid ? x < f.i : x < f.j) sm[x] = "dim"; });
      sm[f.from] = "hl";
      if (f.i < f.mid) sp[f.i] = "i"; if (f.j < f.hi) sp[f.j] = "j";
      dm[f.k] = "mv";
    }
    stage.innerHTML = `<div class="viz-row-label">Runs of width ${f.lo != null ? f.mid - f.lo : Math.min(f.width, f.src.length)}</div>${cells(f.src, { marks: sm, ptrs: sp })}
      ${f.lo != null ? `<div class="viz-row-label">Merged output</div>${cells(f.dst, { marks: dm })}` : ""}`;
  },
});

/* ---------- Ch 13: a real benchmark in the browser ---------- */
W.benchLab = host => {
  host.classList.add("viz");
  host.innerHTML = `<div class="viz-head"><span class="viz-title">Benchmark lab: time three sorts in your browser</span><span class="viz-badge" data-b></span></div>
    <div class="viz-inputs"><label><input type="checkbox" name="gotcha"> sort the same array every run (the gotcha)</label><button class="vbtn pen" data-run>Run benchmark</button></div>
    <div data-out><p class="viz-note">Press <b>Run benchmark</b>. Each sort runs 5 times per size on fresh random integers; the table keeps the fastest run. It takes about a second.</p></div>
    <p class="viz-caption" data-c></p>`;
  const insertion = a => { for (let i = 1; i < a.length; i++) { const t = a[i]; let p = i - 1; while (p >= 0 && a[p] > t) { a[p + 1] = a[p]; p--; } a[p + 1] = t; } return a; };
  const mergeCopy = a => { const n = a.length; let src = a, dst = new Array(n); for (let w = 1; w < n; w *= 2) { for (let lo = 0; lo < n; lo += 2 * w) { const m = Math.min(lo + w, n), h = Math.min(lo + 2 * w, n); let i = lo, j = m, k = lo; while (i < m && j < h) dst[k++] = src[i] <= src[j] ? src[i++] : src[j++]; while (i < m) dst[k++] = src[i++]; while (j < h) dst[k++] = src[j++]; } [src, dst] = [dst, src]; } return src; };
  const merge = a => { const out = mergeCopy(a); for (let i = 0; i < a.length; i++) a[i] = out[i]; return a; }; // sorts the input, like the others
  const builtin = a => a.sort((x, y) => x - y);
  const algs = [["Insertion sort", insertion, "on2"], ["Mergesort", merge, "onlogn"], ["Built-in sort", builtin, "o1"]];
  const sizes = [1000, 2000, 4000, 8000];
  const slope = pts => { const xs = pts.map(p => Math.log(p[0])), ys = pts.map(p => Math.log(Math.max(p[1], 1e-4))); const mx = xs.reduce((a, b) => a + b) / xs.length, my = ys.reduce((a, b) => a + b) / ys.length; let nu = 0, de = 0; xs.forEach((x, i) => { nu += (x - mx) * (ys[i] - my); de += (x - mx) ** 2; }); return nu / de; };
  $("[data-run]", host).addEventListener("click", async () => {
    const btn = $("[data-run]", host); btn.disabled = true; btn.textContent = "Running…";
    const gotcha = $('[name="gotcha"]', host).checked, r = rngFrom(randomSeed());
    const res = algs.map(() => []);
    for (const n of sizes) {
      const data = Array.from({ length: n }, () => r.int(0, 1e6));
      for (let ai = 0; ai < algs.length; ai++) {
        let best = Infinity; const shared = data.slice();
        for (let rep = 0; rep < 5; rep++) {
          const input = gotcha ? shared : data.slice();       // copy outside the timer
          const t0 = performance.now(); algs[ai][1](input); const dt = performance.now() - t0;
          best = Math.min(best, dt);
        }
        res[ai].push([n, best]);
        await new Promise(requestAnimationFrame);
      }
    }
    $("[data-out]", host).innerHTML = `<div class="scroller"><table class="vtable"><tr><th>Sort</th>${sizes.map(n => `<th>N = ${n.toLocaleString("en-US")}</th>`).join("")}<th>Growth exponent</th></tr>
      ${algs.map((al, i) => `<tr><td class="l">${al[0]}</td>${res[i].map(p => `<td>${p[1] < 0.1 ? "<0.1" : p[1].toFixed(1)} ms</td>`).join("")}<td><b>${slope(res[i]).toFixed(2)}</b></td></tr>`).join("")}</table></div>`
      + barChart(res.flatMap((rr, i) => rr.map(p => ({ v: p[1], label: `${(p[0] / 1000)}k`, cls: ["bad", "alt", "ok"][i], title: `${algs[i][0]}, N = ${p[0]}: ${p[1].toFixed(2)} ms` }))), { h: 150, fmt: v => v.toFixed(0) + " ms", label: "benchmark times" })
      + `<div class="legend">${algs.map((a, i) => `<span><i style="background:var(--${["v-bad-b", "v-mv-b", "v-ok-b"][i]})"></i>${a[0]}</span>`).join("")}</div>`;
    const ins = slope(res[0]);
    $("[data-c]", host).innerHTML = rich(gotcha
      ? `With the gotcha on, runs 2–5 sort data that is **already sorted**, and insertion sort's best case is O(N). Its exponent drops towards 1 and the table now lies about its real cost. Untick the box and run again.`
      : `Insertion sort's exponent is about **${ins.toFixed(1)}**: doubling N roughly ${ins > 1.6 ? "quadruples" : "more than doubles"} its time, the signature of O(N²). The O(N log N) sorts sit near 1. Timings in a browser are noisy; the exponents are the reliable part.`);
    $("[data-b]", host).textContent = gotcha ? "gotcha on" : "fresh input each run";
    btn.disabled = false; btn.textContent = "Run again";
  });
};

/* ---------- Ch 74: shuffle bias ---------- */
W.shuffleBias = host => {
  host.classList.add("viz");
  host.innerHTML = `<div class="viz-head"><span class="viz-title">Shuffle [A, B, C] 60,000 times</span><span class="viz-badge" data-b></span></div>
    <div class="viz-inputs"><button class="vbtn pen" data-run>Run both shuffles</button></div>
    <div data-out></div><p class="viz-caption" data-c></p>`;
  const perms = ["ABC", "ACB", "BAC", "BCA", "CAB", "CBA"], T = 60000;
  function run() {
    const r = rngFrom(randomSeed()), naive = Object.fromEntries(perms.map(p => [p, 0])), fy = { ...naive };
    for (let t = 0; t < T; t++) {
      let a = ["A", "B", "C"];
      for (let i = 0; i < 3; i++) { const j = r.int(0, 2); [a[i], a[j]] = [a[j], a[i]]; }
      naive[a.join("")]++;
      a = ["A", "B", "C"];
      for (let i = 2; i > 0; i--) { const j = r.int(0, i); [a[i], a[j]] = [a[j], a[i]]; }
      fy[a.join("")]++;
    }
    const exp = T / 6, max = Math.max(...Object.values(naive), ...Object.values(fy)) * 1.08;
    const chart = (counts, title, cls) => `<div style="min-width:0"><div class="viz-row-label">${title}</div>${barChart(perms.map(p => ({ v: counts[p], label: p, cls: Math.abs(counts[p] - exp) > exp * 0.06 ? "bad" : cls, title: `${counts[p]} (${(100 * counts[p] / T).toFixed(1)}%)` })), { max, ref: exp, refLabel: "fair: 1/6", h: 160, W: 300, fmt: v => Math.round(v / 1000) + "k" })}</div>`;
    $("[data-out]", host).innerHTML = `<div class="two">${chart(naive, "Naive: swap each with any position", "alt")}${chart(fy, "Fisher–Yates", "ok")}</div>`;
    $("[data-c]", host).innerHTML = rich(`The naive shuffle makes 3 × 3 × 3 = 27 equally likely choices, which cannot split evenly over 6 orders: three orders get 5/27 (18.5%) and three get 4/27 (14.8%). Fisher–Yates makes 3 × 2 = 6 choices, one per order, so each lands near 16.7%.`);
    $("[data-b]", host).textContent = `${T.toLocaleString("en-US")} trials each`;
  }
  $("[data-run]", host).addEventListener("click", run); run();
};

/* ---------- Ch 81: cache simulator ---------- */
W.cacheSim = host => stepper(host, {
  title: "LRU vs FIFO on the same requests", speed: 650,
  inputs: `<label>Requests <select name="p"><option value="hot">Two hot keys among one-offs</option><option value="cyc">Cycle through 4 keys</option><option value="mix">Mixed</option></select></label><label>Capacity <select name="c"><option>2</option><option selected>3</option><option>4</option></select></label>`,
  note: "Most recent on the left for LRU; oldest insert on the right for FIFO, which is the next one out.",
  build(host) {
    const pat = { hot: "A B A C A B D A B E A B", cyc: "A B C D A B C D A B C D", mix: "A B C A D B E A C B A D" }[val(host, "p") || "hot"].split(" ");
    const cap = +val(host, "c") || 3;
    let lru = [], fifo = [], lh = 0, fh = 0;
    const F = [{ lru: [], fifo: [], reqs: pat, i: -1, msg: `Both caches hold ${cap} keys. A hit costs nothing; a miss loads the key and may evict another.` }];
    pat.forEach((k, i) => {
      const lhit = lru.includes(k), fhit = fifo.includes(k);
      let lev = null, fev = null;
      if (lhit) { lru = [k, ...lru.filter(x => x !== k)]; lh++; }
      else { lru = [k, ...lru]; if (lru.length > cap) lev = lru.pop(); }
      if (fhit) fh++;
      else { fifo = [k, ...fifo]; if (fifo.length > cap) fev = fifo.pop(); }
      F.push({ lru: lru.slice(), fifo: fifo.slice(), reqs: pat, i, k, lhit, fhit, msg: `Request **${k}**. LRU: ${lhit ? "hit, move it to the front" : `miss${lev ? `, evict ${lev} (least recently used)` : ""}`}. FIFO: ${fhit ? "hit (order unchanged)" : `miss${fev ? `, evict ${fev} (oldest insert)` : ""}`}.`, counters: { "LRU hits": lh, "FIFO hits": fh } });
    });
    const last = F[F.length - 1];
    last.msg += ` Final hit rates: LRU ${Math.round(100 * lh / pat.length)}%, FIFO ${Math.round(100 * fh / pat.length)}%.` + (val(host, "p") === "cyc" && cap < 4 ? " Cycling through more keys than fit makes LRU miss **every** time." : "");
    return F;
  },
  render(f, stage) {
    const req = cells(f.reqs, { marks: Object.fromEntries(f.reqs.map((_, x) => [x, x === f.i ? "hl" : x < f.i ? "dim" : ""])), idx: false });
    const row = (name, items, hit) => `<div class="vchips"><span class="viz-row-label" style="width:46px">${name}</span>${items.map(x => `<span class="vchip ${x === f.k ? (hit ? "ok" : "mv") : ""}">${esc(x)}</span>`).join("") || `<span class="vchip empty">empty</span>`}${f.k ? `<span class="vchip ${hit ? "ok" : "bad"}" style="margin-left:6px">${hit ? "hit" : "miss"}</span>` : ""}</div>`;
    stage.innerHTML = `<div class="viz-row-label">Requests</div>${req}${row("LRU", f.lru, f.lhit)}${row("FIFO", f.fifo, f.fhit)}`;
  },
});

/* ---------- Ch 54: red-black tree insertion ---------- */
W.rbTree = host => {
  let keys = [1, 2, 3, 4, 5, 6, 7];
  const snapshot = (root, marks = {}) => { const c = n => n ? { k: n.k, l: c(n.l), r: c(n.r), cls: (n.red ? "red" : "black") + (marks[n.k] ? " " + marks[n.k] : "") } : null; return c(root); };
  function insertFrames(ks, newKey) {
    // rebuild silently from ks, then insert newKey with recorded frames
    let root = null; const F = []; let rotations = 0, before = 0;
    const rotL = x => { const y = x.r; x.r = y.l; if (y.l) y.l.p = x; y.p = x.p; if (!x.p) root = y; else if (x === x.p.l) x.p.l = y; else x.p.r = y; y.l = x; x.p = y; rotations++; };
    const rotR = x => { const y = x.l; x.l = y.r; if (y.r) y.r.p = x; y.p = x.p; if (!x.p) root = y; else if (x === x.p.r) x.p.r = y; else x.p.l = y; y.r = x; x.p = y; rotations++; };
    const isRed = n => !!n && n.red;
    function ins(k, rec) {
      let p = null, n = root;
      while (n) { p = n; if (k === n.k) return false; n = k < n.k ? n.l : n.r; }
      const z = { k, red: true, l: null, r: null, p };
      if (!p) root = z; else if (k < p.k) p.l = z; else p.r = z;
      const push = (marks, msg) => rec && F.push({ t: snapshot(root, marks), msg, counters: { rotations: rotations - before } });
      push({ [k]: "mv" }, `Insert ${k} as in a plain BST and colour it **red**, so no path gains a black node.`);
      let x = z;
      while (x.p && x.p.red) {
        const par = x.p, g = par.p, left = par === g.l, u = left ? g.r : g.l;
        if (isRed(u)) {
          push({ [x.k]: "mv", [par.k]: "hl", [u.k]: "hl", [g.k]: "hl" }, `${x.k} and its parent ${par.k} are both red. The uncle ${u.k} is **red**: recolour parent and uncle black, grandparent ${g.k} red, and check again from ${g.k}.`);
          par.red = false; u.red = false; g.red = true; x = g;
          push({ [g.k]: "mv" }, `Recoloured. The red-red problem, if any, has moved up to ${g.k}.`);
        } else {
          if (left ? x === par.r : x === par.l) {
            push({ [x.k]: "mv", [par.k]: "hl" }, `Red-red with a **black** uncle, and ${x.k} is an inner child (zig-zag). First rotate ${left ? "left" : "right"} at ${par.k} to make a straight line.`);
            x = par; left ? rotL(x) : rotR(x);
            push({ [x.k]: "mv", [x.p.k]: "hl" }, `Rotated. Now ${x.k} is an outer child of ${x.p.k}.`);
          }
          const P = x.p, G = P.p;
          push({ [P.k]: "hl", [G.k]: "hl" }, `Black uncle, straight line: colour ${P.k} black and ${G.k} red, then rotate ${left ? "right" : "left"} at ${G.k}.`);
          P.red = false; G.red = true; left ? rotR(G) : rotL(G);
          push({ [P.k]: "mv" }, `Rotated: ${P.k} now sits where ${G.k} was. The red-red violation is fixed for good.`);
        }
      }
      if (root.red) { root.red = false; push({ [root.k]: "mv" }, `Paint the root black (rule 1).`); }
      return true;
    }
    ks.forEach(k => ins(k, false));
    before = rotations;
    if (newKey == null) return { F: [{ t: snapshot(root), msg: ks.length ? `${ks.length} keys. Every path from the root to an empty child passes the same number of black nodes.` : "An empty tree. Insert keys, or try **1 to 10 in order**, the worst case for a plain BST.", counters: { rotations: 0 } }], ok: true };
    const okIns = ins(newKey, true);
    if (!okIns) return { F: [{ t: snapshot(root, { [newKey]: "ok" }), msg: `${newKey} is already in the tree.` }], ok: false };
    const h = n => n ? 1 + Math.max(h(n.l), h(n.r)) : 0;
    const cnt = ks.length + 1;
    F.push({ t: snapshot(root), msg: `Done: ${cnt} keys, height **${h(root)}** (the bound is 2 log₂(N + 1) = ${(2 * Math.log2(cnt + 1)).toFixed(1)}). This insert used ${rotations - before} rotation${rotations - before === 1 ? "" : "s"}.`, counters: { rotations: rotations - before } });
    return { F, ok: true };
  }
  return stepper(host, {
    title: "Red-black tree insertion", speed: 900, enterOp: "insert",
    inputs: `<label>Key <input type="number" name="v" value="8"></label><button class="vbtn pen" data-op="insert">Insert</button><button class="vbtn" data-op="next">Insert next in order</button><button class="vbtn" data-op="reset">Clear</button>`,
    note: "Keep pressing **Insert next in order**: sorted keys would make a plain BST a straight line, but this tree stays shallow.",
    build(host, op) {
      if (op === "reset") keys = [];
      if (op === "next") { const nx = keys.length ? Math.max(...keys) + 1 : 1; $('[name="v"]', host).value = nx; op = "insert"; }
      if (op !== "insert") return insertFrames(keys, null).F;
      const v = num(host, "v", -999, 999, 1);
      if (keys.length >= 24) return [{ t: insertFrames(keys, null).F[0].t, msg: "That is plenty of keys for one screen. Press **Clear** to start again." }];
      const { F, ok } = insertFrames(keys, v);
      if (ok) { keys = keys.concat(v); $('[name="v"]', host).value = Math.max(...keys) + 1; }
      return F;
    },
    render(f, stage) { stage.innerHTML = f.t ? binTree(f.t, { label: "red-black tree", w: 38 }) : `<p class="viz-note">(empty tree)</p>`; },
  });
};

/* ---------- Ch 54: treap ---------- */
W.treap = host => {
  let rng = rngFrom(randomSeed()), items = [];
  { const used = new Set(); for (let k = 1; k <= 7; k++) { let p; do p = rng.int(0, 99); while (used.has(p)); used.add(p); items.push([k, p]); } }
  const snap = (root, marks = {}) => { const c = n => n ? { k: n.k, sub: n.p, l: c(n.l), r: c(n.r), cls: marks[n.k] || "" } : null; return c(root); };
  // Plain treap insert; `log` (optional) receives each rotation in the order it happens (bottom-up).
  function tIns(n, k, p, log) {
    if (!n) return { k, p, l: null, r: null };
    if (k < n.k) { n.l = tIns(n.l, k, p, log); if (n.l.p > n.p) { const c = n.l; log?.push({ k: c.k, parent: n.k, dir: "right", pc: c.p, pn: n.p }); n.l = c.r; c.r = n; return c; } }
    else if (k > n.k) { n.r = tIns(n.r, k, p, log); if (n.r.p > n.p) { const c = n.r; log?.push({ k: c.k, parent: n.k, dir: "left", pc: c.p, pn: n.p }); n.r = c.l; c.l = n; return c; } }
    return n;
  }
  const fromList = list => { let r = null; for (const [k, p] of list) r = tIns(r, k, p); return r; };
  const copy = n => n ? { k: n.k, p: n.p, l: copy(n.l), r: copy(n.r) } : null;
  function buildFrames(list, add) {
    const F = [], [k, p] = add, root = fromList(list);
    // 1. the new key hangs as a plain BST leaf
    const placeLeaf = n => { if (!n) return { k, p, l: null, r: null }; if (k < n.k) n.l = placeLeaf(n.l); else n.r = placeLeaf(n.r); return n; };
    let cur = placeLeaf(copy(root));
    F.push({ t: snap(cur, { [k]: "mv" }), msg: `Insert ${k} as a BST leaf with random priority **${p}** (priorities are shown under each key).` });
    // 2. record the rotations the real insert performs, then replay them on the picture
    const pend = []; tIns(root, k, p, pend);
    for (const e of pend) {
      const rot = (n) => {
        if (!n) return n;
        if (n.k === e.parent) { if (e.dir === "right") { const c = n.l; n.l = c.r; c.r = n; return c; } const c = n.r; n.r = c.l; c.l = n; return c; }
        n.l = rot(n.l); n.r = rot(n.r); return n;
      };
      F.push({ t: snap(cur, { [e.k]: "mv", [e.parent]: "hl" }), msg: `${e.k} (priority ${e.pc}) outranks its parent ${e.parent} (${e.pn}): rotate ${e.dir} to lift it.` });
      cur = rot(cur);
      F.push({ t: snap(cur, { [e.k]: "mv" }), msg: `Rotated. Keys are still in BST order left to right.` });
    }
    const h = n => n ? 1 + Math.max(h(n.l), h(n.r)) : 0;
    F.push({ t: snap(cur), msg: pend.length ? `Heap order restored: every parent outranks its children. Height ${h(cur)} for ${list.length + 1} keys.` : `Priority ${p} is lower than its parent's, so it stays a leaf. Height ${h(cur)} for ${list.length + 1} keys.` });
    return F;
  }
  return stepper(host, {
    title: "Treap insertion with random priorities", speed: 900, enterOp: "insert",
    inputs: `<label>Key <input type="number" name="v" value="8"></label><button class="vbtn pen" data-op="insert">Insert</button><button class="vbtn" data-op="next">Insert next in order</button><button class="vbtn" data-op="reset">Clear</button>`,
    note: "Priorities (0–99) are drawn at random when a key is inserted. Insert 1, 2, 3, … in order and the tree still stays shallow.",
    build(host, op) {
      if (op === "reset") { items = []; rng = rngFrom(randomSeed()); }
      if (op === "next") { $('[name="v"]', host).value = items.length ? Math.max(...items.map(x => x[0])) + 1 : 1; op = "insert"; }
      const now = () => snap(fromList(items));
      if (op !== "insert") return [{ t: now(), msg: items.length ? `${items.length} keys: in order left to right, and every parent's priority beats its children's.` : "An empty treap. Each new key gets a random priority from 0 to 99." }];
      const v = num(host, "v", -999, 999, 1);
      if (items.some(x => x[0] === v)) return [{ t: now(), msg: `${v} is already in the treap.` }];
      if (items.length >= 20) return [{ t: now(), msg: "That is plenty for one screen. Press **Clear** to start again." }];
      let p = rng.int(0, 99); while (items.some(x => x[1] === p)) p = rng.int(0, 99);
      const F = buildFrames(items, [v, p]);
      items = items.concat([[v, p]]);
      $('[name="v"]', host).value = Math.max(...items.map(x => x[0])) + 1;
      return F;
    },
    render(f, stage) { stage.innerHTML = f.t ? binTree(f.t, { label: "treap", w: 38 }) : `<p class="viz-note">(empty treap)</p>`; },
  });
};

/* ---------- Ch 55: B-tree insertion (t = 2) ---------- */
W.btree = host => {
  const T = 2; let keys = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  const snap = (root, mark = {}) => { const c = n => ({ keys: n.keys.slice(), kids: n.leaf ? [] : n.kids.map(c), cls: mark.node === n ? mark.cls : "", hk: mark.node === n ? mark.hk : undefined }); return c(root); };
  function run(ks, add) {
    let root = { leaf: true, keys: [], kids: [] }; const F = [];
    const lower = (a, k) => { let i = 0; while (i < a.length && a[i] < k) i++; return i; };
    function split(par, i, rec) {
      const full = par.kids[i], right = { leaf: full.leaf, keys: full.keys.slice(T), kids: full.leaf ? [] : full.kids.slice(T) };
      const mid = full.keys[T - 1];
      if (rec) F.push({ t: snap(root, { node: full, cls: "bad" }), msg: `This node is full (${2 * T - 1} keys). Split it before going in: the middle key **${mid}** moves up.` });
      full.keys = full.keys.slice(0, T - 1); if (!full.leaf) full.kids = full.kids.slice(0, T);
      par.keys.splice(i, 0, mid); par.kids.splice(i + 1, 0, right);
      if (rec) F.push({ t: snap(root, { node: par, cls: "mv", hk: i }), msg: `${mid} joined the parent; the full node became two half-full nodes.` });
    }
    function insert(k, rec) {
      if (rec && root.keys.length === 2 * T - 1) F.push({ t: snap(root, { node: root, cls: "bad" }), msg: `The root is full. Grow a new empty root above it, then split: the only way the tree gets taller.` });
      if (root.keys.length === 2 * T - 1) { const nr = { leaf: false, keys: [], kids: [root] }; root = nr; split(nr, 0, rec); }
      let n = root;
      while (!n.leaf) {
        let i = lower(n.keys, k);
        if (rec) F.push({ t: snap(root, { node: n, cls: "hl" }), msg: `At node [${n.keys.join(", ")}]: ${k} belongs in child ${i}.` });
        if (n.kids[i].keys.length === 2 * T - 1) { split(n, i, rec); if (k > n.keys[i]) i++; }
        n = n.kids[i];
      }
      const i = lower(n.keys, k); n.keys.splice(i, 0, k);
      if (rec) F.push({ t: snap(root, { node: n, cls: "mv", hk: i }), msg: `Reached a leaf with room: insert ${k} in sorted position.` });
    }
    ks.forEach(k => insert(k, false));
    if (add == null) return { F: [{ t: snap(root), msg: ks.length ? `${ks.length} keys. Each node holds 1 to 3 keys (t = 2), and every leaf is at the same depth.` : "An empty B-tree with t = 2: each node holds 1 to 3 keys and up to 4 children." }] };
    insert(add, true);
    let h = 1, n = root; while (!n.leaf) { n = n.kids[0]; h++; }
    F.push({ t: snap(root), msg: `Done: ${ks.length + 1} keys in **${h} level${h === 1 ? "" : "s"}**, all leaves at the same depth.` });
    return { F };
  }
  return stepper(host, {
    title: "B-tree insertion with proactive splits", speed: 900, enterOp: "insert",
    inputs: `<label>Key <input type="number" name="v" value="11"></label><button class="vbtn pen" data-op="insert">Insert</button><button class="vbtn" data-op="next">Insert next in order</button><button class="vbtn" data-op="reset">Clear</button>`,
    note: "Real B-trees have hundreds of keys per node (one disk block each); t = 2 keeps the picture readable.",
    build(host, op) {
      if (op === "reset") keys = [];
      if (op === "next") { $('[name="v"]', host).value = keys.length ? Math.max(...keys) + 1 : 1; op = "insert"; }
      if (op !== "insert") return run(keys, null).F;
      const v = num(host, "v", -999, 999, 1);
      if (keys.includes(v)) return [{ t: run(keys, null).F[0].t, msg: `${v} is already in the tree.` }];
      if (keys.length >= 30) return [{ t: run(keys, null).F[0].t, msg: "That is plenty for one screen. Press **Clear** to start again." }];
      const { F } = run(keys, v); keys = keys.concat(v);
      $('[name="v"]', host).value = Math.max(...keys) + 1;
      return F;
    },
    render(f, stage) { stage.innerHTML = naryTree(f.t, { label: "B-tree", h: 56, gap: 12, cw: 28 }); },
  });
};

/* ---------- Ch 82: external sort calculator ---------- */
W.extSort = host => {
  host.classList.add("viz");
  const Ns = [1e4, 1e5, 1e6, 1e7, 1e8, 1e9, 1e10, 1e11, 1e12], Ms = [100, 1e3, 1e4, 1e5, 1e6, 1e7, 1e8, 1e9], Bs = [10, 100, 1000, 10000];
  const fmt = v => v >= 1e6 ? v.toExponential(0).replace("e+", " × 10^") : v.toLocaleString("en-US");
  host.innerHTML = `<div class="viz-head"><span class="viz-title">How many passes over the disk?</span><span class="viz-badge" data-b></span></div>
    <div class="viz-inputs">
      <label>N items <input type="range" name="n" min="0" max="${Ns.length - 1}" value="6"></label>
      <label>Memory M <input type="range" name="m" min="0" max="${Ms.length - 1}" value="4"></label>
      <label>Block B <input type="range" name="b" min="0" max="${Bs.length - 1}" value="1"></label>
    </div>
    <div data-out></div><p class="viz-caption" data-c></p>`;
  const passes = (runs, fan) => { let m = 0; while (runs > 1) { runs = Math.ceil(runs / fan); m++; } return 1 + m; };
  function draw() {
    const N = Ns[+$('[name="n"]', host).value], M = Ms[+$('[name="m"]', host).value], B = Math.min(Bs[+$('[name="b"]', host).value], M / 2);
    const runs = Math.ceil(N / M), fan = Math.max(2, Math.floor(M / B) - 1);
    const p2 = passes(runs, 2), pm = passes(runs, fan), io = n => 2 * n * Math.ceil(N / B);
    $("[data-b]", host).textContent = `N = ${fmt(N)}, M = ${fmt(M)}, B = ${fmt(B)}`;
    const strip = (p, cls) => `<div class="vchips" style="gap:3px">${[...Array(Math.min(p, 40))].map((_, i) => `<span class="vchip ${i ? cls : "hl"}" style="padding:2px 6px">${i ? "merge" : "runs"}</span>`).join("")}${p > 40 ? "…" : ""}</div>`;
    $("[data-out]", host).innerHTML = `<div class="scroller"><table class="vtable"><tr><th></th><th>Two-way merge</th><th>${fan.toLocaleString("en-US")}-way merge (M/B − 1)</th></tr>
      <tr><td class="l">Pass 0 makes runs</td><td>${fmt(runs)}</td><td>${fmt(runs)}</td></tr>
      <tr><td class="l">Total passes</td><td><b>${p2}</b></td><td class="ok"><b>${pm}</b></td></tr>
      <tr><td class="l">Block transfers (2N/B per pass)</td><td>${fmt(io(p2))}</td><td class="ok">${fmt(io(pm))}</td></tr></table></div>
      <div class="viz-row-label">Two-way</div>${strip(p2, "bad")}<div class="viz-row-label">${fan.toLocaleString("en-US")}-way</div>${strip(pm, "ok")}`;
    $("[data-c]", host).innerHTML = rich(runs <= 1 ? `Everything fits in memory: one pass, an ordinary in-memory sort.` : `Memory holds ${fmt(M / B)} blocks, so one merge can combine **${fan.toLocaleString("en-US")} runs** at once instead of 2. That cuts ${p2} passes to **${pm}**, ${(p2 / pm).toFixed(1)}× less disk traffic.`);
  }
  host.addEventListener("input", draw); draw();
};

/* ---------- Ch 74: Monte Carlo pi ---------- */
W.darts = host => {
  host.classList.add("viz");
  host.innerHTML = `<div class="viz-head"><span class="viz-title">Estimate π by throwing darts</span><span class="viz-badge" data-b>0 darts</span></div>
    <div class="viz-inputs"><button class="vbtn pen" data-add="100">+100</button><button class="vbtn pen" data-add="1000">+1,000</button><button class="vbtn pen" data-add="10000">+10,000</button><button class="vbtn" data-reset>Reset</button></div>
    <div class="two" style="align-items:center"><div style="max-width:300px;width:100%;margin:0 auto"><canvas width="600" height="600" style="width:100%;height:auto;border:1.5px solid var(--ink);border-radius:8px;background:var(--sheet)"></canvas></div><div data-out style="min-width:0"></div></div>
    <p class="viz-caption" data-c></p>`;
  const cv = $("canvas", host), ctx = cv.getContext("2d");
  let total = 0, inside = 0, rng = rngFrom(randomSeed()), hist = [];
  const css = v => getComputedStyle(host).getPropertyValue(v).trim();
  function frame() {
    ctx.clearRect(0, 0, 600, 600);
    ctx.strokeStyle = css("--ink-3"); ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0, 600, 600, -Math.PI / 2, 0); ctx.stroke();
  }
  function add(k) {
    const show = Math.min(k, 3000), inC = css("--v-ok-b"), outC = css("--v-bad-b");
    for (let t = 0; t < k; t++) {
      const x = rng.next(), y = rng.next(), hit = x * x + y * y <= 1;
      total++; if (hit) inside++;
      if (t < show && total <= 30000) { ctx.fillStyle = hit ? inC : outC; ctx.fillRect(x * 600 - 2, 600 - y * 600 - 2, 4, 4); }
    }
    hist.push([total, 4 * inside / total]);
    report();
  }
  function report() {
    const est = total ? 4 * inside / total : 0, err = Math.abs(est - Math.PI);
    $("[data-b]", host).textContent = `${total.toLocaleString("en-US")} darts`;
    $("[data-out]", host).innerHTML = total ? `<table class="vtable"><tr><th>Inside the quarter circle</th><td>${inside.toLocaleString("en-US")}</td></tr><tr><th>Estimate 4 × inside ÷ total</th><td><b>${est.toFixed(4)}</b></td></tr><tr><th>True π</th><td>3.1416</td></tr><tr><th>Error</th><td>${err.toFixed(4)}</td></tr><tr><th>Typical error ≈ 1.64 / √S</th><td>${(1.64 / Math.sqrt(total)).toFixed(4)}</td></tr></table>` : "";
    $("[data-c]", host).innerHTML = rich(total ? `The fraction of darts inside approaches π/4. Error shrinks like **1/√S**: 100 times more darts buy about one more correct digit.${total > 30000 ? " (Only the first 30,000 darts are drawn.)" : ""}` : "Each dart lands at a random point in the square. Add some.");
  }
  host.addEventListener("click", e => {
    const a = e.target.closest("[data-add]"); if (a) add(+a.dataset.add);
    if (e.target.closest("[data-reset]")) { total = inside = 0; hist = []; rng = rngFrom(randomSeed()); frame(); report(); }
  });
  frame(); report();
  matchMedia("(prefers-color-scheme: dark)").addEventListener?.("change", () => { frame(); });
};

/* ---------- Ch 42: hash spread ---------- */
W.hashSpread = host => {
  host.classList.add("viz");
  host.innerHTML = `<div class="viz-head"><span class="viz-title">Where do the keys land?</span><span class="viz-badge" data-b></span></div>
    <div class="viz-inputs">
      <label>Keys <select name="k"><option value="m8">0, 8, 16, … (multiples of 8)</option><option value="adv">0, m, 2m, … (chosen to collide)</option><option value="seq">0, 1, 2, …</option><option value="rand">random</option></select></label>
      <label>Buckets m <select name="m"><option>64</option><option>61</option><option>32</option><option>31</option></select></label>
      <label>Function <select name="f"><option value="div">division: k mod m</option><option value="mult">multiplication</option><option value="univ">universal (random a, b)</option></select></label>
      <button class="vbtn" data-redraw>New random function</button>
    </div>
    <div data-out></div><p class="viz-caption" data-c></p>`;
  const P = 2n ** 61n - 1n;
  let a = 1n, b = 0n;
  const pick = () => { const r = rngFrom(randomSeed()); const big = () => BigInt(r.int(0, 2 ** 30)) * BigInt(2 ** 31) + BigInt(r.int(0, 2 ** 31 - 1)); a = 1n + big() % (P - 1n); b = big() % P; };
  pick();
  function draw() {
    const kind = val(host, "k"), m = +val(host, "m"), fn = val(host, "f"), n = 1000;
    const r = rngFrom(42);
    const keys = [...Array(n)].map((_, i) => kind === "m8" ? i * 8 : kind === "adv" ? i * m : kind === "seq" ? i : r.int(0, 1e9));
    const h = k => fn === "div" ? k % m : fn === "mult" ? Math.floor(m * ((k * 0.6180339887498949) % 1)) : Number(((a * BigInt(k) + b) % P) % BigInt(m));
    const counts = Array(m).fill(0); keys.forEach(k => counts[h(k)]++);
    const used = counts.filter(c => c).length, fullest = Math.max(...counts);
    $("[data-b]", host).textContent = `${n} keys → ${m} buckets`;
    $("[data-out]", host).innerHTML = barChart(counts.map((c, i) => ({ v: c, label: i, cls: c > 3 * n / m ? "bad" : "", title: `${c} keys` })), { ref: n / m, refLabel: "ideal N/m", h: 170, label: "keys per bucket" })
      + `<div class="legend"><span><b>${used}</b> of ${m} buckets used</span><span>fullest bucket: <b>${fullest}</b> keys (ideal ≈ ${(n / m).toFixed(0)})</span></div>`;
    let msg;
    if (fn === "div" && kind === "m8" && m % 2 === 0) msg = `Every key is a multiple of 8 and m = ${m} shares that factor, so only buckets that are multiples of ${gcd(8, m)} are ever used. Try m = 61 or 31 (prime), or the multiplication method.`;
    else if (kind === "adv" && fn !== "univ") msg = fn === "div" ? `Every key is a multiple of m, so k mod m is 0 for all of them: one chain holds everything and lookups become O(N). Switch to **universal** hashing.` : `These keys were chosen to break k mod m. The multiplication method copes here, but an attacker who knows the function can build a bad set for it too.`;
    else if (fn === "univ") msg = `a and b were chosen at random after the keys were fixed, so no key set is bad for most choices. Press **New random function** and the pattern reshuffles but stays even.`;
    else msg = `Close to even: the fullest bucket holds ${fullest} keys against an ideal of ${(n / m).toFixed(1)}.`;
    $("[data-c]", host).innerHTML = rich(msg);
  }
  const gcd = (x, y) => y ? gcd(y, x % y) : x;
  host.addEventListener("change", draw);
  $("[data-redraw]", host).addEventListener("click", () => { pick(); $('[name="f"]', host).value = "univ"; draw(); });
  draw();
};

/* ---------- Ch 43: Rabin-Karp ---------- */
W.rabinKarp = host => stepper(host, {
  title: "Rabin–Karp with a rolling hash", speed: 650,
  inputs: `<label>Text <input type="text" name="t" value="abracadabra" maxlength="22" autocomplete="off"></label><label>Find <input type="text" name="p" value="abra" maxlength="6" style="width:80px" autocomplete="off"></label>
    <label>Modulus <select name="q"><option value="1000000007">10⁹ + 7</option><option value="7">7 (tiny)</option></select></label><button class="vbtn pen" data-op="run">Run</button>`,
  note: "Letters count as a = 0 … z = 25. Choose modulus **7** to watch spurious hits get caught by the verification step.",
  build(host) {
    const text = val(host, "t").toLowerCase().replace(/[^a-z]/g, "").slice(0, 22), pat = val(host, "p").toLowerCase().replace(/[^a-z]/g, "").slice(0, 6);
    const q = +val(host, "q") || 1000000007, m = pat.length, B = 26;
    if (!m || m > text.length) return [{ text, i: -1, m, msg: "Type a lowercase needle no longer than the text." }];
    const code = c => c.charCodeAt(0) - 97;
    const mulmod = (x, y) => Number((BigInt(x) * BigInt(y)) % BigInt(q));
    let high = 1; for (let i = 1; i < m; i++) high = mulmod(high, B);
    let target = 0, h = 0;
    for (let i = 0; i < m; i++) { target = (mulmod(target, B) + code(pat[i])) % q; h = (mulmod(h, B) + code(text[i])) % q; }
    const F = [{ text, i: -1, m, target, msg: `hash("${pat}") = ${[...pat].map((c, k) => `${code(c)}·26^${m - 1 - k}`).join(" + ")} mod ${q === 7 ? 7 : "p"} = **${target}**.` }];
    let found = 0, spurious = 0, compares = 0;
    for (let i = 0; i + m <= text.length; i++) {
      let status = "", msg;
      if (h === target) {
        compares++;
        if (text.slice(i, i + m) === pat) { found++; status = "ok"; msg = `Window ${i}: hash ${h} matches, and the letters match too. **Match at ${i}.**`; }
        else { spurious++; status = "bad"; msg = `Window ${i}: hash ${h} matches but "${text.slice(i, i + m)}" ≠ "${pat}": a **spurious hit**, caught by checking the letters.`; }
      } else msg = `Window ${i} "${text.slice(i, i + m)}": hash ${h} ≠ ${target}, so skip it without comparing letters.`;
      F.push({ text, i, m, target, h, status, msg, counters: { matches: found, spurious, "letter checks": compares } });
      if (i + m < text.length) {
        const out = code(text[i]), inn = code(text[i + m]);
        const nh = ((mulmod((h - mulmod(out, high) + q) % q, B) + inn) % q);
        F.push({ text, i, m, target, h, roll: [text[i], text[i + m]], msg: `Roll: remove "${text[i]}" (${out} × 26^${m - 1}), multiply by 26, add "${text[i + m]}" (${inn}): ${h} → **${nh}**. O(1), whatever the needle length.`, counters: { matches: found, spurious, "letter checks": compares } });
        h = nh;
      }
    }
    F[F.length - 1].msg += ` Finished: ${found} match${found === 1 ? "" : "es"}, ${spurious} spurious hit${spurious === 1 ? "" : "s"}.`;
    return F;
  },
  render(f, stage) {
    const marks = {};
    if (f.i >= 0) for (let k = f.i; k < f.i + f.m; k++) marks[k] = f.status || (f.roll ? "mv" : "hl");
    stage.innerHTML = cells([...f.text], { marks }) + (f.target != null ? `<div class="vchips"><span class="viz-row-label">needle hash</span><span class="vchip">${f.target}</span>${f.h != null ? `<span class="viz-row-label" style="margin-left:10px">window hash</span><span class="vchip ${f.h === f.target ? (f.status || "hl") : ""}">${f.h}</span>` : ""}</div>` : "");
  },
});

/* ---------- Ch 83: bit vector ---------- */
W.bitVector = host => {
  host.classList.add("viz");
  const U = 64, WS = 16; // display words of 16 bits so a word fits on a phone
  let A = new Set([3, 17, 18, 40, 63]), Bset = new Set([3, 18, 25, 40, 50]), last = null, view = "A";
  host.innerHTML = `<div class="viz-head"><span class="viz-title">A set of 0–63 stored in bits</span><span class="viz-badge" data-b></span></div>
    <div class="viz-inputs"><label>x <input type="number" name="x" value="21" min="0" max="63"></label>
      <button class="vbtn pen" data-a="add">Add</button><button class="vbtn" data-a="remove">Remove</button><button class="vbtn" data-a="test">Test</button>
      <span style="width:8px"></span><button class="vbtn" data-a="union">A OR B</button><button class="vbtn" data-a="inter">A AND B</button><button class="vbtn" data-a="diff">A AND NOT B</button></div>
    <div data-out></div><p class="viz-caption" data-c></p>
    <p class="viz-note">Words are drawn 16 bits wide to fit the screen, so x lives in word x >> 4 at bit x AND 15. Real code uses 64-bit words: x >> 6 and x AND 63. Bit 0 is on the right of each word, as in a binary number.</p>`;
  const grid = (set, name, opt = {}) => `<div class="viz-row-label">${name}</div><div class="bitgrid">${[...Array(U / WS)].map((_, w) => `<div class="bitrow"><span class="lab">word ${w}</span><div class="bits">${[...Array(WS)].map((_, j) => { const bit = WS - 1 - j, x = w * WS + bit; const cls = (set.has(x) ? "on" : "") + (opt.hx === x ? " hl" : "") + (opt.mask === x ? " mask" : ""); return `<span class="bit ${cls}" title="${x}">${x}</span>`; }).join("")}</div></div>`).join("")}</div>`;
  const bin = (set, w) => [...Array(WS)].map((_, j) => set.has(w * WS + WS - 1 - j) ? 1 : 0).join("");
  function draw(msg) {
    const out = $("[data-out]", host);
    if (last && ["union", "inter", "diff"].includes(last.op)) {
      out.innerHTML = `<div class="two">${grid(A, "A")}${grid(Bset, "B")}</div>${grid(last.res, last.label)}`;
    } else out.innerHTML = grid(A, "Set A", last ? { hx: last.x } : {});
    $("[data-b]", host).textContent = `A has ${A.size} members`;
    $("[data-c]", host).innerHTML = msg || rich("Each square is one possible value; a filled square means it is in the set. Pick x and add, remove or test it.");
  }
  host.addEventListener("click", e => {
    const op = e.target.closest("[data-a]")?.dataset.a; if (!op) return;
    const x = Math.max(0, Math.min(63, parseInt(val(host, "x"), 10) || 0)), w = x >> 4, b = x & 15;
    const maskStr = (1 << b).toString(2).padStart(WS, "0");
    if (["add", "remove", "test"].includes(op)) {
      const before = bin(A, w);
      if (op === "add") A.add(x); if (op === "remove") A.delete(x);
      last = { op, x };
      const after = bin(A, w);
      const opTxt = op === "add" ? "OR" : op === "remove" ? "AND NOT" : "AND";
      const res = op === "test" ? (A.has(x) ? maskStr : "0".repeat(WS)) : after;
      draw(`<span class="binline">x = ${x}: word <b>${x} >> 4 = ${w}</b>, bit <b>${x} AND 15 = ${b}</b>, mask = 1 << ${b}<br>word ${w}: <b>${before}</b> ${opTxt} <b>${maskStr}</b> = <b>${res}</b></span><br>` + rich(op === "test" ? (A.has(x) ? `Non-zero, so **${x} is a member**.` : `Zero, so **${x} is not a member**.`) : op === "add" ? `OR sets bit ${b} and leaves the others alone.` : `AND NOT clears bit ${b} and leaves the others alone.`));
    } else {
      const res = new Set([...Array(U).keys()].filter(v => op === "union" ? A.has(v) || Bset.has(v) : op === "inter" ? A.has(v) && Bset.has(v) : A.has(v) && !Bset.has(v)));
      const label = op === "union" ? "A OR B (union)" : op === "inter" ? "A AND B (intersection)" : "A AND NOT B (difference)";
      last = { op, res, label };
      draw(rich(`One word operation combines 16 values here, 64 in real code: ${U / WS} operations for this whole set. Result: {${[...res].sort((p, q) => p - q).join(", ")}}.`));
    }
  });
  draw();
};

/* ---------- Ch 83: Bloom filter calculator ---------- */
W.bloomCalc = host => {
  host.classList.add("viz");
  host.innerHTML = `<div class="viz-head"><span class="viz-title">Size a Bloom filter</span><span class="viz-badge" data-b></span></div>
    <div class="viz-inputs"><label>Bits per item m/n <input type="range" name="bpi" min="2" max="20" value="10"></label><label>Hash functions k <input type="range" name="k" min="1" max="16" value="5"></label></div>
    <div data-out></div><p class="viz-caption" data-c></p>`;
  const fp = (b, k) => Math.pow(1 - Math.exp(-k / b), k);
  function draw() {
    const b = +val(host, "bpi"), k = +val(host, "k"), kopt = b * Math.LN2, p = fp(b, k), pbest = fp(b, Math.max(1, Math.round(kopt)));
    $("[data-b]", host).textContent = `${b} bits per item, k = ${k}`;
    const pts = [...Array(16)].map((_, i) => ({ v: fp(b, i + 1) * 100, label: i + 1, cls: i + 1 === k ? "" : i + 1 === Math.max(1, Math.round(kopt)) ? "ok" : "alt", title: (fp(b, i + 1) * 100).toFixed(2) + "%" }));
    $("[data-out]", host).innerHTML = barChart(pts, { h: 170, fmt: v => v.toFixed(v < 1 ? 2 : 0) + "%", label: "false-positive rate by k" })
      + `<div class="legend"><span><i style="background:var(--pen)"></i>your k</span><span><i style="background:var(--v-ok-b)"></i>best k ≈ ${kopt.toFixed(1)}</span><span>x-axis: number of hash functions k</span></div>
      <div class="scroller"><table class="vtable"><tr><th>False-positive rate at your k</th><td><b>${(p * 100).toFixed(2)}%</b></td></tr><tr><th>At the best k (${Math.max(1, Math.round(kopt))})</th><td>${(pbest * 100).toFixed(2)}%</td></tr><tr><th>Memory for 1 million items</th><td>${(b * 1e6 / 8 / 1e6).toFixed(2)} MB</td></tr><tr><th>Bits per item needed for 1%</th><td>9.6</td></tr></table></div>`;
    $("[data-c]", host).innerHTML = rich(`Too few hashes check too few bits; too many fill the array with 1s. The best k is (m/n) · ln 2 ≈ ${kopt.toFixed(1)}. ${k === Math.max(1, Math.round(kopt)) ? "You are at the optimum." : `Move k to ${Math.max(1, Math.round(kopt))} to cut the error from ${(p * 100).toFixed(2)}% to ${(pbest * 100).toFixed(2)}%.`}`);
  }
  host.addEventListener("input", draw); draw();
};

/* ---------- Grids: one row of cells per grid row ---------- */
const gridRows = (G, marks = {}) => `<div class="vgrid">${G.map((row, r) =>
  cells(row, { idx: false, marks: Object.fromEntries(row.map((_, c) => [c, marks[r + "," + c] || ""])) })).join("")}</div>`;

/* ---------- Ch 25: anagram windows ---------- */
W.anagramWindow = host => stepper(host, {
  title: "Anagram windows: slide, don't rescan", speed: 650,
  inputs: `<label>Text <input name="s" value="silentlistens" maxlength="16"></label><label>Word <input name="w" value="list" maxlength="6"></label>`,
  note: "Each step adds one letter on the right and drops one on the left, so the letter counts update in O(1).",
  build(host) {
    const s = (val(host, "s") || "silentlistens").toLowerCase().replace(/[^a-z]/g, "").slice(0, 16);
    const w = (val(host, "w") || "list").toLowerCase().replace(/[^a-z]/g, "").slice(0, 6);
    const A = [...s], k = w.length;
    if (!k || k > A.length) return [{ A, marks: {}, msg: "Pick a word no longer than the text." }];
    const need = {}, have = {}, hits = [];
    for (const c of w) need[c] = (need[c] || 0) + 1;
    const F = [{ A, marks: {}, msg: `Find every rearrangement of **${w}**: a window of ${k} letters with the same letter counts.` }];
    for (let i = 0; i < A.length; i++) {
      have[A[i]] = (have[A[i]] || 0) + 1;
      if (i >= k) have[A[i - k]]--;
      if (i < k - 1) continue;
      const start = i - k + 1, ok = Object.keys(need).every(c => have[c] === need[c]), marks = {};
      if (ok) hits.push(start);
      for (let j = start; j <= i; j++) marks[j] = ok ? "ok" : "hl";
      F.push({ A, marks, ptrs: start === i ? { [i]: "lo·hi" } : { [start]: "lo", [i]: "hi" },
        msg: ok ? `Window ${start} to ${i} has the same counts as **${w}**: a match at ${start}.` : `Window ${start} to ${i}: the counts differ, so slide on.`,
        counters: { matches: hits.length } });
    }
    F[F.length - 1].msg += ` Matches start at ${hits.length ? hits.join(", ") : "no index"}.`;
    return F;
  },
  render(f, stage) { stage.innerHTML = cells(f.A, { marks: f.marks, ptrs: f.ptrs }); },
});

/* ---------- Ch 26: two pointers ---------- */
W.twoPointers = host => stepper(host, {
  title: "Pair sum from both ends", speed: 650,
  inputs: `<label>Target <input type="number" name="t" value="13"></label>`,
  note: "A sum that is too small can only grow by moving lo right, and one that is too big only shrinks by moving hi left. Each step rules out one value for good.",
  build(host) {
    const A = [1, 3, 4, 6, 8, 9, 11, 14], t = num(host, "t", -99, 99, 13);
    const F = [{ A, marks: {}, ptrs: { 0: "lo", [A.length - 1]: "hi" }, msg: `Sorted values, target **${t}**. Start with the smallest and the largest.` }];
    let lo = 0, hi = A.length - 1, steps = 0;
    while (lo < hi) {
      steps++;
      const s = A[lo] + A[hi], marks = {};
      A.forEach((_, i) => { if (i < lo || i > hi) marks[i] = "dim"; });
      marks[lo] = marks[hi] = s === t ? "ok" : "hl";
      if (s === t) {
        F.push({ A, marks, ptrs: { [lo]: "lo", [hi]: "hi" }, msg: `${A[lo]} + ${A[hi]} = ${t}. **Found** after ${steps} steps.`, counters: { steps } });
        return F;
      }
      F.push({ A, marks, ptrs: { [lo]: "lo", [hi]: "hi" }, msg: `${A[lo]} + ${A[hi]} = ${s}, ${s < t ? `below ${t}: move lo right.` : `above ${t}: move hi left.`}`, counters: { steps } });
      if (s < t) lo++; else hi--;
    }
    F.push({ A, marks: Object.fromEntries(A.map((_, i) => [i, "dim"])), msg: `The pointers met: no pair sums to ${t}, after ${steps} steps (never more than N).`, counters: { steps } });
    return F;
  },
  render(f, stage) { stage.innerHTML = cells(f.A, { marks: f.marks, ptrs: f.ptrs }); },
});

/* ---------- Ch 27: spiral order ---------- */
W.spiral = host => stepper(host, {
  title: "Spiral order with four shrinking bounds", speed: 420,
  inputs: `<label>Rows <input type="number" name="r" value="4" min="1" max="6"></label><label>Columns <input type="number" name="c" value="5" min="1" max="6"></label>`,
  note: "After each ring, all four bounds move inward. The checks top < bottom and left < right stop a single row or column being read twice.",
  build(host) {
    const R = num(host, "r", 1, 6, 4), C = num(host, "c", 1, 6, 5);
    const G = Array.from({ length: R }, (_, r) => Array.from({ length: C }, (_, c) => r * C + c + 1));
    const order = [];
    let top = 0, bottom = R - 1, left = 0, right = C - 1;
    while (top <= bottom && left <= right) {
      for (let c = left; c <= right; c++) order.push([top, c]);
      for (let r = top + 1; r <= bottom; r++) order.push([r, right]);
      if (top < bottom) for (let c = right - 1; c >= left; c--) order.push([bottom, c]);
      if (left < right) for (let r = bottom - 1; r > top; r--) order.push([r, left]);
      top++; bottom--; left++; right--;
    }
    const F = [{ G, marks: {}, out: [], msg: `A ${R} × ${C} grid. Read it clockwise from the top-left corner, ring by ring.` }];
    order.forEach(([r, c], i) => {
      const marks = {};
      order.slice(0, i).forEach(([a, b]) => { marks[a + "," + b] = "dim"; });
      marks[r + "," + c] = "hl";
      F.push({ G, marks, out: order.slice(0, i + 1).map(([a, b]) => G[a][b]), msg: `Row ${r}, column ${c}: **${G[r][c]}**.`, counters: { read: i + 1 } });
    });
    F[F.length - 1].msg += " Every cell is read exactly once: O(R × C).";
    return F;
  },
  render(f, stage) { stage.innerHTML = gridRows(f.G, f.marks) + chips(f.out); },
});

/* ---------- Ch 33: counting sort ---------- */
W.countingSort = host => stepper(host, {
  title: "Counting sort: tally, then write out", speed: 500,
  inputs: `<button class="vbtn" data-op="shuffle">New values</button>`,
  note: "No two values are ever compared: each value is the index of its own counter, so the work is O(N + K) for keys 0 to K.",
  build(host, op) {
    const rng = rngFrom(op === "shuffle" ? randomSeed() : 7);
    const A = Array.from({ length: 10 }, () => rng.int(0, 5)), counts = Array(6).fill(0), out = [];
    const F = [{ A, counts: [...counts], out: [], am: {}, cm: {}, msg: "Ten values from 0 to 5. First count how often each one occurs." }];
    A.forEach((v, i) => {
      counts[v]++;
      F.push({ A, counts: [...counts], out: [], am: { [i]: "hl" }, cm: { [v]: "hl" }, msg: `${v}: add one to counts[${v}].`, counters: { pass: 1 } });
    });
    counts.forEach((c, v) => {
      for (let k = 0; k < c; k++) out.push(v);
      F.push({ A, counts: [...counts], out: [...out], am: {}, cm: { [v]: c ? "ok" : "dim" }, msg: c ? `Write ${v} out ${c} time${c > 1 ? "s" : ""}.` : `No ${v}s: write nothing.`, counters: { pass: 2 } });
    });
    F[F.length - 1].msg += " Sorted.";
    return F;
  },
  render(f, stage) {
    stage.innerHTML = `<div class="viz-row-label">Input</div>${cells(f.A, { marks: f.am })}<div class="viz-row-label">counts[value]</div>${cells(f.counts, { marks: f.cm })}`
      + `<div class="viz-row-label">Output</div>${cells(f.out, { cap: f.A.length, idx: false })}`;
  },
});

/* ---------- Ch 56: heights and the diameter in one walk ---------- */
W.treeHeights = host => stepper(host, {
  title: "One post-order walk: heights and the diameter", speed: 750,
  note: "A node can answer only after both children have. The longest path bending at a node has left height + right height edges.",
  build() {
    const mk = (k, l = null, r = null) => ({ k, l, r });
    const root = mk(1, mk(2, mk(4), mk(5, mk(7))), mk(3, null, mk(6)));
    const H = new Map();
    let best = 0, bestAt = null;
    const draw = (n, cur) => n && { k: n.k, l: draw(n.l, cur), r: draw(n.r, cur), sub: H.has(n) ? "h " + H.get(n) : null,
      cls: n === cur ? "hl" : n === bestAt ? "ok" : H.has(n) ? "dim" : "" };
    const F = [{ t: draw(root, null), msg: "Find the longest path between any two nodes, counted in edges." }];
    (function walk(n) {
      if (!n) return 0;
      const a = walk(n.l), b = walk(n.r);
      H.set(n, 1 + Math.max(a, b));
      const better = a + b > best;
      if (better) { best = a + b; bestAt = n; }
      F.push({ t: draw(root, n), msg: `Node ${n.k}: left height ${a}, right height ${b}, so its height is ${1 + Math.max(a, b)}. A path bending here has ${a + b} edges${better ? ", the best so far" : ""}.`, counters: { best } });
      return H.get(n);
    })(root);
    F.push({ t: draw(root, null), msg: `The diameter is **${best}** edges, bending at node ${bestAt.k}. Each node was visited once: O(N).`, counters: { best } });
    return F;
  },
  render(f, stage) { stage.innerHTML = binTree(f.t, { label: "binary tree" }); },
});

/* ---------- Ch 63: union-find ---------- */
W.unionFind = host => stepper(host, {
  title: "Union-find: parent links, union by size, path compression", speed: 900,
  note: "Each element points at a parent and a root points at itself. find follows the links up, then points every node it passed straight at the root.",
  build() {
    const n = 8, parent = [...Array(n).keys()], size = Array(n).fill(1);
    const pairs = [[0, 1], [2, 3], [1, 3], [4, 5], [6, 7], [5, 7], [3, 7], [0, 6]];
    const groups = () => parent.filter((p, i) => p === i).length;
    const find = (x, path) => {
      let r = x;
      while (parent[r] !== r) { path.push(r); r = parent[r]; }
      for (const p of path) parent[p] = r;
      return r;
    };
    const F = [{ parent: [...parent], marks: {}, msg: "Eight elements, each its own group: parent[i] = i.", counters: { groups: n } }];
    for (const [a, b] of pairs) {
      const pa = [], pb = [], ra = find(a, pa), rb = find(b, pb), marks = {};
      [...pa, ...pb].forEach(i => { marks[i] = "hl"; });
      let msg;
      if (ra === rb) {
        marks[ra] = "ok";
        msg = `union(${a}, ${b}): both finds reach root ${ra}, so they are already in one group.`;
      } else {
        let big = ra, small = rb;
        if (size[big] < size[small]) [big, small] = [small, big];
        parent[small] = big;
        size[big] += size[small];
        marks[small] = "mv";
        marks[big] = "ok";
        msg = `union(${a}, ${b}): roots ${ra} and ${rb}. Hang the smaller group's root ${small} under ${big}, which now has ${size[big]} members.`;
      }
      if (pa.length + pb.length > 2) msg += " The finds also flattened the path they walked.";
      F.push({ parent: [...parent], marks, msg, counters: { groups: groups() } });
    }
    return F;
  },
  render(f, stage) { stage.innerHTML = `<div class="viz-row-label">parent[i]</div>${cells(f.parent, { marks: f.marks })}`; },
});

/* ---------- Ch 64: breadth-first rounds on a grid ---------- */
W.spreadRounds = host => stepper(host, {
  title: "Breadth-first search from every source at once", speed: 750,
  note: "All sources start in the first frontier, so each cell is reached in the fewest possible rounds. Walls (#) are never entered.",
  build() {
    const plan = ["S...#.", ".##.#.", "...#..", "#....S"], R = plan.length, C = plan[0].length;
    const G = plan.map(row => [...row].map(ch => (ch === "." ? "" : ch)));
    let frontier = [];
    plan.forEach((row, r) => [...row].forEach((ch, c) => { if (ch === "S") frontier.push([r, c]); }));
    const seen = new Set(frontier.map(([r, c]) => r + "," + c)), open = plan.join("").split(".").length - 1;
    const snap = cur => {
      const marks = {};
      G.forEach((row, r) => row.forEach((v, c) => {
        const key = r + "," + c;
        marks[key] = v === "#" ? "dim" : cur.has(key) ? "hl" : v !== "" ? "ok" : "";
      }));
      return { G: G.map(row => [...row]), marks };
    };
    const F = [{ ...snap(new Set()), msg: "Two sources (S). Each round, every reached cell reaches its open neighbours up, down, left and right." }];
    let round = 0;
    while (frontier.length) {
      const next = [];
      for (const [r, c] of frontier) for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nr = r + dr, nc = c + dc, key = nr + "," + nc;
        if (nr < 0 || nr >= R || nc < 0 || nc >= C || plan[nr][nc] !== "." || seen.has(key)) continue;
        seen.add(key);
        next.push([nr, nc]);
      }
      if (!next.length) break;
      round++;
      next.forEach(([r, c]) => { G[r][c] = String(round); });
      F.push({ ...snap(new Set(next.map(([r, c]) => r + "," + c))), msg: `Round ${round}: ${next.length} new cell${next.length === 1 ? "" : "s"} reached.`, counters: { rounds: round } });
      frontier = next;
    }
    const left = open - (seen.size - 2);
    F.push({ ...snap(new Set()), msg: left ? `Stuck after ${round} rounds: ${left} cells can never be reached.` : `Every open cell is reached after **${round} rounds**. Each cell joined a frontier once: O(R × C).`, counters: { rounds: round } });
    return F;
  },
  render(f, stage) { stage.innerHTML = gridRows(f.G, f.marks); },
});

/* ---------- Ch 75: backtracking with queens ---------- */
W.queens = host => stepper(host, {
  title: "Backtracking: queens, one row at a time", speed: 450,
  inputs: `<label>Board <select name="n"><option>4</option><option selected>5</option><option>6</option></select></label>`,
  note: "Try a square, go on to the next row, and undo the choice when no square there is safe. Sets of used columns and diagonals make each check O(1).",
  build(host) {
    const n = num(host, "n", 4, 6, 5), cols = [], F = [];
    const board = () => Array.from({ length: n }, (_, r) => Array.from({ length: n }, (_, c) => (cols[r] === c ? "Q" : "")));
    const safe = (r, c) => cols.every((cc, rr) => cc !== c && Math.abs(cc - c) !== r - rr);
    let tries = 0, done = false;
    F.push({ G: board(), marks: {}, msg: `Place ${n} queens so that no two share a row, column or diagonal.` });
    (function place(r) {
      if (r === n) { done = true; return; }
      for (let c = 0; c < n && !done; c++) {
        tries++;
        if (!safe(r, c)) {
          F.push({ G: board(), marks: { [r + "," + c]: "bad" }, msg: `Row ${r}, column ${c} is attacked.`, counters: { tries } });
          continue;
        }
        cols.push(c);
        F.push({ G: board(), marks: { [r + "," + c]: "ok" }, msg: `Row ${r}: place a queen in column ${c}.`, counters: { tries } });
        place(r + 1);
        if (!done) {
          cols.pop();
          F.push({ G: board(), marks: { [r + "," + c]: "mv" }, msg: `Nothing below works, so **undo** row ${r}, column ${c}.`, counters: { tries } });
        }
      }
    })(0);
    F.push({ G: board(), marks: Object.fromEntries(cols.map((c, r) => [r + "," + c, "ok"])), msg: `Solved after ${tries} tries, out of ${n ** n} boards with one queen per row.`, counters: { tries } });
    return F;
  },
  render(f, stage) { stage.innerHTML = gridRows(f.G, f.marks); },
});
