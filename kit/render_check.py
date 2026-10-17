"""Check the built site in a real browser: every page at 1280 px light and 390 px dark.

    python3 kit/render_check.py _site [--shots DIR]

Fails (exit 1) on a JavaScript error, a horizontal scroll at phone width, a guide visualizer that
does not mount, or an internal link to a page or anchor-less path that does not exist.
Needs `pip install playwright` and `playwright install chromium`.
"""
import argparse
import functools
import http.server
import re
import sys
import threading
from pathlib import Path
from urllib.parse import urljoin, urlparse

from playwright.sync_api import sync_playwright

VIEWS = (("desktop", {"width": 1280, "height": 900}, "light"), ("phone", {"width": 390, "height": 844}, "dark"))


class QuietHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *args):
        pass


def serve(root):
    handler = functools.partial(QuietHandler, directory=str(root))
    srv = http.server.ThreadingHTTPServer(("127.0.0.1", 0), handler)
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    return srv, f"http://127.0.0.1:{srv.server_port}/"


def link_problems(root, pages):
    """Static check: every relative href points at a file in the site."""
    out = []
    for rel in pages:
        text = (root / rel).read_text()
        for href in re.findall(r'href="([^"#]+)(?:#[^"]*)?"', text):
            if href.startswith(("http:", "https:", "mailto:", "${", "data:")) or "${" in href:
                continue
            target = urlparse(urljoin("http://x/" + rel, href)).path.lstrip("/")
            path = root / target
            if not (path.is_file() or (path / "index.html").is_file()):
                out.append(f"{rel}: broken link {href}")
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("site", type=Path)
    ap.add_argument("--shots", type=Path)
    args = ap.parse_args()
    root = args.site.resolve()
    pages = sorted(p.relative_to(root).as_posix() for p in root.rglob("*.html"))
    problems = link_problems(root, pages)
    srv, base = serve(root)
    with sync_playwright() as p:
        browser = p.chromium.launch()
        for rel in pages:
            for name, viewport, scheme in VIEWS:
                page = browser.new_page(viewport=viewport, color_scheme=scheme)
                errors = []
                page.on("pageerror", lambda e: errors.append(str(e)))
                page.on("console", lambda m: errors.append(m.text) if m.type == "error" and "favicon" not in m.text else None)
                page.goto(base + rel, wait_until="networkidle")
                if rel == "dsa/guide/index.html":
                    page.evaluate("window.__mountAll && window.__mountAll()")
                    page.wait_for_timeout(800)
                    failed = page.evaluate("""() => [...document.querySelectorAll('.viz-host')]
                        .filter(h => /unavailable|failed to load/.test(h.textContent)).map(h => h.dataset.widget)""")
                    if failed:
                        problems.append(f"{rel} [{name}]: visualizers did not mount: {failed}")
                page.wait_for_timeout(300)
                width = page.evaluate("document.documentElement.scrollWidth")
                if width > viewport["width"] + 1:
                    wide = page.evaluate("""() => [...document.querySelectorAll('body *')].filter(e => {
                        const r = e.getBoundingClientRect(); return r.right > innerWidth + 1 && getComputedStyle(e).position !== 'fixed'
                          && !e.closest('.heat-wrap, pre, .rail, .sum-scroll');
                      }).slice(0, 3).map(e => e.tagName.toLowerCase() + '.' + e.className)""")
                    problems.append(f"{rel} [{name}]: page scrolls sideways ({width}px): {wide}")
                problems += [f"{rel} [{name}]: {e}" for e in errors]
                if args.shots:
                    shot = args.shots / f"{rel.replace('/', '_').removesuffix('.html')}-{name}.png"
                    shot.parent.mkdir(parents=True, exist_ok=True)
                    page.screenshot(path=str(shot))
                page.close()
        browser.close()
    srv.shutdown()
    print("\n".join(problems) if problems else f"{len(pages)} pages OK at 1280 px light and 390 px dark")
    sys.exit(1 if problems else 0)


if __name__ == "__main__":
    main()
