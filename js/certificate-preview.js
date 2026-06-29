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
        ✓ VERIFIED
    </div>

    <h2>${song.title}</h2>

    <h3>${song.artist}</h3>

</div>

        <div class="preview-section">

    <h4>Certificate Information</h4>

    <div class="meta-row">
        <span>ISRC</span>
        <strong>${song.isrc}</strong>
    </div>

    <div class="meta-row">
        <span>Transaction Hash (TXID)</span>
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
        <span>Status</span>
        <strong class="status-ok">Verified ✓</strong>
    </div>

</div>

<div class="preview-section">

    <h4>Blockchain</h4>

    <div class="meta-row">
        <span>Network</span>
        <strong>Bitcoin SV</strong>
    </div>

    <div class="meta-row">
        <span>Registration</span>
        <strong>${song.registrationDate || "-"}</strong>
    </div>

</div>

          <div class="preview-actions">

    <button id="copy-isrc">
        Copy ISRC
    </button>

    <button id="copy-hash">
        Copy Blockchain Hash
    </button>

    <button id="view-blockchain">
        View on Blockchain
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
        `https://whatsonchain.com/tx/${txid}`,
        "_blank"
    );

});



copyHash.addEventListener("click", async () => {

    await navigator.clipboard.writeText(txid);

    copyHash.textContent = "Copied!";

    setTimeout(() => {

        copyHash.textContent = "Copy Blockchain Hash";

    }, 1500);

});

copyIsrc.addEventListener("click", async () => {

    await navigator.clipboard.writeText(song.isrc);

    copyIsrc.textContent = "Copied!";

    setTimeout(() => {

        copyIsrc.textContent = "Copy ISRC";

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