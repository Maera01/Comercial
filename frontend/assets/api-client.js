(function () {
  const BACKEND_ORIGIN = 'https://comercial-7se1.onrender.com';
  const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '::1']);
  let loadingTimer = null;
  let activeRequests = 0;

  function getApiOrigin() {
    if (LOCAL_HOSTS.has(window.location.hostname)) return window.location.origin;
    return (window.MAERA_BACKEND_ORIGIN || BACKEND_ORIGIN).replace(/\/+$/, '');
  }

  function getApiRoot() {
    return `${getApiOrigin()}/api`;
  }

  function ensureLoading() {
    let overlay = document.getElementById('maeraApiLoading');
    if (overlay) return overlay;

    overlay = document.createElement('div');
    overlay.id = 'maeraApiLoading';
    overlay.className = 'api-loading-overlay';
    overlay.innerHTML = `
      <div class="api-loading-panel">
        <img src="assets/logo.png" alt="MAERA" class="api-loading-logo"/>
        <div class="api-loading-spinner"></div>
        <h2>Preparando o sistema</h2>
        <p>Estamos acordando o servidor. Isso pode levar alguns segundos no primeiro acesso.</p>
      </div>`;
    document.body.appendChild(overlay);
    return overlay;
  }

  function showLoading() {
    if (!document.body) return;
    ensureLoading().classList.add('is-visible');
  }

  function hideLoading() {
    const overlay = document.getElementById('maeraApiLoading');
    if (overlay) overlay.classList.remove('is-visible');
  }

  async function maeraFetch(url, options = {}) {
    const delay = Number.isFinite(options.loadingDelay) ? options.loadingDelay : 700;
    activeRequests += 1;
    loadingTimer = loadingTimer || setTimeout(showLoading, delay);

    try {
      return await fetch(url, options);
    } finally {
      activeRequests = Math.max(0, activeRequests - 1);
      if (activeRequests === 0) {
        clearTimeout(loadingTimer);
        loadingTimer = null;
        hideLoading();
      }
    }
  }

  window.MaeraApi = {
    getApiOrigin,
    getApiRoot,
    fetch: maeraFetch
  };
  window.getApiRoot = getApiRoot;
})();
