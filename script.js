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
let globalDemons = [];      // main list
let minusDemons = [];       // minus list
let pointercrateDemons = []; // pointercrate source
let mergedPointercrateDemons = []; // merged Demonlist+ + Pointercrate

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
   LOAD POINTERCRATE LIST (SOURCE ONLY, NOT MERGED)
--------------------------------------------------- */
async function loadPointercrateSource() {
  try {
    const list = await fetch("data/pointercrate_list.json").then(r => r.json());

    const demonFiles = await Promise.all(
      list.map(id =>
        fetch(`data/pointercrate_demons/${id}.json`)
          .then(r => (r.ok ? r.json() : null))
          .catch(() => null)
      )
    );

    pointercrateDemons = demonFiles
      .map((d, i) => (d ? { ...d, id: list[i], pcPosition: i + 1 } : null))
      .filter(Boolean);

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

  // Start from Demonlist+ data
  globalDemons.forEach(d => {
    map.set(d.id, {
      ...d,
      source: "dlplus"
    });
  });

  // Merge pointercrate data
  pointercrateDemons.forEach(pc => {
    const existing = map.get(pc.id);
    if (!existing) {
      // Only on pointercrate
      map.set(pc.id, {
        ...pc,
        position: pc.pcPosition, // if no dl+ position, use pointercrate
        source: "pc"
      });
    } else {
      // Exists on both -> true merge, harder position wins
      const dlPos = existing.position || 9999;
      const pcPos = pc.pcPosition || 9999;
      const mergedPosition = Math.min(dlPos, pcPos);

      const mergedRecords = [
        ...(Array.isArray(existing.records) ? existing.records : []),
        ...(Array.isArray(pc.records) ? pc.records : [])
      ];

      map.set(pc.id, {
        ...existing,
        // prefer dl+ name/author/etc but you could change this
        name: existing.name || pc.name,
        author: existing.author || pc.author,
        creators: existing.creators || pc.creators,
        verifier: existing.verifier || pc.verifier,
        verification: existing.verification || pc.verification,
        percentToQualify: existing.percentToQualify || pc.percentToQualify,
        records: mergedRecords,
        position: mergedPosition,
        source: "merged"
      });
    }
  });

  mergedPointercrateDemons = Array.from(map.values())
    .sort((a, b) => a.position - b.position);
}

/* ---------------------------------------------------
   SEARCH BARS
--------------------------------------------------- */
function setupSearchBar() {
  const searchBar = document.getElementById("search-bar");
  if (!searchBar) return;

  searchBar.addEventListener("input", () => {
    const query = searchBar.value.toLowerCase();
    document.querySelectorAll("#demon-container .demon-card").forEach(card => {
      const name = card.querySelector("h2").textContent.toLowerCase();
      card.style.display = name.includes(query) ? "flex" : "none";
    });
  });
}

function setupMinusSearch() {
  const searchBar = document.getElementById("search-bar-minus");
  if (!searchBar) return;

  searchBar.addEventListener("input", () => {
    const query = searchBar.value.toLowerCase();
    document.querySelectorAll("#demon-container-minus .demon-card").forEach(card => {
      const name = card.querySelector("h2").textContent.toLowerCase();
      card.style.display = name.includes(query) ? "flex" : "none";
    });
  });
}

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
   LEADERBOARD (MAIN)
--------------------------------------------------- */
function loadLeaderboard() {
  const players = {};

  globalDemons.forEach(demon => {
    const pos = demon.position;
    const demonScore = pos <= 75 ? 350 / Math.sqrt(pos) : 0;

    if (demon.verifier && demon.verifier !== "Not beaten yet") {
      const name = demon.verifier;

      if (!players[name]) {
        players[name] = { score: 0, records: [] };
      }

      players[name].score += demonScore;

      players[name].records.push({
        demon: demon.name,
        position: demon.position,
        percent: 100,
        link: demon.verification || null
      });
    }

    if (Array.isArray(demon.records)) {
      demon.records.forEach(rec => {
        if (rec.user === "Not beaten yet") return;

        const playerName = rec.user;
        const scoreGain = demonScore * (rec.percent / 100);

        if (!players[playerName]) {
          players[playerName] = { score: 0, records: [] };
        }

        players[playerName].score += scoreGain;

        players[playerName].records.push({
          demon: demon.name,
          position: demon.position,
          percent: rec.percent,
          link: rec.link
        });
      });
    }
  });

  const sorted = Object.entries(players)
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.score - a.score);

  const container = document.getElementById("leaderboard-container");
  container.innerHTML = "";

  sorted.forEach((p, i) => {
    const row = document.createElement("div");
    row.className = "leaderboard-row";
    row.innerHTML = `
      <span>${i + 1}</span>
      <span class="clickable-player" data-player="${p.name}">${p.name}</span>
      <span>${p.score.toFixed(2)}</span>
    `;
    container.appendChild(row);
  });

  document.querySelectorAll(".clickable-player").forEach(el => {
    el.addEventListener("click", () => {
      const name = el.dataset.player;
      showPlayerProfile(name, sorted.find(p => p.name === name), "main");
    });
  });
}

/* ---------------------------------------------------
   LEADERBOARD - (SAME SCORING AS MAIN)
--------------------------------------------------- */
function loadLeaderboardMinus() {
  const players = {};

  minusDemons.forEach(demon => {
    const demonScore = demon.position <= 75 ? 350 / Math.sqrt(demon.position) : 0;

    if (Array.isArray(demon.records)) {
      demon.records.forEach(rec => {
        const scoreGain = demonScore * (rec.percent / 100);

        if (!players[rec.user]) {
          players[rec.user] = { score: 0, records: [] };
        }

        players[rec.user].score += scoreGain;

        players[rec.user].records.push({
          demon: demon.name,
          position: demon.position,
          percent: rec.percent,
          link: rec.link
        });
      });
    }
  });

  const sorted = Object.entries(players)
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.score - a.score);

  const container = document.getElementById("leaderboard-minus-container");
  container.innerHTML = "";

  sorted.forEach((p, i) => {
    const row = document.createElement("div");
    row.className = "leaderboard-row";
    row.innerHTML = `
      <span>${i + 1}</span>
      <span class="clickable-player-minus" data-player="${p.name}">${p.name}</span>
      <span>${p.score.toFixed(2)}</span>
    `;
    container.appendChild(row);
  });

  document.querySelectorAll(".clickable-player-minus").forEach(el => {
    el.addEventListener("click", () => {
      const name = el.dataset.player;
      showPlayerProfile(name, sorted.find(p => p.name === name), "minus");
    });
  });
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
    section.style.overflow = "hidden";

    const thumb = document.createElement("a");
    thumb.className = "thumb ratio-16-9";
    const thumbUrl = getYoutubeThumbnail(demon.verification) || "fallback.png";
    thumb.style.position = "relative";
    thumb.style.backgroundImage = `url("${thumbUrl}")`;
    thumb.href = demon.verification || "#";
    thumb.target = "_blank";

    const thumbInner = document.createElement("div");
    thumbInner.className = "thumb-inner";
    thumb.appendChild(thumbInner);

    const infoWrapper = document.createElement("div");
    infoWrapper.className = "flex pointercrate-demon-info";
    infoWrapper.style.alignItems = "center";

    const byline = document.createElement("div");
    byline.className = "demon-byline";

    const positionLabel = demon.position > 75 ? "Legacy" : "#" + demon.position;
    const demonScore = demon.position <= 75 ? (350 / Math.sqrt(demon.position)) : 0;

    const h2 = document.createElement("h2");
    h2.style.textAlign = "left";
    h2.style.marginBottom = "0px";
    h2.innerHTML = `${positionLabel} – ${demon.name}`;

    const h3 = document.createElement("h3");
    h3.style.textAlign = "left";
    h3.textContent = `by ${demon.author}`;

    const scoreDiv = document.createElement("div");
    scoreDiv.style.textAlign = "left";
    scoreDiv.style.fontSize = "0.8em";
    scoreDiv.textContent = `${demonScore.toFixed(2)} points`;

    // Clicking the text opens Pointercrate+ demon page
    h2.style.cursor = "pointer";
    h2.addEventListener("click", () => openPointercrateDemonPage(demon));

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

/* ---------------------------------------------------
   POINTERCRATE+ LEADERBOARD
--------------------------------------------------- */
function loadPointercrateLeaderboard() {
  const players = {};

  mergedPointercrateDemons.forEach(demon => {
    const pos = demon.position;
    const demonScore = pos <= 75 ? 350 / Math.sqrt(pos) : 0;

    if (Array.isArray(demon.records)) {
      demon.records.forEach(rec => {
        const scoreGain = demonScore * (rec.percent / 100);

        if (!players[rec.user]) {
          players[rec.user] = { score: 0, records: [] };
        }

        players[rec.user].score += scoreGain;

        players[rec.user].records.push({
          demon: demon.name,
          position: demon.position,
          percent: rec.percent,
          link: rec.link
        });
      });
    }
  });

  const sorted = Object.entries(players)
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.score - a.score);

  const container = document.getElementById("pointercrate-leaderboard");
  container.innerHTML = "";

  sorted.forEach((p, i) => {
    const row = document.createElement("div");
    row.className = "leaderboard-row";
    row.innerHTML = `
      <span>${i + 1}</span>
      <span class="clickable-player-pointercrate" data-player="${p.name}">${p.name}</span>
      <span>${p.score.toFixed(2)}</span>
    `;
    container.appendChild(row);
  });

  document.querySelectorAll(".clickable-player-pointercrate").forEach(el => {
    el.addEventListener("click", () => {
      const name = el.dataset.player;
      showPlayerProfile(name, sorted.find(p => p.name === name), "pointercrate");
    });
  });
}

/* ---------------------------------------------------
   PLAYER PROFILE (GENERIC)
--------------------------------------------------- */
function showPlayerProfile(name, playerData, source) {
  if (!playerData) return;

  if (source === "main") {
    document.getElementById("profile-container").innerHTML = buildProfileHTML(name, playerData);
  } else if (source === "minus") {
    document.getElementById("profile-minus-container").innerHTML = buildProfileHTML(name, playerData);
  } else if (source === "pointercrate") {
    document.getElementById("pointercrate-profile-container").innerHTML = buildProfileHTML(name, playerData);
  }
}

function buildProfileHTML(name, playerData) {
  let html = `
    <h2>${name}</h2>
    <p><strong>Total score:</strong> ${playerData.score.toFixed(2)}</p>
    <h3>Records:</h3>
  `;

  const records = [...playerData.records].sort((a, b) => a.position - b.position);

  records.forEach(r => {
    const posLabel = r.position > 75 ? "Legacy" : "#" + r.position;
    html += `
      <div class="leaderboard-row">
        <span>${posLabel}</span>
        <span>${r.demon}</span>
        <span>${r.percent ? r.percent + "%" : ""}</span>
        ${r.link ? `<a href="${r.link}" target="_blank">Video</a>` : ""}
      </div>
    `;
  });

  return html;
}

/* ---------------------------------------------------
   MODERATORS
--------------------------------------------------- */
function loadModerators() {
  const container = document.getElementById("moderators-container");

  const mods = [
    { name: "UniverDemonlist", role: "Super Moderator" },
    { name: "PowerGreen", role: "Moderator" },
    { name: "Prometheus", role: "Developer" }
  ];

  mods.forEach(mod => {
    const row = document.createElement("div");
    row.className = "moderator-row";

    row.innerHTML = `
      <span>${mod.name}</span>
      <span class="moderator-role">${mod.role}</span>
    `;

    container.appendChild(row);
  });
}

/* ---------------------------------------------------
   STARTUP
--------------------------------------------------- */
loadDemonList();
loadDemonListMinus();
loadModerators();
loadPointercrateSource();
