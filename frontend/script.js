// ===================== PLATFORMS & DEMO DATA =====================
const PLATFORMS = {
  netflix: { name: "Netflix",     price: 199, url: "https://www.netflix.com" },
  prime:   { name: "Prime Video", price: 149, url: "https://www.primevideo.com" },
  hotstar: { name: "JioHotstar",  price: 149, url: "https://www.hotstar.com" },
  zee5:    { name: "ZEE5",        price: 99,  url: "https://www.zee5.com" },
  sonyliv: { name: "SonyLIV",     price: 99,  url: "https://www.sonyliv.com" }
};

const PLATFORM_KEYS = Object.keys(PLATFORMS);

const MOVIES = [
  { title: "Monsoon Express", genre: "Thriller",    meta: "2024 · Thriller · 2h 05m",
    overview: "A night train, a missing ledger and twelve passengers who all have a reason to lie.",
    on: ["netflix", "prime", "zee5"], moods: ["Excited"] },
  { title: "The Last Reel",   genre: "Drama",       meta: "2023 · Drama · 1h 52m",
    overview: "A small-town projectionist fights to keep the town cinema open for one more season.",
    on: ["prime", "sonyliv", "hotstar", "netflix"], moods: ["Sad"] },
  { title: "Coastal Road",    genre: "Adventure",   meta: "2025 · Adventure · 2h 18m",
    overview: "Two cousins drive the full length of the western coast in a borrowed jeep.",
    on: ["hotstar", "zee5"], moods: ["Happy", "Excited"] },
  { title: "Sunday Chai",     genre: "Comedy",      meta: "2024 · Comedy · 1h 38m",
    overview: "A family reunion goes sideways over one very long cup of tea.",
    on: ["zee5", "sonyliv"], moods: ["Happy", "Relaxed", "Romantic"] },
  { title: "Letters to Goa",  genre: "Romance",     meta: "2023 · Romance · 2h 02m",
    overview: "Two pen pals finally meet on a rainy beach town weekend.",
    on: ["netflix", "hotstar"], moods: ["Romantic", "Sad"] },
  { title: "Northern Lights", genre: "Documentary", meta: "Upcoming · Documentary · 1h 40m",
    overview: "A year of aurora chasing across the Arctic.",
    on: [], estimate: "January 2027", estPlatform: "Netflix", moods: ["Relaxed"] },
  { title: "Midnight Ferry",  genre: "Thriller",    meta: "Upcoming · Thriller · 1h 58m",
    overview: "The last ferry of the night carries one passenger too many.",
    on: [], estimate: "March 2027", estPlatform: "Prime Video", moods: ["Excited"] }
];

const FLOATING_MOVIES = [
  "Monsoon Express",
  "The Last Reel",
  "Interstellar",
  "Northern Lights"
];

const MOODS = {
  Happy:    "Light, feel-good picks.",
  Sad:      "For a good cry or a heart-to-heart.",
  Excited:  "Fast, edge-of-your-seat picks.",
  Relaxed:  "Calm and easy watching.",
  Romantic: "Sweet stories for a cosy night."
};

const GENRE_TO_MOOD = {
  "Action & Adventure": "Excited",
  "Thriller": "Excited",
  "Sci-Fi & Fantasy": "Excited",
  "Comedy": "Happy",
  "Family": "Happy",
  "Animation": "Happy",
  "Drama": "Sad",
  "Romance": "Romantic",
  "Documentary": "Relaxed"
};

// ===================== STATE =====================
const state = {
  query: "Monsoon Express",
  mood: "Happy",
  subs: { prime: true },
  notified: {},
  currentMovie: null,
  loading: false,
  searchToken: 0
};

const $ = (id) => document.getElementById(id);

// ===================== HELPERS =====================
function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function formatDuration(ms) {
  if (!ms || ms <= 0) return null;
  const totalMins = Math.round(ms / 60000);
  const h = Math.floor(totalMins / 60);
  const m = totalMins % 60;
  return h > 0 ? `${h}h ${String(m).padStart(2, "0")}m` : `${m}m`;
}

function assignPlatformsForTitle(title) {
  const seed = hashString(title.toLowerCase());
  const count = 2 + (seed % 3);
  return PLATFORM_KEYS
    .map((_, idx) => PLATFORM_KEYS[(seed + idx * 2) % PLATFORM_KEYS.length])
    .slice(0, count);
}

function findLocalMovie(q) {
  const clean = q.trim().toLowerCase();
  if (!clean) return null;
  return (
    MOVIES.find((m) => m.title.toLowerCase() === clean) ||
    MOVIES.find((m) => m.title.toLowerCase().includes(clean)) ||
    null
  );
}

async function fetchItunesMeta(query) {
  const url = `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&country=IN&media=movie&limit=5`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const data = await res.json();
  const item = (data.results || []).find((r) => r.trackName);
  if (!item) return null;

  return {
    title: item.trackName,
    year: item.releaseDate ? new Date(item.releaseDate).getFullYear() : null,
    genre: item.primaryGenreName || null,
    duration: formatDuration(item.trackTimeMillis),
    overview: item.longDescription || item.shortDescription || ""
  };
}

async function fetchWikiPlot(title) {
  const candidates = [`${title} (film)`, title];
  for (const candidate of candidates) {
    try {
      const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(candidate)}`;
      const res = await fetch(url);
      if (!res.ok) continue;
      const data = await res.json();
      if (data.extract && data.type !== "disambiguation") {
        // Keep the plot concise (up to 2 sentences)
        const sentences = data.extract.match(/[^.!?]+[.!?]+/g) || [data.extract];
        const shortPlot = sentences.slice(0, 2).join(" ").trim();
        const yearMatch = data.extract.match(/\b(19\d{2}|20\d{2})\b/);
        return {
          title: data.title.replace(/\s*\(film\)$/i, ""),
          plot: shortPlot,
          year: yearMatch ? Number(yearMatch[1]) : null
        };
      }
    } catch {
      // Try next candidate
    }
  }
  return null;
}

async function fetchExternalMovie(query) {
  const [itunes, wiki] = await Promise.all([
    fetchItunesMeta(query).catch(() => null),
    fetchWikiPlot(query).catch(() => null)
  ]);

  if (!itunes && !wiki) return null;

  const title = (itunes && itunes.title) || (wiki && wiki.title) || query.trim();
  const overview =
    (wiki && wiki.plot) ||
    (itunes && itunes.overview) ||
    `Plot details for "${title}" are not currently listed in the catalog.`;

  const year = (itunes && itunes.year) || (wiki && wiki.year) || null;
  const genre = (itunes && itunes.genre) || "Movie";
  const duration = (itunes && itunes.duration) || null;
  const metaParts = [year, genre, duration].filter(Boolean);

  return {
    title,
    genre,
    meta: metaParts.join(" · "),
    overview,
    on: assignPlatformsForTitle(title),
    moods: [GENRE_TO_MOOD[genre] || "Excited"]
  };
}

function createFallbackMovie(query) {
  const cleanTitle = query.trim();
  return {
    title: cleanTitle,
    genre: "Movie",
    meta: "Movie",
    overview: `Synopsis for "${cleanTitle}" is currently unavailable.`,
    on: assignPlatformsForTitle(cleanTitle),
    moods: [state.mood || "Excited"]
  };
}

async function resolveSearch(query) {
  const trimmed = query.trim();
  const token = ++state.searchToken;

  if (!trimmed) {
    state.currentMovie = null;
    state.loading = false;
    render();
    return;
  }

  const local = findLocalMovie(trimmed);
  if (local) {
    state.currentMovie = local;
    state.loading = false;
    render();
    return;
  }

  state.loading = true;
  renderResult();

  try {
    const ext = await fetchExternalMovie(trimmed);
    if (token !== state.searchToken) return;
    state.currentMovie = ext || createFallbackMovie(trimmed);
  } catch {
    if (token !== state.searchToken) return;
    state.currentMovie = createFallbackMovie(trimmed);
  } finally {
    if (token === state.searchToken) {
      state.loading = false;
      render();
    }
  }
}

function chip(label, active, action, value) {
  return `<button type="button" class="chip ${active ? "active" : ""}"
            aria-pressed="${active}" data-action="${action}" data-value="${value}">${label}</button>`;
}

// ===================== RENDER =====================
function renderFloatingMovies() {
  const activeTitle = state.currentMovie ? state.currentMovie.title.toLowerCase() : "";
  $("floatingMovies").innerHTML = FLOATING_MOVIES.map((title) => {
    const isActive =
      activeTitle === title.toLowerCase() ||
      state.query.trim().toLowerCase() === title.toLowerCase();
    return `<button type="button" class="float-movie ${isActive ? "active" : ""}"
              aria-pressed="${!!isActive}" data-action="pick" data-value="${title}">${title}</button>`;
  }).join("");
}

function renderSubs() {
  $("subs").innerHTML = Object.keys(PLATFORMS).map((id) => {
    const on = !!state.subs[id];
    return `<button type="button" class="sub ${on ? "active" : ""}" aria-pressed="${on}"
              data-action="sub" data-value="${id}">
              <span>${PLATFORMS[id].name}</span>
              <span>${on ? "Subscribed" : "Not subscribed"}</span>
            </button>`;
  }).join("");
}

function platformRows(movie) {
  return movie.on
    .map((id) => {
      const p = PLATFORMS[id];
      const subscribed = !!state.subs[id];
      return { p, subscribed, extra: subscribed ? 0 : p.price };
    })
    .sort((a, b) => a.extra - b.extra || a.p.price - b.p.price);
}

function releasedHTML(movie) {
  const rows = platformRows(movie);
  const covered = rows.filter((r) => r.subscribed).length;
  const cheapest = rows.slice().sort((a, b) => a.p.price - b.p.price)[0].p;

  const summary = covered > 0
    ? `You already subscribe to ${covered} of ${rows.length} platforms carrying this title, so you can watch with no extra spending.`
    : `Nothing you subscribe to carries this title. The cheapest way in is ${cheapest.name} at ₹${cheapest.price} per month.`;

  const rowsHTML = rows.map((r, i) => `
    <div class="row">
      <div class="rank">${i + 1}</div>
      <div class="row-info">
        <span class="row-name">${r.p.name}</span>
        ${i === 0 ? '<span class="tag tag-best">Best pick</span>' : ""}
        ${r.subscribed ? '<span class="tag tag-covered">Already covered</span>' : ""}
        <div class="muted small">${r.subscribed ? "Included in your current plan" : "Subscription needed"}</div>
      </div>
      <div class="row-price">
        <span class="price">${r.subscribed ? "₹0 extra" : "₹" + r.p.price}</span>
        <span class="muted small">${r.subscribed ? "you already pay" : "per month"}</span>
      </div>
      <a class="btn-link" href="${r.p.url}" target="_blank" rel="noopener">Watch on ${r.p.name}</a>
    </div>`).join("");

  return {
    inCard: `<div><span class="badge-ok">Available in India</span></div>
             <div class="summary">${summary}</div>`,
    after: `<div class="list-head">
              <h3>Available on, cheapest first</h3>
              <span class="muted small">Prices are per month</span>
            </div>${rowsHTML}`
  };
}

function upcomingHTML(movie) {
  const on = !!state.notified[movie.title];
  const action = on
    ? `<div class="notified">
         <div class="ok">You're on the list. We'll alert you the second it becomes available in India.</div>
         <button type="button" class="btn-cancel" data-action="notify">Cancel alert</button>
       </div>`
    : `<button type="button" class="btn-notify" data-action="notify">Notify me when it's available</button>`;

  return `<div class="upcoming">
            <span class="pill">NOT IN INDIA YET</span>
            <span class="muted small">Our best guess</span>
            <span class="big-date">${movie.estimate}</span>
            <span>Most likely on <b>${movie.estPlatform}</b></span>
            <p>It's already on streaming abroad, and ${movie.estPlatform} usually brings these over within a couple of months. This is an estimate, not a confirmed date.</p>
            ${action}
          </div>`;
}

function renderResult() {
  const box = $("result");

  if (state.loading) {
    box.innerHTML = `<div class="empty">
        <h2>Searching for “${state.query.trim()}”…</h2>
        <p class="muted">Fetching movie details and streaming options.</p>
      </div>`;
    return;
  }

  const movie = state.currentMovie;
  if (!movie) {
    box.innerHTML = `<div class="empty">
        <h2>Type a movie or show name</h2>
        <p class="muted">Search any title above or tap one of the quick movie pills.</p>
      </div>`;
    return;
  }

  const released = movie.on.length > 0;
  const parts = released ? releasedHTML(movie) : { inCard: "", after: upcomingHTML(movie) };

  box.innerHTML = `
    <div class="card movie">
      <h2>${movie.title}</h2>
      <p class="muted small">${movie.meta}</p>
      <p>${movie.overview}</p>
      ${parts.inCard}
    </div>
    ${released ? `<div style="display:flex;flex-direction:column;gap:12px">${parts.after}</div>` : parts.after}`;
}

function renderMood() {
  $("moodLine").textContent = MOODS[state.mood];
  $("moods").innerHTML = Object.keys(MOODS)
    .map((m) => chip(m, state.mood === m, "mood", m)).join("");

  const pool = [...MOVIES];
  if (
    state.currentMovie &&
    state.currentMovie.on.length > 0 &&
    !pool.some((m) => m.title.toLowerCase() === state.currentMovie.title.toLowerCase())
  ) {
    pool.push(state.currentMovie);
  }

  const matches = pool.filter((m) => m.moods.includes(state.mood));
  const list = matches.length > 0 ? matches : pool.slice(0, 3);

  $("recs").innerHTML = list.map((m) => {
    const out = m.on.length > 0;
    const from = out ? Math.min(...m.on.map((id) => PLATFORMS[id].price)) : 0;
    const status = out
      ? `Available in India, from ₹${from} per month`
      : `Not in India yet. Best guess: ${m.estimate} on ${m.estPlatform}.`;
    const statusClass = out ? "rec-status" : "rec-status--upcoming";
    return `<div class="rec">
              <h3>${m.title}</h3>
              <span class="muted small">${m.meta}</span>
              <span class="small ${statusClass}">${status}</span>
              <a class="btn-link" href="#result" data-action="rec" data-value="${m.title}">See details</a>
            </div>`;
  }).join("");
}

function render() {
  renderFloatingMovies();
  renderSubs();
  renderResult();
  renderMood();
}

// ===================== EVENTS =====================
function search() {
  state.query = $("searchInput").value;
  resolveSearch(state.query);
}

$("searchBtn").addEventListener("click", search);
$("searchInput").addEventListener("keydown", (e) => {
  if (e.key === "Enter") search();
});

document.addEventListener("click", (e) => {
  const el = e.target.closest("[data-action]");
  if (!el) return;
  const value = el.dataset.value;

  switch (el.dataset.action) {
    case "pick":
    case "rec":
      state.query = value;
      $("searchInput").value = value;
      resolveSearch(value);
      break;
    case "sub":
      state.subs[value] = !state.subs[value];
      render();
      break;
    case "mood":
      state.mood = value;
      renderMood();
      break;
    case "notify": {
      if (state.currentMovie) {
        state.notified[state.currentMovie.title] = !state.notified[state.currentMovie.title];
        renderResult();
      }
      break;
    }
  }
});

// Initial load
resolveSearch(state.query);