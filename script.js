
(function(){
  // Mobile menu toggle
  const toggle = document.querySelector('.menu-toggle');
  const menu = document.querySelector('.menu');
  if(toggle && menu){
    toggle.addEventListener('click', ()=> menu.classList.toggle('open'));
    document.addEventListener('click', (e)=>{
      if(!menu.contains(e.target) && e.target !== toggle){ menu.classList.remove('open'); }
    });
  }

  // Highlight current page link
  const path = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
  document.querySelectorAll('.menu a').forEach(a => {
    const href = a.getAttribute('href').toLowerCase();
    if (href === path || (path === '' && href === 'index.html')){
      a.classList.add('active');
    }
  });

  // Copy email button
  const copyBtn = document.getElementById('copy-email');
  if(copyBtn){
    copyBtn.addEventListener('click', async ()=>{
      try{
        const email = copyBtn.getAttribute('data-email');
        await navigator.clipboard.writeText(email);
        copyBtn.textContent = 'Copied!';
        setTimeout(()=> copyBtn.textContent='Copy Email',1400);
      }catch(e){ console.log(e); }
    });
  }

  // Light/dark toggle
  const themeToggle = document.getElementById('theme-toggle');
  const currentTheme = localStorage.getItem('theme') || 'dark';
  document.body.classList.add(currentTheme);
  if(themeToggle){
    themeToggle.addEventListener('click', ()=>{
      if(document.body.classList.contains('dark')){
        document.body.classList.replace('dark','light');
        localStorage.setItem('theme','light');
      } else {
        document.body.classList.replace('light','dark');
        localStorage.setItem('theme','dark');
      }
    });
  }

  // Terminal typing effect for hero h1 (Home page)
  const hero = document.querySelector('.hero h1');
  if(hero){
    const fullText = hero.textContent;
    hero.textContent='';
    let i=0;
    const type = ()=>{
      if(i<fullText.length){ hero.textContent+=fullText.charAt(i); i++; setTimeout(type,80); }
    };
    type();
  }

  // Adjust smooth scroll for sticky header offset
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e){
      const target = document.querySelector(this.getAttribute('href'));
      if(target){ e.preventDefault(); window.scrollTo({ top: target.offsetTop - 60, behavior: 'smooth' }); }
    });
  });
})();
