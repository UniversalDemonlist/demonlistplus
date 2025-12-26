/* ---------------------------------------------------
   TAB SWITCHING
--------------------------------------------------- */
document.querySelectorAll(".tab-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
    document.querySelectorAll(".tab-content").forEach(c => c.classList.remove("active"));

    btn.classList.add("active");
    document.getElementById(btn.dataset.tab).classList.add("active");
  });
});

function openDemonlistFromHome() {
  document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
  document.querySelectorAll(".tab-content").forEach(c => c.classList.remove("active"));

  document.querySelector('.tab-btn[data-tab="demonlist"]').classList.add("active");
  document.getElementById("demonlist").classList.add("active");
}

/* ---------------------------------------------------
   THEME TOGGLE
--------------------------------------------------- */
function toggleTheme() {
  document.body.classList.toggle("light-mode");
  localStorage.setItem("theme", document.body.classList.contains("light-mode") ? "light" : "dark");
}

if (localStorage.getItem("theme") === "light") {
  document.body.classList.add("light-mode");
}

/* ---------------------------------------------------
   GLOBAL DATA
--------------------------------------------------- */
let globalDemons = [];      
let minusDemons = [];       
let pointercrateDemons = []; 
let mergedPointercrateDemons = []; 

/* ---------------------------------------------------
   HELPERS
--------------------------------------------------- */
function getYoutubeThumbnail(url) {
  if (!url || typeof url !== "string") return null;
  try {
    let videoId = null;
    if (url.includes("youtube.com/watch")) {
      videoId = new URL(url).searchParams.get("v");
    } else if (url.includes("youtu.be/")) {
      videoId = url.split("youtu.be/")[1].split("?")[0];
    }
    if (!videoId || videoId.length < 5) return null;
    return `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
  } catch {
    return null;
  }
}

function extractVideoID(url) {
  try {
    if (url.includes("youtube.com/watch")) {
      return new URL(url).searchParams.get("v");
    }
    if (url.includes("youtu.be/")) {
      return url.split("youtu.be/")[1].split("?")[0];
    }
  } catch {}
  return null;
}
/* ---------------------------------------------------
   LOAD MAIN DEMONLIST
--------------------------------------------------- */
async function loadDemonList() {
  try {
    const list = await fetch("data/list.json").then(r => r.json());
    const container = document.getElementById("demon-container");

    const demonFiles = await Promise.all(
      list.map(id =>
        fetch(`data/demons/${id}.json`)
          .then(r => (r.ok ? r.json() : null))
          .catch(() => null)
      )
    );

    globalDemons = demonFiles
      .map((d, i) => (d ? { ...d, id: list[i], position: i + 1 } : null))
      .filter(Boolean);

    globalDemons.forEach(demon => {
      const card = createDemonCard(demon);
      container.appendChild(card);
    });

    setupSearchBar();
    loadLeaderboard();
  } catch (e) {
    console.error("Error loading main demonlist:", e);
  }
}

/* ---------------------------------------------------
   LOAD DEMONLIST -
--------------------------------------------------- */
async function loadDemonListMinus() {
  try {
    const list = await fetch("data/list_minus.json").then(r => r.json());
    const container = document.getElementById("demon-container-minus");

    const demonFiles = await Promise.all(
      list.map(id =>
        fetch(`data/demons/${id}.json`)
          .then(r => (r.ok ? r.json() : null))
          .catch(() => null)
      )
    );

    minusDemons = demonFiles
      .map((d, i) => (d ? { ...d, id: list[i], position: i + 1 } : null))
      .filter(Boolean);

    minusDemons.forEach(demon => {
      const card = createDemonCard(demon);
      container.appendChild(card);
    });

    setupMinusSearch();
    loadLeaderboardMinus();
  } catch (e) {
    console.error("Error loading Demonlist -:", e);
  }
}

/* ---------------------------------------------------
   DEMON CARD (MAIN / MINUS)
--------------------------------------------------- */
function createDemonCard(demon) {
  const card = document.createElement("div");
  card.className = "demon-card";

  const img = document.createElement("img");
  img.src = getYoutubeThumbnail(demon.verification) || "fallback.png";

  const info = document.createElement("div");
  info.className = "demon-info";

  const creatorsText = Array.isArray(demon.creators)
    ? demon.creators.join(", ")
    : (demon.creators || "Unknown");

  const demonScore = demon.position <= 75 ? (350 / Math.sqrt(demon.position)) : 0;
  const positionLabel = demon.position > 75 ? "Legacy" : "#" + demon.position;

  info.innerHTML = `
    <h2>${positionLabel} — ${demon.name}</h2>
    <p><strong>Author:</strong> ${demon.author}</p>
    <p><strong>Creators:</strong> ${creatorsText}</p>
    <p><strong>Verifier:</strong> ${demon.verifier}</p>
    <p><strong>Percent to Qualify:</strong> ${demon.percentToQualify}%</p>
    <p><strong>Score Value:</strong> ${demonScore.toFixed(2)}</p>
  `;

  const viewBtn = document.createElement("button");
  viewBtn.className = "dropdown-btn";
  viewBtn.textContent = "View Demon Page";
  viewBtn.addEventListener("click", () => openDemonPage(demon));
  info.appendChild(viewBtn);

  const btn = document.createElement("button");
  btn.className = "dropdown-btn";
  btn.textContent = "Show Records";

  const dropdown = document.createElement("div");
  dropdown.className = "record-dropdown";

  if (Array.isArray(demon.records) && demon.records.length > 0) {
    demon.records.forEach(r => {
      const p = document.createElement("p");
      p.innerHTML = `
        <strong>${r.user}</strong> — ${r.percent}% (${r.hz}hz)
        ${r.link ? `<br><a href="${r.link}" target="_blank">Video</a>` : ""}
      `;
      dropdown.appendChild(p);
    });
  } else {
    dropdown.innerHTML = "<p>No records yet.</p>";
  }

  btn.addEventListener("click", () => {
    const visible = dropdown.style.display === "block";
    dropdown.style.display = visible ? "none" : "block";
    btn.textContent = visible ? "Show Records" : "Hide Records";
  });

  info.appendChild(btn);
  info.appendChild(dropdown);

  card.appendChild(img);
  card.appendChild(info);

  return card;
}

/* ---------------------------------------------------
   DEMON PAGE (MAIN / MINUS)
--------------------------------------------------- */
function openDemonPage(demon) {
  document.querySelectorAll(".tab-content").forEach(c => c.classList.remove("active"));
  document.getElementById("demon-page").classList.add("active");

  const container = document.getElementById("demon-page-container");
  const positionLabel = demon.position > 75 ? "Legacy" : "#" + demon.position;
  const demonScore = demon.position <= 75 ? (350 / Math.sqrt(demon.position)) : 0;

  let recordsHTML = "";
  if (Array.isArray(demon.records) && demon.records.length > 0) {
    demon.records.forEach(r => {
      recordsHTML += `
        <div class="leaderboard-row">
          <span>${r.user}</span>
          <span>${r.percent}%</span>
          <span>${r.hz}hz</span>
          ${r.link ? `<a href="${r.link}" target="_blank">Video</a>` : ""}
        </div>
      `;
    });
  } else {
    recordsHTML = "<p>No records yet.</p>";
  }

  const videoId = extractVideoID(demon.verification);

  container.innerHTML = `
    <button class="dropdown-btn back-btn" onclick="goBackToList()">← Back to List</button>

    <h1>${positionLabel} — ${demon.name}</h1>

    <p><strong>Author:</strong> ${demon.author}</p>
    <p><strong>Creators:</strong> ${Array.isArray(demon.creators) ? demon.creators.join(", ") : (demon.creators || "Unknown")}</p>
    <p><strong>Verifier:</strong> ${demon.verifier}</p>
    <p><strong>Percent to Qualify:</strong> ${demon.percentToQualify}%</p>
    <p><strong>Score Value:</strong> ${demonScore.toFixed(2)}</p>

    <h2>Verification</h2>
    ${
      videoId
        ? `<iframe width="560" height="315" src="https://www.youtube.com/embed/${videoId}" frameborder="0" allowfullscreen></iframe>`
        : "<p>No verification video.</p>"
    }

    <h2>Records</h2>
    ${recordsHTML}
  `;
}

function goBackToList() {
  document.querySelectorAll(".tab-content").forEach(c => c.classList.remove("active"));
  document.getElementById("demonlist").classList.add("active");
}
/* ---------------------------------------------------
   LOAD POINTERCRATE LIST (SOURCE ONLY, NOT MERGED)
--------------------------------------------------- */
async function loadPointercrateSource() {
  try {
    const list = await fetch("data/pointercrate_list.json").then(r => r.json());

    const demonFiles = await Promise.all(
      list.map(id =>
        fetch(`data/demons/${id}.json`)   // ⭐ FIXED PATH
          .then(r => (r.ok ? r.json() : null))
          .catch(() => null)
      )
    );

    pointercrateDemons = demonFiles
      .map((d, i) => (d ? { ...d, id: list[i], pcPosition: i + 1 } : null))
      .filter(Boolean);

    // ⭐ Merge AFTER loading
    mergePointercratePlus();

    renderPointercrateList();
    loadPointercrateLeaderboard();
  } catch (e) {
    console.error("Error loading Pointercrate source:", e);
  }
}

/* ---------------------------------------------------
   MERGE DEMONLIST+ + POINTERCRATE  (B1 + P1)
--------------------------------------------------- */
function mergePointercratePlus() {
  const map = new Map();

  // Start with POINTERCRATE demons only
  pointercrateDemons.forEach(pc => {
    map.set(pc.id, {
      ...pc,
      position: pc.pcPosition,   // ⭐ ALWAYS use Pointercrate position
      source: "pc"
    });
  });

  // Merge Demonlist+ ONLY IF demon is already on Pointercrate
  globalDemons.forEach(dl => {
    const existing = map.get(dl.id);
    if (!existing) return;

    const mergedRecords = [
      ...(existing.records || []),
      ...(dl.records || [])
    ];

    map.set(dl.id, {
      ...existing,
      name: dl.name || existing.name,
      author: dl.author || existing.author,
      creators: dl.creators || existing.creators,
      verifier: dl.verifier || existing.verifier,
      verification: dl.verification || existing.verification,
      percentToQualify: dl.percentToQualify || existing.percentToQualify,
      records: mergedRecords,
      position: existing.position,   // ⭐ KEEP POINTERCRATE POSITION
      source: "merged"
    });
  });

  mergedPointercrateDemons = Array.from(map.values())
    .sort((a, b) => a.position - b.position);
}


/* ---------------------------------------------------
   POINTERCRATE+ LIST RENDERER (PC1 + S2)
--------------------------------------------------- */
function renderPointercrateList() {
  const container = document.getElementById("pointercrate-container");
  container.innerHTML = "";

  mergedPointercrateDemons.forEach(demon => {
    const section = document.createElement("section");
    section.className = "panel fade flex mobile-col";

    const thumb = document.createElement("a");
    thumb.className = "thumb ratio-16-9";
    thumb.style.backgroundImage = `url("${getYoutubeThumbnail(demon.verification) || "fallback.png"}")`;
    thumb.href = demon.verification || "#";
    thumb.target = "_blank";

    const infoWrapper = document.createElement("div");
    infoWrapper.className = "flex pointercrate-demon-info";

    const byline = document.createElement("div");
    byline.className = "demon-byline";

    const positionLabel = demon.position > 75 ? "Legacy" : "#" + demon.position;
    const demonScore = demon.position <= 75 ? (350 / Math.sqrt(demon.position)) : 0;

    const h2 = document.createElement("h2");
    h2.textContent = `${positionLabel} – ${demon.name}`;
    h2.style.cursor = "pointer";
    h2.addEventListener("click", () => openPointercrateDemonPage(demon));

    const h3 = document.createElement("h3");
    h3.textContent = `by ${demon.author}`;

    const scoreDiv = document.createElement("div");
    scoreDiv.textContent = `${demonScore.toFixed(2)} points`;

    byline.appendChild(h2);
    byline.appendChild(h3);
    byline.appendChild(scoreDiv);

    infoWrapper.appendChild(byline);

    section.appendChild(thumb);
    section.appendChild(infoWrapper);

    container.appendChild(section);
  });

  setupPointercrateSearch();
}

/* ---------------------------------------------------
   POINTERCRATE+ SEARCH BAR
--------------------------------------------------- */
function setupPointercrateSearch() {
  const searchBar = document.getElementById("search-bar-pointercrate");
  if (!searchBar) return;

  searchBar.addEventListener("input", () => {
    const query = searchBar.value.toLowerCase();
    document.querySelectorAll("#pointercrate-container .panel").forEach(panel => {
      const name = panel.querySelector("h2").textContent.toLowerCase();
      panel.style.display = name.includes(query) ? "flex" : "none";
    });
  });
}

/* ---------------------------------------------------
   POINTERCRATE+ DEMON PAGE
--------------------------------------------------- */
function openPointercrateDemonPage(demon) {
  const container = document.getElementById("pointercrate-demon-page-container");

  const positionLabel = demon.position > 75 ? "Legacy" : "#" + demon.position;
  const demonScore = demon.position <= 75 ? (350 / Math.sqrt(demon.position)) : 0;

  let recordsHTML = "";
  if (Array.isArray(demon.records) && demon.records.length > 0) {
    demon.records.forEach(r => {
      recordsHTML += `
        <div class="leaderboard-row">
          <span>${r.user}</span>
          <span>${r.percent}%</span>
          <span>${r.hz || ""}hz</span>
          ${r.link ? `<a href="${r.link}" target="_blank">Video</a>` : ""}
        </div>
      `;
    });
  } else {
    recordsHTML = "<p>No records yet.</p>";
  }

  const videoId = extractVideoID(demon.verification);

  container.innerHTML = `
    <h1>${positionLabel} — ${demon.name}</h1>
    <p><strong>Author:</strong> ${demon.author}</p>
    <p><strong>Creators:</strong> ${Array.isArray(demon.creators) ? demon.creators.join(", ") : demon.creators}</p>
    <p><strong>Verifier:</strong> ${demon.verifier}</p>
    <p><strong>Percent to Qualify:</strong> ${demon.percentToQualify}%</p>
    <p><strong>Score Value:</strong> ${demonScore.toFixed(2)}</p>

    <h2>Verification</h2>
    ${
      videoId
        ? `<iframe width="560" height="315" src="https://www.youtube.com/embed/${videoId}" frameborder="0" allowfullscreen></iframe>`
        : "<p>No verification video.</p>"
    }

    <h2>Records</h2>
    ${recordsHTML}
  `;
}
/* ---------------------------------------------------
   MAIN LEADERBOARD
--------------------------------------------------- */
function loadLeaderboard() {
  const container = document.getElementById("leaderboard-container");
  container.innerHTML = "";

  const scores = {};

  globalDemons.forEach(demon => {
    const demonScore = demon.position <= 75 ? (350 / Math.sqrt(demon.position)) : 0;

    (demon.records || []).forEach(r => {
      if (!scores[r.user]) scores[r.user] = 0;
      scores[r.user] += demonScore * (r.percent / 100);
    });
  });

  const sorted = Object.entries(scores)
    .map(([user, score]) => ({ user, score }))
    .sort((a, b) => b.score - a.score);

  sorted.forEach((entry, i) => {
    const row = document.createElement("div");
    row.className = "leaderboard-row";
    row.innerHTML = `
      <span>#${i + 1}</span>
      <span class="lb-user" onclick="openProfile('${entry.user}')">${entry.user}</span>
      <span>${entry.score.toFixed(2)}</span>
    `;
    container.appendChild(row);
  });
}

/* ---------------------------------------------------
   LEADERBOARD - (MINUS)
--------------------------------------------------- */
function loadLeaderboardMinus() {
  const container = document.getElementById("leaderboard-minus-container");
  container.innerHTML = "";

  const scores = {};

  minusDemons.forEach(demon => {
    const demonScore = demon.position <= 75 ? (350 / Math.sqrt(demon.position)) : 0;

    (demon.records || []).forEach(r => {
      if (!scores[r.user]) scores[r.user] = 0;
      scores[r.user] += demonScore * (r.percent / 100);
    });
  });

  const sorted = Object.entries(scores)
    .map(([user, score]) => ({ user, score }))
    .sort((a, b) => b.score - a.score);

  sorted.forEach((entry, i) => {
    const row = document.createElement("div");
    row.className = "leaderboard-row";
    row.innerHTML = `
      <span>#${i + 1}</span>
      <span class="lb-user" onclick="openProfileMinus('${entry.user}')">${entry.user}</span>
      <span>${entry.score.toFixed(2)}</span>
    `;
    container.appendChild(row);
  });
}

/* ---------------------------------------------------
   POINTERCRATE+ LEADERBOARD
--------------------------------------------------- */
function loadPointercrateLeaderboard() {
  const container = document.getElementById("pointercrate-leaderboard");
  container.innerHTML = "";

  const scores = {};

  mergedPointercrateDemons.forEach(demon => {
    const demonScore = demon.position <= 75 ? (350 / Math.sqrt(demon.position)) : 0;

    (demon.records || []).forEach(r => {
      if (!scores[r.user]) scores[r.user] = 0;
      scores[r.user] += demonScore * (r.percent / 100);
    });
  });

  const sorted = Object.entries(scores)
    .map(([user, score]) => ({ user, score }))
    .sort((a, b) => b.score - a.score);

  sorted.forEach((entry, i) => {
    const row = document.createElement("div");
    row.className = "leaderboard-row";
    row.innerHTML = `
      <span>#${i + 1}</span>
      <span class="lb-user" onclick="openPointercrateProfile('${entry.user}')">${entry.user}</span>
      <span>${entry.score.toFixed(2)}</span>
    `;
    container.appendChild(row);
  });
}

/* ---------------------------------------------------
   PLAYER PROFILES (MAIN)
--------------------------------------------------- */
function openProfile(user) {
  const container = document.getElementById("profile-container");
  container.innerHTML = `<h3>${user}</h3>`;

  let total = 0;
  const list = [];

  globalDemons.forEach(demon => {
    const demonScore = demon.position <= 75 ? (350 / Math.sqrt(demon.position)) : 0;

    (demon.records || []).forEach(r => {
      if (r.user === user) {
        const earned = demonScore * (r.percent / 100);
        total += earned;
        list.push({ demon: demon.name, percent: r.percent, score: earned });
      }
    });
  });

  container.innerHTML += `<p><strong>Total Score:</strong> ${total.toFixed(2)}</p>`;

  list.forEach(entry => {
    container.innerHTML += `
      <div class="leaderboard-row">
        <span>${entry.demon}</span>
        <span>${entry.percent}%</span>
        <span>${entry.score.toFixed(2)}</span>
      </div>
    `;
  });
}

/* ---------------------------------------------------
   PLAYER PROFILES (MINUS)
--------------------------------------------------- */
function openProfileMinus(user) {
  const container = document.getElementById("profile-minus-container");
  container.innerHTML = `<h3>${user}</h3>`;

  let total = 0;
  const list = [];

  minusDemons.forEach(demon => {
    const demonScore = demon.position <= 75 ? (350 / Math.sqrt(demon.position)) : 0;

    (demon.records || []).forEach(r => {
      if (r.user === user) {
        const earned = demonScore * (r.percent / 100);
        total += earned;
        list.push({ demon: demon.name, percent: r.percent, score: earned });
      }
    });
  });

  container.innerHTML += `<p><strong>Total Score:</strong> ${total.toFixed(2)}</p>`;

  list.forEach(entry => {
    container.innerHTML += `
      <div class="leaderboard-row">
        <span>${entry.demon}</span>
        <span>${entry.percent}%</span>
        <span>${entry.score.toFixed(2)}</span>
      </div>
    `;
  });
}

/* ---------------------------------------------------
   POINTERCRATE+ PROFILE
--------------------------------------------------- */
function openPointercrateProfile(user) {
  const container = document.getElementById("pointercrate-profile-container");
  container.innerHTML = `<h3>${user}</h3>`;

  let total = 0;
  const list = [];

  mergedPointercrateDemons.forEach(demon => {
    const demonScore = demon.position <= 75 ? (350 / Math.sqrt(demon.position)) : 0;

    (demon.records || []).forEach(r => {
      if (r.user === user) {
        const earned = demonScore * (r.percent / 100);
        total += earned;
        list.push({ demon: demon.name, percent: r.percent, score: earned });
      }
    });
  });

  container.innerHTML += `<p><strong>Total Score:</strong> ${total.toFixed(2)}</p>`;

  list.forEach(entry => {
    container.innerHTML += `
      <div class="leaderboard-row">
        <span>${entry.demon}</span>
        <span>${entry.percent}%</span>
        <span>${entry.score.toFixed(2)}</span>
      </div>
    `;
  });
}

/* ---------------------------------------------------
   MODERATORS
--------------------------------------------------- */
async function loadModerators() {
  try {
    const list = await fetch("data/moderators.json").then(r => r.json());
    const container = document.getElementById("moderators-container");

    list.forEach(mod => {
      const div = document.createElement("div");
      div.className = "moderator-card";
      div.innerHTML = `
        <h3>${mod.name}</h3>
        <p>${mod.role}</p>
      `;
      container.appendChild(div);
    });
  } catch (e) {
    console.error("Error loading moderators:", e);
  }
}

/* ---------------------------------------------------
   STARTUP
--------------------------------------------------- */
loadDemonList();
loadDemonListMinus();
loadModerators();
loadPointercrateSource();


