// Firebase Bilgilerinizi Buraya Ekleyin
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  databaseURL: "https://YOUR_PROJECT-default-rtdb.firebaseio.com",
  projectId: "YOUR_PROJECT",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "123456789",
  appId: "YOUR_APP_ID"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.database();

let currentUser = null;
let currentRoomId = null;

const questions = [
  { q: "Türkiye'nin başkenti neresidir?", options: ["İstanbul", "Ankara", "İzmir", "Bursa"], a: 1 },
  { q: "Fatih Sultan Mehmet İstanbul'u kaç yılında fethetmiştir?", options: ["1071", "1453", "1299", "1923"], a: 1 },
  { q: "Dünyanın en geniş okyanusu hangisidir?", options: ["Atlas", "Hint", "Pasifik", "Kutup"], a: 2 }
];

// 1. Google (Gmail) Giriş Fonksiyonu
function loginWithGoogle() {
  const provider = new firebase.auth.GoogleAuthProvider();
  auth.signInWithPopup(provider).catch(err => alert("Giriş Yapılamadı: " + err.message));
}

// Oturum Durumu Takibi
auth.onAuthStateChanged(user => {
  if (user) {
    currentUser = user;
    document.getElementById('auth-screen').style.display = 'none';
    document.getElementById('lobby-screen').style.display = 'block';
    document.getElementById('user-display').innerText = `Oyuncu: ${user.displayName}`;

    // Oyuncuyu Genel Sıralama Veritabanına Kaydet/Güncelle
    db.ref(`users/${user.uid}`).update({
      name: user.displayName
    });
  }
});

// 2. 4 Kişilik Hızlı Eşleşme Motoru (Matchmaking)
function findMatch() {
  document.getElementById('match-status').innerText = "Uygun oda aranıyor...";

  db.ref('rooms').once('value', snapshot => {
    const rooms = snapshot.val();
    let foundRoomId = null;

    if (rooms) {
      // Bekleyen ve oyuncu sayısı 4'ten az olan odayı bul
      for (let key in rooms) {
        if (rooms[key].status === 'waiting' && Object.keys(rooms[key].players || {}).length < 4) {
          foundRoomId = key;
          break;
        }
      }
    }

    if (foundRoomId) {
      joinRoom(foundRoomId);
    } else {
      createRoom();
    }
  });
}

function createRoom() {
  const newRoomRef = db.ref('rooms').push();
  currentRoomId = newRoomRef.key;

  newRoomRef.set({
    status: 'waiting',
    createdAt: Date.now()
  });

  joinRoom(currentRoomId);
}

function joinRoom(roomId) {
  currentRoomId = roomId;
  const playerRef = db.ref(`rooms/${roomId}/players/${currentUser.uid}`);

  playerRef.set({
    name: currentUser.displayName,
    score: 0
  });

  playerRef.onDisconnect().remove();

  // Oda Durumunu Dinle (4 Kişi Oldu Mu?)
  db.ref(`rooms/${roomId}/players`).on('value', snapshot => {
    const players = snapshot.val();
    const count = players ? Object.keys(players).length : 0;

    document.getElementById('match-status').innerText = `Oyuncular Bekleniyor: (${count}/4)`;

    if (count === 4) {
      db.ref(`rooms/${roomId}`).update({ status: 'playing' });
      startMatch();
    }
  });
}

// 3. Yarışmayı Başlatma
function startMatch() {
  document.getElementById('lobby-screen').style.display = 'none';
  document.getElementById('game-screen').style.display = 'block';
  document.getElementById('room-info').innerText = "Oda Tamamlandı! Yarışma Başladı.";

  loadQuestion(0);
}

function loadQuestion(qIndex) {
  if (qIndex >= questions.length) {
    document.getElementById('question-text').innerText = "Oyun Bitti!";
    document.getElementById('options-container').innerHTML = '';
    return;
  }

  const q = questions[qIndex];
  document.getElementById('question-text').innerText = q.q;
  const container = document.getElementById('options-container');
  container.innerHTML = '';

  q.options.forEach((opt, idx) => {
    const btn = document.createElement('button');
    btn.className = 'btn-option';
    btn.innerText = opt;
    btn.onclick = () => {
      if (idx === q.a) {
        addScore(1000); // Doğru cevaba 1000 puan
        alert("Doğru!");
      } else {
        alert("Yanlış!");
      }
      loadQuestion(qIndex + 1);
    };
    container.appendChild(btn);
  });
}

function addScore(points) {
  // Hem oda içine hem de genel puan tablosuna ekle
  db.ref(`users/${currentUser.uid}/score`).transaction(current => (current || 0) + points);
}

// 4. Genel Canlı Sıralama Tablosu (Puana Göre Otomatik Dizilim)
db.ref('users').orderByChild('score').on('value', snapshot => {
  const container = document.getElementById('leaderboard-container');
  container.innerHTML = '';
  
  let userList = [];
  snapshot.forEach(child => {
    userList.push(child.val());
  });

  // En yüksek puandan en düşüğe sırala
  userList.sort((a, b) => (b.score || 0) - (a.score || 0));

  userList.forEach((u, index) => {
    const div = document.createElement('div');
    div.className = `rank-item ${index === 0 ? 'rank-1' : index === 1 ? 'rank-2' : ''}`;
    div.innerHTML = `<span><strong>${index + 1}. ${u.name}</strong></span> <span>${u.score || 0} P</span>`;
    container.appendChild(div);
  });
});
