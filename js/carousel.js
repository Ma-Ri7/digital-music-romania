// =====================================================
// Digital Music Romania
// carousel.js
// =====================================================

export function loadCarousel(songs) {

    const carousel = document.getElementById("carousel");

    if (!carousel) return;

    carousel.innerHTML = "";

    songs.forEach(song => {

        const card = createCarouselCard(song);

        carousel.appendChild(card);

    });

}

// =====================================================
// CREATE CARD
// =====================================================

function createCarouselCard(song) {

    const card = document.createElement("div");

    card.className = "carousel-card";

    card.innerHTML = `

        <img
            class="carousel-cover"
            src="${song.cover}"
            alt="${song.title}">

        <div class="carousel-info">

            <h3>${song.title}</h3>

            <p>${song.artist}</p>

            <span>${song.isrc}</span>

            <div class="carousel-buttons">

                <a
                    class="carousel-btn gold"
                    href="certificari/?search=${encodeURIComponent(song.isrc)}">

                    Certificate

                </a>

                <a
                    class="carousel-btn dark"
                    href="${window.location.origin}/i/?song=${encodeURIComponent(song.id)}"
                    target="_blank">

                      Inscription

                </a>

            </div>

        </div>

    `;

    return card;

}