# The Co.LLab(TM) social toolkit

Durable home for the daily Instagram + Facebook posting tasks. The Composio workbench folder /mnt/files/collab is wiped
between sessions, so every task first syncs this folder into it (see the sync snippet in the task prompt).

- render.py: slide/reel renderer; "FIG" = Omnidirectional Enterprise(TM) Metatron's Cube figure (exact geometry).
- publish_src.py: post_carousel / post_reel (Instagram + The Co.LLab(TM) Facebook Page only), permalink, log_post (commits post_log.json).
- post_log.json: every post (date, type, theme, url, facebook).
- queue/<id>/: pre-rendered posts (slides, caption.txt, meta.json with status).
