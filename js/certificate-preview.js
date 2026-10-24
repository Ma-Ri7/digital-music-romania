import { t } from "./i18n/runtime.js";

export function openPreview(song) {

    console.log("openPreview()", song);

    const modal = document.getElementById("certificate-modal");
    const content = document.getElementById("certificate-content");
    const txid = song.inscription || "";
    

const shortHash =
txid.length > 24
? `${txid.slice(0,12)}...${txid.slice(-12)}`
: txid;

    console.log(modal);
    console.log(content);

    if (!modal || !content) {
        console.error("Modalul nu există în HTML.");
        return;
    }

    content.innerHTML = `
<div class="preview-layout">

    <div class="preview-left">

        <img
            src="${song.cover}"
            alt="${song.title}"
            class="preview-cover"
        >

    </div>

    <div class="preview-right">

        <div class="preview-header">

    <div class="preview-badge">
        ${t("preview.verifiedBadge")}
    </div>

    <h2>${song.title}</h2>

    <h3>${song.artist}</h3>

</div>

        <div class="preview-section">

    <h4>${t("preview.certificateInfo")}</h4>

    <div class="meta-row">
        <span>${t("preview.isrc")}</span>
        <strong>${song.isrc}</strong>
    </div>

    <div class="meta-row">
        <span>${t("preview.txid")}</span>
         <strong>

<a
    href="https://whatsonchain.com/tx/${txid}"
    target="_blank"
    class="tx-link"
>

${shortHash}

</a>

</strong>
    </div>

    <div class="meta-row">
        <span>${t("preview.status")}</span>
        <strong class="status-ok">${t("preview.statusVerified")}</strong>
    </div>

</div>

<div class="preview-section">

    <h4>${t("preview.blockchain")}</h4>

    <div class="meta-row">
        <span>${t("preview.network")}</span>
        <strong>Bitcoin SV</strong>
    </div>

    <div class="meta-row">
        <span>${t("preview.registration")}</span>
        <strong>${song.registrationDate || "-"}</strong>
    </div>

</div>

          <div class="preview-actions">

    <button id="copy-isrc">
        <i class="fa-solid fa-copy"></i>
        ${t("preview.copyIsrc")}
    </button>

    <button id="copy-hash">
        <i class="fa-solid fa-fingerprint"></i>
        ${t("preview.copyHash")}
    </button>

    <button id="view-blockchain">
        <i class="fa-solid fa-cube"></i>
        ${t("preview.viewInscription")}
    </button>

</div>

    </div>

</div>
`;

const copyIsrc = document.getElementById("copy-isrc");
const copyHash = document.getElementById("copy-hash");
const viewBlockchain = document.getElementById("view-blockchain");

    viewBlockchain.addEventListener("click", () => {

    if (!txid) return;

    window.open(
`https://ordinals.gorillapool.io/content/${txid}`,
"_blank"
);

});



copyHash.addEventListener("click", async () => {

    await navigator.clipboard.writeText(txid);

    copyHash.textContent = t("preview.copied");

    setTimeout(() => {

        copyHash.textContent = t("preview.copyHash");

    }, 1500);

});

copyIsrc.addEventListener("click", async () => {

    await navigator.clipboard.writeText(song.isrc);

    copyIsrc.textContent = t("preview.copied");

    setTimeout(() => {

        copyIsrc.textContent = t("preview.copyIsrc");

    }, 1500);

});


    modal.classList.add("show");
    console.log(modal.className);

}

export function initPreview() {

    const modal = document.getElementById("certificate-modal");
    const close = document.getElementById("certificate-close");

    close.addEventListener("click", () => {

        modal.classList.remove("show");

    });

    modal.addEventListener("click", (e) => {

        if (e.target === modal) {
            modal.classList.remove("show");
        }

    });

    document.addEventListener("keydown", (e) => {

    if (e.key === "Escape") {
        modal.classList.remove("show");
    }

});

}