#!/usr/bin/env python3
"""Checks the i18n catalogs (frontend/web/assets/i18n/*.properties).

- Every language must define the same keys.
- Every key used in the code (frontend `I18n.t/tn(...)` and menu labels, backend `ApiError(...)` / `t(...)`) must exist.
- Keys that no code uses are reported as warnings.
Usage: python3 scripts/check_i18n.py   (exit code 1 if something is missing)
"""
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CATALOG = ROOT / "frontend" / "web" / "assets" / "i18n"
SOURCES = [(ROOT / "frontend" / "src", "*.ts"), (ROOT / "backend", "*.py"), (ROOT / "server.py", None)]
# Frontend: I18n.t('key') / I18n.tn('key', n) calls and the `label: 'menu.x'` entries of menu.ts.
TS_KEYS = re.compile(r"""(?:I18n\.tn?\(\s*|label:\s*)['"]([a-z][a-z0-9_]*(?:\.[a-z0-9_]+)+)['"]""")
# Backend: any "error.*", "site.*" or "cli.*" literal (ApiError keys, t() calls, helper arguments).
PY_KEYS = re.compile(r"""['"]((?:error|site|cli)\.[a-z0-9_.]+)['"]""")
# I18n.t(cond ? 'a.b' : 'c.d'): both branches are keys.
TS_TERNARY = re.compile(r"""I18n\.tn?\([^)]*?\?\s*['"]([a-z0-9_.]+)['"]\s*:\s*['"]([a-z0-9_.]+)['"]""")
PLURAL = re.compile(r"""\.tn\(\s*['"]([a-z0-9_.]+)['"]""")
# Keys built at runtime ('validation.' + error.type, 'crud.subtitle.' + view, 'cms.js.type.' + type).
DYNAMIC_PREFIXES = ("validation.", "crud.subtitle.", "cms.js.type.")


def load(path: Path) -> dict[str, str]:
    keys = {}
    for n, line in enumerate(path.read_text(encoding="utf-8").splitlines(), 1):
        line = line.strip()
        if not line or line.startswith(("#", "!")):
            continue
        if "=" not in line:
            print(f"  {path.name}:{n}: line without '='")
            continue
        key, value = line.split("=", 1)
        keys[key.strip()] = value.strip()
    return keys


def used_keys() -> set[str]:
    ts = [f for f in (SOURCES[0][0]).rglob("*.ts")]
    py = [f for f in (SOURCES[1][0]).rglob("*.py") if "__pycache__" not in str(f)] + [SOURCES[2][0]]
    ts_text = "\n".join(f.read_text(encoding="utf-8") for f in ts)
    py_text = "\n".join(f.read_text(encoding="utf-8") for f in py)
    plurals = set(PLURAL.findall(ts_text))
    keys = set()
    for key in TS_KEYS.findall(ts_text):
        keys |= {f"{key}.one", f"{key}.other"} if key in plurals else {key}
    for a, b in TS_TERNARY.findall(ts_text):
        keys |= {a, b}
    keys |= set(PY_KEYS.findall(py_text))
    return keys


def main() -> int:
    catalogs = {p.stem: load(p) for p in sorted(CATALOG.glob("*.properties"))}
    problems = 0
    reference_lang, reference = next(iter(catalogs.items()))
    for lang, keys in catalogs.items():
        for key in sorted(set(reference) - set(keys)):
            print(f"MISSING in {lang}: {key}"); problems += 1
        for key in sorted(set(keys) - set(reference)):
            print(f"MISSING in {reference_lang}: {key}"); problems += 1
        for key, value in keys.items():
            if not value:
                print(f"EMPTY in {lang}: {key}"); problems += 1
    used = used_keys()
    all_keys = set().union(*[set(k) for k in catalogs.values()])
    for key in sorted(used - all_keys):
        print(f"UNDEFINED (used in code): {key}"); problems += 1
    for key in sorted(all_keys - used):
        if not key.startswith(DYNAMIC_PREFIXES):
            print(f"warning: unused key: {key}")
    print(f"{len(all_keys)} keys, {len(catalogs)} languages ({', '.join(catalogs)}), {problems} problem(s)")
    return 1 if problems else 0


if __name__ == "__main__":
    sys.exit(main())
