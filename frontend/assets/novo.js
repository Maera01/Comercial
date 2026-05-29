/* ============================================
   MAERA – NOVO ORÇAMENTO | NOVO.JS
   ============================================ */

let selecionados = new Map();
let editandoId   = null;
let itemCount    = 0;
let usuarioLogado = null;

const OBS_PADRAO_PT = `Neste orçamento estão inclusos somente os impostos constantes no Anexo II da Lei Complementar 123 de 2006 - Simples Nacional e considerado que a mercadoria é destinada a uso, consumo ou ativo imobilizado.

Nos valores descritos não estão inclusas outras responsabilidades tributárias, como diferencial de alíquota, ICMS/ST e outras despesas acessórias.

Caso seja necessário recolhimento de responsabilidades tributárias não inclusas neste orçamento, elas serão destacadas na nota fiscal e recolhidas antecipadamente.`;

const OBS_PADRAO_EN = `This quotation includes only the taxes applicable to an international export operation.

The prices described do not include customs duties, import taxes, local taxes, bank fees, insurance, freight, or any other charges at destination.

If any additional charges are required, they will be informed separately and must be paid before shipment or order release.`;

const catalogoTraducoesEn = {
  1: ['Electrical Safety Analyzer', 'Included accessories: 20A power cable, test probe, alligator clip, USB type A / USB type A cable, and user manual. Included additions: SunWeb Software and RBC calibration certificate issued by Metis Metrologia laboratory.'],
  2: ['Backpack', 'Polyester backpack with zipper and adjustable strap. Includes protective foam for the equipment.'],
  3: ['Multi-parameter Simulator', 'Included accessories: power supply and battery charger, universal temperature cable, universal invasive pressure cable, USB cable, 120 cm silicone hose, nylon T connector, and user manual. Included additions: SunWeb Software and RBC-traceable calibration certificate issued by Metis Metrologia laboratory.'],
  4: ['External Volume', 'External volume gift included with purchases of the SMP100 Multi-parameter Simulator.'],
  5: ['Backpack', 'Polyester backpack with zipper and adjustable strap. Includes protective foam for the equipment.'],
  6: ['Pulse Oximeter Tester', 'Included accessories: communication cable and user manual. Included additions: RBC-traceable calibration certificate issued by Metis Metrologia laboratory.'],
  7: ['Carrying Case', 'Polyester carrying case with zipper and adjustable strap. Includes protective foam for the equipment.'],
  8: ['Pulse Oximeter Tester', 'Included accessories: battery charger, USB type A / USB type B cable, communication cable, and user manual. Included additions: SunWeb Software and RBC-traceable calibration certificate issued by Metis Metrologia laboratory.'],
  9: ['Carrying Case', 'Polyester carrying case with zipper and soft internal finish. Includes adjustable internal flap.'],
  10: ['Cardiac Output Module', 'Included accessories: user manual, external injected temperature cable, SPK100 and SMP100 / SMP200 module communication cable. Included additions: RBC-traceable calibration certificate issued by LRM laboratory. Optional: SMP100/SMP200/SPK100.'],
  11: ['Carrying Case', 'Polyester carrying case with zipper and soft internal finish.'],
  12: ['Non-invasive Pressure Simulator', 'Included accessories: power supply, USB cable, 120 cm silicone hose, 3 cuffs, nylon T connector, and user manual. Included additions: SunWeb Software and RBC-traceable calibration certificate issued by Metis Metrologia laboratory.'],
  13: ['Backpack', 'Polyester backpack with zipper and adjustable strap. Includes protective foam for the equipment.'],
  14: ['Mechanical Ventilation Analyzer', 'Included accessories: 10A power cable, USB type A / USB type B cable, and user manual. Included additions: SunWeb Software and RBC-traceable calibration certificate issued by LRM laboratory.'],
  15: ['Backpack', 'Polyester backpack with zipper and adjustable strap. Includes protective foam for the equipment.'],
  16: ['Test Lung for Mechanical Ventilation', 'Used for lung simulation in tests and checks of mechanical ventilators and ventilation analyzers. Volume: 1 L | Compliance: dynamic 20 ml/cmH20 | Maximum pressure: 80 cmH20.'],
  17: ['Defibrillator, Pacemaker and ECG Simulator Analyzer', 'Included accessories: power supply and battery charger, USB type A / USB type B cable, and user manual. Included additions: SunWeb Software and RBC-traceable calibration certificate issued by Metis Metrologia laboratory.'],
  18: ['Backpack', 'Polyester backpack with zipper and adjustable strap. Includes protective foam for the equipment.'],
  19: ['Variable Load Module', 'Included accessories: 4 terminal interconnection cables and user manual. Optional: JAU200. Included additions: RBC-traceable calibration certificate issued by Metis Metrologia laboratory.'],
  20: ['Multi-purpose Carrying Case', 'Polyester carrying case with zipper and soft internal finish. Includes adjustable internal flap.'],
  21: ['Infusion Pump Analyzer', 'Included accessories: power supply, battery charger, USB type A / USB type C cable, syringe, and user manual. Included additions: RBC-traceable calibration certificate issued by Metis Metrologia laboratory.'],
  22: ['Flow Channel (Unit)', 'Flow sensor kit (optional).'],
  23: ['Backpack', 'Polyester backpack with zipper and adjustable strap. Includes protective foam for the equipment.'],
  24: ['Thermal Qualification Analyzer + Acquisition Module', 'Included accessories: user manual and Ethernet cable. Included additions: SunWeb Software and RBC calibration certificate issued by LRM laboratory.'],
  25: ['Backpack', 'Polyester backpack with zipper and adjustable strap. Includes protective foam for the equipment.'],
  26: ['Teflon Tip Thermocouple 24AWG 2.5 m', 'Optional: AQT110. 3-month warranty. 2.5 m thermocouple. Teflon tip. 24AWG thickness.'],
  27: ['Teflon Tip Thermocouple 24AWG 5 m', 'Optional: AQT110. 3-month warranty. 5 m thermocouple. Teflon tip. 24AWG thickness.'],
  28: ['Teflon Tip Thermocouple 30AWG 2.5 m', 'Optional: AQT110. 3-month warranty. 2.5 m thermocouple. Teflon tip. 30AWG thickness.'],
  29: ['Teflon Tip Thermocouple 30AWG 5 m', 'Optional: AQT110. 3-month warranty. 5 m thermocouple. Teflon tip. 30AWG thickness.'],
  30: ['Metal Tip Thermocouple 24AWG 2.5 m', 'Optional: AQT110. 3-month warranty. 2.5 m thermocouple. Metal tip. 24AWG thickness.'],
  31: ['Metal Tip Thermocouple 24AWG 5 m', 'Optional: AQT110. 3-month warranty. 5 m thermocouple. Metal tip. 24AWG thickness.'],
  32: ['Metal Tip Thermocouple 30AWG 2.5 m', 'Optional: AQT110. 3-month warranty. 2.5 m thermocouple. Metal tip. 30AWG thickness.'],
  33: ['Metal Tip Thermocouple 30AWG 5 m', 'Optional: AQT110. 3-month warranty. 5 m thermocouple. Metal tip. 30AWG thickness.'],
  34: ['Pressure Module', 'Optional: AQT110. Included additions: RBC-traceable calibration certificate issued by LRM laboratory.'],
  35: ['Humidity Module', 'Optional: AQT110. Included additions: RBC-traceable calibration certificate issued by LRM laboratory.'],
  36: ['Multi-parameter Simulator', 'Included accessories: user manual. Included additions: SunWeb Software and RBC-traceable calibration certificate issued by Metis Metrologia laboratory.'],
  37: ['Multi-purpose Carrying Case', 'Polyester carrying case with zipper and soft internal finish. Includes adjustable internal flap.'],
  38: ['Pressure and Sphygmomanometer Analyzer', 'Included accessories: user manual. Included additions: SunWeb Software and RBC calibration certificate issued by Metis Metrologia laboratory.'],
  39: ['Multi-purpose Carrying Case', 'Polyester carrying case with zipper and soft internal finish. Includes adjustable internal flap.'],
  40: ['ECG Simulator', 'Included accessories: 3 AAA alkaline batteries. Included additions: RBC-traceable calibration certificate issued by Metis Metrologia laboratory. Optional: SMP100/SMP200/SPK100.'],
  41: ['Carrying Case', 'Polyester carrying case with zipper and soft internal finish.'],
  42: ['Electrosurgical Unit Analyzer', 'Included accessories: case, power supply and battery charger, 8 terminal interconnection cables, USB cable, and user manual. Included additions: SunWeb Software and RBC-traceable calibration certificate issued by Metis Metrologia laboratory.'],
  43: ['Electrosurgical Unit Analyzer', 'Included accessories: battery charger, mini USB type A / type B cable, 2 banana plug and/or alligator clip connection cables, and user manual. Included additions: SunWeb Software and RBC-traceable calibration certificate issued by Metis Metrologia laboratory.'],
  44: ['Multi-purpose Carrying Case', 'Polyester carrying case with zipper and soft internal finish. Includes adjustable internal flap.'],
  45: ['Impedance Simulator', 'Included accessories: user manual. Optional: ABI100. Included additions: RBC-traceable calibration certificate issued by LRM laboratory.'],
  46: ['Multi-purpose Carrying Case', 'Polyester carrying case with zipper and soft internal finish. Includes adjustable internal flap.'],
  47: ['Variable Load Module', 'Included accessories: 3 return cables, 4 connection cables 10 cm, 4 connection cables 25 cm, 2 medium alligator clips, 10A power cable, and user manual. Optional: ABI100/ABI200. Included additions: RBC-traceable calibration certificate issued by Metis Metrologia laboratory.'],
  48: ['Variable Load Module', 'Included accessories: 3 return cables, 4 connection cables 10 cm, 4 connection cables 25 cm, 2 medium alligator clips, 10A power cable, and user manual. Optional: ABI100/ABI200. Included additions: RBC-traceable calibration certificate issued by Metis Metrologia laboratory.'],
  49: ['Neonatal Incubator Analyzer', 'Included accessories: 1 Skin Sensor Module (MSP), 1 Central Internal Module (MIC), 4 Peripheral Internal Modules (MIP) (A, B, C and D), 1 10A power cable, 1 mini USB, 1 5V charger, 1 USB, 4 MIC-MIP communication cables, and 1 MIC-MSP communication cable. Included additions: SunWeb Software and RBC-traceable calibration certificate issued by LRM laboratory.'],
  50: ['Backpack', 'Polyester backpack with zipper and adjustable strap. Includes protective foam for the equipment.']
};

function textoCatalogo(p, campo) {
  const traducao = isOperacaoInternacional() ? catalogoTraducoesEn[p.id] : null;
  if (campo === 'produto') return traducao?.[0] || p.produto;
  if (campo === 'descricao') return traducao?.[1] || p.descricao;
  if (campo === 'und') return isOperacaoInternacional() ? 'Unit' : p.und;
  if (campo === 'prazoSemCalib' || campo === 'prazoComCalib') {
    const valor = p[campo] || '';
    if (!isOperacaoInternacional()) return valor;
    return String(valor)
      .replace(/(\d+)\s*dias?/i, '$1 days')
      .replace(/Sob Encomenda/i, 'Upon request');
  }
  return p[campo];
}

function textoObservacoesPadrao(internacional = isOperacaoInternacional()) {
  return internacional ? OBS_PADRAO_EN : OBS_PADRAO_PT;
}

function atualizarObservacoesOperacao(internacional) {
  const obs = document.getElementById('observacoes');
  if (!obs) return;
  const atual = obs.value.trim();
  if (!atual || atual === OBS_PADRAO_PT.trim() || atual === OBS_PADRAO_EN.trim()) {
    obs.value = textoObservacoesPadrao(internacional);
  }
}

function aplicarTextosCatalogoModal() {
  const internacional = isOperacaoInternacional();
  const modal = document.getElementById('modalCatalogo');
  if (!modal) return;

  const titulo = modal.querySelector('h2');
  const subtitulo = modal.querySelector('h2 + p');
  const busca = document.getElementById('buscaCatalogo');
  const filtro = document.getElementById('filtroCatalogo');
  const botoes = modal.querySelectorAll('button');

  if (titulo) titulo.textContent = internacional
    ? '📦 MAERA Product Catalog'
    : '📦 Catálogo de Produtos MAERA';
  if (subtitulo) subtitulo.textContent = internacional
    ? 'Select products, adjust quantities, and add them to the quotation'
    : 'Selecione os produtos, ajuste as quantidades e adicione ao orçamento';
  if (busca) busca.placeholder = internacional
    ? '🔍 Search product, model...'
    : '🔍 Buscar produto, modelo...';
  if (filtro?.options?.[0]) filtro.options[0].textContent = internacional
    ? 'All models'
    : 'Todos os modelos';

  const cancelar = Array.from(botoes).find(btn => btn.textContent.trim() === 'Cancelar' || btn.textContent.trim() === 'Cancel');
  if (cancelar) cancelar.textContent = internacional ? 'Cancel' : 'Cancelar';

  const adicionar = Array.from(botoes).find(btn => btn.textContent.includes('Adicionar ao Orçamento') || btn.textContent.includes('Add to Quotation'));
  if (adicionar) adicionar.innerHTML = internacional
    ? '<i class="fa-solid fa-plus"></i> Add to Quotation'
    : '<i class="fa-solid fa-plus"></i> Adicionar ao Orçamento';
}

function ehEstadoMinasGerais(valor) {
  const uf = String(valor || '')
    .trim()
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  return uf === 'MG' ||
    uf === 'MINAS GERAIS' ||
    uf === 'MINAS GERAIS';
}

function isOperacaoInternacional() {
  return !!document.getElementById('operacaoInternacional')?.checked;
}

function atualizarMoedaOrcamento() {
  const moeda = document.getElementById('moeda')?.value || 'BRL';
  const boxCotacao = document.getElementById('boxCotacaoDolar');
  const cotacaoEl = document.getElementById('cotacaoDolar');
  window.moedaAtual = moeda;
  window.cotacaoDolarAtual = getCotacaoDolar();

  if (boxCotacao) boxCotacao.style.display = moeda === 'USD' ? 'block' : 'none';
  if (cotacaoEl) cotacaoEl.required = isOperacaoInternacional() && moeda === 'USD';

  document.querySelectorAll('#tbodyItens tr').forEach(tr => {
    const unitEl = tr.querySelector('.it-unit');
    const valorBRL = parseFloat(tr.dataset.valorUnitBrl || '');
    if (unitEl) {
      if (moeda === 'USD' && !Number.isFinite(valorBRL)) {
        tr.dataset.valorUnitBrl = parseMoeda(unitEl.value);
      }
      const valorBaseBRL = parseFloat(tr.dataset.valorUnitBrl || '');
      const valorAtual = Number.isFinite(valorBRL)
        ? converterBRLParaMoeda(valorBRL, moeda)
        : Number.isFinite(valorBaseBRL)
        ? converterBRLParaMoeda(valorBaseBRL, moeda)
        : parseMoeda(unitEl.value);
      unitEl.value = formatMoeda(valorAtual, moeda);
      calcLinha(unitEl);
    }
  });

  if (document.getElementById('modalCatalogo')?.style.display === 'flex') {
    aplicarTextosCatalogoModal();
    renderCatalogo(obterListaFiltrada());
    atualizarCount();
    atualizarBtnSelecionarTodos();
  }

  calcTotais();
}

function toggleOperacaoInternacional() {
  const internacional = isOperacaoInternacional();
  const box = document.getElementById('boxInternacional');
  const contribuinte = document.getElementById('contribuinte');
  const estado = document.getElementById('estado');
  const cnpj = document.getElementById('cnpj');
  const inscricao = document.getElementById('inscricaoEstadual');
  const cep = document.getElementById('cep');

  if (box) box.style.display = internacional ? 'block' : 'none';

  if (contribuinte) {
    contribuinte.value = internacional ? 'nao' : contribuinte.value;
    contribuinte.disabled = internacional;
    contribuinte.title = internacional
      ? 'Operação internacional não utiliza ICMS/DIFAL brasileiro'
      : '';
  }

  if (estado) {
    estado.required = !internacional;
    estado.disabled = internacional;
    if (internacional) estado.value = '';
  }

  if (cnpj) {
    cnpj.maxLength = internacional ? 40 : 18;
    cnpj.placeholder = internacional
      ? 'Tax ID / VAT / Documento internacional'
      : '00.000.000/0000-00';
  }
  if (inscricao) {
    inscricao.disabled = internacional;
    if (internacional) inscricao.value = '';
  }
  if (cep) {
    cep.maxLength = internacional ? 20 : 9;
    cep.placeholder = internacional ? 'Postal code' : '00000-000';
  }

  if (internacional) {
    const moedaEl = document.getElementById('moeda');
    if (moedaEl && moedaEl.value === 'BRL') moedaEl.value = 'USD';
    const secDifal = document.getElementById('secDifal');
    if (secDifal) {
      secDifal.checked = false;
      toggleCardSec('lbDifal', false);
    }
  } else {
    const moedaEl = document.getElementById('moeda');
    if (moedaEl) moedaEl.value = 'BRL';
    const cotacaoEl = document.getElementById('cotacaoDolar');
    if (cotacaoEl) cotacaoEl.required = false;
  }

  atualizarMoedaOrcamento();
  atualizarObservacoesOperacao(internacional);
  calcTotais();
  recalcularFiscalForm();
  if (typeof recalcularSimulacao === 'function') recalcularSimulacao();
  if (typeof aplicarPagamentoInternacional === 'function') aplicarPagamentoInternacional();
}

/* ══════════════════════════════════════════
   INIT
   ══════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);
  editandoId   = params.get('id');

  const hoje     = new Date();
  const validade = new Date();
  validade.setDate(hoje.getDate() + 10);

  document.getElementById('emissao').value   = formatDateInput(hoje);
  document.getElementById('validoAte').value = formatDateInput(validade);
  gerarNumero().then(n => {
    document.getElementById('numero').value = n;
  });

  /* ── Máscaras ── */
  document.getElementById('cep').addEventListener('input', e => {
    e.target.value = mascaraCEP(e.target.value);
  });
  document.getElementById('telefone').addEventListener('input', e => {
    e.target.value = mascaraTelefone(e.target.value);
  });

  /* ══════════════════════════════════════════
     CNPJ / CPF — máscara + detecção automática
  ══════════════════════════════════════════ */
  const cnpjEl = document.getElementById('cnpj');
  if (cnpjEl) {
    cnpjEl.addEventListener('input', function () {
      if (isOperacaoInternacional()) return;
      this.value    = mascaraCNPJ(this.value);
      const digits  = this.value.replace(/\D/g, '');
      const sel     = document.getElementById('contribuinte');
      const estado  = document.getElementById('estado')?.value || '';

      if (digits.length === 11) {
        if (sel) {
          sel.value    = 'nao';
          sel.disabled = true;
          sel.title    = 'Pessoa Física (CPF) é sempre Não Contribuinte de ICMS';
        }
        if (!estado) {
          showToast('👤 CPF detectado! Selecione o Estado para calcular o DIFAL.', 'info');
        } else {
          showToast('👤 CPF detectado — Não Contribuinte definido automaticamente', 'info');
        }
        calcTotais();
        recalcularFiscalForm();
      } else if (digits.length === 14) {
        if (sel) { sel.disabled = false; sel.title = ''; }
        consultarCNPJ(this.value);
      } else {
        if (sel) { sel.disabled = false; sel.title = ''; }
      }
    });
  }

  /* ── Fecha modal ao clicar fora ── */
  document.getElementById('modalCatalogo').addEventListener('click', function (e) {
    if (e.target === this) fecharCatalogo();
  });

  if (editandoId) {
    document.getElementById('tituloForm').textContent = '✏️ Editar Orçamento';
    carregarEdicao(editandoId);
  }

  atualizarSemItens();
  carregarVendedores();

  if (typeof onTotalAtualizado === 'function') onTotalAtualizado(0);

  toggleOperacaoInternacional();

  /* ── Estado ── */
  const estadoEl = document.getElementById('estado');
  if (estadoEl) {
    estadoEl.addEventListener('change', () => {
      calcTotais();
      recalcularFiscalForm();
      const cnpjDigits = (document.getElementById('cnpj')?.value || '').replace(/\D/g, '');
      const estado     = estadoEl.value;
      const ehMG       = ehEstadoMinasGerais(estado);
      if (cnpjDigits.length === 11 && estado && !ehMG) {
        showToast(`⚖️ DIFAL calculado para CPF no estado ${estado}`, 'info');
      }
    });
  }

  const contribuinteEl = document.getElementById('contribuinte');
  if (contribuinteEl) {
    contribuinteEl.addEventListener('change', () => {
      calcTotais();
      recalcularFiscalForm();
      if (typeof recalcularSimulacao === 'function') recalcularSimulacao();
    });
  }
});

/* ══════════════════════════════════════════
   VENDEDORES
   ══════════════════════════════════════════ */
async function carregarVendedores() {
  const urlVendedores = typeof API_VENDEDORES !== 'undefined'
    ? API_VENDEDORES
    : `${window.location.origin}/api/vendedores`;

  const token = localStorage.getItem('maera_token');
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  const select = document.getElementById('vendedor');

  const aplicarVendedorLogado = usuario => {
    if (!usuario || !select) return false;

    select.innerHTML = '';
    const opt = document.createElement('option');
    opt.value = usuario.nome || '';
    opt.textContent = usuario.nome || usuario.login || 'Vendedor logado';
    select.appendChild(opt);
    select.value = opt.value;
    select.disabled = true;
    select.title = `Selecionado automaticamente pelo login ${usuario.login || ''}`.trim();
    return true;
  };

  try {
    const usuarioSalvo = JSON.parse(localStorage.getItem('maera_usuario') || 'null');
    if (usuarioSalvo && !usuarioSalvo.master) {
      usuarioLogado = usuarioSalvo;
      aplicarVendedorLogado(usuarioLogado);
    }
  } catch {}

  usuarioLogado = typeof getSessaoAtual === 'function'
    ? await getSessaoAtual()
    : null;

  if (usuarioLogado && !usuarioLogado.master && aplicarVendedorLogado(usuarioLogado)) {
    return;
  }

  fetch(urlVendedores, { credentials: 'include', headers })
    .then(res => {
      if (res.status === 401) {
        localStorage.removeItem('maera_token');
        window.location.href = 'login.html';
        throw new Error('Login necessario');
      }
      if (!res.ok) throw new Error(`Erro ${res.status} ao buscar vendedores`);
      return res.json();
    })
    .then(lista => {
      if (!select) return;
      const valorAtual = select.value;
      select.innerHTML = '<option value="">Selecione o vendedor</option>';
      lista
        .filter(vendedor => !vendedor.master)
        .forEach(vendedor => {
        const opt       = document.createElement('option');
        opt.value       = vendedor.nome || vendedor;
        opt.textContent = vendedor.nome || vendedor;
        select.appendChild(opt);
      });
      select.disabled = false;
      if (valorAtual) select.value = valorAtual;
    })
    .catch(err => console.error('Erro ao carregar vendedores:', err));
}
/* ══════════════════════════════════════════
   CARREGAR EDIÇÃO
   ══════════════════════════════════════════ */
async function carregarEdicao(id) {
  const _lista = await getOrcamentos();
  const o      = _lista.find(x => x.id === id);
  if (!o) return;

  const setV = (elId, val) => {
    const el = document.getElementById(elId);
    if (el) el.value = val || '';
  };

  setV('numero',            o.numero);
  setV('emissao',           o.emissao);
  setV('validoAte',         o.validoAte);
  setV('tipoFrete',         o.tipoFrete         || 'CIF');
  const opIntEl = document.getElementById('operacaoInternacional');
  if (opIntEl) opIntEl.checked = !!o.operacaoInternacional;
  setV('pais',              o.pais);
  setV('taxId',             o.taxId);
  setV('moeda',             o.moeda || 'BRL');
  setV('cotacaoDolar',      o.cotacaoDolar || '');
  setV('incoterm',          o.incoterm);
  window.moedaAtual = o.moeda || 'BRL';
  window.cotacaoDolarAtual = o.cotacaoDolar || 1;
  toggleOperacaoInternacional();
  setV('razaoSocial',       o.razaoSocial);
  setV('contribuinte',      o.contribuinte);
  setV('cnpj',              o.cnpj);
  setV('Contato',           o.Contato);
  setV('logradouro',        o.logradouro);
  setV('numEndereco',       o.numEndereco);
  setV('complemento',       o.complemento);
  setV('bairro',            o.bairro);
  setV('cep',               o.cep);
  setV('cidade',            o.cidade);
  setV('estado',            o.estado);
  setV('inscricaoEstadual', o.inscricaoEstadual);
  setV('email',             o.email);
  setV('telefone',          o.telefone);
  setV('infoAdicional',     o.infoAdicional);
  setV('observacoes',       o.observacoes);

  const statusEl = document.getElementById('status');
  if (statusEl) statusEl.value = o.status || 'novo';

  /* ✅ Detecta CPF ao carregar edição */
  const cnpjDigits = (o.cnpj || '').replace(/\D/g, '');
  const selContrib = document.getElementById('contribuinte');
  if (cnpjDigits.length === 11 && selContrib) {
    selContrib.value    = 'nao';
    selContrib.disabled = true;
    selContrib.title    = 'Pessoa Física (CPF) é sempre Não Contribuinte de ICMS';
  } else if (selContrib) {
    selContrib.disabled = false;
    selContrib.title    = '';
  }

  await new Promise(resolve => setTimeout(resolve, 400));
  const vendEl = document.getElementById('vendedor');
  if (vendEl && o.vendedor) vendEl.value = o.vendedor;

  const dg      = o.descontoGlobal || {};
  const tipoEl  = document.getElementById('tipoDesconto');
  const valorEl = document.getElementById('valorDesconto');
  if (tipoEl)  tipoEl.value  = dg.tipo === 'fixo' ? 'fixo' : 'perc';
  if (valorEl) valorEl.value = dg.tipo === 'fixo'
    ? (dg.valor || 0)
    : (dg.valor !== undefined ? dg.valor : (o.desconto || 0));
  if (tipoEl && valorEl) atualizarLabelDesconto();

  /* ── Seções opcionais ── */
  const sec    = o.secoes || {};
  const chkMap = {
    secDetalhamento : 'lbDetalhamento',
    secCondPagamento: 'lbCondPagamento',
    secCalibracao   : 'lbCalibracao',
    secSoftware     : 'lbSoftware',
    secTreinamento  : 'lbTreinamento',
    secDifal        : 'lbDifal'
  };
  const secKeys = {
    secDetalhamento : 'detalhamento',
    secCondPagamento: 'condPagamento',
    secCalibracao   : 'calibracao',
    secSoftware     : 'software',
    secTreinamento  : 'treinamento',
    secDifal        : 'difal'
  };
  Object.keys(chkMap).forEach(chkId => {
    const el = document.getElementById(chkId);
    if (el) {
      const isChecked = sec[secKeys[chkId]] !== false;
      el.checked = isChecked;
      toggleCardSec(chkMap[chkId], isChecked);
    }
  });

  /* ── Checkboxes simulador ── */
  const chkPix    = document.getElementById('sim_chk_pix');
  const chkCartao = document.getElementById('sim_chk_cartao');
  const chkBoleto = document.getElementById('sim_chk_boleto');
  if (chkPix)    chkPix.checked    = sec.pix    !== false;
  if (chkCartao) chkCartao.checked = sec.cartao !== false;
  if (chkBoleto) chkBoleto.checked = sec.boleto !== false;

  const descNeg = o.descontoNegociacao || {};
  const tipoDescNegEl  = document.getElementById('sim_tipo_desconto_negociacao');
  const valorDescNegEl = document.getElementById('sim_valor_desconto_negociacao');
  if (tipoDescNegEl)  tipoDescNegEl.value  = descNeg.tipo === 'fixo' ? 'fixo' : 'perc';
  if (valorDescNegEl) valorDescNegEl.value = descNeg.valor || 0;

  const condPag = o.condicaoPagamento || {};
  const tipoCondEl = document.getElementById('sim_tipo_condicao');
  if (tipoCondEl) tipoCondEl.value = condPag.tipo === 'personalizada' ? 'personalizada' : 'padrao';
  if (typeof _tipoCondicaoPagamento !== 'undefined') {
    _tipoCondicaoPagamento = condPag.tipo === 'personalizada' ? 'personalizada' : 'padrao';
  }
  if (typeof _CondiçõesPersonalizadas !== 'undefined') {
    _CondiçõesPersonalizadas = Array.isArray(condPag.personalizadas)
      ? condPag.personalizadas
      : [];
  }
  if (typeof atualizarCondicaoPersonalizadaUI === 'function') atualizarCondicaoPersonalizadaUI();

  /* ── Destaques salvos ── */
  const destaques = o.destaques || {};
  if (typeof _destCartao !== 'undefined') _destCartao = destaques.cartao || null;
  if (typeof _destBoleto !== 'undefined') _destBoleto = destaques.boleto || null;
  if (typeof _beneficiosCartao !== 'undefined') _beneficiosCartao = destaques.beneficiosCartao || {};

  /* ── Itens ── */
  if (o.itens && o.itens.length > 0) {
    o.itens.forEach(it => addItem(it, true));
  }

  calcTotais();
  atualizarSemItens();
  preencherFiscalForm(o.fiscal);
}

/* ══════════════════════════════════════════
   LABEL DO DESCONTO
   ══════════════════════════════════════════ */
function atualizarLabelDesconto() {
  calcTotais();
}

/* ══════════════════════════════════════════
   COLETAR DADOS
   ══════════════════════════════════════════ */
function coletarDados() {
  const itens = [];
  document.querySelectorAll('#tbodyItens tr').forEach(tr => {
    const descEl     = tr.querySelector('.it-desc');
    const qtdEl      = tr.querySelector('.it-qtd');
    const undEl      = tr.querySelector('.it-und');
    const scEl       = tr.querySelector('.it-prazosc');
    const ccEl       = tr.querySelector('.it-prazocc');
    const unitEl     = tr.querySelector('.it-unit');
    const totalEl    = tr.querySelector('.it-total');
    const descTipoEl = tr.querySelector('.it-desc-tipo');
    const descValEl  = tr.querySelector('.it-desc-val');
    if (!descEl) return;

    const qtd  = parseFloat(qtdEl?.value)  || 0;
    const unit = parseMoeda(unitEl?.value  || '');
    const tot  = parseMoeda(totalEl?.value || '');

    const descItem = (descTipoEl && descValEl) ? {
      tipo : descTipoEl.value,
      valor: parseFloat(descValEl.value) || 0
    } : null;

    itens.push({
      descricao: descEl.value || '',
      qtd,
      und      : undEl?.value || 'Unid.',
      prazoSC  : scEl?.value  || '',
      prazoCC  : ccEl?.value  || '',
      valorUnit: unit,
      valorUnitBRL: parseFloat(tr.dataset.valorUnitBrl || '') || null,
      total    : tot,
      descItem,
      imagem   : tr.dataset.imagem || null,  // ✅ LINHA ADICIONADA
      catalogoId: tr.dataset.catalogoId ? parseInt(tr.dataset.catalogoId, 10) : null
    });
  });

  const chk    = id => { const el = document.getElementById(id); return el ? el.checked : true; };
  const getVal = id => { const el = document.getElementById(id); return el ? el.value   : '';   };

  const tipoDesc  = getVal('tipoDesconto') || 'perc';
  const valorDesc = parseFloat(getVal('valorDesconto')) || 0;
  const tipoDescNeg  = getVal('sim_tipo_desconto_negociacao') || 'perc';
  const valorDescNeg = parseFloat(getVal('sim_valor_desconto_negociacao')) || 0;

  return {
    id                : editandoId || gerarId(),
    numero            : getVal('numero'),
    emissao           : getVal('emissao'),
    validoAte         : getVal('validoAte'),
    vendedor          : usuarioLogado && !usuarioLogado.master
      ? usuarioLogado.nome
      : getVal('vendedor'),
    tipoFrete         : getVal('tipoFrete')  || 'CIF',
    operacaoInternacional: isOperacaoInternacional(),
    pais              : getVal('pais'),
    taxId             : getVal('taxId'),
    moeda             : isOperacaoInternacional() ? (getVal('moeda') || 'USD') : 'BRL',
    cotacaoDolar      : isOperacaoInternacional() && (getVal('moeda') || 'BRL') === 'USD'
      ? (parseFloat(String(getVal('cotacaoDolar') || '').replace(',', '.')) || null)
      : null,
    incoterm          : getVal('incoterm'),
    status            : getVal('status')     || 'novo',
    razaoSocial       : getVal('razaoSocial'),
    contribuinte      : isOperacaoInternacional() ? 'nao' : getVal('contribuinte'),
    cnpj              : getVal('cnpj'),
    Contato           : getVal('Contato'),
    logradouro        : getVal('logradouro'),
    numEndereco       : getVal('numEndereco'),
    complemento       : getVal('complemento'),
    bairro            : getVal('bairro'),
    cep               : getVal('cep'),
    cidade            : getVal('cidade'),
    estado            : isOperacaoInternacional() ? '' : getVal('estado'),
    inscricaoEstadual : getVal('inscricaoEstadual'),
    email             : getVal('email'),
    telefone          : getVal('telefone'),
    infoAdicional     : getVal('infoAdicional'),
    observacoes       : getVal('observacoes'),
    descontoGlobal    : { tipo: tipoDesc, valor: valorDesc },
    descontoNegociacao: { tipo: tipoDescNeg, valor: valorDescNeg },
    condicaoPagamento : {
      tipo: typeof _tipoCondicaoPagamento !== 'undefined'
        ? _tipoCondicaoPagamento
        : (getVal('sim_tipo_condicao') || 'padrao'),
      personalizadas: typeof _CondiçõesPersonalizadas !== 'undefined'
        ? _CondiçõesPersonalizadas
        : []
    },
    fiscal            : isOperacaoInternacional()
      ? { ...getFiscalParams(), internacional: true, difalDesabilitado: true }
      : getFiscalParams(),
    secoes: {
      detalhamento : chk('secDetalhamento'),
      condPagamento: chk('secCondPagamento'),
      calibracao   : chk('secCalibracao'),
      software     : chk('secSoftware'),
      treinamento  : chk('secTreinamento'),
      difal        : chk('secDifal'),
      pix          : chk('sim_chk_pix'),
      cartao       : chk('sim_chk_cartao'),
      boleto       : chk('sim_chk_boleto')
    },
    destaques: {
      cartao: typeof _destCartao !== 'undefined' ? _destCartao : null,
      boleto: typeof _destBoleto !== 'undefined' ? _destBoleto : null,
      beneficiosCartao: typeof _beneficiosCartao !== 'undefined' ? _beneficiosCartao : {}
    },
    itens
  };
}

/* ══════════════════════════════════════════
   HELPERS DE VALIDAÇÃO
   ══════════════════════════════════════════ */

/* ── Marca campo com erro visual ── */
function marcarErro(el) {
  if (!el) return;
  el.style.borderColor  = '#ef4444';
  el.style.boxShadow    = '0 0 0 3px rgba(239,68,68,.15)';
  el.style.borderRadius = '8px';
  /* Remove o destaque ao começar a digitar/alterar */
  el.addEventListener('input',  function limpar() {
    limparErro(el);
    el.removeEventListener('input',  limpar);
    el.removeEventListener('change', limpar);
  });
  el.addEventListener('change', function limpar() {
    limparErro(el);
    el.removeEventListener('input',  limpar);
    el.removeEventListener('change', limpar);
  });
}

/* ── Remove erro visual do campo ── */
function limparErro(el) {
  if (!el) return;
  el.style.borderColor = '';
  el.style.boxShadow   = '';
}

/* ══════════════════════════════════════════
   SALVAR E VISUALIZAR
   ✅ Validação dos campos obrigatórios (*)
   ══════════════════════════════════════════ */
async function salvarEVisualizar() {
  const form = document.getElementById('formOrcamento');

  /* ── 1️⃣ Validação nativa HTML ── */
  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }

  /* ── 2️⃣ Campos obrigatórios com asterisco (*) ── */
  const camposObrigatorios = [
    { id: 'razaoSocial', label: 'Razão Social / Nome Completo' },
    { id: 'Contato',     label: 'Nome do Contato'              },
    { id: 'email',       label: 'E-mail'                       },
    { id: 'telefone',    label: 'WhatsApp'                     }
  ];
  if (isOperacaoInternacional()) {
    camposObrigatorios.push({ id: 'pais', label: 'País' });
    if ((document.getElementById('moeda')?.value || 'BRL') === 'USD') {
      camposObrigatorios.push({ id: 'cotacaoDolar', label: 'Cotação do dólar' });
    }
  } else {
    camposObrigatorios.push({ id: 'estado', label: 'Estado' });
  }

  const erros = [];

  camposObrigatorios.forEach(({ id, label }) => {
    const el    = document.getElementById(id);
    if (!el) return;
    const vazio = !el.value || !el.value.trim();
    if (vazio) {
      marcarErro(el);
      erros.push(label);
    } else {
      limparErro(el);
    }
  });

  /* ── Exibe erros e rola até o primeiro campo ── */
  if (erros.length > 0) {
    showToast(
      `⚠️ Preencha os campos obrigatórios: ${erros.join(', ')}`,
      'warn'
    );

    const primeiroId = camposObrigatorios.find(({ id }) => {
      const el = document.getElementById(id);
      return el && (!el.value || !el.value.trim());
    })?.id;

    if (primeiroId) {
      const elErro = document.getElementById(primeiroId);
      elErro?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(() => elErro?.focus(), 400);
    }
    return;
  }

  /* ── 3️⃣ Verifica se há pelo menos 1 item ── */
  const dados = coletarDados();

  if (dados.itens.length === 0) {
    showToast('⚠️ Adicione ao menos 1 item ao orçamento!', 'warn');
    return;
  }

  /* ── 4️⃣ Salva e redireciona ── */
  showToast('💾 Salvando...', 'info');
  const resultado = await saveOrcamento(dados);

  if (!resultado) {
    showToast('❌ Erro ao salvar. Verifique se o servidor está rodando.', 'error');
    return;
  }

  showToast(`✅ Orçamento salvo com ${dados.itens.length} item(s)!`, 'success');
  setTimeout(() => {
    window.location.href = `visualizar.html?id=${resultado.id}`;
  }, 800);
}
/* ══════════════════════════════════════════
   ITENS
   ══════════════════════════════════════════ */
function addItem(it = null, silencioso = false) {
  itemCount++;
  const tbody = document.getElementById('tbodyItens');
  const tr    = document.createElement('tr');

  tr.innerHTML = `
    <td>
      <input type="text" class="input input-sm it-desc"
        placeholder="Descrição"/>
    </td>
    <td>
      <input type="number" class="input input-sm it-qtd"
        min="0" step="0.001"
        style="width:65px"/>
    </td>
    <td>
      <input type="text" class="input input-sm it-und"
        style="width:58px"/>
    </td>
    <td>
      <input type="text" class="input input-sm it-prazosc"
        placeholder="Ex: 45 dias" style="width:95px"/>
    </td>
    <td>
      <input type="text" class="input input-sm it-prazocc"
        placeholder="Ex: 45 dias" style="width:95px"/>
    </td>
    <td>
      <input type="text" class="input input-sm it-unit"
        oninput="maskMoeda(this)" onfocus="this.select()"
        style="width:110px"/>
    </td>
    <td>
      <div style="display:flex;align-items:center;gap:4px">
        <select class="input input-sm it-desc-tipo"
          style="width:46px" oninput="calcLinha(this)">
          <option value="perc">%</option>
          <option value="fixo">R$</option>
        </select>
        <input type="number" class="input input-sm it-desc-val"
          min="0" step="0.01" value="0"
          style="width:70px" oninput="calcLinha(this)"/>
      </div>
    </td>
    <td>
      <input type="text" class="input input-sm it-total"
        readonly style="width:110px"/>
    </td>
    <td>
      <button type="button" class="btn-icon danger"
        onclick="this.closest('tr').remove();calcTotais();atualizarSemItens()">
        <i class="fa-solid fa-trash"></i>
      </button>
    </td>`;

  tr.querySelector('.it-desc').value    = it?.descricao || '';
  tr.dataset.imagem = it?.imagem || '';
  tr.dataset.valorUnitBrl = it?.valorUnitBRL || '';
  tr.dataset.catalogoId = it?.catalogoId || '';
  tr.querySelector('.it-qtd').value     = it?.qtd       || 1;
  tr.querySelector('.it-und').value     = it?.und       || 'Unid.';
  tr.querySelector('.it-prazosc').value = it?.prazoSC   || '';
  tr.querySelector('.it-prazocc').value = it?.prazoCC   || '';
  tr.querySelector('.it-unit').value    = it ? formatMoeda(it.valorUnit || 0) : formatMoeda(0);

  if (it?.descItem) {
    tr.querySelector('.it-desc-tipo').value = it.descItem.tipo  || 'perc';
    tr.querySelector('.it-desc-val').value  = it.descItem.valor || 0;
  }

  /* ── Calcula total inicial da linha ── */
  const qtd      = parseFloat(tr.querySelector('.it-qtd').value)     || 0;
  const unit     = parseMoeda(tr.querySelector('.it-unit').value);
  const descTipo = tr.querySelector('.it-desc-tipo').value;
  const descVal  = parseFloat(tr.querySelector('.it-desc-val').value) || 0;
  let   total    = qtd * unit;
  if (descTipo === 'perc') total = total * (1 - descVal / 100);
  else                     total = Math.max(0, total - descVal);

  tr.querySelector('.it-total').value = it
    ? formatMoeda(it.total || total)
    : formatMoeda(total);

  tbody.appendChild(tr);
  atualizarSemItens();

  if (!silencioso) calcTotais();
}

/* ── Recalcula a linha ao alterar qtd/unit/desc ── */
function calcLinha(el) {
  const tr       = el.closest('tr');
  const qtd      = parseFloat(tr.querySelector('.it-qtd').value)     || 0;
  const unit     = parseMoeda(tr.querySelector('.it-unit').value);
  const descTipo = tr.querySelector('.it-desc-tipo').value;
  const descVal  = parseFloat(tr.querySelector('.it-desc-val').value) || 0;

  let total = qtd * unit;
  if (descTipo === 'perc') total = total * (1 - descVal / 100);
  else                     total = Math.max(0, total - descVal);

  tr.querySelector('.it-total').value = formatMoeda(total);
  calcTotais();
}

/* ── Máscara monetária no campo valor unitário ── */
function maskMoeda(el) {
  let v = el.value.replace(/\D/g, '');
  v = (parseInt(v || '0') / 100).toFixed(2);
  el.value = formatMoeda(parseFloat(v));
  const tr = el.closest('tr');
  if (tr && getMoedaAtual() === 'BRL') {
    tr.dataset.valorUnitBrl = parseMoeda(el.value);
  }
  calcTotais();
}

/* ── Exibe/oculta aviso de tabela vazia ── */
function atualizarSemItens() {
  const semItens = document.getElementById('semItens');
  const rows     = document.querySelectorAll('#tbodyItens tr');
  if (semItens) semItens.style.display = rows.length === 0 ? 'flex' : 'none';
}
/* ══════════════════════════════════════════
   CALC TOTAIS
   ══════════════════════════════════════════ */
function calcTotais() {
  let subtotalBruto  = 0;
  let totalDescItens = 0;

  document.querySelectorAll('#tbodyItens tr').forEach(tr => {
    const qtdEl      = tr.querySelector('.it-qtd');
    const unitEl     = tr.querySelector('.it-unit');
    const totalEl    = tr.querySelector('.it-total');
    const descTipoEl = tr.querySelector('.it-desc-tipo');
    const descValEl  = tr.querySelector('.it-desc-val');
    if (!qtdEl) return;

    const qtd      = parseFloat(qtdEl.value)     || 0;
    const unit     = parseMoeda(unitEl?.value     || '');
    const bruto    = qtd * unit;
    const descTipo = descTipoEl?.value            || 'perc';
    const descVal  = parseFloat(descValEl?.value) || 0;

    let itemDesc = 0;
    if (descTipo === 'perc') itemDesc = bruto * descVal / 100;
    else                     itemDesc = Math.min(descVal, bruto);

    const itemTotal = bruto - itemDesc;
    if (totalEl) totalEl.value = formatMoeda(itemTotal);

    subtotalBruto  += bruto;
    totalDescItens += itemDesc;
  });

  /* ── Descontos por item ── */
  const rowDescItens = document.getElementById('rowDescontoItens');
  const elDescItens  = document.getElementById('descontoItens');
  if (rowDescItens && elDescItens) {
    rowDescItens.style.display = totalDescItens > 0 ? 'flex' : 'none';
    elDescItens.textContent    = formatMoeda(totalDescItens);
  }

  const subtotalLiquido = subtotalBruto - totalDescItens;

  /* ── Desconto global ── */
  const tipoEl  = document.getElementById('tipoDesconto');
  const valorEl = document.getElementById('valorDesconto');
  const tipo    = tipoEl  ? tipoEl.value               : 'perc';
  const valor   = valorEl ? (parseFloat(valorEl.value) || 0) : 0;

  let descGlobalVal = 0;
  if (tipo === 'perc') descGlobalVal = subtotalLiquido * valor / 100;
  else                 descGlobalVal = Math.min(valor, subtotalLiquido);

  const totalSemDifal = Math.max(0, subtotalLiquido - descGlobalVal);

  window.descontoItensVal  = totalDescItens;
  window.descontoGlobalVal = descGlobalVal;
  window.totalItensOrcamentoSemDifal = subtotalBruto;

  const rowDG = document.getElementById('rowDescontoGlobal');
  const elDGV = document.getElementById('descontoGlobalValor');
  if (rowDG && elDGV) {
    rowDG.style.display = descGlobalVal > 0 ? 'flex' : 'none';
    elDGV.textContent   = formatMoeda(descGlobalVal);
  }

  /* ══════════════════════════════════════════
     DIFAL
  ══════════════════════════════════════════ */
  const internacional = isOperacaoInternacional();
  const estado       = document.getElementById('estado')?.value || '';
  const ehMG         = internacional || ehEstadoMinasGerais(estado);
  const cnpjField    = document.getElementById('cnpj')?.value   || '';
  const cnpjRaw      = cnpjField.replace(/\D/g, '');
  const pessoaFisica = !internacional && cnpjRaw.length === 11;
  const contribuinte = internacional ? 'nao' : pessoaFisica
    ? 'nao'
    : (document.getElementById('contribuinte')?.value || '');

  const ehNaoContrib = pessoaFisica || contribuinte === 'nao';
  const ehContrib    = !pessoaFisica && contribuinte === 'sim';

  const selContrib = document.getElementById('contribuinte');
  if (selContrib) {
    if (internacional) {
      selContrib.value = 'nao';
      selContrib.disabled = true;
      selContrib.title = 'Operação internacional não utiliza ICMS/DIFAL brasileiro';
    } else if (pessoaFisica) {
      if (selContrib.value !== 'nao') selContrib.value = 'nao';
      selContrib.disabled = true;
      selContrib.title    = 'Pessoa Física (CPF) é sempre Não Contribuinte de ICMS';
    } else {
      selContrib.disabled = false;
      selContrib.title    = '';
    }
  }

  let difalVal  = 0;
  let aliqDifal = 0;

  if (estado && !ehMG && (ehNaoContrib || ehContrib)) {
    const baseCalculo = totalSemDifal > 0 ? totalSemDifal : 1;
    const f = calcularFiscal({
      estado,
      contribuinte  : ehNaoContrib ? 'nao' : 'sim',
      cnpj          : cnpjRaw,
      itens         : [{ total: baseCalculo }],
      descontoGlobal: {}
    });
    aliqDifal = parseFloat(f.aliqDifalPerc) || 0;
    difalVal  = totalSemDifal > 0 ? totalSemDifal * aliqDifal / 100 : 0;
  }

  if (ehMG) {
    difalVal = 0;
    aliqDifal = 0;
  }

  /* ── Cria a linha DIFAL se ainda não existe ── */
  let rowDifal = document.getElementById('rowDifalTotais');
  if (!rowDifal) {
    rowDifal           = document.createElement('div');
    rowDifal.id        = 'rowDifalTotais';
    rowDifal.className = 'totais-row';
    rowDifal.style.cssText = 'display:none';
    rowDifal.innerHTML = `
      <span id="labelDifalTotais"
        style="display:flex;align-items:center;gap:6px;font-size:13px">
        ⚖️ Imposto DIFAL Aproximado
      </span>
      <strong id="valorDifalTotais" style="color:#c2410c">R$ 0,00</strong>`;
  }

  /* ── Reposiciona a linha DIFAL conforme o tipo de recolhimento ──
       Vendedor recolhe → DIFAL ANTES do total (compõe o total visualmente)
       Cliente recolhe  → DIFAL DEPOIS do total (informativo)              */
  const totalFinalRow = document.querySelector('.totais-row.total-final');
  if (totalFinalRow) {
    if (difalVal > 0 && ehNaoContrib) {
      // Recolhimento do vendedor: aparece antes do total
      totalFinalRow.parentNode.insertBefore(rowDifal, totalFinalRow);
    } else {
      // Recolhimento do cliente ou sem DIFAL: aparece depois do total
      totalFinalRow.parentNode.insertBefore(rowDifal, totalFinalRow.nextSibling);
    }
  }

  const elDifalRow = document.getElementById('rowDifalTotais');
  const elDifalVal = document.getElementById('valorDifalTotais');
  const elDifalLbl = document.getElementById('labelDifalTotais');

  if (difalVal > 0 && ehNaoContrib) {
    if (elDifalRow) elDifalRow.style.display = 'flex';
    if (elDifalVal) {
      elDifalVal.textContent = '+ ' + formatMoeda(difalVal);
      elDifalVal.style.color = '#c2410c';
    }
    if (elDifalLbl) elDifalLbl.innerHTML =
      `⚖️ Imposto DIFAL Aproximado
       <span style="font-size:10px;background:#fee2e2;color:#991b1b;
         padding:1px 6px;border-radius:10px;font-weight:700">
         ${pessoaFisica
           ? 'Pessoa Física — Recolhimento do Vendedor'
           : 'Recolhimento do Vendedor'}
       </span>`;

  } else if (difalVal > 0 && ehContrib) {
    if (elDifalRow) elDifalRow.style.display = 'flex';
    if (elDifalVal) {
      elDifalVal.textContent = formatMoeda(difalVal);
      elDifalVal.style.color = '#6b7280';
    }
    if (elDifalLbl) elDifalLbl.innerHTML =
      `⚖️ DIFAL (informativo, Valor Aproximado)
       <span style="font-size:10px;background:#f3f4f6;color:#6b7280;
         padding:1px 6px;border-radius:10px;font-weight:700">
         Recolhimento do cliente (Não incluso no total)
       </span>`;

  } else {
    if (elDifalRow) elDifalRow.style.display = 'none';
  }

  /* ── Totais finais ── */
  const totalComDifal = ehNaoContrib ? totalSemDifal + difalVal : totalSemDifal;

  window.difalVal      = difalVal;
  window.totalSemDifal = totalSemDifal;
  window.totalBaseSimulacao = totalSemDifal;

  const elSub = document.getElementById('subtotal');
  const elTot = document.getElementById('totalFinal');
  if (elSub) elSub.textContent = formatMoeda(subtotalBruto);
  if (elTot) elTot.textContent = formatMoeda(totalComDifal);

  if (ehMG) {
    window.difalVal = 0;
    if (elDifalRow) elDifalRow.style.display = 'none';
    if (elDifalVal) elDifalVal.textContent = 'R$ 0,00';
    if (elTot) elTot.textContent = formatMoeda(totalSemDifal);
  }

  if (typeof onTotalAtualizado === 'function') onTotalAtualizado(totalComDifal, totalSemDifal);

  setTimeout(recalcularFiscalForm, 50);
}
/* ══════════════════════════════════════════
   CATÁLOGO
   ══════════════════════════════════════════ */
function abrirCatalogo() {
  selecionados.clear();
  document.getElementById('buscaCatalogo').value  = '';
  document.getElementById('filtroCatalogo').value = '';
  document.getElementById('modalCatalogo').style.display = 'flex';
  aplicarTextosCatalogoModal();

  /* ✅ Reseta visual do botão "Selecionar Todos" */
  const btn = document.getElementById('btnSelecionarTodos');
  if (btn) {
    btn.style.background  = '#f9fafb';
    btn.style.color       = '#374151';
    btn.style.borderColor = '#e5e7eb';
    btn.innerHTML         = isOperacaoInternacional() ? '☑️ Select All' : '☑️ Selecionar Todos';
  }

  renderCatalogo(catalogoProdutos);
  atualizarCount();
}

function fecharCatalogo() {
  document.getElementById('modalCatalogo').style.display = 'none';
  selecionados.clear();
}

function filtrarCatalogo() {
  renderCatalogo(obterListaFiltrada());
  atualizarBtnSelecionarTodos();
}

function obterListaFiltrada() {
  const termo  = document.getElementById('buscaCatalogo').value.toLowerCase();
  const modelo = document.getElementById('filtroCatalogo').value;
  return catalogoProdutos.filter(p => {
    const produtoTxt = textoCatalogo(p, 'produto').toLowerCase();
    const descricaoTxt = textoCatalogo(p, 'descricao').toLowerCase();
    const matchTermo  = !termo  ||
      produtoTxt.includes(termo)  ||
      p.modelo.toLowerCase().includes(termo)   ||
      descricaoTxt.includes(termo);
    const matchModelo = !modelo || p.modelo === modelo;
    return matchTermo && matchModelo;
  });
}

/* ══════════════════════════════════════════
   SELECIONAR TODOS ✅
   ══════════════════════════════════════════ */
function toggleSelecionarTodos() {
  const listaAtual          = obterListaFiltrada();
  const todosJaSelecionados = listaAtual.every(p => selecionados.has(p.id));

  if (todosJaSelecionados) {
    listaAtual.forEach(p => selecionados.delete(p.id));
  } else {
    listaAtual.forEach(p => {
      if (!selecionados.has(p.id)) {
        const inputQtd = document.getElementById(`qtd-cat-${p.id}`);
        const qtd      = inputQtd ? parseInt(inputQtd.value) || 1 : 1;
        selecionados.set(p.id, { produto: p, qtd });
      }
    });
  }

  atualizarCount();
  atualizarBtnSelecionarTodos();
  renderCatalogo(listaAtual);
}

/* ── Sincroniza visual do botão com estado atual ── */
function atualizarBtnSelecionarTodos() {
  const btn        = document.getElementById('btnSelecionarTodos');
  const listaAtual = obterListaFiltrada();
  if (!btn || listaAtual.length === 0) return;

  const todosJaSelecionados = listaAtual.every(p => selecionados.has(p.id));

  if (todosJaSelecionados) {
    btn.style.background  = 'var(--primary)';
    btn.style.color       = '#fff';
    btn.style.borderColor = 'var(--primary)';
    btn.innerHTML         = isOperacaoInternacional() ? '✅ Unselect All' : '✅ Desmarcar Todos';
  } else {
    btn.style.background  = '#f9fafb';
    btn.style.color       = '#374151';
    btn.style.borderColor = '#e5e7eb';
    btn.innerHTML         = isOperacaoInternacional() ? '☑️ Select All' : '☑️ Selecionar Todos';
  }
}

/* ══════════════════════════════════════════
   RENDER CATÁLOGO
   ══════════════════════════════════════════ */
function renderCatalogo(lista) {
  const container = document.getElementById('listaCatalogo');
  container.innerHTML = '';

  if (lista.length === 0) {
    container.innerHTML = `
      <div style="text-align:center;padding:48px;color:#6b7280">
        <div style="font-size:42px;margin-bottom:12px">🔍</div>
        <p style="font-size:14px;font-weight:600">${isOperacaoInternacional() ? 'No products found.' : 'Nenhum produto encontrado.'}</p>
      </div>`;
    return;
  }

  lista.forEach(p => {
    const sel  = selecionados.has(p.id);
    const qtd  = sel ? selecionados.get(p.id).qtd : 1;
    const produtoTxt = textoCatalogo(p, 'produto');
    const descricaoTxt = textoCatalogo(p, 'descricao');
    const prazoSemCalibTxt = textoCatalogo(p, 'prazoSemCalib');
    const prazoComCalibTxt = textoCatalogo(p, 'prazoComCalib');
    const card = document.createElement('div');
    card.id    = `card-cat-${p.id}`;
    card.style.cssText = `
      display      : flex;
      align-items  : flex-start;
      gap          : 14px;
      padding      : 14px 16px;
      border-radius: 10px;
      cursor       : pointer;
      border       : 2px solid ${sel ? 'var(--primary)' : '#e5e7eb'};
      background   : ${sel ? 'rgba(255,107,44,.06)' : '#fff'};
      transition   : all .18s;`;

    card.innerHTML = `
      <div onclick="toggleSelecionado(${p.id},event)"
        style="margin-top:3px;flex-shrink:0">
        <div style="width:20px;height:20px;border-radius:5px;
          border:2px solid ${sel ? 'var(--primary)' : '#d1d5db'};
          background:${sel ? 'var(--primary)' : '#fff'};
          display:flex;align-items:center;justify-content:center;
          transition:all .18s">
          ${sel ? '<span style="color:#fff;font-size:13px;font-weight:700">✓</span>' : ''}
        </div>
      </div>

      <div style="flex:1;min-width:0" onclick="toggleSelecionado(${p.id},event)">
        <div style="display:flex;align-items:center;gap:8px;
          flex-wrap:wrap;margin-bottom:4px">
          ${p.imagem
            ? `<img src="${p.imagem}"
                style="width:64px;height:48px;object-fit:contain;
                        border-radius:6px;border:1px solid #f3f4f6;
                        background:#fafafa;flex-shrink:0;align-self:center"
                onerror="this.style.display='none'"/>`
            : ''
          }

          ${p.modelo
            ? `<span style="background:var(--primary);color:#fff;
                font-size:10px;font-weight:700;padding:2px 8px;
                border-radius:20px;letter-spacing:.4px">
                ${p.modelo}
               </span>`
            : ''}
          <span style="font-size:13.5px;font-weight:700;color:#111827">
            ${produtoTxt}
          </span>
          <span style="margin-left:auto;font-size:13.5px;font-weight:800;
            color:var(--primary);white-space:nowrap">
            ${formatMoeda(converterBRLParaMoeda(p.valorUnit))}
          </span>
        </div>
        <p style="font-size:11.5px;color:#6b7280;line-height:1.6;margin:0 0 6px">
          ${descricaoTxt.length > 160
            ? descricaoTxt.substring(0, 160) + '...'
            : descricaoTxt}
        </p>
        <div style="display:flex;gap:12px;font-size:11px;color:#9ca3af">
          <span>⏱ ${isOperacaoInternacional() ? 'Without calib.:' : 'Sem calib.:'} <strong>${prazoSemCalibTxt}</strong></span>
          <span>⏱ ${isOperacaoInternacional() ? 'With calib.:' : 'Com calib.:'} <strong>${prazoComCalibTxt}</strong></span>
        </div>
      </div>

      <div onclick="event.stopPropagation()"
        style="display:flex;flex-direction:column;align-items:center;
        gap:4px;flex-shrink:0;margin-top:2px">
        <label style="font-size:10px;color:#6b7280;font-weight:600;
          text-transform:uppercase">${isOperacaoInternacional() ? 'Qty' : 'Qtd'}</label>
        <div style="display:flex;align-items:center;gap:4px">
          <button onclick="alterarQtd(${p.id},-1)"
            style="width:26px;height:26px;border-radius:6px;
            border:1px solid #e5e7eb;background:#f9fafb;cursor:pointer;
            font-size:16px;font-weight:700;display:flex;
            align-items:center;justify-content:center">−</button>
          <input type="number" id="qtd-cat-${p.id}" value="${qtd}"
            min="1" step="1"
            onclick="event.stopPropagation()"
            onchange="setQtdCatalogo(${p.id},this.value)"
            style="width:46px;text-align:center;padding:4px 6px;
            border:1px solid #e5e7eb;border-radius:6px;font-size:13px;
            font-family:'Inter',sans-serif;outline:none"/>
          <button onclick="alterarQtd(${p.id},+1)"
            style="width:26px;height:26px;border-radius:6px;
            border:1px solid #e5e7eb;background:#f9fafb;cursor:pointer;
            font-size:16px;font-weight:700;display:flex;
            align-items:center;justify-content:center">+</button>
        </div>
      </div>`;

    container.appendChild(card);
  });
}

/* ══════════════════════════════════════════
   TOGGLE / ALTERAR / SET QTD
   ══════════════════════════════════════════ */
function toggleSelecionado(id, event) {
  if (event) event.stopPropagation();
  const produto = catalogoProdutos.find(p => p.id === id);
  if (!produto) return;

  if (selecionados.has(id)) {
    selecionados.delete(id);
  } else {
    const inputQtd = document.getElementById(`qtd-cat-${id}`);
    const qtd      = inputQtd ? parseInt(inputQtd.value) || 1 : 1;
    selecionados.set(id, { produto, qtd });
  }

  atualizarCount();
  atualizarBtnSelecionarTodos();
  renderCatalogo(obterListaFiltrada());
}

function alterarQtd(id, delta) {
  const input = document.getElementById(`qtd-cat-${id}`);
  if (!input) return;
  const novaQtd = Math.max(1, (parseInt(input.value) || 1) + delta);
  input.value   = novaQtd;
  setQtdCatalogo(id, novaQtd);
}

function setQtdCatalogo(id, val) {
  const novaQtd = Math.max(1, parseInt(val) || 1);
  if (selecionados.has(id)) {
    const entry = selecionados.get(id);
    entry.qtd   = novaQtd;
    selecionados.set(id, entry);
  }
}

async function adicionarSelecionados() {
  if (selecionados.size === 0) {
    showToast('Selecione ao menos um produto!', 'warn');
    return;
  }
  if (isOperacaoInternacional() && getMoedaAtual() === 'USD' && !(parseFloat(String(document.getElementById('cotacaoDolar')?.value || '').replace(',', '.')) > 0)) {
    showToast('Informe a cotação do dólar antes de adicionar itens do catálogo.', 'warn');
    document.getElementById('cotacaoDolar')?.focus();
    return;
  }

  for (const { produto, qtd } of selecionados.values()) {
    const valorUnitConvertido = converterBRLParaMoeda(produto.valorUnit);
    const produtoTxt = textoCatalogo(produto, 'produto');
    const descricaoTxt = textoCatalogo(produto, 'descricao');
    // Comprime a imagem antes de salvar no item
    const imagemComprimida = produto.imagem
      ? await comprimirImagem(produto.imagem)
      : null;

    addItem({
      descricao : produto.modelo
        ? `[${produto.modelo}] ${produtoTxt} — ${descricaoTxt}`
        : `${produtoTxt} — ${descricaoTxt}`,
      qtd,
      und      : textoCatalogo(produto, 'und'),
      prazoSC  : textoCatalogo(produto, 'prazoSemCalib') || '',
      prazoCC  : textoCatalogo(produto, 'prazoComCalib') || '',
      valorUnit: valorUnitConvertido,
      valorUnitBRL: produto.valorUnit,
      total    : qtd * valorUnitConvertido,
      imagem   : imagemComprimida,
      catalogoId: produto.id
    });
  }

  showToast(`✅ ${selecionados.size} item(s) adicionado(s)!`, 'success');
  fecharCatalogo();
}

function atualizarCount() {
  const el = document.getElementById('countSelecionados');
  if (el) el.textContent = isOperacaoInternacional()
    ? `${selecionados.size} product(s) selected`
    : `${selecionados.size} produto(s) selecionado(s)`;
}

/* ══════════════════════════════════════════
   TOGGLE CARD SEÇÃO
   ══════════════════════════════════════════ */
function toggleCardSec(labelId, checked) {
  const lb = document.getElementById(labelId);
  if (!lb) return;
  if (checked) lb.classList.add('checked');
  else         lb.classList.remove('checked');
}

/* ══════════════════════════════════════════
   MÓDULO FISCAL — RECALCULA PAINEL
   ══════════════════════════════════════════ */
function recalcularFiscalForm() {
  if (isOperacaoInternacional()) {
    const semEstado = document.getElementById('fiscalSemEstado');
    const resultado = document.getElementById('resultadoFiscalBox');
    if (semEstado) {
      semEstado.style.display = 'block';
      semEstado.innerHTML = `
        <i class="fa-solid fa-globe" style="font-size:28px;opacity:.3;display:block;margin-bottom:8px"></i>
        Operação internacional: ICMS/DIFAL brasileiro desabilitado.
      `;
    }
    if (resultado) resultado.style.display = 'none';
    return;
  }

  const estado    = document.getElementById('estado')?.value || '';
  const ehMG      = ehEstadoMinasGerais(estado);
  const cnpjRaw   = (document.getElementById('cnpj')?.value  || '').replace(/\D/g, '');

  const pessoaFisica = cnpjRaw.length === 11;
  const contribuinte = pessoaFisica
    ? 'nao'
    : (document.getElementById('contribuinte')?.value || '');

  const selContrib = document.getElementById('contribuinte');
  if (selContrib) {
    if (pessoaFisica) {
      if (selContrib.value !== 'nao') selContrib.value = 'nao';
      selContrib.disabled = true;
      selContrib.title    = 'Pessoa Física (CPF) é sempre Não Contribuinte de ICMS';
    } else {
      selContrib.disabled = false;
      selContrib.title    = '';
    }
  }

  if (!estado) {
    const semEstado = document.getElementById('fiscalSemEstado');
    const resultado = document.getElementById('resultadoFiscalBox');
    if (semEstado) semEstado.style.display = 'block';
    if (resultado) resultado.style.display = 'none';
    return;
  }

  if (ehMG) {
    _renderFiscalForm({
      difalVal      : 0,
      aliqDifalPerc : '—',
      aliqInterPerc : '—',
      difalInfo     : 'Operação interna — sem DIFAL.',
      resumoFiscal  : null
    }, 0, estado);
    return;
  }

  /* ── Base de cálculo ── */
  let baseParaDifal = parseMoeda(
    document.getElementById('subtotal')?.textContent || '0'
  );

  const tipoEl  = document.getElementById('tipoDesconto');
  const valorEl = document.getElementById('valorDesconto');
  const tipo    = tipoEl?.value  || 'perc';
  const valor   = parseFloat(valorEl?.value) || 0;

  let descGlobalVal = 0;
  if (tipo === 'perc') descGlobalVal = baseParaDifal * valor / 100;
  else                 descGlobalVal = Math.min(valor, baseParaDifal);
  baseParaDifal = Math.max(0, baseParaDifal - descGlobalVal);

  const baseCalculo = baseParaDifal > 0 ? baseParaDifal : 1;

  const orcTemp = {
    estado,
    contribuinte,
    cnpj          : cnpjRaw,
    fiscal        : {
      ipiPerc    : parseFloat(document.getElementById('fiscal_ipi')?.value    ?? 0),
      pisPerc    : parseFloat(document.getElementById('fiscal_pis')?.value    ?? 0.65),
      cofinsPerc : parseFloat(document.getElementById('fiscal_cofins')?.value ?? 3.00)
    },
    itens          : [{ total: baseCalculo }],
    descontoGlobal : {}
  };

  let f = calcularFiscal(orcTemp);

  /* ── Força exibição do DIFAL para contribuinte "sim" ── */
  if (contribuinte === 'sim' && f.difalVal === 0 && !ehMG) {
    const fForcado = calcularFiscal({ ...orcTemp, contribuinte: 'nao' });
    if (fForcado.difalVal > 0) {
      f = {
        ...f,
        difalVal      : fForcado.difalVal,
        aliqDifalPerc : fForcado.aliqDifalPerc,
        difalInfo     : fForcado.difalInfo
      };
    }
  }

  /* ✅ Zera valor se base era mínima (sem itens) */
  if (baseParaDifal === 0 && f.aliqDifalPerc && f.aliqDifalPerc !== '—') {
    f = { ...f, difalVal: 0 };
  }

  _renderFiscalForm(f, baseParaDifal, estado);
}

/* ══════════════════════════════════════════
   MÓDULO FISCAL — RENDERIZA PAINEL
   ══════════════════════════════════════════ */
function _renderFiscalForm(f, total, estado) {
  const semEstado = document.getElementById('fiscalSemEstado');
  const resultado = document.getElementById('resultadoFiscalBox');

  if (!estado) {
    if (semEstado) semEstado.style.display = 'block';
    if (resultado) resultado.style.display = 'none';
    return;
  }

  if (semEstado) semEstado.style.display = 'none';
  if (resultado) resultado.style.display = 'block';

  /* ── Info da operação ── */
  const infoEl = document.getElementById('fiscal_info_operacao');
  if (infoEl && f.resumoFiscal) {
    infoEl.innerHTML =
      `<strong>Operação:</strong> MG → ${estado} |
       Alíq. interestadual: <strong>${f.resumoFiscal.aliqInter}</strong> |
       Alíq. interna ${estado}: <strong>${f.resumoFiscal.aliqInterna}</strong>`;
    infoEl.style.display = 'block';
  } else if (infoEl) {
    infoEl.style.display = 'none';
  }

  /* ── Preenche alíquotas ── */
  const fInter = document.getElementById('fiscal_icms_inter');
  const fDifal = document.getElementById('fiscal_difal_perc');
  if (fInter) fInter.value = f.aliqInterPerc !== '—' ? f.aliqInterPerc : '';
  if (fDifal) fDifal.value = f.aliqDifalPerc !== '—' ? f.aliqDifalPerc : '';

  /* ── Card DIFAL ── */
  const fcDifal = document.getElementById('fcard_difal');

  if (f.difalVal > 0) {
    if (fcDifal) fcDifal.style.display = 'flex';
    _setFcard('fcard_difal_perc', `${f.aliqDifalPerc}%`);
    _setFcard('fcard_difal_val',  formatMoeda(f.difalVal));
    _setFcard('fcard_difal_info', f.difalInfo || 'DIFAL conforme legislação vigente');

    const notaDifal = document.getElementById('fiscal_nota_difal');
    const notaTxt   = document.getElementById('fiscal_nota_difal_txt');
    if (notaDifal) notaDifal.style.display = 'block';
    if (notaTxt)   notaTxt.textContent     = f.difalInfo || '';

  } else {
    if (fcDifal) fcDifal.style.display = 'none';
    const notaDifal = document.getElementById('fiscal_nota_difal');
    if (notaDifal) notaDifal.style.display = 'none';
  }
}

/* ── Helper para preencher cards fiscais ── */
function _setFcard(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

/* ══════════════════════════════════════════
   MÓDULO FISCAL — OBTER PARÂMETROS
   ══════════════════════════════════════════ */
function getFiscalParams() {
  return {
    ipiPerc    : parseFloat(document.getElementById('fiscal_ipi')?.value    ?? 0),
    pisPerc    : parseFloat(document.getElementById('fiscal_pis')?.value    ?? 0.65),
    cofinsPerc : parseFloat(document.getElementById('fiscal_cofins')?.value ?? 3.00)
  };
}

/* ══════════════════════════════════════════
   MÓDULO FISCAL — PREENCHER (edição)
   ══════════════════════════════════════════ */
function preencherFiscalForm(fiscal) {
  if (!fiscal) return;
  const set = (id, val) => {
    const el = document.getElementById(id);
    if (el && val !== undefined) el.value = val;
  };
  set('fiscal_ipi',    fiscal.ipiPerc    ?? 0);
  set('fiscal_pis',    fiscal.pisPerc    ?? 0.65);
  set('fiscal_cofins', fiscal.cofinsPerc ?? 3.00);
  setTimeout(recalcularFiscalForm, 100);
}

/* ══════════════════════════════════════════
   COMPRESSOR DE IMAGEM
   ══════════════════════════════════════════ */
function comprimirImagem(src, maxW = 200, maxH = 150, qualidade = 0.7) {
  return new Promise(resolve => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let w = img.width;
      let h = img.height;

      if (w > maxW || h > maxH) {
        const ratio = Math.min(maxW / w, maxH / h);
        w = Math.round(w * ratio);
        h = Math.round(h * ratio);
      }

      canvas.width  = w;
      canvas.height = h;

      const ctx = canvas.getContext('2d');

      /* ── Fundo branco antes de desenhar — evita preto no JPEG ── */
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, w, h);

      ctx.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL('image/jpeg', qualidade));
    };
    img.onerror = () => resolve(src);
    img.src = src;
  });
}