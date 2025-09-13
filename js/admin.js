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
        const REPO_OWNER = 'pascal-fortunati';
        const REPO_NAME = 'pascal-fortunati.github.io';
        const FILE_PATH = 'projects.json';

        let GITHUB_TOKEN = '';
        let fileSha = '';
        let data = { formation: [], personnel: [] };
        let canSave = false;

        // Demander le token
        function requestToken() {
            if (!GITHUB_TOKEN) {
                GITHUB_TOKEN = prompt('🔑 Token GitHub requis pour sauvegarder.\nCréez-en un sur : https://github.com/settings/tokens\nPermissions: repo ou public_repo') || '';
                if (GITHUB_TOKEN) {
                    verifyToken();
                }
            }
            return GITHUB_TOKEN;
        }

        // Vérifier que le token fonctionne
        async function verifyToken() {
            if (!GITHUB_TOKEN) return false;

            try {
                console.log('🔍 Vérification du token...');

                // Tentative avec l'API GitHub
                const response = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}`, {
                    headers: {
                        'Authorization': `Bearer ${GITHUB_TOKEN}`,
                        'Accept': 'application/vnd.github+json'
                    }
                });

                if (response.ok) {
                    const json = await response.json();
                    fileSha = json.sha;
                    canSave = true;
                    updateSaveButton(true);
                    console.log('✅ Token valide, SHA récupéré:', fileSha);
                    alert('✅ Token validé avec succès !');
                    return true;
                } else {
                    const error = await response.json().catch(() => ({}));
                    throw new Error(`Token invalide: ${error.message || 'Vérifiez les permissions'}`);
                }
            } catch (e) {
                console.error('❌ Erreur token:', e);

                // Si c'est une erreur CORS ou réseau
                if (e.message.includes('CORS') || e.message.includes('Failed to fetch')) {
                    console.warn('⚠️ Erreur CORS détectée, tentative alternative...');

                    // Méthode alternative : on suppose que le token est bon si l'utilisateur l'a fourni
                    const userConfirm = confirm(
                        '⚠️ Impossible de vérifier le token à cause des restrictions CORS.\n\n' +
                        'Voulez-vous continuer quand même ?\n' +
                        '(Le token sera testé lors de la sauvegarde)'
                    );

                    if (userConfirm) {
                        // On récupère le SHA depuis les données déjà chargées
                        try {
                            const directResponse = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}`, {
                                headers: { 'Accept': 'application/vnd.github+json' }
                            });
                            if (directResponse.ok) {
                                const json = await directResponse.json();
                                fileSha = json.sha;
                            }
                        } catch { }

                        canSave = true;
                        updateSaveButton(true);
                        console.log('⚠️ Token accepté sans vérification');
                        alert('⚠️ Token accepté (non vérifié à cause de CORS)');
                        return true;
                    } else {
                        GITHUB_TOKEN = '';
                        canSave = false;
                        updateSaveButton(false);
                        return false;
                    }
                } else {
                    alert(`❌ Token invalide: ${e.message}`);
                    GITHUB_TOKEN = '';
                    canSave = false;
                    updateSaveButton(false);
                    return false;
                }
            }
        }

        function updateSaveButton(enabled) {
            const exportBtn = document.getElementById('exportBtn');
            if (exportBtn) {
                exportBtn.disabled = false;

                if (enabled) {
                    exportBtn.textContent = '💾 Sauvegarder';
                    exportBtn.className = 'btn btn-success';
                } else {
                    exportBtn.textContent = '🔒 Entrer Token';
                    exportBtn.className = 'btn btn-warning';
                }

                console.log(`🔧 Bouton mis à jour: ${exportBtn.textContent}`);
            }
        }

        async function loadData() {
            try {
                console.log('📁 Chargement des données...');

                // URL directe - fonctionne toujours, pas de CORS
                const directUrl = `https://raw.githubusercontent.com/${REPO_OWNER}/${REPO_NAME}/main/${FILE_PATH}?_=${Date.now()}`;
                const response = await fetch(directUrl);

                if (!response.ok) {
                    throw new Error(`Impossible de charger le fichier (${response.status})`);
                }

                data = await response.json();
                console.log('✅ Données chargées:', Object.keys(data).map(k => `${k}: ${data[k].length} items`).join(', '));
                render();
                updateSaveButton(canSave);

            } catch (e) {
                console.error('❌ Erreur:', e);
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
            if (!data[cat]) data[cat] = [];

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

        // ✅ FONCTIONS GLOBALES AVEC LES BONS NOMS (compatibles HTML)
        window.update = (cat, i, field, value) => {
            console.log(`Update: ${cat}[${i}].${field} = "${value}"`);
            if (data[cat] && data[cat][i]) {
                data[cat][i][field] = value;
            }
        };

        window.remove = (cat, i) => {
            console.log(`Remove: ${cat}[${i}]`);
            if (data[cat]) {
                data[cat].splice(i, 1);
                render();
            }
        };

        window.add = cat => {
            console.log(`Add to: ${cat}`);
            if (!data[cat]) data[cat] = [];
            data[cat].push({ name: '', url: '', description: '', img: '', type: '' });
            render();
        };

        async function saveToGitHub() {
            console.log('🔧 Tentative de sauvegarde...');

            if (!requestToken()) {
                console.log('❌ Aucun token fourni');
                return;
            }

            if (!canSave) {
                console.log('❌ Token non vérifié');
                alert('❌ Token non vérifié ! Vérifiez votre token.');
                return;
            }

            try {
                console.log('💾 Sauvegarde en cours...');

                const content = btoa(JSON.stringify(data, null, 2));
                const response = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}`, {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${GITHUB_TOKEN}`,
                        'Accept': 'application/vnd.github+json',
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        message: `🔧 Admin Panel - ${new Date().toLocaleString('fr-FR')}`,
                        content: content,
                        sha: fileSha
                    })
                });

                if (!response.ok) {
                    const error = await response.json().catch(() => ({}));
                    throw new Error(`HTTP ${response.status}: ${error.message || 'Erreur inconnue'}`);
                }

                const result = await response.json();
                fileSha = result.content.sha;

                console.log('✅ Sauvegarde réussie, nouveau SHA:', fileSha);
                alert('✅ Fichier sauvegardé avec succès !');

            } catch (error) {
                console.error('❌ Erreur sauvegarde:', error);

                if (error.message.includes('401')) {
                    alert('❌ Token invalide ! Créez un nouveau token avec les bonnes permissions.');
                    GITHUB_TOKEN = '';
                    canSave = false;
                    updateSaveButton(false);
                } else if (error.message.includes('CORS')) {
                    alert('❌ Erreur CORS ! Le token ne peut pas être utilisé depuis le navigateur.');
                } else {
                    alert(`❌ Erreur: ${error.message}`);
                }
            }
        }

        // Event listeners
        const exportBtn = document.getElementById('exportBtn');
        if (exportBtn) {
            exportBtn.onclick = () => {
                console.log('🖱️ Clic sur le bouton sauvegarde');
                saveToGitHub();
            };
        }

        window.showSection = cat => {
            console.log(`📂 Affichage section: ${cat}`);
            const formationSection = document.getElementById('section-formation');
            const personnelSection = document.getElementById('section-personnel');
            const formationLink = document.getElementById('link-formation');
            const personnelLink = document.getElementById('link-personnel');

            if (formationSection) formationSection.style.display = cat === 'formation' ? 'block' : 'none';
            if (personnelSection) personnelSection.style.display = cat === 'personnel' ? 'block' : 'none';
            if (formationLink) formationLink.classList.toggle('active', cat === 'formation');
            if (personnelLink) personnelLink.classList.toggle('active', cat === 'personnel');
        };

        // ✅ Test des fonctions au chargement
        console.log('🔧 Test des fonctions globales...');
        console.log('window.add:', typeof window.add);
        console.log('window.update:', typeof window.update);
        console.log('window.remove:', typeof window.remove);
        console.log('window.showSection:', typeof window.showSection);

        // Initialisation
        loadData();
    }
});