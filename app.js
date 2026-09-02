// Oyun Durum Değişkenleri
const STAGES = { CAPITAL_SELECT: 1, NUMERIC_DISTRIBUTION: 2, ATTACK_PHASE: 3 };
let currentStage = STAGES.CAPITAL_SELECT;

const players = [
  { id: 1, name: "Kırmızı", score: 0, color: "#ff4d4d", capitalId: null },
  { id: 2, name: "Yeşil", score: 0, color: "#2ecc71", capitalId: null },
  { id: 3, name: "Mavi", score: 0, color: "#3498db", capitalId: null },
  { id: 4, name: "Mor", score: 0, color: "#9b59b6", capitalId: null }
];

let activePlayerIdx = 0;
let targetRegionIdx = null;

// 9 Bölge Harita Yapısı
const regions = [
  { id: 1, name: "Marmara", owner: null, isCapital: false, hp: 1, value: 200 },
  { id: 2, name: "Ege", owner: null, isCapital: false, hp: 1, value: 200 },
  { id: 3, name: "Akdeniz", owner: null, isCapital: false, hp: 1, value: 200 },
  { id: 4, name: "İç Anadolu", owner: null, isCapital: false, hp: 1, value: 200 },
  { id: 5, name: "Karadeniz", owner: null, isCapital: false, hp: 1, value: 200 },
  { id: 6, name: "Doğu Anadolu", owner: null, isCapital: false, hp: 1, value: 200 },
  { id: 7, name: "Güneydoğu", owner: null, isCapital: false, hp: 1, value: 200 },
  { id: 8, name: "Trakya", owner: null, isCapital: false, hp: 1, value: 200 },
  { id: 9, name: "Kafkas", owner: null, isCapital: false, hp: 1, value: 200 }
];

function initGame() {
  renderMap();
  updateStatus(`${players[activePlayerIdx].name} - Ana Kaleni Seç! (1000 Puan)`);
}

function updateStatus(msg) {
  document.getElementById("game-status").innerText = msg;
}

function renderMap() {
  const mapEl = document.getElementById("mapGrid");
  mapEl.innerHTML = "";

  regions.forEach((reg, idx) => {
    const div = document.createElement("div");
    div.className = `region ${reg.owner ? 'owner-' + reg.owner : ''} ${reg.isCapital ? 'capital' : ''}`;
    
    let icon = reg.isCapital ? "🏰" : "🛡️";
    let ownerText = reg.owner ? players.find(p => p.id === reg.owner).name : "Boş";

    div.innerHTML = `
      <div>${icon} ${reg.name}</div>
      <div class="badge">${reg.value} P</div>
      <small>${ownerText}</small>
    `;

    div.onclick = () => handleRegionClick(idx);
    mapEl.appendChild(div);
  });

  updateScoreboard();
}

function updateScoreboard() {
  players.forEach(p => {
    document.getElementById(`p${p.id}-score`).innerText = `${p.score} P`;
    const card = document.getElementById(`p${p.id}-card`);
    if (players[activePlayerIdx].id === p.id) {
      card.classList.add("active");
    } else {
      card.classList.remove("active");
    }
  });
}

function handleRegionClick(idx) {
  const reg = regions[idx];
  const p = players[activePlayerIdx];

  // AŞAMA 1: Ana Kule Seçimi
  if (currentStage === STAGES.CAPITAL_SELECT) {
    if (reg.owner !== null) return alert("Bu bölge dolu!");
    
    reg.owner = p.id;
    reg.isCapital = true;
    reg.value = 1000;
    reg.hp = 3; // Ana kule yıkımı için 3 can
    p.capitalId = reg.id;
    p.score += 1000;

    activePlayerIdx++;
    if (activePlayerIdx >= players.length) {
      activePlayerIdx = 0;
      currentStage = STAGES.NUMERIC_DISTRIBUTION;
      startNumericPhase();
    } else {
      updateStatus(`${players[activePlayerIdx].name} - Ana Kaleni Seç! (1000 Puan)`);
    }
    renderMap();
  } 
  // AŞAMA 3: Saldırı ve Fetih
  else if (currentStage === STAGES.ATTACK_PHASE) {
    if (reg.owner === p.id) return alert("Kendi bölgene saldıramazsın!");
    targetRegionIdx = idx;
    openMultipleChoiceModal();
  }
}

// AŞAMA 2: Tahmin Sorusu ile Boş Bölgeleri Dağıtma
function startNumericPhase() {
  const emptyRegions = regions.filter(r => r.owner === null);
  if (emptyRegions.length === 0) {
    currentStage = STAGES.ATTACK_PHASE;
    updateStatus(`${players[activePlayerIdx].name} - Saldırmak için bir bölge seç!`);
    return;
  }

  const q = numericQuestions[Math.floor(Math.random() * numericQuestions.length)];
  document.getElementById("modalHeader").innerText = "TAHMİN SORUSU (En Yakın Olan Bölgeyi Alır)";
  document.getElementById("questionText").innerText = q.q;
  document.getElementById("multipleChoiceContainer").style.display = "none";
  
  const numCon = document.getElementById("numericContainer");
  numCon.style.display = "flex";
  document.getElementById("questionModal").style.display = "flex";

  document.getElementById("submitNumericBtn").onclick = () => {
    const val = parseInt(document.getElementById("numericInput").value);
    if (isNaN(val)) return;

    document.getElementById("questionModal").style.display = "none";
    document.getElementById("numericInput").value = "";

    // Doğru cevaba en yakın oyuncuyu (simüle edilmiş mantık) hesaplayıp boş bölgeyi ver
    const emptyReg = regions.find(r => r.owner === null);
    if (emptyReg) {
      emptyReg.owner = players[activePlayerIdx].id;
      players[activePlayerIdx].score += emptyReg.value;
    }

    activePlayerIdx = (activePlayerIndex + 1) % players.length;
    renderMap();
    startNumericPhase();
  };
}

// AŞAMA 3: Çoktan Seçmeli Saldırı Modalı
function openMultipleChoiceModal() {
  const q = multipleChoiceQuestions[Math.floor(Math.random() * multipleChoiceQuestions.length)];
  document.getElementById("modalHeader").innerText = "FETİH SAVAŞI";
  document.getElementById("questionText").innerText = q.q;
  document.getElementById("numericContainer").style.display = "none";

  const container = document.getElementById("multipleChoiceContainer");
  container.style.display = "grid";
  container.innerHTML = "";

  q.options.forEach((opt, i) => {
    const btn = document.createElement("button");
    btn.className = "opt-btn";
    btn.innerText = opt;
    btn.onclick = () => resolveAttack(i === q.answer);
    container.appendChild(btn);
  });

  document.getElementById("questionModal").style.display = "flex";
}

function resolveAttack(isCorrect) {
  document.getElementById("questionModal").style.display = "none";
  const reg = regions[targetRegionIdx];
  const attacker = players[activePlayerIdx];

  if (isCorrect) {
    if (reg.isCapital) {
      reg.hp--;
      alert(`Doğru cevap! Ana kalenin canı düştü. Kalan Can: ${reg.hp}`);
      if (reg.hp <= 0) {
        alert(`EFSANEVİ FETİH! ${reg.name} Ana Kalesi Yıkıldı!`);
        transferAllLands(reg.owner, attacker.id);
      }
    } else {
      alert(`Tebrikler! ${reg.name} bölgesi fethedildi!`);
      if (reg.owner) {
        const defender = players.find(p => p.id === reg.owner);
        defender.score -= reg.value;
      }
      reg.owner = attacker.id;
      attacker.score += reg.value;
    }
  } else {
    alert("Yanlış cevap! Fetih başarısız oldu.");
  }

  activePlayerIdx = (activePlayerIdx + 1) % players.length;
  updateStatus(`${players[activePlayerIdx].name} - Saldırmak için bir bölge seç!`);
  renderMap();
}

// Ana Kule Yıkıldığında Tüm Toprakları El Değiştirme Kuralı
function transferAllLands(fromPlayerId, toPlayerId) {
  const winner = players.find(p => p.id === toPlayerId);
  const loser = players.find(p => p.id === fromPlayerId);

  regions.forEach(r => {
    if (r.owner === fromPlayerId) {
      r.owner = toPlayerId;
      winner.score += r.value;
    }
  });
  loser.score = 0;
}

// Oyunu Başlat
initGame();
    
