
(function(){
  const toggle = document.querySelector('.menu-toggle');
  const menu = document.querySelector('.menu');
  if(toggle && menu){
    toggle.addEventListener('click', ()=> menu.classList.toggle('open'));
    document.addEventListener('click', (e)=>{
      if(!menu.contains(e.target) && e.target !== toggle){ menu.classList.remove('open'); }
    });
  }
  const path = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
  document.querySelectorAll('.menu a').forEach(a => {
    const href = a.getAttribute('href').toLowerCase();
    if(href === path || (path==='' && href==='index.html')) a.classList.add('active');
  });
  const copyBtn = document.getElementById('copy-email');
  if(copyBtn){
    copyBtn.addEventListener('click', async ()=>{
      try{
        await navigator.clipboard.writeText(copyBtn.getAttribute('data-email'));
        copyBtn.textContent = 'Copied!'; setTimeout(()=> copyBtn.textContent = 'Copy Email', 1400);
      }catch(e){ console.log(e); }
    });
  }
  const hero = document.querySelector('.hero h1');
  if(hero){
    const full = hero.textContent; hero.textContent=''; let i=0;
    (function type(){ if(i<full.length){ hero.textContent += full.charAt(i++); setTimeout(type,70); } })();
  }
  document.querySelectorAll('a[href^="#"]').forEach(a=>{
    a.addEventListener('click', e=>{ const tgt=document.querySelector(a.getAttribute('href')); if(tgt){ e.preventDefault(); window.scrollTo({top:tgt.offsetTop-60, behavior:'smooth'});} });
  });
})();
