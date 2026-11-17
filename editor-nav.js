/* 访客隐藏页脚「管理收藏」，登录编辑账号后再显示。
   优先用 window.museumCloud.hasSession() 与 museum-cloud-session 事件；
   #manage 路由本身仍可用（编辑者用直达链接登录）。 */
(() => {
  const button = () => document.querySelector('.museum-footer [data-route="manage"]');

  function hasEditorSession() {
    if (window.museumCloud && typeof window.museumCloud.hasSession === 'function') {
      return !!window.museumCloud.hasSession();
    }
    try {
      const raw = localStorage.getItem('museum-cloud-session') || sessionStorage.getItem('museum-cloud-session');
      const session = raw ? JSON.parse(raw) : null;
      return !!(session && session.access_token);
    } catch (e) {
      return false;
    }
  }

  function syncManageNav() {
    const btn = button();
    if (!btn) return;
    btn.hidden = !hasEditorSession();
  }

  syncManageNav();
  document.addEventListener('museum-cloud-session', syncManageNav);
  window.addEventListener('storage', syncManageNav);
})();
