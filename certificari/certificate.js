// =======================================================
// Digital Music Romania
// certificari/certificate.js
// PARTEA 1 / 3
// =======================================================

document.addEventListener("DOMContentLoaded", init);

async function init() {

    const container = document.getElementById("certificate-container");

    try {

        // ==========================================
        // Parametru URL
        // ==========================================

        const params = new URLSearchParams(window.location.search);
        const search = params.get("search");

        if (!search) {

            container.innerHTML = `
                <div class="card">
                    <div class="card-content">
                        <h2>Nu a fost specificat niciun ISRC.</h2>
                    </div>
                </div>
            `;

            return;
        }

        // ==========================================
        // Încarcă data.json
        // ==========================================

        const response = await fetch("../data.json");

        if (!response.ok) {
            throw new Error("Nu s-a putut încărca data.json");
        }

        const data = await response.json();

        // ==========================================
        // Caută melodia
        // ==========================================

        const song = data.songs.find(item =>
            item.isrc.trim().toLowerCase() ===
            search.trim().toLowerCase()
        );

        if (!song) {

            container.innerHTML = `
                <div class="card">
                    <div class="card-content">
                        <h2>Certificatul nu a fost găsit.</h2>
                    </div>
                </div>
            `;

            return;
        }

        // ==========================================
        // Titlu pagină
        // ==========================================

        document.title = `${song.title} | Blockchain Certificate`;

        // ==========================================
        // Date certificat
        // ==========================================

        const certificateNumber =
            `DMR-${new Date().getFullYear()}-${song.isrc}`;

        

        // ==========================================
        // Construire certificat
        // ==========================================

        container.innerHTML = `
        <div class="card">

    <div class="certificate-title">
    <div class="card-top-line"></div>

        <h1>BLOCKCHAIN CERTIFICATE</h1>

        <span class="certificate-subtitle">

Official Music Registration

</span>

<p class="certificate-powered">

Powered by Bitcoin SV Blockchain

</p>

        <div class="certificate-number">

            Certificate No.

            <strong>${certificateNumber}</strong>

        </div>

    </div>

    <div class="single-badge">

    <i class="fa-solid fa-shield-halved"></i>

    VERIFIED ON BITCOIN SV BLOCKCHAIN

</div>

    <img
        src="../${song.cover}"
        alt="${song.title}">
        <div class="gold-divider"></div>

    <div class="card-content">

        <h2>${song.title}</h2>

        <p class="artist">${song.artist}</p>

        <div class="single-meta">

            <div class="meta-row">

                <strong>ISRC</strong>

                <span>${song.isrc}</span>

            </div>

            <div class="meta-row">

                <strong>UPC</strong>

                <span>${song.upc}</span>

            </div>

        </div>

        <div class="hash-box">

            <h3>Blockchain Hash</h3>

            <small>${song.inscription}</small>

        </div>

        <div class="certificate-info">

    <div class="info-item">
        <span>Registry</span>
        <strong>Digital Music Romania</strong>
    </div>

    <div class="info-item">
        <span>Status</span>
        <strong>Blockchain Verified</strong>
    </div>

    <div class="info-item">
        <span>Network</span>
        <strong>Bitcoin SV</strong>
    </div>

</div>

        <div class="single-description">

            ${song.description || ""}

        </div>

        <div class="qr-grid">

            <div>

                <h3>Verify Blockchain</h3>

                <div class="qr-wrapper">

                    <div id="qr-blockchain"></div>

                </div>

            </div>

            <div>

    <h3>Listen</h3>

    <div class="qr-wrapper">

        <div id="qr-stream"></div>

    </div>

    <div class="available-on">

        <span>AVAILABLE ON</span>

        <div class="platform-icons">

            <a href="https://push.fm/fl/${encodeURIComponent(song.isrc)}"
               target="_blank"
               aria-label="Spotify">
                <i class="fa-brands fa-spotify"></i>
            </a>

            <a href="https://push.fm/fl/${encodeURIComponent(song.isrc)}"
               target="_blank"
               aria-label="Apple Music">
                <i class="fa-brands fa-apple"></i>
            </a>

            <a href="https://push.fm/fl/${encodeURIComponent(song.isrc)}"
               target="_blank"
               aria-label="YouTube Music">
                <i class="fa-brands fa-youtube"></i>
            </a>

            <a href="https://push.fm/fl/${encodeURIComponent(song.isrc)}"
               target="_blank"
               aria-label="Amazon Music">
                <i class="fa-brands fa-amazon"></i>
            </a>

            <a href="https://push.fm/fl/${encodeURIComponent(song.isrc)}"
               target="_blank"
               aria-label="Deezer">
                <i class="fa-brands fa-deezer"></i>
            </a>

        </div>

    </div>

</div>


        </div>
        <div class="certificate-signature">

    <div class="signature-line"></div>

    <h3>Certified by</h3>

    <h2>Digital Music Romania</h2>

    <p class="signature-subtitle">
        Official Blockchain Music Registry
    </p>

    <p class="signature-text">
        This certificate confirms that this musical work has been
        permanently registered on the Bitcoin SV Blockchain and can be
        independently verified using the Blockchain QR Code provided above.
    </p>

    <div class="signature-status">
        ✓ VERIFIED ON BITCOIN SV BLOCKCHAIN
    </div>

</div>


       <div class="card-buttons">

    <a
        class="btn-action btn-listen"
        href="https://push.fm/fl/${encodeURIComponent(song.isrc)}"
        target="_blank">

        <i class="fa-solid fa-play"></i>

        Listen

    </a>

    <a
        class="btn-action btn-chain"
        href="${window.location.origin}/i/?song=${encodeURIComponent(song.id)}"
        target="_blank">

        <i class="fa-solid fa-shield-halved"></i>

            View Blockchain Inscription


    </a>

    <a
    class="btn-action btn-home"
    href="../registry.html">

    <i class="fa-solid fa-house"></i>

    Music Registry

</a>

    <button
        id="share-btn"
        class="btn-action btn-share">

        <i class="fa-solid fa-share-nodes"></i>

        Share

    </button>

    <button
        id="print-btn"
        class="btn-action btn-print">

        <i class="fa-solid fa-file-pdf"></i>

        PDF

    </button>

</div>


        <div class="certificate-footer">

            <div class="footer-copy">

                © 2026 Digital Music Romania
            </div>
        </div>

    </div>

</div>

`;

        // ==========================================
        // QR Code - Blockchain
        // ==========================================

        const blockchainQR = document.getElementById("qr-blockchain");

        blockchainQR.innerHTML = "";

        new QRCode(blockchainQR, {
    text: window.location.origin + "/i/?song=" + encodeURIComponent(song.id),
    width: 400,
    height: 400,
    colorDark: "#000000",
    colorLight: "#ffffff",
    correctLevel: QRCode.CorrectLevel.M
});

        // ==========================================
        // QR Code - Streaming
        // ==========================================

        const streamQR = document.getElementById("qr-stream");

        streamQR.innerHTML = "";

        new QRCode(streamQR, {
    text: "https://push.fm/fl/" + encodeURIComponent(song.isrc),
    width: 300,
    height: 300,
    colorDark: "#000000",
    colorLight: "#ffffff",
    correctLevel: QRCode.CorrectLevel.H
});

        // ==========================================
        // Share
        // ==========================================

        document
            .getElementById("share-btn")
            .addEventListener("click", async () => {

                const url = window.location.href;

                if (navigator.share) {

                    try {

                        await navigator.share({
                            title: song.title,
                            text: "Blockchain Certificate",
                            url
                        });

                    } catch (err) {
                        console.log(err);
                    }

                } else {

                    await navigator.clipboard.writeText(url);

                    alert("Link-ul certificatului a fost copiat.");

                }

            });

        // ==========================================
        // Print
        // ==========================================

        document
            .getElementById("print-btn")
            .addEventListener("click", () => {

                window.print();

            });

    } catch (error) {

        console.error(error);

        container.innerHTML = `

            <div class="card">

                <div class="card-content">

                    <h2>Eroare la încărcarea certificatului</h2>

                    <p>${error.message}</p>

                </div>

            </div>

        `;

    }

}