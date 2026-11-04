// Open dataset: video-level aggregates only. No Reddit usernames, no comment text, no thread IDs.
import fs from 'node:fs'
const { stats, videos } = JSON.parse(fs.readFileSync('site/videos.json','utf8'))
const ranked = JSON.parse(fs.readFileSync('data/ranked.json','utf8'))
const meta = JSON.parse(fs.readFileSync('data/meta.json','utf8'))
fs.mkdirSync('dataset', { recursive: true })
const rows = videos.map((v,i)=>({ rank:i+1, youtube_id:v.id, url:`https://www.youtube.com/watch?v=${v.id}`, title:v.t, channel:v.c, seconds:v.s, year:v.y,
  distinct_recommenders:v.r, threads:v.th, total_comment_upvotes:v.up, subreddits:v.subs.join(';'), topic:v.topic, kind:v.kind, evidence_tag:v.ev, caution_note:v.cn, blurb_ai:v.b }))
const all = ranked.map(v=>({ youtube_id:v.id, distinct_recommenders:v.recommenders, threads:v.threads, total_comment_upvotes:v.upvotes, subreddits:v.subs.join(';'), status: meta[v.id]?.dead ? 'unavailable' : (meta[v.id] ? 'available' : 'not_checked') }))
const csv = a => { const k=Object.keys(a[0]); return [k.join(','), ...a.map(r=>k.map(x=>{ const s=String(r[x]??''); return /[",\n]/.test(s)?'"'+s.replace(/"/g,'""')+'"':s }).join(','))].join('\n') }
fs.writeFileSync('dataset/curated_videos.csv', csv(rows)); fs.writeFileSync('dataset/curated_videos.json', JSON.stringify(rows, null, 1))
fs.writeFileSync('dataset/all_mentioned_videos.csv', csv(all))
fs.writeFileSync('dataset/README.md', `# ADHD community video picks: open dataset (built ${stats.built})

YouTube videos that people in ${stats.subs.length} ADHD communities on Reddit recommended to each other.
Source: ${stats.comments.toLocaleString()} comments in ${stats.trees.toLocaleString()} threads (${stats.subs.map(s=>'r/'+s).join(', ')}), read via the Arctic Shift Reddit archive.

## Files
- \`curated_videos.csv / .json\`: ${rows.length} videos still available on YouTube and judged ADHD-relevant, with AI-written topic, evidence tag and blurb.
- \`all_mentioned_videos.csv\`: all ${all.length} distinct YouTube IDs found, with counts and availability.

## Columns
- distinct_recommenders: number of different Reddit accounts that linked the video
- threads: number of different threads it appeared in
- total_comment_upvotes: summed score of the comments/posts that linked it
- topic, kind, evidence_tag, caution_note, blurb_ai: written by an AI model (Claude Haiku) from the title, description and comment context. They can be wrong. Not medical advice.

## Privacy
No usernames, comment text or thread IDs are included. Only counts per video.

## Limits
Threads were found through Reddit search, so this is a large sample, not every comment ever posted. Videos shared in threads that search did not surface are missing.
`)
console.log('dataset', rows.length, 'curated,', all.length, 'all')
