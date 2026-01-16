window.addEventListener('load', () => {
  document.getElementById('achievements-modal').classList.add('hidden');
  // باقي الكود...
});
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const input = document.getElementById('wordInput');

canvas.width = 800;
canvas.height = 400;

const levelWords = {
  1: ['نص', 'دالة', 'كائن', 'متغير', 'حلقة', 'رقم', 'منطق', 'مدخل', 'مخرج'],
  2: ['مصفوفة', 'شرط', 'إرجاع', 'استيراد', 'تصدير', 'مقارنة', 'تكرار', 'تعريف'],
  3: ['واجهة', 'صنف', 'مكتبة', 'نموذج', 'خوارزمية', 'بنية', 'موروث', 'تجريد'],
  4: ['اطبع("مرحبا")', 'إذا (س > 10)', 'لـ(دع i = 0)', 'ارجع صواب', 'استدعاء دالة', 'تعريف صنف', 'مؤشر', 'قائمة'],
  5: ['تعريف صنف جديد', 'دالة تكرارية', 'مؤشر إلى كائن', 'قائمة مرتبطة', 'شجرة ثنائية', 'تعلم آلي', 'شبكة عصبية', 'قاعدة بيانات', 'تشفير', 'أمن سيبراني']
};

let enemies = [];
let score = 0;
let level = 1;
let gameRunning = false;
let timeLeft = 30;
let timerInterval;
let perfectStreak = 0;

// صوتيات
const shootSound = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-laser-shot-1672.mp3');
const gameOverSound = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-arcade-retro-game-over-213.mp3');
const levelUpSound = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-achievement-bell-600.mp3');
const bgMusic = new Audio('https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3');
bgMusic.loop = true;

// ✅ إصلاح تحميل الإنجازات
function resetAchievementsIfNeeded() {
  const saved = localStorage.getItem('achievements');
  if (!saved || saved === 'null' || saved === 'undefined') {
    localStorage.setItem('achievements', JSON.stringify(achievements));
  }
}

function loadAchievements() {
  try {
    const saved = JSON.parse(localStorage.getItem('achievements'));
    if (saved && Array.isArray(saved)) {
      saved.forEach((a, i) => {
        if (achievements[i]) achievements[i].unlocked = a.unlocked;
      });
    }
  } catch (e) {
    console.warn('خطأ في تحميل الإنجازات:', e);
  }
}

// وضع ليلي/نهاري
function applyTheme() {
  const theme = localStorage.getItem('theme') || 'dark';
  document.body.classList.toggle('light', theme === 'light');
  document.getElementById('theme-toggle').textContent = theme === 'light' ? '☀️ وضع نهاري' : '🌙 وضع ليلي';
}

function toggleTheme() {
  const current = localStorage.getItem('theme') || 'dark';
  const next = current === 'dark' ? 'light' : 'dark';
  localStorage.setItem('theme', next);
  applyTheme();
}

// موسيقى
function toggleMusic() {
  const btn = document.getElementById('music-toggle');
  if (bgMusic.paused) {
    bgMusic.play();
    btn.textContent = '🔇 إيقاف الموسيقى';
    localStorage.setItem('music', 'on');
  } else {
    bgMusic.pause();
    btn.textContent = '🎵 تشغيل الموسيقى';
    localStorage.setItem('music', 'off');
  }
}

// 🏆 الإنجازات
const achievements = [
  { id: 'first100', name: 'البداية القوية', desc: 'حقق 100 نقطة لأول مرة', icon: '💪', unlocked: false },
  { id: 'level5', name: 'العالم الخامس', desc: 'وصل إلى المستوى 5', icon: '🌍', unlocked: false },
  { id: 'perfect10', name: 'الكمال', desc: 'اكتب 10 كلمات متتالية بدون خطأ', icon: '✨', unlocked: false },
  { id: 'speed10', name: 'البرق', desc: 'أكمل تحدي يومي في أقل من 10 ثواني', icon: '⚡', unlocked: false }
];

function unlockAchievement(id) {
  const ach = achievements.find(a => a.id === id);
  if (ach && !ach.unlocked) {
    ach.unlocked = true;
    localStorage.setItem('achievements', JSON.stringify(achievements));
    showNotification(`🎉 إنجاز جديد: ${ach.name}`);
  }
}

function showAchievements() {
  loadAchievements();
  const list = document.getElementById('achievements-list');
  list.innerHTML = achievements.map(a => `
    <li class="${a.unlocked ? 'unlocked' : 'locked'}">
      ${a.icon} ${a.name} – ${a.desc}
    </li>
  `).join('');
  document.getElementById('achievements-modal').classList.remove('hidden');
}

function closeAchievements() {
  document.getElementById('achievements-modal').classList.add('hidden');
}

function showNotification(msg) {
  const note = document.createElement('div');
  note.style.position = 'fixed';
  note.style.top = '20px';
  note.style.left = '50%';
  note.style.transform = 'translateX(-50%)';
  note.style.background = '#06d6a0';
  note.style.color = '#000';
  note.style.padding = '10px 20px';
  note.style.borderRadius = '8px';
  note.style.zIndex = '2000';
  note.textContent = msg;
  document.body.appendChild(note);
  setTimeout(() => note.remove(), 3000);
}

// اللعبة
class Enemy {
  constructor(word) {
    this.word = word;
    this.x = Math.random() * (canvas.width - 100);
    this.y = -30;
    this.speed = 1 + level * 0.3;
  }

  update() {
    this.y += this.speed;
  }

  draw() {
    ctx.fillStyle = '#f9c74f';
    ctx.font = '20px Tahoma';
    ctx.fillText(this.word, this.x, this.y);
  }

  isTyped(value) {
    return value === this.word;
  }

  isOffScreen() {
    return this.y > canvas.height;
  }
}

function getWordsForLevel(lv) {
  if (lv >= 5) return levelWords[5];
  return levelWords[lv];
}

function spawnEnemy() {
  if (!gameRunning) return;
  const words = getWordsForLevel(level);
  const word = words[Math.floor(Math.random() * words.length)];
  enemies.push(new Enemy(word));
}

function startTimer() {
  timeLeft = 30 + (level * 5);
  timerInterval = setInterval(() => {
    timeLeft--;
    document.getElementById('timer').textContent = timeLeft;
    if (timeLeft <= 0) {
      endGame();
    }
  }, 1000);
}

function updateGame() {
  if (!gameRunning) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#e0e1dd';
  ctx.font = '18px Tahoma';
  ctx.fillText(`النقاط: ${score} | المستوى: ${level} | الوقت: ${timeLeft}`, 10, 20);

  enemies = enemies.filter(enemy => {
    enemy.update();
    enemy.draw();

    if (enemy.isOffScreen()) {
      endGame();
      return false;
    }

    return true;
  });
}

input.addEventListener('input', () => {
  const value = input.value.trim();
  enemies = enemies.filter(enemy => {
    if (enemy.isTyped(value)) {
      score += 10;
      document.getElementById('score').textContent = score;
      input.value = '';
      shootSound.play();
      createExplosion(enemy.x + 50, enemy.y);
      perfectStreak++;
      if (score >= 100) unlockAchievement('first100');
      if (level >= 5) unlockAchievement('level5');
      if (perfectStreak >= 10) unlockAchievement('perfect10');
      if (score % 50 === 0) {
        level++;
        document.getElementById('level').textContent = level;
        levelUpSound.play();
        clearInterval(timerInterval);
        startTimer();
      }
      return false;
    }
    return true;
  });
});

function createExplosion(x, y) {
  const particles = [];
  for (let i = 0; i < 20; i++) {
    particles.push({
      x: x,
      y: y,
      vx: (Math.random() - 0.5) * 4,
      vy: (Math.random() - 0.5) * 4,
      life: 30
    });
  }

  function animate() {
    particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.life--;
      ctx.globalAlpha = p.life / 30;
      ctx.fillStyle = '#f9c74f';
      ctx.fillRect(p.x, p.y, 4, 4);
    });
    ctx.globalAlpha = 1;
    if (particles[0].life > 0) requestAnimationFrame(animate);
  }

  animate();
}

function saveHighScore(score, time) {
  let highScores = JSON.parse(localStorage.getItem('highScores')) || [];
  highScores.push({ score, time, date: new Date().toLocaleDateString('ar-EG') });
  highScores.sort((a, b) => b.score - a.score);
  highScores = highScores.slice(0, 5);
  localStorage.setItem('highScores', JSON.stringify(highScores));
}

function getHighScores() {
  return JSON.parse(localStorage.getItem('highScores')) || [];
}

function saveDailyChallenge(score, time) {
  const today = new Date().toISOString().slice(0, 10);
  const daily = JSON.parse(localStorage.getItem('dailyChallenge')) || {};
  if (!daily[today] || time < daily[today].time) {
    daily[today] = { score, time };
    localStorage.setItem('dailyChallenge', JSON.stringify(daily));
  }
}

function getDailyChallenge() {
  const today = new Date().toISOString().slice(0, 10);
  const daily = JSON.parse(localStorage.getItem('dailyChallenge')) || {};
  return daily[today];
}

function shareResult() {
  const gameArea = document.getElementById('game-screen');
  html2canvas(gameArea).then(canvas => {
    const link = document.createElement('a');
    link.download = `نتيجتي-النخبة-${Date.now()}.png`;
    link.href = canvas.toDataURL();
    link.click();
  });
}

function startGame() {
  document.getElementById('start-screen').classList.add('hidden');
  document.getElementById('game-screen').classList.remove('hidden');
  input.focus();
  gameRunning = true;
  startTimer();
  setInterval(spawnEnemy, 2000);
  setInterval(updateGame, 1000 / 60);
}

function endGame() {
  gameRunning = false;
  clearInterval(timerInterval);
  gameOverSound.play();
  saveHighScore(score, timeLeft);
  saveDailyChallenge(score, timeLeft);
  if (timeLeft <= 10 && score > 0) unlockAchievement('speed10');
  document.getElementById('final-score').textContent = score;
  document.getElementById('final-time').textContent = timeLeft;
  const highScores = getHighScores();
  document.getElementById('high-scores').innerHTML = highScores
    .map((s, i) => `<li>${i + 1}. ${s.score} نقاط - ${s.time} ثانية</li>`)
    .join('');
  document.getElementById('game-screen').classList.add('hidden');
  document.getElementById('game-over-screen').classList.remove('hidden');
}

function restartGame() {
  location.reload();
}

// تهيئة
window.addEventListener('load', () => {
  resetAchievementsIfNeeded();
  applyTheme();
  loadAchievements();
  if (localStorage.getItem('music') === 'on') {
    bgMusic.play();
    document.getElementById('music-toggle').textContent = '🔇 إيقاف الموسيقى';
  }
});

