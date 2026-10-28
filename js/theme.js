'use strict';
/* Light / dark switch. Dark is the default. The choice is remembered in localStorage when it is available. */
(function(){
  const root=document.documentElement,btn=document.querySelector('#themeBtn'),KEY='monohybrid-theme';
  function apply(th){
    root.setAttribute('data-theme',th);
    btn.textContent=th==='light'?'\u263E Dark mode':'\u2600 Light mode';
    btn.setAttribute('aria-label',th==='light'?'Switch to dark theme':'Switch to light theme');
  }
  let cur='dark';
  try{if(localStorage.getItem(KEY)==='light')cur='light'}catch(e){}
  apply(cur);
  btn.addEventListener('click',()=>{
    cur=cur==='light'?'dark':'light';
    apply(cur);
    try{localStorage.setItem(KEY,cur)}catch(e){}
  });
  /* "How this works" strip: hidden after the student presses Got it (remembered when localStorage is available) */
  const how=document.querySelector('#how'),hb=document.querySelector('#howClose');
  try{if(localStorage.getItem('mlab-how')==='1')how.hidden=true}catch(e){}
  hb.addEventListener('click',()=>{how.hidden=true;try{localStorage.setItem('mlab-how','1')}catch(e){}});
})();
