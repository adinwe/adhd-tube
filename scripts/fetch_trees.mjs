// Fetch full comment trees from the Arctic Shift archive API. Resumable, 3 workers, small threads first.
import fs from 'node:fs'
const threads = JSON.parse(fs.readFileSync('data/threads.json','utf8')).filter(t=>t.n>=3).sort((a,b)=>a.n-b.n)
const sleep = ms => new Promise(r=>setTimeout(r,ms))
let i=0, done=0, fail=0
async function worker() {
  while (i < threads.length) {
    const t = threads[i++]; const out = `data/trees/${t.id}.json`
    if (fs.existsSync(out)) { done++; continue }
    let ok=false
    for (let a=0; a<3 && !ok; a++) {
      try {
        const r = await fetch(`https://arctic-shift.photon-reddit.com/api/comments/tree?link_id=t3_${t.id}&limit=25000`, { signal: AbortSignal.timeout(90000) })
        const txt = await r.text()
        if (r.ok && txt.startsWith('{"data":[')) { fs.writeFileSync(out, txt); ok=true } else await sleep(4000*(a+1))
      } catch { await sleep(3000) }
    }
    ok ? done++ : fail++
    if ((done+fail)%100===0) console.log(new Date().toISOString(), 'done', done, 'fail', fail, '/', threads.length)
    await sleep(400)
  }
}
await Promise.all([worker(), worker(), worker()])
console.log('FINISHED done', done, 'fail', fail)
