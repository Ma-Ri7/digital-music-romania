const fs = require("fs");
const path = require("path");

// citim data.json
const data = JSON.parse(fs.readFileSync("data.json", "utf8"));

const outputDir = path.join(__dirname, "certificari");

// ne asigurăm că folderul există
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
}

data.songs.forEach(song => {

    const fileName = `${song.id}.html`;
    const filePath = path.join(outputDir, fileName);

    const html = `
<!DOCTYPE html>
<html lang="ro">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">

<title>${song.title} | Digital Music Romania</title>

<meta name="description" content="Certificat blockchain pentru ${song.title} - Digital Music Romania">

<link rel="stylesheet" href="../style.css">

</head>

<body>

<div class="cert-container">

<div class="cert-card">

<div class="verified">✓ VERIFIED ON BITCOIN SV</div>

<img class="cover" src="../${song.cover}">

<h1>${song.title}</h1>
<h2>${song.artist}</h2>

<div class="label">ISRC</div>
<div class="value">${song.isrc}</div>

<div class="label">UPC</div>
<div class="value">${song.upc}</div>

<div class="label">INSCRIPTION HASH</div>
<div class="value">${song.inscription}</div>

<div class="label">DESCRIERE</div>
<div class="value">${song.description}</div>

<br><br>

<a class="btn" href="${song.blockchain_url}" target="_blank">
VERIFY ON BLOCKCHAIN
</a>

</div>

</div>

</body>
</html>
`;

    fs.writeFileSync(filePath, html, "utf8");

    console.log("Generated:", fileName);
});

console.log("DONE - toate paginile au fost generate.");