let songs = [];

document.addEventListener("DOMContentLoaded", () => {

    const container = document.getElementById("songs-container");
    const searchBox = document.getElementById("searchBox");

    // Citim parametrul ?search=
    const params = new URLSearchParams(window.location.search);
    const searchParam = params.get("search");

    fetch("data.json")
        .then(response => response.json())
        .then(data => {

            songs = data.songs;

            // Dacă există ?search=
            if (searchParam && searchParam.trim() !== "") {

                searchBox.value = searchParam;

                const filteredSongs = filterSongs(searchParam);

                renderSongs(filteredSongs);

            } else {

                renderSongs(songs);

            }

        })
        .catch(error => {

            console.error("Eroare la încărcarea data.json:", error);

            container.innerHTML = `
                <h2 style="color:red;">
                    Nu s-au putut încărca melodiile.
                </h2>
            `;

        });

    // Căutare live
    searchBox.addEventListener("input", () => {

        const value = searchBox.value.trim();

        const filteredSongs = filterSongs(value);

        renderSongs(filteredSongs);

        // Actualizează URL-ul fără refresh
        if (value !== "") {

            history.replaceState(
                null,
                "",
                "?search=" + encodeURIComponent(value)
            );

        } else {

            history.replaceState(
                null,
                "",
                window.location.pathname
            );

        }

    });

    // ENTER = nu face nimic special
    searchBox.addEventListener("keydown", (event) => {

        if (event.key === "Enter") {

            event.preventDefault();

        }

    });

    // Funcție filtrare
    function filterSongs(searchTerm) {

        const value = searchTerm.toLowerCase();

        return songs.filter(song =>

            song.title.toLowerCase().includes(value) ||
            song.artist.toLowerCase().includes(value) ||
            song.isrc.toLowerCase().includes(value) ||
            song.inscription.toLowerCase().includes(value)

        );

    }

    // Render carduri
    function renderSongs(list) {

    container.innerHTML = "";
    container.classList.remove("single-result");

    if(list.length === 0){

        container.innerHTML = `
            <h2>Nu a fost găsită nicio melodie.</h2>
        `;

        return;
    }

    // SINGLE RESULT MODE
    if(list.length === 1){

        container.classList.add("single-result");

        const song = list[0];

        container.innerHTML = `

        <div class="card">

            <div class="single-badge">
                ✓ VERIFIED ON BLOCKCHAIN
            </div>

            <img src="${song.cover}" alt="${song.title}">

            <h3>${song.title}</h3>

            <p>${song.artist}</p>

            <div class="single-meta">

                <p>
                    <strong>ISRC:</strong>
                    ${song.isrc}
                </p>

                <p>
                    <strong>UPC:</strong>
                    ${song.upc}
                </p>

                <p>
                    <strong>Hash:</strong>
                    ${song.inscription}
                </p>

            </div>

            <div class="single-description">
                ${song.description}
            </div>

            <div class="qr-wrapper">
                <div id="qr-single"></div>
            </div>

            <div class="buttons">

                <a
                    class="btn"
                    href="certificari/?id=${song.id}">
                    Certificat
                </a>

                <a
                    class="btn2"
                    href="${song.blockchain_url}"
                    target="_blank">
                    Blockchain
                </a>

            </div>

        </div>
        `;

        setTimeout(() => {

            const qrElement = document.getElementById("qr-single"); 
            if(qrElement){ const certUrl = "https://push.fm/fl/" + encodeURIComponent(song.isrc);
                new QRCode(qrElement,{ text: certUrl, width:180, height:180, correctLevel: QRCode.CorrectLevel.H }); 
            }

        },100);

        return;
    }

    // MULTIPLE RESULTS

    list.forEach(song => {

        container.innerHTML += `

        <div class="card">

            <img src="${song.cover}" alt="${song.title}">

            <h3>${song.title}</h3>

            <p>${song.artist}</p>

            <p>
                ISRC: ${song.isrc}
            </p>

            <div class="buttons">

                <a
                    class="btn"
                    href="certificari/?id=${song.id}">
                    Certificat
                </a>

                <a
                    class="btn2"
                    href="${song.blockchain_url}"
                    target="_blank">
                    Blockchain
                </a>

            </div>

        </div>

        `;

    });

}

});