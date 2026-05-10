let questions = [], userAnswers = [], currentIdx = 0;

function showView(id) {
    document.querySelectorAll('.view').forEach(v => v.classList.add('hidden'));
    document.getElementById(id).classList.remove('hidden');
}

// Dosya Yükleme
document.getElementById('file-input').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
        // Dosya ismini ekranda göster
        document.getElementById('file-name-display').innerText = file.name;
        
        const reader = new FileReader();
        reader.onload = (event) => {
            const xmlDoc = new DOMParser().parseFromString(event.target.result, "text/xml");
            questions = Array.from(xmlDoc.getElementsByTagName("question")).map(node => ({
                q: node.getElementsByTagName("q")[0].textContent,
                a: Array.from(node.getElementsByTagName("a")).map(a => a.textContent),
                c: parseInt(node.getElementsByTagName("c")[0].textContent)
            }));
            localStorage.setItem('last_questions', JSON.stringify(questions));
            // Başarı görseli veya geri bildirimi
            document.getElementById('upload-icon').innerText = "✅";
        };
        reader.readAsText(file);
    }
});


// Quiz Mantığı
function startQuiz() {
    if (!questions.length) return alert("Dosya yükle!");
    userAnswers = []; currentIdx = 0;
    showView('quiz-screen');
    loadQuestion();
}

function loadQuestion() {
    const q = questions[currentIdx];
    document.getElementById("q-progress").innerText = `Soru ${currentIdx + 1} / ${questions.length}`;
    document.getElementById("question").innerText = q.q;
    const optDiv = document.getElementById("options");
    optDiv.innerHTML = "";
    q.a.forEach((opt, i) => {
        const btn = document.createElement("button");
        btn.className = "option";
        btn.innerText = opt;
        btn.onclick = () => {
            userAnswers[currentIdx] = i;
            document.querySelectorAll(".option").forEach(b => b.style.borderColor = "#eee");
            btn.style.borderColor = "var(--primary)";
            document.getElementById("next-btn").classList.remove('hidden');
        };
        optDiv.appendChild(btn);
    });
    document.getElementById("next-btn").classList.add('hidden');
}

function nextQuestion() {
    currentIdx++;
    if (currentIdx < questions.length) loadQuestion();
    else finishQuiz();
}

function finishQuiz() {
    const res = { date: new Date().toLocaleString(), questions, answers: userAnswers };
    let history = JSON.parse(localStorage.getItem('quiz_history') || '[]');
    history.push(res);
    localStorage.setItem('quiz_history', JSON.stringify(history));
    showView('result-screen');
    // Result render işlemleri buraya...
}

// Flashcard
function startFlashcards() {
    currentIdx = 0;
    showView('flashcard-screen');
    loadFlashcard();
}

function loadFlashcard() {
    const q = questions[currentIdx];
    document.querySelector('.flashcard').classList.remove('flipped');
    document.getElementById('f-front').innerText = q.q;
    document.getElementById('f-back').innerText = q.a[q.c];
}

function flipCard() {
    document.querySelector('.flashcard').classList.toggle('flipped');
}

function nextFlashcard() {
    currentIdx = (currentIdx + 1) % questions.length;
    loadFlashcard();
}

window.onload = () => {
    const saved = localStorage.getItem('last_questions');
    if (saved) questions = JSON.parse(saved);
};
