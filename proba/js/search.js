// =====================================================
// Digital Music Romania
// search.js
// =====================================================

import { filterSongs, render } from "./catalog.js";

// =====================================================
// INIT SEARCH
// =====================================================

export function initSearch() {

    const searchBox = document.getElementById("searchBox");

    if (!searchBox) return;

    // Dacă există ?search= în URL
    const params = new URLSearchParams(window.location.search);
    const search = params.get("search");

    if (search) {

        searchBox.value = search;

    }

    let debounce;

    searchBox.addEventListener("input", () => {

        clearTimeout(debounce);

        debounce = setTimeout(() => {

            const value = searchBox.value.trim();

            const results = filterSongs(value);

            render(results);

            updateUrl(value);

        }, 150);

    });

    // ENTER nu reîncarcă pagina
    searchBox.addEventListener("keydown", (event) => {

        if (event.key === "Enter") {

            event.preventDefault();

        }

    });

}

// =====================================================
// URL
// =====================================================

function updateUrl(value) {

    if (value === "") {

        history.replaceState(
            {},
            "",
            window.location.pathname
        );

        return;

    }

    history.replaceState(
        {},
        "",
        "?search=" + encodeURIComponent(value)
    );

}