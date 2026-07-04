#!/usr/bin/env python3
"""Generate SYLLABUS.md from content/curriculum.json so the stats never drift.

Run from the repo root:  python scripts/gen_syllabus.py
It rewrites SYLLABUS.md and prints the headline stats (handy for updating README.md).
"""
import json, os

d = json.load(open('content/curriculum.json', encoding='utf-8'))
tracks = d['tracks']
lessons = [l for t in tracks for m in t['modules'] for l in m['lessons']]
deepdives = {f[:-3] for f in os.listdir('content/lessons') if f.endswith('.md')}

def has_diagram(l):
    return bool(l.get('diagram')) or ('@@diagram:' in l.get('concept', ''))

n_tracks = len(tracks)
n_modules = sum(len(t['modules']) for t in tracks)
n_lessons = len(lessons)
n_practice = sum(len(l.get('exercises', [])) for l in lessons)
n_quiz = sum(len(l.get('quiz', [])) for l in lessons)
n_deep = len(deepdives)
n_diag = sum(1 for l in lessons if has_diagram(l))

out = []
out.append('# Datalith — Full Syllabus'); out.append('')
out.append(f'_{n_tracks} tracks · {n_modules} modules · {n_lessons} lessons · {n_deep} deep-dive '
           f'tutorials · {n_practice} practice problems · {n_quiz} quiz questions · {n_diag} lessons with diagrams_')
out.append(''); out.append('')
out.append('Every lesson has a plain-English concept, a worked example, key points, a quiz, and practice '
           'problems with full solutions (SQL lessons include a live in-browser SQL playground). '
           'Lessons marked 🖼 include a diagram; lessons marked 📖 have a deep-dive tutorial under '
           '`content/lessons/`.')
out.append('')
out.append('> This file is generated from `content/curriculum.json` by `scripts/gen_syllabus.py` — '
           'do not hand-edit; re-run the script after changing the curriculum.')
out.append('')
for i, t in enumerate(tracks, 1):
    tl = [l for m in t['modules'] for l in m['lessons']]
    out.append(''); out.append(f"## {i}. {t.get('icon', '')} {t['title']}")
    out.append(f"_{len(tl)} lessons — {t.get('blurb', '')}_")
    for m in t['modules']:
        out.append(''); out.append(f"### {m['title']}"); out.append('')
        for l in m['lessons']:
            marks = (' 🖼' if has_diagram(l) else '') + (' 📖' if l['id'] in deepdives else '')
            out.append(f"- **{l['title']}** ({l.get('minutes', '?')} min · "
                       f"{len(l.get('exercises', []))} practice){marks} — {l.get('summary', '')}")
    out.append('')
open('SYLLABUS.md', 'w', encoding='utf-8').write('\n'.join(out) + '\n')
print(f"STATS tracks={n_tracks} modules={n_modules} lessons={n_lessons} deep={n_deep} "
      f"practice={n_practice} quiz={n_quiz} diagrams={n_diag}")
