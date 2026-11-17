/* 动画修复补丁 - 让 app.js 渲染的内容能正确播放动画 */
(function() {
  'use strict';

  // 保存原始的 render 函数
  const originalRender = window.render;
  if (!originalRender) return;

  // 重写 render 函数，在渲染后触发动画
  window.render = function() {
    // 调用原始渲染
    originalRender();

    // 移除所有动画类，强制重新开始
    const app = document.getElementById('app');
    if (!app) return;

    // 立即移除动画类
    app.classList.remove('page-enter', 'page-exit');

    // 在下一帧添加 page-enter 类触发动画
    requestAnimationFrame(() => {
      app.classList.add('page-enter');

      // 0.65秒后移除（对应 page-enter 动画时长）
      setTimeout(() => {
        app.classList.remove('page-enter');
      }, 650);
    });

    // 为首页元素添加滚动触发动画
    if (document.querySelector('.opening.hero')) {
      setupScrollAnimations();
    }
  };

  // 设置滚动触发动画
  function setupScrollAnimations() {
    const elements = document.querySelectorAll('.scroll-reveal, .memory, .recent-grid > *');

    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animated');
            observer.unobserve(entry.target);
          }
        });
      }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
      });

      elements.forEach(el => observer.observe(el));
    }
  }

  // 为按钮添加波纹效果增强
  document.addEventListener('click', (e) => {
    const button = e.target.closest('button');
    if (!button) return;

    // 创建波纹
    const ripple = document.createElement('span');
    ripple.classList.add('ripple-effect');

    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;

    ripple.style.width = ripple.style.height = size + 'px';
    ripple.style.left = x + 'px';
    ripple.style.top = y + 'px';

    button.appendChild(ripple);

    setTimeout(() => ripple.remove(), 600);
  }, { passive: true });

  console.log('✨ 动画系统已增强');
})();
