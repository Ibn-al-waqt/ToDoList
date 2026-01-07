// ==========================
//  SCRIPT.JS - FULL VERSION
// ==========================

// Base URL for backend API (deployed on Render)
const API_BASE = "https://todolist-1-p5d8.onrender.com";

// -------------------------
//  Element references
// -------------------------
const btnTag = document.getElementById("tagButton");
const userTagInput = document.getElementById("tagField");
const tempTags = document.getElementById("tempTags");
const noteGrid = document.querySelector(".note-grid");

const txtArea = document.getElementById("msg");
const taskBtn = document.getElementById("nameButton");
const taskInput = document.getElementById("nameField");
const fullTags = document.getElementById('fullTags');

const loginPopup = document.getElementById("loginPopup");
const closeLogin = document.getElementById("closeLogin");
const loginSubmit = document.getElementById("loginSubmit");

const userArea = document.getElementById("userArea");
const userIcon = document.getElementById("userIcon");
const userPopup = document.getElementById("userPopup");
const userEmailDiv = document.getElementById("userEmail");

const logoutBtn = document.getElementById("logoutBtn");
const showLoginBtn = document.getElementById("showLogin");
const showRegisterBtn = document.getElementById("showRegister");
const loginForm = document.getElementById("loginForm");

const registerForm = document.getElementById("registerForm");
const registerSubmit = document.getElementById("registerSubmit");

const noteCreationSection = document.getElementById("noteCreationSection");
const allTagsSection = document.getElementById("allTagsSection");
const noteDateInput = document.getElementById("noteDate");

// -------------------------
//  State variables
// -------------------------
const activeFilterTags = new Set();
let currentSearchQuery = '';
let notesState = [];

let editingNoteId = null;
let editingNoteCard = null;

const TAG_FILTER_KEY = 'todo_active_filters_v1';
let isAuthenticated = false;
let isLoggedIn = false;
let guestNotes = [];

// -------------------------
//  AUTH FUNCTIONS
// -------------------------
async function checkAuthAndUpdateUI() {
  try {
    const res = await fetch(`${API_BASE}/api/auth/me`, { credentials: "include" });
    if (!res.ok) throw new Error();
    const user = await res.json();
    setLoggedInUI(user);
    await fetchTodos();
  } catch {
    setLoggedOutUI();
  }
}

function setLoggedInUI(user) {
  userIcon.classList.add("hidden");
  userEmailDiv.classList.remove("hidden");
  userEmailDiv.textContent = user.email;
  if (noteCreationSection) noteCreationSection.classList.remove("hidden");
  if (allTagsSection) allTagsSection.classList.remove("hidden");
}

function setLoggedOutUI() {
  userIcon.classList.remove("hidden");
  userEmailDiv.classList.add("hidden");
  userEmailDiv.textContent = "";
  userPopup.classList.add("hidden");
  if (noteCreationSection) noteCreationSection.classList.add("hidden");
  if (allTagsSection) allTagsSection.classList.add("hidden");
}

function showLoginForm() {
  loginForm.classList.remove("hidden");
  registerForm.classList.add("hidden");
}

function showRegisterForm() {
  registerForm.classList.remove("hidden");
  loginForm.classList.add("hidden");
}

showLoginBtn.addEventListener("click", showLoginForm);
showRegisterBtn.addEventListener("click", showRegisterForm);

registerSubmit.addEventListener("click", async () => {
  const email = document.getElementById("registerEmail").value;
  const password = document.getElementById("registerPassword").value;

  const res = await fetch(`${API_BASE}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  });

  if (!res.ok) {
    alert("Registration failed");
    return;
  }

  const loginRes = await fetch(`${API_BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
    credentials: "include"
  });

  if (!loginRes.ok) {
    alert("Registered, but login failed");
    return;
  }

  const user = await loginRes.json();
  loginPopup.classList.add("hidden");
  setLoggedInUI(user);
  await fetchTodos();
});

if (loginSubmit) {
  loginSubmit.addEventListener("click", async () => {
    const email = document.getElementById("loginEmail").value;
    const password = document.getElementById("loginPassword").value;

    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    if (res.ok) {
      const user = await res.json();
      loginPopup.classList.add("hidden");
      setLoggedInUI(user);
      await fetchTodos();
    } else {
      alert("Login failed");
    }
  });
}

logoutBtn.addEventListener("click", async () => {
  await fetch(`${API_BASE}/api/auth/logout`, {
    method: "POST",
    credentials: "include"
  });
  window.location.reload();
});

// -------------------------
//  TODO CRUD FUNCTIONS
// -------------------------
async function fetchTodos() {
  const res = await fetch(`${API_BASE}/api/todos`, { credentials: "include" });
  if (res.status === 401) {
    notesState = [];
    renderNotesFromState();
    return;
  }
  const data = await res.json();
  notesState = Array.isArray(data) ? data : [];
  renderNotesFromState();
}

async function createTodo(todo) {
  await fetch(`${API_BASE}/api/todos`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(todo)
  });
  fetchTodos();
}

async function updateTodo(id, data) {
  await fetch(`${API_BASE}/api/todos/${id}`, {
    method: "PUT",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  exitEditMode();
  fetchTodos();
}

async function deleteTodo(id) {
  await fetch(`${API_BASE}/api/todos/${id}`, { method: "DELETE", credentials: "include" });
  fetchTodos();
}

function clearUserState() {
  notesState = [];
  if (noteGrid) noteGrid.innerHTML = "";
}

// -------------------------
//  HELPER FUNCTIONS
// -------------------------
function escapeHtml(str) {
  if (!str) return "";
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

function nl2br(str) {
  if (!str) return "";
  return str.replace(/\n/g, "<br>");
}

function getTagTextFromElem(el) {
  if (!el) return '';
  if (el.dataset && el.dataset.tag) return el.dataset.tag;
  if (el.firstChild && el.firstChild.textContent) return el.firstChild.textContent.trim();
  return (el.textContent || '').trim();
}

function createRemoveButtonFor(tagEl) {
  const b = document.createElement('button');
  b.textContent = '✖';
  b.classList.add('remove-tag');
  b.addEventListener('click', () => removeTagAndFull(tagEl));
  return b;
}

// -------------------------
//  TAG FUNCTIONS
// -------------------------
function removeTagAndFull(tagEl) {
  const text = getTagTextFromElem(tagEl);
  if (tagEl && tagEl.remove) tagEl.remove();
  updateFullTagCount(text);
}

function updateFullTagCount(text) {
  if (!fullTags) return;
  const remainingNoteTags = Array.from(document.querySelectorAll('.note .note-tags span')).filter(s => s.dataset && s.dataset.tag === text);
  const count = remainingNoteTags.length;
  const existing = Array.from(fullTags.children).find(s => s.dataset && s.dataset.tag === text);

  if (count === 0) {
    if (existing) existing.remove();
    return;
  }

  if (!existing) {
    const spanFull = document.createElement('span');
    spanFull.dataset.tag = text;
    const textSpan = document.createElement('span');
    textSpan.className = 'tag-text';
    textSpan.textContent = text;
    const countSpan = document.createElement('span');
    countSpan.className = 'tag-count';
    countSpan.textContent = `(${count})`;
    spanFull.appendChild(textSpan);
    spanFull.appendChild(countSpan);
    fullTags.appendChild(spanFull);
    ensureFullTagClickable(spanFull);
  } else {
    let countSpan = existing.querySelector('.tag-count');
    if (!countSpan) {
      countSpan = document.createElement('span');
      countSpan.className = 'tag-count';
      existing.appendChild(countSpan);
    }
    countSpan.textContent = `(${count})`;
  }

  if (fullTags) {
    if (fullTags.scrollWidth > fullTags.clientWidth + 1) fullTags.classList.add('show-scroll'); 
    else fullTags.classList.remove('show-scroll');
  }
}

function selectTagSpan(span) {
  if (!span || !span.dataset) return;
  const tag = span.dataset.tag;
  if (!tag) return;
  activeFilterTags.add(tag);
  span.classList.add('active-filter');
  try { fullTags.prepend(span); } catch (e) {}
  updateNotesVisibility();
  saveFilters();
}

function deselectTagSpan(span) {
  if (!span || !span.dataset) return;
  const tag = span.dataset.tag;
  if (!tag) return;
  activeFilterTags.delete(tag);
  span.classList.remove('active-filter');
  updateNotesVisibility();
  saveFilters();
}

function toggleFilterForSpan(span) {
  if (!span || !span.dataset) return;
  const tag = span.dataset.tag;
  if (!tag) return;
  if (activeFilterTags.has(tag)) deselectTagSpan(span);
  else selectTagSpan(span);
  saveFilters();
}

function ensureFullTagClickable(span) {
  if (!span || span._clickable) return;
  span.style.cursor = 'pointer';
  span.tabIndex = 0;
  span.addEventListener('click', () => toggleFilterForSpan(span));
  span.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggleFilterForSpan(span);
    }
  });
  span._clickable = true;
}

function saveFilters() {
  try {
    localStorage.setItem(TAG_FILTER_KEY, JSON.stringify(Array.from(activeFilterTags)));
  } catch {}
}

function loadFilters() {
  try {
    const raw = localStorage.getItem(TAG_FILTER_KEY);
    if (!raw) return;
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return;
    arr.forEach(t => activeFilterTags.add(t));
  } catch {}
}

// -------------------------
//  NOTES RENDERING
// -------------------------
function createNoteCardFromData(noteObj) {
  const body = noteObj.content ?? noteObj.body ?? noteObj.description ?? "";
  const card = document.createElement("div");
  card.className = "note";
  card.dataset.id = noteObj.id;

  card.innerHTML = `
    <div class="note-card">
      <div class="note-front">
        <div class="note-header">
          <span class="note-title">${escapeHtml(noteObj.title)}</span>
          <div class="note-header-actions">
            <button class="edit-note">✎</button>
            <button class="remove-note">✖</button>
          </div>
        </div>
        <div class="note-excerpt"><p>${nl2br(body.slice(0,220))}</p></div>
        <div class="note-tags"></div>
        <div class="note-footer">
          ${noteObj.due_date ? `Due date: ${noteObj.due_date}` : "&nbsp;"}
        </div>
      </div>
      <div class="note-back">
        <div class="note-body"><p>${nl2br(body)}</p></div>
        <div class="note-actions"><button class="show-less">Close</button></div>
      </div>
    </div>
  `;

  if (noteGrid) noteGrid.append(card);

  const noteTagContainer = card.querySelector(".note-tags");
  noteObj.tags.forEach(text => {
    if (!text) return;
    const span = document.createElement('span');
    span.dataset.tag = text;
    span.appendChild(document.createTextNode(text));
    noteTagContainer.appendChild(span);
    updateFullTagCount(text);
  });

  const editBtn = card.querySelector('.edit-note');
  if (editBtn) editBtn.addEventListener('click', () => enterEditMode(noteObj, card));

  const removeBtn = card.querySelector('.remove-note');
  if (removeBtn) removeBtn.addEventListener('click', () => {
    Array.from(card.querySelectorAll('.note-tags span')).forEach(t => removeTagAndFull(t));
    deleteTodo(card.dataset.id);
  });

  const readMoreBtn = card.querySelector('.read-more');
  const showLessBtn = card.querySelector('.show-less');
  if (readMoreBtn) readMoreBtn.addEventListener('click', () => card.classList.add('flipped'));
  if (showLessBtn) showLessBtn.addEventListener('click', () => card.classList.remove('flipped'));

  updateNotesVisibility();
  return card;
}

function renderNotesFromState() {
  if (!noteGrid) return;
  noteGrid.innerHTML = '';
  if (fullTags) fullTags.innerHTML = '';
  notesState.forEach(n => createNoteCardFromData(n));

  if (fullTags) {
    Array.from(fullTags.children).forEach(ch => {
      ensureFullTagClickable(ch);
      if (ch.dataset && activeFilterTags.has(ch.dataset.tag)) {
        ch.classList.add('active-filter');
      }
    });
  }
  updateNotesVisibility();
}

function updateNotesVisibility() {
  const notes = Array.from(document.querySelectorAll('.note'));
  const query = (currentSearchQuery || '').trim().toLowerCase();
  notes.forEach(card => {
    let tagsMatch = true;
    if (activeFilterTags.size) {
      const cardTags = Array.from(card.querySelectorAll('.note-tags span')).map(s => s.dataset.tag);
      tagsMatch = Array.from(activeFilterTags).every(t => cardTags.includes(t));
    }

    let searchMatch = true;
    if (query.length) {
      searchMatch = card.textContent.toLowerCase().includes(query);
    }

    card.style.display = (tagsMatch && searchMatch) ? '' : 'none';
  });
}

// -------------------------
//  EDIT MODE
// -------------------------
function enterEditMode(note, card) {
  if (editingNoteCard) editingNoteCard.classList.remove('editing');
  editingNoteId = note.id;
  editingNoteCard = card;
  card.classList.add('editing');

  taskInput.value = note.title;
  txtArea.value = note.content || '';
  noteDateInput.value = note.due_date || '';

  tempTags.innerHTML = '';
  note.tags.forEach(tag => {
    const span = document.createElement('span');
    span.dataset.tag = tag;
    span.textContent = tag;
    span.appendChild(createRemoveButtonFor(span));
    tempTags.appendChild(span);
  });
  document.getElementById('noteCreationSection').scrollIntoView({ behavior: 'smooth' });
}

function exitEditMode() {
  if (editingNoteCard) editingNoteCard.classList.remove('editing');
  editingNoteId = null;
  editingNoteCard = null;
  taskInput.value = '';
  txtArea.value = '';
  noteDateInput.value = '';
  tempTags.innerHTML = '';
}

// -------------------------
//  TAG INPUT HANDLER
// -------------------------
if (btnTag) {
  btnTag.addEventListener("click", () => {
    let userValue = (userTagInput.value || '').trim();
    if (!userValue) return;
    if (!userValue.startsWith("#")) userValue = "#" + userValue.replace("#", "");
    const existingTags = Array.from(tempTags.querySelectorAll("span")).map(getTagTextFromElem);
    if (existingTags.includes(userValue)) { userTagInput.value = ""; return; }

    const newTag = document.createElement("span");
    newTag.dataset.tag = userValue;
    newTag.appendChild(document.createTextNode(userValue));
    newTag.appendChild(createRemoveButtonFor(newTag));
    tempTags.appendChild(newTag);
    userTagInput.value = "";
  });
}

// -------------------------
//  TASK CREATION HANDLER
// -------------------------
if (taskBtn) {
  taskBtn.addEventListener("click", () => {
    const title = (taskInput.value || '').trim();
    const body = (txtArea.value || '').trim();
    const dueDate = noteDateInput?.value || null;
    if (!title || !body) return;

    const tags = Array.from(tempTags.querySelectorAll('span')).map(s => getTagTextFromElem(s));

    if (editingNoteId) {
      updateTodo(editingNoteId, { title, content: body, tags, due_date: dueDate });
    } else {
      createTodo({ title, content: body, tags, due_date: dueDate });
    }

    taskInput.value = '';
    txtArea.value = '';
    noteDateInput.value = '';
    tempTags.innerHTML = '';
  });
}

// -------------------------
//  SEARCH HANDLER
// -------------------------
document.addEventListener('DOMContentLoaded', () => {
  const search = document.getElementById('navSearch');
  if (search) {
    search.addEventListener('input', e => {
      currentSearchQuery = e.target.value || '';
      updateNotesVisibility();
    });
    search.addEventListener('keydown', e => {
      if (e.key === 'Escape') {
        search.value = '';
        currentSearchQuery = '';
        updateNotesVisibility();
      }
    });
  }
});

// -------------------------
//  GLOBAL CLICK HANDLERS
// -------------------------
document.addEventListener("click", () => {
  loginPopup.classList.add("hidden");
  userPopup.classList.add("hidden");
});
loginPopup.addEventListener("click", e => e.stopPropagation());
userPopup.addEventListener("click", e => e.stopPropagation());
userIcon.addEventListener("click", e => {
  e.stopPropagation();
  userPopup.classList.toggle("hidden");
});

// -------------------------
//  INITIAL LOAD
// -------------------------
loadFilters();
checkAuthAndUpdateUI();

