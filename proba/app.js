let songs = [];

document.addEventListener("DOMContentLoaded", () => {

  console.log("DOM READY");

  const searchBox = document.getElementById("searchBox");
  const container = document.getElementById("songs-container");

  if (!searchBox) {
    console.error("searchBox NU EXISTA");
    return;
  }

  if (!container) {
    console.error("songs-container NU EXISTA");
    return;
  }

  // LOAD JSON
  fetch("data.json")
    .then(res => res.json())
    .then(data => {
      songs = data.songs;
      renderSongs(songs);
      console.log("DATA LOADED", songs);
    })
    .catch(err => console.error("JSON ERROR", err));

  // SEARCH
  searchBox.addEventListener("input", (e) => {
    const value = e.target.value.toLowerCase();

    const filtered = songs.filter(song =>
      song.title.toLowerCase().includes(value) ||
      song.artist.toLowerCase().includes(value) ||
      song.isrc.toLowerCase().includes(value) ||
      song.inscription.toLowerCase().includes(value)
    );

    renderSongs(filtered);
  });

  // RENDER FUNCTION
  function renderSongs(list) {
    container.innerHTML = list.map(song => `
      <div class="card">
        <img src="${song.cover}" alt="${song.title}">
        <h3>${song.title}</h3>
        <p>${song.artist}</p>
        <p style="font-size:12px;color:#777;">ISRC: ${song.isrc}</p>

        <a class="btn" href="certificari/?id=${song.id}">
          Certificat
        </a>

        <a class="btn" style="background:#333;color:#fff;margin-left:5px;"
           href="${song.blockchain_url}" target="_blank">
          Blockchain
        </a>
      </div>
    `).join("");
  }

});