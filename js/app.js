// projets
const projects = [
    {
    name: "Runtrack 1 - Jour 2",
    url: "https://github.com/pascal-fortunati/runtrack1-jour-2",
    description: "Exercices et code du jour 2 de la Runtrack 1",
    img: "img/projet2.jpg",
    type: "Voir sur Github"
    },
    {
    name: "Runtrack 1 - Jour 3",
    url: "https://github.com/pascal-fortunati/runtrack1-jour-3",
    description: "Exercices et code du jour 3 de la Runtrack 1",
    img: "img/projet3.jpg",
    type: "Voir sur Github"
    },
    {
    name: "Runtrack 1 - Jour 4",
    url: "https://pascal-fortunati.github.io/runtrack1-jour-4",
    description: "Exercices et code du jour 4 de la Runtrack 1",
    img: "img/projet4.jpg",
    type: "Voir Démo"
    },
    {
    name: "jour-git - Jour 5",
    url: "https://pascal-fortunati.github.io/jour-git",
    description: "Exercices et code du jour 5 jour-git",
    img: "img/projet5.jpg",
    type: "Voir Démo"
    },
    {
    name: "fansite",
    url: "https://github.com/pascal-fortunati/runtrack1-jour-3",
    description: "projet fansite sur one piece",
    img: "img/projet6.jpg",
    type: "Voir sur Github"
    }
];

// Génération des cartes Bootstrap avec images
const container = document.getElementById("projects");
projects.forEach(proj => {
    container.innerHTML += `
    <div class="col-md-4">
        <div class="card shadow-sm h-100">
        <img src="${proj.img}" class="card-img-top" alt="${proj.name}">
        <div class="card-body d-flex flex-column">
            <h5 class="card-title">${proj.name}</h5>
            <p class="card-text">${proj.description}</p>
            <a href="${proj.url}" target="_blank" class="btn btn-primary mt-auto">${proj.type}</a>
        </div>
        </div>
    </div>
    `;
});

// --- Pluie ---
const canvas = document.getElementById('github-rain');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const logo = new Image();
logo.src = 'img/github.png';

// Canvas temporaire pour logo
const coloredLogo = document.createElement('canvas');
const ctxColored = coloredLogo.getContext('2d');

const drops = [];
const dropCount = 10;

for(let i=0;i<dropCount;i++){
    drops.push({
        x: Math.random()*canvas.width,
        y: Math.random()*canvas.height,
        speed: 1 + Math.random()*2,
        size: 40 + Math.random()*40
    });
}

function animate(){
    ctx.clearRect(0,0,canvas.width,canvas.height);
    drops.forEach(d => {
        ctx.drawImage(coloredLogo, d.x, d.y, d.size, d.size);
        d.y += d.speed;
        if(d.y > canvas.height) d.y = -d.size;
    });
    requestAnimationFrame(animate);
}

logo.onload = () => {
    // Canvas temporaire
    coloredLogo.width = logo.width;
    coloredLogo.height = logo.height;

    // image originale
    ctxColored.drawImage(logo, 0, 0);

    // Recolorer en cyan
    ctxColored.fillStyle = '#00d4ff';
    ctxColored.globalCompositeOperation = 'source-in';
    ctxColored.fillRect(0, 0, logo.width, logo.height);

    // Lancer l'animation
    animate();
}

window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});