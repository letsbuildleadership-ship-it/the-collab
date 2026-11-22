import os, json, base64
# The Co.LLab(TM) publisher. exec() inside the Composio workbench (uses run_composio_tool, upload_local_file).
# post_carousel(paths, caption) / post_reel(path, caption) -> Instagram media id; each also cross-posts to
# The Co.LLab(TM) Facebook Page only. LAST_FB holds {"ok":True,"id":...} or {"ok":False,"error":...}.
# log_post(entry) appends to post_log.json in GitHub (the durable copy) and locally.
IG_ACCOUNT = "instagram_burly-amazed"
IG_USER_ID = "29297860909902517"
FB_ACCOUNT = "collab-fb-page"
FB_PAGE_ID = "1430392103492249"        # The Co.LLab TM: Building Leadership Infrastructure
FB_BLOCKED = {"1382853651584361"}      # Otter & Ochre: never post here
GH = {"owner": "letsbuildleadership-ship-it", "repo": "the-collab"}
GH_ACCOUNT = "github_topia-loa"
REPO_DIR = "marketing/collab-social"
LOCAL = "/mnt/files/collab"
LAST_FB = {}

def _call(slug, args, account):
    r, e = run_composio_tool(slug, args, account=account)
    if e or not r.get("successful", True): raise RuntimeError(f"{slug}: {e or r.get('error')}")
    return r["data"]

def _ig(slug, args): return _call(slug, args, IG_ACCOUNT)
def _fb(slug, args):
    if args.get("page_id") in FB_BLOCKED or args.get("page_id") != FB_PAGE_ID: raise RuntimeError("blocked Facebook Page")
    return _call(slug, args, FB_ACCOUNT)

def _up(path):
    r, e = upload_local_file(path)
    if e: raise RuntimeError(f"upload failed for {path}: {e}")
    return r.get("data", r)

def _direct(url):
    import urllib.request
    try: return urllib.request.urlopen(url, timeout=20).geturl()
    except Exception: return url

def _id(d): return d.get("id") or (d.get("data") or {}).get("id")

def _publish(cid, wait):
    return _id(_ig("INSTAGRAM_POST_IG_USER_MEDIA_PUBLISH", {"ig_user_id": IG_USER_ID, "creation_id": cid, "max_wait_seconds": wait, "poll_interval_seconds": 5}))

def post_carousel(paths, caption):
    global LAST_FB
    ups = [_up(p) for p in paths]
    files = [{"name": os.path.basename(p), "mimetype": "image/jpeg", "s3key": u["s3key"]} for p, u in zip(paths, ups)]
    cid = _id(_ig("INSTAGRAM_CREATE_CAROUSEL_CONTAINER", {"ig_user_id": IG_USER_ID, "caption": caption, "child_image_files": files}))
    mid = _publish(cid, 120)
    try:
        d = _fb("FACEBOOK_CREATE_MULTI_PHOTO_POST", {"page_id": FB_PAGE_ID, "photo_urls": [_direct(u["s3_url"]) for u in ups], "message": caption})
        LAST_FB = {"ok": True, "id": d.get("post_id") or d.get("id")}
    except Exception as ex: LAST_FB = {"ok": False, "error": str(ex)[:300]}
    return mid

def post_reel(path, caption):
    global LAST_FB
    u = _up(path)
    cid = _id(_ig("INSTAGRAM_POST_IG_USER_MEDIA", {"ig_user_id": IG_USER_ID, "caption": caption, "media_type": "REELS", "share_to_feed": True,
        "video_file": {"name": os.path.basename(path), "mimetype": "video/mp4", "s3key": u["s3key"]}}))
    mid = _publish(cid, 150)
    try:
        d = _fb("FACEBOOK_PUBLISH_PAGE_REEL", {"page_id": FB_PAGE_ID, "description": caption, "video_state": "PUBLISHED",
            "video": {"name": os.path.basename(path), "mimetype": "video/mp4", "s3key": u["s3key"]}})
        LAST_FB = {"ok": True, "id": d.get("video_id") or d.get("id")}
    except Exception as ex: LAST_FB = {"ok": False, "error": str(ex)[:300]}
    return mid

def permalink(media_id):
    return _ig("INSTAGRAM_GET_IG_MEDIA", {"ig_media_id": media_id, "fields": "permalink"}).get("permalink")

def gh_put(files, message):
    """files: {repo_path: bytes_or_str}. One commit to main."""
    ups = []
    for p, c in files.items():
        if isinstance(c, bytes): ups.append({"path": p, "content": base64.b64encode(c).decode(), "encoding": "base64"})
        else: ups.append({"path": p, "content": c, "encoding": "utf-8"})
    return _call("GITHUB_COMMIT_MULTIPLE_FILES", {**GH, "branch": "main", "message": message, "upserts": ups}, GH_ACCOUNT)

def gh_get(path):
    d = _call("GITHUB_GET_REPOSITORY_CONTENT", {**GH, "path": path, "ref": "main"}, GH_ACCOUNT)
    d = d.get("content", d) if isinstance(d.get("content"), dict) else d
    return base64.b64decode("".join(str(d.get("content", "")).split()))

def read_log():
    return json.loads(gh_get(f"{REPO_DIR}/post_log.json"))

def log_post(entry):
    log = read_log(); log.append(entry)
    txt = json.dumps(log, indent=1)
    gh_put({f"{REPO_DIR}/post_log.json": txt}, f"social: log {entry.get('date')} {entry.get('type')}")
    os.makedirs(LOCAL, exist_ok=True); open(f"{LOCAL}/post_log.json", "w").write(txt)
    return log
