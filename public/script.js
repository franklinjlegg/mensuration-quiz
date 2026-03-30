import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyBsPQ8de0eqVPfcr7r1U5vs0X3N6xV-_YY",
    authDomain: "mensuration-quiz.firebaseapp.com",
    projectId: "mensuration-quiz",
    storageBucket: "mensuration-quiz.firebasestorage.app",
    messagingSenderId: "875143344863",
    appId: "1:875143344863:web:14b002b03c2ed18962af6a",
    measurementId: "G-ZSPPW7WZR4"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

let currentUser = null;
let userStats = JSON.parse(localStorage.getItem('mensurationExamStats_v2')) || {};

// MISSING DOM ELEMENTS RESTORED HERE
const screens = {
    dashboard: document.getElementById('dashboard-screen'),
    quiz: document.getElementById('quiz-screen'),
    results: document.getElementById('results-screen')
};
const ui = {
    levelGrid: document.getElementById('level-grid'),
    levelIndicator: document.getElementById('level-indicator'),
    hardModeIndicator: document.getElementById('hard-mode-indicator'),
    progressIndicator: document.getElementById('progress-indicator'),
    questionText: document.getElementById('question-text'),
    optionsContainer: document.getElementById('options-container'),
    manualContainer: document.getElementById('manual-container'),
    manualAnswer: document.getElementById('manual-answer'),
    submitManualBtn: document.getElementById('submit-manual-btn'),
    feedbackMsg: document.getElementById('feedback-msg'),
    nextBtn: document.getElementById('next-btn'),
    finalScore: document.getElementById('final-score'),
    finalTime: document.getElementById('final-time'),
    streakUpdateMsg: document.getElementById('streak-update-msg')
};

const quizData = [
    {
        title: "Level 1: Linear Standard Units",
        questions: [
            { q: "How many inches are in 1 foot?", options: ["10", "12", "14", "16"], correct: 1, match: ["12", "twelve"] },
            { q: "How many feet are in 1 yard?", options: ["3", "4", "5.5", "12"], correct: 0, match: ["3", "three"] },
            { q: "How many yards are in 1 rod / pole / perch?", options: ["3", "5.5", "16.5", "22"], correct: 1, match: ["5.5", "five and a half"] },
            { q: "How many rods make up 1 chain?", options: ["4", "10", "22", "40"], correct: 0, match: ["4", "four"] },
            { q: "How many yards are in 1 chain?", options: ["5.5", "16.5", "22", "220"], correct: 2, match: ["22", "twenty two", "twenty-two"] },
            { q: "How many chains make up 1 furlong?", options: ["4", "8", "10", "220"], correct: 2, match: ["10", "ten"] },
            { q: "How many furlongs are in 1 mile?", options: ["4", "8", "10", "12"], correct: 1, match: ["8", "eight"] },
            { q: "How many yards are in 1 mile?", options: ["1,000", "1,609", "1,760", "4,840"], correct: 2, match: ["1760", "1,760"] },
            { q: "How many miles are in 1 league (nautical)?", options: ["2", "3", "5", "8"], correct: 1, match: ["3", "three"] },
            { q: "How are Imperial rulers correctly subdivided?", options: ["Thirds", "Fifths", "Twelfths", "Sixteenths"], correct: 3, match: ["16", "sixteenths", "sixteenth"] }
        ]
    },
    {
        title: "Level 2: Anatomical & Nautical Lengths",
        questions: [
            { q: "What is the approximate length of a 'palm' (breadth of four fingers)?", options: ["2 inches", "3 inches", "4 inches", "6 inches"], correct: 1, match: ["3", "three"] },
            { q: "What is the length of a 'hand' (used to measure horse height)?", options: ["3 inches", "4 inches", "5 inches", "9 inches"], correct: 1, match: ["4", "four"] },
            { q: "What is the approximate length of a 'span'?", options: ["6 inches", "9 inches", "12 inches", "18 inches"], correct: 1, match: ["9", "nine"] },
            { q: "What is the approximate length of a 'cubit' (elbow to middle finger)?", options: ["9 inches", "12 inches", "18 inches", "36 inches"], correct: 2, match: ["18", "eighteen"] },
            { q: "How long is an English 'ell' (used for measuring cloth)?", options: ["27 inches", "37 inches", "45 inches", "54 inches"], correct: 2, match: ["45", "forty five"] },
            { q: "How many Roman feet are in 1 Roman pace?", options: ["3", "5", "10", "1000"], correct: 1, match: ["5", "five"] },
            { q: "How many paces make up 1 Roman mile (mille passuum)?", options: ["100", "500", "1,000", "5,280"], correct: 2, match: ["1000", "1,000", "thousand"] },
            { q: "How many Greek feet make up a 'stade' (approx 185m)?", options: ["100", "300", "600", "1000"], correct: 2, match: ["600", "six hundred"] },
            { q: "How many feet are in 1 fathom (nautical depth)?", options: ["3", "6", "9", "12"], correct: 1, match: ["6", "six"] },
            { q: "How many fathoms make up 1 cable?", options: ["10", "50", "100", "1000"], correct: 2, match: ["100", "one hundred"] }
        ]
    },
    {
        title: "Level 3: Area Measurement",
        questions: [
            { q: "How many square inches are in 1 square foot?", options: ["12", "100", "144", "1728"], correct: 2, match: ["144"] },
            { q: "How many square feet are in 1 square yard?", options: ["3", "6", "9", "27"], correct: 2, match: ["9", "nine"] },
            { q: "How many square yards are in 1 square rod / pole / perch?", options: ["9", "27.5", "30.25", "40"], correct: 2, match: ["30.25"] },
            { q: "How many square rods make up 1 rood (a quarter-acre)?", options: ["10", "20", "40", "160"], correct: 2, match: ["40", "forty"] },
            { q: "How many roods make up 1 acre?", options: ["2", "4", "8", "10"], correct: 1, match: ["4", "four"] },
            { q: "How many square yards are in 1 acre?", options: ["1,760", "4,840", "5,280", "10,000"], correct: 1, match: ["4840", "4,840"] },
            { q: "How many acres are in 1 square mile?", options: ["100", "320", "640", "4840"], correct: 2, match: ["640", "six hundred and forty"] },
            { q: "According to the Domesday Book, approximately how many acres are in a 'hide'?", options: ["40", "80", "120", "640"], correct: 2, match: ["120", "one hundred and twenty"] }
        ]
    },
    {
        title: "Level 4: Weight & Volume",
        questions: [
            { q: "How many ounces (oz) are in 1 pound (lb)?", options: ["12", "14", "16", "20"], correct: 2, match: ["16", "sixteen"] },
            { q: "How many pounds are in 1 stone?", options: ["8", "12", "14", "16"], correct: 2, match: ["14", "fourteen"] },
            { q: "How many stone make 1 hundredweight (cwt)?", options: ["8", "10", "14", "20"], correct: 0, match: ["8", "eight"] },
            { q: "How many hundredweight (cwt) make 1 imperial ton?", options: ["10", "14", "20", "2240"], correct: 2, match: ["20", "twenty"] },
            { q: "In Troy weight (precious metals), how many troy ounces are in 1 troy pound?", options: ["10", "12", "14", "16"], correct: 1, match: ["12", "twelve"] },
            { q: "How many grains are in 1 troy pound?", options: ["5,760", "7,000", "7,500", "10,000"], correct: 0, match: ["5760", "5,760"] },
            { q: "How many grains are in 1 standard (avoirdupois) pound?", options: ["5,760", "7,000", "7,500", "10,000"], correct: 1, match: ["7000", "7,000"] },
            { q: "How many fluid ounces are in an imperial pint?", options: ["12", "16", "20", "24"], correct: 2, match: ["20", "twenty"] },
            { q: "How many pints make 1 quart?", options: ["2", "4", "8", "16"], correct: 0, match: ["2", "two"] },
            { q: "How many quarts make 1 gallon?", options: ["2", "4", "8", "16"], correct: 1, match: ["4", "four"] },
            { q: "How many gallons make up 1 firkin?", options: ["4", "8", "9", "36"], correct: 2, match: ["9", "nine"] },
            { q: "How many gallons make up 1 bushel?", options: ["4", "8", "9", "36"], correct: 1, match: ["8", "eight"] },
            { q: "How many bushels make 1 quarter?", options: ["4", "8", "10", "20"], correct: 1, match: ["8", "eight"] },
            { q: "How many gallons are typically in 1 barrel of beer?", options: ["9", "18", "36", "42"], correct: 2, match: ["36", "thirty six"] }
        ]
    },
    {
        title: "Level 5: Currency Standard & Medieval",
        questions: [
            { q: "How many farthings made 1 old penny?", options: ["2", "4", "12", "20"], correct: 1, match: ["4", "four"] },
            { q: "How many pence made 1 shilling?", options: ["4", "10", "12", "20"], correct: 2, match: ["12", "twelve"] },
            { q: "How many shillings made 1 pre-decimal pound (£) sterling?", options: ["10", "12", "20", "240"], correct: 2, match: ["20", "twenty"] },
            { q: "How many old pence in total were in a pre-decimal pound?", options: ["100", "120", "240", "480"], correct: 2, match: ["240", "two hundred and forty"] },
            { q: "What was the value of a 'florin' (introduced 1849)?", options: ["1 shilling", "2 shillings", "2s 6d", "5 shillings"], correct: 1, match: ["2", "two shillings"] },
            { q: "What was the value of a 'half-crown'?", options: ["2 shillings", "2s 6d", "5 shillings", "10 shillings"], correct: 1, match: ["2s 6d", "2 and 6", "2/6", "two shillings and sixpence"] },
            { q: "What was the value of a 'crown'?", options: ["2s 6d", "5 shillings", "10 shillings", "12 shillings"], correct: 1, match: ["5", "five shillings"] },
            { q: "What was the approximate value of a medieval gold 'royal' or 'rial'?", options: ["3s 4d", "6s 8d", "10 shillings", "20 shillings"], correct: 2, match: ["10", "ten shillings"] },
            { q: "What was the value of a 'guinea'?", options: ["15s", "20s", "21s", "25s"], correct: 2, match: ["21", "twenty one"] },
            { q: "What was the value of a medieval 'groat'?", options: ["2 pence", "4 pence", "6 pence", "8 pence"], correct: 1, match: ["4", "four pence"] },
            { q: "What was the value of a medieval gold 'noble'?", options: ["3s 4d", "6s 8d", "10 shillings", "13s 4d"], correct: 1, match: ["6s 8d", "six and eight"] },
            { q: "What was the value of a medieval gold 'angel'?", options: ["6s 8d", "10 shillings", "15 shillings", "20 shillings"], correct: 1, match: ["10", "ten shillings"] }
        ]
    },
    {
        title: "Level 6: Currency Trivia & Chronology",
        questions: [
            { q: "What is the slang term 'Quid' used for?", options: ["1 shilling", "£1 (pound sterling)", "A £5 note", "A 50p coin"], correct: 1, match: ["pound", "£1", "1 pound"] },
            { q: "What is the slang term for a £5 note?", options: ["Bob", "Quid", "Fiver", "Tenner"], correct: 2, match: ["fiver"] },
            { q: "What is the slang term for a £10 note?", options: ["Bob", "Quid", "Fiver", "Tenner"], correct: 3, match: ["tenner"] },
            { q: "Which large German silver coin is the etymological origin of the word 'dollar'?", options: ["Rial", "Thaler", "Ducat", "Florin"], correct: 1, match: ["thaler"] },
            { q: "Which internationally used Spanish coin is famously associated with pirates?", options: ["Doubloons", "Pieces of eight", "Gold royals", "Silver pesos"], correct: 1, match: ["pieces of eight", "eight"] },
            { q: "What is the slang term for 1 shilling?", options: ["Bob", "Quid", "Tanner", "Farthing"], correct: 0, match: ["bob"] },
            { q: "Why did we inherit a 60-minute hour and 60-second minute?", options: ["Roman military divisions", "Greek philosophy", "Babylonian/Sumerian base-60 system", "Egyptian solar cycles"], correct: 2, match: ["babylon", "sumerian", "base 60", "base-60"] },
            { q: "Prior to 1752, on what date did the New Year begin in England?", options: ["1 January", "25 March", "1 September", "25 December"], correct: 1, match: ["25 march", "march 25"] },
            { q: "The months September–December come from Latin numbers. What number does 'November' represent?", options: ["7", "8", "9", "11"], correct: 2, match: ["9", "nine"] },
            { q: "How did Eratosthenes accurately measure the Earth's circumference around 240 BCE?", options: ["Using a compass", "Sailing the Mediterranean", "Measuring a 7.2° shadow difference at the summer solstice", "Counting paces across Egypt"], correct: 2, match: ["shadow", "summer solstice", "7.2"] },
            { q: "What exact date did Archbishop Ussher set for the Creation of the world using Biblical genealogies?", options: ["1 January 1 CE", "Sunday 23 October 4004 BCE", "25 March 3000 BCE", "1 September 10000 BCE"], correct: 1, match: ["4004 bce", "23 october", "4004"] }
        ]
    }
];

let currentLevelIdx = 0;
let currentQuestionIdx = 0;
let currentQuestions = [];
let score = 0;
let startTime = 0;
let isHardModeActive = false;

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

ui.manualAnswer.addEventListener("keypress", function (event) {
    if (event.key === "Enter" && !ui.manualAnswer.disabled) {
        event.preventDefault();
        checkManualAnswer();
    }
});

function initDashboard() {
    ui.levelGrid.innerHTML = '';

    quizData.forEach((level, index) => {
        if (!userStats[index]) userStats[index] = { score: 0, time: 0, streak: 0 };
        const stats = userStats[index];
        const isCompleted = stats.score > 0;
        const isMastered = stats.streak >= 3;

        const card = document.createElement('div');
        card.className = `level-card ${isMastered ? 'mastered' : (isCompleted ? 'completed' : '')}`;

        let statusHTML = '';
        if (isCompleted) {
            statusHTML = `
                        <div class="score-badge">Best Score: ${stats.score}/${level.questions.length}</div>
                        <span class="time-badge">Fastest: ${stats.time}s</span>
                        <span class="streak-badge">${isMastered ? '🔥 HARD MODE UNLOCKED' : `Perfect Streak: ${stats.streak}/3`}</span>
                    `;
        } else {
            statusHTML = `<div class="score-badge" style="background: #f1f5f9;">Not Attempted</div>`;
        }

        card.innerHTML = `<div class="level-title">${level.title}</div>${statusHTML}`;
        card.onclick = () => startLevel(index);
        ui.levelGrid.appendChild(card);
    });

    showScreen('dashboard');
}

function startLevel(index) {
    currentLevelIdx = index;
    currentQuestionIdx = 0;
    score = 0;
    startTime = Date.now();
    isHardModeActive = userStats[index].streak >= 3;

    currentQuestions = [...quizData[index].questions];
    shuffleArray(currentQuestions);

    ui.levelIndicator.innerHTML = `Module ${index + 1} <span id="hard-mode-indicator" class="${isHardModeActive ? '' : 'hidden'}">(HARD MODE)</span>`;
    loadQuestion();
    showScreen('quiz');
}

function loadQuestion() {
    const qData = currentQuestions[currentQuestionIdx];

    ui.progressIndicator.textContent = `Q: ${currentQuestionIdx + 1}/${currentQuestions.length}`;
    ui.questionText.textContent = qData.q;
    ui.nextBtn.classList.add('hidden');

    if (isHardModeActive) {
        ui.optionsContainer.classList.add('hidden');
        ui.manualContainer.classList.remove('hidden');
        ui.manualAnswer.value = '';
        ui.manualAnswer.disabled = false;
        ui.manualAnswer.className = '';
        ui.feedbackMsg.innerHTML = '';
        ui.submitManualBtn.classList.remove('hidden');
        ui.manualAnswer.focus();
    } else {
        ui.manualContainer.classList.add('hidden');
        ui.optionsContainer.classList.remove('hidden');
        ui.optionsContainer.innerHTML = '';
        qData.options.forEach((optText, optIdx) => {
            const btn = document.createElement('button');
            btn.className = 'option-btn';
            btn.textContent = optText;
            btn.onclick = () => handleMCQAnswer(btn, optIdx, qData.correct);
            ui.optionsContainer.appendChild(btn);
        });
    }
}

function handleMCQAnswer(clickedBtn, selectedIdx, correctIdx) {
    const allBtns = ui.optionsContainer.querySelectorAll('.option-btn');
    allBtns.forEach(btn => btn.disabled = true);

    if (selectedIdx === correctIdx) {
        clickedBtn.classList.add('correct');
        score++;
    } else {
        clickedBtn.classList.add('incorrect');
        allBtns[correctIdx].classList.add('correct');
    }
    ui.nextBtn.classList.remove('hidden');
}

function checkManualAnswer() {
    const qData = currentQuestions[currentQuestionIdx];
    const userInput = ui.manualAnswer.value.trim().toLowerCase();

    if (userInput === '') return;

    ui.manualAnswer.disabled = true;
    ui.submitManualBtn.classList.add('hidden');

    let isCorrect = false;

    if (userInput === qData.options[qData.correct].toLowerCase()) {
        isCorrect = true;
    } else if (qData.match) {
        isCorrect = qData.match.some(matchStr => userInput.includes(matchStr.toLowerCase()));
    }

    if (isCorrect) {
        ui.manualAnswer.classList.add('correct-input');
        ui.feedbackMsg.innerHTML = `<span style="color: #059669;">Correct!</span>`;
        score++;
    } else {
        ui.manualAnswer.classList.add('incorrect-input');
        ui.feedbackMsg.innerHTML = `<span style="color: #dc2626;">Incorrect.</span> The answer was: <b>${qData.options[qData.correct]}</b>`;
    }

    ui.nextBtn.classList.remove('hidden');
}

function nextQuestion() {
    currentQuestionIdx++;
    if (currentQuestionIdx < currentQuestions.length) {
        loadQuestion();
    } else {
        endLevel();
    }
}

async function endLevel() {
    const totalQs = currentQuestions.length;
    const timeTaken = ((Date.now() - startTime) / 1000).toFixed(1);
    const prevStats = userStats[currentLevelIdx] || { score: 0, time: 0, streak: 0 };
    const isPerfect = (score === totalQs);

    let newStreak = prevStats.streak;
    if (isPerfect) {
        newStreak += 1;
        ui.streakUpdateMsg.textContent = newStreak >= 3 ? "🔥 Hard Mode Activated/Maintained!" : "Perfect Score! Streak increased.";
        ui.streakUpdateMsg.style.color = "var(--hard-mode)";
    } else {
        newStreak = 0;
        ui.streakUpdateMsg.textContent = isHardModeActive ? "Streak broken! Returning to Multiple Choice mode." : "Keep practicing for a perfect score!";
        ui.streakUpdateMsg.style.color = "#dc2626";
    }

    if (score > prevStats.score || (score === prevStats.score && parseFloat(timeTaken) < parseFloat(prevStats.time)) || prevStats.score === 0) {
        userStats[currentLevelIdx] = { score: score, time: timeTaken, streak: newStreak };
    } else {
        userStats[currentLevelIdx].streak = newStreak;
    }

    localStorage.setItem('mensurationExamStats_v2', JSON.stringify(userStats));

    if (currentUser) {
        await saveStatsToCloud();
    }

    ui.finalScore.textContent = `${score} / ${totalQs}`;
    ui.finalTime.textContent = timeTaken;
    showScreen('results');
}

function showScreen(screenName) {
    screens.dashboard.classList.add('hidden');
    screens.quiz.classList.add('hidden');
    screens.results.classList.add('hidden');
    screens[screenName].classList.remove('hidden');
}

function returnToDashboard() {
    initDashboard();
}

// EXPOSE FUNCTIONS TO WINDOW FOR HTML ONCLICK COMPATIBILITY
window.startLevel = startLevel;
window.checkManualAnswer = checkManualAnswer;
window.nextQuestion = nextQuestion;
window.returnToDashboard = returnToDashboard;

// AUTHENTICATION AND CLOUD SYNC
document.getElementById('login-btn').addEventListener('click', () => {
    signInWithPopup(auth, provider).catch(error => console.error("Login failed:", error));
});

document.getElementById('logout-btn').addEventListener('click', () => {
    signOut(auth).then(() => {
        userStats = {};
        localStorage.removeItem('mensurationExamStats_v2');
        initDashboard();
    });
});

onAuthStateChanged(auth, async (user) => {
    const loggedInUI = document.getElementById('logged-in-ui');
    const loggedOutUI = document.getElementById('logged-out-ui');

    if (user) {
        currentUser = user;
        document.getElementById('user-display-name').textContent = `Welcome, ${user.displayName}`;
        loggedInUI.classList.remove('hidden');
        loggedOutUI.classList.add('hidden');
        await loadStatsFromCloud();
    } else {
        currentUser = null;
        loggedInUI.classList.add('hidden');
        loggedOutUI.classList.remove('hidden');
        userStats = JSON.parse(localStorage.getItem('mensurationExamStats_v2')) || {};
    }
    initDashboard();
});

async function loadStatsFromCloud() {
    if (!currentUser) return;
    try {
        const docRef = doc(db, "users", currentUser.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists() && docSnap.data().stats) {
            userStats = docSnap.data().stats;
            localStorage.setItem('mensurationExamStats_v2', JSON.stringify(userStats));
        }
    } catch (error) {
        console.error("Error loading stats:", error);
    }
}

async function saveStatsToCloud() {
    if (!currentUser) return;
    try {
        const docRef = doc(db, "users", currentUser.uid);
        await setDoc(docRef, { stats: userStats }, { merge: true });
    } catch (error) {
        console.error("Error saving stats:", error);
    }
}