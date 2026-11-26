// Quill backend: Cloudflare Worker + one SQLite-backed Durable Object (free plan).
// Accounts, posts (draft/published/scheduled), comments with moderation, views, RSS, plan quotas.
import { DurableObject } from "cloudflare:workers";
const enc = new TextEncoder();
const H = { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" };
const json = (data, status = 200, extra) => new Response(JSON.stringify(data), { status, headers: { ...H, ...(extra || {}) } });
const err = (status, code, message) => json({ error: { code, message } }, status);
const b64 = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const unb64 = (s) => Uint8Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/")), (c) => c.charCodeAt(0));
const PLANS = { free: { posts: 25, label: "Free" }, pro: { posts: 500, label: "Pro" } };
const str = (v, n) => (typeof v === "string" ? v.trim().slice(0, n) : "");

async function hmac(secret, text) {
  const k = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return b64(await crypto.subtle.sign("HMAC", k, enc.encode(text)));
}
async function pbkdf2(password, salt) {
  const k = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveBits"]);
  return b64(await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt, iterations: 100000 }, k, 256));
}
const ADMIN_HASH = "3954f4c578cae100a111e4a8e3f3a02ed85d1f71944dacd76fb23b0eea2779e0"; // sha256 hex of the shared admin key (hash only, never the key)
let _sec = null;
async function sec(env) {
  if (env.TOKEN_SECRET) return env.TOKEN_SECRET;
  if (!_sec) _sec = await env.HUB.get(env.HUB.idFromName("main")).secret();
  return _sec;
}
async function makeToken(env, uid) {
  const body = b64(enc.encode(JSON.stringify({ u: uid, e: Date.now() + 14 * 864e5 })));
  return body + "." + (await hmac(await sec(env), body));
}
async function readToken(env, req) {
  const c = (req.headers.get("cookie") || "").match(/(?:^|;\s*)quill\.sid=([^;]+)/);
  const t = c ? decodeURIComponent(c[1]) : "";
  const [body, sig] = t.split(".");
  if (!body || !sig || (await hmac(await sec(env), body)) !== sig) return null;
  try { const p = JSON.parse(new TextDecoder().decode(unb64(body))); return p.e > Date.now() ? p.u : null; } catch { return null; }
}
const cookie = (t, age) => `quill.sid=${encodeURIComponent(t)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${age}`;
const readTime = (html) => Math.max(1, Math.ceil(String(html).replace(/<[^>]+>/g, " ").split(/\s+/).filter(Boolean).length / 200));

export class Hub extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env); this.sql = ctx.storage.sql; this.rl = new Map();
    if (ctx.storage.kv.get("schema_v") !== "2") {
      this.sql.exec(`CREATE TABLE IF NOT EXISTS users(id INTEGER PRIMARY KEY, handle TEXT UNIQUE NOT NULL, email TEXT UNIQUE NOT NULL, name TEXT NOT NULL, bio TEXT DEFAULT '', avatar TEXT DEFAULT '', salt TEXT NOT NULL, hash TEXT NOT NULL, plan TEXT NOT NULL DEFAULT 'free', role TEXT NOT NULL DEFAULT 'user', created INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS posts(id TEXT PRIMARY KEY, user_id INTEGER NOT NULL, title TEXT NOT NULL, content TEXT NOT NULL, tags TEXT NOT NULL DEFAULT '[]', cover TEXT, featured INTEGER DEFAULT 0, status TEXT NOT NULL DEFAULT 'draft', publish_at INTEGER, created INTEGER NOT NULL, updated INTEGER NOT NULL, views INTEGER NOT NULL DEFAULT 0, likes INTEGER NOT NULL DEFAULT 0);
CREATE INDEX IF NOT EXISTS posts_user ON posts(user_id); CREATE INDEX IF NOT EXISTS posts_pub ON posts(status, publish_at);
CREATE TABLE IF NOT EXISTS comments(id INTEGER PRIMARY KEY AUTOINCREMENT, post_id TEXT NOT NULL, name TEXT NOT NULL, body TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'pending', created INTEGER NOT NULL);
CREATE INDEX IF NOT EXISTS comments_post ON comments(post_id);
CREATE TABLE IF NOT EXISTS kv(k TEXT PRIMARY KEY, v TEXT);
CREATE TABLE IF NOT EXISTS subscribers(id INTEGER PRIMARY KEY AUTOINCREMENT, email TEXT UNIQUE NOT NULL, created INTEGER NOT NULL);`);
      ctx.storage.kv.put("schema_v", "2");
    }
  }
  secret() {
    if (this._sec) return this._sec;
    const r = this.one("SELECT v FROM kv WHERE k='sec'"); if (r) return (this._sec = r.v);
    const v = [...crypto.getRandomValues(new Uint8Array(32))].map((b) => b.toString(16).padStart(2, "0")).join("");
    this.sql.exec("INSERT INTO kv VALUES('sec', ?)", v); return (this._sec = v);
  }
  one(q, ...a) { for (const r of this.sql.exec(q, ...a)) return r; return null; }
  all(q, ...a) { return [...this.sql.exec(q, ...a)]; }
  limited(key, max, windowMs) {
    const now = Date.now(), w = (this.rl.get(key) || []).filter((t) => now - t < windowMs);
    if (w.length >= max) { this.rl.set(key, w); return true; }
    w.push(now); this.rl.set(key, w); if (this.rl.size > 5000) this.rl.clear(); return false;
  }
  pubUser(u) { return { id: u.id, handle: u.handle, name: u.name, bio: u.bio, avatar: u.avatar, plan: u.plan, role: u.role }; }
  shape(p, u) {
    const tags = JSON.parse(p.tags || "[]");
    return { id: p.id, title: p.title, content: p.content, tags, readingTime: readTime(p.content), createdAt: p.publish_at && p.status !== "draft" ? p.publish_at : p.created, updatedAt: p.updated,
      coverImage: p.cover || undefined, featured: !!p.featured, likes: p.likes, views: p.views, status: p.status, publishAt: p.publish_at || null,
      author: { name: u.name, handle: u.handle, avatar: u.avatar || `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(u.name)}`, bio: u.bio } };
  }
  async register(b, ip) {
    if (this.limited("reg:" + ip, 5, 36e5)) return { error: [429, "RATE_LIMITED", "Too many sign-ups. Try again later."] };
    const name = str(b.name, 80), handle = str(b.handle, 20).toLowerCase(), email = str(b.email, 200).toLowerCase(), pw = typeof b.password === "string" ? b.password : "";
    if (!name) return { error: [400, "INVALID", "Name is required."] };
    if (!/^[a-z0-9_-]{3,20}$/.test(handle)) return { error: [400, "INVALID", "Handle: 3-20 letters, numbers, - or _."] };
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return { error: [400, "INVALID", "A valid email is required."] };
    if (pw.length < 8 || pw.length > 200) return { error: [400, "INVALID", "Password must be at least 8 characters."] };
    if (this.one("SELECT 1 AS x FROM users WHERE email = ?", email)) return { error: [409, "EXISTS", "An account with this email already exists."] };
    if (this.one("SELECT 1 AS x FROM users WHERE handle = ?", handle)) return { error: [409, "HANDLE_TAKEN", "That handle is taken."] };
    const salt = crypto.getRandomValues(new Uint8Array(16)), id = Date.now() * 1000 + Math.floor(Math.random() * 1000);
    this.sql.exec("INSERT INTO users(id, handle, email, name, salt, hash, created) VALUES(?,?,?,?,?,?,?)", id, handle, email, name, b64(salt), await pbkdf2(pw, salt), Date.now());
    return { user: this.pubUser(this.one("SELECT * FROM users WHERE id = ?", id)) };
  }
  async login(b, ip) {
    if (this.limited("login:" + ip, 10, 6e5)) return { error: [429, "RATE_LIMITED", "Too many attempts. Wait a few minutes."] };
    const email = str(b.email, 200).toLowerCase(), pw = typeof b.password === "string" ? b.password : "";
    const u = this.one("SELECT * FROM users WHERE email = ?", email);
    if (!u || (await pbkdf2(pw, unb64(u.salt))) !== u.hash) return { error: [401, "INVALID_CREDENTIALS", "Invalid email or password."] };
    return { user: this.pubUser(u) };
  }
  me(id) { const u = this.one("SELECT * FROM users WHERE id = ?", id); if (!u) return null; const c = this.one("SELECT COUNT(*) AS n FROM posts WHERE user_id = ?", id).n; return { ...this.pubUser(u), postCount: c, postLimit: (PLANS[u.plan] || PLANS.free).posts }; }
  async changePassword(id, b, ip) {
    if (this.limited("pw:" + ip, 8, 6e5)) return { error: [429, "RATE_LIMITED", "Too many attempts. Wait a few minutes."] };
    const u = this.one("SELECT * FROM users WHERE id = ?", id), cur = typeof b.current === "string" ? b.current : "", next = typeof b.next === "string" ? b.next : "";
    if (!u || (await pbkdf2(cur, unb64(u.salt))) !== u.hash) return { error: [401, "INVALID_CREDENTIALS", "Current password is wrong."] };
    if (next.length < 8 || next.length > 200) return { error: [400, "WEAK_PASSWORD", "New password needs at least 8 characters."] };
    const salt = crypto.getRandomValues(new Uint8Array(16));
    this.sql.exec("UPDATE users SET salt = ?, hash = ? WHERE id = ?", b64(salt), await pbkdf2(next, salt), id); return { ok: true };
  }
  async deleteAccount(id, b, ip) {
    if (this.limited("del:" + ip, 5, 6e5)) return { error: [429, "RATE_LIMITED", "Too many attempts. Wait a few minutes."] };
    const u = this.one("SELECT * FROM users WHERE id = ?", id), pw = typeof b.password === "string" ? b.password : "";
    if (!u || (await pbkdf2(pw, unb64(u.salt))) !== u.hash) return { error: [401, "INVALID_CREDENTIALS", "Password is wrong."] };
    if (u.role === "admin") return { error: [403, "FORBIDDEN", "The admin account cannot be deleted here."] };
    this.sql.exec("DELETE FROM comments WHERE post_id IN (SELECT id FROM posts WHERE user_id = ?)", id);
    this.sql.exec("DELETE FROM posts WHERE user_id = ?", id); this.sql.exec("DELETE FROM users WHERE id = ?", id); return { ok: true };
  }
  updateProfile(id, b) { this.sql.exec("UPDATE users SET name = ?, bio = ?, avatar = ? WHERE id = ?", str(b.name, 80) || "Writer", str(b.bio, 300), /^https:\/\//.test(str(b.avatar, 500)) ? str(b.avatar, 500) : "", id); return this.me(id); }
  now() { return Date.now(); }
  visible() { return "(status = 'published' OR (status = 'scheduled' AND publish_at <= ?))"; }
  listPublic(q) {
    const now = Date.now(), where = [this.visible()], args = [now];
    if (q.author) { const u = this.one("SELECT id FROM users WHERE handle = ?", q.author.toLowerCase()); if (!u) return { posts: [], total: 0 }; where.push("user_id = ?"); args.push(u.id); }
    if (q.tag) { where.push("tags LIKE ?"); args.push('%"' + q.tag.replace(/[%_"]/g, "") + '"%'); }
    if (q.q) { where.push("(title LIKE ? OR content LIKE ?)"); const t = "%" + q.q.replace(/[%_]/g, "") + "%"; args.push(t, t); }
    const w = where.join(" AND "), total = this.one(`SELECT COUNT(*) AS n FROM posts WHERE ${w}`, ...args).n;
    const rows = this.all(`SELECT * FROM posts WHERE ${w} ORDER BY COALESCE(publish_at, created) DESC LIMIT ? OFFSET ?`, ...args, q.limit, q.offset);
    const users = {}; const posts = rows.map((p) => { users[p.user_id] = users[p.user_id] || this.one("SELECT * FROM users WHERE id = ?", p.user_id); return this.shape(p, users[p.user_id]); });
    return { posts, total };
  }
  getPublic(id) {
    const p = this.one(`SELECT * FROM posts WHERE id = ? AND ${this.visible()}`, id, Date.now()); if (!p) return null;
    return this.shape(p, this.one("SELECT * FROM users WHERE id = ?", p.user_id));
  }
  mine(uid) { const u = this.one("SELECT * FROM users WHERE id = ?", uid); return this.all("SELECT * FROM posts WHERE user_id = ? ORDER BY updated DESC", uid).map((p) => ({ ...this.shape(p, u), commentCount: this.one("SELECT COUNT(*) AS n FROM comments WHERE post_id = ?", p.id).n, pendingComments: this.one("SELECT COUNT(*) AS n FROM comments WHERE post_id = ? AND status = 'pending'", p.id).n })); }
  clean(b) {
    const title = str(b.title, 200), content = typeof b.content === "string" ? b.content.slice(0, 200000) : "";
    if (!title) return { error: [400, "INVALID", "Title is required."] };
    if (!content.replace(/<[^>]+>/g, "").trim()) return { error: [400, "INVALID", "Content is required."] };
    const tags = Array.isArray(b.tags) ? [...new Set(b.tags.map((t) => str(t, 30).toLowerCase()).filter(Boolean))].slice(0, 8) : [];
    let cover = typeof b.coverImage === "string" ? b.coverImage.trim() : "";
    if (cover && !/^https:\/\//.test(cover) && !(/^data:image\/(png|jpe?g|webp|gif);base64,[A-Za-z0-9+\/=]+$/.test(cover) && cover.length < 250000)) cover = "";
    let status = ["draft", "published", "scheduled"].includes(b.status) ? b.status : "published", publishAt = null;
    if (status === "scheduled") { publishAt = Number(b.publishAt); if (!publishAt || publishAt <= Date.now()) status = "published", publishAt = null; }
    if (status === "published") publishAt = Date.now();
    return { v: { title, content, tags: JSON.stringify(tags), cover: cover || null, featured: b.featured ? 1 : 0, status, publishAt } };
  }
  createPost(uid, b) {
    const u = this.one("SELECT * FROM users WHERE id = ?", uid), lim = (PLANS[u.plan] || PLANS.free).posts;
    if (this.one("SELECT COUNT(*) AS n FROM posts WHERE user_id = ?", uid).n >= lim) return { error: [402, "PLAN_LIMIT", `The ${PLANS[u.plan].label} plan allows ${lim} posts.`] };
    const c = this.clean(b); if (c.error) return c; const v = c.v, id = crypto.randomUUID(), now = Date.now();
    this.sql.exec("INSERT INTO posts(id, user_id, title, content, tags, cover, featured, status, publish_at, created, updated) VALUES(?,?,?,?,?,?,?,?,?,?,?)", id, uid, v.title, v.content, v.tags, v.cover, v.featured, v.status, v.publishAt, now, now);
    return { post: this.shape(this.one("SELECT * FROM posts WHERE id = ?", id), u) };
  }
  updatePost(uid, id, b) {
    const p = this.one("SELECT * FROM posts WHERE id = ? AND user_id = ?", id, uid); if (!p) return { error: [404, "NOT_FOUND", "Post not found."] };
    const c = this.clean(b); if (c.error) return c; const v = c.v;
    this.sql.exec("UPDATE posts SET title=?, content=?, tags=?, cover=?, featured=?, status=?, publish_at=?, updated=? WHERE id=?", v.title, v.content, v.tags, v.cover, v.featured, v.status, v.publishAt, Date.now(), id);
    return { post: this.shape(this.one("SELECT * FROM posts WHERE id = ?", id), this.one("SELECT * FROM users WHERE id = ?", uid)) };
  }
  deletePost(uid, id) { const p = this.one("SELECT 1 AS x FROM posts WHERE id = ? AND user_id = ?", id, uid); if (!p) return false; this.sql.exec("DELETE FROM comments WHERE post_id = ?", id); this.sql.exec("DELETE FROM posts WHERE id = ?", id); return true; }
  view(id) { this.sql.exec(`UPDATE posts SET views = views + 1 WHERE id = ? AND ${this.visible()}`, id, Date.now()); }
  like(id, ip) { if (this.limited("like:" + ip + id, 1, 864e5)) return null; this.sql.exec(`UPDATE posts SET likes = likes + 1 WHERE id = ? AND ${this.visible()}`, id, Date.now()); const r = this.one("SELECT likes FROM posts WHERE id = ?", id); return r ? r.likes : null; }
  comments(id) { return this.all("SELECT id, name, body, created FROM comments WHERE post_id = ? AND status = 'approved' ORDER BY id ASC LIMIT 200", id); }
  subscribe(b, ip) {
    if (b.website) return { ok: true };
    if (this.limited("sub:" + ip, 5, 36e5)) return { error: [429, "RATE_LIMITED", "Too many attempts. Try again later."] };
    const email = String(b.email || "").trim().toLowerCase();
    if (!/^[A-Za-z0-9][A-Za-z0-9._%+'-]*@(?:[A-Za-z0-9-]+\.)+[A-Za-z]{2,}$/.test(email) || email.length > 120) return { error: [400, "BAD_EMAIL", "Please enter a valid email address."] };
    const had = this.one("SELECT 1 AS x FROM subscribers WHERE email = ?", email);
    if (!had) this.sql.exec("INSERT INTO subscribers(email, created) VALUES(?,?)", email, Date.now());
    return { ok: true, already: !!had };
  }
  claimLimited(ip) { return this.limited("adm:" + ip, 5, 36e5); }
  setAdmin(uid) { this.sql.exec("UPDATE users SET role='admin' WHERE id = ?", uid); return true; }
  delSub(email) { this.sql.exec("DELETE FROM subscribers WHERE email = ?", String(email||"").slice(0,200)); return true; }
  subs() { return this.all("SELECT email, created FROM subscribers ORDER BY id DESC LIMIT 5000"); }
  addComment(id, b, ip) {
    if (this.limited("cm:" + ip, 5, 36e5)) return { error: [429, "RATE_LIMITED", "Too many comments. Try again later."] };
    if (str(b.website, 50)) return { ok: true }; // honeypot
    const p = this.one(`SELECT id FROM posts WHERE id = ? AND ${this.visible()}`, id, Date.now()); if (!p) return { error: [404, "NOT_FOUND", "Post not found."] };
    const name = str(b.name, 60), body = str(b.body, 1500); if (!name || body.length < 2) return { error: [400, "INVALID", "Name and comment are required."] };
    this.sql.exec("INSERT INTO comments(post_id, name, body, created) VALUES(?,?,?,?)", id, name, body, Date.now()); return { ok: true, pending: true };
  }
  inbox(uid) { return this.all("SELECT c.id, c.post_id, c.name, c.body, c.status, c.created, p.title FROM comments c JOIN posts p ON p.id = c.post_id WHERE p.user_id = ? ORDER BY c.id DESC LIMIT 100", uid); }
  moderate(uid, cid, action) {
    const c = this.one("SELECT c.id FROM comments c JOIN posts p ON p.id = c.post_id WHERE c.id = ? AND p.user_id = ?", cid, uid); if (!c) return false;
    if (action === "approve") this.sql.exec("UPDATE comments SET status='approved' WHERE id = ?", cid); else this.sql.exec("DELETE FROM comments WHERE id = ?", cid); return true;
  }
  stats(uid) {
    const t = this.one("SELECT COUNT(*) AS posts, COALESCE(SUM(views),0) AS views, COALESCE(SUM(likes),0) AS likes FROM posts WHERE user_id = ?", uid);
    const top = this.all("SELECT id, title, views, likes FROM posts WHERE user_id = ? ORDER BY views DESC LIMIT 5", uid);
    return { ...t, top, drafts: this.one("SELECT COUNT(*) AS n FROM posts WHERE user_id = ? AND status = 'draft'", uid).n, pending: this.one("SELECT COUNT(*) AS n FROM comments c JOIN posts p ON p.id = c.post_id WHERE p.user_id = ? AND c.status = 'pending'", uid).n };
  }
  rss(handle) {
    const u = this.one("SELECT * FROM users WHERE handle = ?", handle.toLowerCase()); if (!u) return null;
    return { user: u, posts: this.all(`SELECT * FROM posts WHERE user_id = ? AND ${this.visible()} ORDER BY COALESCE(publish_at, created) DESC LIMIT 30`, u.id, Date.now()) };
  }
  tags() { const m = {}; for (const r of this.all(`SELECT tags FROM posts WHERE ${this.visible()}`, Date.now())) for (const t of JSON.parse(r.tags)) m[t] = (m[t] || 0) + 1; return Object.entries(m).sort((a, b) => b[1] - a[1]).slice(0, 30).map(([tag, count]) => ({ tag, count })); }
}

const hub = (env) => env.HUB.get(env.HUB.idFromName("main"));
const readJson = async (req) => { try { return await req.json(); } catch { return {}; } };
const xml = (s) => String(s).replace(/[<>&'"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" }[c]));

async function handle(req, env, url) {
  const p = url.pathname.replace(/\/+$/, ""), m = req.method, h = hub(env), ip = req.headers.get("CF-Connecting-IP") || "?";
  if (m !== "GET" && m !== "HEAD") { const o = req.headers.get("origin"); if (o && new URL(o).host !== url.host) return err(403, "FORBIDDEN", "Cross-origin request blocked."); }
  if (p === "/api/health") return json({ ok: true, runtime: "cloudflare-workers", store: "durable-object-sqlite" });
  if (p === "/api/auth/register" && m === "POST") {
    const r = await h.register(await readJson(req), ip); if (r.error) return err(...r.error);
    const t = await makeToken(env, r.user.id); return json({ user: r.user }, 201, { "set-cookie": cookie(t, 1209600) });
  }
  if (p === "/api/auth/login" && m === "POST") {
    const r = await h.login(await readJson(req), ip); if (r.error) return err(...r.error);
    const t = await makeToken(env, r.user.id); return json({ user: r.user }, 200, { "set-cookie": cookie(t, 1209600) });
  }
  if (p === "/api/auth/logout" && m === "POST") return json({ ok: true }, 200, { "set-cookie": cookie("", 0) });
  // public
  if (p === "/api/public/posts" && m === "GET") {
    const q = url.searchParams; return json(await h.listPublic({ author: q.get("author") || "", tag: q.get("tag") || "", q: q.get("q") || "", limit: Math.min(50, Math.max(1, +q.get("limit") || 30)), offset: Math.max(0, +q.get("offset") || 0) }));
  }
  if (p === "/api/public/tags") return json({ tags: await h.tags() });
  let mt = p.match(/^\/api\/public\/posts\/([\w-]+)(\/(view|like|comments))?$/);
  if (mt) {
    if (!mt[2] && m === "GET") { const post = await h.getPublic(mt[1]); return post ? json({ post }) : err(404, "NOT_FOUND", "Post not found."); }
    if (mt[3] === "view" && m === "POST") { await h.view(mt[1]); return json({ ok: true }); }
    if (mt[3] === "like" && m === "POST") { const n = await h.like(mt[1], ip); return json({ likes: n }); }
    if (mt[3] === "comments" && m === "GET") return json({ comments: await h.comments(mt[1]) });
    if (mt[3] === "comments" && m === "POST") { const r = await h.addComment(mt[1], await readJson(req), ip); return r.error ? err(...r.error) : json(r, 201); }
  }
  mt = p.match(/^\/api\/rss\/([a-z0-9_-]{3,20})$/);
  if (mt) {
    const r = await h.rss(mt[1]); if (!r) return err(404, "NOT_FOUND", "Blog not found.");
    const base = url.origin, items = r.posts.map((x) => `<item><title>${xml(x.title)}</title><link>${base}/post/${x.id}</link><guid>${base}/post/${x.id}</guid><pubDate>${new Date(x.publish_at || x.created).toUTCString()}</pubDate><description>${xml(x.content.replace(/<[^>]+>/g, " ").slice(0, 300))}</description></item>`).join("");
    return new Response(`<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>${xml(r.user.name)} on Quill</title><link>${base}/@${r.user.handle}</link><description>${xml(r.user.bio || "Posts on Quill")}</description>${items}</channel></rss>`, { headers: { "content-type": "application/rss+xml; charset=utf-8" } });
  }
  if (p === "/api/public/subscribe" && m === "POST") { const r = await h.subscribe(await readJson(req), ip); return r.error ? err(...r.error) : json(r, 201); }
  // authenticated
  const uid = await readToken(env, req);
  if (p === "/api/admin/claim" && m === "POST") {
    if (!uid) return err(401, "UNAUTHORIZED", "Sign in first.");
    if (!ADMIN_HASH) return err(503, "NOT_CONFIGURED", "Admin access is not configured.");
    if (await h.claimLimited(ip)) return err(429, "RATE_LIMITED", "Too many attempts. Try again later.");
    const b = await readJson(req);
    const dig = [...new Uint8Array(await crypto.subtle.digest("SHA-256", enc.encode(String(b.key || ""))))].map((x) => x.toString(16).padStart(2, "0")).join("");
    if (dig !== ADMIN_HASH) return err(403, "FORBIDDEN", "That key is not valid.");
    await h.setAdmin(uid); return json({ ok: true });
  }
  if (p === "/api/admin/subscribers" && m === "DELETE") {
    const u = uid ? await h.me(uid) : null;
    if (!u || u.role !== "admin") return err(403, "FORBIDDEN", "Admin only.");
    const em = url.searchParams.get("email"); if (!em) return err(400, "BAD_REQUEST", "email required.");
    await h.delSub(em); return json({ ok: true });
  }
  if (p === "/api/admin/subscribers" && m === "GET") {
    const u = uid ? await h.me(uid) : null;
    if (!u || u.role !== "admin") return err(403, "FORBIDDEN", "Admin only.");
    const rows = await h.subs();
    if (url.searchParams.get("format") === "csv") return new Response("email,subscribed_at\n" + rows.map((r) => '"' + String(r.email).replace(/"/g, '""') + '",' + new Date(r.created).toISOString()).join("\n"), { headers: { "content-type": "text/csv" } });
    return json({ count: rows.length, subscribers: rows });
  }
  if (p === "/api/auth/me") { const u = uid ? await h.me(uid) : null; return u ? json({ user: u }) : err(401, "UNAUTHORIZED", "Not signed in."); }
  if (!uid || !(await h.me(uid))) return err(401, "UNAUTHORIZED", "Please sign in.");
  if (p === "/api/account/password" && m === "POST") { const r = await h.changePassword(uid, await readJson(req), ip); return r.error ? err(...r.error) : json(r); }
  if (p === "/api/account" && m === "DELETE") { const r = await h.deleteAccount(uid, await readJson(req), ip); return r.error ? err(...r.error) : json(r, 200, { "set-cookie": cookie("", 0) }); }
  if (p === "/api/account" && m === "PATCH") return json({ user: await h.updateProfile(uid, await readJson(req)) });
  if (p === "/api/posts" && m === "GET") return json({ posts: await h.mine(uid) });
  if (p === "/api/posts" && m === "POST") { const r = await h.createPost(uid, await readJson(req)); return r.error ? err(...r.error) : json(r, 201); }
  mt = p.match(/^\/api\/posts\/([\w-]+)$/);
  if (mt && m === "PUT") { const r = await h.updatePost(uid, mt[1], await readJson(req)); return r.error ? err(...r.error) : json(r); }
  if (mt && m === "DELETE") return (await h.deletePost(uid, mt[1])) ? json({ ok: true }) : err(404, "NOT_FOUND", "Post not found.");
  if (p === "/api/comments" && m === "GET") return json({ comments: await h.inbox(uid) });
  mt = p.match(/^\/api\/comments\/(\d+)\/(approve|delete)$/);
  if (mt && m === "POST") return (await h.moderate(uid, +mt[1], mt[2])) ? json({ ok: true }) : err(404, "NOT_FOUND", "Comment not found.");
  if (p === "/api/stats") return json(await h.stats(uid));
  return err(404, "NOT_FOUND", "Route not found.");
}

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    if (!url.pathname.startsWith("/api/")) return env.ASSETS.fetch(req);
    try { return await handle(req, env, url); } catch (e) { return err(500, "INTERNAL", "Something went wrong."); }
  },
};
