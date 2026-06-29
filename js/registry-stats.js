export function updateStats(songs, visibleCount = songs.length) {

    const totalReleases = document.getElementById("total-releases");
    const totalArtists = document.getElementById("total-artists");
    const visibleResults = document.getElementById("visible-results");

    if (totalReleases) {
        totalReleases.textContent = songs.length;
    }

    if (totalArtists) {
        totalArtists.textContent =
            new Set(songs.map(song => song.artist)).size;
    }

    if (visibleResults) {
        visibleResults.textContent = visibleCount;
    }

}