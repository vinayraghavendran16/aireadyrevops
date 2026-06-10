/* ===================================================================
   AI-Ready RevOps · Tool Analytics Tracker
   Fires GA4 custom events for tool usage, completion, and dropoff.
   Include AFTER the gtag snippet on every tool page.
   =================================================================== */

(function () {
  'use strict';

  // ---- helpers ----
  var TOOL = (function () {
    var m = location.pathname.match(/\/tools\/([a-z0-9-]+)\.html/);
    return m ? m[1] : 'unknown';
  })();

  var _started = Date.now();
  var _interacted = false;
  var _completed = false;
  var _lastScore = null;
  var _lastMeta = {};

  function fire(name, params) {
    params = params || {};
    params.tool_name = TOOL;
    params.time_on_tool = Math.round((Date.now() - _started) / 1000);
    if (typeof gtag === 'function') {
      gtag('event', name, params);
    }
    if (window.__TT_DEBUG) console.log('[tracker]', name, params);
  }

  // ---- 1. Tool loaded ----
  fire('tool_loaded');

  // ---- 2. First interaction (any click/input inside .tool-app) ----
  var app = document.querySelector('.tool-app');
  if (app) {
    app.addEventListener('click', function () {
      if (!_interacted) { _interacted = true; fire('tool_interacted'); }
    }, true);
    app.addEventListener('input', function () {
      if (!_interacted) { _interacted = true; fire('tool_interacted'); }
    }, true);
  }

  // ---- 3. Tool completed (result shown) ----
  // Uses a MutationObserver watching for .tool-result gaining .show,
  // or the result element becoming visible.
  var result = document.getElementById('result');
  if (result) {
    var observer = new MutationObserver(function (muts) {
      muts.forEach(function (m) {
        if (m.attributeName === 'class' && result.classList.contains('show') && !_completed) {
          _completed = true;
          // Read the score if present
          var scoreEl = document.getElementById('score');
          var score = scoreEl ? scoreEl.textContent.trim() : null;
          _lastScore = score;

          // Read framework/model name if present
          var recEl = document.getElementById('rec-name');
          var rec = recEl ? recEl.textContent.trim() : null;

          // Read tier headline if present
          var tierEl = document.getElementById('tier-h');
          var tier = tierEl ? tierEl.textContent.trim() : null;

          // Read verdict if present (build-vs-buy)
          var verdictEl = document.getElementById('verdict');
          var verdict = verdictEl ? verdictEl.textContent.trim() : null;

          _lastMeta = { score: score, recommendation: rec || verdict, tier: tier };

          fire('tool_completed', {
            score: score,
            recommendation: rec || verdict || '',
            tier: tier || '',
          });
        }
      });
    });
    observer.observe(result, { attributes: true });
  }

  // ---- 4. Always-visible tools (no .show toggle — CRM scorecard, build-vs-buy, health score, cost-of-inaction) ----
  // These show results immediately; track meaningful interaction instead.
  // For sliders: fire completion after 3+ distinct input events.
  var inputCount = 0;
  var _completedLive = false;
  if (result && result.classList.contains('show')) {
    if (app) {
      app.addEventListener('input', function () {
        inputCount++;
        if (inputCount >= 3 && !_completedLive) {
          _completedLive = true;
          _completed = true;
          var scoreEl = document.getElementById('score');
          fire('tool_completed', {
            score: scoreEl ? scoreEl.textContent.trim() : '',
            recommendation: '',
            tier: '',
            live_tool: true,
          });
        }
      });
    }
  }

  // ---- 5. Framework/model switch (qualification builder, forecast simulator) ----
  document.addEventListener('click', function (e) {
    var btn = e.target;
    // Framework switcher chips
    var sw = document.getElementById('fw-switch');
    if (sw && sw.contains(btn) && btn.tagName === 'BUTTON') {
      fire('framework_switched', { framework: btn.textContent.trim() });
    }
    // Motion switcher (PLG/Hybrid/Sales-led)
    var ms = document.getElementById('motion-switch');
    if (ms && ms.contains(btn) && btn.tagName === 'BUTTON') {
      fire('motion_switched', { motion: btn.textContent.trim() });
    }
  }, true);

  // ---- 6. Segmented control selections ----
  document.addEventListener('click', function (e) {
    var btn = e.target;
    if (btn.tagName === 'BUTTON' && btn.parentElement && btn.parentElement.classList.contains('seg')) {
      var field = btn.parentElement.previousElementSibling;
      var label = field && field.tagName === 'LABEL' ? field.textContent.split('\n')[0].trim() : '';
      fire('option_selected', { field: label, value: btn.textContent.trim() });
    }
  }, true);

  // ---- 7. Checklist toggles ----
  document.addEventListener('click', function (e) {
    var chk = e.target.closest('.chk');
    if (chk) {
      var h4 = chk.querySelector('h4');
      var name = h4 ? h4.textContent.trim() : '';
      var on = chk.classList.contains('on');
      fire('checklist_toggled', { item: name, state: on ? 'on' : 'off' });
    }
  }, true);

  // ---- 8. CTA clicks (assessment, services) ----
  document.addEventListener('click', function (e) {
    var a = e.target.closest('a');
    if (!a) return;
    var href = a.getAttribute('href') || '';
    if (href.indexOf('/assessment') > -1) {
      fire('cta_clicked', { destination: 'assessment', score: _lastScore || '' });
    } else if (href.indexOf('/services') > -1) {
      fire('cta_clicked', { destination: 'services', score: _lastScore || '' });
    }
  }, true);

  // ---- 9. Print / save ----
  document.addEventListener('click', function (e) {
    var btn = e.target.closest('button');
    if (btn && btn.textContent.indexOf('Print') > -1) {
      fire('scorecard_printed', _lastMeta);
    }
  }, true);

  // ---- 10. Dropoff detection (page unload without completion) ----
  window.addEventListener('beforeunload', function () {
    if (!_completed && !_completedLive) {
      fire('tool_abandoned', {
        interacted: _interacted,
        time_on_tool: Math.round((Date.now() - _started) / 1000),
      });
    }
  });

  // ---- 11. Scroll depth (25/50/75/100) ----
  var _depths = {};
  function checkScroll() {
    var h = document.documentElement.scrollHeight - window.innerHeight;
    if (h <= 0) return;
    var pct = Math.round(window.scrollY / h * 100);
    [25, 50, 75, 100].forEach(function (d) {
      if (pct >= d && !_depths[d]) {
        _depths[d] = true;
        fire('scroll_depth', { depth: d });
      }
    });
  }
  window.addEventListener('scroll', checkScroll, { passive: true });

  // expose for debugging: add ?tt_debug=1 to URL
  if (location.search.indexOf('tt_debug') > -1) window.__TT_DEBUG = true;

})();
