# ADHD community video picks: open dataset (built 2026-11-04)

YouTube videos that people in 15 ADHD communities on Reddit recommended to each other.
Source: 287,086 comments in 6,628 threads (r/ADHD, r/adhdwomen, r/adhdmeme, r/ADHDUK, r/ADHD_Programmers, r/ADHDparenting, r/adhd_anxiety, r/ADHDers, r/ADHD_partners, r/TwoXADHD, r/AdhdRelationships, r/adhd_college, r/adhdaustralia, r/audhd, r/adhdnz), read via the Arctic Shift Reddit archive.

## Files
- `curated_videos.csv / .json`: 549 videos still available on YouTube and judged ADHD-relevant, with AI-written topic, evidence tag and blurb.
- `all_mentioned_videos.csv`: all 2104 distinct YouTube IDs found, with counts and availability.

## Columns
- distinct_recommenders: number of different Reddit accounts that linked the video
- threads: number of different threads it appeared in
- total_comment_upvotes: summed score of the comments/posts that linked it
- topic, kind, evidence_tag, caution_note, blurb_ai: written by an AI model (Claude Haiku) from the title, description and comment context. They can be wrong. Not medical advice.

## Privacy
No usernames, comment text or thread IDs are included. Only counts per video.

## Limits
Threads were found through Reddit search, so this is a large sample, not every comment ever posted. Videos shared in threads that search did not surface are missing.
