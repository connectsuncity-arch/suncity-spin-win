import './styles.css';

const slices = [
  { label: 'TRY AGAIN', multiplier: 0, color: '#ef4444', weight: 70 },
  { label: '1.5x', multiplier: 1.5, color: '#3b82f6', weight: 15 },
  { label: '2.0x', multiplier: 2.0, color: '#10b981', weight: 10 },
  { label: '3.0x', multiplier: 3.0, color: '#8b5cf6', weight: 5 }
];

const STORAGE_KEY = 'suncity-spin-win-state';
const defaultState = {
  balance: 1000,
  history: ['Ready. Start spinning to play!'],
  lastResult: ''
};

const app = document.querySelector('#app');

const state = loadState();
let currentRotation = 0;
let isSpinning = false;
const maxHistory = 6;

app.innerHTML = `
  <div class="app-shell">
    <header class="topbar">
      <div>
        <p class="eyebrow">Lucky Spin</p>
        <h1>Suncity Bet</h1>
      </div>
      <button id="resetBtn" class="secondary-btn" type="button">Reset</button>
    </header>

    <main class="game-layout">
      <section class="stats-panel">
        <div class="stat-card highlight">
          <span class="label">Balance</span>
          <strong id="balanceDisplay">1,000</strong>
          <small>KES</small>
        </div>

        <div class="stat-card">
          <span class="label">Loss Rate</span>
          <strong>70%</strong>
          <small>High-risk</small>
        </div>
      </section>

      <section class="wheel-panel">
        <div class="wheel-wrapper">
          <div class="pointer" aria-hidden="true"></div>
          <canvas id="wheel" width="320" height="320"></canvas>
        </div>
      </section>

      <section class="controls-panel">
        <div class="bet-row">
          <label for="betAmount">Bet Amount</label>
          <div class="bet-input-wrap">
            <input id="betAmount" type="number" min="10" step="10" value="50" />
            <span>KES</span>
          </div>
        </div>

        <button id="spinBtn" class="spin-btn" type="button">Spin Wheel</button>

        <div id="messageBox" class="message-box" aria-live="polite"></div>

        <div class="history-box">
          <h2>Recent Results</h2>
          <ul id="historyList" class="history-list"></ul>
        </div>
      </section>
    </main>
  </div>
`;

const canvas = document.getElementById('wheel');
const ctx = canvas.getContext('2d');
const spinBtn = document.getElementById('spinBtn');
const resetBtn = document.getElementById('resetBtn');
const balanceDisplay = document.getElementById('balanceDisplay');
const betInput = document.getElementById('betAmount');
const messageBox = document.getElementById('messageBox');
const historyList = document.getElementById('historyList');

function saveState() {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      balance: state.balance,
      history: state.history,
      lastResult: state.lastResult
    })
  );
}

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    return {
      balance: Number(saved.balance) || defaultState.balance,
      history: Array.isArray(saved.history) && saved.history.length ? saved.history : defaultState.history,
      lastResult: saved.lastResult || defaultState.lastResult
    };
  } catch {
    return { ...defaultState };
  }
}

function formatAmount(value) {
  return new Intl.NumberFormat('en-KE', { maximumFractionDigits: 0 }).format(value);
}

function updateBalanceDisplay() {
  balanceDisplay.textContent = formatAmount(state.balance);
}

function drawWheel() {
  const numSlices = slices.length;
  const sliceAngle = (2 * Math.PI) / numSlices;
  const radius = canvas.width / 2;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (let i = 0; i < numSlices; i++) {
    const startAngle = i * sliceAngle;
    const endAngle = startAngle + sliceAngle;

    ctx.beginPath();
    ctx.moveTo(radius, radius);
    ctx.arc(radius, radius, radius - 6, startAngle, endAngle);
    ctx.closePath();
    ctx.fillStyle = slices[i].color;
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#1e293b';
    ctx.stroke();

    ctx.save();
    ctx.translate(radius, radius);
    ctx.rotate(startAngle + sliceAngle / 2);
    ctx.textAlign = 'right';
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 15px sans-serif';
    ctx.fillText(slices[i].label, radius - 22, 5);
    ctx.restore();
  }

  ctx.beginPath();
  ctx.arc(radius, radius, 18, 0, Math.PI * 2);
  ctx.fillStyle = '#f8fafc';
  ctx.fill();

  ctx.beginPath();
  ctx.arc(radius, radius, 10, 0, Math.PI * 2);
  ctx.fillStyle = '#0f172a';
  ctx.fill();
}

function getRandomSliceIndex() {
  const totalWeight = slices.reduce((sum, slice) => sum + slice.weight, 0);
  let random = Math.random() * totalWeight;

  for (let i = 0; i < slices.length; i++) {
    if (random < slices[i].weight) {
      return i;
    }
    random -= slices[i].weight;
  }

  return 0;
}

function renderHistory() {
  historyList.innerHTML = '';

  state.history.forEach((entry) => {
    const li = document.createElement('li');
    li.innerHTML = entry;
    historyList.appendChild(li);
  });
}

function addHistoryEntry(text) {
  state.history.unshift(text);
  state.history = state.history.slice(0, maxHistory);
  renderHistory();
  saveState();
}

function setMessage(text, type = '') {
  messageBox.textContent = text;
  messageBox.className = `message-box ${type}`.trim();
}

function resetGame() {
  state.balance = 1000;
  state.history = ['Ready. Start spinning to play!'];
  state.lastResult = '';
  currentRotation = 0;
  isSpinning = false;
  betInput.value = 50;
  canvas.style.transform = 'rotate(0deg)';
  setMessage('Balance reset. Ready to spin!');
  updateBalanceDisplay();
  renderHistory();
  saveState();
  spinBtn.disabled = false;
}

function spin() {
  if (isSpinning) return;

  const bet = Number.parseFloat(betInput.value);

  if (Number.isNaN(bet) || bet <= 0) {
    setMessage('Please enter a valid bet amount.', 'loss');
    return;
  }

  if (bet > state.balance) {
    setMessage('Insufficient balance!', 'loss');
    return;
  }

  state.balance -= bet;
  updateBalanceDisplay();
  setMessage('Spinning...');

  isSpinning = true;
  spinBtn.disabled = true;

  const targetIndex = getRandomSliceIndex();
  const numSlices = slices.length;
  const sliceAngle = 360 / numSlices;
  const targetAngle = 360 - (targetIndex * sliceAngle + sliceAngle / 2);
  const extraRounds = 5 * 360;
  const finalRotation = currentRotation + extraRounds + (targetAngle - (currentRotation % 360));

  currentRotation = finalRotation;
  canvas.style.transform = `rotate(${finalRotation}deg)`;

  setTimeout(() => {
    const winningSlice = slices[targetIndex];
    const winAmount = Math.floor(bet * winningSlice.multiplier);

    if (winAmount > 0) {
      state.balance += winAmount;
      state.lastResult = `Win: ${winningSlice.label} +${formatAmount(winAmount)} KES`;
      setMessage(`You won ${formatAmount(winAmount)} KES! (${winningSlice.label})`, 'win');
      addHistoryEntry(`<span>Win</span> ${winningSlice.label} · +${formatAmount(winAmount)} KES`);
    } else {
      state.lastResult = `Loss: ${winningSlice.label} -${formatAmount(bet)} KES`;
      setMessage(`No luck! Landed on ${winningSlice.label}.`, 'loss');
      addHistoryEntry(`<span>Loss</span> ${winningSlice.label} · -${formatAmount(bet)} KES`);
    }

    updateBalanceDisplay();
    isSpinning = false;
    spinBtn.disabled = false;
    saveState();
  }, 4000);
}

spinBtn.addEventListener('click', spin);
resetBtn.addEventListener('click', resetGame);

updateBalanceDisplay();
drawWheel();
renderHistory();

if (state.lastResult) {
  setMessage(state.lastResult, state.lastResult.includes('Win') ? 'win' : 'loss');
} else {
  setMessage('Ready to spin!');
}

saveState();
