/* ============================================
   MAERA – VISUALIZAR ORÇAMENTO | VISUALIZAR.JS
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {
  initLogo();
  carregarOrcamento();
});

/* ══════════════════════════════════════════
   CARREGAR ORÇAMENTO
   ══════════════════════════════════════════ */
async function carregarOrcamento() {
  const params = new URLSearchParams(window.location.search);
  const id     = params.get('id');
  const o      = await getOrcamento(id);

  if (!o) {
    showToast('Orçamento não encontrado!', 'error');
    setTimeout(() => window.location.href = 'index.html', 1500);
    return;
  }

  /* ── Metadados ── */
  document.getElementById('btnEditar').href          = `novo.html?id=${o.id}`;
  document.getElementById('docNumero').textContent   = o.numero;
  document.getElementById('docEmissao').textContent  = formatDateBR(o.emissao);
  document.getElementById('docValidade').textContent = formatDateBR(o.validoAte);
  document.getElementById('docVendedor').textContent = o.vendedor || '—';

    /* ── Cliente ── */
  const setEl = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.textContent = val || '—';
  };

  setEl('dRazaoSocial', o.razaoSocial);
  const internacional = !!o.operacaoInternacional;
  window.moedaAtual = o.moeda || 'BRL';
  window.cotacaoDolarAtual = o.cotacaoDolar || 1;

  /* ✅ Contribuinte — exibe texto amigável */
  const contrib   = String(o.contribuinte || '').toLowerCase().trim();
  const elContrib = document.getElementById('dContribuinte');
  if (elContrib) {
    elContrib.textContent = internacional ? 'Operação Internacional' :
      contrib === 'sim' ? 'Contribuinte de ICMS'     :
      contrib === 'nao' ? 'Não Contribuinte de ICMS' :
      o.contribuinte    || '—';
  }

  setEl('dCnpj', internacional ? (o.taxId || o.cnpj) : o.cnpj);

  /* ✅ Contato — lê com C maiúsculo igual ao id do novo.html */
  const valorContato =
    o.Contato        ||   // ← id="Contato" maiúsculo — CORRETO
    o.contato        ||   // ← fallback minúsculo
    o.nomeContato    ||
    o.responsavel    ||
    '';

  setEl('dContato', valorContato);

  setEl('dLogradouro',       o.logradouro);
  setEl('dNumEndereco',      o.numEndereco);
  setEl('dComplemento',      o.complemento);
  setEl('dBairro',           o.bairro);
  setEl('dCep',              o.cep);
  setEl('dCidade',           o.cidade);
  setEl('dEstado',           o.estado);
  setEl('dInscricaoEstadual',o.inscricaoEstadual);
  setEl('dEmail',         o.email);
  setEl('dTelefone',      o.telefone);
  setEl('dInfoAdicional', o.infoAdicional);

  ['Pais','TaxId','Moeda','Incoterm'].forEach(nome => {
    const row = document.getElementById(`row${nome}`);
    if (row) row.style.display = internacional ? 'block' : 'none';
  });
  setEl('dPais',     o.pais);
  setEl('dTaxId',    o.taxId);
  setEl('dMoeda',    o.moeda || 'BRL');
  const rowCotacaoDolar = document.getElementById('rowCotacaoDolar');
  if (rowCotacaoDolar) rowCotacaoDolar.style.display = 'none';
  setEl('dIncoterm', o.incoterm);


  /* ══════════════════════════════════════════
     ITENS DO ORÇAMENTO
  ══════════════════════════════════════════ */
  const tbody = document.getElementById('docItens');
  tbody.innerHTML = '';

  if (!o.itens || o.itens.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" style="text-align:center;
          color:#6b7280;padding:20px">
          Nenhum item cadastrado.
        </td>
      </tr>`;
} else {
    o.itens.forEach((it, i) => {
      const tr = document.createElement('tr');

      const imgHtml = it.imagem
        ? `<img src="${it.imagem}"
             style="width:64px;height:48px;object-fit:contain;
               border-radius:6px;border:1px solid #f3f4f6;
               background:#ffffff;display:block;margin-bottom:6px"
             onerror="this.style.display='none'"/>`
        : '';

      let descHTML = `
        ${imgHtml}
        <div style="font-weight:700;color:#111827;margin-bottom:3px">
          ${it.descricao || '—'}
        </div>`;

      if (it.acessorios) {
        descHTML += `
          <div style="font-size:10.5px;color:#6b7280;
            line-height:1.5;margin-bottom:2px">
            ${it.acessorios}
          </div>`;
      }

      if (it.adicionais) {
        descHTML += `
          <div style="font-size:10.5px;color:#6b7280;line-height:1.5">
            ${it.adicionais}
          </div>`;
      }

      tr.innerHTML = `
        <td style="text-align:center;font-weight:700;color:#F24105">
          ${i + 1}
        </td>
        <td>${descHTML}</td>
        <td style="text-align:center">${it.qtd || 0}</td>
        <td style="text-align:center">${it.und || '—'}</td>
        <td style="text-align:center">
          ${it.prazoSC || it.prazoSemCalib || '—'}
        </td>
        <td style="text-align:center">
          ${it.prazoCC || it.prazoComCalib || '—'}
        </td>
        <td style="text-align:right;font-weight:700">
          ${formatMoeda(it.valorUnit || it.vlrUnit || 0)}
        </td>
        <td style="text-align:right;font-weight:800;color:#111827">
          ${formatMoeda(it.total || 0)}
        </td>`;

      tbody.appendChild(tr);

      /* ── Aplica fundo branco APÓS inserir no DOM ── */
      const imgEl = tr.querySelector('img');
      if (imgEl) {
        const aplicar = () => aplicarFundoBranco(imgEl);
        if (imgEl.complete && imgEl.naturalWidth > 0) {
          aplicar(); // já carregada (cache)
        } else {
          imgEl.addEventListener('load', aplicar);
        }
      }
    });
  }

  /* ══════════════════════════════════════════
     MOTOR FISCAL
     ✅ Uma única chamada — sem duplicatas
  ══════════════════════════════════════════ */
  const fiscal = internacional
    ? calcularFiscal({ ...o, estado: 'MG', contribuinte: 'nao' })
    : calcularFiscal(o);
  if (internacional) {
    fiscal.difalVal = 0;
    fiscal.aliqDifalPerc = '—';
    fiscal.difalLabel = 'N/A';
    fiscal.difalInfo = 'Operação internacional/exportação — ICMS/DIFAL brasileiro não aplicado.';
    fiscal.resumoFiscal = null;
    fiscal.operacaoInternacional = true;
    fiscal.pais = o.pais;
    fiscal.moeda = o.moeda || 'BRL';
    fiscal.incoterm = o.incoterm || '';
  }
  const ehMG = internacional || (typeof isEstadoMinasGerais === 'function'
    ? isEstadoMinasGerais(o.estado)
    : String(o.estado || '').trim().toUpperCase() === 'MG');
  if (ehMG && !internacional) {
    fiscal.difalVal = 0;
    fiscal.aliqDifalPerc = '—';
    fiscal.difalLabel = 'N/A';
    fiscal.difalInfo = 'Operação interna — sem DIFAL.';
    fiscal.isInterno = true;
    fiscal.operacaoTipo = 'Interna';
  }
  const descontoItensVal = calcularDescontoItensOrcamento(o);
  fiscal.descontoItensVal = descontoItensVal;
  fiscal.totalItensOrcamentoSemDifal = calcularTotalItensOrcamento(o);

  /* ── Expõe globais ANTES de qualquer render ──
     ✅ CORREÇÃO: definir aqui garante que _atualizarAvisoDifalDoc
        leia os valores corretos ao ser chamada no final desta função */
  window._orcContribuinte = o.contribuinte       || '';
  window._orcDifalVal     = fiscal.difalVal      || 0;
  window._orcTotal        = fiscal.total;
  window._orcOperacaoInternacional = internacional;
  window.difalVal         = fiscal.difalVal      || 0;
  window.totalSemDifal    = fiscal.total;
  window.descontoItensVal = descontoItensVal;
  window.totalItensOrcamentoSemDifal = fiscal.totalItensOrcamentoSemDifal;

  /* ── Totais da tabela de itens ── */
  document.getElementById('docSubtotal').textContent =
    formatMoeda(fiscal.subtotal);

  if (fiscal.percDesconto > 0) {
    document.getElementById('docDesconto').textContent =
      `-${parseFloat(fiscal.percDesconto.toFixed(2))}% (${formatMoeda(fiscal.desconto)})`;
    document.getElementById('docDescontoRow').style.display = 'flex';
  } else {
    document.getElementById('docDescontoRow').style.display = 'none';
  }

  /* ── Total exibido: soma DIFAL para não contribuinte ──
     ✅ CORREÇÃO: fiscal.total NÃO inclui DIFAL (vem do calcularFiscal),
        então somamos explicitamente para não contribuinte */
  const ehNaoContrib  = o.contribuinte === 'nao';
  const totalExibido  = !ehMG && ehNaoContrib && fiscal.difalVal > 0
    ? fiscal.total + fiscal.difalVal
    : fiscal.total;

  document.getElementById('docTotal').textContent = formatMoeda(totalExibido);

  /* ✅ Única chamada — tudo centralizado aqui */
  renderDetalhamentoFiscal(fiscal);

  /* ── Observações ── */
  document.getElementById('docObs').innerText = o.observacoes || '';

  /* ══════════════════════════════════════════
     SEÇÕES OPCIONAIS
  ══════════════════════════════════════════ */
  const sec = o.secoes || {};

  mostrarSecao('secDetalhamentoDoc',  sec.detalhamento  !== false);
  mostrarSecao('secCondPagamentoDoc', sec.condPagamento !== false);
  mostrarSecao('secCalibracaoDoc',    sec.calibracao    !== false);
  mostrarSecao('secSoftwareDoc',      sec.software      !== false);
  mostrarSecao('secTreinamentoDoc',   sec.treinamento   !== false);
  mostrarSecao('secDifalDoc',         sec.difal         !== false);
  aplicarTextosInternacionaisDoc(o, fiscal);

  /* ══════════════════════════════════════════
     SIMULADOR DE PAGAMENTO
  ══════════════════════════════════════════ */
  const totalBruto = fiscal.totalItensOrcamentoSemDifal || fiscal.total;
  const totalNegociado = aplicarDescontoNegociacao(totalBruto, o.descontoNegociacao || {});
  const destaques  = o.destaques || {};

  let algumSimulador = false;

  if (sec.pix !== false) {
    renderPix(fiscal.total, fiscal);
    mostrarSecao('secSimuladorPixDoc', true);
    algumSimulador = true;
  }

  if (sec.cartao !== false) {
    window._totalBruto = totalNegociado;
    window._destCartao = destaques.cartao;
    window._destBoleto = destaques.boleto;
    window._beneficiosCartao = destaques.beneficiosCartao || {};
    window._fiscal     = fiscal;
    renderCartaoCompleto(totalNegociado, destaques.cartao, fiscal);
    mostrarSecao('secSimuladorCartaoDoc', true);
    algumSimulador = true;
  }

  if (sec.boleto !== false) {
    renderBoletoCompleto(totalNegociado, destaques.boleto, fiscal);
    mostrarSecao('secSimuladorBoletoDoc', true);
    algumSimulador = true;
  }

  if (o.condicaoPagamento?.tipo === 'personalizada' &&
      Array.isArray(o.condicaoPagamento.personalizadas) &&
      o.condicaoPagamento.personalizadas.length) {
    renderCondiçõesPersonalizadasDoc(totalNegociado, o.condicaoPagamento.personalizadas);
    algumSimulador = true;
  }

  if (algumSimulador) {
    mostrarSecao('secSimuladorDoc', true);
  }

  /* ── Aviso DIFAL no cartão ──
     ✅ CORREÇÃO: chamada direta (sem requestAnimationFrame),
        pois as globais já foram definidas acima e o DOM já está populado */
  if (typeof _atualizarAvisoDifalDoc === 'function') {
    _atualizarAvisoDifalDoc();
  }

  aplicarPdfInternacional(o, fiscal);
}

/* ══════════════════════════════════════════
   DETALHAMENTO FISCAL
   ✅ Usa APENAS os elementos do template HTML
      Sem criar blocos extras — zero duplicatas
   ══════════════════════════════════════════ */
function aplicarFundoBranco(imgEl) {
  const src = imgEl.src;

  // Se for blob, converte para base64 primeiro via fetch
  if (src.startsWith('blob:')) {
    fetch(src)
      .then(r => r.blob())
      .then(blob => new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.readAsDataURL(blob);
      }))
      .then(dataUrl => {
        const tempImg    = new Image();
        tempImg.onload   = () => {
          const c   = document.createElement('canvas');
          c.width   = tempImg.naturalWidth  || 64;
          c.height  = tempImg.naturalHeight || 48;
          const ctx = c.getContext('2d');
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, c.width, c.height);
          ctx.drawImage(tempImg, 0, 0);
          imgEl.src = c.toDataURL('image/png');
        };
        tempImg.src = dataUrl;
      })
      .catch(err => console.error('Erro ao converter blob:', err));
    return;
  }

  // Imagem normal (data: ou http)
  const c   = document.createElement('canvas');
  c.width   = imgEl.naturalWidth  || 64;
  c.height  = imgEl.naturalHeight || 48;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, c.width, c.height);
  try {
    ctx.drawImage(imgEl, 0, 0);
    imgEl.src = c.toDataURL('image/png');
  } catch (err) {
    console.error('Erro no drawImage:', err);
  }
}

function renderDetalhamentoFiscal(f) {

  const set     = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.textContent = val ?? '';
  };
  const setHtml = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.innerHTML = val ?? '';
  };
  const show    = (id, vis) => {
    const el = document.getElementById(id);
    if (el) el.style.display = vis ? 'block' : 'none';
  };

  /* ── Remove qualquer bloco extra gerado anteriormente ── */
  const antigo = document.getElementById('blocoImpostos');
  if (antigo) antigo.remove();

  const r        = f.resumoFiscal;
  const difalVal = f.difalVal || 0;

  /* ══════════════════════════════════════════
     1. GRADE DE TOTAIS (3 colunas)
  ══════════════════════════════════════════ */
  set('docTotalSemDesc',   formatMoeda(f.subtotal || 0));
  set('docDescontoFiscal', formatMoeda(f.desconto || 0));
  set('docTotalFiscal',    formatMoeda(f.total    || 0));

  /* ══════════════════════════════════════════
     2. DIFAL
  ══════════════════════════════════════════ */
  if (difalVal > 0 && !f.isInterno) {
    set('docDifalLabel', formatMoeda(difalVal));
    setHtml('docDifalInfo',
      `DIFAL = Alíq. interna ${r?.destino || '?'} ` +
      `(${r?.aliqInterna || '—'}) – ` +
      `Alíq. interestadual (${r?.aliqInter || '—'}) = ` +
      `${f.aliqDifalPerc || '—'}%`
    );
  } else {
    set('docDifalLabel', 'N/A');
    set('docDifalInfo',  'Operação sem DIFAL');
  }

  /* ══════════════════════════════════════════
     3. FRETE
  ══════════════════════════════════════════ */
  const tipoFrete   = f.operacaoInternacional
    ? (f.incoterm || 'Internacional')
    : (f.tipoFrete || 'CIF');
  const elFrete     = document.getElementById('docTipoFrete');
  const elFreteInfo = document.getElementById('docTipoFreteInfo');

  if (elFrete) {
    elFrete.textContent = tipoFrete;
    elFrete.style.color = f.operacaoInternacional
      ? '#1d4ed8'
      : (tipoFrete === 'CIF' ? '#0e9f6e' : '#e3a008');
  }
  if (elFreteInfo) {
    elFreteInfo.textContent = f.operacaoInternacional
      ? `Export to ${f.pais || 'international customer'}${f.moeda ? ` in ${f.moeda}` : ''}`
      : tipoFrete === 'CIF'
      ? 'Frete por conta do Remetente — MAERA paga o frete'
      : 'Frete por conta do Destinatário — Cliente paga o frete';
  }

  /* ══════════════════════════════════════════
     4. BLOCO OPERAÇÃO (laranja)
        Mostrado apenas quando há operação válida
  ══════════════════════════════════════════ */
  const boxInfo = document.getElementById('boxInfoOperacao');
  const txtInfo = document.getElementById('docInfoOperacao');

  if (f.operacaoInternacional && boxInfo && txtInfo) {
    txtInfo.textContent =
      `International export operation to ${f.pais || 'international customer'} ` +
      `- Brazilian ICMS/DIFAL does not apply.`;
    boxInfo.style.display = 'block';
  } else if (r && r.destino && r.destino !== 'N/I' && boxInfo && txtInfo) {
    txtInfo.textContent =
      `${r.origem} → ${r.destino} | ` +
      `${r.operacao || 'Interestadual'} | ` +
      `Alíq. interestadual: ${r.aliqInter} | ` +
      `Alíq. interna ${r.destino}: ${r.aliqInterna}`;
    show('boxInfoOperacao', true);
  } else {
    show('boxInfoOperacao', false);
  }

  /* ══════════════════════════════════════════
     5. BLOCO ALÍQUOTAS (verde)
        Mostrado apenas quando há operação válida
  ══════════════════════════════════════════ */
  const boxAliq = document.getElementById('boxAliquotas');
  const txtAliq = document.getElementById('docAliquotas');

  if (r && r.destino && r.destino !== 'N/I' && boxAliq && txtAliq) {
    txtAliq.textContent =
      `Interestadual ${r.origem}→${r.destino}: ${r.aliqInter} | ` +
      `Interna ${r.destino}: ${r.aliqInterna}`;
    show('boxAliquotas', true);
  } else {
    show('boxAliquotas', false);
  }

  /* ══════════════════════════════════════════
     6. Exibe a seção inteira
  ══════════════════════════════════════════ */
  show('secDetalhamentoDoc', true);
}


/* ══════════════════════════════════════════
   RENDER PIX
   ✅ Considera DIFAL para não contribuinte
   ══════════════════════════════════════════ */
function calcularDescontoItensOrcamento(orcamento) {
  return (orcamento.itens || []).reduce((acc, item) => {
    const qtd = parseFloat(item.qtd) || 0;
    const unit = parseFloat(item.valorUnit || item.vlrUnit) || 0;
    const bruto = qtd * unit;
    const descItem = item.descItem || {};
    const valor = parseFloat(descItem.valor) || 0;

    if (bruto <= 0 || valor <= 0) return acc;

    return acc + (descItem.tipo === 'fixo'
      ? Math.min(valor, bruto)
      : bruto * valor / 100);
  }, 0);
}

function calcularTotalItensOrcamento(orcamento) {
  return (orcamento.itens || []).reduce((acc, item) => {
    const qtd = parseFloat(item.qtd) || 0;
    const unit = parseFloat(item.valorUnit || item.vlrUnit) || 0;
    const bruto = qtd * unit;
    return acc + (bruto > 0 ? bruto : (parseFloat(item.total) || 0));
  }, 0);
}

function formatPercentualPix(valor) {
  const n = Math.round((parseFloat(valor) || 0) * 100) / 100;
  return n.toLocaleString('pt-BR', {
    minimumFractionDigits: Number.isInteger(n) ? 0 : 2,
    maximumFractionDigits: 2
  }) + '%';
}

function aplicarDescontoNegociacao(base, descontoNegociacao) {
  const tipo = descontoNegociacao?.tipo === 'fixo' ? 'fixo' : 'perc';
  const valor = Math.max(0, parseFloat(descontoNegociacao?.valor) || 0);
  const desconto = tipo === 'fixo'
    ? Math.min(valor, base)
    : base * valor / 100;
  return Math.max(0, base - desconto);
}

function renderPix(totalBruto, fiscal) {
  const valorFinal = totalBruto;
  const internacional = isDocInternacional(fiscal);
  const difalVal = fiscal?.difalVal ?? window._orcDifalVal ?? 0;
  const baseItensSemDifal = fiscal?.totalItensOrcamentoSemDifal || window.totalItensOrcamentoSemDifal || totalBruto;
  const descontoPix = Math.max(0, baseItensSemDifal - valorFinal);
  const descontoPixPerc = baseItensSemDifal > 0 ? descontoPix * 100 / baseItensSemDifal : 0;
  const descontoPixTxt = descontoPix > 0
    ? `${formatPercentualPix(descontoPixPerc)} (${formatMoeda(descontoPix)})`
    : (internacional ? 'No discount' : 'Sem desconto');
  const descontoPixHTML = descontoPix > 0
    ? `<strong>${internacional ? 'Applied' : 'Desconto aplicado'}:</strong> ${descontoPixTxt}<br>`
    : '';
  const descricaoHTML = `<div style="font-size:11px;color:#6b7280">
    ${descontoPixHTML}
    ${internacional
      ? 'Advance payment calculated from the quotation item total.'
      : 'Valor à vista calculado pelo total dos itens do orçamento, sem o DIFAL.'}
    ${!internacional && difalVal > 0 ? `<div style="margin-top:4px;color:#c2410c;font-weight:700">DIFAL aproximado à parte: + ${formatMoeda(difalVal)}</div>` : ''}
  </div>`;

  const el = document.getElementById('simPixBloco');
  if (!el) return;

  el.innerHTML = `
    <div style="background:#f0fdf4;border:2px solid #0e9f6e;
      border-radius:10px;padding:16px 20px">
      <div style="display:flex;align-items:center;
        justify-content:space-between;flex-wrap:wrap;gap:10px">
        <div style="display:flex;align-items:center;gap:10px">
          <span style="font-size:24px">💰</span>
          <div>
            <div style="font-size:12px;font-weight:800;color:#065f46;
              text-transform:uppercase">${internacional ? 'Advance payment' : 'PIX — À Vista'}</div>
            ${descricaoHTML}
          </div>
        </div>
        <div style="text-align:right">
          <div style="font-size:22px;font-weight:900;color:#065f46">
            ${formatMoeda(valorFinal)}
          </div>
        </div>
      </div>
    </div>`;
}

function isDocInternacional(fiscal) {
  const moeda = String(fiscal?.moeda || '').toUpperCase();
  return !!(fiscal?.operacaoInternacional || window._orcOperacaoInternacional || (moeda && moeda !== 'BRL'));
}

function aplicarTextosInternacionaisDoc(o, fiscal) {
  if (!isDocInternacional(fiscal)) return;

  const condPagamento = document.getElementById('secCondPagamentoDoc');
  if (!condPagamento) return;

  const itens = condPagamento.querySelectorAll('.sec-item');
  if (itens[0]) itens[0].style.display = 'none';
  if (itens[1]) {
    itens[1].innerHTML = '<span><strong>💰 ADVANCE PAYMENT</strong> - Full payment required to confirm the order.</span>';
  }
  for (let i = 2; i < itens.length; i++) itens[i].style.display = 'none';
}

function aplicarPdfInternacional(o, fiscal) {
  if (!isDocInternacional(fiscal)) return;

  const setText = (selector, text) => {
    const el = document.querySelector(selector);
    if (el) el.textContent = text;
  };
  const setHtml = (selector, html) => {
    const el = document.querySelector(selector);
    if (el) el.innerHTML = html;
  };
  const setLabel = (id, text) => {
    const row = document.getElementById(id);
    const label = row?.querySelector('.doc-label');
    if (label) label.textContent = text;
  };

  setText('.doc-banner-titulo', 'Commercial Proposal');
  setText('.doc-meta-bar div:nth-child(1) span', 'Issue date: ');
  setText('.doc-meta-bar div:nth-child(2) span', 'Valid until: ');
  setText('.doc-meta-bar div:nth-child(3) span', 'Sales rep: ');

  const titulos = document.querySelectorAll('.doc-section-title');
  if (titulos[0]) titulos[0].lastChild.textContent = ' MAERA Information';
  if (titulos[1]) titulos[1].lastChild.textContent = ' Customer Information';
  if (titulos[2]) titulos[2].lastChild.textContent = ' Quotation Items';
  if (titulos[3]) titulos[3].lastChild.textContent = ' Notes';

  const labels = [
    ['Razão Social:', 'Company Name:'],
    ['Inscrição Estadual:', 'State Registration:'],
    ['Número:', 'Number:'],
    ['Logradouro:', 'Street:'],
    ['CEP:', 'Postal Code:'],
    ['Bairro:', 'District:'],
    ['Estado:', 'State:'],
    ['Cidade:', 'City:'],
    ['Complemento:', 'Address Line 2:'],
    ['Contribuinte:', 'Tax status:'],
    ['CNPJ / CPF:', 'Tax ID:'],
    ['Contato:', 'Contact:'],
    ['Insc. Estadual:', 'State Registration:'],
    ['Telefone:', 'Phone:'],
    ['País:', 'Country:'],
    ['Moeda:', 'Currency:'],
    ['Informações adicionais:', 'Additional information:']
  ];
  document.querySelectorAll('.doc-label').forEach(label => {
    const atual = label.textContent.trim();
    const match = labels.find(([pt]) => pt === atual);
    if (match) label.textContent = match[1];
  });
  setLabel('rowCotacaoDolar', 'USD exchange rate:');
  const rowCotacao = document.getElementById('rowCotacaoDolar');
  if (rowCotacao) rowCotacao.style.display = 'none';

  const contrib = document.getElementById('dContribuinte');
  if (contrib) contrib.textContent = 'International export operation';

  const ths = document.querySelectorAll('.doc-table thead th');
  ['#', 'Description', 'Qty', 'Unit', 'Without Calib.', 'With Calib.', 'Unit Price', 'Total']
    .forEach((txt, i) => { if (ths[i]) ths[i].textContent = txt; });

  setText('#docDescontoRow span:first-child', 'Discount');
  setText('.doc-total-final span:first-child', 'TOTAL');
  const obsEl = document.getElementById('docObs');
  const obsAtual = obsEl?.innerText || '';
  if (obsEl && (!obsAtual.trim() || obsAtual.includes('Neste orçamento') || obsAtual.includes('Nos valores descritos'))) {
    obsEl.innerText = `This quotation includes only the taxes applicable to an international export operation.

The prices described do not include customs duties, import taxes, local taxes, bank fees, insurance, freight, or any other charges at destination.

If any additional charges are required, they will be informed separately and must be paid before shipment or order release.`;
  }
  setText('#secDetalhamentoDoc .sec-titulo', 'Fiscal Details');
  setText('#docDifalInfo', 'No Brazilian DIFAL applies to this export operation.');
  setText('#docDifalLabel', 'N/A');
  setText('#boxInfoOperacao > span:first-child', 'Operation: ');

  document.getElementById('secDifalDoc')?.style.setProperty('display', 'none');
  document.getElementById('secSimuladorCartaoDoc')?.style.setProperty('display', 'none');
  document.getElementById('secSimuladorBoletoDoc')?.style.setProperty('display', 'none');

  setText('#secSimuladorDoc .sec-titulo', 'Payment Terms');
  const avisoSim = document.querySelector('#secSimuladorDoc > div:last-child');
  if (avisoSim) {
    avisoSim.innerHTML = '<strong>Note:</strong> Amounts are based on the quotation total. Contact MAERA for updated terms.';
  }

  setText('#secCondPagamentoDoc .sec-titulo', 'Payment Terms');
  setText('#secCalibracaoDoc .sec-titulo', 'Calibration Certificate Terms');
  const calTexts = document.querySelectorAll('#secCalibracaoDoc .sec-texto');
  if (calTexts[0]) calTexts[0].textContent = 'Certificates issued by partner laboratories:';
  if (calTexts[1]) calTexts[1].textContent = 'The calibration certificate is traceable to RBC. If an RBC-accredited certificate is required, please confirm it when placing the order.';
  if (calTexts[2]) calTexts[2].textContent = 'Certificate validity must be provided by the customer when placing the order.';
  if (calTexts[3]) calTexts[3].innerHTML = 'Calibrations will be performed according to LRM Metrologia internal work instructions. <strong>IF THE CUSTOMER REQUIRES ANY CUSTOM DETAILS, SUCH AS SPECIFIC TEST POINTS, MAERA MUST BE INFORMED IN THE PURCHASE ORDER</strong>. For equipment with a 1-day delivery lead time, this changes to 10 days.';
  if (calTexts[4]) calTexts[4].textContent = 'The certificate will be delivered with the equipment or may be requested by email from MAERA or LRM Metrologia.';

  setText('#secSoftwareDoc .sec-titulo', 'SUNWEB Software');
  setText('#secSoftwareDoc .sec-texto', 'We recommend that the Android device is up to date and in good working condition to ensure better compatibility, performance, and security. MAERA is not responsible for limitations caused by network settings, such as website access blocks, firewall restrictions, proxy settings, or connection instability that may affect the system partially or fully.');

  setText('#secTreinamentoDoc .sec-titulo', 'Training');
  const trTexts = document.querySelectorAll('#secTreinamentoDoc .sec-texto');
  if (trTexts[0]) trTexts[0].innerHTML = '<strong>Notice:</strong> Operational training for the quoted equipment is <strong>not included</strong>.';
  if (trTexts[1]) trTexts[1].innerHTML = 'If full training is required, we recommend one of our specialized partners, <strong>EXCELSIOR</strong>.';
  if (trTexts[2]) trTexts[2].textContent = 'Contact: felipe.reis@excelsiormetrologia.com.br (11) 97130-1709.';

  setText('.doc-footer-texto', 'Dear customer, thank you for your interest in our products and services.');
  setText('#docFooterData',
    `Generated on ${new Date().toLocaleDateString('en-US')} at ` +
    `${new Date().toLocaleTimeString('en-US', { hour:'2-digit', minute:'2-digit' })}`
  );
}
function renderCartaoCompleto(totalBruto, linhaSelecionada, fiscal) {
  const el = document.getElementById('simCartaoTabela');
  if (!el) return;

  const TabelaCartao = [
    { parcelas: 12, descontoPerc:  0, beneficio: '' },
    { parcelas: 11, descontoPerc:  1, beneficio: '' },
    { parcelas: 10, descontoPerc:  2, beneficio: '' },
    { parcelas:  9, descontoPerc:  3,
      beneficio: 'Treinamento ou desconto' },
    { parcelas:  8, descontoPerc:  4,
      beneficio: 'Treinamento ou desconto' },
    { parcelas:  7, descontoPerc:  5,
      beneficio: 'Treinamento ou desconto' },
    { parcelas:  6, descontoPerc:  6,
      beneficio: 'Treinamento + desconto ou Mochila + desconto' },
    { parcelas:  5, descontoPerc:  7,
      beneficio: 'Treinamento + desconto ou Mochila + desconto' },
    { parcelas:  4, descontoPerc:  8,
      beneficio: 'Treinamento + desconto ou Mochila + desconto' },
    { parcelas:  3, descontoPerc:  9,
      beneficio: 'Treinamento + desconto ou Mochila + desconto' },
    { parcelas:  2, descontoPerc: 10,
      beneficio: 'Treinamento + desconto ou Mochila + desconto' },
    { parcelas:  1, descontoPerc: 11,
      beneficio: 'Treinamento + desconto ou Mochila + desconto' }
  ];

  const beneficioEscolhido = (linha) => {
    if (!linha.beneficio) return '';
    const opcoes = /(^|\s)ou(\s|$)/i.test(linha.beneficio)
      ? linha.beneficio.split(/\s+ou\s+/i).map(op => op.trim()).filter(Boolean)
      : [];
    const salvo = window._beneficiosCartao?.[linha.parcelas];
    return opcoes.length
      ? (opcoes.includes(salvo) ? salvo : opcoes[0])
      : linha.beneficio;
  };

  const isMobile = window.innerWidth <= 768;
  let html = '';

  if (isMobile) {
    TabelaCartao.forEach((linha) => {
      const descVal  = totalBruto * linha.descontoPerc / 100;
      const totalVal = totalBruto - descVal;
      const parcVal  = totalVal / linha.parcelas;
      const isSel    = linhaSelecionada === linha.parcelas;
      const cor      = '#F24105';
      const beneficioHtml = linha.beneficio
        ? `<div style="margin-top:8px">
             <span style="background:#d1fae5;color:#065f46;
               padding:3px 10px;border-radius:10px;font-size:10px;line-height:1.8">
               🎁 ${beneficioEscolhido(linha)}
             </span>
           </div>` : '';
      html += `
        <div id="cartao_row_${linha.parcelas}"
          onclick="destacarCartao(${linha.parcelas})"
          style="border:2px solid ${isSel ? cor : '#e5e7eb'};border-radius:12px;
            padding:12px 14px;margin-bottom:8px;cursor:pointer;transition:all .18s;
            background:${isSel ? 'rgba(255,107,44,.06)' : '#fff'}">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
            <span style="font-size:18px;font-weight:900;color:${isSel ? cor : '#374151'}">${linha.parcelas}x</span>
            ${isSel
              ? `<span style="font-size:10px;background:${cor};color:#fff;padding:2px 10px;border-radius:10px;font-weight:700">★ ESCOLHIDA</span>`
              : `<button onclick="event.stopPropagation();destacarCartao(${linha.parcelas})"
                  style="background:#e5e7eb;color:#6b7280;border:none;border-radius:6px;
                    padding:5px 14px;cursor:pointer;font-size:11px;font-weight:700">Destacar</button>`}
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;font-size:12px">
            <div style="background:#fff7ed;border-radius:8px;padding:8px 10px">
              <div style="color:#9ca3af;font-size:10px;margin-bottom:2px">Valor/Parcela</div>
              <div style="font-weight:900;font-size:16px;color:${isSel ? cor : '#374151'}">${formatMoeda(parcVal)}</div>
            </div>
            <div style="background:#f9fafb;border-radius:8px;padding:8px 10px">
              <div style="color:#9ca3af;font-size:10px;margin-bottom:2px">Total</div>
              <div style="font-weight:700;color:#374151">${formatMoeda(totalVal)}</div>
            </div>
            <div style="background:#f0fdf4;border-radius:8px;padding:8px 10px">
              <div style="color:#9ca3af;font-size:10px;margin-bottom:2px">Desconto</div>
              <div style="font-weight:700;color:#0e9f6e">${linha.descontoPerc > 0 ? `${linha.descontoPerc}%` : '—'}</div>
            </div>
          </div>
          ${beneficioHtml}
        </div>`;
    });
  } else {
    html = `
      <table style="width:100%;border-collapse:collapse;font-size:12px">
        <thead>
          <tr style="background:linear-gradient(135deg,#F24105 0%,#e55a1c 100%);color:#fff">
            <th style="padding:8px 10px;text-align:center">Parcelas</th>
            <th style="padding:8px 10px;text-align:center">Desconto</th>
            <th style="padding:8px 10px;text-align:right">Total</th>
            <th style="padding:8px 10px;text-align:right">Valor/Parcela</th>
            <th style="padding:8px 10px;text-align:center">Benefício</th>
            <th style="padding:8px 10px;text-align:center" class="no-print">✓</th>
          </tr>
        </thead>
        <tbody>`;
    TabelaCartao.forEach((linha, idx) => {
      const descVal  = totalBruto * linha.descontoPerc / 100;
      const totalVal = totalBruto - descVal;
      const parcVal  = totalVal / linha.parcelas;
      const isSel    = linhaSelecionada === linha.parcelas;
      const bgNorm   = idx % 2 === 0 ? '#f9fafb' : '#fff';
      const bg       = isSel ? 'rgba(255,107,44,.12)' : bgNorm;
      html += `
        <tr id="cartao_row_${linha.parcelas}"
          style="background:${bg};cursor:pointer;transition:all .18s"
          onclick="destacarCartao(${linha.parcelas})"
          onmouseover="this.style.background='rgba(255,107,44,.06)'"
          onmouseout="this.style.background='${isSel ? 'rgba(255,107,44,.12)' : bgNorm}'">
          <td style="padding:8px 10px;text-align:center;font-weight:800;color:${isSel ? '#F24105' : '#374151'}">
            ${linha.parcelas}x
            ${isSel ? `<span style="font-size:10px;background:#F24105;color:#fff;padding:1px 6px;border-radius:10px;margin-left:4px">★ ESCOLHIDA</span>` : ''}
          </td>
          <td style="padding:8px 10px;text-align:center;color:#0e9f6e;font-weight:700">${linha.descontoPerc > 0 ? `${linha.descontoPerc}%` : '—'}</td>
          <td style="padding:8px 10px;text-align:right;font-weight:700;color:#374151">${formatMoeda(totalVal)}</td>
          <td style="padding:8px 10px;text-align:right;font-weight:800;font-size:13px;color:${isSel ? '#F24105' : '#374151'}">${formatMoeda(parcVal)}</td>
          <td style="padding:8px 10px;text-align:center;font-size:10.5px;color:#6b7280">
            ${linha.beneficio
              ? `<span style="background:#d1fae5;color:#065f46;padding:2px 8px;border-radius:10px;font-size:10px">🎁 ${beneficioEscolhido(linha)}</span>`
              : '—'}
          </td>
          <td style="padding:8px 10px;text-align:center" class="no-print">
            <button onclick="event.stopPropagation();destacarCartao(${linha.parcelas})"
              style="background:${isSel ? '#F24105' : '#e5e7eb'};color:${isSel ? '#fff' : '#6b7280'};
                border:none;border-radius:6px;padding:4px 10px;cursor:pointer;font-size:11px;font-weight:700;white-space:nowrap">
              ${isSel ? '★ Selecionada' : 'Destacar'}
            </button>
          </td>
        </tr>`;
    });
    html += `</tbody></table>`;
  }

  html += `<div style="font-size:10px;color:#9ca3af;margin-top:6px;font-style:italic">
    * Mediante aprovação de ficha cadastral &nbsp;|&nbsp; ** Mínimo R$ 1.000,00 por parcela
  </div>`;

  el.innerHTML = html;
}

/* ══════════════════════════════════════════
   RENDER BOLETO COMPLETO
   ✅ sinalBase e parcVal calculados corretamente
      DIFAL exibido apenas no valor do sinal
   ══════════════════════════════════════════ */
function renderBoletoCompleto(totalBruto, linhaSelecionada, fiscal) {
  const el = document.getElementById('simBoletoTabela');
  if (!el) return;

  const ehNaoContrib = (fiscal?.contribuinte ||
    window._orcContribuinte) === 'nao';
  const difalVal     = fiscal?.difalVal ?? window._orcDifalVal ?? 0;

  const TabelaBoleto = [
    { sinalPerc: 90, parcelas:  6, descontoPerc: 12 },
    { sinalPerc: 80, parcelas:  6, descontoPerc: 10 },
    { sinalPerc: 70, parcelas:  6, descontoPerc:  8 },
    { sinalPerc: 60, parcelas:  8, descontoPerc:  6 },
    { sinalPerc: 50, parcelas:  8, descontoPerc:  4 },
    { sinalPerc: 40, parcelas: 10, descontoPerc:  2 },
    { sinalPerc: 30, parcelas: 10, descontoPerc:  0 }
  ];

  const isMobile = window.innerWidth <= 768;
  let html = '';

  if (isMobile) {
    TabelaBoleto.forEach((linha) => {
      const descVal      = totalBruto * linha.descontoPerc / 100;
      const totalVal     = totalBruto - descVal;
      const sinalBase    = totalVal * linha.sinalPerc / 100;
      const restoVal     = totalVal - sinalBase;
      const parcVal      = linha.parcelas > 0 ? restoVal / linha.parcelas : 0;
      const sinalExibido = ehNaoContrib && difalVal > 0 ? sinalBase + difalVal : sinalBase;
      const keyId        = `${linha.sinalPerc}_${linha.descontoPerc}`;
      const isSel        = linhaSelecionada === keyId;
      const cor          = '#F24105';
      const difalHtml    = ehNaoContrib && difalVal > 0
        ? `<div style="font-size:10px;color:#c2410c;margin-top:2px">+ DIFAL ${formatMoeda(difalVal)}</div>` : '';
      html += `
        <div id="boleto_row_${keyId}"
          onclick="destacarBoleto('${keyId}')"
          style="border:2px solid ${isSel ? cor : '#e5e7eb'};border-radius:12px;
            padding:12px 14px;margin-bottom:8px;cursor:pointer;transition:all .18s;
            background:${isSel ? 'rgba(249,115,22,.06)' : '#fff'}">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
            <span style="font-size:18px;font-weight:900;color:${isSel ? '#c2410c' : '#374151'}">
              Sinal ${linha.sinalPerc}%
            </span>
            ${isSel
              ? `<span style="font-size:10px;background:${cor};color:#fff;padding:2px 10px;border-radius:10px;font-weight:700">★ ESCOLHIDA</span>`
              : `<button onclick="event.stopPropagation();destacarBoleto('${keyId}')"
                  style="background:#e5e7eb;color:#6b7280;border:none;border-radius:6px;
                    padding:5px 14px;cursor:pointer;font-size:11px;font-weight:700">Destacar</button>`}
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;font-size:12px">
            <div style="background:#fff7ed;border-radius:8px;padding:8px 10px">
              <div style="color:#9ca3af;font-size:10px;margin-bottom:2px">Valor do Sinal</div>
              <div style="font-weight:800;color:${isSel ? '#c2410c' : '#374151'}">${formatMoeda(sinalExibido)}</div>
              ${difalHtml}
            </div>
            <div style="background:#f9fafb;border-radius:8px;padding:8px 10px">
              <div style="color:#9ca3af;font-size:10px;margin-bottom:2px">Valor/Parcela</div>
              <div style="font-weight:900;font-size:16px;color:${isSel ? '#c2410c' : '#374151'}">${formatMoeda(parcVal)}</div>
              <div style="color:#6b7280;font-size:10px">${linha.parcelas}x parcelas</div>
            </div>
            <div style="background:#f0fdf4;border-radius:8px;padding:8px 10px">
              <div style="color:#9ca3af;font-size:10px;margin-bottom:2px">Desconto</div>
              <div style="font-weight:700;color:#0e9f6e">${linha.descontoPerc > 0 ? `${linha.descontoPerc}%` : '—'}</div>
            </div>
            <div style="background:#f9fafb;border-radius:8px;padding:8px 10px">
              <div style="color:#9ca3af;font-size:10px;margin-bottom:2px">Total Final</div>
              <div style="font-weight:700;color:#374151">${formatMoeda(totalVal)}</div>
            </div>
          </div>
        </div>`;
    });
  } else {
    html = `
      <table style="width:100%;border-collapse:collapse;font-size:12px">
        <thead>
          <tr style="background:linear-gradient(135deg,#F24105 0%,#ea580c 100%);color:#fff">
            <th style="padding:8px 10px;text-align:center">Sinal %</th>
            <th style="padding:8px 10px;text-align:right">Valor Sinal</th>
            <th style="padding:8px 10px;text-align:center">Parcelas</th>
            <th style="padding:8px 10px;text-align:right">Valor/Parcela</th>
            <th style="padding:8px 10px;text-align:center">Desconto</th>
            <th style="padding:8px 10px;text-align:right">Total Final</th>
            <th style="padding:8px 10px;text-align:center" class="no-print">✓</th>
          </tr>
        </thead>
        <tbody>`;
    TabelaBoleto.forEach((linha, idx) => {
      const descVal      = totalBruto * linha.descontoPerc / 100;
      const totalVal     = totalBruto - descVal;
      const sinalBase    = totalVal * linha.sinalPerc / 100;
      const restoVal     = totalVal - sinalBase;
      const parcVal      = linha.parcelas > 0 ? restoVal / linha.parcelas : 0;
      const sinalExibido = ehNaoContrib && difalVal > 0 ? sinalBase + difalVal : sinalBase;
      const keyId        = `${linha.sinalPerc}_${linha.descontoPerc}`;
      const isSel        = linhaSelecionada === keyId;
      const bgNorm       = idx % 2 === 0 ? '#f9fafb' : '#fff';
      const bg           = isSel ? 'rgba(249,115,22,.1)' : bgNorm;
      html += `
        <tr id="boleto_row_${keyId}"
          style="background:${bg};cursor:pointer;transition:all .18s"
          onclick="destacarBoleto('${keyId}')"
          onmouseover="this.style.background='rgba(249,115,22,.06)'"
          onmouseout="this.style.background='${isSel ? 'rgba(249,115,22,.1)' : bgNorm}'">
          <td style="padding:8px 10px;text-align:center;font-weight:800;color:${isSel ? '#c2410c' : '#374151'}">
            ${linha.sinalPerc}%
            ${isSel ? `<span style="font-size:10px;background:#F24105;color:#fff;padding:1px 6px;border-radius:10px;margin-left:4px">★ ESCOLHIDA</span>` : ''}
          </td>
          <td style="padding:8px 10px;text-align:right;font-weight:800;color:${isSel ? '#c2410c' : '#374151'}">
            ${formatMoeda(sinalExibido)}
            ${ehNaoContrib && difalVal > 0 ? `<div style="font-size:10px;color:#c2410c">(+ DIFAL ${formatMoeda(difalVal)})</div>` : ''}
          </td>
          <td style="padding:8px 10px;text-align:center;font-weight:700;color:#374151">${linha.parcelas}x</td>
          <td style="padding:8px 10px;text-align:right;font-weight:800;font-size:13px;color:${isSel ? '#c2410c' : '#374151'}">${formatMoeda(parcVal)}</td>
          <td style="padding:8px 10px;text-align:center;color:#0e9f6e;font-weight:700">${linha.descontoPerc > 0 ? `${linha.descontoPerc}%` : '—'}</td>
          <td style="padding:8px 10px;text-align:right;font-weight:700;color:#374151">${formatMoeda(totalVal)}</td>
          <td style="padding:8px 10px;text-align:center" class="no-print">
            <button onclick="event.stopPropagation();destacarBoleto('${keyId}')"
              style="background:${isSel ? '#F24105' : '#e5e7eb'};color:${isSel ? '#fff' : '#6b7280'};
                border:none;border-radius:6px;padding:4px 10px;cursor:pointer;font-size:11px;font-weight:700;white-space:nowrap">
              ${isSel ? '★ Selecionada' : 'Destacar'}
            </button>
          </td>
        </tr>`;
    });
    html += `</tbody></table>`;
  }

  html += `<div style="font-size:10px;color:#9ca3af;margin-top:6px;font-style:italic">
    * Mediante aprovação de ficha cadastral pela MAERA &nbsp;|&nbsp; ** Mínimo R$ 1.000,00 por parcela
  </div>`;

  el.innerHTML = html;
}

function parseNumeroCondicao(valor) {
  if (typeof valor === 'number') return Number.isFinite(valor) ? valor : 0;
  return parseFloat(String(valor || '').replace(/\./g, '').replace(',', '.')) || 0;
}

function calcularCondicaoPersonalizadaDoc(Condição, totalBase) {
  const parcelas = Math.max(1, parseInt(Condição.parcelas, 10) || 1);
  const entrada = Math.max(0, Math.min(parseNumeroCondicao(Condição.entrada), totalBase || 0));
  const ajusteTipo = Condição.ajusteTipo || 'nenhum';
  const ajusteValor = Math.max(0, parseNumeroCondicao(Condição.ajusteValor));
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
    valorParcela: parcelas > 0 ? saldo / parcelas : 0
  };
}

function renderCondiçõesPersonalizadasDoc(totalBase, Condições) {
  const sec = document.getElementById('secSimuladorDoc');
  if (!sec) return;

  let box = document.getElementById('secCondiçõesPersonalizadasDoc');
  if (!box) {
    box = document.createElement('div');
    box.id = 'secCondiçõesPersonalizadasDoc';
    box.style.cssText = 'margin-bottom:16px';
    const aviso = sec.lastElementChild;
    if (aviso) sec.insertBefore(box, aviso);
    else sec.appendChild(box);
  }

  const linhas = Condições.map(Condição => {
    const c = calcularCondicaoPersonalizadaDoc(Condição, totalBase);
    const forma = Condição.forma || 'Condição personalizada';
    const entradaTxt = c.entrada > 0 ? `Entrada ${formatMoeda(c.entrada)} + ` : '';
    const ajusteTxt = c.ajusteTipo === 'desconto' && c.ajusteValor > 0
      ? `Desconto ${c.ajusteValor}%`
      : c.ajusteTipo === 'juros' && c.ajusteValor > 0
        ? `Juros ${c.ajusteValor}%`
        : '-';
    return `
      <tr>
        <td style="padding:8px 10px;font-weight:800;color:#374151">${forma}</td>
        <td style="padding:8px 10px;text-align:right;font-weight:800;color:#374151">
          ${entradaTxt}${c.parcelas}x de ${formatMoeda(c.valorParcela)}
        </td>
        <td style="padding:8px 10px;text-align:center;color:#6b7280">${c.intervalo} dias</td>
        <td style="padding:8px 10px;text-align:center;color:#0e9f6e;font-weight:700">${ajusteTxt}</td>
        <td style="padding:8px 10px;text-align:right;font-weight:700;color:#374151">${formatMoeda(c.totalFinal)}</td>
      </tr>
      ${Condição.obs ? `<tr><td colspan="5" style="padding:0 10px 8px;color:#6b7280;font-size:11px">${Condição.obs}</td></tr>` : ''}`;
  }).join('');

  box.innerHTML = `
    <div class="sim-doc-header-row"
      style="background:#f9fafb;border-radius:8px;border-top:2px solid #86efac;
      border-bottom:3px solid #374151;padding:8px 12px;margin-bottom:8px">
      <span class="sim-doc-checkbox"><i class="fa-solid fa-check"></i></span>
      <i class="fa-solid fa-pen-to-square" style="font-size:15px;color:#374151;flex-shrink:0"></i>
      <span style="font-size:13px;font-weight:800;color:#1f2937">
        Condições personalizadas
      </span>
    </div>
    <table style="width:100%;border-collapse:collapse;font-size:12px;border:1px solid #e5e7eb">
      <thead>
        <tr style="background:#374151;color:#fff">
          <th style="padding:8px 10px;text-align:left">Forma</th>
          <th style="padding:8px 10px;text-align:right">Condição</th>
          <th style="padding:8px 10px;text-align:center">Intervalo</th>
          <th style="padding:8px 10px;text-align:center">Ajuste</th>
          <th style="padding:8px 10px;text-align:right">Total</th>
        </tr>
      </thead>
      <tbody>${linhas}</tbody>
    </table>`;
}

/* ══════════════════════════════════════════
   DESTAQUE CARTÃO
   ══════════════════════════════════════════ */
async function destacarCartao(parcelas) {
  const params = new URLSearchParams(window.location.search);
  const id     = params.get('id');
  const lista  = await getOrcamentos();
  const idx    = lista.findIndex(x => x.id === id);
  if (idx < 0) return;

  if (!lista[idx].destaques) lista[idx].destaques = {};
  const atual = lista[idx].destaques.cartao;
  lista[idx].destaques.cartao = atual === parcelas ? null : parcelas;

  await saveOrcamento(lista[idx]);

  const fiscal = calcularFiscal(lista[idx]);
  fiscal.totalItensOrcamentoSemDifal = calcularTotalItensOrcamento(lista[idx]);
  const totalNegociado = aplicarDescontoNegociacao(
    fiscal.totalItensOrcamentoSemDifal || fiscal.total,
    lista[idx].descontoNegociacao || {}
  );
  renderCartaoCompleto(
    totalNegociado,
    lista[idx].destaques.cartao,
    fiscal
  );

  showToast(
    lista[idx].destaques.cartao
      ? `✅ Cartão ${parcelas}x destacado!`
      : 'Destaque removido',
    'success'
  );
}

/* ══════════════════════════════════════════
   DESTAQUE BOLETO
   ══════════════════════════════════════════ */
async function destacarBoleto(keyId) {
  const params = new URLSearchParams(window.location.search);
  const id     = params.get('id');
  const lista  = await getOrcamentos();
  const idx    = lista.findIndex(x => x.id === id);
  if (idx < 0) return;

  if (!lista[idx].destaques) lista[idx].destaques = {};
  const atual = lista[idx].destaques.boleto;
  lista[idx].destaques.boleto = atual === keyId ? null : keyId;

  await saveOrcamento(lista[idx]);

  const fiscal = calcularFiscal(lista[idx]);
  fiscal.totalItensOrcamentoSemDifal = calcularTotalItensOrcamento(lista[idx]);
  const totalNegociado = aplicarDescontoNegociacao(
    fiscal.totalItensOrcamentoSemDifal || fiscal.total,
    lista[idx].descontoNegociacao || {}
  );
  renderBoletoCompleto(
    totalNegociado,
    lista[idx].destaques.boleto,
    fiscal
  );

  showToast(
    lista[idx].destaques.boleto
      ? `✅ Condição de boleto destacada!`
      : 'Destaque removido',
    'success'
  );
}

/* ══════════════════════════════════════════
   MOSTRAR SEÇÃO
   ══════════════════════════════════════════ */
function mostrarSecao(id, visivel) {
  const el = document.getElementById(id);
  if (el) el.style.display = visivel ? 'block' : 'none';
}

/* ══════════════════════════════════════════
   LOGO
   ══════════════════════════════════════════ */
function initLogo() {
  const salvo   = localStorage.getItem('maera_logo');
  const logoImg = document.getElementById('logoDoc');
  const logoFB  = document.getElementById('logoDocFallback');
  const bar     = document.getElementById('logoPreviewBar');
  const ico     = document.getElementById('logoIconBar');

  if (salvo) {
    logoImg.src           = salvo;
    logoImg.style.display = 'block';
    logoFB.style.display  = 'none';
    if (bar) { bar.src = salvo; bar.style.display = 'block'; }
    if (ico) ico.style.display = 'none';
  } else {
    const tmp   = new Image();
    tmp.onload  = () => {
      logoImg.src           = 'assets/logo.png';
      logoImg.style.display = 'block';
      logoFB.style.display  = 'none';
      if (bar) { bar.src = 'assets/logo.png'; bar.style.display = 'block'; }
      if (ico) ico.style.display = 'none';
    };
    tmp.onerror = () => {
      logoImg.style.display = 'none';
      logoFB.style.display  = 'flex';
    };
    tmp.src = 'assets/logo.png?' + Date.now();
  }
}

function carregarLogo(input) {
  const file = input.files[0];
  if (!file) return;
  if (!file.type.startsWith('image/')) {
    showToast('Selecione uma imagem válida!', 'error'); return;
  }
  if (file.size > 2 * 1024 * 1024) {
    showToast('Imagem muito grande! Máximo 2MB.', 'warn'); return;
  }
  const reader  = new FileReader();
  reader.onload = e => {
    const b64     = e.target.result;
    localStorage.setItem('maera_logo', b64);
    const logoImg = document.getElementById('logoDoc');
    const logoFB  = document.getElementById('logoDocFallback');
    const bar     = document.getElementById('logoPreviewBar');
    const ico     = document.getElementById('logoIconBar');
    logoImg.src           = b64;
    logoImg.style.display = 'block';
    logoFB.style.display  = 'none';
    if (bar) { bar.src = b64; bar.style.display = 'block'; }
    if (ico) ico.style.display = 'none';
    showToast('✅ Logo carregado!', 'success');
  };
  reader.readAsDataURL(file);
}

function removerLogo() {
  localStorage.removeItem('maera_logo');
  const logoImg = document.getElementById('logoDoc');
  const logoFB  = document.getElementById('logoDocFallback');
  const bar     = document.getElementById('logoPreviewBar');
  const ico     = document.getElementById('logoIconBar');
  logoImg.style.display = 'none';
  logoFB.style.display  = 'flex';
  if (bar) bar.style.display  = 'none';
  if (ico) ico.style.display  = 'block';
  document.getElementById('inputLogoVis').value = '';
  showToast('Logo removido!', 'warn');
}

/* ══════════════════════════════════════════
   HELPERS PDF
   ══════════════════════════════════════════ */
function imgParaBase64(src) {
  return new Promise(resolve => {
    if (!src || src === window.location.href) { resolve(null); return; }
    if (src.startsWith('data:'))              { resolve(src);  return; }

    const img       = new Image();
    img.crossOrigin = 'anonymous';
    const timeout   = setTimeout(() => resolve(null), 5000);

    img.onload = () => {
      clearTimeout(timeout);
      try {
        const c  = document.createElement('canvas');
        c.width  = img.naturalWidth  || 80;
        c.height = img.naturalHeight || 80;
        c.getContext('2d').drawImage(img, 0, 0);
        resolve(c.toDataURL('image/png'));
      } catch { resolve(null); }
    };
    img.onerror = () => { clearTimeout(timeout); resolve(null); };
    img.src = src + (src.includes('?') ? '&' : '?') + '_t=' + Date.now();
  });
}

function carregarTodasImagens(el) {
  const imgs = Array.from(el.querySelectorAll('img'));
  if (!imgs.length) return Promise.resolve();
  return Promise.all(imgs.map(img =>
    new Promise(resolve => {
      if (img.complete && img.naturalWidth > 0) { resolve(); return; }
      const t     = setTimeout(resolve, 5000);
      img.onload  = () => { clearTimeout(t); resolve(); };
      img.onerror = () => { clearTimeout(t); resolve(); };
      if (img.src) img.src = img.src;
    })
  ));
}

/* ══════════════════════════════════════════
   CONVERTE IMAGEM PARA PNG COM FUNDO BRANCO
   ══════════════════════════════════════════ */
function imgComFundoBranco(src) {
  return new Promise(resolve => {
    if (!src) { resolve(src); return; }
    const img       = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const c   = document.createElement('canvas');
      c.width   = img.naturalWidth  || 64;
      c.height  = img.naturalHeight || 48;
      const ctx = c.getContext('2d');
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, c.width, c.height);
      ctx.drawImage(img, 0, 0);
      resolve(c.toDataURL('image/png'));
    };
    img.onerror = () => resolve(src);
    img.src = src + (src.includes('?') ? '&' : '?') + '_t=' + Date.now();
  });
}

/* ══════════════════════════════════════════
   GERAR PDF
   ══════════════════════════════════════════ */
async function gerarPDF() {
  const numero      = document.getElementById('docNumero').textContent.trim();
  const elOriginal  = document.getElementById('docOrcamento');

  /* ✅ CORREÇÃO: id correto é dRazaoSocial (conforme setEl no carregarOrcamento) */
  const razaoSocial = (document.getElementById('dRazaoSocial')?.textContent || '')
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')   // remove acentos
    .replace(/[^a-zA-Z0-9\s_-]/g, '') // remove caracteres especiais
    .trim()
    .replace(/\s+/g, '_');             // espaços viram _

  if (!elOriginal) {
    showToast('Documento não encontrado!', 'error');
    return;
  }

  showToast('Gerando PDF...', 'info');

  /* ══════════ Força modo desktop nas tabelas antes de clonar ══════════ */
  const _innerWidth = window.innerWidth;
  if (_innerWidth <= 768) {
    Object.defineProperty(window, 'innerWidth', { configurable: true, get: () => 1200 });
    renderCartaoCompleto(window._totalBruto, window._destCartao, window._fiscal);
    renderBoletoCompleto(window._totalBruto, window._destBoleto, window._fiscal);
  }

  const PDF_WIDTH_PX = 794;
  const container    = document.createElement('div');

  container.style.cssText = `
    position  : fixed;
    top       : 0;
    left      : -9999px;
    width     : ${PDF_WIDTH_PX}px;
    background: #fff;
    z-index   : -9999;
    overflow  : visible;
  `;

  try {
    const clone = elOriginal.cloneNode(true);

    /* ══════════ Restaura mobile após clonar ══════════ */
    if (_innerWidth <= 768) {
      Object.defineProperty(window, 'innerWidth', { configurable: true, get: () => _innerWidth });
      renderCartaoCompleto(window._totalBruto, window._destCartao, window._fiscal);
      renderBoletoCompleto(window._totalBruto, window._destBoleto, window._fiscal);
    }

    clone.style.cssText = `
      width        : ${PDF_WIDTH_PX}px;
      max-width    : ${PDF_WIDTH_PX}px;
      padding      : 32px 36px;
      background   : #fff;
      box-shadow   : none;
      border-radius: 0;
      box-sizing   : border-box;
      overflow     : visible;
    `;

    /* ══════════ Remove elementos que não devem ir pro PDF ══════════ */
    clone.querySelectorAll('.no-print, button').forEach(e => e.remove());

    /* ══════════ Processa logo ══════════ */
    const logoOrig  = elOriginal.querySelector('#logoDoc');
    const logoClone = clone.querySelector('#logoDoc');
    const fbOrig    = elOriginal.querySelector('#logoDocFallback');
    const fbClone   = clone.querySelector('#logoDocFallback');

    if (logoOrig && logoClone) {
      if (logoOrig.style.display !== 'none' && logoOrig.src) {
        const b64 = await imgParaBase64(logoOrig.src);
        if (b64) {
          logoClone.src           = b64;
          logoClone.style.cssText = `
            display      : block;
            width        : auto;
            height       : 30px;
            max-height   : 30px;
            max-width    : 180px;
            object-fit   : contain;
            border-radius: 0 !important;
            flex-shrink  : 0;
          `;
          if (fbClone) fbClone.style.display = 'none';
        } else {
          logoClone.style.display = 'none';
          if (fbClone) fbClone.style.display = 'flex';
        }
      } else {
        logoClone.style.display = 'none';
        if (fbClone) fbClone.style.display = fbOrig?.style.display || 'flex';
      }
    }

    /* ══════════ Corrige overflow nos elementos clonados ══════════ */
    clone.querySelectorAll('*').forEach(el => {
      const s = el.style;
      if (s.overflow  === 'auto'   || s.overflow  === 'hidden' ||
          s.overflowX === 'auto'   || s.overflowX === 'hidden') {
        s.overflow  = 'visible';
        s.overflowX = 'visible';
        s.overflowY = 'visible';
      }
    });

    /* ══════════ Substitui variáveis CSS por valores fixos ══════════ */
    const PRIMARY      = '#F24105';
    const PRIMARY_DARK = '#d13704';
    clone.querySelectorAll('*').forEach(el => {
      const s = el.getAttribute('style') || '';
      if (s.includes('var(--primary)') || s.includes('var(--primary-dark)')) {
        el.setAttribute('style',
          s.replaceAll('var(--primary-dark)', PRIMARY_DARK)
           .replaceAll('var(--primary)',      PRIMARY)
        );
      }
    });

    container.appendChild(clone);
    document.body.appendChild(container);

    /* ══════════ Evita corte no meio de seções e linhas de tabela ══════════ */
    clone.querySelectorAll(
      'tr, thead, .doc-section, .sim-block, ' +
      '[id^="secSimulador"], [class*="card"]'
    ).forEach(el => {
      el.style.pageBreakInside = 'avoid';
      el.style.breakInside     = 'avoid';
    });

    await carregarTodasImagens(clone);

    clone.querySelectorAll('.doc-table td img').forEach(img => {
      const natW = img.naturalWidth || 64;
      const natH = img.naturalHeight || 48;
      const maxW = 64;
      const maxH = 48;
      const ratio = Math.min(maxW / natW, maxH / natH, 1);

      img.style.width          = Math.round(natW * ratio) + 'px';
      img.style.height         = Math.round(natH * ratio) + 'px';
      img.style.maxWidth       = maxW + 'px';
      img.style.maxHeight      = maxH + 'px';
      img.style.objectFit      = 'contain';
      img.style.objectPosition = 'left left';
      img.style.display        = 'block';
      img.style.margin         = '0 0 6px 0';
    });

    await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
    await new Promise(r => setTimeout(r, 500));

    /* ══════════ Calcula altura real do documento ══════════ */
    const alturaReal = Math.max(
      clone.scrollHeight,
      clone.offsetHeight,
      clone.getBoundingClientRect().height
    );

    if (!alturaReal || alturaReal < 10) {
      throw new Error('Altura do documento inválida: ' + alturaReal);
    }

    /* ══════════ Captura com html2canvas ══════════ */
    const canvas = await html2canvas(clone, {
      scale:           2,
      useCORS:         true,
      allowTaint:      true,
      backgroundColor: '#ffffff',
      logging:         false,
      width:           PDF_WIDTH_PX,
      height:          alturaReal,
      windowWidth:     PDF_WIDTH_PX,
      windowHeight:    alturaReal,
      scrollX:         0,
      scrollY:         0,
      x:               0,
      y:               0,
      ignoreElements:  el => el.classList?.contains('no-print')
    });

    /* ══════════ Gera o PDF paginado com cortes discretos ══════════ */
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit:        'mm',
      format:      'a4',
      compress:    true
    });

    const pdfW    = 210;
    const pdfH    = 297;
    const margin  = 10;
    const usableW = pdfW - margin * 2;
    const usableH = pdfH - margin * 2;

    const scale       = usableW / canvas.width;
    const pageHpx     = usableH / scale;
    const cloneRect   = clone.getBoundingClientRect();
    const canvasRatio = canvas.width / cloneRect.width;
    const gap         = Math.max(6, Math.round(4 * canvasRatio));
    const minSliceH   = pageHpx * 0.35;

    const hardRanges = [];
    const softRanges = [];

    const addRange = (list, rect, extra = gap, maxHeight = pageHpx * 0.95) => {
      if (!rect || rect.height <= 2) return;

      const top    = Math.max(0, Math.floor((rect.top - cloneRect.top) * canvasRatio) - extra);
      const bottom = Math.min(canvas.height, Math.ceil((rect.bottom - cloneRect.top) * canvasRatio) + extra);
      const height = bottom - top;

      if (bottom > 0 && top < canvas.height && height > 3 && height < maxHeight) {
        list.push({ top, bottom, height });
      }
    };

    // Blocos que nunca devem ficar partidos entre duas páginas.
    clone.querySelectorAll(
      'tr, img, .doc-totais-box, .doc-footer, .sim-doc-header-row, ' +
      '.aviso-difal-doc, #simPixBloco > *, #simCartaoTabela > *, #simBoletoTabela > *'
    ).forEach(el => addRange(hardRanges, el.getBoundingClientRect(), gap, pageHpx * 0.98));

    // Mantém o cabeçalho do Cartão/Boleto junto com o início da tabela.
    ['secSimuladorCartaoDoc', 'secSimuladorBoletoDoc'].forEach(id => {
      const section = clone.querySelector('#' + id);
      if (!section || section.style.display === 'none') return;

      const header     = section.querySelector('.sim-doc-header-row');
      const tableBox   = id === 'secSimuladorCartaoDoc'
        ? section.querySelector('#simCartaoTabela')
        : section.querySelector('#simBoletoTabela');
      const firstContent = tableBox?.querySelector('thead, tr, table, div') || tableBox;
      if (!header || !firstContent) return;

      const headerRect  = header.getBoundingClientRect();
      const contentRect = firstContent.getBoundingClientRect();
      const combinedRect = {
        top:    headerRect.top,
        bottom: Math.max(headerRect.bottom, contentRect.bottom),
        height: Math.max(headerRect.bottom, contentRect.bottom) - headerRect.top
      };

      addRange(hardRanges, combinedRect, gap, pageHpx * 0.98);
    });

    // Blocos menores: evita cortar título, item de texto e linha individual.
    clone.querySelectorAll(
      '.doc-section-title, .sec-titulo, .sec-item, .doc-total-row'
    ).forEach(el => addRange(softRanges, el.getBoundingClientRect(), gap, pageHpx * 0.5));

    const walker = document.createTreeWalker(clone, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        return node.nodeValue.trim()
          ? NodeFilter.FILTER_ACCEPT
          : NodeFilter.FILTER_REJECT;
      }
    });

    while (walker.nextNode()) {
      const range = document.createRange();
      range.selectNodeContents(walker.currentNode);
      [...range.getClientRects()].forEach(rect => {
        addRange(softRanges, rect, Math.round(3 * canvasRatio), pageHpx * 0.12);
      });
      range.detach();
    }

    hardRanges.sort((a, b) => a.top - b.top);
    softRanges.sort((a, b) => a.top - b.top);

    const findSafeCut = (fromY) => {
      const idealCut = Math.min(fromY + pageHpx, canvas.height);
      if (idealCut >= canvas.height) return canvas.height;

      const hardBlock = hardRanges.find(r => r.top < idealCut && r.bottom > idealCut);
      if (hardBlock) {
        const before = hardBlock.top - gap;
        const after  = hardBlock.bottom + gap;

        if (hardBlock.height < pageHpx * 0.98 && before - fromY >= minSliceH) {
          return Math.max(fromY + 1, Math.round(before));
        }
        if (after - fromY <= pageHpx && after - fromY >= minSliceH) {
          return Math.max(fromY + 1, Math.round(after));
        }
      }

      const softBlock = softRanges.find(r => r.top < idealCut && r.bottom > idealCut);
      if (softBlock) {
        const before   = softBlock.top - gap;
        const pullBack = idealCut - before;

        if (before - fromY >= minSliceH && pullBack <= pageHpx * 0.18) {
          return Math.max(fromY + 1, Math.round(before));
        }
      }

      return Math.round(idealCut);
    };

    const cutPoints = [0];
    while (cutPoints[cutPoints.length - 1] < canvas.height) {
      const nextCut = findSafeCut(cutPoints[cutPoints.length - 1]);
      if (nextCut <= cutPoints[cutPoints.length - 1]) break;
      cutPoints.push(nextCut);
    }

    document.body.removeChild(container);

    for (let p = 0; p < cutPoints.length - 1; p++) {
      const sliceY = cutPoints[p];
      const sliceH = cutPoints[p + 1] - sliceY;
      if (sliceH <= 1) continue;

      if (p > 0) pdf.addPage();

      const sliceCanvas  = document.createElement('canvas');
      sliceCanvas.width  = canvas.width;
      sliceCanvas.height = Math.ceil(sliceH);
      const ctx          = sliceCanvas.getContext('2d');
      ctx.fillStyle      = '#ffffff';
      ctx.fillRect(0, 0, sliceCanvas.width, sliceCanvas.height);
      ctx.drawImage(
        canvas,
        0, Math.round(sliceY), canvas.width, Math.ceil(sliceH),
        0, 0, sliceCanvas.width, sliceCanvas.height
      );

      const sliceData = sliceCanvas.toDataURL('image/jpeg', 0.92);
      const sliceHmm  = sliceH * scale;

      pdf.addImage(sliceData, 'JPEG', margin, margin, usableW, sliceHmm, '', 'FAST');

      /* Máscara margens brancas */
      pdf.setFillColor(255, 255, 255);
      pdf.rect(0, 0,             pdfW, margin,     'F');
      pdf.rect(0, pdfH - margin, pdfW, margin + 1, 'F');
      pdf.rect(0, 0,             margin,      pdfH, 'F');
      pdf.rect(pdfW - margin, 0, margin + 1,  pdfH, 'F');
    }

    /* ══════════ Salva o arquivo ══════════ */
    // ✅ Nome: Orcamento_<numero>_<RazaoSocial>.pdf
    pdf.save(`Orcamento_${numero}_${razaoSocial}.pdf`);
    showToast('PDF gerado com sucesso!', 'success');

  } catch (err) {
    console.error('Erro ao gerar PDF:', err);
    showToast('Erro ao gerar PDF. Tente novamente.', 'error');
    if (document.body.contains(container)) {
      document.body.removeChild(container);
    }
  }
}
