/* Local-only feedback: announces the state after existing storage handling. */
(()=>{const status=document.createElement('div');status.className='motion-status';status.setAttribute('role','status');document.body.append(status);let timer;document.addEventListener('click',e=>{const button=e.target.closest('[data-keep]');if(!button)return;const id=button.dataset.keep;requestAnimationFrame(()=>{const current=[...document.querySelectorAll('[data-keep]')].find(b=>b.dataset.keep===id);if(!current)return;current.classList.remove('motion-saved');void current.offsetWidth;current.classList.add('motion-saved');status.textContent=current.getAttribute('aria-pressed')==='true'?'这一件，收好了。':'已取消收藏。';clearTimeout(timer);timer=setTimeout(()=>status.textContent='',1800);});});})();

/* A local bookmark, never an automatic redirect. */
(()=>{const key='museum:last-week:v1';const valid=s=>/^#week-(0[4-9]|1[01])-([1-4])$/.test(s||'');let saved='';try{saved=localStorage.getItem(key)||''}catch{}const resume=document.createElement('button');resume.className='resume-reading';resume.type='button';resume.hidden=true;document.querySelector('.footer-copy').append(resume);function paint(){resume.hidden=!valid(saved)||document.body.dataset.room==='timeline';if(valid(saved)){const parts=saved.split('-');resume.textContent='接着读 · '+Number(parts[1])+'月第'+parts[2]+'卷';resume.setAttribute('aria-label','继续上次阅读的'+Number(parts[1])+'月第'+parts[2]+'卷周报')}}resume.addEventListener('click',()=>{if(valid(saved)){if(location.hash===saved)window.dispatchEvent(new Event('hashchange'));else location.hash=saved}});let queued=false;function record(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;if(document.body.dataset.room==='timeline'&&valid(location.hash)){saved=location.hash;try{localStorage.setItem(key,saved)}catch{}}paint()})}new MutationObserver(record).observe(document.body,{attributes:true,attributeFilter:['data-room']});const appRoot=document.getElementById('app');if(appRoot)new MutationObserver(record).observe(appRoot,{childList:true,subtree:true});window.addEventListener('hashchange',record);record()})();

/* Page transitions, scroll reveals, and enhanced navigation. */
(()=>{
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  let lastRoute='';

  // Page transition manager
  function pageTransition(callback){
    if(reduced.matches){
      callback();
      return;
    }

    app.classList.add('page-exit');
    setTimeout(()=>{
      callback();
      app.classList.remove('page-exit');
      app.classList.add('page-enter');
      setTimeout(()=>app.classList.remove('page-enter'),500);
    },350);
  }

  // Intercept navigation for smooth transitions
  const originalGo=window.go;
  if(originalGo){
    window.go=function(page,id,record=true){
      if(route===page&&reading===id)return;
      pageTransition(()=>{
        originalGo(page,id,record);
        // 触发新页面的动画
        triggerPageAnimations();
      });
    };
  }

  // 触发页面动画
  function triggerPageAnimations(){
    if(reduced.matches)return;

    requestAnimationFrame(()=>{
      // 重置并触发首页动画
      const hero=document.querySelector('.opening.hero');
      if(hero){
        // 强制重新开始动画
        hero.style.animation='none';
        void hero.offsetWidth;
        hero.style.animation='';
      }

      // 重置所有带动画的元素
      const animated=document.querySelectorAll('.hero-copy, .opening-envelope, .opening-note, .memories, .memory, .recent, .recent-grid > *');
      animated.forEach(el=>{
        el.style.animation='none';
        void el.offsetWidth;
        el.style.animation='';
      });

      // 设置滚动触发动画
      setupScrollReveals();
    });
  }

  // Scroll reveal observer
  const scrollObserver=new IntersectionObserver(entries=>{
    entries.forEach(entry=>{
      if(entry.isIntersecting){
        entry.target.classList.add('revealed');
        scrollObserver.unobserve(entry.target);
      }
    });
  },{threshold:0.1,rootMargin:'0px 0px -50px 0px'});

  function setupScrollReveals(){
    if(reduced.matches)return;
    requestAnimationFrame(()=>{
      document.querySelectorAll('.scroll-reveal').forEach(el=>{
        scrollObserver.observe(el);
      });
    });
  }

  // Monitor route changes
  new MutationObserver(()=>{
    if(lastRoute!==route){
      lastRoute=route;
      setupScrollReveals();
    }
  }).observe(document.body,{attributes:true,attributeFilter:['data-room']});

  // Navigation
  document.querySelector('.skip-link')?.addEventListener('click',e=>{
    e.preventDefault();
    app.focus();
    app.scrollIntoView({block:'start'});
  });

  const toggle=document.getElementById('menu-toggle');
  toggle?.addEventListener('click',()=>{
    const open=document.body.classList.toggle('menu-open');
    toggle.setAttribute('aria-expanded',String(open));
  });

  document.addEventListener('keydown',e=>{
    if(e.key==='Escape'&&document.body.classList.contains('menu-open')){
      document.body.classList.remove('menu-open');
      toggle.setAttribute('aria-expanded','false');
      toggle.focus();
    }
  });

  // Lightbox
  const lightbox=document.getElementById('lightbox');
  lightbox.addEventListener('click',e=>{
    if(e.target.id==='lightbox')e.target.close();
  });

  // Enhance lightbox open animation
  const originalShowModal=lightbox.showModal;
  lightbox.showModal=function(){
    originalShowModal.call(this);
    if(!reduced.matches){
      this.style.opacity='0';
      requestAnimationFrame(()=>{
        this.style.opacity='';
      });
    }
  };

  setupScrollReveals();
})();
