// =====================================================
// Digital Music Romania
// catalog.js
// =====================================================

let allSongs = [];
let container;

// =====================================================
// LOAD
// =====================================================

export function loadCatalog(songs) {

    allSongs = songs;

    container = document.getElementById("songs-container");

    if (!container) return;

    const params = new URLSearchParams(window.location.search);
    const search = params.get("search");

    if (search && search.trim() !== "") {

        render(filterSongs(search));

    } else {

        render(allSongs);

    }

}

// =====================================================
// FILTER
// =====================================================

export function filterSongs(value) {

    value = value.toLowerCase();

    return allSongs.filter(song =>

        song.title.toLowerCase().includes(value) ||

        song.artist.toLowerCase().includes(value) ||

        song.isrc.toLowerCase().includes(value) ||

        (song.inscription || "").toLowerCase().includes(value)

    );

}

// =====================================================
// RENDER
// =====================================================

export function render(list) {

    container.innerHTML = "";

    if (!list.length) {

        container.innerHTML = `

            <div class="no-results">

                <h2>No results found</h2>

                <p>Try another title, artist or ISRC.</p>

            </div>

        `;

        return;

    }

    list.forEach(song => {

        container.appendChild(createCard(song));

    });

}
// =====================================================
// CREATE CARD
// =====================================================

function createCard(song) {

    const card = document.createElement("a");

    card.className = "registry-card";

    card.href = `certificari/?search=${encodeURIComponent(song.isrc)}`;

    card.innerHTML = `

        <div class="registry-status">
            ✓ VERIFIED
        </div>

        <img
            class="registry-cover"
            src="${song.cover}"
            alt="${song.title}">

        <div class="registry-content">

            <h3>${song.title}</h3>

            <p class="registry-artist">
                ${song.artist}
            </p>

            <div class="registry-isrc">

                <span>ISRC</span>

                <strong>${song.isrc}</strong>

            </div>

            <div class="registry-footer">

                <span class="registry-network">
                    Bitcoin SV Blockchain
                </span>

                <span class="registry-open">
                    View Certificate →
                </span>

            </div>

        </div>

    `;

    return card;

}