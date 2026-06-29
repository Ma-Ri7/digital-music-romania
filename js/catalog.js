// =====================================================
// Digital Music Romania
// catalog.js
// Premium Registry Edition
// =====================================================

let allSongs = [];
let container;
import {
    createCatalogCard,
    createRegistryCard
} from "./cards.js";

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

        const filtered = filterSongs(allSongs, search);
        render(filtered.slice(0, 24));

    } else {

        render(allSongs.slice(0, 24));

    }

}

// =====================================================
// FILTER
// =====================================================

export function filterSongs(list, value) {

    value = value.toLowerCase().trim();

    return list.filter(song =>

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
export function setContainer(element) {
    container = element;
}



// =====================================================
// UTILITIES
// =====================================================

export function refreshCatalog() {

    const params = new URLSearchParams(window.location.search);

    const search = params.get("search");
    

    if (search && search.trim() !== "") {

        render(filterSongs(allSongs, search));

    } else {

        render(allSongs);

    }

}

// =====================================================
// END
// =====================================================