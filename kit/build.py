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
    blog/index.html                    the blog: one card per post in POSTS
    blog/<slug>/index.html             a post, from kit/blog/<slug>.html
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


# Page views go to GoatCounter (no cookies, no personal data): https://bloomcode.goatcounter.com
ANALYTICS = '<script data-goatcounter="https://bloomcode.goatcounter.com/count" async src="https://gc.zgo.at/count.js"></script>\n'


GITHUB = "https://github.com/bloomcode"
GITHUB_ICON = ('<svg viewBox="0 0 16 16" width="22" height="22" aria-hidden="true"><path fill="currentColor" d="M8 0C3.58 0 0 3.58 0 8'
               'c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94'
               '-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2'
               '-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0'
               ' 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95'
               '.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/></svg>')
SITEBAR_CSS = """
.sitebar { max-width: 1080px; margin: 0 auto; padding: 14px max(16px, env(safe-area-inset-right, 0px)) 0 max(16px, env(safe-area-inset-left, 0px));
  display: flex; align-items: center; justify-content: space-between; gap: 10px 16px; flex-wrap: wrap; }
.sitebar.wide { max-width: 1240px; padding-bottom: 10px; }
.sitebar a { color: var(--ink); text-decoration: none; }
.sb-brand { display: flex; align-items: center; gap: 10px; font: 800 18px var(--display); }
.sb-brand img { width: 32px; height: 32px; }
.sb-nav { display: flex; align-items: center; gap: 6px 16px; flex-wrap: wrap; font: 600 13.5px var(--body); }
.sb-nav a:hover, .sb-nav a[aria-current] { color: var(--pen); }
.sb-nav a[aria-current] { text-decoration: underline; text-underline-offset: 5px; text-decoration-thickness: 2px; }
.sb-nav .gh { display: inline-flex; padding: 2px; }
.sb-nav .short { display: none; }
@media (max-width: 560px) { .sb-nav .long { display: none; } .sb-nav .short { display: inline; } }
"""


def site_bar(depth, current="", wide=False):
    """The bar at the top of every page: home, the tracks, the lab and GitHub. `current` marks the page's section."""
    up = "../" * depth

    def item(key, href, label):
        mark = ' aria-current="page"' if key == current else ""
        return f'<a href="{up}{href}"{mark}>{label}</a>'
    return (f'<header class="sitebar{" wide" if wide else ""}"><a class="sb-brand" href="{up or "./"}">'
            '<img src="/icon-192.png" alt="" width="32" height="32">BloomCode</a><nav class="sb-nav" aria-label="Site">'
            + item("dsa", "dsa/", '<span class="long">Data structures and algorithms</span><span class="short">DSA</span>')
            + item("guide", "dsa/guide/", "Guide")
            + item("cp", "cp/", '<span class="long">Competitive programming</span><span class="short">CP</span>')
            + item("lab", "lab/", "Lab")
            + item("blog", "blog/", "Blog")
            + f'<a class="gh" href="{GITHUB}" aria-label="BloomCode on GitHub" title="BloomCode on GitHub">{GITHUB_ICON}</a>'
            + "</nav></header>\n")


def document(fragment, description="", depth=None, current=""):
    """The templates are page fragments (title, links, style, then the body). Wrap one as a full document.
    With `depth`, the page gets the site bar (pages built by shell() already carry it)."""
    split = fragment.index("\n<header")
    head, body = fragment[:split], fragment[split + 1:]
    if depth is not None:
        body = site_bar(depth, current, wide=True) + body
    meta = f'<meta name="description" content="{html.escape(description)}">\n' if description else ""
    return ('<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n'
            '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n'
            f"{meta}{ICON_LINKS}{head.strip()}\n<style>[hidden]{{display:none!important}}img{{max-width:100%}}{SITEBAR_CSS}</style>\n"
            f"</head>\n<body>\n{body.strip()}\n{ANALYTICS}</body>\n</html>\n")


def chapter_key(ch):
    """Sort key for a chapter id: "2.5" -> (2, 5), 17 -> (17,)."""
    return tuple(int(x) for x in str(ch).split("."))


def export(repo):
    """Page data for one solutions repo, in the shape the templates expect."""
    track = tomllib.loads((repo / "track.toml").read_text())
    lang = track["language"]
    exs = []
    for f in sorted(repo.glob(track["sources"])):
        if f.name.endswith("_test.go"):
            continue
        exs += buildlib.parse(str(f), lang)
    exs.sort(key=lambda e: (chapter_key(e["ch"]), e["num"]))
    assert len(exs) == track["exercises"], (repo.name, len(exs))
    part_of = {str(ch): p["n"] for p in track["parts"] for ch in p["chapters"]}
    chapters = [{"ch": str(c["n"]), "title": c["title"], "short": c["short"], "focus": c["focus"],
                 "file": re.sub(r"^(solutions|src)/", "", c["file"]), "part": part_of[str(c["n"])]}
                for c in sorted(track["chapters"], key=lambda c: chapter_key(c["n"]))]
    return track, {
        "lang": lang,
        "parts": [{"n": p["n"], "name": p["name"], "chs": [str(ch) for ch in p["chapters"]],  # dsa: "2.5" is chapter 5 of area 2
                   "label": f"{'Area' if track['track'] == 'dsa' else 'Part'} {p['n']}"} for p in track["parts"]],
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
    return document(page, f"A visual concept guide to the {len(track['chapters'])} chapters of the BloomCode DSA track.", 2, "guide")


SHELL_CSS = """
.site { max-width: 1080px; margin: 0 auto; padding: 28px 16px 56px; display: grid; gap: 18px; }
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
.langs.lab li > b { min-width: 30px; }
.lab-title { flex: 1 1 220px; color: var(--ink); }
.foot a { color: inherit; }
"""


def shell(title, description, body, depth, current=""):
    frag = (f"<title>{html.escape(title)}</title>\n{FONTS}<style>\n{BASE}\n{SHELL_CSS}\n</style>\n"
            + site_bar(depth, current)
            + f'<main class="site">{body}<p class="foot">Original exercises, solutions and guides. '
            f'<a href="{GITHUB}">Starter repos on GitHub</a>; report mistakes as issues there.</p></main>')
    return document(frag, description)


LAB = "https://github.com/bloomcode/codelab"
COLAB = "https://colab.research.google.com/github/bloomcode/codelab/blob/main/"


def lab_page(python_data):
    """The Jupyter lab: one notebook per Python chapter, generated into the codelab repo by studio's make_lab."""
    sections = []
    for t, data in python_data.items():
        per = {}
        for e in data["exercises"]:
            per[e["ch"]] = per.get(e["ch"], 0) + 1
        rows = "".join(
            f'<li><b>{c["ch"]}</b><span class="lab-title">{html.escape(c["title"])}</span><span class="stats">{per[c["ch"]]} exercises</span>'
            f'<span class="links"><a class="primary" href="{COLAB}{t}/{Path(c["file"]).stem}.ipynb">Open in Colab</a>'
            f'<a href="{LAB}/blob/main/{t}/{Path(c["file"]).stem}.ipynb">View</a>'
            f'<a href="../{t}/python/workbook.html#ch-{c["ch"]}">Workbook</a></span></li>' for c in data["chapters"])
        sections.append(f'<section class="panel card-site" id="{t}"><span class="eyebrow">{TRACKS[t]["short"]} · Python</span>'
                        f'<h2>{TRACKS[t]["name"]}</h2><ul class="langs lab">{rows}</ul></section>')
    body = ('<section class="panel hero-site"><span class="eyebrow">Lab · Python in Jupyter</span>'
            "<h1>Practise in a <em>notebook.</em></h1>"
            "<p>Every chapter of the Python tracks as a Jupyter notebook: the same exercises and tests as the starters, "
            "with each exercise linked to its explanation and to a tested solution. Open one in Colab and start; nothing "
            "to install.</p>"
            f'<div class="links"><a class="primary" href="#dsa">DSA notebooks</a><a href="#cp">CP notebooks</a>'
            f'<a href="{LAB}">The lab on GitHub</a></div></section>'
            '<section class="panel"><h2 class="sec">How it works</h2><ol class="start">'
            "<li><b>Open a chapter</b><span>Click <b>Open in Colab</b>, or clone the lab and run <code>jupyter lab</code> "
            "after <code>pip install jupyterlab pytest</code>.</span></li>"
            "<li><b>Run the setup cell once</b><span>It imports what the chapter needs.</span></li>"
            "<li><b>Write, then test</b><span>Replace the stub in an exercise's cell, run it, then run the test cell "
            "under it. Stuck? Each exercise links to its solution in the answer key.</span></li>"
            "<li><b>Keep your work</b><span>In Colab, use <b>File → Save a copy in Drive</b>. Want a progress badge and "
            "<code>git push</code> instead? Use a starter repo; the exercises are the same.</span></li></ol></section>"
            + "".join(sections))
    return shell("Lab · BloomCode", "Jupyter notebooks for the BloomCode Python tracks, one per chapter, with tests and solutions.", body, 1, "lab")


POSTS = (  # newest first: (slug, title, date, minutes to read, tags, summary); the body is kit/blog/<slug>.html
    ("python-modulo", "Python's % operator: negative numbers, wrap-around and rotating arrays", "2026-10-20", 12,
     ("Python", "Arrays", "Fundamentals"),
     "Why -7 % 3 is 2 in Python but -1 in Java, Go and JavaScript, and how that one rule makes (i + k) % n rotate "
     "arrays and wrap indexes in both directions. With a ring you can walk, a number line, an array rotator and a quiz."),
)


def post_date(iso):
    y, m, d = (int(x) for x in iso.split("-"))
    return f"{d} {('January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December')[m - 1]} {y}"


def blog_index_page():
    cards = "".join(
        f'<a class="panel post-card" href="{slug}/"><span class="eyebrow">{post_date(date)} · {mins} min read</span>'
        f"<h2>{html.escape(title)}</h2><p>{html.escape(summary)}</p>"
        f'<span class="tags">{"".join(f"<span>{html.escape(tag)}</span>" for tag in tags)}</span></a>'
        for slug, title, date, mins, tags, summary in POSTS)
    body = ('<section class="panel hero-site"><span class="eyebrow">Blog</span><h1>Ideas, <em>up close.</em></h1>'
            "<p>Longer explanations of the small things that trip people up, with pictures you can play with.</p></section>"
            f'<div class="posts">{cards}</div>')
    frag = (f"<title>Blog · BloomCode</title>\n{FONTS}<style>\n{BASE}\n{SHELL_CSS}\n{read('blog/blog.css')}\n</style>\n"
            + site_bar(1, "blog") + f'<main class="site">{body}</main>')
    return document(frag, "Longer explanations of programming ideas, with interactive pictures.")


def blog_post_page(slug, title, date, mins, tags, summary):
    head = (f'<header class="post-head"><span class="eyebrow"><a href="../">Blog</a> · {" · ".join(html.escape(t) for t in tags)}</span>'
            f"<h1>{html.escape(title)}</h1><p class=\"dek\">{html.escape(summary)}</p>"
            f'<div class="post-meta"><time datetime="{date}">{post_date(date)}</time><span>{mins} min read</span></div></header>')
    frag = (f"<title>{html.escape(title)} · BloomCode</title>\n{FONTS}<style>\n{BASE}\n{read('blog/blog.css')}\n</style>\n"
            + site_bar(2, "blog") + f'<div class="post-wrap"><article class="panel post">{head}{read(f"blog/{slug}.html")}</article></div>')
    return document(frag, summary)


def lang_card(t, lang, counts):
    links = [f'<a class="primary" href="{lang}/workbook.html">Workbook</a>', f'<a href="{lang}/answer-key.html">Answer key</a>',
             f'<a href="https://github.com/bloomcode/{t}-{lang}">Starter repo</a>']
    if lang == "python":
        links.append(f'<a href="../lab/#{t}">Notebooks</a>')
    return (f'<section class="panel card-site"><span class="eyebrow">{TRACKS[t]["short"]} · {LANGS[lang]}</span>'
            f"<h2>{LANGS[lang]}</h2><p class=\"stats\">{counts[lang][0]} exercises · {counts[lang][1]} chapters</p>"
            f'<div class="links">{"".join(links)}</div></section>')


def section_page(t, counts, ids):
    guide = ('<section class="panel card-site"><span class="eyebrow">All languages</span><h2>Concept guide</h2>'
             "<p>Each chapter's idea, a step-through visualizer, language-neutral pseudocode and the cost table.</p>"
             '<div class="links"><a class="primary" href="guide/">Open the guide</a></div></section>') if t == "dsa" else ""
    body = (f'<section class="panel hero-site"><span class="eyebrow">{TRACKS[t]["short"]} track</span>'
            f'<h1>{TRACKS[t]["name"]}</h1><p>{TRACKS[t]["blurb"]}</p></section>'
            f'<div class="cards-site">{"".join(lang_card(t, l, counts) for l in LANGS)}{guide}</div>'
            '<section class="panel"><h2 style="font:800 20px var(--display);margin-bottom:8px">How to practise</h2><ol class="steps-site">'
            f"<li>Open the starter for your language on GitHub and click <b>Use this template</b> (not Fork).</li>"
            f"<li>Read an exercise in the workbook, write it in your copy, and run <code>make test EX={ids[t][1]}</code>.</li>"
            "<li>Push: the progress workflow ticks every exercise whose test passes. Stuck? The answer key has a tested solution.</li>"
            "</ol></section>")
    return shell(f"{TRACKS[t]['name']} · BloomCode", TRACKS[t]["blurb"], body, 1, t)


STAGES = (  # suggested order through the dsa chapters: (label, title, chapters in order, what it is for)
    ("First", "The core toolkit", ("1.1", "2.1", "2.5", "2.6", "2.2", "2.4", "4.1", "3.1", "7.1", "3.2", "2.3", "5.1", "5.6", "5.2"),
     "Most interview questions draw on these. Do the Core exercises, in this order."),
    ("Next", "Graphs, design and performance", ("6.1", "6.4", "6.2", "6.3", "7.2", "7.5", "7.3", "5.3", "2.7", "1.2", "1.3"),
     "Then go back for the Practice exercises in the chapters that felt hard, and start CP Part 1 in your language: "
     "fast input and output come first."),
    ("Later", "Depth", ("5.4", "5.5", "3.3", "4.2", "4.3", "7.4", "8.1", "8.2", "8.3"),
     "Depth for senior and systems-heavy interviews. Save the Stretch exercises for here, and finish the CP track: "
     "the standard library toolbox and contest essentials."),
)


def home_page(counts_by_track, dsa_track, ids):
    shorts = {str(c["n"]): c["short"] for c in dsa_track["chapters"]}
    areas = ", ".join(f"{p['n']} {p['name'].lower()}" for p in dsa_track["parts"])
    steps = [
        ("Choose a track",
         '<a href="dsa/"><b>Data structures and algorithms</b></a> if you are preparing for coding interviews or want the '
         "fundamentals solid; it runs in the order interviews build on. "
         f'<a href="cp/"><b>Competitive programming</b></a> once the first DSA parts feel easy, or now if you are already fluent '
         "and want contest speed in one language. Each track's page has the workbooks, answer keys and starters for "
         f"Python, Java and Go ({counts_by_track['dsa']['python'][0]} DSA exercises, "
         f"{min(c[0] for c in counts_by_track['cp'].values())} to {max(c[0] for c in counts_by_track['cp'].values())} in CP)."),
        ("Choose a language",
         "The one you will interview in. DSA has the same exercises in Python, Java and Go, so you can switch later."),
        ("Copy the starter",
         "Open the starter repo for your track and language, click <b>Use this template</b> (not Fork), and clone your copy. "
         f"Run <code>make test EX={ids['dsa'][0]}</code> for DSA or <code>EX={ids['cp'][0]}</code> for CP: it fails until you write that first exercise."),
        ("Work chapter by chapter",
         'Read the chapter in the <a href="dsa/guide/">concept guide</a>, then each exercise in the workbook. Write it, run '
         f"<code>make test EX={ids['dsa'][1]}</code>, compare with the answer key, and push: <code>PROGRESS.md</code> ticks off every "
         "exercise whose test passes."),
    ]
    start = "".join(f"<li><b>{h}</b><span>{b}</span></li>" for h, b in steps)
    stages = []
    for label, title, chs, why in STAGES:
        stages.append(f'<section class="panel card-site"><span class="eyebrow">{label} · {len(chs)} chapters</span>'
                      f"<h2>{title}</h2><p>{html.escape(', '.join(f'{n} {shorts[n]}' for n in chs))}.</p>"
                      f'<p class="why">{why}</p></section>')
    help_items = [
        ("Stuck on an exercise", "Read the guide chapter again, then reveal the answer key one solution at a time."),
        ("Found a mistake", 'Open an issue on the starter repo you are using; the form asks for the exercise id. '
                            'See the <a href="https://github.com/bloomcode/.github/blob/main/CONTRIBUTING.md">contributing guide</a>.'),
        ("Get fixes and new exercises", "Your copy can pull from its starter; the steps are under <b>Getting updates</b> "
                                         "in your starter's README."),
        ("Prefer notebooks?", 'The <a href="lab/">Lab</a> has every Python chapter as a Jupyter notebook, with tests '
                              "and links to the solutions. Open one in Colab: nothing to install."),
        ("Your progress", "<code>PROGRESS.md</code> and the badge in your repo update on every push. Ticks in a workbook "
                          "are saved in this browser only."),
    ]
    body = ('<section class="panel hero-site"><span class="eyebrow">Interview preparation for working engineers</span>'
            "<h1>Practise the problems. <em>Run the tests.</em></h1>"
            "<p>Original exercises in Python, Java and Go, each with its own test. You solve them in your own copy of a "
            "starter repo; the tests tell you when you are right, and these pages explain the ideas and show worked "
            "solutions.</p>"
            '<div class="links"><a class="primary" href="#start">Start here</a><a href="dsa/">DSA track</a>'
            '<a href="cp/">CP track</a><a href="dsa/guide/">Concept guide</a></div></section>'
            f'<section class="panel" id="start"><h2 class="sec">Start here</h2><ol class="start">{start}</ol></section>'
            '<section class="panel"><h2 class="sec">What to do first, and later</h2>'
            "<p class=\"lede\">Each exercise is <b>Core</b> (everyone should do it), <b>Practice</b> (consolidates the "
            "chapter) or <b>Stretch</b> (harder, or combines ideas). Inside a chapter, go in order: later exercises "
            "reuse earlier ones. DSA chapters are numbered within their area, so 2.5 is chapter 5 of area 2 and 2.5.3 its "
            "third exercise. The areas: " + html.escape(areas) + ".</p>"
            f'<div class="cards-site">{"".join(stages)}</div></section>'
            '<section class="panel"><h2 class="sec">Help</h2><ul class="help">'
            + "".join(f"<li><b>{h}</b><span>{b}</span></li>" for h, b in help_items) +
            "</ul></section>")
    return shell("BloomCode · Interview practice with tests", "Original interview-practice exercises with tests, in Python, Java and Go.", body, 0, "home")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--src", type=Path, required=True, help="directory holding the solutions repos")
    ap.add_argument("--out", type=Path, required=True)
    args = ap.parse_args()
    out = args.out
    out.mkdir(parents=True, exist_ok=True)
    counts = {t: {} for t in TRACKS}
    ids = {}  # track -> (first exercise, a sample exercise), as the starters' README uses them
    dsa_track = None
    python_data = {}
    for t in TRACKS:
        for lang in LANGS:
            repo = args.src / f"{t}-{lang}-solutions"
            track, data = export(repo)
            chs = sorted((str(c["n"]) for c in track["chapters"]), key=chapter_key)
            ids.setdefault(t, (f"{chs[0]}.1", f"{chs[2] if len(chs) > 2 else chs[0]}.2"))
            counts[t][lang] = (len(data["exercises"]), len(data["chapters"]))
            tdir = f"web/{t}" if t == "dsa" else f"web/{t}/{lang}"
            for kind, name in (("workbook", "workbook.html"), ("key", "answer-key.html")):
                page = document(fill(read(f"{tdir}/{kind}.html"), track, data, lang, kind),
                                f"{TRACKS[t]['name']} in {LANGS[lang]}: {'exercises' if kind == 'workbook' else 'tested solutions'}.", 2, t)
                dest = out / t / lang / name
                dest.parent.mkdir(parents=True, exist_ok=True)
                dest.write_text(page)
            if lang == "python":
                python_data[t] = data
            if t == "dsa" and lang == "python":
                dsa_track = track
        (out / t / "index.html").write_text(section_page(t, counts[t], ids))
    (out / "dsa/guide").mkdir(parents=True, exist_ok=True)
    (out / "dsa/guide/index.html").write_text(guide_page(dsa_track))
    (out / "index.html").write_text(home_page(counts, dsa_track, ids))
    (out / "lab").mkdir(exist_ok=True)
    (out / "lab/index.html").write_text(lab_page(python_data))
    for post in POSTS:
        (out / "blog" / post[0]).mkdir(parents=True, exist_ok=True)
        (out / "blog" / post[0] / "index.html").write_text(blog_post_page(*post))
    (out / "blog/index.html").write_text(blog_index_page())
    (out / "404.html").write_text(shell("Not found · BloomCode", "", '<section class="panel hero-site"><h1>Not <em>found</em></h1>'
                                        '<p>That page does not exist. Start from the <a href="/">home page</a>.</p></section>', 0))
    (out / ".nojekyll").write_text("")
    for icon in ICONS.iterdir():
        (out / icon.name).write_bytes(icon.read_bytes())
    pages = sorted(p.relative_to(out).as_posix() for p in out.rglob("*.html"))
    print(f"built {len(pages)} pages into {out}")


if __name__ == "__main__":
    main()
