/* 高级动画（实验版 2026-11-17 收束）
 * 已关掉：鼠标光晕、背景粒子、星光、拆字、视差、以及插入 DOM 的按钮波纹（波纹改由 motion.css 负责）。
 * 仍保留：照片悬停时的轻微 3D 倾斜；减少动态效果开启（含使用中途改偏好）时立即停掉并清掉内联 transform。
 * 翻页由 motion.js 单独负责，这里不再插手。
 */
(()=>{
  'use strict';

  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let lastPhoto = null;

  function clearTilt(el){
    if(el) el.style.transform = '';
  }

  function clearAllTilts(){
    clearTilt(lastPhoto);
    lastPhoto = null;
    document.querySelectorAll('.photo').forEach(photo => {
      if(photo.style.transform) photo.style.transform = '';
    });
  }

  document.addEventListener('mousemove', e => {
    if(reduced.matches){
      if(lastPhoto) clearAllTilts();
      return;
    }

    const photo = e.target.closest && e.target.closest('.photo');
    if(photo !== lastPhoto){
      clearTilt(lastPhoto);
      lastPhoto = photo || null;
    }
    if(!photo) return;

    const rect = photo.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    if(x < 0 || y < 0 || x > rect.width || y > rect.height){
      clearTilt(photo);
      lastPhoto = null;
      return;
    }

    const xPercent = (x / rect.width - 0.5) * 2;
    const yPercent = (y / rect.height - 0.5) * 2;
    photo.style.transform = 'perspective(1000px) rotateY(' + (xPercent * 5) + 'deg) rotateX(' + (-yPercent * 5) + 'deg) translateY(-6px) scale(1.02)';
  });

  reduced.addEventListener('change', () => {
    if(reduced.matches) clearAllTilts();
  });
})();
