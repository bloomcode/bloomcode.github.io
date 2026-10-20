# bloomcode.github.io

The BloomCode site: concept guide, workbooks and answer keys for every track, published at <https://bloomcode.github.io/>.

Nothing here is written by hand page by page. `kit/build.py` reads the exercise markers in the six solutions repos and fills the page templates in `kit/web/` and `kit/guide/`.

## Build locally

With the solutions repos cloned next to this one:

```sh
python3 kit/build.py --src .. --out _site          # Python 3.11+
python3 -m http.server -d _site 8000               # open http://localhost:8000/
```

Check every page in a real browser (needs `pip install playwright` and `playwright install chromium`):

```sh
python3 kit/render_check.py _site --shots shots
```

It fails on a JavaScript error, a page that scrolls sideways at phone width, a guide visualizer that does not mount, or a broken internal link.

## Deploy

`.github/workflows/pages.yml` checks out the six solutions repos (private, read with deploy keys), builds, runs the render check and deploys to GitHub Pages. It runs on every push to main, daily, and by hand from the Actions tab. Pull requests build and check without deploying.

## Layout

```
kit/build.py           builds the whole site
kit/buildlib.py        parses exercise markers (Python, Java, Go)
kit/render_check.py    browser check at 1280 px light and 390 px dark
kit/web/               base.css, common.js, workbook and answer-key templates per track
kit/guide/             the concept guide: template, styles, visualizers, chapter content
kit/blog/              the blog: shared styles and one HTML body per post (listed in POSTS in build.py)
```
