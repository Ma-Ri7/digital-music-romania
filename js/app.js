// =====================================================
// Digital Music Romania
// app.js
// =====================================================

import { loadHero } from "./hero.js";
import { loadLatest } from "./latest.js";
import { loadCarousel } from "./carousel.js";
import { loadCatalog } from "./catalog.js";
import { initSearch } from "./search.js";

import {
    initAnimations,
    initHeroParallax,
    autoHideHeader,
    rippleButtons,
    glowVerified
} from "./animations.js";

let songs = [];

// =====================================================
// START
// =====================================================

document.addEventListener("DOMContentLoaded", init);

// =====================================================

async function init() {

    showLoader();

    try {

        const response = await fetch("data.json");

        if (!response.ok) {

            throw new Error("Nu s-a putut încărca data.json");

        }

        const data = await response.json();

        songs = data.songs || [];

        if (!songs.length) {

            throw new Error("Catalog gol.");

        }

        // ==========================
        // LATEST RELEASE
        // ==========================

        loadLatest(songs[0]);

        // ==========================
        // HERO
        // ==========================

        loadHero(randomSongs(8));

        // ==========================
        // RECOMMENDED
        // ==========================

        loadCarousel(randomSongs(10));

        // ==========================
        // CATALOG
        // ==========================

        loadCatalog(songs);

        // ==========================
        // SEARCH
        // ==========================

        initSearch();

        // ==========================
        // STATS
        // ==========================

        updateStats();

        // ==========================
        // ANIMATIONS
        // ==========================

        initAnimations();

        initHeroParallax();

        autoHideHeader();

        rippleButtons();

        glowVerified();

    }

    catch(error){

        console.error(error);

        const container =
            document.getElementById("songs-container");

        if(container){

            container.innerHTML = `

                <div class="no-results">

                    <h2>⚠ Catalog indisponibil</h2>

                    <p>
                        Nu s-a putut încărca fișierul data.json.
                    </p>

                </div>

            `;

        }

    }

    finally{

        hideLoader();

    }

}

// =====================================================
// RANDOM SONGS
// =====================================================

function randomSongs(number){

    const shuffled = [...songs];

    shuffled.sort(() => Math.random() - 0.5);

    return shuffled.slice(0, number);

}

// =====================================================
// STATS
// =====================================================

function updateStats(){

    const totalSongs =
        document.getElementById("totalSongs");

    const totalArtists =
        document.getElementById("totalArtists");

    if(totalSongs){

        totalSongs.textContent = songs.length;

    }

    if(totalArtists){

        totalArtists.textContent =
            new Set(
                songs.map(song => song.artist)
            ).size;

    }

}

// =====================================================
// LOADER
// =====================================================

function showLoader(){

    const loader = document.getElementById("loader");

    if(loader){

        loader.style.display = "flex";

    }

}

function hideLoader(){

    const loader = document.getElementById("loader");

    if(loader){

        loader.style.display = "none";

    }

}

// =====================================================

export { songs };