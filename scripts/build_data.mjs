// Merge ranked + meta + tags into site/videos.json (only live, ADHD-relevant videos)
import fs from 'node:fs'
const ranked = JSON.parse(fs.readFileSync('data/ranked.json','utf8'))
const meta = JSON.parse(fs.readFileSync('data/meta.json','utf8'))
const tags = fs.existsSync('data/tags.json') ? JSON.parse(fs.readFileSync('data/tags.json','utf8')) : {}
const threads = JSON.parse(fs.readFileSync('data/threads.json','utf8'))
const out = []
for (const v of ranked) {
  const m = meta[v.id], t = tags[v.id]
  if (!m || m.dead || !m.title || !t || t.adhd === false) continue
  out.push({ id:v.id, t:m.title, c:m.channel, s:m.seconds||null, y:(m.published||'').slice(0,4)||null, r:v.recommenders, th:v.threads, up:v.upvotes,
    topic:t.topic, kind:t.kind, ev:t.evidence, cn:t.caution_note||'', b:t.blurb, q:(v.contexts[0]||'').slice(0,220), subs:v.subs })
}
const mined = JSON.parse(fs.readFileSync('data/mine_stats.json','utf8'))
const stats = { videos: out.length, threads: threads.length, trees: mined.trees, comments: mined.comments, subs: mined.subs, built: new Date().toISOString().slice(0,10) }
fs.writeFileSync('site/videos.json', JSON.stringify({ stats, videos: out }))
console.log(JSON.stringify(stats), Object.entries(out.reduce((a,v)=>(a[v.topic]=(a[v.topic]||0)+1,a),{})))
const tpl = fs.readFileSync('site/template.html','utf8')
fs.writeFileSync('site/index.html', tpl.replace('/*DATA*/', JSON.stringify({ stats, videos: out }).replace(/</g,'\\u003c')))
console.log('wrote site/index.html', (fs.statSync('site/index.html').size/1024).toFixed(0)+'KB')
