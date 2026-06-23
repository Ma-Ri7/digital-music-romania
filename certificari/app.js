let songs = [];

document.addEventListener("DOMContentLoaded", () => {

    const container = document.getElementById("songs-container");
    const searchBox = document.getElementById("searchBox");
    const params = new URLSearchParams(window.location.search);
    const searchParam = params.get("search");
    fetch("data.json")
        .then(response => response.json())
        .then(data => {

            songs = data.songs;
            if(searchParam){

          searchBox.value = searchParam;

          const filtered = songs.filter(song =>

        song.title.toLowerCase().includes(searchParam.toLowerCase()) ||
        song.artist.toLowerCase().includes(searchParam.toLowerCase()) ||
        song.isrc.toLowerCase().includes(searchParam.toLowerCase()) ||
        song.inscription.toLowerCase().includes(searchParam.toLowerCase())

    );

    renderSongs(filtered);

} else {

    renderSongs(songs);

}
            renderSongs(songs);

        })
        .catch(error => {

            console.error("Eroare la încărcarea data.json:", error);

            container.innerHTML = `
                <h2 style="color:red">
                    Nu s-au putut încărca melodiile.
                </h2>
            `;

        });

    searchBox.addEventListener("input", () => {

        const value = searchBox.value.toLowerCase();

        const filteredSongs = songs.filter(song =>

            song.title.toLowerCase().includes(value) ||
            song.artist.toLowerCase().includes(value) ||
            song.isrc.toLowerCase().includes(value) ||
            song.inscription.toLowerCase().includes(value)

        );
          history.replaceState(
    null,
    "",
    "?search=" + encodeURIComponent(value)
);
        renderSongs(filteredSongs);

    });

    function renderSongs(list) {

        container.innerHTML = "";

        list.forEach(song => {

            container.innerHTML += `

            <div class="card">

                <img src="${song.cover}" alt="${song.title}">

                <h3>${song.title}</h3>

                <p>${song.artist}</p>

                <p>ISRC: ${song.isrc}</p>

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