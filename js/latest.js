// =====================================================
// Digital Music Romania
// latest.js
// =====================================================

import { t } from "./i18n/runtime.js";

// =====================================================
// LOAD LATEST RELEASE
// =====================================================

export function loadLatest(song){

    if(!song) return;

    const cover = document.getElementById("latest-cover");
    const title = document.getElementById("latest-title");
    const artist = document.getElementById("latest-artist");
    const listen = document.getElementById("listen-latest");
    const verify = document.getElementById("verify-latest");
    const pushfm = "https://push.fm/fl/" + encodeURIComponent(song.isrc);

    if(cover){

        cover.src = song.cover;
        cover.alt = song.title;

    }

    if(title){

        title.textContent = song.title;

    }

    if(artist){

        artist.textContent = song.artist;

    }

    const description = document.querySelector(".latest-description");

    if(description){

        description.textContent =
            song.description ||
            t("latest.descriptionFallback");

    }

    const platforms = [
    "spotify-link",
    "apple-link",
    "youtube-link",
    "amazon-link",
    "deezer-link"
];

platforms.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
        el.href = pushfm;
    }
});

    if(listen){

        // dacă vei adăuga în data.json un câmp "listen_url"
        // îl va folosi automat
        //listen.href = song.listen_url || "#";

        listen.href = pushfm;

    }

    if(verify){

        verify.href = "certificari/?search=" + encodeURIComponent(song.isrc);

    }

}