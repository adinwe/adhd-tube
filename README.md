# ADHD Tube

**Live site:** https://adhdtube.org

The YouTube videos people in ADHD communities on Reddit keep recommending to each other, ranked by how many different people recommended them. Views, ads and YouTube's algorithm play no part.

Inspired by Andrej Karpathy's HackerTube.

## What's here

| Folder | What it is |
|---|---|
| `scripts/` | The pipeline that builds the list |
| `site/template.html` | The whole website: one HTML file, no framework |
| `public/` | Icons, link-preview image, robots.txt, sitemap, 404 |
| `dataset/` | The open dataset: video IDs, counts and AI labels (CC BY 4.0) |

## How the list is made

1. **Find threads.** Reddit search across 15 ADHD subreddits for recommendation threads and posts that link YouTube. Saved as `data/threads.json` (not included here, because it holds usernames and post text).
2. **Read every comment.** `node scripts/fetch_trees.mjs` downloads each thread's full comment tree from the [Arctic Shift](https://github.com/ArthurHeitmann/arctic_shift) Reddit archive.
3. **Count recommenders.** `node scripts/mine.mjs` pulls out every YouTube link and counts distinct people and distinct threads per video. Each person counts once per video.
4. **Video details.** `node scripts/meta.mjs` gets title, channel and length from YouTube's public oEmbed endpoint and watch page. Deleted and private videos are dropped.
5. **Labels.** `python3 scripts/classify.py` asks an AI model (Claude Haiku via OpenRouter) to tag topic, Expert / Lived experience / Check the claims, and a one-line summary. These labels can be wrong.
6. **Build.** `node scripts/build_data.mjs` writes `site/index.html` with the data inlined. `node scripts/export_dataset.mjs` writes `dataset/`.

Rank score = 2 × distinct recommenders + 3 × distinct threads + log2(1 + comment upvotes).

## Limits

- Threads were found through Reddit search, so this is a large sample, not every comment ever posted.
- Popular isn't the same as proven. It isn't medical advice.
- No usernames or comment text are published in `dataset/`. The site shows short anonymous quotes.

## Privacy

The site has no sign-up and sets no cookies. Saved and watched lists live in the browser's localStorage. Visits are counted anonymously with Vercel Web Analytics.

## Licence

Code: MIT. Dataset: CC BY 4.0. Videos belong to their creators.
