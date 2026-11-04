"""Tag each video with topic, kind, evidence note and a one-line summary using Claude Haiku via OpenRouter.
Needs OPENROUTER_API_KEY (or DEEPSEEK_API_KEY with TAG_PROVIDER=deepseek). Uses only the Python standard library."""
import json, os, urllib.request, time, sys
ranked = json.load(open('data/ranked.json')); meta = json.load(open('data/meta.json'))
out_f = 'data/tags.json'; tags = json.load(open(out_f)) if os.path.exists(out_f) else {}
todo = [v for v in ranked if v['id'] in meta and not meta[v['id']].get('dead') and v['id'] not in tags]
TOPICS = ["understanding", "women", "daily-life", "relationships", "treatment-science", "work-study", "laughs"]
PROMPT = """You are tagging YouTube videos that people in ADHD Reddit communities recommended. For each video return JSON.
Fields:
- id
- adhd: true if the video is genuinely useful or meaningful for people with ADHD (or their families). false for off-topic links (music videos, unrelated news, random clips) unless the comments show ADHD relevance.
- topic: one of %s. understanding = what ADHD is / explainers / lived experience; women = women, girls, late diagnosis; daily-life = home, routines, cleaning, money, executive function hacks; relationships = partners, parenting, family; treatment-science = medication, research, clinicians, diagnosis process; work-study = jobs, programming, school, productivity; laughs = comedy, memes, relatable sketches.
- kind: one of "clinician/researcher", "lived experience", "practical tips", "comedy", "documentary/news", "talk", "other".
- evidence: "solid" (expert or research-based and mainstream), "personal" (lived experience, no strong medical claims), "caution" (makes contested, unscientific, cure or anti-medication claims, or promotes a product). Comedy is "personal".
- caution_note: if evidence is caution, max 12 plain words saying why. Else "".
- blurb: max 14 plain words saying what the video is, no hype, no em dashes.
Return ONLY a JSON array.
Videos:
%s"""
def call(batch):
    items = [{"id": v['id'], "title": meta[v['id']].get('title'), "channel": meta[v['id']].get('channel'), "minutes": round((meta[v['id']].get('seconds') or 0)/60,1),
              "description": (meta[v['id']].get('desc') or '')[:300], "what_redditors_said": [c[:200] for c in v['contexts'][:2]]} for v in batch]
    prov = os.environ.get('TAG_PROVIDER', 'openrouter')
    url, key, model = {'openrouter': ('https://openrouter.ai/api/v1/chat/completions', 'OPENROUTER_API_KEY', 'anthropic/claude-haiku-4.5'),
                       'deepseek': ('https://api.deepseek.com/chat/completions', 'DEEPSEEK_API_KEY', 'deepseek-chat')}[prov]
    body = json.dumps({"model": model, "max_tokens": 6000, "temperature": 0,
                       "messages": [{"role": "user", "content": PROMPT % (TOPICS, json.dumps(items, ensure_ascii=False))}]}).encode()
    req = urllib.request.Request(url, data=body, headers={'Authorization': 'Bearer ' + os.environ[key], 'content-type': 'application/json'})
    txt = json.load(urllib.request.urlopen(req, timeout=180))['choices'][0]['message']['content']
    txt = txt[txt.find('['): txt.rfind(']') + 1]
    return json.loads(txt)
B = 20
for i in range(0, len(todo), B):
    batch = todo[i:i+B]
    for attempt in range(3):
        try:
            for t in call(batch): tags[t['id']] = t
            break
        except Exception as e:
            print('retry', i, e, file=sys.stderr); time.sleep(5)
    json.dump(tags, open(out_f, 'w'))
    print(f'{min(i+B, len(todo))}/{len(todo)}', flush=True)
print('tagged', len(tags))
