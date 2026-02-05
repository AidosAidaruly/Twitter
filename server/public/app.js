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

/* =========================
   ✅ Tabs / Views
========================= */
function setActiveTab(tab) {
  $("tabFeed").classList.toggle("active", tab === "feed");
  $("tabMyPosts").classList.toggle("active", tab === "my");
  $("tabDrafts").classList.toggle("active", tab === "drafts");
  $("tabProfile").classList.toggle("active", tab === "profile");
  $("tabExplore").classList.toggle("active", tab === "explore"); // ✅ NEW
}

function showView(view) {
  $("viewFeed").classList.toggle("hidden", view !== "feed");
  $("viewMyPosts").classList.toggle("hidden", view !== "my");
  $("viewDrafts").classList.toggle("hidden", view !== "drafts");
  $("viewProfile").classList.toggle("hidden", view !== "profile");
  $("viewExplore").classList.toggle("hidden", view !== "explore"); // ✅ NEW
  setActiveTab(view);
}

/* =========================
   ✅ Auth UI
========================= */
function showApp(isAuthed) {
  $("authBlock").classList.toggle("hidden", isAuthed);
  $("appBlock").classList.toggle("hidden", !isAuthed);
  $("btnLogout").classList.toggle("hidden", !isAuthed);

  // показываем вкладки только после логина
  $("tabs").classList.toggle("hidden", !isAuthed);

  if (isAuthed) {
    showView("feed"); // по умолчанию
  }
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

/* =========================
   ✅ Feed
========================= */
async function loadFeed() {
  $("feed").innerHTML = "";

  const data = await api("/api/posts?page=1&limit=20", { auth: false });
  const items = data.items || data.posts || [];

  if (items.length === 0) {
    $("feed").innerHTML = `<div class="card">Пока нет постов. Создай первый 🙂</div>`;
    return;
  }

  for (const p of items) renderPost(p, { containerId: "feed", mode: "feed" });
}

function getAuthorNameFromPost(p) {
  if (p?.authorId?.username) return p.authorId.username;
  if (typeof p?.authorId === "string") return p.authorId;
  return "unknown";
}

function renderPost(p, { containerId, mode }) {
  const el = document.createElement("div");
  el.className = "post";

  const statusBadge =
    mode === "my"
      ? `<span class="badge">${escapeHtml(p.status || "published")}</span>`
      : "";

  el.innerHTML = `
    <h3>${escapeHtml(p.title || "Без заголовка")} ${statusBadge}</h3>

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

  $(containerId).appendChild(el);

  el.querySelector("[data-like]").onclick = () => likePost(p._id, true);
  el.querySelector("[data-unlike]").onclick = () => likePost(p._id, false);
  el.querySelector("[data-comments]").onclick = () => openComments(p._id);
}

/* =========================
   ✅ Create Post + Draft
========================= */
async function sendPost(status) {
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
      body: { title, content, tags, status },
    });

    setMsg("postMsg", status === "draft" ? "✅ Сохранено в Drafts" : "✅ Пост опубликован");

    $("postTitle").value = "";
    $("postContent").value = "";
    $("postTags").value = "";

    if (!$("viewDrafts").classList.contains("hidden")) await loadDrafts();
    if (!$("viewMyPosts").classList.contains("hidden")) await loadMyPosts();
    await loadFeed();
  } catch (e) {
    setMsg("postMsg", `❌ ${e.data?.error || "create post failed"}`);
  }
}

async function createPost() {
  return sendPost("published");
}

async function saveDraft() {
  return sendPost("draft");
}

async function likePost(postId, like) {
  try {
    const method = like ? "POST" : "DELETE";
    await api(`/api/posts/${postId}/like`, { method, auth: true });

    if (!$("viewDrafts").classList.contains("hidden")) {
      await loadDrafts();
    } else if (!$("viewMyPosts").classList.contains("hidden")) {
      await loadMyPosts();
    } else if (!$("viewExplore").classList.contains("hidden")) {
      await loadExplore();
    } else {
      await loadFeed();
    }
  } catch (e) {
    alert(e.data?.error || "like failed");
  }
}

/* =========================
   ✅ My Posts
========================= */
async function loadMyPosts() {
  $("myPosts").innerHTML = "";

  const data = await api("/api/posts/mine?page=1&limit=20", { auth: true });
  const items = data.items || [];

  if (items.length === 0) {
    $("myPosts").innerHTML = `<div class="card">У тебя пока нет постов 🙂</div>`;
    return;
  }

  for (const p of items) renderPost(p, { containerId: "myPosts", mode: "my" });
}

/* =========================
   ✅ Drafts
========================= */
async function loadDrafts() {
  $("drafts").innerHTML = "";

  const data = await api("/api/posts/drafts?page=1&limit=50", { auth: true });
  const items = data.items || [];

  if (items.length === 0) {
    $("drafts").innerHTML = `<div class="card">Черновиков пока нет 🙂</div>`;
    return;
  }

  for (const p of items) renderDraft(p);
}

function renderDraft(p) {
  const el = document.createElement("div");
  el.className = "post";

  el.innerHTML = `
    <h3>${escapeHtml(p.title || "Без заголовка")} <span class="badge">draft</span></h3>

    <div class="meta">
      👤 ${escapeHtml(getAuthorNameFromPost(p))}
      • ❤️ ${p.likesCount ?? 0}
      • 💬 ${p.commentsCount ?? 0}
    </div>

    <div>${escapeHtml(p.content || "")}</div>
    <div class="tags">${(p.tags || []).map(t => "#" + escapeHtml(t)).join(" ")}</div>

    <div class="actions2">
      <button class="small" data-publish="${p._id}">🚀 Publish</button>
      <button class="small" data-del="${p._id}">🗑 Delete</button>
    </div>
  `;

  $("drafts").appendChild(el);

  el.querySelector("[data-publish]").onclick = () => publishDraft(p._id);
  el.querySelector("[data-del]").onclick = () => deleteDraft(p._id);
}

async function publishDraft(postId) {
  try {
    await api(`/api/posts/${postId}`, {
      method: "PATCH",
      auth: true,
      body: { status: "published" },
    });

    await loadDrafts();
    await loadFeed();
    if (!$("viewMyPosts").classList.contains("hidden")) await loadMyPosts();
  } catch (e) {
    alert(e.data?.error || "publish failed");
  }
}

async function deleteDraft(postId) {
  try {
    await api(`/api/posts/${postId}`, { method: "DELETE", auth: true });
    await loadDrafts();
    if (!$("viewMyPosts").classList.contains("hidden")) await loadMyPosts();
  } catch (e) {
    alert(e.data?.error || "delete failed");
  }
}

/* =========================
   ✅ Profile
========================= */
async function loadProfile() {
  setMsg("profileMsg", "");
  try {
    const data = await api("/api/auth/me", { auth: true });
    const u = data.user || data;

    $("profileUsername").textContent = u.username || "";
    $("profileEmail").textContent = u.email || "";

    $("profileBio").value = u.bio || "";
    $("profileAvatarUrl").value = u.avatarUrl || "";

    const url =
      u.avatarUrl && String(u.avatarUrl).trim()
        ? u.avatarUrl
        : "https://via.placeholder.com/150";
    $("profileAvatar").src = url;
  } catch (e) {
    setMsg("profileMsg", `❌ ${e.data?.error || "load profile failed"}`);
  }
}

async function saveProfile() {
  setMsg("profileMsg", "");
  try {
    const bio = $("profileBio").value;
    const avatarUrl = $("profileAvatarUrl").value.trim();

    const r = await api("/api/auth/me", {
      method: "PATCH",
      auth: true,
      body: { bio, avatarUrl },
    });

    const u = r.user || r;
    $("profileAvatar").src =
      u.avatarUrl && String(u.avatarUrl).trim()
        ? u.avatarUrl
        : "https://via.placeholder.com/150";

    setMsg("profileMsg", "✅ Профиль обновлён");
  } catch (e) {
    setMsg("profileMsg", `❌ ${e.data?.error || "save profile failed"}`);
  }
}

/* =========================
   ✅ Explore / Trending (NEW)
========================= */
async function loadExplore() {
  setMsg("exploreMsg", "");
  $("exploreFeed").innerHTML = "";

  try {
    const days = $("exploreDays").value || "7";
    const tag = ($("exploreTag").value || "").trim();
    const search = ($("exploreSearch").value || "").trim();

    const qs = new URLSearchParams({ days, limit: "20" });
    if (tag) qs.set("tag", tag.toLowerCase());
    if (search) qs.set("search", search);

    const data = await api(`/api/posts/trending?${qs.toString()}`, { auth: false });
    const items = data.items || [];

    if (!items.length) {
      $("exploreFeed").innerHTML = `<div class="card">Ничего не найдено 😶</div>`;
      return;
    }

    for (const p of items) renderPost(p, { containerId: "exploreFeed", mode: "feed" });
  } catch (e) {
    setMsg("exploreMsg", `❌ ${e.data?.error || "explore failed"}`);
  }
}

/* =========================
   ✅ Comments
========================= */
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

    if (!$("viewDrafts").classList.contains("hidden")) {
      await loadDrafts();
    } else if (!$("viewMyPosts").classList.contains("hidden")) {
      await loadMyPosts();
    } else if (!$("viewExplore").classList.contains("hidden")) {
      await loadExplore();
    } else {
      await loadFeed();
    }
  } catch (e) {
    setMsg("commentMsg", `❌ ${e.data?.error || "add comment failed"}`);
  }
}

async function deleteComment(commentId) {
  try {
    await api(`/api/comments/${commentId}`, { method: "DELETE", auth: true });
    await loadComments();

    if (!$("viewDrafts").classList.contains("hidden")) {
      await loadDrafts();
    } else if (!$("viewMyPosts").classList.contains("hidden")) {
      await loadMyPosts();
    } else if (!$("viewExplore").classList.contains("hidden")) {
      await loadExplore();
    } else {
      await loadFeed();
    }
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

/* =========================
   ✅ events
========================= */
$("btnRegister").onclick = register;
$("btnLogin").onclick = login;

$("btnLogout").onclick = () => {
  clearToken();
  showApp(false);
};

$("btnCreatePost").onclick = createPost;
$("btnSaveDraft").onclick = saveDraft;

$("btnReload").onclick = loadFeed;

// вкладки
$("tabFeed").onclick = async () => {
  showView("feed");
  await loadFeed();
};
$("tabMyPosts").onclick = async () => {
  showView("my");
  await loadMyPosts();
};
$("tabDrafts").onclick = async () => {
  showView("drafts");
  await loadDrafts();
};
$("tabProfile").onclick = async () => {
  showView("profile");
  await loadProfile();
};
$("tabExplore").onclick = async () => {
  showView("explore");
  await loadExplore();
};

// кнопки обновить
$("btnReloadMyPosts").onclick = loadMyPosts;
$("btnReloadDrafts").onclick = loadDrafts;
$("btnReloadProfile").onclick = loadProfile;

// profile save
$("btnSaveProfile").onclick = saveProfile;

// explore controls
$("btnReloadExplore").onclick = loadExplore;
$("btnExploreSearch").onclick = loadExplore;
$("exploreSearch").addEventListener("keydown", (e) => {
  if (e.key === "Enter") loadExplore();
});

$("btnCloseComments").onclick = () => $("commentsPanel").classList.add("hidden");
$("btnAddComment").onclick = addComment;

loadMe();
