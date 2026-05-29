/* ============================================
   MAERA – SIMULADOR DE PAGAMENTO | SIMULADOR.JS
   ============================================ */

/* ── TABELAS DE DESCONTO ─────────────────── */
/* ── CÁLCULOS ────────────────────────────── */
function calcularPix(totalBruto) {
  const desc = totalBruto * TabelaPix.descontoPerc / 100;
  return {
    descontoPerc: TabelaPix.descontoPerc,
    descontoVal:  desc,
    totalComDesc: totalBruto - desc
  };
}

function calcularCartao(totalBruto, parcelas) {
  const linha  = TabelaCartao.find(l => l.parcelas === parcelas)
              || TabelaCartao[0];
  const desc   = totalBruto * linha.descontoPerc / 100;
  const total  = totalBruto - desc;
  return {
    parcelas:     linha.parcelas,
    descontoPerc: linha.descontoPerc,
    descontoVal:  desc,
    totalComDesc: total,
    valorParcela: total / linha.parcelas,
    beneficio:    linha.beneficio
  };
}

function calcularBoleto(totalBruto, sinalPerc) {
  const linha    = TabelaBoleto.find(l => l.sinalPerc === sinalPerc)
               || TabelaBoleto[TabelaBoleto.length - 1];
  const desc     = totalBruto * linha.descontoPerc / 100;
  const total    = totalBruto - desc;
  const sinalVal = total * linha.sinalPerc / 100;
  const resto    = total - sinalVal;
  return {
    sinalPerc:    linha.sinalPerc,
    parcelas:     linha.parcelas,
    descontoPerc: linha.descontoPerc,
    descontoVal:  desc,
    totalComDesc: total,
    sinalVal,
    valorParcela: linha.parcelas > 0 ? resto / linha.parcelas : 0
  };
}

/* ── RENDER TABELA CARTÃO ────────────────── */
function renderTabelaCartao(total, destCartao, onDestacar) {
  const tbody = document.getElementById('tbodyCartao');
  if (!tbody) return;
  tbody.innerHTML = '';

  TabelaCartao.forEach(linha => {
    const descVal = total * linha.descontoPerc / 100;
    const totVal  = total - descVal;
    const parcVal = totVal / linha.parcelas;
    const isSel   = destCartao === linha.parcelas;
    const bgNorm  = linha.parcelas % 2 === 0 ? '#f9fafb' : '#fff';
    const bg      = isSel ? 'rgba(255,107,44,.12)' : bgNorm;

    const tr = document.createElement('tr');
    tr.style.cssText = `background:${bg};transition:background .18s;cursor:pointer`;
    tr.onmouseover   = () => { tr.style.background = 'rgba(255,107,44,.06)'; };
    tr.onmouseout    = () => { tr.style.background = isSel ? 'rgba(255,107,44,.12)' : bgNorm; };
    tr.onclick       = () => onDestacar && onDestacar(linha.parcelas);

    tr.innerHTML = `
      <td style="padding:8px 10px;text-align:center;font-weight:800;
        color:${isSel ? 'var(--primary)' : '#374151'}">
        ${linha.parcelas}x
        ${isSel ? `<span style="font-size:9px;background:var(--primary);
          color:#fff;padding:1px 6px;border-radius:10px;margin-left:4px">
          ★ ESCOLHIDA</span>` : ''}
      </td>
      // ✅ CORRETO — exibe "1%", "2%", etc. sem o sinal negativo
<td style="padding:8px 10px;text-align:center;
  color:#0e9f6e;font-weight:700">
  ${linha.descontoPerc > 0 ? `${linha.descontoPerc}%` : '—'}
</td>

      <td style="padding:8px 10px;text-align:right;
        font-weight:700;color:#374151">
        ${total > 0 ? formatMoeda(totVal) : '—'}
      </td>
      <td style="padding:8px 10px;text-align:right;font-weight:800;
        font-size:13px;color:${isSel ? 'var(--primary)' : '#374151'}">
        ${total > 0 ? formatMoeda(parcVal) : '—'}
      </td>
      <td style="padding:8px 10px;text-align:center;
        font-size:10.5px;color:#6b7280">
        ${linha.beneficio
          ? `<span style="background:#d1fae5;color:#065f46;padding:2px 8px;
              border-radius:10px;font-size:10px">🎁 ${linha.beneficio}</span>`
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

    tr.querySelector('button').onclick = e => {
      e.stopPropagation();
      onDestacar && onDestacar(linha.parcelas);
    };

    tbody.appendChild(tr);
  });
}
/* ── RENDER TABELA BOLETO ────────────────── */
function renderTabelaBoleto(total, destBoleto, onDestacar) {
  const tbody = document.getElementById('tbodyBoleto');
  if (!tbody) return;
  tbody.innerHTML = '';

  TabelaBoleto.forEach((linha, idx) => {
    const descVal  = total * linha.descontoPerc / 100;
    const totVal   = total - descVal;
    const sinalVal = totVal * linha.sinalPerc / 100;
    const restoVal = totVal - sinalVal;
    const parcVal  = linha.parcelas > 0 ? restoVal / linha.parcelas : 0;
    const keyId    = `${linha.sinalPerc}_${linha.descontoPerc}`;
    const isSel    = destBoleto === keyId;
    const bgNorm   = idx % 2 === 0 ? '#f9fafb' : '#fff';
    const bg       = isSel ? 'rgba(249,115,22,.1)' : bgNorm;

    const tr = document.createElement('tr');
    tr.style.cssText = `background:${bg};transition:background .18s;cursor:pointer`;
    tr.onmouseover   = () => { tr.style.background = 'rgba(249,115,22,.06)'; };
    tr.onmouseout    = () => { tr.style.background = isSel ? 'rgba(249,115,22,.1)' : bgNorm; };
    tr.onclick       = () => onDestacar && onDestacar(keyId);

    tr.innerHTML = `
      <td style="padding:8px 10px;text-align:center;font-weight:800;
        color:${isSel ? '#f24105' : '#374151'}">
        ${linha.sinalPerc}%
        ${isSel ? `<span style="font-size:9px;background:#f24105;
          color:#fff;padding:1px 6px;border-radius:10px;margin-left:4px">
          ★ ESCOLHIDA</span>` : ''}
      </td>
      <td style="padding:8px 10px;text-align:right;font-weight:800;
        color:${isSel ? '#f24105' : '#374151'}">
        ${total > 0 ? formatMoeda(sinalVal) : '—'}
      </td>
      <td style="padding:8px 10px;text-align:center;
        font-weight:700;color:#374151">
        ${linha.parcelas}x
      </td>
      <td style="padding:8px 10px;text-align:right;font-weight:800;
        font-size:13px;color:${isSel ? '#f24105' : '#374151'}">
        ${total > 0 ? formatMoeda(parcVal) : '—'}
      </td>
     // ✅ CORRETO — mesmo ajuste
<td style="padding:8px 10px;text-align:center;
  color:#0e9f6e;font-weight:700">
  ${linha.descontoPerc > 0 ? `${linha.descontoPerc}%` : '—'}
</td>

      <td style="padding:8px 10px;text-align:right;
        font-weight:700;color:#374151">
        ${total > 0 ? formatMoeda(totVal) : '—'}
      </td>
      <td style="padding:8px 10px;text-align:center">
        <button style="background:${isSel ? '#f24105' : '#e5e7eb'};
          color:${isSel ? '#fff' : '#6b7280'};border:none;border-radius:6px;
          padding:4px 10px;cursor:pointer;font-size:11px;font-weight:700;
          transition:all .18s;white-space:nowrap">
          ${isSel ? '★ Escolhida' : 'Destacar'}
        </button>
      </td>`;

    tr.querySelector('button').onclick = e => {
      e.stopPropagation();
      onDestacar && onDestacar(keyId);
    };

    tbody.appendChild(tr);
  });
}

/* ── RENDER RESUMO ───────────────────────── */
function renderResumoSim(total, chkPix, chkCartao, chkBoleto, destCartao, destBoleto) {
  const tbody = document.getElementById('tabelaResumoSim');
  if (!tbody) return;
  tbody.innerHTML = '';

  if (!total || total <= 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="4" style="text-align:center;color:#9ca3af;
          padding:14px;font-style:italic">
          Adicione itens ao orçamento para ver a simulação
        </td>
      </tr>`;
    return;
  }

  const rows = [];

  // PIX
  if (chkPix) {
    const r = calcularPix(total);
    rows.push({
      icone: '💰',
      nome:  'PIX à Vista',
      cor:   '#065f46',
      bg:    '#f0fdf4',
      desc:  `${r.descontoPerc}% de desconto`,
      valor: formatMoeda(r.totalComDesc),
      det:   `Total: ${formatMoeda(r.totalComDesc)}`
    });
  }

  // Cartão
  if (chkCartao) {
    if (destCartao) {
      const r = calcularCartao(total, destCartao);
      rows.push({
        icone: '💳',
        nome:  `Cartão ${r.parcelas}x`,
        cor:   'var(--primary)',
        bg:    'var(--primary-light)',
        desc:  `${r.descontoPerc > 0 ? `-${r.descontoPerc}%` : 'Sem desconto'}`,
        valor: `${r.parcelas}x ${formatMoeda(r.valorParcela)}`,
        det:   `Total: ${formatMoeda(r.totalComDesc)}`
      });
    } else {
      rows.push({
        icone: '💳',
        nome:  'Cartão de Crédito',
        cor:   'var(--primary)',
        bg:    'var(--primary-light)',
        desc:  'Escolha a condição na tabela acima',
        valor: '—',
        det:   '—'
      });
    }
  }

  // Boleto
  if (chkBoleto) {
    if (destBoleto) {
      const [sP, dP] = destBoleto.split('_').map(Number);
      const r = calcularBoleto(total, sP);
      rows.push({
        icone: '📄',
        nome:  `Boleto ${r.sinalPerc}% sinal`,
        cor:   '#f24105',
        bg:    '#fff7ed',
        desc:  `${r.descontoPerc > 0 ? `-${r.descontoPerc}%` : 'Sem desconto'}`,
        valor: `Sinal ${formatMoeda(r.sinalVal)}`,
        det:   `+ ${r.parcelas}x ${formatMoeda(r.valorParcela)}`
      });
    } else {
      rows.push({
        icone: '📄',
        nome:  'Boleto',
        cor:   '#f24105',
        bg:    '#fff7ed',
        desc:  'Escolha a condição na tabela acima',
        valor: '—',
        det:   '—'
      });
    }
  }

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
        <td style="padding:8px 12px;font-weight:700;color:${r.cor}">
          ${r.icone} ${r.nome}
        </td>
        <td style="padding:8px 12px;text-align:center;
          color:#0e9f6e;font-weight:700">
          ${r.desc}
        </td>
        <td style="padding:8px 12px;text-align:right;
          font-weight:800;color:${r.cor}">
          ${r.valor}
        </td>
        <td style="padding:8px 12px;text-align:right;
          font-size:11px;color:#6b7280">
          ${r.det}
        </td>
      </tr>`;
  });
}