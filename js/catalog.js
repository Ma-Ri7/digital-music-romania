// =====================================================
// Digital Music Romania
// catalog.js
// Premium Registry Edition
// =====================================================

let allSongs = [];
let container;

// =====================================================
// LOAD CATALOG
// =====================================================

export function loadCatalog(songs) {

    allSongs = songs;
    container = document.getElementById("songs-container");

    if (!container) return;

    const params = new URLSearchParams(window.location.search);
    const search = params.get("search");

    if (search && search.trim() !== "") {

        const filtered = filterSongs(search);
        render(filtered);

    } else {

        render(allSongs);

    }

}

// =====================================================
// FILTER
// =====================================================

export function filterSongs(value) {

    value = value.toLowerCase().trim();

    return allSongs.filter(song =>

        song.title.toLowerCase().includes(value) ||

        song.artist.toLowerCase().includes(value) ||

        song.isrc.toLowerCase().includes(value) ||

        song.inscription.toLowerCase().includes(value)

    );

}

// =====================================================
// RENDER
// =====================================================

export function render(list) {

    container.innerHTML = "";

    container.classList.remove("single-result");

    if (list.length === 0) {

        container.innerHTML = `

            <div class="no-results">

                <h2>No Blockchain Record Found</h2>

                <p>
                    No music certificate matches your search.
                </p>

            </div>

        `;

        return;

    }

    if (list.length === 1) {

        container.classList.add("single-result");

        container.appendChild(createRegistryCard(list[0]));

        return;

    }

    list.forEach(song => {

        container.appendChild(createCatalogCard(song));

    });

}
// =====================================================
// CATALOG CARD
// =====================================================

function createCatalogCard(song) {

    const card = document.createElement("div");

    card.className = "registry-card";

    card.innerHTML = `

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

                <a
                    class="registry-open"
                    href="certificari/?search=${encodeURIComponent(song.isrc)}">

                    View Certificate →

                </a>

            </div>

        </div>

    `;

    return card;

}

// =====================================================
// SINGLE REGISTRY CARD
// =====================================================

function createRegistryCard(song) {

    const card = document.createElement("div");

    card.className = "registry-card registry-single";

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

                <a
                    class="registry-open"
                    href="certificari/?search=${encodeURIComponent(song.isrc)}">

                    Open Certificate →

                </a>

            </div>

        </div>

    `;

    return card;

}

// =====================================================
// UTILITIES
// =====================================================

export function refreshCatalog() {

    const params = new URLSearchParams(window.location.search);
    const search = params.get("search");

    if (search && search.trim() !== "") {

        render(filterSongs(search));

    } else {

        render(allSongs);

    }

}

// =====================================================
// END
// =====================================================