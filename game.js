let questions = [];
let currentQuestion = null;
let selectedRegionId = null;
let activePlayer = 1; // Sıradaki oyuncu (1-4)

const playerColors = {
  1: "#e74c3c",
  2: "#3498db",
  3: "#2ecc71",
  4: "#f1c40f"
};

const playerScores = { 1: 1000, 2: 1000, 3: 1000, 4: 1000 };

// Soruları JSON'dan yükle
fetch('questions.json')
  .then(res => res.json())
  .then(data => { questions = data; })
  .catch(err => console.error("Soru yükleme hatası:", err));

function selectRegion(regionId) {
  selectedRegionId = regionId;
  openQuestionModal();
}

function openQuestionModal() {
  if (questions.length === 0) {
    alert("Sorular henüz yüklenmedi veya questions.json dosyası eksik!");
    return;
  }
  
  // Rastgele soru seç
  const randomIndex = Math.floor(Math.random() * questions.length);
  currentQuestion = questions[randomIndex];

  document.getElementById('question-text').innerText = currentQuestion.question;
  const optionsContainer = document.getElementById('options-container');
  optionsContainer.innerHTML = '';

  currentQuestion.options.forEach((opt, index) => {
    const btn = document.createElement('button');
    btn.className = 'btn-option';
    btn.innerText = opt;
    btn.onclick = () => handleAnswer(index);
    optionsContainer.appendChild(btn);
  });

  // Modal penceresini aç
  document.getElementById('question-modal').style.display = 'flex';
}

function handleAnswer(selectedIndex) {
  document.getElementById('question-modal').style.display = 'none';

  if (selectedIndex === currentQuestion.answer) {
    alert(`Doğru Cevap! ${activePlayer}. Oyuncu bölgeyi fethetti.`);
    
    // Bölgenin rengini değiştiren fetih mekaniği
    const regionObj = document.getElementById(`region-${selectedRegionId}`);
    if (regionObj) {
      regionObj.setAttribute('fill', playerColors[activePlayer]);
    }
    
    // Puan Güncelle
    playerScores[activePlayer] += 400;
    document.getElementById(`score-${activePlayer}`).innerText = playerScores[activePlayer];
  } else {
    alert("Yanlış Cevap! Sıra diğer oyuncuya geçiyor.");
  }

  // Sıradaki oyuncuya geç (1 -> 2 -> 3 -> 4 -> 1)
  activePlayer = (activePlayer % 4) + 1;
}
