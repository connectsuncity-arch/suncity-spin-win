const slices = [
  { label: "TRY AGAIN", multiplier: 0, color: "#ef4444", weight: 70 },
  { label: "1.5x", multiplier: 1.5, color: "#3b82f6", weight: 15 },
  { label: "2.0x", multiplier: 2.0, color: "#10b981", weight: 10 },
  { label: "3.0x", multiplier: 3.0, color: "#8b5cf6", weight: 5 }
];

let balance = 1000;
let currentRotation = 0;
let isSpinning = false;
const maxHistory = 5;

const canvas = document.getElementById("wheel");
const ctx = canvas.getContext("2d");
const spinBtn = document.getElementById("spinBtn");
const resetBtn = document.getElementById("resetBtn");
const balanceDisplay = document.getElementById("balanceDisplay");
const betInput = document.getElementById("betAmount");
const messageBox = document.getElementById("messageBox");
const historyList = document.getElementById("historyList");

function formatAmount(value) {
  return new Intl.NumberFormat("en-KE", {
    maximumFractionDigits: 0
  }).format(value);
}

function updateBalanceDisplay() {
  balanceDisplay.textContent = formatAmount(balance);
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
    ctx.strokeStyle = "#1e293b";
    ctx.stroke();

    ctx.save();
    ctx.translate(radius, radius);
    ctx.rotate(startAngle + sliceAngle / 2);
    ctx.textAlign = "right";
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 15px sans-serif";
    ctx.fillText(slices[i].label, radius - 22, 5);
    ctx.restore();
  }

  ctx.beginPath();
  ctx.arc(radius, radius, 18, 0, Math.PI * 2);
  ctx.fillStyle = "#f8fafc";
  ctx.fill();

  ctx.beginPath();
  ctx.arc(radius, radius, 10, 0, Math.PI * 2);
  ctx.fillStyle = "#0f172a";
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

function addHistoryEntry(text) {
  const li = document.createElement("li");
  li.innerHTML = text;

  historyList.prepend(li);

  while (historyList.children.length > maxHistory) {
    historyList.removeChild(historyList.lastChild);
  }
}

function resetGame() {
  balance = 1000;
  currentRotation = 0;
  isSpinning = false;
  betInput.value = 50;
  canvas.style.transform = "rotate(0deg)";
  messageBox.textContent = "Balance reset. Ready to spin!";
  messageBox.className = "message-box";
  updateBalanceDisplay();
  addHistoryEntry("<span>Reset</span> Balance restored to 1,000 KES");
  spinBtn.disabled = false;
}

function spin() {
  if (isSpinning) return;

  const bet = Number.parseFloat(betInput.value);

  if (Number.isNaN(bet) || bet <= 0) {
    messageBox.textContent = "Please enter a valid bet amount.";
    messageBox.className = "message-box loss";
    return;
  }

  if (bet > balance) {
    messageBox.textContent = "Insufficient balance!";
    messageBox.className = "message-box loss";
    return;
  }

  balance -= bet;
  updateBalanceDisplay();
  messageBox.textContent = "Spinning...";
  messageBox.className = "message-box";

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
      balance += winAmount;
      messageBox.textContent = `You won ${formatAmount(winAmount)} KES! (${winningSlice.label})`;
      messageBox.className = "message-box win";
      addHistoryEntry(`<span>Win</span> ${winningSlice.label} · +${formatAmount(winAmount)} KES`);
    } else {
      messageBox.textContent = `No luck! Landed on ${winningSlice.label}.`;
      messageBox.className = "message-box loss";
      addHistoryEntry(`<span>Loss</span> ${winningSlice.label} · -${formatAmount(bet)} KES`);
    }

    updateBalanceDisplay();
    isSpinning = false;
    spinBtn.disabled = false;
  }, 4000);
}

spinBtn.addEventListener("click", spin);
resetBtn.addEventListener("click", resetGame);

updateBalanceDisplay();
drawWheel();
addHistoryEntry("<span>Ready</span> Start spinning to play!");
