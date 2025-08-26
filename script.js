
(function(){
  // Mobile menu toggle
  const toggle = document.querySelector('.menu-toggle');
  const menu = document.querySelector('.menu');
  if(toggle && menu){
    toggle.addEventListener('click', ()=> menu.classList.toggle('open'));
    document.addEventListener('click', (e)=>{ if(!menu.contains(e.target) && e.target !== toggle) menu.classList.remove('open'); });
  }

  // Active nav link highlight (by filename)
  const path = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
  document.querySelectorAll('.menu a').forEach(a => {
    const href = a.getAttribute('href').toLowerCase();
    if(href === path || (path==='' && href==='index.html')) a.classList.add('active');
  });

  // Copy email button handler
  const copyBtn = document.getElementById('copy-email');
  if(copyBtn){
    copyBtn.addEventListener('click', async ()=>{
      try{
        await navigator.clipboard.writeText(copyBtn.getAttribute('data-email'));
        const orig = copyBtn.textContent;
        copyBtn.textContent = 'Copied!';
        setTimeout(()=> copyBtn.textContent = orig, 1400);
      }catch(e){ console.log(e); }
    });
  }

  // Smooth scroll with header offset for internal anchors
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', function(e){
      const target = document.querySelector(this.getAttribute('href'));
      if(target){ e.preventDefault(); window.scrollTo({ top: target.offsetTop - 56, behavior: 'smooth' }); }
    });
  });

  // Decryption / scramble reveal effect
  function scrambleReveal(el, text, options={}){
    const chars = options.chars || "!<>-_\\/[]{}—=+*^?#________";
    const duration = options.duration || 800; // total ms
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
          // 20% chance to reveal per frame depending on progress
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
        el.textContent = text; // ensure final text
        if(options.onComplete) options.onComplete();
      }
    }, interval);
  }

  // Typing effect function
  function typeText(el, text, delay=60){
    el.textContent = '';
    el.classList.add('typing');
    let i=0;
    const t = setInterval(()=>{
      if(i<text.length) el.textContent += text.charAt(i++);
      else { clearInterval(t); /* keep cursor via CSS */ }
    }, delay);
  }

  // Apply decryption on elements with data-decrypt attribute
  document.querySelectorAll('[data-decrypt]').forEach(el=>{
    const txt = el.getAttribute('data-decrypt');
    scrambleReveal(el, txt, {duration:900, steps:30});
  });

  // Special handling for name: scramble then typing+cursor
  const nameEl = document.getElementById('name-decrypt');
  if(nameEl){
    const finalName = nameEl.getAttribute('data-decrypt');
    scrambleReveal(nameEl, finalName, {duration:900, steps:30, onComplete: ()=>{
      // After scramble completes, clear and do typing
      setTimeout(()=>{
        nameEl.textContent = '';
        typeText(nameEl, finalName, 80);
      }, 240);
    }});
  }
})();