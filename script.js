// Referensi ke koleksi "cards" di Firestore
const cardsCollection = db.collection('cards');

let currentUser = null;
let cards = [];
let editingId = null;

// Elemen DOM
const loginContainer = document.getElementById('loginContainer');
const mainApp = document.getElementById('mainApp');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const loginBtn = document.getElementById('loginBtn');
const errorMsg = document.getElementById('errorMsg');
const userInfo = document.getElementById('userInfo');
const cardsGrid = document.getElementById('cardsGrid');
const menuToggle = document.getElementById('menuToggle');
const sidebar = document.getElementById('sidebar');
const overlay = document.getElementById('overlay');
const cardTitle = document.getElementById('cardTitle');
const cardUrl = document.getElementById('cardUrl');
const addCardBtn = document.getElementById('addCardBtn');
const cancelEditBtn = document.getElementById('cancelEditBtn');

// Kredensial login
const users = [
    { username: 'YANNWEB', password: 'Brian123', role: 'admin' },
    { username: 'YANN444', password: 'YANN444', role: 'user' }
];

// ==================== FIRESTORE ====================
// Ambil data secara realtime
function loadCards() {
    cardsCollection.onSnapshot((snapshot) => {
        cards = [];
        snapshot.forEach(doc => {
            cards.push({ id: doc.id, ...doc.data() });
        });
        renderCards();
    }, (error) => {
        console.error("Gagal memuat data: ", error);
    });
}

// Tambah card
async function addCard(text, url) {
    try {
        await cardsCollection.add({ text, url });
    } catch (error) {
        console.error('Error adding card: ', error);
        alert('Gagal menambah data. Cek koneksi atau izin Firestore.');
    }
}

// Update card
async function updateCard(id, text, url) {
    try {
        await cardsCollection.doc(id).update({ text, url });
    } catch (error) {
        console.error('Error updating card: ', error);
        alert('Gagal mengupdate data.');
    }
}

// Hapus card
async function deleteCard(id) {
    if (confirm('Yakin ingin menghapus kotak ini?')) {
        try {
            await cardsCollection.doc(id).delete();
        } catch (error) {
            console.error('Error deleting card: ', error);
            alert('Gagal menghapus data.');
        }
    }
}

// ==================== RENDER CARDS ====================
function renderCards() {
    if (!cardsGrid) return;
    cardsGrid.innerHTML = '';
    cards.forEach(card => {
        const cardDiv = document.createElement('div');
        cardDiv.className = 'card';
        cardDiv.setAttribute('data-id', card.id);

        let content = '';
        if (card.url) {
            content = `<a href="${card.url}" target="_blank" rel="noopener noreferrer">${card.text}</a>`;
        } else {
            content = `<p>${card.text}</p>`;
        }

        cardDiv.innerHTML = content;

        // Jika admin, tambahkan tombol edit & hapus
        if (currentUser && currentUser.role === 'admin') {
            const actionsDiv = document.createElement('div');
            actionsDiv.className = 'card-actions';
            actionsDiv.innerHTML = `
                <button class="edit-btn" data-id="${card.id}"><i class="fas fa-edit"></i></button>
                <button class="delete-btn" data-id="${card.id}"><i class="fas fa-trash"></i></button>
            `;
            cardDiv.appendChild(actionsDiv);
        }

        cardsGrid.appendChild(cardDiv);
    });

    // Pasang event listener untuk tombol edit/hapus (khusus admin)
    if (currentUser && currentUser.role === 'admin') {
        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = btn.dataset.id;
                startEditCard(id);
            });
        });

        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = btn.dataset.id;
                deleteCard(id);
            });
        });
    }
}

// ==================== LOGIN ====================
function handleLogin() {
    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();
    const user = users.find(u => u.username === username && u.password === password);
    if (user) {
        currentUser = { username: user.username, role: user.role };
        loginContainer.style.display = 'none';
        mainApp.style.display = 'block';
        userInfo.textContent = `${user.username} (${user.role})`;
        if (user.role === 'admin') {
            menuToggle.style.display = 'block';
        } else {
            menuToggle.style.display = 'none';
        }
        // Mulai memuat data dari Firestore
        loadCards();
        errorMsg.textContent = '';
    } else {
        errorMsg.textContent = 'Username atau password salah';
    }
}

loginBtn.addEventListener('click', handleLogin);
passwordInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleLogin();
});

// ==================== SIDEBAR ====================
menuToggle.addEventListener('click', () => {
    sidebar.classList.add('open');
    overlay.classList.add('active');
});

overlay.addEventListener('click', closeSidebar);

function closeSidebar() {
    sidebar.classList.remove('open');
    overlay.classList.remove('active');
    resetForm();
}

// ==================== FORM TAMBAH/EDIT ====================
function resetForm() {
    cardTitle.value = '';
    cardUrl.value = '';
    editingId = null;
    addCardBtn.textContent = 'Tambah';
    cancelEditBtn.style.display = 'none';
}

function startEditCard(id) {
    const card = cards.find(c => c.id === id);
    if (!card) return;
    editingId = id;
    cardTitle.value = card.text;
    cardUrl.value = card.url || '';
    addCardBtn.textContent = 'Update';
    cancelEditBtn.style.display = 'block';
    sidebar.classList.add('open');
    overlay.classList.add('active');
}

function saveCard() {
    const text = cardTitle.value.trim();
    if (!text) {
        alert('Judul/teks tidak boleh kosong');
        return;
    }
    const url = cardUrl.value.trim();

    if (editingId !== null) {
        updateCard(editingId, text, url);
    } else {
        addCard(text, url);
    }
    resetForm();
    // Sidebar bisa ditutup setelah simpan (opsional)
    closeSidebar();
}

addCardBtn.addEventListener('click', saveCard);
cancelEditBtn.addEventListener('click', resetForm);

// Sembunyikan menu toggle saat awal
menuToggle.style.display = 'none';