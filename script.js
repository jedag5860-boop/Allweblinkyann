import { initializeApp } from 'firebase/app';
import { getDatabase, ref, onValue, push, update, remove } from 'firebase/database';

// Konfigurasi Firebase (sesuaikan dengan milik Anda)
const firebaseConfig = {
  apiKey: "AIzaSyBLjuxUqz63Vic39mOA0iS2l4Eys0EZgeY",
  authDomain: "all-web-9b0bf.firebaseapp.com",
  databaseURL: "https://all-web-9b0bf-default-rtdb.firebaseio.com",
  projectId: "all-web-9b0bf",
  storageBucket: "all-web-9b0bf.firebasestorage.app",
  messagingSenderId: "337929778544",
  appId: "1:337929778544:web:94e556910dd7362cba0bb5",
  measurementId: "G-9SEYRFMXL0"
};

// Inisialisasi Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
const cardsRef = ref(database, 'cards'); // referensi ke node 'cards'

// Data kredensial (tetap)
const users = [
    { username: 'YANNWEBDEV', password: 'BRIAN2013', role: 'admin' },
    { username: 'YANN444', password: 'YANN444', role: 'user' }
];

let currentUser = null;
let cards = []; // akan diisi dari Firebase
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

// Listener realtime dari Firebase
onValue(cardsRef, (snapshot) => {
    const data = snapshot.val();
    if (data) {
        // Ubah object Firebase menjadi array dengan id sebagai key
        cards = Object.keys(data).map(key => ({
            id: key,
            ...data[key]
        }));
    } else {
        cards = [];
    }
    // Render ulang jika user sudah login
    if (currentUser) renderCards();
});

// Render cards
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

// Login
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
        renderCards(); // render dengan data yang sudah ada
        errorMsg.textContent = '';
    } else {
        errorMsg.textContent = 'Username atau password salah';
    }
}

loginBtn.addEventListener('click', handleLogin);
passwordInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleLogin();
});

// Sidebar
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
        const cardRefToDelete = ref(database, `cards/${id}`);
        remove(cardRefToDelete)
            .catch(error => alert('Gagal menghapus: ' + error));
    }
}

function saveCard() {
    const text = cardTitle.value.trim();
    if (!text) {
        alert('Judul/teks tidak boleh kosong');
        return;
    }
    const url = cardUrl.value.trim();

    if (editingId !== null) {
        // Update
        const cardRefToUpdate = ref(database, `cards/${editingId}`);
        update(cardRefToUpdate, { text, url: url || '' })
            .then(() => {
                resetForm();
                closeSidebar(); // opsional: tutup sidebar setelah update
            })
            .catch(error => alert('Gagal mengupdate: ' + error));
    } else {
        // Tambah baru
        const newCard = {
            text: text,
            url: url || ''
        };
        push(cardsRef, newCard)
            .then(() => {
                resetForm();
                // Sidebar tetap terbuka, bisa ditutup jika diinginkan
            })
            .catch(error => alert('Gagal menambah: ' + error));
    }
}

addCardBtn.addEventListener('click', saveCard);
cancelEditBtn.addEventListener('click', resetForm);

// Sembunyikan menu toggle di awal
menuToggle.style.display = 'none';