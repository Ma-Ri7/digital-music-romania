// =====================================================
// Digital Music Romania
// qrcode.js
// =====================================================

const QR_SIZE = 180;

// =====================================================
// PUBLIC
// =====================================================

export function generateSongQR(song) {

    if (!song) return;

    const container = document.getElementById("qr-single");

    if (!container) return;

    container.innerHTML = "";

    const url = createPushUrl(song.isrc);

    new QRCode(container, {

        text: url,

        width: QR_SIZE,

        height: QR_SIZE,

        correctLevel: QRCode.CorrectLevel.H

    });

}

export function generateCustomQR(elementId, url) {

    const container = document.getElementById(elementId);

    if (!container) return;

    container.innerHTML = "";

    new QRCode(container, {

        text: url,

        width: QR_SIZE,

        height: QR_SIZE,

        correctLevel: QRCode.CorrectLevel.H

    });

}

// =====================================================
// HELPERS
// =====================================================

export function createPushUrl(isrc) {

    return `https://push.fm/fl/${encodeURIComponent(isrc)}`;

}

export function createCertificateUrl(isrc) {

    return `${window.location.origin}/certificari/?search=${encodeURIComponent(isrc)}`;

}

export function createBlockchainUrl(song) {

    return song.blockchain_url;

}

// =====================================================
// DOWNLOAD QR
// =====================================================

export function downloadQR(fileName = "qrcode") {

    const canvas = document.querySelector("#qr-single canvas");

    if (!canvas) return;

    const link = document.createElement("a");

    link.download = fileName + ".png";

    link.href = canvas.toDataURL("image/png");

    link.click();

}

// =====================================================
// COPY LINK
// =====================================================

export async function copyPushLink(song) {

    try {

        await navigator.clipboard.writeText(

            createPushUrl(song.isrc)

        );

        return true;

    }

    catch {

        return false;

    }

}