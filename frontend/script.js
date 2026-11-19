// =====================================================
// 1. DATA  (demo data - replace with your backend later)
// =====================================================

// Monthly price of each platform in rupees
const PRICES = {
  "Netflix": 199,
  "Prime Video": 299,
  "JioHotstar": 149,
  "Apple TV+": 99,
  "Zee5": 99,
  "SonyLIV": 299,
};

// Which movies are on which platforms
const MOVIES = {
  "interstellar":   { title: "Interstellar",   year: 2014, platforms: ["JioHotstar", "Prime Video"] },
  "inception":      { title: "Inception",      year: 2010, platforms: ["Netflix", "Prime Video"] },
  "dune: part two": { title: "Dune: Part Two", year: 2024, platforms: ["Prime Video", "Apple TV+"] },
  "oppenheimer":    { title: "Oppenheimer",    year: 2023, platforms: ["JioHotstar"] },
};

// Mood picks: each mood has a few movies, each with ONE platform
const MOODS = {
  "Feel-good": [
    { title: "Spirited Away", year: 2001, platform: "Netflix" },
    { title: "The Intern",    year: 2015, platform: "Netflix" },
    { title: "Chhichhore",    year: 2019, platform: "JioHotstar" },
    { title: "Paddington 2",  year: 2017, platform: "Prime Video" },
  ],
  "Edge of my seat": [
    { title: "Drishyam",   year: 2015, platform: "Prime Video" },
    { title: "Andhadhun",  year: 2018, platform: "Netflix" },
    { title: "Tumbbad",    year: 2018, platform: "Prime Video" },
  ],
  "Mind-bending": [
    { title: "Inception",    year: 2010, platform: "Netflix" },
    { title: "Interstellar", year: 2014, platform: "JioHotstar" },
    { title: "Dark Matter",  year: 2024, platform: "Apple TV+" },
  ],
  "Make me cry": [
    { title: "Taare Zameen Par", year: 2007, platform: "JioHotstar" },
    { title: "Coco",             year: 2017, platform: "JioHotstar" },
    { title: "Masaan",           year: 2015, platform: "Netflix" },
  ],
};

// =====================================================
// 2. STATE  (things that change while using the page)
// =====================================================
let myPlatforms = ["Netflix"];   // platforms the user has switched on
let currentMovie = null;         // movie currently shown in the result
let currentMood = "Feel-good";   // mood currently selected

// =====================================================
// 3. GRAB ELEMENTS FROM THE HTML
// =====================================================
const searchInput   = document.getElementById("searchInput");
const searchBtn     = document.getElementById("searchBtn");
const quickPicks    = document.getElementById("quickPicks");
const resultBox     = document.getElementById("result");
const moodChips     = document.getElementById("moodChips");
const moodCards     = document.getElementById("moodCards");
const platformChips = document.getElementById("platformChips");

// =====================================================
// 4. HELPER: make a chip button
// =====================================================
function makeChip(text, isOn, onClick) {
  const btn = document.createElement("button");
  btn.className = "chip" + (isOn ? " on" : "");
  btn.textContent = text;
  btn.addEventListener("click", onClick);
  return btn;
}

// =====================================================
// 5. FIND A MOVIE
// =====================================================
// Right now this uses the demo data above.
// To use YOUR backend, swap the body of this function for something like:
//
//   const res = await fetch("http://localhost:3000/api/search?title=" + encodeURIComponent(title));
//   return await res.json();   // must look like { title, year, platforms: ["Netflix", ...] }
//
async function findMovie(title) {
  return MOVIES[title.trim().toLowerCase()] || null;
}

// =====================================================
// 6. SHOW THE SEARCH RESULT
// =====================================================
async function search(title) {
  currentMovie = await findMovie(title);
  showResult();
}

function showResult() {
  // Nothing searched yet
  if (!currentMovie && !searchInput.value) { resultBox.innerHTML = ""; return; }

  // Movie not found
  if (!currentMovie) {
    resultBox.innerHTML = '<p class="note"></p>';
    resultBox.querySelector(".note").textContent =
      "No data for \"" + searchInput.value + "\" yet. Try one of the movies above.";
    return;
  }

  // Sort the platforms: cheapest first
  const sorted = [...currentMovie.platforms].sort((a, b) => PRICES[a] - PRICES[b]);

  // Which of those does the user already have?
  const owned = sorted.filter(name => myPlatforms.includes(name));

  // Write the message
  let message;
  if (owned.length > 0) {
    message = "Good news! You can watch it on " + owned.join(" or ") + " right now.";
  } else {
    message = "Not on your platforms. Cheapest way to watch: " + sorted[0] + " at ₹" + PRICES[sorted[0]] + "/mo.";
  }

  // Build the HTML
  let html = `<h2 class="movie-title">${currentMovie.title} <small>${currentMovie.year}</small></h2>`;
  html += `<p class="note">${message}</p>`;

  sorted.forEach((name, index) => {
    const isMine = myPlatforms.includes(name) ? " mine" : "";
    const stamp = index === 0 ? '<span class="stamp">Cheapest</span>' : "";
    html += `
      <div class="ticket${isMine}">
        <h3>${name}${stamp}</h3>
        <div class="price">₹${PRICES[name]}<small>/mo</small></div>
      </div>`;
  });

  resultBox.innerHTML = html;
}

// =====================================================
// 7. MOOD PICKS
// =====================================================
function showMoods() {
  // Mood buttons
  moodChips.innerHTML = "";
  Object.keys(MOODS).forEach(mood => {
    moodChips.appendChild(makeChip(mood, mood === currentMood, () => {
      currentMood = mood;
      showMoods();
    }));
  });

  // Only movies on platforms the user has
  const picks = MOODS[currentMood].filter(m => myPlatforms.includes(m.platform));

  if (picks.length === 0) {
    moodCards.innerHTML = '<p class="empty">Nothing here for your platforms. Switch one on below.</p>';
    return;
  }

  moodCards.innerHTML = picks.map(m => `
    <div class="film-card">
      <span class="year">${m.year}</span>
      <h3>${m.title}</h3>
      <span>On ${m.platform}</span>
    </div>`).join("");
}

// =====================================================
// 8. PLATFORM BAR ("I have ...")
// =====================================================
function showPlatforms() {
  platformChips.innerHTML = "";
  Object.keys(PRICES).forEach(name => {
    const isOn = myPlatforms.includes(name);
    platformChips.appendChild(makeChip(name, isOn, () => {
      // add or remove this platform
      if (isOn) {
        myPlatforms = myPlatforms.filter(p => p !== name);
      } else {
        myPlatforms.push(name);
      }
      showPlatforms();
      showResult();   // update the message in the result
      showMoods();    // update the mood picks
    }));
  });
}

// =====================================================
// 9. START EVERYTHING
// =====================================================
// Quick-pick buttons under the search box
Object.values(MOVIES).forEach(movie => {
  quickPicks.appendChild(makeChip(movie.title, false, () => {
    searchInput.value = movie.title;
    search(movie.title);
  }));
});

// Search button + Enter key
searchBtn.addEventListener("click", () => search(searchInput.value));
searchInput.addEventListener("keydown", event => {
  if (event.key === "Enter") search(searchInput.value);
});

showPlatforms();
showMoods();
search(searchInput.value);   // show Interstellar on first load