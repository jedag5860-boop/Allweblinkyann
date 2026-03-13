// ==================== DATA KREDENSIAL ====================
const users = [
    { username: 'YANNWEB', password: 'Brian123', role: 'admin' },
    { username: 'YANN444', password: 'YANN444', role: 'user' }
];

// ==================== STATE APLIKASI ====================
let currentUser = null;
let cards = [];
let nextId = 1;
let editingId = null;

// ==================== ELEMEN DOM ====================
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

// ==================== FUNGSI LOCALSTORAGE ====================
// Simpan data ke localStorage
function saveCardsToStorage() {
    try {
        if (!Array.isArray(cards)) {
            console.error('cards bukan array, tidak bisa disimpan');
            return;
        }
        localStorage.setItem('dashboardCards', JSON.stringify(cards));
        console.log('Data berhasil disimpan:', cards);
    } catch (e) {
        console.error('Gagal menyimpan ke localStorage:', e);
        alert('Penyimpanan lokal gagal. Pastikan browser Anda mendukung localStorage.');
    }
}

// Muat data dari localStorage
function loadCardsFromStorage() {
    const stored = localStorage.getItem('dashboardCards');
    if (stored) {
        try {
            const parsed = JSON.parse(stored);
            // Validasi: harus array dan setiap item memiliki id, text
            if (Array.isArray(parsed) && parsed.every(item => item.hasOwnProperty('id') && item.hasOwnProperty('text'))) {
                cards = parsed;
                // Hitung nextId berdasarkan id terbesar
                if (cards.length > 0) {
                    nextId = Math.max(...cards.map(c => c.id)) + 1;
                } else {
                    nextId = 1;
                }
                console.log('Data dimuat dari localStorage:', cards);
            } else {
                throw new Error('Format data tidak valid');
            }
        } catch (e) {
            console.warn('Data di localStorage rusak, menggunakan data default:', e);
            setDefaultCards();
        }
    } else {
        console.log('localStorage kosong, menggunakan data default');
        setDefaultCards();
    }
}

// Data default (jika belum ada data)
function setDefaultCards() {
    cards = [
        { id: 1, text: 'Google', url: 'https://google.com' },
        { id: 2, text: 'YouTube', url: 'https://youtube.com' },
        { id: 3, text: 'Catatan Penting', url: '' },
    ];
    nextId = 4;
    saveCardsToStorage(); // Simpan default ke localStorage
}

// Panggil load saat halaman dimuat
loadCardsFromStorage();

// ==================== HELPER URL ====================
function formatUrl(url) {
    if (!url) return '';
    // Jika tidak dimulai dengan http:// atau https://, tambahkan https://
    if (!url.match(/^https?:\/\//i)) {
        return 'https://' + url;
    }
    return url;
}

// ==================== RENDER CARD ====================
function renderCards() {
    if (!cardsGrid) return;
    cardsGrid.innerHTML = '';

    cards.forEach(card => {
        const cardDiv = document.createElement('div');
        cardDiv.className = 'card';
        cardDiv.setAttribute('data-id', card.id);

        let content = '';
        if (card.url) {
            const href = formatUrl(card.url);
            content = `<a href="${href}" target="_blank" rel="noopener noreferrer">${card.text}</a>`;
        } else {
            content = `<p>${card.text}</p>`;
        }

        cardDiv.innerHTML = content;

        // Tombol admin (edit & hapus) jika user adalah admin
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

    // Pasang event listener untuk tombol edit/hapus (hanya admin)
    if (currentUser && currentUser.role === 'admin') {
        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = parseInt(btn.dataset.id);
                startEditCard(id);
            });
        });

        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = parseInt(btn.dataset.id);
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
        menuToggle.style.display = user.role === 'admin' ? 'block' : 'none';
        renderCards(); // Tampilkan card yang sudah dimuat dari localStorage
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

function deleteCard(id) {
    if (confirm('Yakin ingin menghapus kotak ini?')) {
        cards = cards.filter(c => c.id !== id);
        saveCardsToStorage(); // Simpan perubahan
        renderCards();
    }
}

function saveCard() {
    const text = cardTitle.value.trim();
    if (!text) {
        alert('Judul/teks tidak boleh kosong');
        return;
    }
    let url = cardUrl.value.trim();

    // Format URL jika ada (tambahkan https:// jika perlu)
    if (url) {
        url = formatUrl(url);
    }

    if (editingId !== null) {
        // Update card
        const index = cards.findIndex(c => c.id === editingId);
        if (index !== -1) {
            cards[index] = { ...cards[index], text, url };
        }
    } else {
        // Tambah baru
        const newCard = {
            id: nextId++,
            text: text,
            url: url
        };
        cards.push(newCard);
    }

    saveCardsToStorage(); // Simpan ke localStorage
    renderCards();
    resetForm();
    // Jika ingin menutup sidebar setelah tambah, aktifkan baris di bawah:
    // closeSidebar();
}

addCardBtn.addEventListener('click', saveCard);
cancelEditBtn.addEventListener('click', resetForm);

// Sembunyikan menu toggle saat awal
menuToggle.style.display = 'none';

// ==================== DEBUGGING (opsional) ====================
// Untuk memudahkan pengecekan, Anda bisa mengetik di console:
//   localStorage.getItem('dashboardCards')   -> melihat data mentah
//   cards                                    -> melihat data di memori
console.log('Script siap. Data cards saat ini:', cards);