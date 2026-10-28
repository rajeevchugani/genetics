'use strict';
/* Light / dark switch. Dark is the default. The choice is remembered in localStorage when it is available. */
(function(){
  const root=document.documentElement,btn=document.querySelector('#themeBtn'),txt=document.querySelector('#themeTxt'),ico=document.querySelector('#themeIco');
  const MOON='M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z',SUN='M12 4V2M12 22v-2M4 12H2M22 12h-2M5.6 5.6 4.2 4.2M19.8 19.8l-1.4-1.4M5.6 18.4l-1.4 1.4M19.8 4.2l-1.4 1.4M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z';
  const light=()=>root.getAttribute('data-theme')==='light';
  function paint(){btn.setAttribute('aria-pressed',String(light()));txt.textContent=light()?'Dark mode':'Light mode';ico.setAttribute('d',light()?MOON:SUN)}
  btn.addEventListener('click',()=>{
    if(light())root.removeAttribute('data-theme');else root.setAttribute('data-theme','light');
    try{localStorage.setItem('mlab-theme',light()?'light':'dark')}catch(e){}
    paint();
  });
  paint();
  /* "How this works" strip: hidden after the student presses Got it (remembered when localStorage is available) */
  const how=document.querySelector('#how'),hb=document.querySelector('#howClose');
  try{if(localStorage.getItem('mlab-how')==='1')how.hidden=true}catch(e){}
  hb.addEventListener('click',()=>{how.hidden=true;try{localStorage.setItem('mlab-how','1')}catch(e){}});
})();
