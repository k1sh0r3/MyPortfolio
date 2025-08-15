
// Navigation: mobile toggle + active link highlight + copy email helper
(function(){
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
    if (href === path || (path === '' && href === 'index.html')) {
      a.classList.add('active');
    }
  });

  // Copy-to-clipboard for contact email button
  const copyBtn = document.getElementById('copy-email');
  if(copyBtn){
    copyBtn.addEventListener('click', async ()=>{
      try{
        const email = copyBtn.getAttribute('data-email');
        await navigator.clipboard.writeText(email);
        copyBtn.textContent = 'Copied!';
        setTimeout(()=> copyBtn.textContent = 'Copy Email', 1400);
      }catch(e){ console.log(e); }
    });
  }
})();
