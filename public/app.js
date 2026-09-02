const socket = io();

function joinGame() {
  const username = document.getElementById('username-input').value;
  if (username.trim() !== "") {
    socket.emit('joinGame', username);
    document.getElementById('join-screen').style.display = 'none';
    document.getElementById('game-screen').style.display = 'block';
  }
}

function startGame() {
  socket.emit('startGame');
  document.getElementById('start-btn').style.display = 'none';
}

socket.on('updatePlayers', (players) => {
  const container = document.getElementById('players-container');
  container.innerHTML = '';
  players.sort((a, b) => b.score - a.score);
  players.forEach(p => {
    const div = document.createElement('div');
    div.className = 'player-item';
    div.innerHTML = `<span>${p.username}</span> <strong>${p.score} P</strong>`;
    container.appendChild(div);
  });
});

socket.on('newQuestion', (data) => {
  document.getElementById('question-box').style.display = 'block';
  document.getElementById('question-text').innerText = `${data.questionNumber}/${data.totalQuestions}: ${data.question}`;
  
  const optionsContainer = document.getElementById('options-container');
  optionsContainer.innerHTML = '';

  data.options.forEach((opt, index) => {
    const btn = document.createElement('button');
    btn.innerText = opt;
    btn.onclick = () => {
      socket.emit('submitAnswer', index);
      optionsContainer.querySelectorAll('button').forEach(b => b.disabled = true);
    };
    optionsContainer.appendChild(btn);
  });
});

socket.on('gameOver', (players) => {
  document.getElementById('question-box').innerHTML = '<h2>Oyun Bitti!</h2>';
});
