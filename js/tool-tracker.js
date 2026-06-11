/* ===================================================================
   AI-Ready RevOps · Tool Analytics Tracker
   Fires events to both GA4 and the CRM (D1 via /api/tool-event).
   Include AFTER the gtag snippet on every tool page.
   =================================================================== */

(function () {
  'use strict';

  var CRM_URL = 'https://airr-crm.pages.dev/api/tool-event';

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

    // GA4
    if (typeof gtag === 'function') {
      gtag('event', name, params);
    }

    // CRM beacon (fire-and-forget)
    try {
      var payload = { tool_name: TOOL, event: name };
      if (params.score) payload.score = params.score;
      if (params.recommendation) payload.recommendation = params.recommendation;
      if (params.tier) payload.tier = params.tier;
      if (params.destination) payload.destination = params.destination;
      if (params.interacted !== undefined) payload.interacted = params.interacted;
      payload.time_on_tool = params.time_on_tool;
      if (navigator.sendBeacon) {
        navigator.sendBeacon(CRM_URL, JSON.stringify(payload));
      } else {
        fetch(CRM_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload), keepalive: true }).catch(function(){});
      }
    } catch (e) {}

    if (window.__TT_DEBUG) console.log('[tracker]', name, params);
  }

  // 1. Tool loaded
  fire('tool_loaded');

  // 2. First interaction
  var app = document.querySelector('.tool-app');
  if (app) {
    app.addEventListener('click', function () {
      if (!_interacted) { _interacted = true; fire('tool_interacted'); }
    }, true);
    app.addEventListener('input', function () {
      if (!_interacted) { _interacted = true; fire('tool_interacted'); }
    }, true);
  }

  // 3. Tool completed (result shown)
  var result = document.getElementById('result');
  if (result) {
    var observer = new MutationObserver(function (muts) {
      muts.forEach(function (m) {
        if (m.attributeName === 'class' && result.classList.contains('show') && !_completed) {
          _completed = true;
          var scoreEl = document.getElementById('score');
          var score = scoreEl ? scoreEl.textContent.trim() : null;
          _lastScore = score;
          var recEl = document.getElementById('rec-name');
          var rec = recEl ? recEl.textContent.trim() : null;
          var tierEl = document.getElementById('tier-h');
          var tier = tierEl ? tierEl.textContent.trim() : null;
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

  // 4. Always-visible tools (live-updating)
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
          });
        }
      });
    }
  }

  // 5. Framework/model switch
  document.addEventListener('click', function (e) {
    var btn = e.target;
    var sw = document.getElementById('fw-switch');
    if (sw && sw.contains(btn) && btn.tagName === 'BUTTON') {
      fire('framework_switched', { framework: btn.textContent.trim() });
    }
    var ms = document.getElementById('motion-switch');
    if (ms && ms.contains(btn) && btn.tagName === 'BUTTON') {
      fire('motion_switched', { motion: btn.textContent.trim() });
    }
  }, true);

  // 6. Segmented control selections
  document.addEventListener('click', function (e) {
    var btn = e.target;
    if (btn.tagName === 'BUTTON' && btn.parentElement && btn.parentElement.classList.contains('seg')) {
      var field = btn.parentElement.previousElementSibling;
      var label = field && field.tagName === 'LABEL' ? field.textContent.split('\n')[0].trim() : '';
      fire('option_selected', { field: label, value: btn.textContent.trim() });
    }
  }, true);

  // 7. Checklist toggles
  document.addEventListener('click', function (e) {
    var chk = e.target.closest('.chk');
    if (chk) {
      var h4 = chk.querySelector('h4');
      var name = h4 ? h4.textContent.trim() : '';
      var on = chk.classList.contains('on');
      fire('checklist_toggled', { item: name, state: on ? 'on' : 'off' });
    }
  }, true);

  // 8. CTA clicks
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

  // 9. Print / save
  document.addEventListener('click', function (e) {
    var btn = e.target.closest('button');
    if (btn && btn.textContent.indexOf('Print') > -1) {
      fire('scorecard_printed', _lastMeta);
    }
  }, true);

  // 10. Dropoff detection
  window.addEventListener('beforeunload', function () {
    if (!_completed && !_completedLive) {
      fire('tool_abandoned', {
        interacted: _interacted,
        time_on_tool: Math.round((Date.now() - _started) / 1000),
      });
    }
  });

  // 11. Scroll depth
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

  if (location.search.indexOf('tt_debug') > -1) window.__TT_DEBUG = true;

})();
