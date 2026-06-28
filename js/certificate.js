// =====================================================
// Digital Music Romania
// certificate.js
// =====================================================

import { generateSongQR } from "./qrcode.js";

let songs = [];
let currentSong = null;

// =====================================================
// INIT
// =====================================================

export async function initCertificate() {

    try {

        const response = await fetch("../data.json");

        const data = await response.json();

        songs = data.songs;

        loadFromUrl();

    }

    catch(error){

        console.error(error);

    }

}

// =====================================================
// LOAD FROM URL
// =====================================================

function loadFromUrl(){

    const params = new URLSearchParams(window.location.search);

    const search = params.get("search");

    if(!search){

        showNotFound();

        return;

    }

    currentSong = songs.find(song =>

        song.isrc.toLowerCase() === search.toLowerCase()

    );

    if(!currentSong){

        showNotFound();

        return;

    }

    renderCertificate(currentSong);

}

// =====================================================
// RENDER
// =====================================================

function renderCertificate(song){

    document.title =
        song.title + " | Blockchain Certificate";

    const cover =
        document.getElementById("cover");

    const title =
        document.getElementById("title");

    const artist =
        document.getElementById("artist");

    const isrc =
        document.getElementById("isrc");

    const upc =
        document.getElementById("upc");

    const hash =
        document.getElementById("hash");

    const description =
        document.getElementById("description");

    const blockchain =
        document.getElementById("blockchain");

    cover.src = song.cover;

    cover.alt = song.title;

    title.textContent = song.title;

    artist.textContent = song.artist;

    isrc.textContent = song.isrc;

    upc.textContent = song.upc;

    hash.textContent = song.inscription;

    description.textContent =
        song.description || "";

    blockchain.href =
        song.blockchain_url;

    setTimeout(() => {

        generateSongQR(song);

    },100);

}

// =====================================================
// NOT FOUND
// =====================================================

function showNotFound(){

    document.body.innerHTML = `

        <div
            style="
                min-height:100vh;
                display:flex;
                justify-content:center;
                align-items:center;
                flex-direction:column;
                background:#111;
                color:white;
                font-family:Arial;
            ">

            <h1>

                Certificatul nu există

            </h1>

            <p>

                ISRC-ul solicitat nu a fost găsit.

            </p>

        </div>

    `;

}

// =====================================================
// SHARE
// =====================================================

export async function shareCertificate(){

    if(!currentSong) return;

    const url =
        window.location.href;

    if(navigator.share){

        await navigator.share({

            title:currentSong.title,

            text:"Blockchain Certificate",

            url

        });

        return;

    }

    await navigator.clipboard.writeText(url);

    alert("Link copiat.");

}

// =====================================================
// DOWNLOAD QR
// =====================================================

export function downloadQR(){

    const canvas =
        document.querySelector("#qr-single canvas");

    if(!canvas) return;

    const link =
        document.createElement("a");

    link.download =
        currentSong.isrc + ".png";

    link.href =
        canvas.toDataURL("image/png");

    link.click();

}

// =====================================================
// OPEN PUSH.FM
// =====================================================

export function openStreaming(){

    if(!currentSong) return;

    window.open(

        "https://push.fm/fl/" +

        encodeURIComponent(currentSong.isrc),

        "_blank"

    );

}