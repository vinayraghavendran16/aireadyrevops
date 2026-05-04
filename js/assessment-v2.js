/* ===========================================================
   AI-Ready RevOps Self-Assessment — Quiz Engine
   =========================================================== */
console.log("NEW JS LOADED V2");
const QUESTIONS = [
  { dim: 'data', text: "When you pull a list of accounts in your CRM, how would you describe the completeness of critical fields like industry, employee count, and renewal date?", anchors: ['Mostly missing', 'Patchy but workable', 'Above 95% complete'] },
  { dim: 'data', text: "If you asked three of your reps to define MQL right now, would you get three matching answers?", anchors: ['Three different answers', 'Roughly the same', 'Identical, system-enforced'] },
  { dim: 'data', text: "When was your last duplicate cleanup, and how confident are you that the duplicate rate is currently below 2%?", anchors: ['No cleanup, no idea', 'Periodic, rate unknown', 'Continuous, measured'] },

  { dim: 'integration', text: "If your CRM and your marketing automation showed different revenue numbers tomorrow, who decides which is right?", anchors: ['A meeting and an argument', 'Sales Ops arbitrates', 'Documented system of record'] },
  { dim: 'integration', text: "How would you find out if a critical integration broke at 2 AM on a Saturday?", anchors: ['A rep would tell us Monday', 'Morning monitoring report', 'Paged alerts with runbooks'] },

  { dim: 'process', text: "Pick your largest deal stage. What are the documented exit criteria, and are they enforced?", anchors: ['No exit criteria', 'Documented, not enforced', 'Enforced via validation'] },
  { dim: 'process', text: "When marketing hands a lead to sales, what is the SLA, who owns it, and what happens if it's missed?", anchors: ['No SLA', 'SLA exists, unmeasured', 'Tracked, enforced, tied to comp'] },

  { dim: 'ai', text: "List every AI tool you currently pay for. Can you state the specific revenue or cost outcome each is producing?", anchors: ['Cannot list them', 'Can list, no measured outcomes', 'Each has measured ROI'] },
  { dim: 'ai', text: "Of your reps with access to AI tools, what percentage use them as a primary part of their daily workflow?", anchors: ['Below 30%', '50–70%', 'Above 90%'] },
  { dim: 'ai', text: "When your AI tools query data, are they pulling from a curated layer or directly from production CRM?", anchors: ['Direct from CRM', 'Some prep, ad-hoc', 'Curated data products'] },

  { dim: 'governance', text: "How many connected apps and OAuth grants are active in your CRM right now? When were they last reviewed?", anchors: ["Don't know", 'Inventoried, annual review', 'Inventoried, monitored'] },
  { dim: 'governance', text: "If an AI agent made an unauthorized change in your CRM yesterday, could you prove what it did and roll it back?", anchors: ['No', 'With effort, partial trail', 'Yes, full audit + SIEM'] },
  { dim: 'governance', text: "Are you in compliance with the Spring '26 Salesforce Connected App OAuth restrictions?", anchors: ["Don't know what those are", 'Aware, partially implemented', 'Implemented and monitored'] },

  { dim: 'forecast', text: "Across your last four quarters, what was your forecast accuracy?", anchors: ['Below 60%', '70–80%', 'Above 90%'] },
  { dim: 'forecast', text: "Does your CEO use the CRM-generated forecast as the operating plan, or maintain a parallel model?", anchors: ['Parallel model exists', 'Uses CRM with caveats', 'Forecast is the plan'] }
];

const DIMENSIONS = {
  data: { name: 'Data Foundation', weight: 0.20 },
  integration: { name: 'Integration Architecture', weight: 0.15 },
  process: { name: 'Process Standardization', weight: 0.15 },
  ai: { name: 'AI Stack Fit', weight: 0.20 },
  governance: { name: 'Governance & Access', weight: 0.15 },
  forecast: { name: 'Forecasting Trust', weight: 0.15 }
};

let answers = new Array(QUESTIONS.length).fill(null);
let currentQ = 0;

function startQuiz() {
  document.getElementById('intro').style.display = 'none';
  document.getElementById('quiz').style.display = 'block';
  renderQuestion();
}

function renderQuestion() {
  const q = QUESTIONS[currentQ];
  const container = document.getElementById('questionContainer');
  const answer = answers[currentQ];

  container.innerHTML = `
    <div>${q.text}</div>
    ${[1,2,3,4,5].map(n => `
      <button onclick="selectAnswer(${n})" class="${answer === n ? 'selected' : ''}">${n}</button>
    `).join('')}
  `;

  document.getElementById('nextBtn').disabled = answer === null;
}

function selectAnswer(value) {
  answers[currentQ] = value;
  document.getElementById('nextBtn').disabled = false;
}

function nextQ() {
  if (currentQ < QUESTIONS.length - 1) {
    currentQ++;
    renderQuestion();
  } else {
    document.getElementById('quiz').style.display = 'none';
    document.getElementById('emailGate').style.display = 'block';
  }
}

function submitEmail(e) {
  e.preventDefault();

  const email = document.getElementById('emailInput').value.trim();
  if (!email) return;

  const results = computeResults();

  const dimByKey = {};
  results.dimensions.forEach(d => dimByKey[d.key] = d);

  const submission = {
    email,
    readiness_index: results.index,
    band: results.band.label,
    score_data: dimByKey.data?.score,
    score_ai: dimByKey.ai?.score,
    answers: results.answers,
    timestamp: new Date().toISOString()
  };

 const formData = new FormData();

Object.entries(submission).forEach(([key, value]) => {
  formData.append(
    key,
    typeof value === "object" ? JSON.stringify(value) : value
  );
});

fetch("https://hooks.zapier.com/hooks/catch/27472091/uvxrtos/", {
  method: "POST",
  mode: "no-cors",   // 🔥 fixes CORS
  body: formData     // 🔥 avoids preflight
})
.then(() => {
  console.log("Sent to Zapier");
})
.catch(err => {
  console.error("Zapier error:", err);
});
  showResults();
}

function showResults() {
  document.getElementById('emailGate').style.display = 'none';
  document.getElementById('results').style.display = 'block';
}

function computeResults() {
  const score = Math.round((answers.reduce((a,b)=>a+(b||1),0)/answers.length -1)/4*100);

  return {
    index: score,
    band: { label: score > 70 ? 'Good' : 'Needs Work' },
    dimensions: [
      { key:'data', score },
      { key:'ai', score }
    ],
    answers
  };
}
