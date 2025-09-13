document.addEventListener('DOMContentLoaded', () => {

    // --- Login ---
    const LOGIN_USER = 'zeigadis';
    const LOGIN_PASS = 'pasonnic83';
    const loginContainer = document.getElementById('login-container');
    const adminContainer = document.getElementById('admin-container');

    function showAdminPanel() {
        loginContainer.style.display = 'none';
        adminContainer.style.display = 'flex';
        initAdmin(); // charger l'admin uniquement après login
    }

    // session persistante
    if (localStorage.getItem('isLoggedIn') === 'true') showAdminPanel();

    document.getElementById('login-form').addEventListener('submit', e => {
        e.preventDefault();
        const user = document.getElementById('username').value;
        const pass = document.getElementById('password').value;
        if (user === LOGIN_USER && pass === LOGIN_PASS) {
            localStorage.setItem('isLoggedIn', 'true');
            showAdminPanel();
        } else {
            document.getElementById('login-error').style.display = 'block';
        }
    });

    // --- Déconnexion ---
    const sidebar = document.querySelector('.sidebar');
    const logoutBtn = document.createElement('button');
    logoutBtn.textContent = '🔒 Déconnexion';
    logoutBtn.className = 'btn btn-warning mt-3';
    logoutBtn.onclick = () => { localStorage.removeItem('isLoggedIn'); location.reload(); };
    sidebar.appendChild(logoutBtn);

    // --- Admin & GitHub ---
    function initAdmin() {

        const GITHUB_TOKEN = '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';
        const REPO_OWNER = 'pascal-fortunati';
        const REPO_NAME = 'pascal-fortunati.github.io';
        const FILE_PATH = 'projects.json';
        let fileSha = '';
        let data = { formation: [], personnel: [] };

        async function loadData() {
            const res = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}`);
            const json = await res.json();
            fileSha = json.sha;
            const decoded = atob(json.content.replace(/\n/g, ''));
            data = JSON.parse(decoded);
            render();
        }

        function render() {
            renderTable('formation');
            renderTable('personnel');
        }

        function renderTable(cat) {
            const tbody = document.querySelector(`#table-${cat} tbody`);
            tbody.innerHTML = '';
            data[cat].forEach((p, i) => {
                tbody.innerHTML += `<tr>
                    <td><input class="form-control form-control-sm" value="${p.name}" oninput="update('${cat}',${i},'name',this.value)"></td>
                    <td><input class="form-control form-control-sm" value="${p.url}" oninput="update('${cat}',${i},'url',this.value)"></td>
                    <td><input class="form-control form-control-sm" value="${p.description}" oninput="update('${cat}',${i},'description',this.value)"></td>
                    <td><input class="form-control form-control-sm" value="${p.img}" oninput="update('${cat}',${i},'img',this.value)"></td>
                    <td><input class="form-control form-control-sm" value="${p.type}" oninput="update('${cat}',${i},'type',this.value)"></td>
                    <td><button class="btn btn-sm btn-danger" onclick="remove('${cat}',${i})">🗑 supprimer</button></td>
                </tr>`;
            });
        }

        function update(cat, i, field, value) { data[cat][i][field] = value; }
        function remove(cat, i) { data[cat].splice(i, 1); render(); }
        function add(cat) { data[cat].push({ name: '', url: '', description: '', img: '', type: '' }); render(); }

        async function updateGitHubFile(newData) {
            const content = btoa(JSON.stringify(newData, null, 2));
            const res = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `token ${GITHUB_TOKEN}`,
                    'Accept': 'application/vnd.github+json'
                },
                body: JSON.stringify({ message: 'Mise à jour depuis Admin Panel', content, sha: fileSha })
            });
            const result = await res.json();
            if (res.ok) { alert('projects.json mis à jour ✅'); fileSha = result.content.sha; }
            else { alert('Erreur: ' + JSON.stringify(result)); }
        }

        document.getElementById('exportBtn').onclick = async () => { await updateGitHubFile(data); };

        window.showSection = cat => {
            document.getElementById('section-formation').style.display = cat === 'formation' ? 'block' : 'none';
            document.getElementById('section-personnel').style.display = cat === 'personnel' ? 'block' : 'none';
            document.getElementById('link-formation').classList.remove('active');
            document.getElementById('link-personnel').classList.remove('active');
            if (cat === 'formation') document.getElementById('link-formation').classList.add('active');
            if (cat === 'personnel') document.getElementById('link-personnel').classList.add('active');
        };

        window.add = add;
        window.update = update;
        window.remove = remove;

        loadData();
    }
});