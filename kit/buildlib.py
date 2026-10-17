"""Shared generator: parse exercise markers from Python, Java or Go sources and export page data.

Usage from a project directory:  python3 ../kit/buildlib.py
The project provides config.py with LANG, SOURCES (glob), CHAPTERS, PARTS.
"""
import glob
import importlib.util
import json
import os
import re
import sys
import textwrap

HEAD = re.compile(r"^(\s*)(?:#|//) ==== EX (\d+)\.(\d+) \| (.+?) \| (Core|Practice|Stretch)(?: \| class=(\w+))?\s*$")
META = re.compile(r"^\s*(?:#|//) (PROMPT|EXAMPLE|BIGO|NOTE): (.*)$")
END = re.compile(r"^\s*(?:#|//) ==== END\s*$")


def load_config():
    spec = importlib.util.spec_from_file_location("config", "config.py")
    cfg = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(cfg)
    return cfg


def file_imports(lines, lang):
    """Return a list of (import_line, names_that_trigger_it)."""
    out = []
    if lang == "python":
        for l in lines:
            if re.match(r"^(import|from) \w", l):
                names = re.findall(r"import (.+)", l)[0].replace(" ", "").split(",")
                out.append((l, [n.split(" as ")[-1] for n in names]))
    elif lang == "java":
        for l in lines:
            m = re.match(r"^import (static )?([\w.]+)\.(\w+);", l)
            if m:
                out.append((l, [m.group(3)]))
    elif lang == "go":
        in_block = False
        for l in lines:
            s = l.strip()
            if s.startswith("import ("):
                in_block = True
                continue
            if in_block and s == ")":
                in_block = False
                continue
            m = re.match(r'^(?:import\s+)?(?:(\w+)\s+)?"([\w./]+)"$', s)
            if (in_block or s.startswith("import")) and m:
                alias, path = m.group(1), m.group(2)
                out.append((f'"{path}"' if not alias else f'{alias} "{path}"', [alias or path.split("/")[-1]]))
    return out


def needed_imports(body, imports, lang):
    need = []
    for line, names in imports:
        for n in names:
            pat = rf"\b{re.escape(n)}\b" if lang == "java" else rf"\b{re.escape(n)}\.|\b{re.escape(n)}\("
            if re.search(pat, body):
                need.append(line)
                break
    return need


def parse(path, lang):
    lines = open(path).read().split("\n")
    imports = file_imports(lines, lang)
    out, i = [], 0
    while i < len(lines):
        m = HEAD.match(lines[i])
        if not m:
            i += 1
            continue
        indent, ch, num, title, level, cls = m.groups()
        meta, code = {}, []
        i += 1
        while META.match(lines[i]):
            key, val = META.match(lines[i]).groups()
            meta[key] = val
            i += 1
        while not END.match(lines[i]):
            code.append(lines[i])
            i += 1
        while code and not code[-1].strip():
            code.pop()
        body = textwrap.dedent("\n".join(code))
        need = needed_imports(body, imports, lang)
        if lang == "python":
            if indent and cls:
                body = f"class {cls}:  # continued\n" + textwrap.indent(body, "    ")
            if need:
                body = "\n".join(need) + ("\n\n" if indent and cls else "\n\n\n") + body
        elif lang == "java":
            if cls:
                body = f"// inside class {cls}\n" + body
            stripped = re.sub(r'"(\\.|[^"\\])*"|\'(\\.|[^\'\\])*\'|//[^\n]*', "", body)
            open_braces = stripped.count("{") - stripped.count("}")
            if open_braces > 0:  # a class the next exercises keep extending
                body += "\n\n    // ... the next exercises add more methods here\n" + "}\n" * open_braces
                body = body.rstrip("\n")
            if need:
                body = "\n".join(need) + "\n\n" + body
        elif lang == "go":
            if need:
                body = ("import " + need[0] if len(need) == 1 else "import (\n" + "\n".join("\t" + n for n in need) + "\n)") + "\n\n" + body
        out.append(dict(ch=int(ch), num=int(num), title=title, level=level, code=body,
                        file=os.path.basename(path), **meta))
        i += 1
    return out


def main():
    cfg = load_config()
    exs = []
    for f in sorted(glob.glob(cfg.SOURCES)):
        if f.endswith("_test.go") or os.path.basename(f).startswith("Test") or "/tests/" in f:
            continue
        exs += parse(f, cfg.LANG)
    exs.sort(key=lambda e: (e["ch"], e["num"]))
    ids = [(e["ch"], e["num"]) for e in exs]
    assert len(ids) == len(set(ids)), "duplicate ids"
    for ch in cfg.CHAPTERS:
        nums = [e["num"] for e in exs if e["ch"] == ch]
        assert nums == list(range(1, len(nums) + 1)), (ch, nums)
        for e in exs:
            if e["ch"] == ch:
                assert e.get("PROMPT") and e.get("EXAMPLE") and e.get("BIGO"), (ch, e["num"])
    chapters = [{"ch": ch, "title": t, "short": s, "focus": fo,
                 "file": getattr(cfg, "FILE_LABEL", lambda e: e["file"])(next(e for e in exs if e["ch"] == ch)),
                 "part": next(i for i, (_, chs) in enumerate(cfg.PARTS, 1) if ch in chs)}
                for ch, (t, s, fo) in cfg.CHAPTERS.items()]
    parts = [{"n": i, "name": name.split(": ", 1)[1].rsplit(" (", 1)[0], "chs": chs}
             for i, (name, chs) in enumerate(cfg.PARTS, 1)]
    items = [{"id": f"{e['ch']}.{e['num']}", "ch": e["ch"], "title": e["title"], "level": e["level"],
              "prompt": e["PROMPT"], "example": e["EXAMPLE"], "bigo": e["BIGO"],
              "note": e.get("NOTE", ""), "code": e["code"]} for e in exs]
    os.makedirs("build", exist_ok=True)
    json.dump({"lang": cfg.LANG, "parts": parts, "chapters": chapters, "exercises": items},
              open("build/data.json", "w"), ensure_ascii=False, separators=(",", ":"))
    from collections import Counter
    print("exported", len(items), dict(Counter(e["level"] for e in items)),
          {ch: sum(1 for e in items if e["ch"] == ch) for ch in cfg.CHAPTERS})


if __name__ == "__main__":
    main()
