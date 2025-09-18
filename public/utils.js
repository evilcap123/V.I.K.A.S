// ===== Rank Points (RP) aur Tier System =====

// Max RP mapping based on difficulty
const difficultyRP = {
  easy: 50,
  medium: 100,
  hard: 200
};

// Calculate Tier from RP
function getTier(rp){
  if(rp >= 2000) return "Diamond";
  if(rp >= 1000) return "Platinum";
  if(rp >= 500) return "Gold";
  return "Silver";
}

// Calculate RP earned for quiz
function calculateRP(score, totalQ, difficulty="medium"){
  let maxRP = difficultyRP[difficulty] || 100;
  return Math.round((score / totalQ) * maxRP);
}

// Update Student Data (after quiz completion)
function updateStudentRP(rpEarned){
  let students = JSON.parse(localStorage.getItem("vikas-students") || "[]");
  let current = JSON.parse(localStorage.getItem("current-student"));

  if(current){
    let found = students.find(s => s.username === current.username);
    if(found){
      found.rp += rpEarned;
      found.quizzes += 1;
      found.tier = getTier(found.rp);
    } else {
      students.push({
        username: current.username,
        class: current.class || 5,
        rp: rpEarned,
        quizzes: 1,
        tier: getTier(rpEarned),
        avatar: current.avatar || "https://static.photos/people/200x200/default"
      });
    }
    localStorage.setItem("vikas-students", JSON.stringify(students));
  }
}

// Save Quiz Attempt
function saveQuizAttempt(quizName, score, totalQ, rpEarned, difficulty="medium"){
  let attempts = JSON.parse(localStorage.getItem("quizAttempts") || "[]");
  attempts.push({
    quiz: quizName,
    score,
    totalQ,
    rp: rpEarned,
    difficulty,
    ts: new Date().toLocaleString()
  });
  localStorage.setItem("quizAttempts", JSON.stringify(attempts));
}
