import { openPreview } from "./certificate-preview.js";
import { t } from "./i18n/runtime.js";
// =====================================================
// CATALOG CARD
// =====================================================

export function createCatalogCard(song) {

    const card = document.createElement("div");
    card.addEventListener("click", () => {

    console.log("CLICK", song);

    openPreview(song);

});

    card.className = "registry-card";

    card.innerHTML = `

        <img
            class="registry-cover"
            src="${song.cover}"
            alt="${song.title}">

        <div class="registry-content">

            <h3>${song.title}</h3>

            <p class="registry-artist">
                ${song.artist}
            </p>

            <div class="registry-isrc">

                <span>${t("cards.isrc")}</span>

                <strong>${song.isrc}</strong>

            </div>

            <div class="registry-footer">

                <span class="registry-network">
                    ${t("cards.network")}
                </span>

                <a
                    class="registry-open"
                    href="certificari/?search=${encodeURIComponent(song.isrc)}">

                    ${t("cards.viewCertificate")}

                </a>

            </div>

        </div>

    `;

    return card;

}

// =====================================================
// SINGLE REGISTRY CARD
// =====================================================

export function createRegistryCard(song) {

    const card = document.createElement("div");

    card.className = "registry-card registry-single";

    card.innerHTML = `

        <div class="registry-status">

            ${t("cards.verified")}

        </div>

        <img
            class="registry-cover"
            src="${song.cover}"
            alt="${song.title}">

        <div class="registry-content">

            <h3>${song.title}</h3>

            <p class="registry-artist">

                ${song.artist}

            </p>

            <div class="registry-isrc">

                <span>${t("cards.isrc")}</span>

                <strong>${song.isrc}</strong>

            </div>

            <div class="registry-footer">

                <span class="registry-network">

                    ${t("cards.network")}

                </span>

                <a
                    class="registry-open"
                    href="certificari/?search=${encodeURIComponent(song.isrc)}">

                    ${t("cards.openCertificate")}

                </a>

            </div>

        </div>

    `;

    return card;

}