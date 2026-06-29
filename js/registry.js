import { initPreview } from "./certificate-preview.js";
import { initBackToTop } from "./backtotop.js";
import { initSort } from "./registry-sort.js";
import { sortSongs } from "./registry-sort.js";
import { updateStats } from "./registry-stats.js";
import { initSearch } from "./registry-search.js";
import { loadSongs } from "./registry-loader.js";
import {
    setContainer,
    render,
    filterSongs
} from "./catalog.js";

import {
    setSongs,
    getSongs
} from "./registry-store.js";

async function init() {

    try {

        const songs = await loadSongs();

        setSongs(songs);

        updateStats(songs);

        const container = document.getElementById("songs-container");

        setContainer(container);

        render(songs);

        initSearch(songs);

        initSort();

        initBackToTop();

        initPreview();

        console.log("Registry loaded.");

    }
    catch (error) {

        console.error(error);

    }

}

init();