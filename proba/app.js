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
    container.innerHTML = container.innerHTML = `
<div class="cert-box">

  <div class="status">
    ✓ BLOCK CONFIRMED ON BSV
  </div>

  <h2>${song.title}</h2>
  <p class="artist">${song.artist}</p>

  <div class="grid">

    <div class="left">

      <div class="field">
        <span>ISRC</span>
        <p>${song.isrc}</p>
      </div>

      <div class="field">
        <span>UPC</span>
        <p>${song.upc}</p>
      </div>

      <div class="field">
        <span>INSCRIPTION HASH</span>
        <p id="hashText">${song.inscription}</p>
        <button onclick="copyHash()">Copy Hash</button>
      </div>

      <a href="${song.blockchain_url}" target="_blank" class="btn">
        Verify on Blockchain
      </a>

    </div>

    <div class="right">
      <div id="qrcode"></div>
    </div>

  </div>

</div>
`;

// QR CODE
new QRCode(document.getElementById("qrcode"), {
  text: song.blockchain_url,
  width: 140,
  height: 140
});

// COPY FUNCTION
window.copyHash = function() {
  navigator.clipboard.writeText(song.inscription);
  alert("Hash copiat!");
};