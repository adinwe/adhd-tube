// Video metadata without an API key: oEmbed (title/channel, also tells us if it's still public) + watch page (length, views, date).
import fs from 'node:fs'
const ranked = JSON.parse(fs.readFileSync('data/ranked.json','utf8'))
const N = +(process.argv[2]||800)
const cand = ranked.filter(v=>v.recommenders>=2 || v.upvotes>=10).slice(0,N)
const metaFile='data/meta.json'; const meta = fs.existsSync(metaFile)? JSON.parse(fs.readFileSync(metaFile,'utf8')) : {}
const sleep = ms => new Promise(r=>setTimeout(r,ms))
let i=0
async function one(v){
  if (meta[v.id] && (meta[v.id].dead || meta[v.id].seconds)) return
  const m = { }
  try { const r = await fetch(`https://www.youtube.com/oembed?format=json&url=https://www.youtube.com/watch?v=${v.id}`, {signal:AbortSignal.timeout(20000)})
    if (!r.ok) { meta[v.id]={dead:r.status}; return }
    const o = await r.json(); m.title=o.title; m.channel=o.author_name } catch(e){ return }
  try { const r = await fetch(`https://www.youtube.com/watch?v=${v.id}&hl=en`, {headers:{'accept-language':'en'}, signal:AbortSignal.timeout(20000)}); const h = await r.text()
    m.seconds = +(h.match(/"lengthSeconds":"(\d+)"/)||[])[1] || null
    m.views = +(h.match(/"viewCount":"(\d+)"/)||[])[1] || null
    m.published = (h.match(/"publishDate":"([^"]+)"/)||[])[1] || null
    m.short = /"isShortsEligible":true/.test(h) && m.seconds && m.seconds<=180
    m.desc = ((h.match(/"shortDescription":"((?:[^"\\]|\\.)*)"/)||[])[1]||'').replace(/\\n/g,' ').replace(/\\"/g,'"').slice(0,400)
  } catch {}
  meta[v.id]=m
}
async function worker(){ while(i<cand.length){ const v=cand[i++]; await one(v); await sleep(700) } }
await Promise.all([worker(),worker(),worker(),worker()])
fs.writeFileSync(metaFile, JSON.stringify(meta))
const vals = cand.map(v=>meta[v.id]).filter(Boolean)
console.log('candidates', cand.length, 'alive', vals.filter(m=>!m.dead).length, 'dead', vals.filter(m=>m.dead).length, 'withLength', vals.filter(m=>m.seconds).length)
