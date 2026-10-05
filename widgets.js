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

  /* ============ 3. Ask Alfred — chat (+ recruiter FAQ) ============ */
  var BOT_NAME = 'Alfred';
  var CHAT_SEEN_KEY = 'krSeen';

  var LINK = {
    email: '<a href="mailto:' + EMAIL + '">' + EMAIL + '</a>',
    github: '<a href="https://github.com/k1sh0r3" target="_blank" rel="noopener">GitHub</a>',
    linkedin: '<a href="https://www.linkedin.com/in/kishore0451/" target="_blank" rel="noopener">LinkedIn</a>',
    resume: '<a href="Siva_Kishore_Reddy_Allu_Resume.pdf" download>download his resume (PDF)</a>',
    projects: '<a href="projects.html">Projects page</a>'
  };
  var RESUME_PDF = 'Siva_Kishore_Reddy_Allu_Resume.pdf';

  var DEFAULT_FOLLOWUPS = ['What does he do?', 'Show his projects', 'What are his skills?', 'Is he open to remote?'];

  var KB = [
    { id: 'greeting', keys: ['hello', 'hey', 'yo', 'morning', 'afternoon', 'evening'],
      reply: "Hey! Ask me about kishore's background, skills, projects, certifications — or how to reach him." },
    { id: 'who-alfred', keys: ['who is alfred', 'who are you', 'who built you', 'who made you', 'your name', 'about alfred'],
      reply: "I'm <b>Alfred</b> — kishore's resident expert on everything kishore. I run entirely in your browser, so ask away." },
    { id: 'who', keys: ['who is kishore', 'about kishore', 'about him', 'yourself', 'introduce'],
      reply: "<b>Siva Kishore Reddy Allu</b> is a Data Engineer in Cincinnati, Ohio — previously a Project Engineer at Wipro (2020–2023), now building AI-powered data tools. " + LINK.projects + ".",
      followups: ['What are his skills?', 'Show his projects', 'How do I contact him?'] },
    { id: 'role', keys: ['what does he do', 'what do you do', 'role', 'job title', 'position', 'occupation', 'work as'],
      reply: "He's a <b>Data Engineer</b> — ETL pipelines, AWS, PySpark, and lately AI/ML-powered tooling. Nearly 3 years turning raw data into decisions.",
      followups: ['What are his skills?', 'Tell me about his experience'] },
    { id: 'skills', keys: ['skill', 'stack', 'technolog', 'tools', 'python', 'pyspark', 'aws', 'what can he', 'good at', 'expertise', 'know'],
      reply: "Core stack: <b>Python, SQL, PySpark, AWS Glue, S3, EC2, Docker, Tableau</b> — plus data modeling, ETL design, TypeScript, CI/CD, REST APIs, and Pandas.",
      followups: ['Show his projects', 'Does he have AWS certification?'] },
    { id: 'experience', keys: ['experience', 'wipro', 'worked', 'background', 'career', 'years', 'history'],
      reply: "Project Engineer at <b>Wipro Ltd</b> (Jan 2020–Feb 2023): built a Python XML-processing framework, AWS Glue + PySpark ETL pipelines with delta loads, and Tableau dashboards — about a 30% query-performance gain.",
      followups: ['What are his skills?', 'Where did he study?'] },
    { id: 'projects', keys: ['project', 'built', 'portfolio', 'side project', 'apps'],
      reply: "Eight recent builds, all live: <b>PrepAgent</b> (interview-prep agent), <b>JailbreakGym</b> (adversarial testing for prompts), <b>SQLSentinel</b> (reviewer for AI-written SQL), <b>BlastRadius</b> (column-level data lineage), <b>PreSQL</b> (SQL-safety MCP server), <b>HireRadar</b> (visa-friendly job board), <b>SeevForge</b> (AI resume builder), <b>CtrlZAPI</b> (daily API-schema archive). See the " + LINK.projects + " for case studies.",
      followups: ['Tell me about PrepAgent', 'Tell me about JailbreakGym', 'Which one uses AI?'],
      actions: [{ label: 'View all projects', href: 'projects.html' }] },
    { id: 'ai-projects', keys: ['which one uses ai', 'which uses ai', 'ai project', 'ai projects', 'uses ai', 'machine learning project'],
      reply: "Several! <b>PrepAgent</b> runs AI mock interviews, <b>SQLSentinel</b> and <b>PreSQL</b> guard AI-written SQL, <b>SeevForge</b> uses LLMs to polish resumes, and <b>JailbreakGym</b> stress-tests the system prompts behind AI apps.",
      followups: ['Tell me about PrepAgent', 'Tell me about JailbreakGym'] },
    { id: 'prepagents', keys: ['prepagents', 'prepagent', 'prep agent', 'interview prep', 'mock interview', 'interview practice'],
      reply: "<b>PrepAgent</b> — interview prep that fights back. A browser-based agent that researches the company, generates resume-grounded questions across behavioral, ML fundamentals, system design, and evals, then runs mock interviews with an explainable heuristic judge, pressure timer, and weak-area tracking across sessions. 80/80 tests green, works with zero API keys.",
      actions: [{ label: 'Live site', href: 'https://k1sh0r3.github.io/PrepAgent/' }, { label: 'GitHub', href: 'https://github.com/k1sh0r3/PrepAgent' }],
      followups: ['Tell me more', 'Show his projects', 'How do I contact him?'],
      more: "The loop: resume + JD + company go in, Wikipedia research comes out, then a 52-question bank drives the mock interview — STAR detection, filler-word counting, and terminology overlap score every answer 1-10 with per-dimension feedback. Bring your own key and an LLM judge scores you side-by-side with the heuristic one." },
    { id: 'jailbreakgym', keys: ['jailbreak', 'jailbreakgym', 'jailbreak gym', 'prompt injection', 'red team', 'redteam', 'adversarial'],
      reply: "<b>JailbreakGym</b> — sparring for system prompts. Paste a system prompt and stress-test it against 500+ prompt-injection and jailbreak attacks, with per-category robustness scores, full transcripts, and auto-hardening suggestions. Free, runs entirely in your browser.",
      actions: [{ label: 'Live site', href: 'https://k1sh0r3.github.io/JailbreakGym/' }, { label: 'GitHub', href: 'https://github.com/k1sh0r3/JailbreakGym' }],
      followups: ['Tell me more', 'Show his projects', 'How do I contact him?'],
      more: "The attack library spans direct injection, roleplay, encoding tricks, extraction attempts, multi-turn setups, and indirect injection — a mutation engine grows ~30 hand-curated base attacks into hundreds of test cases. Harden your prompt, re-run the suite, and watch the score improve." },
    { id: 'sqlsentinel', keys: ['sqlsentinel', 'sentinel'],
      reply: "<b>SQLSentinel</b> — \"the code reviewer for AI-written SQL.\" A generate → validate → repair loop checks queries against your schema and blocks destructive statements. Also ships as a GitHub Action that reviews SQL in pull requests.",
      actions: [{ label: 'Live site', href: 'https://k1sh0r3.github.io/SQLSentinel/' }, { label: 'GitHub', href: 'https://github.com/k1sh0r3/SQLSentinel' }],
      followups: ['Tell me more', 'Show his projects'],
      more: "Under the hood: a 13-check validator — unknown tables and columns with did-you-mean suggestions, destructive-operation guardrails, type mismatches, PII detection — plus plain-English explanations generated from templates, no LLM needed. The GitHub Action posts a sticky PR comment with a verdict badge and fails the check on risky SQL." },
    { id: 'blastradius', keys: ['blastradius', 'blast radius', 'lineage'],
      reply: "<b>BlastRadius</b> — \"know what breaks before you change it.\" In-browser, column-level data lineage: drop in a dbt manifest or raw SQL, click any column for its upstream chain and downstream blast radius.",
      actions: [{ label: 'Live site', href: 'https://k1sh0r3.github.io/BlastRadius/' }, { label: 'GitHub', href: 'https://github.com/k1sh0r3/BlastRadius' }],
      followups: ['Tell me more', 'Show his projects'],
      more: "It's fully client-side — the SQL parser is vendored locally, so proprietary schemas never leave the browser. Panels scroll independently and the legend stays pinned while you explore the graph." },
    { id: 'presql', keys: ['presql', 'pre-sql', 'mcp'],
      reply: "<b>PreSQL</b> — a SQL-safety layer for AI agents: a TypeScript MCP server with three tools (validate_sql, explain_sql, guard_query) that blocks destructive queries before they run. 41/41 tests green.",
      actions: [{ label: 'GitHub', href: 'https://github.com/k1sh0r3/preSQL' }],
      followups: ['Tell me more', 'Show his projects'],
      more: "It wraps the SQL Sentinel validator and exposes the three tools over a real stdio MCP handshake. No database connection or network access required — it works purely from your schema." },
    { id: 'hireradar', keys: ['hireradar', 'hire radar', 'job board'],
      reply: "<b>HireRadar</b> — a visa-friendly job board aggregating JSearch and Remotive listings, with filters for C2C, W-2, H-1B sponsorship, and F-1/OPT. Refreshed daily by an automated pipeline.",
      actions: [{ label: 'Live site', href: 'https://k1sh0r3.github.io/HireRadar/' }, { label: 'GitHub', href: 'https://github.com/k1sh0r3/HireRadar' }],
      followups: ['Tell me more', 'Show his projects'],
      more: "Listings refresh daily via GitHub Actions and accumulate instead of resetting — each card shows 'posted X days ago' with a 'New' badge for fresh arrivals, and stale listings are pruned after 30 days." },
    { id: 'seevforge', keys: ['seevforge', 'seev forge', 'resume builder'],
      reply: "<b>SeevForge</b> — an AI-assisted resume builder: in-browser PDF/DOCX parsing, ATS scoring with a full breakdown, and job-description tailoring. The parser survived a 17-case hostile corpus and a 3000-input fuzz run.",
      actions: [{ label: 'Live site', href: 'https://k1sh0r3.github.io/SeevForge/' }, { label: 'GitHub', href: 'https://github.com/k1sh0r3/SeevForge' }],
      followups: ['Tell me more', 'Show his projects'],
      more: "Everything runs locally in your browser — pdf.js and mammoth parse the resume on-device, nothing is uploaded. It even preserves sections it doesn't recognize as editable blocks instead of dropping them." },
    { id: 'ctrlzapi', keys: ['ctrlzapi', 'ctrlz', 'api archive'],
      reply: "<b>CtrlZAPI</b> — \"Ctrl+Z for the API economy.\" A public archive snapshotting 33 free production APIs every day and recording exactly what changed in their response schemas.",
      actions: [{ label: 'Live site', href: 'https://k1sh0r3.github.io/CtrlZAPI/' }, { label: 'GitHub', href: 'https://github.com/k1sh0r3/CtrlZAPI' }],
      followups: ['Tell me more', 'Show his projects'],
      more: "It watches 33 keyless production APIs across 12 categories, snapshotting every morning at 06:00 UTC with field-level schema diffs published to a public changelog." },
    { id: 'techepoch', keys: ['techepoch', 'tech epoch', 'news'],
      reply: "<b>TechEpoch</b> — a shareable AI/ML/robotics-first tech news feed with one-tap sharing and a story-card generator.",
      actions: [{ label: 'Live site', href: 'https://k1sh0r3.github.io/TechEpoch/' }, { label: 'GitHub', href: 'https://github.com/k1sh0r3/TechEpoch' }],
      followups: ['Show his projects'] },
    { id: 'education', keys: ['education', 'degree', 'university', 'college', 'gpa', 'study', 'studied', 'school', 'master'],
      reply: "MS in <b>Information Technology</b>, University of Cincinnati (2023–2024, GPA 3.7/4.0), and a BSc in Computer Science &amp; Engineering, RGUKT (2015–2019).",
      followups: ['Does he have AWS certification?', 'What are his skills?'] },
    { id: 'certifications', keys: ['certif', 'aws certified', 'certificate'],
      reply: "Five pro certs: <b>AWS Solutions Architect – Associate</b>, <b>Google Cloud Professional Data Engineer</b>, <b>Azure Data Fundamentals</b>, <b>Databricks Data Engineer Associate</b>, and <b>Snowflake SnowPro Core</b>.",
      followups: ['Show his projects', 'What does he do?'] },
    { id: 'publication', keys: ['publish', 'publication', 'published', 'paper', 'research', 'ijrte'],
      reply: "He published an image-to-text deep-learning paper with the <b>IJRTE</b> journal. It's linked on his About page." },
    { id: 'contact', keys: ['contact', 'email', 'reach', 'phone', 'call', 'linkedin', 'github', 'social'],
      reply: "Email him at " + LINK.email + " — or find him on " + LINK.github + " and " + LINK.linkedin + ".",
      actions: [{ label: 'Copy email', copy: EMAIL }, { label: 'Download resume', href: RESUME_PDF, download: true }],
      followups: ['Is he open to remote?', 'Download his resume'] },
    { id: 'hire', keys: ['hire', 'recruit', 'job opening', 'opportunity', 'interview'],
      reply: "Great instinct — " + LINK.email + " is the fastest way to reach him.",
      followups: ['How do I contact him?', 'Is he open to remote?'] },
    { id: 'remote', keys: ['remote', 'work from home', 'wfh', 'hybrid', 'onsite', 'on-site', 'workplace'],
      reply: "He's open to <b>remote, hybrid, or onsite</b> — all fine.",
      followups: ['Is he willing to relocate?', 'How do I contact him?'] },
    { id: 'relocation', keys: ['relocat', 'move', 'moving'],
      reply: "Yes — he's <b>willing to relocate</b>. Currently based in Cincinnati, Ohio.",
      followups: ['Is he open to remote?', 'How do I contact him?'] },
    { id: 'notice', keys: ['notice', 'join', 'joining', 'start date', 'when can he start', 'availability', 'available', 'notice period', 'immediately'],
      reply: "<b>No notice period — he can join immediately.</b> His site header says it best: <b>$ open to work</b>.",
      followups: ['Is he open to remote?', 'How do I contact him?'] },
    { id: 'visa', keys: ['visa', 'sponsor', 'authorized', 'authorization', 'work permit', 'h-1b', 'h1b', 'opt', 'stem', 'ead'],
      reply: "He's on <b>F-1 STEM OPT</b> — eligible to work on W-2 with no sponsorship needed until <b>February 2028</b>, and will require H-1B sponsorship after that.",
      followups: ['Is he open to remote?', 'How do I contact him?'] },
    { id: 'salary', keys: ['salary', 'pay', 'compensation', 'ctc', 'package', 'expectation'],
      reply: "Salary is <b>negotiable, according to market standards</b>.",
      followups: ['Is he open to remote?', 'How do I contact him?'] },
    { id: 'location', keys: ['where', 'location', 'based', 'live', 'cincinnati', 'city'],
      reply: "He's based in <b>Cincinnati, Ohio</b>." },
    { id: 'resume', keys: ['resume', 'cv'],
      reply: "You can " + LINK.resume + " right from this site.",
      actions: [{ label: 'Download resume', href: RESUME_PDF, download: true }] },
    { id: 'thanks', keys: ['thank', 'great', 'awesome', 'cool', 'nice', 'perfect'],
      reply: "Anytime! Anything else you'd like to know?" },
    { id: 'bye', keys: ['bye', 'goodbye', 'see you'],
      reply: "Goodbye — and don't forget " + LINK.email + " if you'd like to talk." }
  ];
  var FALLBACK = "I can answer questions about kishore's background, skills, projects, certifications, education, and contact info. Try one of the suggestions below.";

  /* Levenshtein distance for typo tolerance */
  function lev(a, b) {
    if (a === b) return 0;
    var m = a.length, n = b.length;
    if (!m) return n;
    if (!n) return m;
    var d = [], i, j;
    for (i = 0; i <= m; i++) d[i] = [i];
    for (j = 0; j <= n; j++) d[0][j] = j;
    for (i = 1; i <= m; i++) {
      for (j = 1; j <= n; j++) {
        d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1,
          d[i - 1][j - 1] + (a.charAt(i - 1) === b.charAt(j - 1) ? 0 : 1));
      }
    }
    return d[m][n];
  }

  var lastId = null;

  function resolve(q) {
    var t = String(q).toLowerCase().trim();
    /* Conversation memory: "tell me more" refers to the last topic. */
    if (/^(tell me )?more$|elaborate|^go on$|^and\?$|^what else/i.test(t) && lastId) {
      for (var k = 0; k < KB.length; k++) {
        if (KB[k].id === lastId && KB[k].more) return { html: KB[k].more, item: KB[k] };
      }
    }
    var text = ' ' + t + ' ';
    var words = t.split(/[^a-z0-9+]+/).filter(function (w) { return w.length >= 4; });
    var best = null, bestScore = 0;
    KB.forEach(function (item) {
      var score = 0;
      item.keys.forEach(function (key) {
        if (text.indexOf(key) > -1) {
          score += key.length > 4 ? 2 : 1;
        } else if (key.length > 4 && key.indexOf(' ') === -1) {
          /* Fuzzy single-word keywords tolerate small typos (same first letter). */
          for (var w = 0; w < words.length; w++) {
            var wd = words[w];
            if (wd.charAt(0) === key.charAt(0) && Math.abs(wd.length - key.length) <= 2 && lev(wd, key) <= 2) { score += 1; break; }
          }
        }
      });
      if (score > bestScore) { bestScore = score; best = item; }
    });
    if (best) { lastId = best.id; return { html: best.reply, item: best }; }
    return { html: FALLBACK, item: null };
  }

  function answer(q) { return resolve(q).html; }

  /* Expose for testing; harmless in production. */
  window.__krAnswer = answer;
  window.__krResolve = resolve;

  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function defaultChips() {
    var p = (location.pathname || '').toLowerCase();
    if (p.indexOf('projects') > -1) return ['Tell me about JailbreakGym', 'Which one uses AI?', 'Show his skills'];
    if (p.indexOf('contact') > -1) return ['How do I contact him?', 'Is he open to remote?', 'Download his resume'];
    return DEFAULT_FOLLOWUPS.slice();
  }

  function buildChat() {
    var btn = document.createElement('button');
    btn.className = 'kr-chat-btn';
    btn.setAttribute('aria-label', 'Ask ' + BOT_NAME);
    btn.setAttribute('aria-expanded', 'false');
    btn.innerHTML = '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>';

    var teaser = document.createElement('div');
    teaser.className = 'kr-teaser';
    teaser.setAttribute('role', 'status');
    teaser.innerHTML = '<button type="button" class="kr-teaser-main">Questions about kishore? <b>Ask ' + BOT_NAME + ' →</b></button>' +
      '<button type="button" class="kr-teaser-x" aria-label="Dismiss">×</button>';

    var panel = document.createElement('div');
    panel.className = 'kr-chat';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-label', 'Ask ' + BOT_NAME);
    panel.setAttribute('aria-hidden', 'true');
    panel.innerHTML =
      '<div class="kr-chat-head"><span class="kr-chat-title"><span class="kr-chat-dot" aria-hidden="true"></span>Ask ' + BOT_NAME + '</span>' +
      '<button class="kr-chat-close" aria-label="Close chat">×</button></div>' +
      '<div class="kr-chat-body"></div>' +
      '<div class="kr-chat-chips"></div>' +
      '<form class="kr-chat-form"><input class="kr-chat-input" type="text" placeholder="Ask anything…" aria-label="Ask ' + BOT_NAME + '" autocomplete="off">' +
      '<button class="kr-chat-send" type="submit" aria-label="Send">→</button></form>';

    document.body.appendChild(btn);
    document.body.appendChild(teaser);
    document.body.appendChild(panel);

    var bodyEl = panel.querySelector('.kr-chat-body');
    var chipsEl = panel.querySelector('.kr-chat-chips');
    var form = panel.querySelector('.kr-chat-form');
    var input = panel.querySelector('.kr-chat-input');
    var opened = false, greeted = false;

    function seen() {
      try { sessionStorage.setItem(CHAT_SEEN_KEY, '1'); } catch (e) { /* noop */ }
      teaser.classList.remove('show');
    }

    function renderChips(list) {
      chipsEl.innerHTML = '';
      list.forEach(function (c) {
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'kr-chip';
        b.textContent = c;
        b.addEventListener('click', function () { send(c); });
        chipsEl.appendChild(b);
      });
    }

    function addMsg(html, who) {
      var d = document.createElement('div');
      d.className = 'kr-msg kr-' + who;
      d.innerHTML = html;
      bodyEl.appendChild(d);
      bodyEl.scrollTop = bodyEl.scrollHeight;
      return d;
    }

    function bot(html, item) {
      var d = addMsg(html, 'bot');
      if (item && item.actions && item.actions.length) {
        var wrap = document.createElement('div');
        wrap.className = 'kr-actions';
        item.actions.forEach(function (ac) {
          var el;
          if (ac.copy) {
            el = document.createElement('button');
            el.type = 'button';
            el.textContent = ac.label;
            el.addEventListener('click', function () {
              copyText(ac.copy, function () {
                toast('Email copied to clipboard', 'Open mail app', 'mailto:' + ac.copy);
              });
            });
          } else {
            el = document.createElement('a');
            el.href = ac.href;
            el.textContent = ac.label;
            if (ac.download) {
              el.setAttribute('download', '');
            } else {
              el.target = '_blank';
              el.rel = 'noopener';
            }
          }
          el.className = 'kr-action';
          wrap.appendChild(el);
        });
        d.appendChild(wrap);
      }
    }

    function send(q) {
      q = String(q).trim();
      if (!q) return;
      addMsg(esc(q), 'user');
      input.value = '';
      var res = resolve(q);
      var typing = document.createElement('div');
      typing.className = 'kr-msg kr-bot kr-typing';
      typing.setAttribute('aria-label', BOT_NAME + ' is typing');
      typing.innerHTML = '<i></i><i></i><i></i>';
      bodyEl.appendChild(typing);
      bodyEl.scrollTop = bodyEl.scrollHeight;
      setTimeout(function () {
        if (typing.parentNode) typing.parentNode.removeChild(typing);
        bot(res.html, res.item);
        renderChips(res.item && res.item.followups ? res.item.followups : defaultChips());
      }, reduceMotion ? 60 : 750);
    }

    function setOpen(v) {
      opened = v;
      panel.classList.toggle('open', v);
      panel.setAttribute('aria-hidden', v ? 'false' : 'true');
      btn.setAttribute('aria-expanded', v ? 'true' : 'false');
      if (v) {
        seen();
        if (!greeted) {
          greeted = true;
          var h = new Date().getHours();
          var tod = h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
          bot(tod + "! I'm <b>" + BOT_NAME + "</b> — I know everything about kishore's background, skills, projects, and how to reach him. What's on your mind?");
          renderChips(defaultChips());
        }
        setTimeout(function () { input.focus(); }, 60);
      } else {
        btn.focus();
      }
    }

    btn.addEventListener('click', function () { setOpen(!opened); });
    teaser.querySelector('.kr-teaser-main').addEventListener('click', function () { setOpen(true); });
    teaser.querySelector('.kr-teaser-x').addEventListener('click', function (e) {
      e.stopPropagation();
      seen();
    });
    panel.querySelector('.kr-chat-close').addEventListener('click', function () { setOpen(false); });
    form.addEventListener('submit', function (e) { e.preventDefault(); send(input.value); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && opened) setOpen(false);
    });

    /* One gentle nudge per session, only if the chat was never opened. */
    var alreadySeen = false;
    try { alreadySeen = !!sessionStorage.getItem(CHAT_SEEN_KEY); } catch (e) { /* noop */ }
    if (!alreadySeen) {
      setTimeout(function () {
        if (opened) return;
        try { if (sessionStorage.getItem(CHAT_SEEN_KEY)) return; } catch (e) { /* noop */ }
        teaser.classList.add('show');
        setTimeout(function () { teaser.classList.remove('show'); }, 20000);
      }, 25000);
    }
  }
  buildChat();

  /* ============ 4. Project case-study modals ============ */
  var CASES = {
    prepagents: {
      title: 'PrepAgent',
      problem: 'Generic interview prep asks generic questions — nothing about your resume, your projects, or the company you are actually interviewing with, and feedback is a black-box score.',
      approach: 'A browser-based interview-prep agent: resume + JD + company go in, Wikipedia research comes out, then a 52-question bank (behavioral, ML fundamentals, system design, evals) drives mock interviews. An explainable heuristic judge scores every answer 1-10 on STAR structure, length, terminology, and filler words — with follow-ups when you stumble and weak-area tracking across sessions. BYOK unlocks resume-specific questions and a side-by-side LLM judge.',
      result: 'Live with 80/80 tests green and a one-click sample session — full mock interviews with zero API keys, private by design since everything runs in the browser.',
      links: [['Live site', 'https://k1sh0r3.github.io/PrepAgent/'], ['GitHub', 'https://github.com/k1sh0r3/PrepAgent']]
    },
    jailbreakgym: {
      title: 'JailbreakGym',
      problem: 'System prompts are the new attack surface — prompt injection and jailbreaks can make an LLM ignore its instructions, leak data, or misbehave, and most prompt authors never test for it.',
      approach: 'A zero-setup, in-browser test bench: paste a system prompt, run 500+ curated attacks across categories (direct injection, roleplay, encoding tricks, extraction, multi-turn, indirect injection), and get per-category plus overall robustness scores with full transcripts and concrete hardening suggestions — then re-run to watch the score improve.',
      result: 'Live and free — paste, click, score, harden. A mutation engine grows ~30 hand-curated base attacks into hundreds of test cases, all running in the browser.',
      links: [['Live site', 'https://k1sh0r3.github.io/JailbreakGym/'], ['GitHub', 'https://github.com/k1sh0r3/JailbreakGym']]
    },
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
