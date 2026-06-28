// =====================================================
// Digital Music Romania
// utils.js
// =====================================================

// =====================================================
// SHUFFLE ARRAY
// =====================================================

export function shuffle(array) {

    const arr = [...array];

    for (let i = arr.length - 1; i > 0; i--) {

        const j = Math.floor(Math.random() * (i + 1));

        [arr[i], arr[j]] = [arr[j], arr[i]];

    }

    return arr;

}

// =====================================================
// RANDOM SONGS
// =====================================================

export function randomSongs(songs, count = 10) {

    return shuffle(songs).slice(0, count);

}

// =====================================================
// RANDOM SONG
// =====================================================

export function randomSong(songs) {

    if (!songs.length) return null;

    return songs[
        Math.floor(Math.random() * songs.length)
    ];

}

// =====================================================
// UNIQUE ARTISTS
// =====================================================

export function uniqueArtists(songs) {

    return new Set(
        songs.map(song => song.artist)
    ).size;

}

// =====================================================
// FORMAT NUMBER
// =====================================================

export function formatNumber(number) {

    return new Intl.NumberFormat("ro-RO")
        .format(number);

}

// =====================================================
// LOADER
// =====================================================

export function showLoader() {

    const loader =
        document.getElementById("loader");

    if (loader) {

        loader.style.display = "flex";

    }

}

export function hideLoader() {

    const loader =
        document.getElementById("loader");

    if (loader) {

        loader.style.display = "none";

    }

}

// =====================================================
// SCROLL TOP
// =====================================================

export function scrollTopSmooth() {

    window.scrollTo({

        top: 0,

        behavior: "smooth"

    });

}

// =====================================================
// QR CODE
// =====================================================

export function generateQRCode(elementId, text) {

    const element =
        document.getElementById(elementId);

    if (!element) return;

    element.innerHTML = "";

    new QRCode(element, {

        text,

        width: 180,

        height: 180,

        correctLevel: QRCode.CorrectLevel.H

    });

}

// =====================================================
// DEBOUNCE
// =====================================================

export function debounce(callback, delay = 200) {

    let timer;

    return (...args) => {

        clearTimeout(timer);

        timer = setTimeout(() => {

            callback(...args);

        }, delay);

    };

}

// =====================================================
// FADE EFFECT
// =====================================================

export function fade(element) {

    if (!element) return;

    element.style.opacity = 0;

    setTimeout(() => {

        element.style.opacity = 1;

    }, 250);

}

// =====================================================
// IMAGE PRELOAD
// =====================================================

export function preloadImages(songs) {

    songs.forEach(song => {

        const img = new Image();

        img.src = song.cover;

    });

}

// =====================================================
// COPY TO CLIPBOARD
// =====================================================

export async function copy(text) {

    try {

        await navigator.clipboard.writeText(text);

        return true;

    }

    catch {

        return false;

    }

}