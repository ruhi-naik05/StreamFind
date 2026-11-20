// ===================== DEMO DATA =====================
// In your real project, this comes from your Flask backend (TMDB API).
// Example: fetch("/api/search?q=" + query).then(r => r.json())

const PLATFORMS = {
  netflix: { name: "Netflix",     price: 199, url: "https://www.netflix.com" },
  prime:   { name: "Prime Video", price: 149, url: "https://www.primevideo.com" },
  hotstar: { name: "JioHotstar",  price: 149, url: "https://www.hotstar.com" },
  zee5:    { name: "ZEE5",        price: 99,  url: "https://www.zee5.com" },
  sonyliv: { name: "SonyLIV",     price: 99,  url: "https://www.sonyliv.com" }
};

// on: [] means NOT released in India yet -> shows the estimate + notify card
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
  "Northern Lights",
  "Midnight Ferry"
];

const MOODS = {
  Happy:    "Light, feel-good picks.",
  Sad:      "For a good cry or a heart-to-heart.",
  Excited:  "Fast, edge-of-your-seat picks.",
  Relaxed:  "Calm and easy watching.",
  Romantic: "Sweet stories for a cosy night."
};

// ===================== STATE =====================
const state = {
  query: "Monsoon Express",
  mood: "Happy",
  subs: { prime: true },   // platforms the user already subscribes to
  notified: {}             // movies the user wants alerts for
};

const $ = (id) => document.getElementById(id);

// ===================== HELPERS =====================
function findMovie() {
  const q = state.query.trim().toLowerCase();
  if (!q) return null;
  return MOVIES.find((m) => m.title.toLowerCase().includes(q));
}

function chip(label, active, action, value) {
  return `<button type="button" class="chip ${active ? "active" : ""}"
            aria-pressed="${active}" data-action="${action}" data-value="${value}">${label}</button>`;
}

// ===================== RENDER =====================
function renderFloatingMovies() {
  const activeMovie = findMovie();
  $("floatingMovies").innerHTML = FLOATING_MOVIES.map((title) => {
    const isActive = activeMovie && activeMovie.title === title;
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

// Platform rows: cheapest first. Already-subscribed platforms cost 0 extra.
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
  const movie = findMovie();
  const box = $("result");

  if (!movie) {
    box.innerHTML = `<div class="empty">
        <h2>No match for “${state.query}”</h2>
        <p class="muted">Check the spelling or tap one of the movie pills above.</p>
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

  $("recs").innerHTML = MOVIES.filter((m) => m.moods.includes(state.mood)).map((m) => {
    const out = m.on.length > 0;
    const from = out ? Math.min(...m.on.map((id) => PLATFORMS[id].price)) : 0;
    const status = out
      ? `Available in India, from ₹${from} per month`
      : `Not in India yet. Best guess: ${m.estimate} on ${m.estPlatform}.`;
    return `<div class="rec">
              <h3>${m.title}</h3>
              <span class="muted small">${m.meta}</span>
              <span class="small">${status}</span>
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
  render();
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
      break;
    case "sub":
      state.subs[value] = !state.subs[value];
      break;
    case "mood":
      state.mood = value;
      break;
    case "notify": {
      const movie = findMovie();
      if (movie) state.notified[movie.title] = !state.notified[movie.title];
      break;
    }
  }
  render();
});

render();