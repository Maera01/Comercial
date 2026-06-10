/* ============================================
   MAERA – APP.JS | FUNÇÕES GLOBAIS
   v2.3 — Backend API (sem localStorage)
   ============================================ */

function getApiRoot() {
  return window.MaeraApi ? window.MaeraApi.getApiRoot() : `${window.location.origin}/api`;
}

const API_ROOT       = getApiRoot();
const API_BASE       = `${API_ROOT}/orcamentos`;
const API_VENDEDORES = `${API_ROOT}/vendedores`;

async function apiFetch(url, options = {}) {
  const headers = {
    ...(options.headers || {})
  };
  const token = localStorage.getItem('maera_token');
  if (token) headers.Authorization = `Bearer ${token}`;

  const fetchApi = window.MaeraApi?.fetch || fetch;
  const resp = await fetchApi(url, {
    ...options,
    headers,
    credentials: 'include'
  });

  if (resp.status === 401) {
    localStorage.removeItem('maera_token');
    localStorage.removeItem('maera_usuario');
    window.location.href = 'login.html';
    throw new Error('Login necessario');
  }

  return resp;
}

async function getSessaoAtual() {
  try {
    const resp = await apiFetch(`${API_ROOT}/session`);
    if (!resp.ok) throw new Error('Sessão indisponível');
    const data = await resp.json();
    if (data.usuario) {
      localStorage.setItem('maera_usuario', JSON.stringify(data.usuario));
    }
    return data.usuario || null;
  } catch {
    try {
      return JSON.parse(localStorage.getItem('maera_usuario') || 'null');
    } catch {
      return null;
    }
  }
}

function usuarioEhAdmin(usuario) {
  return !!(usuario && (usuario.master || usuario.perfil === 'admin'));
}

function usuarioLocalEhAdmin() {
  try {
    return usuarioEhAdmin(JSON.parse(localStorage.getItem('maera_usuario') || 'null'));
  } catch {
    return false;
  }
}

async function aplicarPermissoesUsuario() {
  const usuario = await getSessaoAtual();
  const ehAdmin = usuarioEhAdmin(usuario);
  document.body.classList.toggle('admin-user', ehAdmin);
}

async function sairDoSistema() {
  try {
    const fetchApi = window.MaeraApi?.fetch || fetch;
    await fetchApi(`${API_ROOT}/logout`, {
      method: 'POST',
      credentials: 'include'
    });
  } catch {}
  localStorage.removeItem('maera_token');
  localStorage.removeItem('maera_usuario');
  window.location.href = 'login.html?trocar=1';
}

function abrirModalTrocarSenha() {
  const overlay = document.createElement('div');
  overlay.style.cssText = `
    position:fixed;inset:0;background:rgba(0,0,0,.45);
    z-index:99998;display:flex;align-items:center;justify-content:center`;
  overlay.innerHTML = `
    <div style="background:#fff;border-radius:12px;padding:24px 28px;
      max-width:380px;width:90%;box-shadow:0 8px 32px rgba(0,0,0,.2)">
      <h2 style="font-size:16px;font-weight:800;color:#111827;margin:0 0 14px">
        Trocar senha
      </h2>
      <div style="display:flex;flex-direction:column;gap:10px">
        <input id="senhaAtualModal" type="password" class="input" placeholder="Senha atual" autocomplete="current-password"/>
        <input id="novaSenhaModal" type="password" class="input" placeholder="Nova senha" autocomplete="new-password"/>
        <input id="confirmaSenhaModal" type="password" class="input" placeholder="Confirmar nova senha" autocomplete="new-password"/>
      </div>
      <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:18px">
        <button id="senhaCancelar" type="button" class="btn btn-outline">Cancelar</button>
        <button id="senhaSalvar" type="button" class="btn btn-primary">
          <i class="fa-solid fa-floppy-disk"></i> Salvar
        </button>
      </div>
    </div>`;

  document.body.appendChild(overlay);
  const fechar = () => {
    if (overlay.parentNode) document.body.removeChild(overlay);
  };

  overlay.querySelector('#senhaCancelar').addEventListener('click', fechar);
  overlay.addEventListener('click', event => {
    if (event.target === overlay) fechar();
  });
  overlay.querySelector('#senhaAtualModal').focus();
  overlay.querySelector('#senhaSalvar').addEventListener('click', async () => {
    const senhaAtual = overlay.querySelector('#senhaAtualModal').value;
    const novaSenha = overlay.querySelector('#novaSenhaModal').value;
    const confirmaSenha = overlay.querySelector('#confirmaSenhaModal').value;

    if (!senhaAtual || !novaSenha || !confirmaSenha) {
      showToast('Preencha todos os campos.', 'warn');
      return;
    }
    if (novaSenha !== confirmaSenha) {
      showToast('A confirmação não confere com a nova senha.', 'warn');
      return;
    }
    if (novaSenha.length < 3) {
      showToast('A nova senha precisa ter pelo menos 3 caracteres.', 'warn');
      return;
    }

    try {
      const resp = await apiFetch(`${API_ROOT}/minha-senha`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ senhaAtual, novaSenha })
      });
      const data = await resp.json().catch(() => ({}));
      if (!resp.ok) throw new Error(data.erro || 'Erro ao alterar senha.');
      if (data.token) localStorage.setItem('maera_token', data.token);
      if (data.usuario) localStorage.setItem('maera_usuario', JSON.stringify(data.usuario));
      fechar();
      showToast('Senha alterada com sucesso.', 'success');
    } catch (err) {
      showToast(err.message || 'Erro ao alterar senha.', 'error');
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  const topBar = document.querySelector('.top-bar');
  if (!topBar || document.getElementById('btnSairSistema')) return;
  const btnSenha = document.createElement('button');
  btnSenha.id = 'btnTrocarSenha';
  btnSenha.type = 'button';
  btnSenha.className = 'btn btn-outline';
  btnSenha.style.cssText = 'font-size:12px';
  btnSenha.innerHTML = '<i class="fa-solid fa-key"></i> Trocar senha';
  btnSenha.addEventListener('click', abrirModalTrocarSenha);
  topBar.appendChild(btnSenha);

  const btn = document.createElement('button');
  btn.id = 'btnSairSistema';
  btn.type = 'button';
  btn.className = 'btn btn-outline';
  btn.style.cssText = 'font-size:12px';
  btn.innerHTML = '<i class="fa-solid fa-right-from-bracket"></i> Sair';
  btn.addEventListener('click', sairDoSistema);
  topBar.appendChild(btn);
  aplicarPermissoesUsuario();
});

/* ══════════════════════════════════════════
   STORAGE — API REST
   ══════════════════════════════════════════ */
async function getOrcamentos() {
  try {
    const resp = await apiFetch(API_BASE);
    if (!resp.ok) throw new Error('Erro ao buscar');
    return await resp.json();
  } catch (err) {
    console.error('getOrcamentos:', err);
    return [];
  }
}

async function getOrcamento(id) {
  try {
    const resp = await apiFetch(`${API_BASE}/${id}`);
    if (!resp.ok) return null;
    return await resp.json();
  } catch { return null; }
}

async function saveOrcamento(dados) {
  try {
    const putResp = await apiFetch(`${API_BASE}/${dados.id}`, {
      method:  'PUT',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(dados)
    });

    if (putResp.ok) return await putResp.json();

    if (putResp.status === 404) {
      const postResp = await apiFetch(API_BASE, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(dados)
      });
      if (!postResp.ok) throw new Error(`POST falhou: ${postResp.status}`);
      return await postResp.json();
    }

    throw new Error(`PUT falhou: ${putResp.status}`);
  } catch (err) {
    console.error('saveOrcamento:', err);
    return null;
  }
}

async function deleteOrcamento(id) {
  try {
    const resp = await apiFetch(`${API_BASE}/${id}`, { method: 'DELETE' });
    return resp.ok;
  } catch { return false; }
}

async function saveOrcamentos(lista) {
  try {
    const existentes = await getOrcamentos();
    await Promise.all(existentes.map(o => deleteOrcamento(o.id)));
    await Promise.all(lista.map(o =>
      apiFetch(API_BASE, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(o)
      })
    ));
    return true;
  } catch (err) {
    console.error('saveOrcamentos:', err);
    return false;
  }
}

async function getVendedoresBackup() {
  try {
    const resp = await apiFetch(API_VENDEDORES);
    if (!resp.ok) throw new Error('Erro ao buscar vendedores');
    return await resp.json();
  } catch (err) {
    console.error('getVendedoresBackup:', err);
    return [];
  }
}

async function saveVendedoresBackup(lista) {
  try {
    const existentes = await getVendedoresBackup();
    await Promise.all(existentes.map(vendedor => {
      const login = typeof vendedor === 'string' ? vendedor : vendedor.login;
      return apiFetch(`${API_VENDEDORES}/${encodeURIComponent(login)}`, {
        method: 'DELETE'
      });
    }));
    await Promise.all(lista.map(vendedor => {
      const dados = typeof vendedor === 'string' ? { nome: vendedor } : vendedor;
      return apiFetch(API_VENDEDORES, {
        method : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body   : JSON.stringify(dados)
      });
    }));
    return true;
  } catch (err) {
    console.error('saveVendedoresBackup:', err);
    return false;
  }
}

/* ══════════════════════════════════════════
   FORMATAÇÃO DE MOEDA
   ══════════════════════════════════════════ */
function getMoedaAtual() {
  return window.moedaAtual || document.getElementById('moeda')?.value || 'BRL';
}

function simboloMoeda(moeda = getMoedaAtual()) {
  return moeda === 'USD' ? 'US$' : moeda === 'EUR' ? '€' : 'R$';
}

function formatMoeda(valor, moeda = getMoedaAtual()) {
  if (valor === undefined || valor === null || isNaN(valor)) return `${simboloMoeda(moeda)} 0,00`;
  return simboloMoeda(moeda) + ' ' + parseFloat(valor)
    .toFixed(2)
    .replace('.', ',')
    .replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

function parseMoeda(str) {
  if (!str) return 0;
  return parseFloat(
    String(str)
      .replace(/R\$\s?/g, '')
      .replace(/US\$\s?/g, '')
      .replace(/USD\s?/gi, '')
      .replace(/€\s?/g, '')
      .replace(/EUR\s?/gi, '')
      .replace(/\./g, '')
      .replace(',', '.')
  ) || 0;
}

function getCotacaoDolar() {
  const raw = document.getElementById('cotacaoDolar')?.value || window.cotacaoDolarAtual || 1;
  const valor = parseFloat(String(raw).replace(',', '.')) || 1;
  return valor > 0 ? valor : 1;
}

function converterBRLParaMoeda(valorBRL, moeda = getMoedaAtual(), cotacao = getCotacaoDolar()) {
  const valor = parseFloat(valorBRL) || 0;
  if (moeda === 'USD') return valor / cotacao;
  return valor;
}

/* ══════════════════════════════════════════
   FORMATAÇÃO DE DATAS
   ══════════════════════════════════════════ */
function formatDateBR(data) {
  if (!data) return '—';
  try {
    const partes = String(data).split('-');
    if (partes.length === 3) return `${partes[2]}/${partes[1]}/${partes[0]}`;
    return data;
  } catch { return data; }
}

function formatDateInput(date) {
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d)) return '';
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

/* ══════════════════════════════════════════
   GERAÇÃO DE IDs E NÚMEROS
   ══════════════════════════════════════════ */
function gerarId() {
  return 'orc_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);
}

async function gerarNumero() {
  const d       = new Date();
  const ano     = d.getFullYear();
  const mes     = String(d.getMonth() + 1).padStart(2, '0');
  const dia     = String(d.getDate()).padStart(2, '0');
  const lista   = await getOrcamentos();
  const prefixo = `${ano}${mes}${dia}`;
  const seq     = lista.filter(o =>
    o.numero && o.numero.startsWith(prefixo)
  ).length + 1;
  return `${prefixo}-${String(seq).padStart(2, '0')}`;
}

/* ══════════════════════════════════════════
   MÁSCARAS
   ✅ mascaraCNPJ detecta CPF (11) ou CNPJ (14)
   ══════════════════════════════════════════ */
function mascaraCNPJ(v) {
  v = v.replace(/\D/g, '');

  if (v.length <= 11) {
    /* ✅ CPF: 000.000.000-00 */
    v = v.replace(/(\d{3})(\d)/,        '$1.$2');
    v = v.replace(/(\d{3})(\d)/,        '$1.$2');
    v = v.replace(/(\d{3})(\d{1,2})$/,  '$1-$2');
  } else {
    /* ✅ CNPJ: 00.000.000/0000-00 */
    v = v.replace(/^(\d{2})(\d)/,            '$1.$2');
    v = v.replace(/^(\d{2})\.(\d{3})(\d)/,   '$1.$2.$3');
    v = v.replace(/\.(\d{3})(\d)/,           '.$1/$2');
    v = v.replace(/(\d{4})(\d)/,             '$1-$2');
  }

  return v;
}

function mascaraCEP(v) {
  v = v.replace(/\D/g, '').substring(0, 8);
  return v.replace(/(\d{5})(\d)/, '$1-$2');
}

function mascaraTelefone(v) {
  const digitos = String(v || '').replace(/\D/g, '').substring(0, 11);
  if (!digitos) return '';
  if (digitos.length <= 2) return `(${digitos}`;

  const ddd = digitos.slice(0, 2);
  const numero = digitos.slice(2);
  const prefixo = digitos.length > 10
    ? numero.slice(0, 5)
    : numero.slice(0, 4);
  const sufixo = digitos.length > 10
    ? numero.slice(5)
    : numero.slice(4);

  return sufixo
    ? `(${ddd}) ${prefixo}-${sufixo}`
    : `(${ddd}) ${prefixo}`;
}

/* ══════════════════════════════════════════
   TOAST
   ══════════════════════════════════════════ */
function showToast(msg, tipo = 'info') {
  let container = document.getElementById('toastContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toastContainer';
    container.style.cssText = `
      position:fixed;bottom:24px;left:50%;transform:translateX(-50%);
      z-index:99999;display:flex;flex-direction:column;gap:8px;
      align-items:center;pointer-events:none;min-width:280px;`;
    document.body.appendChild(container);
  }

  const cores = {
    success: { bg: '#065f46', border: '#0e9f6e' },
    error:   { bg: '#991b1b', border: '#e02424' },
    warn:    { bg: '#92400e', border: '#e3a008' },
    info:    { bg: '#1e3a5f', border: '#3b82f6' }
  };
  const c     = cores[tipo] || cores.info;
  const toast = document.createElement('div');
  toast.style.cssText = `
    background:${c.bg};border:2px solid ${c.border};color:#fff;
    padding:10px 20px;border-radius:10px;font-size:13px;font-weight:600;
    font-family:'Inter',sans-serif;box-shadow:0 4px 16px rgba(0,0,0,.3);
    opacity:0;transition:opacity .3s,transform .3s;transform:translateY(10px);
    pointer-events:auto;max-width:360px;text-align:center;
    white-space:pre-wrap;word-break:break-word;`;
  toast.textContent = msg;
  container.appendChild(toast);

  requestAnimationFrame(() => {
    toast.style.opacity   = '1';
    toast.style.transform = 'translateY(0)';
  });
  setTimeout(() => {
    toast.style.opacity   = '0';
    toast.style.transform = 'translateY(10px)';
    setTimeout(() => { if (toast.parentNode) toast.remove(); }, 350);
  }, 3000);
}

/* ══════════════════════════════════════════
   CONFIRMAR (modal genérico)
   ══════════════════════════════════════════ */
function confirmar(msg, opcoes = {}) {
  return new Promise(resolve => {
    const {
      textoBotaoOk       = 'Excluir',
      corBotaoOk         = '#e02424',
      iconeBotaoOk       = '',
      textoBotaoCancelar = 'Cancelar'
    } = opcoes;

    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position:fixed;inset:0;background:rgba(0,0,0,.45);
      z-index:99998;display:flex;align-items:center;justify-content:center`;
    overlay.innerHTML = `
      <div style="background:#fff;border-radius:12px;padding:28px 32px;
        max-width:380px;width:90%;box-shadow:0 8px 32px rgba(0,0,0,.2);
        text-align:center">
        <p style="font-size:15px;font-weight:600;color:#111827;
          margin-bottom:20px">${msg}</p>
        <div style="display:flex;gap:10px;justify-content:center">
          <button id="cfmNo" style="padding:8px 22px;border-radius:8px;
            border:2px solid #e5e7eb;background:#fff;cursor:pointer;
            font-weight:600;font-size:13px;font-family:'Inter',sans-serif">
            ${textoBotaoCancelar}
          </button>
          <button id="cfmYes" style="padding:8px 22px;border-radius:8px;
            border:none;background:${corBotaoOk};color:#fff;cursor:pointer;
            font-weight:700;font-size:13px;font-family:'Inter',sans-serif">
            ${iconeBotaoOk} ${textoBotaoOk}
          </button>
        </div>
      </div>`;
    document.body.appendChild(overlay);
    overlay.querySelector('#cfmYes').onclick = () => {
      document.body.removeChild(overlay); resolve(true);
    };
    overlay.querySelector('#cfmNo').onclick = () => {
      document.body.removeChild(overlay); resolve(false);
    };
  });
}

/* ══════════════════════════════════════════
   HELPER — seta valor em qualquer campo
   ══════════════════════════════════════════ */
function setField(id, valor) {
  const el = document.getElementById(id);
  if (!el) return false;

  if (el.tagName === 'SELECT') {
    const valStr    = String(valor).trim().toLowerCase();
    const valUF     = id === 'estado' && typeof normalizarUF === 'function'
      ? normalizarUF(valor)
      : '';
    let   encontrou = false;
    Array.from(el.options).forEach(opt => {
      const optUF = id === 'estado' && typeof normalizarUF === 'function'
        ? normalizarUF(opt.value || opt.text)
        : '';
      const match =
        opt.value.trim().toLowerCase() === valStr ||
        opt.text.trim().toLowerCase()  === valStr ||
        (valUF && optUF && optUF === valUF);
      opt.selected = match;
      if (match) encontrou = true;
    });
    if (!encontrou) {
      Array.from(el.options).forEach(opt => {
        if (opt.value.trim().toLowerCase().includes(valStr) ||
            opt.text.trim().toLowerCase().includes(valStr)) {
          opt.selected = true;
        }
      });
    }
  } else {
    el.removeAttribute('readonly');
    el.removeAttribute('disabled');
    el.value = String(valor);
  }

  el.dispatchEvent(new Event('input',  { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
  return true;
}

/* ══════════════════════════════════════════
   CONSULTA CNPJ — BrasilAPI
   ✅ Corrigido: id="Contato" com C maiúsculo
   ══════════════════════════════════════════ */
async function consultarCNPJ(cnpj) {
  const numeros = cnpj.replace(/\D/g, '');

  if (numeros.length !== 14) {
    showToast('CNPJ inválido! Digite os 14 dígitos.', 'warn');
    return;
  }

  if (window._buscandoCNPJ) return;
  window._buscandoCNPJ = true;

  try {
    const resp = await apiFetch(`${API_ROOT}/cnpj/${numeros}`);
    const data = await resp.json();

    if (data?.offline) {
      showToast(data.message || 'Consulta de CNPJ indisponível no modo local.', 'warn');
      window._buscandoCNPJ = false;
      return;
    }

    if (!data || data.message) {
      showToast('CNPJ não encontrado.', 'warn');
      window._buscandoCNPJ = false;
      return;
    }

    /* ── Dados básicos ── */
    setField('razaoSocial', data.razao_social || data.nome || '');
    setField('logradouro',  data.logradouro   || '');
    setField('numEndereco', data.numero        || '');
    setField('bairro',      data.bairro        || '');
    setField('cep',         mascaraCEP(data.cep || ''));
    setField('cidade',      data.municipio     || '');
    setField('estado',      data.uf            || '');
    /* ── ✅ E-mail — normaliza para minúsculo ── */
    setField('email', (data.email || '').toLowerCase().trim());

    /* ── ✅ Contato — C maiúsculo igual ao id do HTML ── */
    const contatoEl = document.getElementById('Contato');
    if (contatoEl && !contatoEl.value.trim()) {
      const fantasia = (data.nome_fantasia || '').trim();
      if (fantasia) setField('Contato', fantasia);
    }

    /* ── ✅ Dispara recálculo fiscal após preencher estado ── */
    if (typeof calcTotais           === 'function') calcTotais();
    if (typeof recalcularFiscalForm === 'function') recalcularFiscalForm();

    showToast('✅ Dados preenchidos!', 'success');

  } catch (err) {
    console.error('Erro CNPJ:', err);
    const razao = document.getElementById('razaoSocial')?.value;
    if (!razao) {
      showToast('⚠️ Não foi possível consultar o CNPJ.', 'warn');
    }
  }

  window._buscandoCNPJ = false;
}

/* ── Dispara consulta ao sair do campo CNPJ ── */
document.addEventListener('DOMContentLoaded', () => {
  const cnpjEl = document.getElementById('cnpj');
  if (cnpjEl) {
    cnpjEl.addEventListener('blur', () => {
      if (document.getElementById('operacaoInternacional')?.checked) return;
      const v = cnpjEl.value.replace(/\D/g, '');
      /* ✅ Só consulta CNPJ (14 dígitos) — CPF não consulta API */
      if (v.length === 14) consultarCNPJ(v);
    });
  }
});

/* ══════════════════════════════════════════
   STATUS
   ══════════════════════════════════════════ */
function getStatusLabel(status) {
  const map = {
    pendente : { label: 'Pendente',  color: '#e3a008', bg: '#fefce8' },
    aprovado : { label: 'Aprovado',  color: '#0e9f6e', bg: '#f0fdf4' },
    recusado : { label: 'Recusado',  color: '#e02424', bg: '#fef2f2' },
    cancelado: { label: 'Cancelado', color: '#6b7280', bg: '#f3f4f6' }
  };
  return map[status] || map['pendente'];
}

/* ══════════════════════════════════════════
   UTILITÁRIOS
   ══════════════════════════════════════════ */
function debounce(fn, delay = 300) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

function deepClone(obj) {
  try { return JSON.parse(JSON.stringify(obj)); } catch { return obj; }
}

function truncate(str, max = 80) {
  if (!str) return '';
  return str.length > max ? str.substring(0, max) + '...' : str;
}

function isEmpty(val) {
  return val === null       ||
         val === undefined  ||
         String(val).trim() === '' ||
         val === '—';
}

/* ══════════════════════════════════════════
   EXPORTAR / IMPORTAR
   ══════════════════════════════════════════ */
async function exportarDados() {
  if (!usuarioLocalEhAdmin()) {
    showToast('Apenas Admin pode exportar backup.', 'error');
    return;
  }
  const [orcamentos, vendedores] = await Promise.all([
    getOrcamentos(),
    getVendedoresBackup()
  ]);
  const dados = {
    orcamentos,
    vendedores,
    exportadoEm: new Date().toISOString(),
    versao     : '1.1'
  };
  const blob = new Blob(
    [JSON.stringify(dados, null, 2)],
    { type: 'application/json' }
  );
  const url = URL.createObjectURL(blob);
  const a   = document.createElement('a');
  a.href    = url;
  a.download = `maera_backup_${
    new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')
  }.json`;
  a.click();
  URL.revokeObjectURL(url);
  showToast(
    `✅ Backup exportado: ${orcamentos.length} orçamento(s) e ` +
    `${vendedores.length} vendedor(es).`,
    'success'
  );
}

async function importarDados(file) {
  if (!file) return;
  if (!usuarioLocalEhAdmin()) {
    showToast('Apenas Admin pode restaurar backup.', 'error');
    return;
  }
  const reader = new FileReader();
  reader.onload = async e => {
    try {
      const dados = JSON.parse(e.target.result);
      if (dados.orcamentos && Array.isArray(dados.orcamentos)) {
        const temVendedores = Array.isArray(dados.vendedores);
        const vendedores    = temVendedores ? dados.vendedores : [];
        const textoVendedores = temVendedores
          ? `e <strong>${vendedores.length}</strong> vendedor(es)`
          : `e manter os vendedores atuais`;

        const ok = await confirmar(
          `Importar backup com <strong>${dados.orcamentos.length}</strong> ` +
          `orçamento(s) ${textoVendedores}?<br>` +
          `<span style="font-size:12px;color:#6b7280;font-weight:400">` +
          `Os dados atuais serão substituídos.</span>`,
          {
            textoBotaoOk: 'Importar',
            corBotaoOk: '#0e9f6e',
            iconeBotaoOk: '📥'
          }
        );
        if (!ok) return;

        const salvouOrcamentos = await saveOrcamentos(dados.orcamentos);
        const salvouVendedores = temVendedores
          ? await saveVendedoresBackup(vendedores)
          : true;
        if (!salvouOrcamentos || !salvouVendedores) {
          throw new Error('Falha ao restaurar backup');
        }

        const msgVendedores = temVendedores
          ? `${vendedores.length} vendedor(es)`
          : 'vendedores preservados';
        showToast(
          `✅ Backup importado: ${dados.orcamentos.length} orçamento(s) e ` +
          `${msgVendedores}.`,
          'success'
        );
        setTimeout(() => window.location.reload(), 1000);
      } else {
        showToast('Arquivo inválido!', 'error');
      }
    } catch {
      showToast('Erro ao importar arquivo!', 'error');
    }
  };
  reader.readAsText(file);
}

/* ══════════════════════════════════════════
   EXPORTAR EXCEL
   ══════════════════════════════════════════ */
function excelEscape(valor) {
  return String(valor ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function excelCell(valor, tipo = 'String') {
  const ehNumero = tipo === 'Number' && valor !== '' &&
    valor !== null && valor !== undefined && !isNaN(valor);
  const cellType = ehNumero ? 'Number' : 'String';
  const data     = ehNumero ? Number(valor) : excelEscape(valor);
  return `<Cell><Data ss:Type="${cellType}">${data}</Data></Cell>`;
}

function excelRow(cells, header = false) {
  const style = header ? ' ss:StyleID="Header"' : '';
  return `<Row${style}>${cells.join('')}</Row>`;
}

function excelSheet(nome, headers, rows) {
  const headerRow = excelRow(headers.map(h => excelCell(h)), true);
  const bodyRows  = rows.map(row => excelRow(row)).join('');
  return `
    <Worksheet ss:Name="${excelEscape(nome).slice(0, 31)}">
      <Table>${headerRow}${bodyRows}</Table>
    </Worksheet>`;
}

function getStatusTextoExcel(status) {
  const map = {
    novo: '🆕 Novo',
    em_contato: '📞 Em Contato',
    proposta_enviada: '📋 Proposta Enviada',
    followup_7_dias: '⏳ Follow-up 7 dias',
    followup_15_dias: '⏰ Follow-up 15 dias',
    em_negociacao: '🔄 Em Negociação',
    aguardando_aprovacao: '📝 Aguardando Aprovação',
    ganho: '✅ Ganho',
    perdido: '📉 Perdido',
    reprovado: 'Reprovado',
    cancelado: 'Cancelado',
    sem_verba: 'Sem Verba',
    sem_retorno: 'Sem Retorno',
    timing_ruim: 'Timing Ruim',
    negociacao_nao_evoluiu: 'Negociação não evoluiu',
    ficha_reprovada: 'Ficha Reprovada',
    concorrente_preco: 'Concorrente - Preço',
    concorrente_prazo: 'Concorrente - Prazo',
    concorrente_motivo_nao_declarado: 'Concorrente - Motivo não declarado',
    concorrente_outros: 'Concorrente - Outros'
  };
  return map[status] || status || 'Novo';
}

function getResumoValoresExcel(orcamento) {
  const subtotal = (orcamento.itens || []).reduce((acc, item) => {
    const totalItem = Number(item.total);
    if (!isNaN(totalItem)) return acc + totalItem;
    return acc + ((Number(item.qtd) || 0) * (Number(item.valorUnit) || 0));
  }, 0);

  const desconto = orcamento.descontoGlobal || {};
  let descontoValor = 0;
  if (desconto.tipo === 'fixo') {
    descontoValor = Math.min(Number(desconto.valor) || 0, subtotal);
  } else {
    descontoValor = subtotal * ((Number(desconto.valor) || 0) / 100);
  }

  return {
    subtotal,
    descontoValor,
    totalFinal: Math.max(0, subtotal - descontoValor)
  };
}

async function exportarExcel() {
  try {
    if (!usuarioLocalEhAdmin()) {
      showToast('Apenas Admin pode exportar Excel.', 'error');
      return;
    }
    const [orcamentos, vendedores] = await Promise.all([
      getOrcamentos(),
      getVendedoresBackup()
    ]);

    const linhasOrcamentos = orcamentos.map(o => {
      const valores = getResumoValoresExcel(o);
      return [
        excelCell(o.numero),
        excelCell(o.razaoSocial),
        excelCell(o.cnpj),
        excelCell(o.Contato || o.contato),
        excelCell(o.email),
        excelCell(o.telefone),
        excelCell(o.vendedor),
        excelCell(formatDateBR(o.emissao)),
        excelCell(formatDateBR(o.validoAte)),
        excelCell(getStatusTextoExcel(o.status)),
        excelCell(o.estado),
        excelCell(o.cidade),
        excelCell(o.operacaoInternacional ? 'Internacional' : 'Brasil'),
        excelCell(o.pais),
        excelCell(o.taxId),
        excelCell(o.moeda || 'BRL'),
        excelCell(o.cotacaoDolar, 'Number'),
        excelCell(o.incoterm),
        excelCell(valores.subtotal, 'Number'),
        excelCell(valores.descontoValor, 'Number'),
        excelCell(valores.totalFinal, 'Number'),
        excelCell(o.criadoEm || ''),
        excelCell(o.atualizadoEm || '')
      ];
    });

    const linhasItens = [];
    orcamentos.forEach(o => {
      (o.itens || []).forEach((item, idx) => {
        linhasItens.push([
          excelCell(o.numero),
          excelCell(o.razaoSocial),
          excelCell(idx + 1, 'Number'),
          excelCell(item.descricao),
          excelCell(item.qtd, 'Number'),
          excelCell(item.und),
          excelCell(item.valorUnit, 'Number'),
          excelCell(item.total, 'Number'),
          excelCell(item.prazoSC),
          excelCell(item.prazoCC)
        ]);
      });
    });

    const linhasVendedores = vendedores.map(vendedor => [
      excelCell(typeof vendedor === 'string' ? vendedor : vendedor.nome),
      excelCell(typeof vendedor === 'string' ? '' : vendedor.login),
      excelCell(typeof vendedor === 'string' ? 'Vendedor' : (vendedor.master ? 'Admin' : 'Vendedor'))
    ]);

    const workbook = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook
  xmlns="urn:schemas-microsoft-com:office:spreadsheet"
  xmlns:o="urn:schemas-microsoft-com:office:office"
  xmlns:x="urn:schemas-microsoft-com:office:excel"
  xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
  <Styles>
    <Style ss:ID="Header">
      <Font ss:Bold="1" ss:Color="#FFFFFF"/>
      <Interior ss:Color="#F24105" ss:Pattern="Solid"/>
    </Style>
  </Styles>
  ${excelSheet('Orçamentos', [
    'Número', 'Razão Social', 'CNPJ / CPF', 'Nome do Contato',
    'E-mail', 'WhatsApp', 'Vendedor',
    'Emissão', 'Válido até', 'Status', 'Estado', 'Cidade',
    'Operação', 'País', 'Tax ID / VAT', 'Moeda', 'Cotação USD', 'Incoterm',
    'Subtotal', 'Desconto', 'Total Final', 'Criado em', 'Atualizado em'
  ], linhasOrcamentos)}
  ${excelSheet('Itens', [
    'Orçamento', 'Cliente', 'Item', 'Descrição', 'Qtd', 'Und',
    'Valor Unitário', 'Total', 'Sem Calib.', 'Com Calib.'
  ], linhasItens)}
  ${excelSheet('Vendedores', ['Nome', 'Login', 'Perfil'], linhasVendedores)}
</Workbook>`;

    const blob = new Blob([workbook], {
      type: 'application/vnd.ms-excel;charset=utf-8'
    });
    const url = URL.createObjectURL(blob);
    const a   = document.createElement('a');
    a.href    = url;
    a.download = `maera_excel_${
      new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')
    }.xls`;
    a.click();
    URL.revokeObjectURL(url);

    showToast(
      `✅ Excel exportado: ${orcamentos.length} orçamento(s), ` +
      `${linhasItens.length} item(ns) e ${vendedores.length} vendedor(es).`,
      'success'
    );
  } catch (err) {
    console.error('exportarExcel:', err);
    showToast('Erro ao exportar para Excel.', 'error');
  }
}
