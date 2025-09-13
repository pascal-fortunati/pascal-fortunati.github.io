document.addEventListener('DOMContentLoaded', () => {

    // ===== Fonction pour générer les cartes =====
    function renderSection(projects, sectionId, title) {
        const container = document.getElementById(sectionId);
        if (!container) return;
        container.innerHTML = `<h2 class="text-center mb-4">${title}</h2>`;
        projects.forEach(proj => {
            container.innerHTML += `
          <div class="col-12 col-sm-6 col-md-4 col-lg-3">
            <div class="card shadow-sm h-100">
              <img src="${proj.img}" class="card-img-top" alt="${proj.name}">
              <div class="card-body d-flex flex-column">
                <h5 class="card-title">${proj.name}</h5>
                <p class="card-text">${proj.description}</p>
                <a href="${proj.url}" target="_blank" class="btn btn-primary mt-auto">${proj.type}</a>
              </div>
            </div>
          </div>`;
        });
    }

    // ===== Fetch JSON =====
    fetch('projects.json')
        .then(res => res.json())
        .then(data => {
            renderSection(data.formation, "formation-projects", "Projets de formation");
            renderSection(data.personnel, "personnel-projects", "Projets personnels");
        })
        .catch(err => console.error("Impossible de charger projects.json :", err));

    // ===== Pluie GitHub =====
    const canvas = document.getElementById('github-rain');
    if (canvas) {
        const ctx = canvas.getContext('2d');
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        const logo = new Image();
        logo.src = 'img/github.png';

        const coloredLogo = document.createElement('canvas');
        const ctxColored = coloredLogo.getContext('2d');

        const drops = [];
        const dropCount = 10;
        for (let i = 0; i < dropCount; i++) {
            drops.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                speed: 1 + Math.random() * 2,
                size: 40 + Math.random() * 40
            });
        }

        function animate() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            drops.forEach(d => {
                ctx.drawImage(coloredLogo, d.x, d.y, d.size, d.size);
                d.y += d.speed;
                if (d.y > canvas.height) d.y = -d.size;
            });
            requestAnimationFrame(animate);
        }

        logo.onload = () => {
            coloredLogo.width = logo.width;
            coloredLogo.height = logo.height;
            ctxColored.drawImage(logo, 0, 0);
            ctxColored.fillStyle = '#00d4ff';
            ctxColored.globalCompositeOperation = 'source-in';
            ctxColored.fillRect(0, 0, logo.width, logo.height);
            animate();
        };

        window.addEventListener('resize', () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        });
    }

});