/* 高级动画脚本 - 鼠标跟随、粒子系统、视差滚动 */
(()=>{
  'use strict';

  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  if(reduced.matches) return;

  // ========== 鼠标跟随光晕 ==========
  let mouseX = 0, mouseY = 0;
  let currentX = 0, currentY = 0;
  const speed = 0.15;

  document.addEventListener('mousemove', e => {
    mouseX = e.clientX;
    mouseY = e.clientY;
  });

  function updateMouseGlow() {
    currentX += (mouseX - currentX) * speed;
    currentY += (mouseY - currentY) * speed;

    const glow = document.body;
    if(glow) {
      glow.style.setProperty('--mouse-x', currentX + 'px');
      glow.style.setProperty('--mouse-y', currentY + 'px');
    }

    requestAnimationFrame(updateMouseGlow);
  }
  updateMouseGlow();

  // CSS 变量样式
  const style = document.createElement('style');
  style.textContent = `
    body:before {
      left: calc(var(--mouse-x, 50%) - 150px);
      top: calc(var(--mouse-y, 50%) - 150px);
      opacity: 0.6;
    }
    body:hover:before {
      opacity: 1;
    }
  `;
  document.head.appendChild(style);

  // ========== 背景粒子系统 ==========
  function createParticles() {
    const container = document.createElement('div');
    container.className = 'particle-bg';

    for(let i = 0; i < 15; i++) {
      const particle = document.createElement('div');
      particle.className = 'particle';
      particle.style.left = Math.random() * 100 + '%';
      particle.style.animationDuration = (15 + Math.random() * 10) + 's';
      particle.style.animationDelay = Math.random() * 5 + 's';
      container.appendChild(particle);
    }

    document.body.insertBefore(container, document.body.firstChild);
  }
  createParticles();

  // ========== 视差滚动效果（已停用：会给 hero/内容加 translateY 造成位移与"排版漂移"） ==========
  let scrollY = 0;

  function updateParallax() {
    // 有意停用视差位移，避免内容被 transform 推离原位置。
    return;
  }

  window.addEventListener('scroll', updateParallax, {passive: true});
  updateParallax();

  // ========== 元素进入视口动画 ==========
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if(entry.isIntersecting) {
        entry.target.classList.add('in-view');

        // 为子元素添加递增延迟
        const children = entry.target.querySelectorAll('p, h2, h3, blockquote, button');
        children.forEach((child, i) => {
          setTimeout(() => {
            child.classList.add('revealed');
          }, i * 80);
        });
      }
    });
  }, {threshold: 0.1});

  // 观察需要动画的元素
  document.querySelectorAll('.memory, .recent-grid > *, .event, .day-scene').forEach(el => {
    observer.observe(el);
  });

  // ========== 标题文字分割动画 ==========
  // 已停用：把 h1/h2 逐字拆成 opacity:0 的 span 再靠动画浮现，
  // 一旦动画不触发（reduced-motion/截图时机/时序），标题会整体消失，是"文字发白/消失"的总根源。
  // 改用 CSS 层的整块浮现（motion.css 已处理），这里不再拆字。
  function splitTextAnimation() {
    // 有意留空，不再拆字。
    return;
  }

  // 添加字符动画
  const charStyle = document.createElement('style');
  charStyle.textContent = `
    @keyframes char-appear {
      from {
        opacity: 0;
        transform: translateY(20px) rotate(-5deg);
      }
      to {
        opacity: 1;
        transform: translateY(0) rotate(0);
      }
    }
  `;
  document.head.appendChild(charStyle);

  // ========== 页面切换时触发动画 ==========
  new MutationObserver(() => {
    setTimeout(() => {
      splitTextAnimation();

      // 重新观察新元素
      document.querySelectorAll('.memory, .recent-grid > *, .event, .day-scene').forEach(el => {
        if(!el.classList.contains('in-view')) {
          observer.observe(el);
        }
      });
    }, 100);
  }).observe(document.getElementById('app'), {childList: true});

  // ========== 照片悬停 3D 倾斜 ==========
  document.addEventListener('mousemove', e => {
    const photos = document.querySelectorAll('.photo');
    photos.forEach(photo => {
      const rect = photo.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      if(x >= 0 && x <= rect.width && y >= 0 && y <= rect.height) {
        const xPercent = (x / rect.width - 0.5) * 2;
        const yPercent = (y / rect.height - 0.5) * 2;

        photo.style.transform = `
          perspective(1000px)
          rotateY(${xPercent * 5}deg)
          rotateX(${-yPercent * 5}deg)
          translateY(-6px)
          scale(1.02)
        `;
      } else {
        photo.style.transform = '';
      }
    });
  });

  // ========== 按钮点击波纹效果 ==========
  document.addEventListener('click', e => {
    const button = e.target.closest('button');
    if(!button) return;

    const ripple = document.createElement('span');
    ripple.className = 'ripple-effect';
    ripple.style.cssText = `
      position: absolute;
      border-radius: 50%;
      background: rgba(199, 160, 123, 0.6);
      transform: translate(-50%, -50%);
      pointer-events: none;
      animation: ripple 0.6s ease-out;
    `;

    const rect = button.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ripple.style.left = x + 'px';
    ripple.style.top = y + 'px';

    button.appendChild(ripple);
    setTimeout(() => ripple.remove(), 600);
  });

  // ========== 星光装饰生成 ==========
  function addSparkles() {
    const sparkleElements = document.querySelectorAll('h1, h2, .brand');
    sparkleElements.forEach(el => {
      if(!el.classList.contains('sparkle')) {
        el.classList.add('sparkle');
      }
    });
  }

  setTimeout(addSparkles, 1000);

  // ========== 滚动进度条 ==========
  const progressBar = document.createElement('div');
  progressBar.className = 'reading-progress';
  progressBar.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    height: 3px;
    background: linear-gradient(90deg, #83add9, #df9fbd);
    width: 0%;
    z-index: 9999;
    transition: width 0.2s ease;
  `;
  document.body.appendChild(progressBar);

  window.addEventListener('scroll', () => {
    const scrollPercent = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
    progressBar.style.width = scrollPercent + '%';
  }, {passive: true});

  // ========== 初始化 ==========
  console.log('🎨 高级动画系统已加载');
  splitTextAnimation();
})();
