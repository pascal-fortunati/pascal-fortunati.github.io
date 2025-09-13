document.addEventListener('DOMContentLoaded', () => {
    const LOGIN_USER = 'zeigadis';
    const LOGIN_PASS = 'pasonnic83';

    const loginContainer = document.getElementById('login-container');
    const adminContainer = document.getElementById('admin-container');
    const loginForm = document.getElementById('login-form');
    const loginError = document.getElementById('login-error');

    function showAdminPanel() {
        loginContainer.style.display = 'none';
        adminContainer.style.display = 'flex';
        document.body.classList.remove('login-active');
        initAdmin();
    }

    if (localStorage.getItem('isLoggedIn') === 'true') {
        showAdminPanel();
    } else {
        document.body.classList.add('login-active');
    }

    loginForm.addEventListener('submit', e => {
        e.preventDefault();
        const user = document.getElementById('username').value.trim();
        const pass = document.getElementById('password').value.trim();

        if (user === LOGIN_USER && pass === LOGIN_PASS) {
            localStorage.setItem('isLoggedIn', 'true');
            showAdminPanel();
        } else {
            loginError.style.display = 'block';
        }
    });

    // Bouton de déconnexion
    const sidebar = document.querySelector('.sidebar');
    const logoutBtn = document.createElement('button');
    logoutBtn.textContent = '🔒 Déconnexion';
    logoutBtn.className = 'btn btn-warning mt-3';
    logoutBtn.onclick = () => {
        localStorage.removeItem('isLoggedIn');
        location.reload();
    };
    sidebar.appendChild(logoutBtn);

    // ----------- PANEL ADMIN -------------
    function initAdmin() {
        const GITHUB_TOKEN = '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'; // Remplacez par votre token
        const REPO_OWNER = 'pascal-fortunati';
        const REPO_NAME = 'pascal-fortunati.github.io';
        const FILE_PATH = 'projects.json';

        let fileSha = '';
        let data = { formation: [], personnel: [] };

        // Fonction pour faire les requêtes avec gestion CORS
        async function makeGitHubRequest(url, options = {}) {
            // Options par défaut avec headers CORS
            const defaultOptions = {
                headers: {
                    'Authorization': `Bearer ${GITHUB_TOKEN}`,
                    'Accept': 'application/vnd.github+json',
                    'X-GitHub-Api-Version': '2022-11-28',
                    // Headers CORS
                    'Content-Type': 'application/json',
                },
                ...options
            };

            try {
                const response = await fetch(url, defaultOptions);

                // Log des headers pour debug
                console.log('Status:', response.status);
                console.log('Rate limit restant:', response.headers.get('X-RateLimit-Remaining'));

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(`HTTP ${response.status}: ${errorData.message || 'Erreur inconnue'}`);
                }

                return await response.json();
            } catch (error) {
                // Si CORS bloque, essayer avec un proxy (développement uniquement)
                if (error.message.includes('CORS') || error.message.includes('Failed to fetch')) {
                    console.warn('Tentative avec proxy CORS...');
                    const proxyUrl = 'https://api.allorigins.win/raw?url=';
                    const proxiedResponse = await fetch(proxyUrl + encodeURIComponent(url), defaultOptions);
                    if (!proxiedResponse.ok) throw error;
                    return await proxiedResponse.json();
                }
                throw error;
            }
        }

        async function loadData() {
            try {
                console.log('Chargement des données...');

                // Première tentative : URL directe pour la lecture (évite CORS)
                try {
                    const directUrl = `https://raw.githubusercontent.com/${REPO_OWNER}/${REPO_NAME}/main/${FILE_PATH}?_=${Date.now()}`;
                    const response = await fetch(directUrl);
                    if (response.ok) {
                        data = await response.json();
                        console.log('Données chargées via URL directe');

                        // Récupérer le SHA séparément pour les mises à jour
                        const apiUrl = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}`;
                        const shaResponse = await makeGitHubRequest(apiUrl);
                        fileSha = shaResponse.sha;

                        render();
                        return;
                    }
                } catch (e) {
                    console.log('URL directe échouée, tentative API...');
                }

                // Deuxième tentative : API GitHub
                const apiUrl = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}`;
                const json = await makeGitHubRequest(apiUrl);

                fileSha = json.sha;
                const decoded = atob(json.content.replace(/\n/g, ''));
                data = JSON.parse(decoded);
                console.log('Données chargées via API');
                render();

            } catch (e) {
                console.error('Erreur chargement JSON:', e);
                alert(`Impossible de charger projects.json: ${e.message}`);
            }
        }

        function render() {
            renderTable('formation');
            renderTable('personnel');
        }

        function renderTable(cat) {
            const tbody = document.querySelector(`#table-${cat} tbody`);
            if (!tbody) return;

            tbody.innerHTML = '';
            data[cat].forEach((p, i) => {
                tbody.innerHTML += `<tr>
                    <td><input class="form-control form-control-sm" value="${p.name || ''}" oninput="update('${cat}',${i},'name',this.value)"></td>
                    <td><input class="form-control form-control-sm" value="${p.url || ''}" oninput="update('${cat}',${i},'url',this.value)"></td>
                    <td><input class="form-control form-control-sm" value="${p.description || ''}" oninput="update('${cat}',${i},'description',this.value)"></td>
                    <td><input class="form-control form-control-sm" value="${p.img || ''}" oninput="update('${cat}',${i},'img',this.value)"></td>
                    <td><input class="form-control form-control-sm" value="${p.type || ''}" oninput="update('${cat}',${i},'type',this.value)"></td>
                    <td><button class="btn btn-sm btn-danger" onclick="remove('${cat}',${i})">🗑</button></td>
                </tr>`;
            });
        }

        // Fonctions globales
        window.update = (cat, i, field, value) => {
            if (data[cat] && data[cat][i]) {
                data[cat][i][field] = value;
            }
        };

        window.remove = (cat, i) => {
            if (data[cat]) {
                data[cat].splice(i, 1);
                render();
            }
        };

        window.add = cat => {
            if (data[cat]) {
                data[cat].push({ name: '', url: '', description: '', img: '', type: '' });
                render();
            }
        };

        async function updateGitHubFile(newData) {
            if (!GITHUB_TOKEN) {
                alert('❌ Token GitHub requis pour sauvegarder !');
                return;
            }

            if (!fileSha) {
                alert('❌ SHA manquant ! Rechargez la page.');
                return;
            }

            try {
                console.log('💾 Mise à jour du fichier...');

                const content = btoa(JSON.stringify(newData, null, 2));
                const apiUrl = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}`;

                const result = await makeGitHubRequest(apiUrl, {
                    method: 'PUT',
                    body: JSON.stringify({
                        message: `Admin Panel - ${new Date().toLocaleString('fr-FR')}`,
                        content,
                        sha: fileSha
                    })
                });

                alert('✅ Fichier mis à jour avec succès !');
                fileSha = result.content.sha;
                console.log('✅ Nouveau SHA:', fileSha);

            } catch (error) {
                console.error('❌ Erreur mise à jour:', error);

                if (error.message.includes('401')) {
                    alert('❌ Token invalide ! Vérifiez votre token GitHub.');
                } else if (error.message.includes('CORS')) {
                    alert('❌ Erreur CORS ! Utilisez GitHub directement ou un serveur backend.');
                } else {
                    alert(`❌ Erreur: ${error.message}`);
                }
            }
        }

        // Event listeners
        const exportBtn = document.getElementById('exportBtn');
        if (exportBtn) {
            exportBtn.onclick = () => updateGitHubFile(data);
        }

        window.showSection = cat => {
            const formationSection = document.getElementById('section-formation');
            const personnelSection = document.getElementById('section-personnel');
            const formationLink = document.getElementById('link-formation');
            const personnelLink = document.getElementById('link-personnel');

            if (formationSection) formationSection.style.display = cat === 'formation' ? 'block' : 'none';
            if (personnelSection) personnelSection.style.display = cat === 'personnel' ? 'block' : 'none';
            if (formationLink) formationLink.classList.toggle('active', cat === 'formation');
            if (personnelLink) personnelLink.classList.toggle('active', cat === 'personnel');
        };

        // Initialisation
        loadData();
    }
});