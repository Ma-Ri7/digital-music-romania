// =======================================================
// Digital Music Romania
// certificari/certificate.js
// =======================================================

document.addEventListener("DOMContentLoaded", init);

async function init() {

    const container = document.getElementById("certificate-container");

    try {

        // ===========================
        // Parametru URL
        // ===========================

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

        // ===========================
        // Încarcă data.json
        // ===========================

        const response = await fetch("../data.json");

        if (!response.ok) {
            throw new Error("Nu s-a putut încărca data.json");
        }

        const data = await response.json();

        const song = data.songs.find(item =>
            item.isrc.trim().toLowerCase() === search.trim().toLowerCase()
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

        document.title = `${song.title} | Blockchain Certificate`;
        const certificateNumber =
        `DMR-${new Date().getFullYear()}-${song.isrc}`;

        const issueDate = new Date().toLocaleDateString("ro-RO", {
    year: "numeric",
    month: "long",
    day: "numeric"
});

        // ===========================
        // Certificat
        // ===========================

        container.innerHTML = `

<div class="card">

    

  <div class="certificate-title">

    <h1>BLOCKCHAIN CERTIFICATE</h1>

    <span>Certificate of Authenticity</span>

    <div class="certificate-number">

        Certificate No.

        <strong>${certificateNumber}</strong>

    </div>

</div>

<div class="single-badge">

    ✓ VERIFIED ON BITCOIN SV BLOCKCHAIN

</div>



<img
    src="../${song.cover}"
    alt="${song.title}">


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

            <h3>Blockchain Fingerprint</h3>

            <small>${song.inscription}</small>

        </div>

        <div class="certificate-info">

    <div class="info-item">

        <span>Issued</span>

        <strong>${issueDate}</strong>

    </div>

    <div class="info-item">

        <span>Registry</span>

        <strong>Digital Music Romania</strong>

    </div>

    <div class="info-item">

        <span>Network</span>

        <strong>Bitcoin SV Blockchain</strong>

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

            </div>

        </div>

        <div class="card-buttons">

            <a
                class="cert"
                href="https://push.fm/fl/${encodeURIComponent(song.isrc)}"
                target="_blank">

                ▶ Ascultă

            </a>

            <a
                class="chain"
                href="${song.blockchain_url}"
                target="_blank">

                Blockchain

            </a>

            <a
                class="back"
                href="../">

                ← Catalog

            </a>

            <button
                id="share-btn"
                class="share"
                type="button">

                Distribuie

            </button>

            <button
                id="print-btn"
                class="print"
                type="button">

                🖨️ PDF

            </button>

        </div>

    </div>

</div>

`;

        // ===========================
        // QR Blockchain
        // ===========================

        new QRCode(
            document.getElementById("qr-blockchain"),
            {
                text: song.blockchain_url.trim(),
                width: 240,
                height: 240,
                colorDark: "#000000",
                colorLight: "#ffffff",
                correctLevel: QRCode.CorrectLevel.L
            }
        );

        // ===========================
        // QR Streaming
        // ===========================

        new QRCode(
            document.getElementById("qr-stream"),
            {
                text: "https://push.fm/fl/" + encodeURIComponent(song.isrc),
                width: 240,
                height: 240,
                colorDark: "#000000",
                colorLight: "#ffffff",
                correctLevel: QRCode.CorrectLevel.L
            }
        );

        // ===========================
        // Share
        // ===========================

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

                    } catch {}

                } else {

                    await navigator.clipboard.writeText(url);

                    alert("Link copiat.");

                }

            });

        // ===========================
        // Print
        // ===========================

        document
            .getElementById("print-btn")
            .addEventListener("click", () => {

                window.print();

            });

    }

    catch (error) {

        console.error(error);

        container.innerHTML = `

            <div class="card">

                <div class="card-content">

                    <h2>Eroare la încărcarea certificatului</h2>

                    <p>${error.message}</p>

                </div>
<div class="certificate-footer">

    <p>

        This certificate confirms that this musical work
        has been officially registered on the Bitcoin SV Blockchain.

    </p>

    <p>

        Authenticity can be verified at any time using
        the Blockchain QR Code displayed above.

    </p>

    <div class="footer-copy">

        © 2026 Digital Music Romania

    </div>

</div>
            </div>

        `;

    }

}