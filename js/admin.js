document.addEventListener('DOMContentLoaded', () => {
    // --- Constantes ---
    const LOGIN_USER = 'zeigadis';
    const LOGIN_PASS = 'pasonnic83';
    const REPO_OWNER = 'pascal-fortunati';
    const REPO_NAME = 'pascal-fortunati.github.io';
    const FILE_PATH = 'projects.json';

    // --- Éléments DOM ---
    const loginContainer = document.getElementById('login-container');
    const adminContainer = document.getElementById('admin-container');
    const loginForm = document.getElementById('login-form');
    const loginError = document.getElementById('login-error');
    const exportBtn = document.getElementById('exportBtn');
    const sidebar = document.querySelector('.sidebar');

    // --- État ---
    let GITHUB_TOKEN = '';
    let fileSha = '';
    let data = { formation: [], personnel: [] };

    // --- Authentification ---
    function showAdmin() {
        loginContainer.style.display = 'none';
        adminContainer.style.display = 'flex';
        document.body.classList.remove('login-active');
        initAdmin();
    }

    function logout() {
        localStorage.removeItem('isLoggedIn');
        location.reload();
    }

    function initLogin() {
        if (localStorage.getItem('isLoggedIn') === 'true') {
            showAdmin();
            return;
        }

        document.body.classList.add('login-active');
        loginForm.addEventListener('submit', e => {
            e.preventDefault();
            const user = username.value.trim();
            const pass = password.value.trim();

            if (user === LOGIN_USER && pass === LOGIN_PASS) {
                localStorage.setItem('isLoggedIn', 'true');
                showAdmin();
            } else {
                loginError.style.display = 'block';
            }
        });

        const logoutBtn = document.createElement('button');
        logoutBtn.textContent = '🔒 Déconnexion';
        logoutBtn.className = 'btn btn-warning mt-3';
        logoutBtn.addEventListener('click', logout);
        sidebar.appendChild(logoutBtn);
    }

    // --- Interface admin ---
    function render() {
        ['formation', 'personnel'].forEach(cat => {
            const tbody = document.querySelector(`#table-${cat} tbody`);
            if (!tbody) return;

            tbody.innerHTML = (data[cat] || []).map((p, i) => `
                <tr>
                    <td><input class="form-control form-control-sm" value="${p.name || ''}" oninput="update('${cat}',${i},'name',this.value)"></td>
                    <td><input class="form-control form-control-sm" value="${p.url || ''}" oninput="update('${cat}',${i},'url',this.value)"></td>
                    <td><input class="form-control form-control-sm" value="${p.description || ''}" oninput="update('${cat}',${i},'description',this.value)"></td>
                    <td><input class="form-control form-control-sm" value="${p.img || ''}" oninput="update('${cat}',${i},'img',this.value)"></td>
                    <td><input class="form-control form-control-sm" value="${p.type || ''}" oninput="update('${cat}',${i},'type',this.value)"></td>
                    <td><button class="btn btn-sm btn-danger" onclick="removeItem('${cat}',${i})">🗑</button></td>
                </tr>
            `).join('');
        });
    }

    function initAdmin() {
        window.update = (cat, i, field, val) => data[cat][i][field] = val;
        window.removeItem = (cat, i) => { data[cat].splice(i, 1); render(); };
        window.add = cat => { data[cat].push({ name: '', url: '', description: '', img: '', type: '' }); render(); };

        window.showSection = cat => {
            ['formation', 'personnel'].forEach(c => {
                document.getElementById(`section-${c}`).style.display = c === cat ? 'block' : 'none';
                document.getElementById(`link-${c}`).classList.toggle('active', c === cat);
            });
        };

        exportBtn.addEventListener('click', saveToGitHub);
        loadData();
    }

    // --- GitHub ---
    async function loadData() {
        try {
            const res = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}`);
            if (!res.ok) throw new Error(res.statusText);

            const json = await res.json();
            fileSha = json.sha; // ← récupérer le sha du fichier
            data = JSON.parse(atob(json.content));

            render();
            exportBtn.disabled = false;
        } catch (err) {
            alert('Erreur chargement données : ' + err.message);
        }
    }

    async function saveToGitHub() {
        if (!GITHUB_TOKEN) {
            GITHUB_TOKEN = prompt('🔑 Token GitHub requis :')?.trim() || '';
            if (!GITHUB_TOKEN) return;
        }

        try {
            const content = btoa(unescape(encodeURIComponent(JSON.stringify(data, null, 2))));

            const res = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${GITHUB_TOKEN}`,
                    'Accept': 'application/vnd.github+json'
                },
                body: JSON.stringify({
                    message: `🔧 MAJ ${new Date().toLocaleString('fr-FR')}`,
                    content,
                    sha: fileSha || undefined
                })
            });

            if (!res.ok) throw new Error((await res.json()).message || res.statusText);
            const result = await res.json();
            fileSha = result.content.sha;
            alert('✅ Sauvegardé avec succès');
        } catch (err) {
            alert('Erreur sauvegarde : ' + err.message);
        }
    }

    // --- Démarrage ---
    initLogin();
});