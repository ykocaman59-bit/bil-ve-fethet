const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public'));

// Dahili Soru Bankası
const questions = [
  {
    id: 1,
    question: "Türkiye'nin başkenti neresidir?",
    options: ["İstanbul", "Ankara", "İzmir", "Bursa"],
    answer: 1,
    timeLimit: 10
  },
  {
    id: 2,
    question: "Dünyanın en geniş okyanusu hangisidir?",
    options: ["Atlas Okyanusu", "Hint Okyanusu", "Pasifik Okyanusu", "Kuzey Buz Okyanusu"],
    answer: 2,
    timeLimit: 10
  }
];

let players = {};
let currentQuestionIndex = 0;

io.on('connection', (socket) => {
  console.log('Yeni oyuncu bağlandı:', socket.id);

  // Oyuncu Lobiye Katılma
  socket.on('joinGame', (username) => {
    players[socket.id] = { id: socket.id, username: username || 'Oyuncu', score: 0 };
    io.emit('updatePlayers', Object.values(players));
  });

  // Oyunu Başlatma
  socket.on('startGame', () => {
    currentQuestionIndex = 0;
    sendNextQuestion();
  });

  // Cevap Alma
  socket.on('submitAnswer', (optionIndex) => {
    const q = questions[currentQuestionIndex];
    if (q && optionIndex === q.answer) {
      if (players[socket.id]) {
        players[socket.id].score += 10;
      }
    }
    io.emit('updatePlayers', Object.values(players));
  });

  // Bağlantı Kopması
  socket.on('disconnect', () => {
    delete players[socket.id];
    io.emit('updatePlayers', Object.values(players));
  });
});

function sendNextQuestion() {
  if (currentQuestionIndex < questions.length) {
    const q = questions[currentQuestionIndex];
    io.emit('newQuestion', {
      question: q.question,
      options: q.options,
      timeLimit: q.timeLimit,
      questionNumber: currentQuestionIndex + 1,
      totalQuestions: questions.length
    });
    currentQuestionIndex++;
  } else {
    io.emit('gameOver', Object.values(players));
  }
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`OpenTrivia sunucusu ${PORT} portunda çalışıyor...`));
