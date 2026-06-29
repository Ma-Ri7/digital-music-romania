import { sortSongs } from "./registry-sort.js";
import { updateStats } from "./registry-stats.js";
import { render, filterSongs } from "./catalog.js";
import {
    getSongs,
    setFilteredSongs
} from "./registry-store.js";


export function initSearch(songs) {

    const searchInput = document.getElementById("registry-search");
    const resultsCounter = document.getElementById("visible-results");

    if (!searchInput) return;

    searchInput.addEventListener("input", () => {

        const value = searchInput.value.trim();

        const filteredSongs =
            value === ""
                ? [...songs]
                : filterSongs(songs, value);
                setFilteredSongs(filteredSongs);
        updateStats(songs, filteredSongs.length);
        

        const sortSelect = document.getElementById("sort-select");

const sortedSongs = sortSongs(
    filteredSongs,
    sortSelect ? sortSelect.value : "newest"
);

render(sortedSongs);

    });

}