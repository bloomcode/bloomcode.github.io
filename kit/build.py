"""Build the BloomCode site from the solutions repos.

    python3 kit/build.py --src .. --out _site

--src is a directory holding the six solutions repos (dsa-python-solutions, ..., cp-go-solutions)
side by side; locally that is the workspace, in CI the checkouts made by pages.yml. Needs Python 3.11+.

Output:
    index.html                         landing page
    dsa/index.html, cp/index.html      section pages
    <track>/<lang>/workbook.html       exercises with ticks (saved in the browser)
    <track>/<lang>/answer-key.html     reference solutions, blurred until revealed
    dsa/guide/index.html               the concept guide
"""
import argparse
import html
import json
import re
import sys
import tomllib
from pathlib import Path

KIT = Path(__file__).resolve().parent
sys.path.insert(0, str(KIT))
import buildlib  # noqa: E402

TRACKS = {
    "dsa": dict(name="Data structures and algorithms", short="DSA",
                blurb="From arrays and Big O to trees, graphs, dynamic programming, caches, self-balancing trees, "
                      "data bigger than memory, randomized algorithms and Bloom filters. The same exercises in all three "
                      "languages, with a visual concept guide."),
    "cp": dict(name="Competitive programming", short="CP",
               blurb="Fast input and output, the standard library toolbox, bits, number theory and contest patterns. "
                     "Written separately for each language, around what that language makes easy or hard."),
}
LANGS = {"python": "Python", "java": "Java", "go": "Go"}
KEY_INTRO = {
    "python": "Every solution stays blurred until you ask for it, so try the exercise first and write down your Big O. "
              "Each answer passes its own test with pytest on Python 3.10 and 3.13, standard library only.",
    "java": "Every solution stays blurred until you ask for it, so try the exercise first and write down your Big O. "
            "Each answer passes its own test on JDK 21 with nothing beyond the JDK. A method that belongs to a class "
            "says so above the snippet.",
    "go": "Every solution stays blurred until you ask for it, so try the exercise first and write down your Big O. "
          "Each answer passes <code class=\"mono\">go vet</code> and its own test on Go 1.24 with nothing but the standard "
          "library. Each chapter is one package; the imports a snippet needs are listed above it. Failures come back as "
          "<code class=\"mono\">error</code> values or <code class=\"mono\">ok</code> booleans, the Go way.",
}
FONTS = ('<link rel="preconnect" href="https://fonts.googleapis.com">\n'
         '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n'
         '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@62..125,500..800'
         '&family=IBM+Plex+Mono:wght@400;500;600;700&family=IBM+Plex+Sans:wght@400;500;600&display=swap">\n')
BASE = (KIT / "web/base.css").read_text()
# The logo, copied to the site root; every page links the favicon and touch icon from there.
ICONS = KIT / "web/icons"
ICON_LINKS = ('<link rel="icon" href="/favicon.ico" sizes="any">\n'
              '<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png">\n'
              '<link rel="apple-touch-icon" href="/apple-touch-icon.png">\n')


def read(rel):
    return (KIT / rel).read_text()


def document(fragment, description=""):
    """The templates are page fragments (title, links, style, then the body). Wrap one as a full document."""
    split = fragment.index("\n<header")
    head, body = fragment[:split], fragment[split + 1:]
    meta = f'<meta name="description" content="{html.escape(description)}">\n' if description else ""
    return ('<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n'
            '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n'
            f"{meta}{ICON_LINKS}{head.strip()}\n<style>[hidden]{{display:none!important}}img{{max-width:100%}}</style>\n"
            f"</head>\n<body>\n{body.strip()}\n</body>\n</html>\n")


def export(repo):
    """Page data for one solutions repo, in the shape the templates expect."""
    track = tomllib.loads((repo / "track.toml").read_text())
    lang = track["language"]
    exs = []
    for f in sorted(repo.glob(track["sources"])):
        if f.name.endswith("_test.go"):
            continue
        exs += buildlib.parse(str(f), lang)
    exs.sort(key=lambda e: (e["ch"], e["num"]))
    assert len(exs) == track["exercises"], (repo.name, len(exs))
    part_of = {ch: p["n"] for p in track["parts"] for ch in p["chapters"]}
    chapters = [{"ch": c["n"], "title": c["title"], "short": c["short"], "focus": c["focus"],
                 "file": re.sub(r"^(solutions|src)/", "", c["file"]), "part": part_of[c["n"]]} for c in track["chapters"]]
    return track, {
        "lang": lang,
        "parts": [{"n": p["n"], "name": p["name"], "chs": p["chapters"]} for p in track["parts"]],
        "chapters": chapters,
        "exercises": [{"id": f"{e['ch']}.{e['num']}", "ch": e["ch"], "title": e["title"], "level": e["level"],
                       "prompt": e["PROMPT"], "example": e["EXAMPLE"], "bigo": e["BIGO"], "note": e.get("NOTE", ""),
                       "code": e["code"]} for e in exs],
    }


def fill(tpl, track, data, lang, kind):
    t, total = track["track"], len(data["exercises"])
    tokens = {
        "{{TITLE}}": f"{TRACKS[t]['short']} in {LANGS[lang]} · {'Workbook' if kind == 'workbook' else 'Answer key'} · BloomCode",
        "{{LANG_NAME}}": LANGS[lang], "{{TOTAL}}": str(total), "{{CHAPTERS}}": str(len(data["chapters"])),
        "{{STARTER}}": f"{t}-{lang}", "{{KEY_INTRO}}": KEY_INTRO[lang],
        "/*BASE_CSS*/": BASE, "/*COMMON_JS*/": read("web/common.js"),
        "/*DATA_JSON*/": json.dumps(data, ensure_ascii=False, separators=(",", ":")).replace("</", "<\\/"),
        "/*WORKBOOK_URL*/": "workbook.html", "/*KEY_URL*/": "answer-key.html",
        "/*STORE_KEY*/": f"bloomcode.{t}.{lang}",
    }
    for k, v in tokens.items():
        tpl = tpl.replace(k, v)
    leftover = re.findall(r"\{\{[A-Z_]+\}\}|/\*[A-Z_]+\*/", tpl)
    assert not leftover, (t, lang, kind, leftover)
    return tpl


def guide_page(track):
    page = read("guide/template.html")
    links = {lang: f"../{lang}/workbook.html" for lang in LANGS}
    for k, v in {"/*TITLE*/": "DSA concept guide · BloomCode", "/*BASE_CSS*/": BASE, "/*GUIDE_CSS*/": read("guide/guide.css"),
                 "/*CORE_JS*/": read("guide/core.js"), "/*VIZ_JS*/": read("guide/viz.js"),
                 "/*CONTENT_JS*/": read("guide/content.js"), "/*LINKS_JSON*/": json.dumps(links),
                 "/*PAGE_JS*/": read("guide/page.js")}.items():
        assert "</script" not in v or k in ("/*BASE_CSS*/", "/*GUIDE_CSS*/")
        page = page.replace(k, v)
    return document(page, "A visual concept guide to the 33 chapters of the BloomCode DSA track.")


SHELL_CSS = """
.site { max-width: 1080px; margin: 0 auto; padding: 28px 16px 56px; display: grid; gap: 18px; }
.site-top { display: flex; align-items: center; gap: 12px; justify-content: space-between; flex-wrap: wrap; }
.site-top a { color: inherit; text-decoration: none; }
.site-brand { display: flex; align-items: center; gap: 10px; font: 800 18px var(--display); }
.site-brand .brand-mark { width: 36px; height: 36px; background: none; border-radius: 0; box-shadow: none; padding: 0; }
.site-nav { display: flex; gap: 14px; font: 600 13.5px var(--body); flex-wrap: wrap; }
.site-nav a:hover { color: var(--pen); }
.hero-site h1 { font: 800 clamp(30px, 5vw, 48px)/1.05 var(--display); letter-spacing: -0.01em; margin: 8px 0 12px; }
.hero-site h1 em { font-style: normal; color: var(--pen); }
.hero-site p { font-size: 16px; line-height: 1.6; color: var(--ink-2); max-width: 64ch; margin: 0; }
.cards-site { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 14px; }
.card-site { display: grid; gap: 10px; align-content: start; }
.card-site h2 { font: 800 22px var(--display); }
.card-site p { margin: 0; color: var(--ink-2); line-height: 1.55; }
.card-site .stats { font: 600 12px var(--mono); color: var(--ink-3); letter-spacing: 0.04em; }
.links { display: flex; flex-wrap: wrap; gap: 8px; }
.links a { font: 600 13px var(--body); text-decoration: none; color: var(--ink); border: 1px solid var(--rule); border-radius: 999px; padding: 6px 12px; background: var(--sheet-2); }
.links a:hover { border-color: var(--pen); color: var(--pen); }
.links a.primary { background: var(--pen); color: var(--pen-ink); border-color: var(--pen); }
.soon { border-style: dashed; box-shadow: none; background: transparent; }
.steps-site { margin: 0; padding-left: 20px; line-height: 1.7; color: var(--ink-2); }
.steps-site code { font: 500 13px var(--mono); }
.foot { font-size: 13px; color: var(--ink-3); }
.sec { font: 800 22px var(--display); margin-bottom: 12px; }
.lede { margin: 0 0 14px; color: var(--ink-2); line-height: 1.6; max-width: 72ch; }
.hero-site .links { margin-top: 16px; }
.start { list-style: none; margin: 0; padding: 0; display: grid; gap: 12px; counter-reset: s; }
.start li { counter-increment: s; display: grid; grid-template-columns: 34px 1fr; column-gap: 12px; color: var(--ink-2); line-height: 1.6; }
.start li::before { content: counter(s); grid-row: span 2; font: 800 26px/1 var(--display); color: var(--pen); }
.start li b, .help li b { color: var(--ink); }
.start code, .help code, .card-site code { font: 500 13px var(--mono); }
.card-site .why { color: var(--ink); }
.langs { list-style: none; margin: 0; padding: 0; display: grid; gap: 10px; }
.langs li { display: flex; flex-wrap: wrap; align-items: center; gap: 6px 10px; padding-top: 10px; border-top: 1px solid var(--rule); }
.langs li > b { min-width: 52px; }
.card-site > .links .stats { align-self: center; }
.help { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 14px; }
.help li { display: grid; gap: 4px; color: var(--ink-2); line-height: 1.55; }
.help a { color: var(--pen); }
.foot a { color: inherit; }
"""


def shell(title, description, body, depth):
    up = "../" * depth
    frag = (f"<title>{html.escape(title)}</title>\n{FONTS}<style>\n{BASE}\n{SHELL_CSS}\n</style>\n"
            f'<header class="site-top" style="max-width:1080px;margin:0 auto;padding:18px 16px 0">'
            f'<a class="site-brand" href="{up or "./"}"><img class="brand-mark" src="/icon-192.png" alt="" width="36" height="36">BloomCode</a>'
            f'<nav class="site-nav"><a href="{up}dsa/">DSA</a><a href="{up}cp/">Competitive programming</a>'
            f'<a href="https://github.com/bloomcode">GitHub</a></nav></header>\n'
            f'<main class="site">{body}<p class="foot">Original exercises, solutions and guides. '
            f'<a href="https://github.com/bloomcode">Starter repos on GitHub</a>; report mistakes as issues there.</p></main>')
    return document(frag, description)


def lang_card(t, lang, counts):
    links = [f'<a class="primary" href="{lang}/workbook.html">Workbook</a>', f'<a href="{lang}/answer-key.html">Answer key</a>',
             f'<a href="https://github.com/bloomcode/{t}-{lang}">Starter repo</a>']
    return (f'<section class="panel card-site"><span class="eyebrow">{TRACKS[t]["short"]} · {LANGS[lang]}</span>'
            f"<h2>{LANGS[lang]}</h2><p class=\"stats\">{counts[lang][0]} exercises · {counts[lang][1]} chapters</p>"
            f'<div class="links">{"".join(links)}</div></section>')


def section_page(t, counts):
    guide = ('<section class="panel card-site"><span class="eyebrow">All languages</span><h2>Concept guide</h2>'
             "<p>Each chapter's idea, a step-through visualizer, language-neutral pseudocode and the cost table.</p>"
             '<div class="links"><a class="primary" href="guide/">Open the guide</a></div></section>') if t == "dsa" else ""
    body = (f'<section class="panel hero-site"><span class="eyebrow">{TRACKS[t]["short"]} track</span>'
            f'<h1>{TRACKS[t]["name"]}</h1><p>{TRACKS[t]["blurb"]}</p></section>'
            f'<div class="cards-site">{"".join(lang_card(t, l, counts) for l in LANGS)}{guide}</div>'
            '<section class="panel"><h2 style="font:800 20px var(--display);margin-bottom:8px">How to practise</h2><ol class="steps-site">'
            f"<li>Open the starter for your language on GitHub and click <b>Use this template</b> (not Fork).</li>"
            "<li>Read an exercise in the workbook, write it in your copy, and run <code>make test EX=3.2</code>.</li>"
            "<li>Push: the progress workflow ticks every exercise whose test passes. Stuck? The answer key has a tested solution.</li>"
            "</ol></section>")
    return shell(f"{TRACKS[t]['name']} · BloomCode", TRACKS[t]["blurb"], body, 1)


STAGES = (  # suggested order through the dsa parts: (label, title, part numbers, what it is for)
    ("First", "The core toolkit", range(1, 6), "Most interview questions draw on these. Do the Core exercises, in order."),
    ("Next", "Graphs and performance", range(6, 8), "Then go back for the Practice exercises in the chapters that felt hard, and start CP Part 1 "
                          "in your language: fast input and output come first."),
    ("Later", "Depth", range(8, 12), "Depth for senior and systems-heavy interviews. Save the Stretch exercises for here, and "
                            "finish the CP track: the standard library toolbox and contest essentials."),
)
ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"]


def home_page(counts_by_track, dsa_track):
    shorts = {c["n"]: c["short"] for c in dsa_track["chapters"]}
    parts = {p["n"]: p for p in dsa_track["parts"]}
    steps = [
        ("Choose a track",
         "<b>Data structures and algorithms</b> if you are preparing for coding interviews or want the fundamentals solid; "
         "it runs in the order interviews build on. <b>Competitive programming</b> once the first DSA parts feel easy, or "
         "now if you are already fluent and want contest speed in one language."),
        ("Choose a language",
         "The one you will interview in. DSA has the same exercises in Python, Java and Go, so you can switch later."),
        ("Copy the starter",
         "Open the starter repo for your track and language, click <b>Use this template</b> (not Fork), and clone your copy. "
         "Run <code>make test EX=1.1</code>: it fails until you write exercise 1.1."),
        ("Work chapter by chapter",
         "Read the chapter in the concept guide, then each exercise in the workbook. Write it, run "
         "<code>make test EX=3.2</code>, compare with the answer key, and push: <code>PROGRESS.md</code> ticks off every "
         "exercise whose test passes."),
    ]
    start = "".join(f"<li><b>{h}</b><span>{b}</span></li>" for h, b in steps)
    stages = []
    for label, title, nums, why in STAGES:
        chs = [n for k in nums for n in parts[k]["chapters"]]
        names = "; ".join(f"Part {ROMAN[k - 1]}: {parts[k]['name']}" for k in nums)
        stages.append(f'<section class="panel card-site"><span class="eyebrow">{label} · DSA chapters {chs[0]}–{chs[-1]}</span>'
                      f"<h2>{title}</h2>"
                      f"<p>{html.escape(', '.join(shorts[n] for n in chs))}.</p><p class=\"why\">{why}</p>"
                      f'<p class="stats">{html.escape(names)}</p></section>')
    cards = []
    for t, info in TRACKS.items():
        c = counts_by_track[t]
        rows = "".join(
            f'<li><b>{LANGS[l]}</b><span class="stats">{c[l][0]} exercises</span><span class="links">'
            f'<a class="primary" href="{t}/{l}/workbook.html">Workbook</a><a href="{t}/{l}/answer-key.html">Answer key</a>'
            f'<a href="https://github.com/bloomcode/{t}-{l}">Starter</a></span></li>' for l in LANGS)
        guide = ('<div class="links"><a class="primary" href="dsa/guide/">Concept guide</a>'
                 '<span class="stats">all languages, 33 chapters</span></div>') if t == "dsa" else ""
        cards.append(f'<section class="panel card-site"><span class="eyebrow">{info["short"]}</span><h2>{info["name"]}</h2>'
                     f'<p>{info["blurb"]}</p>{guide}<ul class="langs">{rows}</ul>'
                     f'<div class="links"><a href="{t}/">Track overview</a></div></section>')
    cards.append('<section class="panel card-site soon"><span class="eyebrow">Next</span><h2>More tracks</h2>'
                 "<p>System design, SQL and concurrency are candidates. Each new track gets the same shape: "
                 "exercises with tests in a template starter, a workbook and an answer key here.</p></section>")
    help_items = [
        ("Stuck on an exercise", "Read the guide chapter again, then reveal the answer key one solution at a time."),
        ("Found a mistake", 'Open an issue on the starter repo you are using; the form asks for the exercise id. '
                            'See the <a href="https://github.com/bloomcode/.github/blob/main/CONTRIBUTING.md">contributing guide</a>.'),
        ("Get fixes and new exercises", "Your copy can pull from its starter; the steps are under <b>Getting updates</b> "
                                         "in your starter's README."),
        ("Your progress", "<code>PROGRESS.md</code> and the badge in your repo update on every push. Ticks in a workbook "
                          "are saved in this browser only."),
    ]
    body = ('<section class="panel hero-site"><span class="eyebrow">Interview preparation for working engineers</span>'
            "<h1>Practise the problems. <em>Run the tests.</em></h1>"
            "<p>Original exercises in Python, Java and Go, each with its own test. You solve them in your own copy of a "
            "starter repo; the tests tell you when you are right, and these pages explain the ideas and show worked "
            "solutions.</p>"
            '<div class="links"><a class="primary" href="#start">Start here</a><a href="dsa/guide/">Concept guide</a>'
            '<a href="#tracks">All workbooks and starters</a></div></section>'
            f'<section class="panel" id="start"><h2 class="sec">Start here</h2><ol class="start">{start}</ol></section>'
            '<section class="panel"><h2 class="sec">What to do first, and later</h2>'
            "<p class=\"lede\">Each exercise is <b>Core</b> (everyone should do it), <b>Practice</b> (consolidates the "
            "chapter) or <b>Stretch</b> (harder, or combines ideas). Inside a chapter, go in order: later exercises "
            "reuse earlier ones.</p>"
            f'<div class="cards-site">{"".join(stages)}</div></section>'
            f'<div class="cards-site" id="tracks">{"".join(cards)}</div>'
            '<section class="panel"><h2 class="sec">Help</h2><ul class="help">'
            + "".join(f"<li><b>{h}</b><span>{b}</span></li>" for h, b in help_items) +
            "</ul></section>")
    return shell("BloomCode · Interview practice with tests", "Original interview-practice exercises with tests, in Python, Java and Go.", body, 0)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--src", type=Path, required=True, help="directory holding the solutions repos")
    ap.add_argument("--out", type=Path, required=True)
    args = ap.parse_args()
    out = args.out
    out.mkdir(parents=True, exist_ok=True)
    counts = {t: {} for t in TRACKS}
    dsa_track = None
    for t in TRACKS:
        for lang in LANGS:
            repo = args.src / f"{t}-{lang}-solutions"
            track, data = export(repo)
            counts[t][lang] = (len(data["exercises"]), len(data["chapters"]))
            tdir = f"web/{t}" if t == "dsa" else f"web/{t}/{lang}"
            for kind, name in (("workbook", "workbook.html"), ("key", "answer-key.html")):
                page = document(fill(read(f"{tdir}/{kind}.html"), track, data, lang, kind),
                                f"{TRACKS[t]['name']} in {LANGS[lang]}: {'exercises' if kind == 'workbook' else 'tested solutions'}.")
                dest = out / t / lang / name
                dest.parent.mkdir(parents=True, exist_ok=True)
                dest.write_text(page)
            if t == "dsa" and lang == "python":
                dsa_track = track
        (out / t / "index.html").write_text(section_page(t, counts[t]))
    (out / "dsa/guide").mkdir(parents=True, exist_ok=True)
    (out / "dsa/guide/index.html").write_text(guide_page(dsa_track))
    (out / "index.html").write_text(home_page(counts, dsa_track))
    (out / "404.html").write_text(shell("Not found · BloomCode", "", '<section class="panel hero-site"><h1>Not <em>found</em></h1>'
                                        '<p>That page does not exist. Start from the <a href="/">home page</a>.</p></section>', 0))
    (out / ".nojekyll").write_text("")
    for icon in ICONS.iterdir():
        (out / icon.name).write_bytes(icon.read_bytes())
    pages = sorted(p.relative_to(out).as_posix() for p in out.rglob("*.html"))
    print(f"built {len(pages)} pages into {out}")


if __name__ == "__main__":
    main()
