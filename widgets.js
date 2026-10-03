/* kishore.run widgets: pipeline scroll progress, copy-email toast,
   Ask-About-Me chat (+ recruiter FAQ), project case-study modals,
   AJAX contact form. Vanilla JS, no dependencies. */
(function () {
  'use strict';

  var EMAIL = 'sivakishorereddyallu@gmail.com';
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ============ 1. Pipeline scroll progress bar ============ */
  (function pipeline() {
    var bar = document.createElement('div');
    bar.className = 'pipe-progress';
    bar.setAttribute('aria-hidden', 'true');
    document.body.appendChild(bar);
    var ticking = false;
    function update() {
      ticking = false;
      var h = document.documentElement;
      var max = h.scrollHeight - h.clientHeight;
      var p = max > 0 ? (h.scrollTop || document.body.scrollTop) / max : 0;
      bar.style.transform = 'scaleX(' + Math.min(1, Math.max(0, p)) + ')';
    }
    function request() { if (!ticking) { ticking = true; requestAnimationFrame(update); } }
    window.addEventListener('scroll', request, { passive: true });
    window.addEventListener('resize', request);
    update();
  })();

  /* ============ 2. Toast + copy-email ============ */
  var toastTimer = null;
  function toast(msg, actionLabel, actionHref) {
    var t = document.querySelector('.kr-toast');
    if (!t) {
      t = document.createElement('div');
      t.className = 'kr-toast';
      t.setAttribute('role', 'status');
      document.body.appendChild(t);
    }
    t.textContent = '';
    var s = document.createElement('span');
    s.textContent = msg;
    t.appendChild(s);
    if (actionLabel && actionHref) {
      var a = document.createElement('a');
      a.href = actionHref;
      a.textContent = actionLabel;
      t.appendChild(a);
    }
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove('show'); }, 3400);
  }

  function copyText(txt, done) {
    function fallback() {
      var ta = document.createElement('textarea');
      ta.value = txt;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); } catch (e) { /* noop */ }
      document.body.removeChild(ta);
      done();
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(txt).then(done, fallback);
    } else {
      fallback();
    }
  }

  /* Every mailto link copies the address; the toast offers opening the mail app. */
  document.addEventListener('click', function (e) {
    var a = e.target.closest ? e.target.closest('a[href^="mailto:"]') : null;
    if (!a || a.closest('.kr-chat')) return; /* chat handles its own links */
    e.preventDefault();
    var email = a.getAttribute('href').replace(/^mailto:/i, '').split('?')[0];
    copyText(email, function () {
      toast('Email copied to clipboard', 'Open mail app', 'mailto:' + email);
    });
  });

  /* ============ 3. Ask-About-Me chat (+ recruiter FAQ) ============ */
  var LINK = {
    email: '<a href="mailto:' + EMAIL + '">' + EMAIL + '</a>',
    github: '<a href="https://github.com/k1sh0r3" target="_blank" rel="noopener">GitHub</a>',
    linkedin: '<a href="https://www.linkedin.com/in/kishore0451/" target="_blank" rel="noopener">LinkedIn</a>',
    resume: '<a href="Siva_Kishore_Reddy_Allu_Resume.pdf" download>download his resume (PDF)</a>',
    projects: '<a href="projects.html">Projects page</a>'
  };

  var KB = [
    { keys: ['hello', 'hey', 'yo', 'morning', 'afternoon', 'evening'],
      reply: "Hey! Ask me about kishore's background, skills, projects, certifications — or how to reach him." },
    { keys: ['who are you', 'who is kishore', 'about kishore', 'about him', 'yourself', 'introduce'],
      reply: "<b>Siva Kishore Reddy Allu</b> is a Data Engineer in Cincinnati, Ohio — previously a Project Engineer at Wipro (2020–2023), now building AI-powered data tools. " + LINK.projects + "." },
    { keys: ['what does he do', 'what do you do', 'role', 'job title', 'position', 'occupation', 'work as'],
      reply: "He's a <b>Data Engineer</b> — ETL pipelines, AWS, PySpark, and lately AI/ML-powered tooling. Nearly 3 years turning raw data into decisions." },
    { keys: ['skill', 'stack', 'technolog', 'tools', 'python', 'pyspark', 'aws', 'what can he', 'good at', 'expertise', 'know'],
      reply: "Core stack: <b>Python, SQL, PySpark, AWS Glue, S3, EC2, Docker, Tableau</b> — plus data modeling, ETL design, TypeScript, CI/CD, REST APIs, and Pandas." },
    { keys: ['experience', 'wipro', 'worked', 'background', 'career', 'years', 'history'],
      reply: "Project Engineer at <b>Wipro Ltd</b> (Jan 2020–Feb 2023): built a Python XML-processing framework, AWS Glue + PySpark ETL pipelines with delta loads, and Tableau dashboards — about a 30% query-performance gain." },
    { keys: ['project', 'built', 'portfolio', 'side project', 'apps'],
      reply: "Six recent builds, all live: <b>SQLSentinel</b> (reviewer for AI-written SQL), <b>BlastRadius</b> (column-level data lineage), <b>PreSQL</b> (SQL-safety MCP server), <b>HireRadar</b> (visa-friendly job board), <b>SeevForge</b> (AI resume builder), <b>CtrlZAPI</b> (daily API-schema archive). See the " + LINK.projects + " for case studies." },
    { keys: ['sqlsentinel', 'sentinel'],
      reply: "<b>SQLSentinel</b> — \"the code reviewer for AI-written SQL.\" A generate → validate → repair loop checks queries against your schema and blocks destructive statements. Also ships as a GitHub Action that reviews SQL in pull requests." },
    { keys: ['blastradius', 'blast radius', 'lineage'],
      reply: "<b>BlastRadius</b> — \"know what breaks before you change it.\" In-browser, column-level data lineage: drop in a dbt manifest or raw SQL, click any column for its upstream chain and downstream blast radius." },
    { keys: ['presql', 'pre-sql', 'mcp'],
      reply: "<b>PreSQL</b> — a SQL-safety layer for AI agents: a TypeScript MCP server with three tools (validate_sql, explain_sql, guard_query) that blocks destructive queries before they run. 41/41 tests green." },
    { keys: ['hireradar', 'hire radar', 'job board'],
      reply: "<b>HireRadar</b> — a visa-friendly job board aggregating JSearch and Remotive listings, with filters for C2C, W-2, H-1B sponsorship, and F-1/OPT. Refreshed daily by an automated pipeline." },
    { keys: ['seevforge', 'seev forge', 'resume builder'],
      reply: "<b>SeevForge</b> — an AI-assisted resume builder: in-browser PDF/DOCX parsing, ATS scoring with a full breakdown, and job-description tailoring. The parser survived a 17-case hostile corpus and a 3000-input fuzz run." },
    { keys: ['ctrlzapi', 'ctrlz', 'api archive'],
      reply: "<b>CtrlZAPI</b> — \"Ctrl+Z for the API economy.\" A public archive snapshotting 33 free production APIs every day and recording exactly what changed in their response schemas." },
    { keys: ['techepoch', 'tech epoch', 'news'],
      reply: "<b>TechEpoch</b> — a shareable AI/ML/robotics-first tech news feed with one-tap sharing and a story-card generator." },
    { keys: ['education', 'degree', 'university', 'college', 'gpa', 'study', 'studied', 'school', 'master'],
      reply: "MS in <b>Information Technology</b>, University of Cincinnati (2023–2024, GPA 3.7/4.0), and a BSc in Computer Science &amp; Engineering, RGUKT (2015–2019)." },
    { keys: ['certif', 'aws certified', 'certificate'],
      reply: "Five pro certs: <b>AWS Solutions Architect – Associate</b>, <b>Google Cloud Professional Data Engineer</b>, <b>Azure Data Fundamentals</b>, <b>Databricks Data Engineer Associate</b>, and <b>Snowflake SnowPro Core</b>." },
    { keys: ['publish', 'publication', 'published', 'paper', 'research', 'ijrte'],
      reply: "He published an image-to-text deep-learning paper with the <b>IJRTE</b> journal. It's linked on his About page." },
    { keys: ['contact', 'email', 'reach', 'phone', 'call', 'linkedin', 'github', 'social'],
      reply: "Email him at " + LINK.email + " — or find him on " + LINK.github + " and " + LINK.linkedin + "." },
    { keys: ['hire', 'recruit', 'job opening', 'opportunity', 'interview'],
      reply: "Great instinct — " + LINK.email + " is the fastest way to reach him." },
    { keys: ['remote'],
      reply: "I don't have his remote-work preferences on file — best to ask him directly at " + LINK.email + "." },
    { keys: ['relocat', 'relocation', 'move to', 'onsite', 'on-site', 'hybrid'],
      reply: "He's based in Cincinnati, Ohio. For relocation or onsite questions, ask him directly at " + LINK.email + "." },
    { keys: ['notice', 'joining', 'start date', 'when can he start', 'availability', 'available'],
      reply: "His site header says it best: <b>$ open to work</b>. For exact timelines, email him at " + LINK.email + "." },
    { keys: ['visa', 'sponsor', 'authorized', 'authorization', 'work permit', 'h-1b', 'h1b', 'opt'],
      reply: "I don't have his work-authorization details on file — that's a direct question for " + LINK.email + "." },
    { keys: ['salary', 'pay', 'compensation', 'ctc', 'package'],
      reply: "He doesn't publish salary expectations — that's a conversation for " + LINK.email + "." },
    { keys: ['where', 'location', 'based', 'live', 'cincinnati', 'city'],
      reply: "He's based in <b>Cincinnati, Ohio</b>." },
    { keys: ['resume', 'cv'],
      reply: "You can " + LINK.resume + " right from this site." },
    { keys: ['thank', 'great', 'awesome', 'cool', 'nice', 'perfect'],
      reply: "Anytime! Anything else you'd like to know?" },
    { keys: ['bye', 'goodbye', 'see you'],
      reply: "Goodbye — and don't forget " + LINK.email + " if you'd like to talk." }
  ];
  var FALLBACK = "I can answer questions about kishore's background, skills, projects, certifications, education, and contact info. Try one of the suggestions below.";

  function answer(q) {
    var text = ' ' + String(q).toLowerCase() + ' ';
    var best = null, bestScore = 0;
    for (var i = 0; i < KB.length; i++) {
      var score = 0, keys = KB[i].keys;
      for (var j = 0; j < keys.length; j++) {
        if (text.indexOf(keys[j]) > -1) score += keys[j].length > 4 ? 2 : 1;
      }
      if (score > bestScore) { bestScore = score; best = KB[i]; }
    }
    return best ? best.reply : FALLBACK;
  }

  /* Expose for testing; harmless in production. */
  window.__krAnswer = answer;

  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function buildChat() {
    var btn = document.createElement('button');
    btn.className = 'kr-chat-btn';
    btn.setAttribute('aria-label', 'Ask about kishore');
    btn.setAttribute('aria-expanded', 'false');
    btn.innerHTML = '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>';

    var panel = document.createElement('div');
    panel.className = 'kr-chat';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-label', 'Ask about kishore');
    panel.setAttribute('aria-hidden', 'true');
    panel.innerHTML =
      '<div class="kr-chat-head"><span class="kr-chat-title"><span class="kr-chat-dot" aria-hidden="true"></span>Ask about kishore</span>' +
      '<button class="kr-chat-close" aria-label="Close chat">×</button></div>' +
      '<div class="kr-chat-body"></div>' +
      '<div class="kr-chat-chips"></div>' +
      '<form class="kr-chat-form"><input class="kr-chat-input" type="text" placeholder="Ask anything…" aria-label="Ask about kishore" autocomplete="off">' +
      '<button class="kr-chat-send" type="submit" aria-label="Send">→</button></form>';

    document.body.appendChild(btn);
    document.body.appendChild(panel);

    var bodyEl = panel.querySelector('.kr-chat-body');
    var chipsEl = panel.querySelector('.kr-chat-chips');
    var form = panel.querySelector('.kr-chat-form');
    var input = panel.querySelector('.kr-chat-input');
    var opened = false, greeted = false;

    var CHIPS = ['What does he do?', 'Show his projects', 'What are his skills?', 'Is he open to remote?'];
    CHIPS.forEach(function (c) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'kr-chip';
      b.textContent = c;
      b.addEventListener('click', function () { send(c); });
      chipsEl.appendChild(b);
    });

    function addMsg(html, who) {
      var d = document.createElement('div');
      d.className = 'kr-msg kr-' + who;
      d.innerHTML = html;
      bodyEl.appendChild(d);
      bodyEl.scrollTop = bodyEl.scrollHeight;
    }
    function bot(html) { addMsg(html, 'bot'); }
    function send(q) {
      q = String(q).trim();
      if (!q) return;
      addMsg(esc(q), 'user');
      input.value = '';
      setTimeout(function () { bot(answer(q)); }, reduceMotion ? 0 : 350);
    }

    function setOpen(v) {
      opened = v;
      panel.classList.toggle('open', v);
      panel.setAttribute('aria-hidden', v ? 'false' : 'true');
      btn.setAttribute('aria-expanded', v ? 'true' : 'false');
      if (v) {
        if (!greeted) {
          greeted = true;
          bot("Hi! I can answer questions about kishore — his background, skills, projects, or how to reach him. What's on your mind?");
        }
        setTimeout(function () { input.focus(); }, 60);
      } else {
        btn.focus();
      }
    }

    btn.addEventListener('click', function () { setOpen(!opened); });
    panel.querySelector('.kr-chat-close').addEventListener('click', function () { setOpen(false); });
    form.addEventListener('submit', function (e) { e.preventDefault(); send(input.value); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && opened) setOpen(false);
    });
  }
  buildChat();

  /* ============ 4. Project case-study modals ============ */
  var CASES = {
    sqlsentinel: {
      title: 'SQLSentinel',
      problem: 'AI-generated SQL reads fluently but fails silently — wrong tables, missing WHERE clauses, and destructive statements that can wipe real data.',
      approach: 'A generate → validate → repair loop. Every query is checked against the live schema by a 13-check validator (unknown tables/columns with did-you-mean, destructive-op guardrails, type mismatches, PII detection), then explained in plain English — no LLM needed for the verify step.',
      result: 'Live web app with 30/30 tests green, plus a GitHub Action that reviews SQL in pull requests and blocks risky statements — self-tested against a bare DELETE FROM orders.',
      links: [['Live site', 'https://k1sh0r3.github.io/SQLSentinel/'], ['GitHub', 'https://github.com/k1sh0r3/SQLSentinel']]
    },
    blastradius: {
      title: 'BlastRadius',
      problem: 'Renaming or changing a column without knowing its downstream impact is how production pipelines break at 2 AM.',
      approach: '100% client-side: drop in a dbt manifest.json or raw .sql files and get an interactive DAG. Click any column to trace its full upstream chain and its downstream blast radius. SQL parsing is vendored locally, so nothing ever leaves the browser.',
      result: 'Live with 24/24 tests green — a "know what breaks before you change it" tool data teams can actually trust with proprietary schemas.',
      links: [['Live site', 'https://k1sh0r3.github.io/BlastRadius/'], ['GitHub', 'https://github.com/k1sh0r3/BlastRadius']]
    },
    techepoch: {
      title: 'TechEpoch',
      problem: 'AI/ML news is scattered across dozens of sources, and sharing a story well takes more effort than reading it.',
      approach: 'An aggregated, share-first tech news feed: one-tap sharing to LinkedIn, X, Facebook, WhatsApp, and Telegram, plus an Instagram Story card generator for every article.',
      result: 'A live daily feed that treats distribution as a first-class feature, not an afterthought.',
      links: [['Live site', 'https://k1sh0r3.github.io/TechEpoch/'], ['GitHub', 'https://github.com/k1sh0r3/TechEpoch']]
    },
    ctrlzapi: {
      title: 'CtrlZAPI',
      problem: 'Third-party APIs change their response schemas silently — and your pipeline finds out in production.',
      approach: 'A public archive snapshotting 33 free production APIs every day at 06:00 UTC, with field-level schema diffing and a public changelog site recording exactly what changed, and when.',
      result: '"Ctrl+Z for the API economy" — a living dataset of API evolution that data engineers can consult before they integrate.',
      links: [['Live site', 'https://k1sh0r3.github.io/CtrlZAPI/'], ['GitHub', 'https://github.com/k1sh0r3/CtrlZAPI']]
    },
    hireradar: {
      title: 'HireRadar',
      problem: 'Job hunting with visa constraints means filtering hundreds of listings by hand for C2C, W-2, sponsorship, and OPT eligibility.',
      approach: 'A daily aggregation pipeline (JSearch + Remotive APIs) with deduping, 30-day pruning, and filters for C2C, W-2, H-1B sponsorship, and F-1/OPT — plus "posted X days ago" and "new" badges.',
      result: 'A live, visa-friendly job board that refreshes itself every morning via GitHub Actions.',
      links: [['Live site', 'https://k1sh0r3.github.io/HireRadar/'], ['GitHub', 'https://github.com/k1sh0r3/HireRadar']]
    },
    seevforge: {
      title: 'SeevForge',
      problem: 'Most resumes die in ATS filters or miss the keywords a job description actually asks for — and applicants never know why.',
      approach: 'An all-client-side resume builder: PDF/DOCX parsing that never drops content, an ATS score with a full breakdown, job-description keyword tailoring, and optional bring-your-own-key AI polish for bullets and summaries.',
      result: 'Live and battle-tested — the parser survived a 17-case hostile corpus and a 3000-input fuzz run without throwing.',
      links: [['Live site', 'https://k1sh0r3.github.io/SeevForge/'], ['GitHub', 'https://github.com/k1sh0r3/SeevForge']]
    }
  };

  (function modals() {
    var triggers = document.querySelectorAll('[data-case]');
    if (!triggers.length) return;

    var overlay = document.createElement('div');
    overlay.className = 'kr-modal-overlay';
    overlay.innerHTML =
      '<div class="kr-modal" role="dialog" aria-modal="true" aria-labelledby="kr-modal-title">' +
      '<button class="kr-modal-close" aria-label="Close case study">×</button>' +
      '<p class="kr-modal-eyebrow">Case study</p>' +
      '<h3 id="kr-modal-title"></h3>' +
      '<div class="kr-modal-sections"></div>' +
      '<div class="kr-modal-links"></div>' +
      '</div>';
    document.body.appendChild(overlay);
    var modal = overlay.querySelector('.kr-modal');
    var lastFocus = null;

    function open(id) {
      var c = CASES[id];
      if (!c) return;
      lastFocus = document.activeElement;
      modal.querySelector('#kr-modal-title').textContent = c.title;
      var secs = modal.querySelector('.kr-modal-sections');
      secs.innerHTML = '';
      [['Problem', c.problem], ['Approach', c.approach], ['Result', c.result]].forEach(function (s) {
        var h = document.createElement('p');
        h.className = 'kr-modal-label';
        h.textContent = s[0];
        var p = document.createElement('p');
        p.className = 'kr-modal-text';
        p.textContent = s[1];
        secs.appendChild(h);
        secs.appendChild(p);
      });
      var links = modal.querySelector('.kr-modal-links');
      links.innerHTML = '';
      c.links.forEach(function (l) {
        var a = document.createElement('a');
        a.href = l[1];
        a.target = '_blank';
        a.rel = 'noopener';
        a.textContent = l[0] + ' →';
        links.appendChild(a);
      });
      overlay.classList.add('open');
      document.body.style.overflow = 'hidden';
      modal.querySelector('.kr-modal-close').focus();
    }
    function close() {
      overlay.classList.remove('open');
      document.body.style.overflow = '';
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    }

    triggers.forEach(function (t) {
      t.addEventListener('click', function (e) {
        e.preventDefault();
        open(t.getAttribute('data-case'));
      });
    });
    overlay.querySelector('.kr-modal-close').addEventListener('click', close);
    overlay.addEventListener('click', function (e) { if (e.target === overlay) close(); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && overlay.classList.contains('open')) close();
    });
  })();

  /* ============ 5. AJAX contact form ============ */
  (function contactForm() {
    var form = document.getElementById('contactForm');
    if (!form) return;
    var status = form.querySelector('.form-status');
    var btn = form.querySelector('button[type="submit"]');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = form.querySelector('[name="name"]').value.trim();
      var email = form.querySelector('[name="email"]').value.trim();
      var message = form.querySelector('[name="message"]').value.trim();
      if (!name || !email || !message) {
        status.textContent = 'Please fill in every field.';
        status.className = 'form-status error show';
        return;
      }
      btn.disabled = true;
      btn.textContent = 'Sending…';
      status.className = 'form-status';
      status.textContent = '';
      fetch('https://formsubmit.co/ajax/' + EMAIL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ name: name, email: email, message: message, _subject: 'New message from kishore.run' })
      }).then(function (r) {
        if (!r.ok) throw new Error('bad response');
        return r.json();
      }).then(function () {
        status.textContent = 'Message sent — kishore will get back to you soon.';
        status.className = 'form-status success show';
        form.reset();
      }).catch(function () {
        status.textContent = 'Something went wrong. Email kishore directly at ' + EMAIL + '.';
        status.className = 'form-status error show';
      }).finally(function () {
        btn.disabled = false;
        btn.textContent = 'Send message';
      });
    });
  })();
})();
