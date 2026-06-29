let songs = [];
let filteredSongs = [];

export function setSongs(list) {
    songs = [...list];
    filteredSongs = [...list];
}

export function getSongs() {
    return songs;
}

export function getFilteredSongs() {
    return filteredSongs;
}

export function setFilteredSongs(list) {
    filteredSongs = [...list];
}