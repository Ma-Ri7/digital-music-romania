export async function loadSongs() {

    const response = await fetch("data.json");

    if (!response.ok) {
        throw new Error("Nu s-a putut încărca data.json");
    }

    const data = await response.json();

    return data.songs || [];

}