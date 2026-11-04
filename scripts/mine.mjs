// Mine YouTube links from thread posts + comment trees; rank by distinct recommenders.
import fs from 'node:fs'
const threads = JSON.parse(fs.readFileSync('data/threads.json','utf8'))
const yt = /(?:youtube\.com\/(?:watch\?(?:[^\s)\]"]*?&(?:amp;)?)?v=|shorts\/|live\/|embed\/|v\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/g
const V = new Map()
const add = (id, {thread, author, score=0, text, sub, created}) => {
  let v = V.get(id); if (!v) V.set(id, v = { id, threads:new Set(), authors:new Set(), subs:new Set(), score:0, mentions:0, contexts:[], first:Infinity, last:0 })
  v.threads.add(thread); if (author && author!=='[deleted]') v.authors.add(author); v.subs.add(sub)
  v.score += Math.max(0, score||0); v.mentions++
  if (created) { v.first=Math.min(v.first,created); v.last=Math.max(v.last,created) }
  if (text) { const clean = text.replace(/\[([^\]]*)\]\([^)]*\)/g,'$1').replace(/https?:\/\/\S+/g,'').replace(/\s+/g,' ').trim(); if (clean.length>25 && v.contexts.length<6) v.contexts.push({ s: score||0, t: clean.slice(0,280) }) }
}
let trees=0, comments=0
const walk = (node, t) => {
  if (!node) return
  if (Array.isArray(node)) return node.forEach(n=>walk(n,t))
  const d = node.data; if (!d) return
  if (d.body) { comments++; for (const m of d.body.matchAll(yt)) add(m[1], { thread:t.id, author:d.author, score:d.score, text:d.body, sub:t.sub, created:d.created_utc }) }
  if (d.replies && d.replies.data) walk(d.replies.data.children, t)
  if (Array.isArray(d.replies)) walk(d.replies, t)
  if (d.children && Array.isArray(d.children)) walk(d.children, t)
}
for (const t of threads) {
  for (const m of ((t.url||'')+' '+(t.selftext||'')).matchAll(yt)) add(m[1], { thread:t.id, author:t.author, score:t.score, text:t.title+'. '+(t.selftext||''), sub:t.sub, created:t.created })
  const f = `data/trees/${t.id}.json`
  if (fs.existsSync(f)) { try { walk(JSON.parse(fs.readFileSync(f,'utf8')).data, t); trees++ } catch {} }
}
const out = [...V.values()].map(v => ({ id:v.id, recommenders:v.authors.size, threads:v.threads.size, upvotes:v.score, mentions:v.mentions, subs:[...v.subs], first:v.first, last:v.last,
  contexts: v.contexts.sort((a,b)=>b.s-a.s).slice(0,3).map(c=>c.t),
  rank: v.authors.size*2 + v.threads.size*3 + Math.log2(1+v.score) }))
  .filter(v => v.recommenders>=1).sort((a,b)=>b.rank-a.rank)
fs.writeFileSync('data/ranked.json', JSON.stringify(out))
const subCount={}; for (const t of threads) if (fs.existsSync(`data/trees/${t.id}.json`)) subCount[t.sub]=(subCount[t.sub]||0)+1
fs.writeFileSync('data/mine_stats.json', JSON.stringify({ trees, comments, videos: out.length, subs: Object.entries(subCount).sort((a,b)=>b[1]-a[1]).map(x=>x[0]) }))
console.log(JSON.stringify({ trees, comments, videos: out.length, multi: out.filter(v=>v.recommenders>=2).length, top: out.slice(0,10).map(v=>[v.id,v.recommenders,v.threads,v.upvotes]) }))
