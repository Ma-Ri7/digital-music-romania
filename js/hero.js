// =====================================================
// Digital Music Romania
// hero.js
// =====================================================

let heroSongs = [];
let current = 0;
let interval = null;

// =====================================================
// LOAD HERO
// =====================================================

export function loadHero(songs){

    if(!songs || songs.length === 0) return;

    heroSongs = songs;

    current = 0;

    showSong(heroSongs[current]);

    if(interval){

        clearInterval(interval);

    }

    interval = setInterval(nextSong,7000);

}

// =====================================================
// NEXT
// =====================================================

function nextSong(){

    current++;

    if(current >= heroSongs.length){

        current = 0;

    }

    showSong(heroSongs[current]);

}

// =====================================================
// SHOW
// =====================================================

function showSong(song){

    const image = document.getElementById("hero-image");
    const title = document.getElementById("hero-song");
    const artist = document.getElementById("hero-artist");

    if(!image || !title || !artist) return;

    fadeOut(image);
    fadeOut(title);
    fadeOut(artist);

    setTimeout(()=>{

        image.src = song.cover;

        image.alt = song.title;

        title.textContent = song.title;

        artist.textContent = song.artist;

        fadeIn(image);
        fadeIn(title);
        fadeIn(artist);

    },300);

}

// =====================================================
// EFFECTS
// =====================================================

function fadeOut(element){

    element.style.opacity = 0;

}

function fadeIn(element){

    element.style.opacity = 1;

}