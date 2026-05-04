/* ===========================================================
   AI-Ready RevOps Self-Assessment — Quiz Engine
   =========================================================== */

const QUESTIONS = [
  // Data Foundation (weight 0.20) — 3 questions
  {
    dim: 'data',
    text: "When you pull a list of accounts in your CRM, how would you describe the completeness of critical fields like industry, employee count, and renewal date?",
    anchors: ['Mostly missing', 'Patchy but workable', 'Above 95% complete']
  },
  {
    dim: 'data',
    text: "If you asked three of your reps to define MQL right now, would you get three matching answers?",
    anchors: ['Three different answers', 'Roughly the same', 'Identical, system-enforced']
  },
  {
    dim: 'data',
    text: "When was your last duplicate cleanup, and how confident are you that the duplicate rate is currently below 2%?",
    anchors: ['No cleanup, no idea', 'Periodic, rate unknown', 'Continuous, measured']
  },
  // Integration Architecture (weight 0.15) — 2 questions
  {
    dim: 'integration',
    text: "If your CRM and your marketing automation showed different revenue numbers tomorrow, who decides which is right?",
    anchors: ['A meeting and an argument', 'Sales Ops arbitrates', 'Documented system of record']
  },
  {
    dim: 'integration',
    text: "How would you find out if a critical integration broke at 2 AM on a Saturday?",
    anchors: ['A rep would tell us Monday', 'Morning monitoring report', 'Paged alerts with runbooks']
  },
  // Process Standardization (weight 0.15) — 2 questions
  {
    dim: 'process',
    text: "Pick your largest deal stage. What are the documented exit criteria, and are they enforced?",
    anchors: ['No exit criteria', 'Documented, not enforced', 'Enforced via validation']
  },
  {
    dim: 'process',
    text: "When marketing hands a lead to sales, what is the SLA, who owns it, and what happens if it's missed?",
    anchors: ['No SLA', 'SLA exists, unmeasured', 'Tracked, enforced, tied to comp']
  },
  // AI Stack Fit (weight 0.20) — 3 questions
  {
    dim: 'ai',
    text: "List every AI tool you currently pay for. Can you state the specific revenue or cost outcome each is producing?",
    anchors: ['Cannot list them', 'Can list, no measured outcomes', 'Each has measured ROI']
  },
  {
    dim: 'ai',
    text: "Of your reps with access to AI tools, what percentage use them as a primary part of their daily workflow?",
    anchors: ['Below 30%', '50–70%', 'Above 90%']
  },
  {
    dim: 'ai',
    text: "When your AI tools query data, are they pulling from a curated layer or directly from production CRM?",
    anchors: ['Direct from CRM', 'Some prep, ad-hoc', 'Curated data products']
  },
  // Governance & Access (weight 0.15) — 3 questions
  {
    dim: 'governance',
    text: "How many connected apps and OAuth grants are active in your CRM right now? When were they last reviewed?",
    anchors: ["Don't know", 'Inventoried, annual review', 'Inventoried, monitored']
  },
  {
    dim: 'governance',
    text: "If an AI agent made an unauthorized change in your CRM yesterday, could you prove what it did and roll it back?",
    anchors: ['No', 'With effort, partial trail', 'Yes, full audit + SIEM']
  },
  {
    dim: 'governance',
    text: "Are you in compliance with the Spring '26 Salesforce Connected App OAuth restrictions?",
    anchors: ["Don't know what those are", 'Aware, partially implemented', 'Implemented and monitored']
  },
  // Forecasting Trust (weight 0.15) — 2 questions
  {
    dim: 'forecast',
    text: "Across your last four quarters, what was your forecast accuracy?",
    anchors: ['Below 60%', '70–80%', 'Above 90%']
  },
  {
    dim: 'forecast',
    text: "Does your CEO use the CRM-generated forecast as the operating plan, or maintain a parallel model?",
    anchors: ['Parallel model exists', 'Uses CRM with caveats', 'Forecast is the plan']
  }
];

const DIMENSIONS = {
  data:        { name: 'Data Foundation',          weight: 0.20, count: 3 },
  integration: { name: 'Integration Architecture', weight: 0.15, count: 2 },
  process:     { name: 'Process Standardization',  weight: 0.15, count: 2 },
  ai:          { name: 'AI Stack Fit',             weight: 0.20, count: 3 },
  governance:  { name: 'Governance & Access',      weight: 0.15, count: 3 },
  forecast:    { name: 'Forecasting Trust',        weight: 0.15, count: 2 }
};

const PRIORITY_GUIDANCE = {
  data:        "Field completeness, picklist discipline, and dedup. Start with a 90-day field utilization scan and a one-time cleanup pass on Account, Contact, and Opportunity.",
  integration: "Document your system of record per data domain. Add monitoring to your top five revenue-critical syncs. Maintain a living integration inventory with named owners.",
  process:     "Lock down stage exit criteria with required field validation. Run a cross-functional MQL/SQL/Opp definition workshop. Set and enforce handoff SLAs.",
  ai:          "Inventory every AI tool you pay for with adoption metrics. Sunset tools that don't show measured outcomes. Build a curated data layer between production CRM and AI tools.",
  governance:  "Audit your connected apps and OAuth grants. Implement Spring '26 restrictions. Move to a least-privilege profile model. Turn on field history on all revenue-critical fields.",
  forecast:    "Document your forecasting methodology. Set a weekly pipeline hygiene cadence with stale-opp criteria. Reconcile AI-assisted and manager-call forecasts monthly."
};

let answers = new Array(QUESTIONS.length).fill(null);
let currentQ = 0;

function startQuiz() {
  document.getElementById('intro').style.display = 'none';
  document.getElementById('quiz').style.display = 'block';
  renderQuestion();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function renderQuestion() {
  const q = QUESTIONS[currentQ];
  const container = document.getElementById('questionContainer');
  const answer = answers[currentQ];

  container.innerHTML = `
    <article class="quiz-question">
      <div class="quiz-q-num">Question ${currentQ + 1} of ${QUESTIONS.length}</div>
      <div class="quiz-q-text">${q.text}</div>
      <div class="quiz-q-dim">${DIMENSIONS[q.dim].name}</div>
      <div class="quiz-options" role="radiogroup" aria-label="${q.text}">
        ${[1,2,3,4,5].map(n => `
          <button type="button" class="quiz-option ${answer === n ? 'selected' : ''}"
                  role="radio" aria-checked="${answer === n}"
                  data-value="${n}" onclick="selectAnswer(${n})">${n}</button>
        `).join('')}
      </div>
      <div class="quiz-anchors">
        <span>${q.anchors[0]}</span>
        <span style="text-align:center">${q.anchors[1]}</span>
        <span style="text-align:right">${q.anchors[2]}</span>
      </div>
    </article>
  `;

  // Progress
  const pct = ((currentQ) / QUESTIONS.length) * 100;
  document.getElementById('progressFill').style.width = pct + '%';
  document.getElementById('progressLabel').textContent = `Question ${currentQ + 1} of ${QUESTIONS.length}`;
  document.getElementById('progressDim').textContent = DIMENSIONS[q.dim].name;

  document.getElementById('prevBtn').disabled = currentQ === 0;
  document.getElementById('prevBtn').style.visibility = currentQ === 0 ? 'hidden' : 'visible';
  document.getElementById('nextBtn').disabled = answer === null;
  document.getElementById('nextBtn').textContent = currentQ === QUESTIONS.length - 1 ? 'See results →' : 'Next →';
}

function selectAnswer(value) {
  answers[currentQ] = value;
  document.getElementById('nextBtn').disabled = false;
  // visual update only
  document.querySelectorAll('.quiz-option').forEach(o => {
    const v = parseInt(o.dataset.value);
    o.classList.toggle('selected', v === value);
    o.setAttribute('aria-checked', v === value);
  });
}

function nextQ() {
  if (answers[currentQ] === null) return;
  if (currentQ < QUESTIONS.length - 1) {
    currentQ++;
    renderQuestion();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } else {
    // Done — go to email gate
    document.getElementById('quiz').style.display = 'none';
    document.getElementById('emailGate').style.display = 'block';
    document.getElementById('progressFill').style.width = '100%';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

function prevQ() {
  if (currentQ > 0) {
    currentQ--;
    renderQuestion();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

function submitEmail(e) {
  e.preventDefault();
  const email = document.getElementById('emailInput').value.trim();
  if (!email) return;

  // Persist results locally so they survive reloads
  const results = computeResults();
  const payload = Object.assign({}, results);
  payload.email = email;
  payload.timestamp = new Date().toISOString();
  try {
    localStorage.setItem('arr_lastResult', JSON.stringify(payload));
  } catch (e) { /* ignore */ }

  // Build a flat, Formspree-friendly submission. Each top-level key
  // becomes a column in the dashboard and a labeled row in the email.
  // results.dimensions is an array of { key, name, weight, score }.
  const dimByKey = {};
  results.dimensions.forEach(function(d){ dimByKey[d.key] = d; });

  // Compute the same "top 3 priorities" the results page shows
  const priorities = results.dimensions
    .map(function(d){ return Object.assign({}, d, { impact: (100 - d.score) * d.weight }); })
    .sort(function(a,b){ return b.impact - a.impact; })
    .slice(0, 3)
    .map(function(d){ return d.name + ' (' + d.score + '/100)'; });

  const submission = {
    email: email,
    readiness_index: results.index,
    band: results.band.label,
    band_description: results.band.desc,
    score_data_foundation:        dimByKey.data        ? dimByKey.data.score        : null,
    score_integration:            dimByKey.integration ? dimByKey.integration.score : null,
    score_process:                dimByKey.process     ? dimByKey.process.score     : null,
    score_ai_stack:               dimByKey.ai          ? dimByKey.ai.score          : null,
    score_governance:             dimByKey.governance  ? dimByKey.governance.score  : null,
    score_forecasting:            dimByKey.forecast    ? dimByKey.forecast.score    : null,
    top_priorities: priorities.join('  ·  '),
    raw_answers: results.answers.join(','),
    timestamp: payload.timestamp,
    source: 'aireadyrevops.com/assessment',
    _subject: 'New assessment: ' + results.index + ' — ' + results.band.label + ' (' + email + ')'
  };

  // Fire-and-forget. Don't make the user wait. Show results immediately
  // regardless of network outcome. Failures log to the browser console.
  function submitEmail(e) {
  e.preventDefault();

  const email = document.getElementById('emailInput').value.trim();
  if (!email) return;

  // Compute results
  const results = computeResults();

  const payload = {
    ...results,
    email,
    timestamp: new Date().toISOString()
  };

  // Store locally
  try {
    localStorage.setItem('arr_lastResult', JSON.stringify(payload));
  } catch (e) {}

  // Build dimension lookup
  const dimByKey = {};
  results.dimensions.forEach(d => {
    dimByKey[d.key] = d;
  });

  // Top 3 priorities
  const priorities = results.dimensions
    .map(d => ({ ...d, impact: (100 - d.score) * d.weight }))
    .sort((a, b) => b.impact - a.impact)
    .slice(0, 3)
    .map(d => `${d.name} (${d.score}/100)`);

  // Final submission object
  const submission = {
    email: email,
    readiness_index: results.index,
    band: results.band.label,
    band_description: results.band.desc,

    score_data_foundation: dimByKey.data?.score || null,
    score_integration: dimByKey.integration?.score || null,
    score_process: dimByKey.process?.score || null,
    score_ai_stack: dimByKey.ai?.score || null,
    score_governance: dimByKey.governance?.score || null,
    score_forecasting: dimByKey.forecast?.score || null,

    top_priorities: priorities.join(' | '),
    raw_answers: results.answers.join(','),

    timestamp: payload.timestamp,
    source: 'aireadyrevops.com/assessment',
    _subject: `New assessment: ${results.index} — ${results.band.label} (${email})`
  };

  /* ============================
     ✅ FIX: Use FormData (NOT JSON)
     ============================ */
  const formData = new FormData();

  Object.keys(submission).forEach(key => {
    formData.append(key, submission[key]);
  });

  fetch('https://formspree.io/f/xeenarko', {
    method: 'POST',
    body: formData
  })
    .then(res => {
      if (!res.ok) {
        console.warn('Formspree error:', res.status);
      } else {
        console.log('Formspree success');
      }
    })
    .catch(err => {
      console.warn('Submission failed:', err);
    });

  // Show results immediately (no waiting)
  showResults();
}
  }).then(function(r){
    if (!r.ok) console.warn('Submission returned status', r.status);
  }).catch(function(err){
    console.warn('Submission failed:', err);
  });

  showResults();
}

function skipEmail(e) {
  e.preventDefault();
  showResults();
}

function showResults() {
  document.getElementById('emailGate').style.display = 'none';
  document.getElementById('results').style.display = 'block';

  const r = computeResults();

  // Headline
  document.getElementById('rIndex').textContent = r.index;
  document.getElementById('rBand').textContent = r.band.label;
  document.getElementById('rBand').className = 'results-band b-' + r.band.cls;
  document.getElementById('rBandDesc').textContent = r.band.desc;

  // Dimension bars
  const bars = document.getElementById('dimBars');
  bars.innerHTML = r.dimensions.map(d => `
    <div class="dim-bar">
      <div class="dim-bar-head">
        <span class="dim-bar-name">${d.name}</span>
        <span class="dim-bar-score">${d.score} / 100  ·  weight ${(d.weight*100).toFixed(0)}%</span>
      </div>
      <div class="dim-bar-track">
        <div class="dim-bar-fill" style="width:0%"></div>
      </div>
    </div>
  `).join('');

  // Animate bars
  setTimeout(() => {
    document.querySelectorAll('.dim-bar-fill').forEach((el, i) => {
      el.style.width = r.dimensions[i].score + '%';
      // Color by score
      const s = r.dimensions[i].score;
      if (s >= 80)      el.style.background = '#1F5A3A';
      else if (s >= 65) el.style.background = '#3A7B5A';
      else if (s >= 50) el.style.background = '#B07A1A';
      else              el.style.background = '#B23A1E';
    });
  }, 100);

  // Top 3 priorities — lowest-scoring dimensions, weighted by impact potential
  const priorities = [...r.dimensions]
    .map(d => ({ ...d, impact: (100 - d.score) * d.weight }))
    .sort((a,b) => b.impact - a.impact)
    .slice(0, 3);

  document.getElementById('priorityList').innerHTML = priorities.map(p => `
    <li style="margin-bottom:1.25rem">
      <strong style="font-family:var(--font-display);font-size:1.15rem;letter-spacing:-0.01em">${p.name}</strong>
      <span class="muted" style="font-family:var(--font-mono);font-size:0.8rem;margin-left:0.5rem">scored ${p.score}/100</span>
      <p class="muted" style="margin-top:0.4rem;line-height:1.55">${PRIORITY_GUIDANCE[p.key]}</p>
    </li>
  `).join('');

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function computeResults() {
  // Group answers by dimension
  const byDim = {};
  Object.keys(DIMENSIONS).forEach(k => byDim[k] = []);
  QUESTIONS.forEach((q, i) => {
    byDim[q.dim].push(answers[i] || 1);
  });

  const dimensions = Object.keys(DIMENSIONS).map(key => {
    const cfg = DIMENSIONS[key];
    const arr = byDim[key];
    const avg = arr.reduce((a,b) => a+b, 0) / arr.length;
    const score = Math.round(((avg - 1) / 4) * 100); // 1->0, 5->100
    return { key, name: cfg.name, weight: cfg.weight, score };
  });

  const index = Math.round(dimensions.reduce((s, d) => s + d.score * d.weight, 0));

  let band;
  if      (index >= 80) band = { label: 'AI-Ready',     cls: 'ready',     desc: 'Foundations are in place. Focus on optimization, scale, and advanced use cases. You should be getting real ROI from current AI investments.' };
  else if (index >= 65) band = { label: 'AI-Capable',   cls: 'capable',   desc: 'Most foundations are sound. Targeted remediation in one or two dimensions will unlock meaningful AI ROI. You are close.' };
  else if (index >= 50) band = { label: 'AI-Risky',     cls: 'risky',     desc: 'AI investments are at risk of producing unreliable outputs. Structural remediation is required before scaling AI further.' };
  else if (index >= 35) band = { label: 'AI-Fragile',   cls: 'fragile',   desc: 'AI deployments are likely producing unreliable outputs today. Immediate intervention is needed before any new investment.' };
  else                  band = { label: 'AI-Premature', cls: 'premature', desc: 'Foundational work is required before any AI investment will deliver ROI. Stop spending on new AI tools until the foundation is fixed.' };

  return { index, band, dimensions, answers };
}

function restartQuiz(e) {
  e.preventDefault();
  answers = new Array(QUESTIONS.length).fill(null);
  currentQ = 0;
  document.getElementById('results').style.display = 'none';
  document.getElementById('intro').style.display = 'block';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
