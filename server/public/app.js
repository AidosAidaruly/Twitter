const API = "http://localhost:4000";

const $ = (id) => document.getElementById(id);

function setMsg(id, text) {
  $(id).textContent = text || "";
}

function getToken() {
  return localStorage.getItem("token");
}
function setToken(t) {
  localStorage.setItem("token", t);
}
function clearToken() {
  localStorage.removeItem("token");
}

async function api(path, { method = "GET", body, auth = false } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (auth) {
    const t = getToken();
    if (t) headers["Authorization"] = `Bearer ${t}`;
  }

  const res = await fetch(API + path, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw { status: res.status, data };
  return data;
}

function showApp(isAuthed) {
  $("authBlock").classList.toggle("hidden", isAuthed);
  $("appBlock").classList.toggle("hidden", !isAuthed);
  $("btnLogout").classList.toggle("hidden", !isAuthed);
}

async function loadMe() {
  try {
    await api("/api/auth/me", { auth: true });
    showApp(true);
    await loadFeed();
  } catch {
    showApp(false);
  }
}

async function register() {
  setMsg("authMsg", "");
  try {
    const username = $("regUsername").value.trim();
    const email = $("regEmail").value.trim();
    const password = $("regPassword").value.trim();

    const r = await api("/api/auth/register", {
      method: "POST",
      body: { username, email, password },
    });

    setToken(r.token);
    setMsg("authMsg", "✅ Зарегистрирован и вошёл");
    await loadMe();
  } catch (e) {
    setMsg("authMsg", `❌ ${e.data?.error || "register failed"}`);
  }
}

async function login() {
  setMsg("authMsg", "");
  try {
    const email = $("logEmail").value.trim();
    const password = $("logPassword").value.trim();

    const r = await api("/api/auth/login", {
      method: "POST",
      body: { email, password },
    });

    setToken(r.token);
    setMsg("authMsg", "✅ Вход выполнен");
    await loadMe();
  } catch (e) {
    setMsg("authMsg", `❌ ${e.data?.error || "login failed"}`);
  }
}

async function loadFeed() {
  $("feed").innerHTML = "";

  const data = await api("/api/posts?page=1&limit=20", { auth: false });
  const items = data.items || data.posts || [];

  if (items.length === 0) {
    $("feed").innerHTML = `<div class="card">Пока нет постов. Создай первый 🙂</div>`;
    return;
  }

  for (const p of items) renderPost(p);
}

function getAuthorNameFromPost(p) {
  if (p?.authorId?.username) return p.authorId.username;
  if (typeof p?.authorId === "string") return p.authorId;
  return "unknown";
}

function renderPost(p) {
  const el = document.createElement("div");
  el.className = "post";

  el.innerHTML = `
    <h3>${escapeHtml(p.title || "Без заголовка")}</h3>

    <div class="meta">
      👤 ${escapeHtml(getAuthorNameFromPost(p))}
      • ❤️ ${p.likesCount ?? 0}
      • 💬 ${p.commentsCount ?? 0}
    </div>

    <div>${escapeHtml(p.content || "")}</div>
    <div class="tags">${(p.tags || []).map(t => "#" + escapeHtml(t)).join(" ")}</div>

    <div class="actions2">
      <button class="small" data-like="${p._id}">👍 Like</button>
      <button class="small" data-unlike="${p._id}">👎 Unlike</button>
      <button class="small" data-comments="${p._id}">💬 Comments</button>
    </div>
  `;

  $("feed").appendChild(el);

  el.querySelector("[data-like]").onclick = () => likePost(p._id, true);
  el.querySelector("[data-unlike]").onclick = () => likePost(p._id, false);
  el.querySelector("[data-comments]").onclick = () => openComments(p._id);
}

async function createPost() {
  setMsg("postMsg", "");
  try {
    const title = $("postTitle").value.trim();
    const content = $("postContent").value.trim();
    const tags = $("postTags").value
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    await api("/api/posts", {
      method: "POST",
      auth: true,
      body: { title, content, tags },
    });

    setMsg("postMsg", "✅ Пост создан");
    $("postTitle").value = "";
    $("postContent").value = "";
    $("postTags").value = "";

    await loadFeed();
  } catch (e) {
    setMsg("postMsg", `❌ ${e.data?.error || "create post failed"}`);
  }
}

async function likePost(postId, like) {
  try {
    const method = like ? "POST" : "DELETE";
    await api(`/api/posts/${postId}/like`, { method, auth: true });
    await loadFeed();
  } catch (e) {
    alert(e.data?.error || "like failed");
  }
}

// COMMENTS
let currentPostId = null;

async function openComments(postId) {
  currentPostId = postId;
  $("commentsPanel").classList.remove("hidden");
  await loadComments();
}

function getUserNameFromComment(c) {
  if (c?.userId?.username) return c.userId.username;
  if (typeof c?.userId === "string") return c.userId;
  return "user";
}

async function loadComments() {
  setMsg("commentMsg", "");
  $("commentsList").innerHTML = "";

  const data = await api(`/api/posts/${currentPostId}/comments?page=1&limit=20`);
  const items = data.items || [];

  if (items.length === 0) {
    $("commentsList").innerHTML = `<div class="comment">Комментариев пока нет</div>`;
    return;
  }

  for (const c of items) {
    const el = document.createElement("div");
    el.className = "comment";
    el.innerHTML = `
      <div><b>${escapeHtml(getUserNameFromComment(c))}</b></div>
      <div>${escapeHtml(c.text)}</div>
      <button class="small" data-del="${c._id}">Удалить (если мой)</button>
    `;
    el.querySelector("[data-del]").onclick = () => deleteComment(c._id);
    $("commentsList").appendChild(el);
  }
}

async function addComment() {
  setMsg("commentMsg", "");
  try {
    const text = $("commentText").value.trim();
    if (!text) return;

    await api(`/api/posts/${currentPostId}/comments`, {
      method: "POST",
      auth: true,
      body: { text },
    });

    $("commentText").value = "";
    await loadComments();
    await loadFeed();
  } catch (e) {
    setMsg("commentMsg", `❌ ${e.data?.error || "add comment failed"}`);
  }
}

async function deleteComment(commentId) {
  try {
    await api(`/api/comments/${commentId}`, { method: "DELETE", auth: true });
    await loadComments();
    await loadFeed();
  } catch (e) {
    alert(e.data?.error || "delete comment failed");
  }
}

function escapeHtml(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

// events
$("btnRegister").onclick = register;
$("btnLogin").onclick = login;
$("btnLogout").onclick = () => {
  clearToken();
  showApp(false);
};

$("btnCreatePost").onclick = createPost;
$("btnReload").onclick = loadFeed;

$("btnCloseComments").onclick = () => $("commentsPanel").classList.add("hidden");
$("btnAddComment").onclick = addComment;

loadMe();
