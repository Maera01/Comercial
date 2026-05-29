/* ============================================
   MAERA – SIMULADOR UI | SIMULADOR-UI.JS
   ============================================ */

let _destCartao          = null;
let _destBoleto          = null;
let _totalAtualSimulacao = 0;
let _beneficiosCartao    = {};
let _tipoCondicaoPagamento = 'padrao';
let _CondiçõesPersonalizadas = [];

function _getDifalAplicavel() {
  const estado = document.getElementById('estado')?.value || '';
  const ehMG = typeof isEstadoMinasGerais === 'function'
    ? isEstadoMinasGerais(estado)
    : String(estado || '').trim().toUpperCase() === 'MG';
  return ehMG ? 0 : (window.difalVal || 0);
}

function _beneficioOpcoesCartao(texto) {
  if (!texto || !/(^|\s)ou(\s|$)/i.test(texto)) return [];
  return texto.split(/\s+ou\s+/i).map(op => op.trim()).filter(Boolean);
}

function _getBeneficioCartao(linha) {
  const opcoes = _beneficioOpcoesCartao(linha.b);
  if (!opcoes.length) return linha.b || '';
  const salvo = _beneficiosCartao?.[linha.p];
  return opcoes.includes(salvo) ? salvo : opcoes[0];
}

function _renderBeneficioCartao(linha, compact = false) {
  const opcoes = _beneficioOpcoesCartao(linha.b);
  if (!linha.b) return '—';

  if (!opcoes.length) {
    return `<span style="background:#d1fae5;color:#065f46;padding:${compact ? '4px 10px' : '2px 8px'};
      border-radius:8px;font-size:${compact ? '11px' : '10px'};font-weight:600">🎁 ${linha.b}</span>`;
  }

  const atual = _getBeneficioCartao(linha);
  return `<select class="select-beneficio-cartao" data-parcelas="${linha.p}"
      style="max-width:${compact ? '100%' : '260px'};width:${compact ? '100%' : 'auto'};
        border:1px solid #a7f3d0;background:#ecfdf5;color:#065f46;
        border-radius:8px;padding:${compact ? '7px 9px' : '3px 8px'};
        font-size:${compact ? '12px' : '10.5px'};font-weight:700;outline:none">
      ${opcoes.map(op => `<option value="${op}" ${op === atual ? 'selected' : ''}>🎁 ${op}</option>`).join('')}
    </select>`;
}

function _bindBeneficiosCartao(root) {
  root.querySelectorAll('.select-beneficio-cartao').forEach(sel => {
    sel.addEventListener('click', e => e.stopPropagation());
    sel.addEventListener('change', e => {
      e.stopPropagation();
      _beneficiosCartao[sel.dataset.parcelas] = sel.value;
      recalcularSimulacao();
    });
  });
}

/* ── Tabelas locais ──────────────────────── */
const _TC = [
  { p:12, d: 0, b:'' },
  { p:11, d: 1, b:'' },
  { p:10, d: 2, b:'' },
  { p: 9, d: 3, b:'Treinamento ou desconto' },
  { p: 8, d: 4, b:'Treinamento ou desconto' },
  { p: 7, d: 5, b:'Treinamento ou desconto' },
  { p: 6, d: 6, b:'Treinamento + desconto \nou Mochila + desconto' },
  { p: 5, d: 7, b:'Treinamento + desconto \nou Mochila + desconto' },
  { p: 4, d: 8, b:'Treinamento + desconto \nou Mochila + desconto' },
  { p: 3, d: 9, b:'Treinamento + desconto \nou Mochila + desconto' },
  { p: 2, d:10, b:'Treinamento + desconto \nou Mochila + desconto' },
  { p: 1, d:11, b:'Treinamento + desconto \nou Mochila + desconto' }
];

const _TB = [
  { s:90, p:6,  d:12 },
  { s:80, p:6,  d:10 },
  { s:70, p:6,  d: 8 },
  { s:60, p:8,  d: 6 },
  { s:50, p:8,  d: 4 },
  { s:40, p:10, d: 2 },
  { s:30, p:10, d: 0 }
];

/* ══════════════════════════════════════════
   PONTO DE ENTRADA — chamado pelo novo.js
   ══════════════════════════════════════════ */
function onTotalAtualizado(totalComDifal, totalBaseSimulacao) {
  _totalAtualSimulacao = totalBaseSimulacao || totalComDifal || 0;

  const totalSemDifal = window.totalSemDifal || totalComDifal;
  const baseSimulacao = window.totalBaseSimulacao || totalBaseSimulacao || totalSemDifal;
  const subtotalBrutoItens = window.totalItensOrcamentoSemDifal || baseSimulacao;

  const elTotal = document.getElementById('totalParaSimulacao');
  if (elTotal) elTotal.textContent = formatMoeda(subtotalBrutoItens);

  recalcularSimulacao();
}

/* ══════════════════════════════════════════
   RECALCULAR TUDO
   ══════════════════════════════════════════ */
function recalcularSimulacao() {
  const internacional = isPagamentoInternacional();
  const totalSemDifal = window.totalSemDifal || _totalAtualSimulacao;
  const baseSimulacao = window.totalBaseSimulacao || _totalAtualSimulacao || totalSemDifal;
  const baseItensSemDifal = window.totalItensOrcamentoSemDifal || baseSimulacao;
  const negociacao    = _getDescontoNegociacao(baseItensSemDifal);
  const baseNegociada = negociacao.total;
  const ehNaoContrib  = document.getElementById('contribuinte')?.value === 'nao';
  const difalVal      = _getDifalAplicavel();
  const totalPixSemDifal = totalSemDifal || baseSimulacao;
  const descontoPix = Math.max(0, baseItensSemDifal - totalPixSemDifal);
  const descontoPixPerc = baseItensSemDifal > 0 ? descontoPix * 100 / baseItensSemDifal : 0;
  const descontoPixTxt = descontoPix > 0
    ? `${formatPercentualSim(descontoPixPerc)} (${formatMoeda(descontoPix)})`
    : '-';
  const descontoNegTxt = negociacao.desconto > 0
    ? (negociacao.tipo === 'perc'
      ? `${formatPercentualSim(negociacao.valor)} (${formatMoeda(negociacao.desconto)})`
      : formatMoeda(negociacao.desconto))
    : '';

  _renderDescontoNegociacao(negociacao);

  /* ── PIX ── */
  const chkPix = document.getElementById('sim_chk_pix');
  const pixEl  = document.getElementById('bloco_pix');
  if (pixEl) pixEl.style.opacity = (chkPix && chkPix.checked) ? '1' : '0.4';

  const valorFinalEl = document.getElementById('sim_res_pix_total');
  const descEl       = document.getElementById('sim_res_pix_desc');
  const tituloPixEl  = document.getElementById('sim_pix_titulo') ||
    document.querySelector('#sim_chk_pix + span');
  if (tituloPixEl) {
    tituloPixEl.textContent = internacional ? 'Pagamento à vista' : '💰 PIX — À Vista';
  }

  if (totalPixSemDifal > 0) {
    const valorFinal = totalPixSemDifal;
    const difalHTML = !internacional && difalVal > 0 ? `<div style="margin-top:4px;color:#c2410c;font-weight:700">
      DIFAL aproximado à parte: + ${formatMoeda(difalVal)}
    </div>` : '';
    const descontoPixHTML = descontoPix > 0
      ? `<strong>Desconto aplicado:</strong> ${descontoPixTxt}<br>`
      : '';
    let descricaoHTML = `
      ${descontoPixHTML}
      Valor à vista calculado pelo total dos itens do orçamento, sem o DIFAL.
      ${difalHTML}
    `;
    if (internacional) {
      descricaoHTML = `
        ${descontoPixHTML}
        Valor à vista calculado pelo total dos itens do orçamento.
      `;
    }

    if (valorFinalEl) valorFinalEl.textContent = formatMoeda(valorFinal);

    if (descEl) {
      descEl.innerHTML = descricaoHTML;
    } else {
      const altDesc = document.querySelector('#bloco_pix p, #bloco_pix .desc, #bloco_pix .text-muted');
      if (altDesc) altDesc.innerHTML = descricaoHTML;
    }

  } else {
    if (valorFinalEl) valorFinalEl.textContent = 'R$ 0,00';
    if (descEl)       descEl.textContent = 'Valor à vista calculado pelo total dos itens do orçamento, sem o DIFAL.';
    if (descEl && internacional) descEl.textContent = 'Valor à vista calculado pelo total dos itens do orçamento.';
  }

  /* ── AVISO DIFAL NO CARTÃO ── */
  const avisoCartao = document.getElementById('aviso_difal_cartao');
  const avisoValor  = document.getElementById('aviso_difal_cartao_valor');

  if (avisoCartao) {
    const mostrar = ehNaoContrib && difalVal > 0 && baseNegociada > 0;
    avisoCartao.style.display = mostrar ? 'block' : 'none';
    if (avisoValor && mostrar) {
      avisoValor.textContent = formatMoeda(difalVal);
    }
  }

  aplicarPagamentoInternacional();

  _renderCartao(baseNegociada);
  _renderCartaoMobile(baseNegociada);
  _renderBoleto(baseNegociada);
  _renderBoletoMobile(baseNegociada);
  _renderCondiçõesPersonalizadas(baseNegociada);
  _renderResumo(baseNegociada, totalPixSemDifal);
  _renderResumoMobile(baseNegociada, totalPixSemDifal);
}

function aplicarPagamentoInternacional() {
  const internacional = isPagamentoInternacional();
  const tituloPixEl = document.getElementById('sim_pix_titulo') ||
    document.querySelector('#sim_chk_pix + span');
  const descEl = document.getElementById('sim_res_pix_desc');

  if (!internacional) return;

  if (tituloPixEl) {
    tituloPixEl.textContent = 'Pagamento à vista';
  }

  if (descEl) {
    const descontoEl = descEl.querySelector('strong');
    const descontoTxt = descontoEl
      ? `<strong>${descontoEl.textContent}</strong> ${descontoEl.nextSibling?.textContent || ''}`.trim()
      : '';
    descEl.innerHTML = `${descontoTxt ? `${descontoTxt}<br>` : ''}
      Valor à vista calculado pelo total dos itens do orçamento.`;
  }
}

function isPagamentoInternacional() {
  const marcado = typeof isOperacaoInternacional === 'function' && isOperacaoInternacional();
  const moeda = String(document.getElementById('moeda')?.value || window.moedaAtual || '').toUpperCase();
  return marcado || (!!moeda && moeda !== 'BRL');
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('operacaoInternacional')
    ?.addEventListener('change', aplicarPagamentoInternacional);
  document.getElementById('moeda')
    ?.addEventListener('change', aplicarPagamentoInternacional);
  aplicarPagamentoInternacional();
});

function formatPercentualSim(valor) {
  const n = Math.round((parseFloat(valor) || 0) * 100) / 100;
  return n.toLocaleString('pt-BR', {
    minimumFractionDigits: Number.isInteger(n) ? 0 : 2,
    maximumFractionDigits: 2
  }) + '%';
}

function _getDescontoNegociacao(base) {
  const tipoEl  = document.getElementById('sim_tipo_desconto_negociacao');
  const valorEl = document.getElementById('sim_valor_desconto_negociacao');
  const tipo    = tipoEl?.value === 'fixo' ? 'fixo' : 'perc';
  const valor   = Math.max(0, parseFloat(valorEl?.value) || 0);

  let desconto = 0;
  if (base > 0) {
    desconto = tipo === 'fixo'
      ? Math.min(valor, base)
      : base * Math.min(valor, 100) / 100;
  }

  return {
    tipo,
    valor,
    base,
    desconto,
    total: Math.max(0, base - desconto)
  };
}

function _renderDescontoNegociacao(negociacao) {
  const baseEl = document.getElementById('sim_base_negociada');
  const infoEl = document.getElementById('sim_desc_negociacao_info');

  if (baseEl) baseEl.textContent = formatMoeda(negociacao.total);

  if (!infoEl) return;
  if (negociacao.desconto > 0) {
    const label = negociacao.tipo === 'fixo'
      ? formatMoeda(negociacao.desconto)
      : `${negociacao.valor}% (${formatMoeda(negociacao.desconto)})`;
    infoEl.textContent = `Aplicado: ${label}`;
  } else {
    infoEl.textContent = 'Sem desconto adicional';
  }
}

function _parseNumeroSim(valor) {
  if (typeof valor === 'number') return Number.isFinite(valor) ? valor : 0;
  return parseFloat(String(valor || '').replace(/\./g, '').replace(',', '.')) || 0;
}

function _getCampoValor(id, padrao = '') {
  const el = document.getElementById(id);
  return el ? el.value : padrao;
}

function _calcularCondicaoPersonalizada(Condição, totalBase) {
  const parcelas = Math.max(1, parseInt(Condição.parcelas, 10) || 1);
  const entrada = Math.max(0, Math.min(_parseNumeroSim(Condição.entrada), totalBase || 0));
  const ajusteTipo = Condição.ajusteTipo || 'nenhum';
  const ajusteValor = Math.max(0, _parseNumeroSim(Condição.ajusteValor));
  const fator = ajusteTipo === 'desconto'
    ? 1 - Math.min(ajusteValor, 100) / 100
    : ajusteTipo === 'juros'
      ? 1 + ajusteValor / 100
      : 1;
  const totalFinal = Math.max(0, (totalBase || 0) * fator);
  const saldo = Math.max(0, totalFinal - entrada);
  return {
    parcelas,
    entrada,
    intervalo: Math.max(1, parseInt(Condição.intervalo, 10) || 30),
    ajusteTipo,
    ajusteValor,
    totalFinal,
    saldo,
    valorParcela: parcelas > 0 ? saldo / parcelas : 0
  };
}

function _descricaoCondicaoPersonalizada(Condição, totalBase) {
  const c = _calcularCondicaoPersonalizada(Condição, totalBase);
  const forma = Condição.forma || 'Condição personalizada';
  const entradaTxt = c.entrada > 0 ? `Entrada ${formatMoeda(c.entrada)} + ` : '';
  const obsTxt = String(Condição.obs || '').trim();
  const ajusteTxt = c.ajusteTipo === 'desconto' && c.ajusteValor > 0
    ? `Desconto ${formatPercentualSim(c.ajusteValor)}`
    : c.ajusteTipo === 'juros' && c.ajusteValor > 0
      ? `Juros ${formatPercentualSim(c.ajusteValor)}`
      : '-';
  return {
    forma,
    principal: `${forma} - ${entradaTxt}${c.parcelas}x de ${formatMoeda(c.valorParcela)}`,
    detalhe: `${ajusteTxt} | intervalo de ${c.intervalo} dias | total ${formatMoeda(c.totalFinal)}${obsTxt ? ` | ${obsTxt}` : ''}`,
    calculo: c
  };
}

function atualizarCondicaoPersonalizadaUI() {
  const tipoEl = document.getElementById('sim_tipo_condicao');
  _tipoCondicaoPagamento = tipoEl?.value === 'personalizada' ? 'personalizada' : 'padrao';
  const box = document.getElementById('sim_custom_box');
  if (box) box.style.display = _tipoCondicaoPagamento === 'personalizada' ? 'block' : 'none';
  recalcularSimulacao();
}

function adicionarCondicaoPersonalizada() {
  const parcelas = Math.max(1, parseInt(_getCampoValor('sim_custom_parcelas', '1'), 10) || 1);
  const Condição = {
    id: `custom_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    forma: _getCampoValor('sim_custom_forma', 'Cartao de credito'),
    parcelas,
    entrada: _parseNumeroSim(_getCampoValor('sim_custom_entrada', '0')),
    intervalo: Math.max(1, parseInt(_getCampoValor('sim_custom_intervalo', '30'), 10) || 30),
    ajusteTipo: _getCampoValor('sim_custom_ajuste_tipo', 'nenhum'),
    ajusteValor: _parseNumeroSim(_getCampoValor('sim_custom_ajuste_valor', '0')),
    obs: _getCampoValor('sim_custom_obs', '').trim()
  };
  _tipoCondicaoPagamento = 'personalizada';
  const tipoEl = document.getElementById('sim_tipo_condicao');
  if (tipoEl) tipoEl.value = 'personalizada';
  _CondiçõesPersonalizadas.push(Condição);
  atualizarCondicaoPersonalizadaUI();
}

function removerCondicaoPersonalizada(id) {
  _CondiçõesPersonalizadas = _CondiçõesPersonalizadas.filter(item => item.id !== id);
  recalcularSimulacao();
}

function _renderCondiçõesPersonalizadas(totalBase) {
  const lista = document.getElementById('sim_custom_lista');
  if (!lista) return;
  if (!_CondiçõesPersonalizadas.length) {
    lista.innerHTML = `<div style="font-size:12px;color:#9ca3af;font-style:italic">
      Nenhuma Condição personalizada adicionada.
    </div>`;
    return;
  }
  lista.innerHTML = _CondiçõesPersonalizadas.map(Condição => {
    const desc = _descricaoCondicaoPersonalizada(Condição, totalBase);
    return `
      <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;
        border:1px solid #e5e7eb;border-radius:8px;padding:8px 10px;margin-bottom:6px;background:#f9fafb">
        <div>
          <div style="font-size:12px;font-weight:800;color:#374151">${desc.principal}</div>
          <div style="font-size:11px;color:#6b7280;margin-top:2px">${desc.detalhe}</div>
        </div>
        <button type="button" onclick="removerCondicaoPersonalizada('${Condição.id}')"
          style="background:#fee2e2;color:#991b1b;border:none;border-radius:7px;padding:6px 9px;
          font-size:11px;font-weight:800;cursor:pointer">Remover</button>
      </div>`;
  }).join('');
}

/* ══════════════════════════════════════════
   RENDER CARTÃO — DESKTOP
   ══════════════════════════════════════════ */
function _renderCartao(t) {
  const tbody = document.getElementById('tbodyCartao');
  if (!tbody) return;
  tbody.innerHTML = '';

  _TC.forEach((linha, idx) => {
    const descVal = t > 0 ? t * linha.d / 100 : 0;
    const totVal  = t > 0 ? t - descVal        : 0;
    const parcVal = totVal > 0 ? totVal / linha.p : 0;
    const isSel   = _destCartao === linha.p;
    const bgNorm  = idx % 2 === 0 ? '#f9fafb' : '#fff';
    const bg      = isSel ? 'rgba(255,107,44,.12)' : bgNorm;

    const tr = document.createElement('tr');
    tr.style.cssText = `background:${bg};transition:background .18s;cursor:pointer`;

    tr.addEventListener('mouseover', () => { tr.style.background = 'rgba(255,107,44,.06)'; });
    tr.addEventListener('mouseout',  () => { tr.style.background = isSel ? 'rgba(255,107,44,.12)' : bgNorm; });
    tr.addEventListener('click',     () => _destacarC(linha.p));

    tr.innerHTML = `
      <td style="padding:8px 10px;text-align:center;font-weight:800;
        color:${isSel ? 'var(--primary)' : '#374151'}">
        ${linha.p}x
        ${isSel
          ? `<span style="font-size:9px;background:var(--primary);color:#fff;
               padding:1px 6px;border-radius:10px;margin-left:4px">★ ESCOLHIDA</span>`
          : ''}
   <td style="padding:8px 10px;text-align:center;color:#0e9f6e;font-weight:700">
  ${linha.d > 0 ? `${linha.d}%` : '—'}
</td>
      <td style="padding:8px 10px;text-align:right;font-weight:700;color:#374151">
        ${t > 0 ? formatMoeda(totVal) : '—'}
      </td>
      <td style="padding:8px 10px;text-align:right;font-weight:800;
        font-size:13px;color:${isSel ? 'var(--primary)' : '#374151'}">
        ${t > 0 ? formatMoeda(parcVal) : '—'}
      </td>
      <td style="padding:8px 10px;text-align:center;font-size:10.5px;color:#6b7280">
        ${linha.b
          ? `<span style="background:#d1fae5;color:#065f46;padding:2px 8px;
               border-radius:10px;font-size:10px">🎁 ${linha.b}</span>`
          : '—'}
      </td>
      <td style="padding:8px 10px;text-align:center">
        <button style="background:${isSel ? 'var(--primary)' : '#e5e7eb'};
          color:${isSel ? '#fff' : '#6b7280'};border:none;border-radius:6px;
          padding:4px 10px;cursor:pointer;font-size:11px;font-weight:700;
          transition:all .18s;white-space:nowrap">
          ${isSel ? '★ Escolhida' : 'Destacar'}
        </button>
      </td>`;

    if (tr.children[4]) tr.children[4].innerHTML = _renderBeneficioCartao(linha);

    tr.querySelector('button').addEventListener('click', e => {
      e.stopPropagation();
      _destacarC(linha.p);
    });
    _bindBeneficiosCartao(tr);

    tbody.appendChild(tr);
  });
}

/* ══════════════════════════════════════════
   RENDER CARTÃO — MOBILE CARDS
   ══════════════════════════════════════════ */
function _renderCartaoMobile(t) {
  const container = document.getElementById('cardsCartaoMobile');
  if (!container) return;
  container.innerHTML = '';

  _TC.forEach(linha => {
    const descVal = t > 0 ? t * linha.d / 100 : 0;
    const totVal  = t > 0 ? t - descVal        : 0;
    const parcVal = totVal > 0 ? totVal / linha.p : 0;
    const isSel   = _destCartao === linha.p;

    const card = document.createElement('div');
    card.className = 'sim-card-linha' + (isSel ? ' selecionada-cartao' : '');

    card.innerHTML = `
      <div class="sim-card-linha-top">
        <span class="sim-card-parcela ${isSel ? 'ativa' : ''}">
          ${linha.p}x ${t > 0 ? formatMoeda(parcVal) : '—'}
        </span>
        ${isSel ? `<span class="sim-card-badge-escolhida">★ ESCOLHIDA</span>` : ''}
      </div>

      <div class="sim-card-grid">
        <div class="sim-card-campo">
          <span class="sim-card-label">Desconto</span>
          <span class="sim-card-valor desconto">
  ${linha.d > 0 ? `${linha.d}%` : '—'}
</span>
        </div>
        <div class="sim-card-campo">
          <span class="sim-card-label">Total</span>
          <span class="sim-card-valor">${t > 0 ? formatMoeda(totVal) : '—'}</span>
        </div>
        ${linha.b ? `
        <div class="sim-card-campo" style="grid-column:span 2">
          <span class="sim-card-label">Benefício</span>
          <span class="sim-card-beneficio">🎁 ${linha.b}</span>
        </div>` : ''}
      </div>

      <button class="sim-card-btn ${isSel ? 'ativo' : ''}">
        ${isSel ? '★ Condição escolhida — toque para desmarcar' : 'Destacar esta condição'}
      </button>`;

    card.addEventListener('click', () => _destacarC(linha.p));
    const beneficioSlot = card.querySelector('.sim-card-beneficio');
    if (beneficioSlot) beneficioSlot.outerHTML = _renderBeneficioCartao(linha, true);
    card.querySelector('button').addEventListener('click', e => {
      e.stopPropagation();
      _destacarC(linha.p);              // ✅ Bug 2 corrigido — parêntese extra removido
    });

    _bindBeneficiosCartao(card);
    container.appendChild(card);
  });
}                                      
/* ══════════════════════════════════════════
   RENDER BOLETO — DESKTOP ✅ CORRIGIDO
   ══════════════════════════════════════════ */
function _renderBoleto(t) {
  const ehNaoContrib = document.getElementById('contribuinte')?.value === 'nao';
  const difalVal     = _getDifalAplicavel();
  const tbody        = document.getElementById('tbodyBoleto');
  if (!tbody) return;
  tbody.innerHTML = '';

  _TB.forEach((linha, idx) => {

    // ✅ 1 — Desconto e total limpos
    const descVal   = t > 0 ? t * linha.d / 100 : 0;
    const totVal    = t > 0 ? t - descVal        : 0;

    // ✅ 2 — Sinal puro (sem DIFAL)
    const sinalBase = totVal > 0 ? totVal * linha.s / 100 : 0;

    // ✅ 3 — Parcelas calculadas ANTES do DIFAL
    const restoVal  = totVal > 0 ? totVal - sinalBase : 0;
    const parcVal   = restoVal > 0 && linha.p > 0 ? restoVal / linha.p : 0;

    // ✅ 4 — DIFAL somado apenas para exibição do sinal
    const sinalExibido = ehNaoContrib && difalVal > 0
      ? sinalBase + difalVal
      : sinalBase;

    const keyId  = `${linha.s}_${linha.d}`;
    const isSel  = _destBoleto === keyId;
    const bgNorm = idx % 2 === 0 ? '#f9fafb' : '#fff';
    const bg     = isSel ? 'rgba(249,115,22,.1)' : bgNorm;

    const tr = document.createElement('tr');
    tr.style.cssText = `background:${bg};transition:background .18s;cursor:pointer`;

    tr.addEventListener('mouseover', () => { tr.style.background = 'rgba(249,115,22,.06)'; });
    tr.addEventListener('mouseout',  () => { tr.style.background = isSel ? 'rgba(249,115,22,.1)' : bgNorm; });
    tr.addEventListener('click',     () => _destacarB(keyId));

    tr.innerHTML = `
      <td style="padding:8px 10px;text-align:center;font-weight:800;
        color:${isSel ? '#c2410c' : '#374151'}">
        ${linha.s}%
        ${isSel
          ? `<span style="font-size:9px;background:#F24105;color:#fff;
               padding:1px 6px;border-radius:10px;margin-left:4px">★ ESCOLHIDA</span>`
          : ''}
      </td>
      <td style="padding:8px 10px;text-align:right;font-weight:800;
        color:${isSel ? '#c2410c' : '#374151'}">
        ${t > 0
          ? (ehNaoContrib && difalVal > 0
              ? `${formatMoeda(sinalExibido)}
                 <div style="font-size:10px;color:#c2410c">
                   (+ DIFAL ${formatMoeda(difalVal)})
                 </div>`
              : formatMoeda(sinalExibido))
          : '—'}
      </td>
      <td style="padding:8px 10px;text-align:center;font-weight:700;color:#374151">
        ${linha.p} Parcelas
      </td>
      <td style="padding:8px 10px;text-align:right;font-weight:800;
        font-size:13px;color:${isSel ? '#c2410c' : '#374151'}">
        ${t > 0 ? formatMoeda(parcVal) : '—'}
      </td>
     <td style="padding:8px 10px;text-align:center;color:#0e9f6e;font-weight:700">
  ${linha.d > 0 ? `${linha.d}%` : '—'}
</td>
      <td style="padding:8px 10px;text-align:right;font-weight:700;color:#374151">
        ${t > 0 ? formatMoeda(totVal) : '—'}
      </td>
      <td style="padding:8px 10px;text-align:center">
        <button style="background:${isSel ? '#F24105' : '#e5e7eb'};
          color:${isSel ? '#fff' : '#6b7280'};border:none;border-radius:6px;
          padding:4px 10px;cursor:pointer;font-size:11px;font-weight:700;
          transition:all .18s;white-space:nowrap">
          ${isSel ? '★ Escolhida' : 'Destacar'}
        </button>
      </td>`;

    tr.querySelector('button').addEventListener('click', e => {
      e.stopPropagation();
      _destacarB(keyId);
    });

    tbody.appendChild(tr);
  });
}

/* ══════════════════════════════════════════
   RENDER BOLETO — MOBILE CARDS ✅ CORRIGIDO
   ══════════════════════════════════════════ */
function _renderBoletoMobile(t) {
  const ehNaoContrib = document.getElementById('contribuinte')?.value === 'nao';
  const difalVal     = _getDifalAplicavel();
  const container    = document.getElementById('cardsBoletoMobile');
  if (!container) return;
  container.innerHTML = '';

  _TB.forEach((linha, idx) => {

    // ✅ 1 — Desconto e total limpos
    const descVal   = t > 0 ? t * linha.d / 100 : 0;
    const totVal    = t > 0 ? t - descVal        : 0;

    // ✅ 2 — Sinal puro (sem DIFAL)
    const sinalBase = totVal > 0 ? totVal * linha.s / 100 : 0;

    // ✅ 3 — Parcelas calculadas ANTES do DIFAL
    const restoVal  = totVal > 0 ? totVal - sinalBase : 0;
    const parcVal   = restoVal > 0 && linha.p > 0 ? restoVal / linha.p : 0;

    // ✅ 4 — DIFAL somado apenas para exibição do sinal
    const sinalExibido = ehNaoContrib && difalVal > 0
      ? sinalBase + difalVal
      : sinalBase;

    const keyId = `${linha.s}_${linha.d}`;
    const isSel = _destBoleto === keyId;

    const card = document.createElement('div');
    card.className = 'sim-card-linha' + (isSel ? ' selecionada-boleto' : '');
    card.style.borderColor = isSel ? '#F24105' : '';

    card.innerHTML = `
      <div class="sim-card-linha-top">
        <span class="sim-card-parcela ${isSel ? 'ativa-boleto' : ''}">
          ${linha.s}% sinal · ${linha.p}x ${t > 0 ? formatMoeda(parcVal) : '—'}
        </span>
        ${isSel ? `<span class="sim-card-badge-escolhida boleto">★ ESCOLHIDA</span>` : ''}
      </div>

      <div class="sim-card-grid">
        <div class="sim-card-campo">
          <span class="sim-card-label">Valor do Sinal</span>
          <span class="sim-card-valor ${isSel ? 'destaque-boleto' : ''}">
            ${t > 0 ? formatMoeda(sinalExibido) : '—'}
            ${ehNaoContrib && difalVal > 0 && t > 0
              ? `<div style="font-size:10px;color:#c2410c">
                   (+ DIFAL ${formatMoeda(difalVal)})
                 </div>`
              : ''}
          </span>
        </div>
        <div class="sim-card-campo">
          <span class="sim-card-label">Desconto</span>
          <span class="sim-card-valor desconto">
        <span class="sim-card-valor desconto">
       ${linha.d > 0 ? `${linha.d}%` : '—'}</span>
        </div>
        <div class="sim-card-campo">
          <span class="sim-card-label">Total Final</span>
          <span class="sim-card-valor">${t > 0 ? formatMoeda(totVal) : '—'}</span>
        </div>
        <div class="sim-card-campo">
          <span class="sim-card-label">Parcelas</span>
          <span class="sim-card-valor">${linha.p}x</span>
        </div>
      </div>

      <button class="sim-card-btn ${isSel ? 'ativo-boleto' : ''}">
        ${isSel ? '★ Condição escolhida — toque para desmarcar' : 'Destacar esta condição'}
      </button>`;

    card.addEventListener('click', () => _destacarB(keyId));
    card.querySelector('button').addEventListener('click', e => {
      e.stopPropagation();
      _destacarB(keyId);
    });

    container.appendChild(card);
  });
}

/* ══════════════════════════════════════════
   RENDER RESUMO — DESKTOP
   ══════════════════════════════════════════ */
function _renderResumo(t, totalPixSemDifal) {
  const tbody = document.getElementById('tabelaResumoSim');
  if (!tbody) return;
  tbody.innerHTML = '';

  const chkPix    = document.getElementById('sim_chk_pix')?.checked    !== false;
  const chkCartao = document.getElementById('sim_chk_cartao')?.checked !== false;
  const chkBoleto = document.getElementById('sim_chk_boleto')?.checked !== false;

  if ((!t || t <= 0) && (!totalPixSemDifal || totalPixSemDifal <= 0)) {
    tbody.innerHTML = `
      <tr>
        <td colspan="4" style="text-align:center;color:#9ca3af;
          padding:14px;font-style:italic">
          Adicione itens ao orçamento para ver a simulação
        </td>
      </tr>`;
    return;
  }

  const rows = _buildResumoRows(t, totalPixSemDifal, chkPix, chkCartao, chkBoleto);

  if (rows.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="4" style="text-align:center;color:#9ca3af;
          padding:14px;font-style:italic">
          Nenhuma condição selecionada
        </td>
      </tr>`;
    return;
  }

  rows.forEach(r => {
    tbody.innerHTML += `
      <tr style="background:${r.bg}">
        <td style="padding:8px 12px;font-weight:700;color:${r.cor}">${r.icone} ${r.nome}</td>
        <td style="padding:8px 12px;text-align:center;color:#0e9f6e;font-weight:700">${r.desc}</td>
        <td style="padding:8px 12px;text-align:right;font-weight:800;color:${r.cor}">${r.valor}</td>
        <td style="padding:8px 12px;text-align:right;font-size:11px;color:#6b7280">${r.det}</td>
      </tr>`;
  });
}

/* ══════════════════════════════════════════
   RENDER RESUMO — MOBILE CARDS
   ══════════════════════════════════════════ */
function _renderResumoMobile(t, totalPixSemDifal) {
  const container = document.getElementById('resumoCardsMobile');
  if (!container) return;
  container.innerHTML = '';

  const chkPix    = document.getElementById('sim_chk_pix')?.checked    !== false;
  const chkCartao = document.getElementById('sim_chk_cartao')?.checked !== false;
  const chkBoleto = document.getElementById('sim_chk_boleto')?.checked !== false;

  if ((!t || t <= 0) && (!totalPixSemDifal || totalPixSemDifal <= 0)) {
    container.innerHTML = `
      <div style="text-align:center;color:#9ca3af;padding:14px;
        font-style:italic;font-size:13px">
        Adicione itens ao orçamento para ver a simulação
      </div>`;
    return;
  }

  const rows = _buildResumoRows(t, totalPixSemDifal, chkPix, chkCartao, chkBoleto);

  if (rows.length === 0) {
    container.innerHTML = `
      <div style="text-align:center;color:#9ca3af;padding:14px;
        font-style:italic;font-size:13px">
        Nenhuma condição selecionada
      </div>`;
    return;
  }

  rows.forEach(r => {
    container.innerHTML += `
      <div class="sim-resumo-card" style="background:${r.bg}">
        <div class="sim-resumo-card-nome" style="color:${r.cor}">${r.icone} ${r.nome}</div>
        <div class="sim-resumo-card-row">
          <span style="color:#0e9f6e;font-weight:700;font-size:12px">${r.desc}</span>
          <span class="sim-resumo-card-valor" style="color:${r.cor}">${r.valor}</span>
        </div>
        <div style="font-size:11px;color:#6b7280;text-align:right">${r.det}</div>
      </div>`;
  });
}

/* ── Helper compartilhado ── */
function _buildResumoRows(t, totalPixSemDifal, chkPix, chkCartao, chkBoleto) {
  const rows = [];
  const internacional = isPagamentoInternacional();
  const difalVal = _getDifalAplicavel();
  const baseItensSemDifal = window.totalItensOrcamentoSemDifal || t;
  const valorPix = totalPixSemDifal || t;
  const descontoPix = Math.max(0, baseItensSemDifal - valorPix);
  const descontoPixPerc = baseItensSemDifal > 0 ? descontoPix * 100 / baseItensSemDifal : 0;

  if (chkPix) {
    rows.push({
      icone: '💰', nome: internacional ? 'Pagamento à vista' : 'PIX à Vista', cor: '#065f46', bg: '#f0fdf4',
      desc: descontoPix > 0 ? `${formatPercentualSim(descontoPixPerc)} (${formatMoeda(descontoPix)})` : 'Sem desconto',
      valor: formatMoeda(valorPix),
      det: `Total: ${formatMoeda(valorPix)}${!internacional && difalVal > 0 ? `<br><span style="color:#c2410c;font-weight:700">DIFAL aprox. à parte: ${formatMoeda(difalVal)}</span>` : ''}`
    });
  }

  if (chkCartao) {
    if (_destCartao) {
      const linha = _TC.find(l => l.p === _destCartao);
      if (linha) {
        const desc = t * linha.d / 100;
        const tot  = t - desc;
        const parc = tot / linha.p;
        rows.push({
          icone: '💳', nome: `Cartão ${linha.p}x`,
          cor: 'var(--primary)', bg: 'var(--primary-light)',
          desc: `${linha.d > 0 ? `${linha.d}%` : 'Sem desconto'}`,
          valor: `${linha.p}x ${formatMoeda(parc)}`,
          det: `Total: ${formatMoeda(tot)}${_getBeneficioCartao(linha) ? `<br>Benefício: ${_getBeneficioCartao(linha)}` : ''}`
        });
      }
    } else {
      rows.push({
        icone: '💳', nome: 'Cartão de Crédito',
        cor: 'var(--primary)', bg: 'var(--primary-light)',
        desc: 'Destaque a condição preferida ↑', valor: '—', det: '—'
      });
    }
  }

  if (chkBoleto) {
    if (_destBoleto) {
      const [sP] = _destBoleto.split('_').map(Number);
      const linha = _TB.find(l => l.s === sP);
      if (linha) {
        const desc      = t * linha.d / 100;
        const tot       = t - desc;
        const sinalBase = tot * linha.s / 100;
        const resto     = tot - sinalBase;
        const parc      = linha.p > 0 ? resto / linha.p : 0;
        rows.push({
          icone: '📄', nome: `Boleto ${linha.s}% sinal`,
          cor: '#c2410c', bg: '#fff7ed',
          desc: `${linha.d > 0 ? `${linha.d}%` : 'Sem desconto'}`,
          valor: `Sinal ${formatMoeda(sinalBase)}`,
          det: `+ ${linha.p}x ${formatMoeda(parc)}`
        });
      }
    } else {
      rows.push({
        icone: '📄', nome: 'Boleto',
        cor: '#c2410c', bg: '#fff7ed',
        desc: 'Destaque a condição preferida ↑', valor: '—', det: '—'
      });
    }
  }

  if (_tipoCondicaoPagamento === 'personalizada' && _CondiçõesPersonalizadas.length) {
    _CondiçõesPersonalizadas.forEach(Condição => {
      const desc = _descricaoCondicaoPersonalizada(Condição, t);
      rows.push({
        icone: '✎',
        nome: desc.forma,
        cor: '#374151',
        bg: '#f9fafb',
        desc: desc.calculo.ajusteTipo === 'desconto' && desc.calculo.ajusteValor > 0
          ? `Desconto ${formatPercentualSim(desc.calculo.ajusteValor)}`
          : desc.calculo.ajusteTipo === 'juros' && desc.calculo.ajusteValor > 0
            ? `Juros ${formatPercentualSim(desc.calculo.ajusteValor)}`
            : 'Personalizada',
        valor: `${desc.calculo.parcelas}x ${formatMoeda(desc.calculo.valorParcela)}`,
        det: `${desc.calculo.entrada > 0 ? `Entrada ${formatMoeda(desc.calculo.entrada)}<br>` : ''}${desc.calculo.intervalo} dias entre parcelas`
      });
    });
  }

  return rows;
}

/* ══════════════════════════════════════════
   DESTAQUES
   ══════════════════════════════════════════ */
function _destacarC(p) {
  _destCartao = _destCartao === p ? null : p;
  recalcularSimulacao();
}

function _destacarB(keyId) {
  _destBoleto = _destBoleto === keyId ? null : keyId;
  recalcularSimulacao();
}

/* ══════════════════════════════════════════
   TOGGLE SEÇÕES DO DOCUMENTO
   ══════════════════════════════════════════ */
function toggleCardSec(labelId, checked) {
  const lb = document.getElementById(labelId);
  if (!lb) return;
  if (checked) lb.classList.add('checked');
  else         lb.classList.remove('checked');
}

/* ══════════════════════════════════════════
   INICIALIZA AO CARREGAR
   ══════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  requestAnimationFrame(() => {
    [
      'sim_custom_forma',
      'sim_custom_parcelas',
      'sim_custom_entrada',
      'sim_custom_intervalo',
      'sim_custom_ajuste_tipo',
      'sim_custom_ajuste_valor',
      'sim_custom_obs'
    ].forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;
      el.addEventListener('input', recalcularSimulacao);
      el.addEventListener('change', recalcularSimulacao);
    });

    atualizarCondicaoPersonalizadaUI();
    _renderCartao(0);
    _renderCartaoMobile(0);
    _renderBoleto(0);
    _renderBoletoMobile(0);
    _renderCondiçõesPersonalizadas(0);
    _renderResumo(0);
    _renderResumoMobile(0);
  });
});
