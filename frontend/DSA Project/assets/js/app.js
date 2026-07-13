const API_URL = "https://hostel-roommate-matcher.onrender.com";
const students = new Map();
let latestRecommendations = [];
let recentActivity = [];
let pendingConfirm = null;
let charts = {};

const $ = (id) => document.getElementById(id);

const dom = {
  form: $("studentForm"),
  formTitle: $("formTitle"),
  submitBtn: $("submitBtn"),
  resetFormBtn: $("resetFormBtn"),
  loadDemoBtn: $("loadDemoBtn"),
  studentList: $("studentList"),
  visibleStudentCount: $("visibleStudentCount"),
  searchInput: $("searchInput"),
  genderFilter: $("genderFilter"),
  yearFilter: $("yearFilter"),
  statusFilter: $("statusFilter"),
  sortStudents: $("sortStudents"),
  recommendStudent: $("recommendStudent"),
  topK: $("topK"),
  sortMatches: $("sortMatches"),
  recommendBtn: $("recommendBtn"),
  recommendations: $("recommendations"),
  assignBtn: $("assignBtn"),
  assignments: $("assignments"),
  totalStudents: $("totalStudents"),
  totalMatches: $("totalMatches"),
  highestCompatibility: $("highestCompatibility"),
  averageCompatibility: $("averageCompatibility"),
  heroScore: $("heroScore"),
  activityList: $("activityList"),
  quickStats: $("quickStats"),
  heatmap: $("heatmap"),
  themeToggle: $("themeToggle"),
  exportPdfBtn: $("exportPdfBtn"),
  exportExcelBtn: $("exportExcelBtn"),
  printBtn: $("printBtn"),
  playStepsBtn: $("playStepsBtn"),
  algorithmSteps: $("algorithmSteps"),
  toastStack: $("toastStack"),
  fabBtn: $("fabBtn"),
  scrollTopBtn: $("scrollTopBtn"),
  confirmDialog: $("confirmDialog"),
  dialogMessage: $("dialogMessage"),
  dialogCancel: $("dialogCancel"),
  dialogConfirm: $("dialogConfirm"),
  appLoader: $("appLoader")
};

const fields = {
  id: $("studentId"),
  name: $("name"),
  gender: $("gender"),
  branch: $("branch"),
  year: $("year"),
  sleepTime: $("sleepTime"),
  cleanliness: $("cleanliness"),
  foodHabit: $("foodHabit"),
  studyPreference: $("studyPreference"),
  roomType: $("roomType"),
  hobbies: $("hobbies")
};

const avatarGradients = [
  "linear-gradient(135deg, #2563eb, #14b8a6)",
  "linear-gradient(135deg, #7c3aed, #ec4899)",
  "linear-gradient(135deg, #f97316, #eab308)",
  "linear-gradient(135deg, #059669, #22c55e)",
  "linear-gradient(135deg, #dc2626, #fb7185)"
];

function normalize(value) {
  return String(value || "").trim().toLowerCase();
}

function initials(name) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("") || "ST";
}

function parseHobbies(value) {
  return value.split(",").map(normalize).filter(Boolean);
}

function scoreColor(score) {
  if (score >= 80) return "#16a34a";
  if (score >= 60) return "#eab308";
  if (score >= 40) return "#f97316";
  return "#dc2626";
}

function scoreLevel(score) {
  if (score >= 80) return "Excellent";
  if (score >= 60) return "Good";
  if (score >= 40) return "Average";
  return "Poor";
}

function getStudentFromForm() {
  const now = new Date().toISOString();
  const id = Number(fields.id.value);
  const existing = students.get(id);

  return {
    id,
    name: fields.name.value.trim(),
    gender: fields.gender.value,
    branch: fields.branch.value.trim(),
    year: Number(fields.year.value),
    sleepTime: fields.sleepTime.value,
    cleanliness: fields.cleanliness.value,
    foodHabit: fields.foodHabit.value,
    studyPreference: fields.studyPreference.value,
    roomType: fields.roomType.value,
    hobbies: parseHobbies(fields.hobbies.value),
    assigned: existing ? existing.assigned : false,
    roommateId: existing ? existing.roommateId : null,
    avatarColor: existing ? existing.avatarColor : avatarGradients[id % avatarGradients.length],
    createdAt: existing ? existing.createdAt : now,
    updatedAt: now
  };
}

function calculateScore(first, second) {
  let score = 0;
  if (first.roomType === second.roomType) score += 20;
  if (first.sleepTime === second.sleepTime) score += 20;
  if (first.cleanliness === second.cleanliness) score += 15;
  if (first.foodHabit === second.foodHabit) score += 15;
  if (first.studyPreference === second.studyPreference) score += 15;
  if (first.branch.toLowerCase() === second.branch.toLowerCase() || first.year === second.year) score += 5;

  const hobbySet = new Set(first.hobbies);
  const commonHobbies = second.hobbies.filter((hobby) => hobbySet.has(hobby)).length;
  score += Math.min(10, commonHobbies * 5);
  return score;
}

function compareStudents(first, second) {
  const hobbySet = new Set(first.hobbies);
  const commonHobbies = second.hobbies.filter((hobby) => hobbySet.has(hobby));
  const criteria = [
    { label: "Room Type", a: first.roomType, b: second.roomType, points: 20, matched: first.roomType === second.roomType },
    { label: "Sleep", a: first.sleepTime, b: second.sleepTime, points: 20, matched: first.sleepTime === second.sleepTime },
    { label: "Cleanliness", a: first.cleanliness, b: second.cleanliness, points: 15, matched: first.cleanliness === second.cleanliness },
    { label: "Food", a: first.foodHabit, b: second.foodHabit, points: 15, matched: first.foodHabit === second.foodHabit },
    { label: "Study", a: first.studyPreference, b: second.studyPreference, points: 15, matched: first.studyPreference === second.studyPreference },
    { label: "Branch/Year", a: `${first.branch}, Y${first.year}`, b: `${second.branch}, Y${second.year}`, points: 5, matched: first.branch.toLowerCase() === second.branch.toLowerCase() || first.year === second.year },
    { label: "Hobbies", a: first.hobbies.join(", ") || "None", b: second.hobbies.join(", ") || "None", points: Math.min(10, commonHobbies.length * 5), matched: commonHobbies.length > 0 }
  ];
  return criteria;
}

function getRecommendations(studentId) {
  const selected = students.get(studentId);
  if (!selected || selected.assigned) return [];

  return [...students.values()]
    .filter((candidate) => candidate.id !== studentId && !candidate.assigned)
    .map((candidate) => ({
      id: candidate.id,
      name: candidate.name,
      score: calculateScore(selected, candidate),
      student: candidate,
      criteria: compareStudents(selected, candidate)
    }))
    .sort((a, b) => b.score - a.score || a.id - b.id);
}

function allPairScores() {
  const list = [...students.values()];
  const pairs = [];
  for (let i = 0; i < list.length; i += 1) {
    for (let j = i + 1; j < list.length; j += 1) {
      pairs.push({
        first: list[i],
        second: list[j],
        score: calculateScore(list[i], list[j])
      });
    }
  }
  return pairs;
}

function filteredStudents() {
  const query = normalize(dom.searchInput.value);
  const gender = dom.genderFilter.value;
  const year = dom.yearFilter.value;
  const status = dom.statusFilter.value;

  let list = [...students.values()].filter((student) => {
    const searchable = normalize(`${student.id} ${student.name} ${student.branch} ${student.hobbies.join(" ")}`);
    const queryOk = !query || searchable.includes(query);
    const genderOk = !gender || student.gender === gender;
    const yearOk = !year || String(student.year) === year;
    const statusOk = !status || (status === "assigned" ? student.assigned : !student.assigned);
    return queryOk && genderOk && yearOk && statusOk;
  });

  const sortBy = dom.sortStudents.value;
  list.sort((a, b) => {
    if (sortBy === "name") return a.name.localeCompare(b.name);
    if (sortBy === "year") return a.year - b.year || a.id - b.id;
    if (sortBy === "status") return Number(a.assigned) - Number(b.assigned) || a.id - b.id;
    return a.id - b.id;
  });

  return list;
}

function resetForm() {
  dom.form.reset();
  fields.id.disabled = false;
  dom.submitBtn.textContent = "Add Student";
  dom.formTitle.textContent = "Add Student";
}

function showToast(message, type = "info") {
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.textContent = message;
  dom.toastStack.appendChild(toast);
  setTimeout(() => toast.remove(), 3300);
}

function confirmAction(message, onConfirm) {
  dom.dialogMessage.textContent = message;
  pendingConfirm = onConfirm;
  dom.confirmDialog.classList.add("open");
}

function closeDialog() {
  pendingConfirm = null;
  dom.confirmDialog.classList.remove("open");
}

function renderStudents() {
  const list = filteredStudents();
  dom.visibleStudentCount.textContent = `${list.length} shown`;

  if (list.length === 0) {
    dom.studentList.innerHTML = `<div class="empty-state">No students match your filters.<br>Add demo data or create a new profile.</div>`;
    return;
  }

  dom.studentList.innerHTML = list.map((student) => {
    const bestScore = allPairScores()
      .filter((pair) => pair.first.id === student.id || pair.second.id === student.id)
      .reduce((best, pair) => Math.max(best, pair.score), 0);
    return `
    <article class="student-card">
      <div class="student-main">
        <div class="avatar" style="--avatar:${student.avatarColor}">${initials(student.name)}</div>
        <div>
          <div class="card-top">
            <div>
              <div class="card-title">${student.name} <span class="meta">#${student.id}</span></div>
              <div class="meta">${student.branch} | Year ${student.year} | ${student.gender}</div>
            </div>
            <span class="badge ${student.assigned ? "success" : ""}">${student.assigned ? `Matched #${student.roommateId}` : "Available"}</span>
          </div>
          <div class="chip-row">
            <span class="chip">Best: ${bestScore}%</span>
            <span class="chip">Food: ${student.foodHabit}</span>
            <span class="chip">Sleep: ${student.sleepTime}</span>
            <span class="chip">Study: ${student.studyPreference}</span>
            <span class="chip">Clean: ${student.cleanliness}</span>
          </div>
          <div class="meta">Hobbies: ${student.hobbies.length ? student.hobbies.join(", ") : "None"}</div>
        </div>
      </div>
      <div class="actions">
        <button type="button" onclick="editStudent(${student.id})">Edit</button>
        <button type="button" class="danger-text" onclick="deleteStudent(${student.id})">Delete</button>
      </div>
    </article>
  `;
  }).join("");
}

function renderSelect() {
  const options = [...students.values()]
    .sort((a, b) => a.id - b.id)
    .map((student) => `<option value="${student.id}">${student.id} - ${student.name}${student.assigned ? " (assigned)" : ""}</option>`)
    .join("");
  dom.recommendStudent.innerHTML = `<option value="">Select student</option>${options}`;
}

function renderActivities() {
  const activity = recentActivity.slice(0, 5);
  if (activity.length === 0) {
    dom.activityList.innerHTML = `<div class="empty-state">No match activity yet.<br>Run recommendations or auto assignment.</div>`;
    return;
  }
  dom.activityList.innerHTML = activity.map((item) => `
    <div class="activity-item">
      <strong>${item.title}</strong>
      <div class="meta">${item.detail}</div>
    </div>
  `).join("");
}

function renderQuickStats(pairScores) {
  const available = [...students.values()].filter((student) => !student.assigned).length;
  const departments = new Set([...students.values()].map((student) => normalize(student.branch))).size;
  const excellent = pairScores.filter((pair) => pair.score >= 80).length;
  dom.quickStats.innerHTML = `
    <div class="quick-stat"><strong>${available}</strong><span class="meta">Available students</span></div>
    <div class="quick-stat"><strong>${departments}</strong><span class="meta">Departments</span></div>
    <div class="quick-stat"><strong>${excellent}</strong><span class="meta">Excellent pairs</span></div>
  `;
}

function animateValue(element, value, suffix = "") {
  const target = Number(value) || 0;
  const start = Number(element.dataset.value || 0);
  const duration = 520;
  const started = performance.now();

  function tick(now) {
    const progress = Math.min(1, (now - started) / duration);
    const current = Math.round(start + (target - start) * progress);
    element.textContent = `${current}${suffix}`;
    if (progress < 1) requestAnimationFrame(tick);
  }

  element.dataset.value = String(target);
  requestAnimationFrame(tick);
}

function renderDashboard() {
  const pairScores = allPairScores();
  const highest = pairScores.length ? Math.max(...pairScores.map((pair) => pair.score)) : 0;
  const average = pairScores.length ? Math.round(pairScores.reduce((sum, pair) => sum + pair.score, 0) / pairScores.length) : 0;
  const matchedPairs = [...students.values()].filter((student) => student.assigned).length / 2;

  animateValue(dom.totalStudents, students.size);
  animateValue(dom.totalMatches, matchedPairs);
  animateValue(dom.highestCompatibility, highest, "%");
  animateValue(dom.averageCompatibility, average, "%");
  animateValue(dom.heroScore, highest, "%");
  renderActivities();
  renderQuickStats(pairScores);
  renderHeatmap(pairScores);
}

function renderRecommendations(results = latestRecommendations) {
  if (results.length === 0) {
    dom.recommendations.innerHTML = `<div class="empty-state">No recommendations yet.<br>Select a student and click Recommend.</div>`;
    return;
  }

  dom.recommendations.innerHTML = results.map((result) => {
    const color = scoreColor(result.score);
    const rows = result.criteria.map((item) => `
      <tr>
        <td>${item.label}</td>
        <td>${item.a}</td>
        <td>${item.b}</td>
        <td>${item.matched ? "Matched" : "Different"} (${item.points})</td>
      </tr>
    `).join("");

    return `
      <article class="result-card" style="--score-color:${color}; --score:${result.score}; --score-width:${result.score}%">
        <div class="card-top">
          <div>
            <div class="card-title">${result.name} <span class="meta">#${result.id}</span></div>
            <span class="badge">${scoreLevel(result.score)}</span>
          </div>
          <div class="score-circle">${result.score}%</div>
        </div>
        <div class="score-line" aria-hidden="true"><span></span></div>
        <p class="meta">Score is calculated from room type, sleep schedule, cleanliness, food, study habit, branch/year, and hobbies.</p>
        <table class="comparison">
          <thead><tr><th>Criteria</th><th>Selected</th><th>Candidate</th><th>Result</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </article>
    `;
  }).join("");
}

function renderAssignments() {
  const assigned = [...students.values()]
    .filter((student) => student.assigned && student.id < student.roommateId)
    .sort((a, b) => a.id - b.id);

  if (assigned.length === 0) {
    dom.assignments.innerHTML = `<div class="empty-state">No room pairs assigned yet.</div>`;
    return;
  }

  dom.assignments.innerHTML = assigned.map((student) => {
    const roommate = students.get(student.roommateId);
    const score = roommate ? calculateScore(student, roommate) : 0;
    return `
      <div class="activity-item">
        <strong>${student.name} + ${roommate ? roommate.name : "Unknown"}</strong>
        <div class="meta">Compatibility: ${score}% | Roommate IDs: ${student.id}, ${student.roommateId}</div>
      </div>
    `;
  }).join("");
}

function renderHeatmap(pairScores) {
  if (pairScores.length === 0) {
    dom.heatmap.innerHTML = `<div class="empty-state">Add at least two students to generate a heatmap.</div>`;
    return;
  }

  dom.heatmap.innerHTML = pairScores
    .sort((a, b) => b.score - a.score)
    .slice(0, 16)
    .map((pair) => `
      <div class="heat-cell" style="background:${scoreColor(pair.score)}">
        ${pair.score}%
        <small>${pair.first.name} + ${pair.second.name}</small>
      </div>
    `).join("");
}

function groupedCount(values) {
  return values.reduce((acc, value) => {
    const key = value || "Unknown";
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
}

function makeChart(id, type, data, options = {}) {
  if (!window.Chart) return;
  const context = $(id);
  if (!context) return;
  if (charts[id]) charts[id].destroy();
  charts[id] = new Chart(context, {
    type,
    data,
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { position: "bottom" } },
      ...options
    }
  });
}

function renderCharts() {
  const list = [...students.values()];
  const pairs = allPairScores();
  const gender = groupedCount(list.map((student) => student.gender));
  const departments = groupedCount(list.map((student) => student.branch.toUpperCase()));
  const distribution = {
    Excellent: pairs.filter((pair) => pair.score >= 80).length,
    Good: pairs.filter((pair) => pair.score >= 60 && pair.score < 80).length,
    Average: pairs.filter((pair) => pair.score >= 40 && pair.score < 60).length,
    Poor: pairs.filter((pair) => pair.score < 40).length
  };

  makeChart("genderChart", "doughnut", {
    labels: Object.keys(gender),
    datasets: [{ data: Object.values(gender), backgroundColor: ["#2563eb", "#14b8a6", "#f97316", "#7c3aed"] }]
  });

  makeChart("departmentChart", "bar", {
    labels: Object.keys(departments),
    datasets: [{ label: "Students", data: Object.values(departments), backgroundColor: "#2563eb", borderRadius: 10 }]
  }, { scales: { y: { beginAtZero: true, ticks: { precision: 0 } } } });

  makeChart("compatibilityChart", "pie", {
    labels: Object.keys(distribution),
    datasets: [{ data: Object.values(distribution), backgroundColor: ["#16a34a", "#eab308", "#f97316", "#dc2626"] }]
  });

  makeChart("activityChart", "line", {
    labels: recentActivity.slice(0, 6).reverse().map((_, index) => `A${index + 1}`),
    datasets: [{
      label: "Activity Score",
      data: recentActivity.slice(0, 6).reverse().map((item) => item.score || 0),
      borderColor: "#14b8a6",
      backgroundColor: "rgba(20, 184, 166, 0.16)",
      fill: true,
      tension: 0.4
    }]
  }, { scales: { y: { beginAtZero: true, max: 100 } } });
}

function renderAll() {
  renderStudents();
  renderSelect();
  renderAssignments();
  renderDashboard();
  renderCharts();
}

function addActivity(title, detail, score = 0) {
  recentActivity.unshift({ title, detail, score, at: new Date().toISOString() });
  recentActivity = recentActivity.slice(0, 12);
}

function editStudent(id) {
  const student = students.get(id);
  if (!student) return;
  fields.id.value = student.id;
  fields.id.disabled = true;
  fields.name.value = student.name;
  fields.gender.value = student.gender;
  fields.branch.value = student.branch;
  fields.year.value = student.year;
  fields.sleepTime.value = student.sleepTime;
  fields.cleanliness.value = student.cleanliness;
  fields.foodHabit.value = student.foodHabit;
  fields.studyPreference.value = student.studyPreference;
  fields.roomType.value = student.roomType;
  fields.hobbies.value = student.hobbies.join(", ");
  dom.submitBtn.textContent = "Update Student";
  dom.formTitle.textContent = "Update Student";
  document.querySelector("#students").scrollIntoView({ behavior: "smooth" });
}
async function deleteStudent(id) {

  const student = students.get(id);
  if (!student) return;

  confirmAction(`Delete ${student.name}'s profile?`, async () => {

    try {

      const response = await fetch(
        `${API_URL}/students/${id}`,
        {
          method: "DELETE"
        }
      );

      const data = await response.json();

      if (!response.ok) {
        showToast("Delete Failed", "error");
        return;
      }

      showToast("Student Deleted", "success");

      fetchStudents();

    } catch (error) {
      console.error(error);
      showToast("Backend Connection Error", "error");
    }

  });

}

function launchConfetti() {
  const colors = ["#2563eb", "#14b8a6", "#f97316", "#eab308", "#ec4899"];
  for (let i = 0; i < 70; i += 1) {
    const piece = document.createElement("span");
    piece.className = "confetti";
    piece.style.left = `${Math.random() * 100}vw`;
    piece.style.background = colors[i % colors.length];
    piece.style.animationDelay = `${Math.random() * 0.6}s`;
    document.body.appendChild(piece);
    setTimeout(() => piece.remove(), 3100);
  }
}

function sortRecommendationList(results) {
  const sortBy = dom.sortMatches.value;
  return [...results].sort((a, b) => {
    if (sortBy === "name") return a.name.localeCompare(b.name);
    if (sortBy === "id") return a.id - b.id;
    return b.score - a.score || a.id - b.id;
  });
}

function exportPdf() {
  if (latestRecommendations.length === 0) {
    showToast("Generate recommendations before exporting PDF.", "error");
    return;
  }
  if (!window.jspdf) {
    showToast("PDF library is unavailable. Check internet connection.", "error");
    return;
  }
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  doc.setFontSize(16);
  doc.text("HostelMatch Pro - Match Report", 14, 18);
  doc.setFontSize(10);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 26);
  latestRecommendations.forEach((item, index) => {
    const y = 40 + index * 22;
    doc.text(`${index + 1}. ${item.name} (#${item.id}) - ${item.score}% ${scoreLevel(item.score)}`, 14, y);
    doc.text(`Matched: ${item.criteria.filter((c) => c.matched).map((c) => c.label).join(", ") || "None"}`, 18, y + 7);
  });
  doc.save("hostel-match-report.pdf");
  showToast("PDF report exported.", "success");
}

function exportExcel() {
  if (latestRecommendations.length === 0) {
    showToast("Generate recommendations before exporting Excel.", "error");
    return;
  }
  if (!window.XLSX) {
    showToast("Excel library is unavailable. Check internet connection.", "error");
    return;
  }
  const rows = latestRecommendations.map((item) => ({
    "Student ID": item.id,
    Name: item.name,
    Score: item.score,
    Level: scoreLevel(item.score),
    "Matched Preferences": item.criteria.filter((c) => c.matched).map((c) => c.label).join(", "),
    "Different Preferences": item.criteria.filter((c) => !c.matched).map((c) => c.label).join(", "),
    Generated: new Date().toLocaleString()
  }));
  const sheet = XLSX.utils.json_to_sheet(rows);
  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(book, sheet, "Matches");
  XLSX.writeFile(book, "hostel-match-report.xlsx");
  showToast("Excel report exported.", "success");
}

function loadDemoData() {
  const demoStudents = window.HOSTEL_MATCH_DEMO_STUDENTS || [];
  if (demoStudents.length === 0) {
    showToast("Demo data file is missing or empty.", "error");
    return;
  }

  students.clear();
  latestRecommendations = [];
  recentActivity = [];
  demoStudents.forEach((student) => {
    const now = new Date().toISOString();
    students.set(student.id, {
      ...student,
      assigned: false,
      roommateId: null,
      avatarColor: avatarGradients[student.id % avatarGradients.length],
      createdAt: now,
      updatedAt: now
    });
  });
  addActivity("Demo data loaded", `${demoStudents.length} student profiles are ready for evaluation.`);
}
  renderRecommendations();
  renderAll();
  async function fetchStudents() {
    try {
      const response = await fetch(`${API_URL}/students`);
      const data = await response.json();
  
      students.clear();
  
      data.forEach(student => {
  
        students.set(student.id, {
          ...student,
          hobbies: student.hobbies
            ? student.hobbies.split(",")
            : [],
          assigned: false,
          roommateId: null,
          avatarColor:
            avatarGradients[
              student.id % avatarGradients.length
            ]
        });
  
      });
  
      renderAll();
  
    } catch (error) {
      console.error(error);
    }
  }

function bindEvents() {
  dom.form.addEventListener("submit", async (event) => {
    event.preventDefault();
  
    const student = getStudentFromForm();
    const isEdit = fields.id.disabled;
  
    try {
      const isEdit = fields.id.disabled;

      const url = isEdit
        ? `${API_URL}/students/${student.id}`
        : `${API_URL}/students`;
      
      const method = isEdit ? "PUT" : "POST";
      
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(student)
      });
  
      const data = await response.json();
  
      if (!response.ok) {
        showToast("Failed to add student", "error");
        return;
      }
  
      showToast(
        isEdit
          ? "Student Updated Successfully"
          : "Student Added Successfully",
        "success"
      );
  
      resetForm();
      fetchStudents();
  
    } catch (error) {
      console.error(error);
      showToast("Backend Connection Error", "error");
    }
  });

  dom.resetFormBtn.addEventListener("click", resetForm);
  dom.loadDemoBtn.addEventListener("click", loadDemoData);
  [dom.searchInput, dom.genderFilter, dom.yearFilter, dom.statusFilter, dom.sortStudents].forEach((control) => {
    control.addEventListener("input", renderStudents);
    control.addEventListener("change", renderStudents);
  });

  dom.recommendBtn.addEventListener("click", async () => {

    const id = dom.recommendStudent.value;
  
    if (!id) {
      showToast("Select Student First", "error");
      return;
    }
  
    try {
  
      const response = await fetch(
        `${API_URL}/match/${id}`
      );
  
      const data = await response.json();
  
      dom.recommendations.innerHTML = `
        <article class="result-card">
          <h3>${data.best_match}</h3>
          <p>ID: ${data.best_match_id}</p>
          <p>Compatibility Score:
          ${data.compatibility_percentage}%</p>
        </article>
      `;
  
    } catch (error) {
      console.error(error);
      showToast("Recommendation Failed", "error");
    }
  
  });

  dom.sortMatches.addEventListener("change", () => {
    latestRecommendations = sortRecommendationList(latestRecommendations);
    renderRecommendations();
  });

  dom.assignBtn.addEventListener("click", () => {
    const ids = [...students.keys()].sort((a, b) => a - b);
    const pairs = [];
    ids.forEach((id) => {
      const student = students.get(id);
      if (!student || student.assigned) return;
      const best = getRecommendations(id)[0];
      if (!best) return;
      const roommate = students.get(best.id);
      student.assigned = true;
      student.roommateId = roommate.id;
      roommate.assigned = true;
      roommate.roommateId = student.id;
      pairs.push({ first: student, second: roommate, score: best.score });
    });
    if (pairs.length === 0) {
      showToast("No unassigned students available.", "error");
      return;
    }
    pairs.forEach((pair) => addActivity("Room assigned", `${pair.first.name} matched with ${pair.second.name} at ${pair.score}%.`, pair.score));
    latestRecommendations = [];
    renderRecommendations();
    renderAll();
    if (pairs.some((pair) => pair.score >= 90)) launchConfetti();
    showToast(`${pairs.length} room pair(s) assigned.`, "success");
  });

  dom.exportPdfBtn.addEventListener("click", exportPdf);
  dom.exportExcelBtn.addEventListener("click", exportExcel);
  dom.printBtn.addEventListener("click", () => window.print());

  dom.themeToggle.addEventListener("click", () => {
    document.body.classList.toggle("dark");
    dom.themeToggle.textContent = document.body.classList.contains("dark") ? "Light" : "Dark";
  });

  dom.fabBtn.addEventListener("click", () => {
    resetForm();
    document.querySelector("#students").scrollIntoView({ behavior: "smooth" });
    fields.id.focus();
  });

  dom.scrollTopBtn.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
  window.addEventListener("scroll", () => {
    dom.scrollTopBtn.classList.toggle("visible", window.scrollY > 500);
  });

  dom.dialogCancel.addEventListener("click", closeDialog);
  dom.dialogConfirm.addEventListener("click", () => {
    if (pendingConfirm) pendingConfirm();
    closeDialog();
  });

  dom.playStepsBtn.addEventListener("click", () => {
    const steps = [...dom.algorithmSteps.querySelectorAll("li")];
    steps.forEach((step) => step.classList.remove("active"));
    steps.forEach((step, index) => {
      setTimeout(() => step.classList.add("active"), index * 420);
      setTimeout(() => step.classList.remove("active"), index * 420 + 1050);
    });
  });

  document.addEventListener("click", (event) => {
    const target = event.target.closest("button, .primary, .secondary");
    if (!target) return;
    const rect = target.getBoundingClientRect();
    const ripple = document.createElement("span");
    ripple.className = "ripple";
    ripple.style.left = `${event.clientX - rect.left}px`;
    ripple.style.top = `${event.clientY - rect.top}px`;
    target.appendChild(ripple);
    setTimeout(() => ripple.remove(), 600);
  });
}

window.editStudent = editStudent;
window.deleteStudent = deleteStudent;

bindEvents();
fetchStudents();
renderRecommendations();

setTimeout(() => {
  dom.appLoader.classList.add("hidden");
}, 450);
