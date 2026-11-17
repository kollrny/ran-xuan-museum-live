/* 照片房间：墙面相纸 + 可翻页的看图器。
   只接管 photos 路由与 #lightbox，其他房间仍由 app.js 渲染。 */
(() => {
  const pad = n => String(n).padStart(3, '0');
  const wallSrc = i => 'assets/wall/' + i + '.jpg';
  const viewSrc = i => 'assets/view/' + i + '.jpg';
  function markMissing(img) {
    if (!img || img.dataset.missing === '1') return;
    img.dataset.missing = '1';
    img.classList.add('is-missing');
    img.removeAttribute('src');
    const host = img.parentElement;
    if (host && !host.querySelector('.photo-missing-label')) {
      const label = document.createElement('span');
      label.className = 'photo-missing-label';
      label.textContent = '这张暂时看不了';
      host.appendChild(label);
    }
  }
  function clearMissing(img) {
    if (!img) return;
    delete img.dataset.missing;
    img.classList.remove('is-missing');
    img.parentElement?.querySelector('.photo-missing-label')?.remove();
  }
  let index = 0;
  let trigger = null;
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let closeTimer = null;
  let activeViewer = null;

  function clearMotion(d) {
    clearTimeout(closeTimer);
    closeTimer = null;
    d.classList.remove('viewer-opening', 'viewer-closing');
  }

  function finishClose(d, value) {
    clearMotion(d);
    if (d.open) HTMLDialogElement.prototype.close.call(d, value);
  }

  function closeViewer(d, value) {
    if (!d.open || d.classList.contains('viewer-closing')) return;
    clearMotion(d);
    if (reducedMotion.matches) { finishClose(d, value); return; }
    d.classList.add('viewer-closing');
    // The modal and focus trap remain until the short exit completes.
    closeTimer = setTimeout(() => finishClose(d, value), 180);
  }

  reducedMotion.addEventListener('change', () => {
    const d = activeViewer;
    if (!d || !d.open || !reducedMotion.matches) return;
    if (d.classList.contains('viewer-closing')) finishClose(d);
    else clearMotion(d);
  });

  function viewer() {
    const d = document.getElementById('lightbox');
    if (!d || d.dataset.built === '1') return d;
    d.className = 'photo-viewer';
    d.innerHTML =
      '<div class="viewer-frame"><img id="photo-full" alt=""></div>' +
      '<div class="viewer-bar">' +
        '<button type="button" class="viewer-nav" data-step="-1" aria-label="上一张照片">←</button>' +
        '<div class="viewer-meta"><span id="photo-caption"></span><small id="photo-index"></small></div>' +
        '<button type="button" class="viewer-nav" data-step="1" aria-label="下一张照片">→</button>' +
        '<button type="button" id="close-photo">收好 ×</button>' +
      '</div>' +
      '<p class="hint">← → 翻看 · Esc 收好</p>';
    d.dataset.built = '1';
    activeViewer = d;
    // Own the viewer lifecycle here, including older shared click handlers.
    d.close = value => closeViewer(d, value);
    d.oncancel = e => { e.preventDefault(); d.close(); };
    d.addEventListener('animationend', e => {
      if (e.target === d && e.animationName === 'photo-viewer-in') {
        d.classList.remove('viewer-opening');
      }
    });

    d.querySelectorAll('[data-step]').forEach(b => {
      b.onclick = () => show(index + Number(b.dataset.step));
    });
    d.querySelector('#close-photo').onclick = () => d.close();
    d.onclick = e => { if (e.target === d) d.close(); };
    d.onclose = () => {
      clearMotion(d);
      try { if (trigger && trigger.isConnected) trigger.focus({ preventScroll: true }); } catch (e) {}
    };
    return d;
  }

  function fit(d, img) {
    const nw = img.naturalWidth || 1000;
    const nh = img.naturalHeight || 1333;
    const narrow = window.innerWidth <= 650;
    const maxW = Math.min(window.innerWidth * (narrow ? 0.96 : 0.94) - (narrow ? 26 : 34), 1080);
    const maxH = Math.min(window.innerHeight * (narrow ? 0.62 : 0.72), narrow ? 560 : 700);
    const k = Math.min(maxW / nw, maxH / nh, 1);
    img.style.width = Math.round(nw * k) + 'px';
    img.style.height = Math.round(nh * k) + 'px';
  }

  function show(i, from) {
    const total = captions.length;
    index = (i + total) % total;
    if (from) trigger = from;
    const d = viewer();
    const img = d.querySelector('#photo-full');
    clearMissing(img);
    img.onload = () => { if (img.dataset.missing === '1') return; fit(d, img); };
    img.onerror = () => markMissing(img);
    img.src = viewSrc(index);
    img.alt = captions[index];
    if (img.complete && img.naturalWidth) fit(d, img);
    d.querySelector('#photo-caption').textContent = captions[index];
    d.querySelector('#photo-index').textContent = pad(index + 1) + ' / ' + total;
    d.querySelectorAll('[data-step]').forEach(b => { b.disabled = false; });
    if (d.classList.contains('viewer-closing')) clearMotion(d);
    if (!d.open) {
      clearMotion(d);
      // Skip the old shared showModal opacity wrapper: one animation owner.
      HTMLDialogElement.prototype.showModal.call(d);
      if (!reducedMotion.matches) d.classList.add('viewer-opening');
    }
  }

  function zhCount(n) {
    const d = '零一二三四五六七八九';
    const num = Number(n);
    if (!Number.isFinite(num) || num <= 0 || num > 99) return String(n);
    if (num < 10) return d[num];
    const tens = Math.floor(num / 10);
    const ones = num % 10;
    return (tens === 1 ? '' : d[tens]) + '十' + (ones ? d[ones] : '');
  }

  function room() {
    const items = captions.map((c, i) =>
      '<figure class="photo">' +
        '<button type="button" data-photo="' + i + '" aria-label="放大照片：' + esc(c) + '">' +
          '<img src="' + wallSrc(i) + '" alt="' + esc(c) + '" loading="lazy" decoding="async">' +
        '</button>' +
        '<figcaption><span>' + esc(c) + '</span><b>' + pad(i + 1) + '</b></figcaption>' +
      '</figure>').join('');

    app.innerHTML =
      '<header class="photos-head">' +
        '<span class="eyebrow"><span class="xuan">盛梓轩</span> &amp; <span class="ran">方然</span> · 照片</span>' +
        '<h1>有些瞬间，<br>值得再看一次。</h1>' +
        '<div class="head-row">' +
          '<p>' + zhCount(captions.length) + '张，都还留着。点开看完整画面，左右可以翻。</p>' +
        '</div>' +
      '</header>' +
      '<div class="gallery gallery--wall">' + items +
        '<figure class="photo photo-note">' +
          '<p>还没贴完。<br>以后拍了新的，<br>再一起补上来。</p>' +
          '<small>r &amp; x</small>' +
        '</figure>' +
      '</div>';

    app.querySelectorAll('[data-photo]').forEach(b => {
      b.onclick = () => show(Number(b.dataset.photo), b);
    });
    app.querySelectorAll('.gallery--wall img').forEach(img => {
      img.addEventListener('error', () => markMissing(img));
    });
  }

  document.addEventListener('keydown', e => {
    const d = document.getElementById('lightbox');
    if (!d || !d.open) return;
    if (e.key === 'ArrowLeft') { e.preventDefault(); show(index - 1); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); show(index + 1); }
    else if (e.key === 'Home') { e.preventDefault(); show(0); }
    else if (e.key === 'End') { e.preventDefault(); show(captions.length - 1); }
  });

  window.addEventListener('resize', () => {
    const d = document.getElementById('lightbox');
    if (!d || !d.open) return;
    const img = d.querySelector('#photo-full');
    if (img && img.naturalWidth) fit(d, img);
  });

  // 手机上左右滑
  (() => {
    let x0 = null;
    document.addEventListener('pointerdown', e => {
      const d = document.getElementById('lightbox');
      if (!d || !d.open || !e.target.closest('.viewer-frame')) return;
      x0 = e.clientX;
    }, { passive: true });
    document.addEventListener('pointerup', e => {
      if (x0 === null) return;
      const dx = e.clientX - x0;
      x0 = null;
      if (Math.abs(dx) < 45) return;
      show(index + (dx < 0 ? 1 : -1));
    }, { passive: true });
  })();

  const prior = render;
  render = function () {
    prior();
    if (route === 'photos') room();
  };

  if (route === 'photos') render();
})();
