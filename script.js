
(() => {
  // Menu toggle for mobile
  const toggle = document.querySelector('.menu-toggle');
  const menu = document.querySelector('.menu');
  if(toggle && menu){
    toggle.addEventListener('click', ()=> menu.classList.toggle('open'));
    document.addEventListener('click', (e)=> {
      if(!menu.contains(e.target) && e.target !== toggle) menu.classList.remove('open');
    });
  }

  // set active nav link by filename
  const setActiveNav = () => {
    const path = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
    document.querySelectorAll('.menu a').forEach(a => {
      const href = a.getAttribute('href').toLowerCase();
      if(href === path || (path === '' && href === 'index.html')) a.classList.add('active');
      else a.classList.remove('active');
    });
  };
  setActiveNav();

  // copy email
  const copyBtn = document.getElementById('copy-email');
  if(copyBtn){
    copyBtn.addEventListener('click', async ()=>{
      try{
        await navigator.clipboard.writeText(copyBtn.getAttribute('data-email'));
        const orig = copyBtn.textContent;
        copyBtn.textContent = 'Copied!';
        setTimeout(()=> copyBtn.textContent = orig, 1400);
      }catch(e){ console.error(e); }
    });
  }

  // Smooth scroll for hash links with history management so back/forward works
  function scrollToHash(hash, push = true){
    if(!hash) return;
    const el = document.querySelector(hash);
    if(!el) return;
    const offset = 56; // header height
    const top = el.getBoundingClientRect().top + window.pageYOffset - offset;
    window.scrollTo({ top, behavior: 'smooth' });
    if(push){
      try { history.pushState({hash}, '', hash); } catch(e){ /* ignore */ }
    }
  }

  // Intercept same-page anchor clicks to push history
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a');
    if(!a) return;
    const href = a.getAttribute('href');
    if(!href) return;
    if(href.startsWith('#')){
      // same-page anchor
      e.preventDefault();
      scrollToHash(href, true);
    }
  });

  // Handle popstate (back/forward)
  window.addEventListener('popstate', (e) => {
    const hash = location.hash;
    if(hash){
      // scroll to hash without pushing state
      scrollToHash(hash, false);
    } else {
      // no hash: scroll to top
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    setActiveNav();
  });

  // on load: if hash present, scroll to it after small delay
  window.addEventListener('load', ()=>{
    if(location.hash){
      setTimeout(()=> scrollToHash(location.hash, false), 120);
    }
  });

  // Decryption scramble function
  function scrambleReveal(el, text, options = {}){
    const chars = options.chars || "!<>-_\\/[]{}—=+*^?#________";
    const duration = options.duration || 800;
    const steps = options.steps || Math.max(10, Math.floor(duration/30));
    let current = Array.from(text).map(ch => ({ch, shown:false}));
    let frame = 0;
    const interval = Math.max(10, Math.floor(duration/steps));
    const tid = setInterval(()=>{
      frame++;
      let display = "";
      for(let i=0;i<current.length;i++){
        if(current[i].shown) display += current[i].ch;
        else{
          const revealProb = frame/steps;
          if(Math.random() < revealProb){
            current[i].shown = true;
            display += current[i].ch;
          } else {
            display += chars[Math.floor(Math.random()*chars.length)];
          }
        }
      }
      el.textContent = display;
      if(frame>=steps || current.every(c=>c.shown)){
        clearInterval(tid);
        el.textContent = text;
        if(options.onComplete) options.onComplete();
      }
    }, interval);
  }

  // typing effect used after scramble for name
  function typeText(el, text, delay=60){
    el.textContent = '';
    el.classList.add('typing');
    let i=0;
    const t = setInterval(()=>{
      if(i<text.length) el.textContent += text.charAt(i++);
      else clearInterval(t);
    }, delay);
  }

  // Initialize decrypt elements
  const decryptEls = document.querySelectorAll('[data-decrypt]');
  decryptEls.forEach(el => {
    const text = el.getAttribute('data-decrypt');
    const animateOn = el.getAttribute('data-animate') || 'immediate'; // 'hover' | 'view' | 'immediate'
    const duration = parseInt(el.getAttribute('data-duration') || '800', 10);
    const steps = parseInt(el.getAttribute('data-steps') || Math.max(10, Math.floor(duration/30)), 10);
    const chars = el.getAttribute('data-chars') || "!<>-_\\/[]{}—=+*^?#________";

    const run = (onComplete) => scrambleReveal(el, text, { duration, steps, chars, onComplete });

    if(animateOn === 'hover'){
      el.addEventListener('mouseenter', ()=> run());
      el.addEventListener('mouseleave', ()=> { el.textContent = text; });
    } else if(animateOn === 'view'){
      const obs = new IntersectionObserver((entries, o)=>{
        entries.forEach(entry => {
          if(entry.isIntersecting){
            run();
            o.unobserve(entry.target);
          }
        });
      }, { threshold: 0.12 });
      obs.observe(el);
    } else { // immediate
      run();
    }
  });

  // Special handling for name decrypt + typing
  const nameEl = document.getElementById('name-decrypt');
  if(nameEl){
    const final = nameEl.getAttribute('data-decrypt');
    scrambleReveal(nameEl, final, { duration: 900, steps: 30, chars: "!<>-_\\/[]{}—=+*^?#________", onComplete: ()=>{
      setTimeout(()=> typeText(nameEl, final, 80), 180);
    }});
  }

})();