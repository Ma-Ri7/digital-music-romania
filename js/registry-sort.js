import { render } from "./catalog.js";
import { getFilteredSongs } from "./registry-store.js";

export function sortSongs(list, mode) {

    const sorted = [...list];

    switch (mode) {

        case "title-asc":
            sorted.sort((a, b) => a.title.localeCompare(b.title));
            break;

        case "title-desc":
            sorted.sort((a, b) => b.title.localeCompare(a.title));
            break;

        case "artist-asc":
            sorted.sort((a, b) => a.artist.localeCompare(b.artist));
            break;

        case "artist-desc":
            sorted.sort((a, b) => b.artist.localeCompare(a.artist));
            break;

        case "oldest":
            sorted.reverse();
            break;

        case "newest":
        default:
            break;

    }

    return sorted;

}

export function initSort() {

    const sortSelect = document.getElementById("sort-select");

    if (!sortSelect) return;

    sortSelect.addEventListener("change", () => {

        render(
            sortSongs(
                getFilteredSongs(),
                sortSelect.value
            )
        );

    });

}