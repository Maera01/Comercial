/* ============================================
   MAERA – MOTOR FISCAL | FISCAL.JS
   Módulo completo: ICMS, DIFAL, IPI, PIS, COFINS
   ============================================ */

const DADOS_FISCAIS = {
  ORIGEM: 'MG',

  /* Alíquotas internas dos estados */
  ALIQUOTAS_INTERNAS: {
    'AC': 19.00, 'AL': 20.50, 'AP': 18.00, 'AM': 20.00, 'BA': 20.50,
    'CE': 20.00, 'DF': 20.00, 'ES': 17.00, 'GO': 19.00, 'MA': 23.00,
    'MT': 17.00, 'MS': 17.00, 'MG': 18.00, 'PA': 19.00, 'PB': 20.00,
    'PR': 19.50, 'PE': 20.50, 'PI': 22.50, 'RJ': 22.00, 'RN': 20.00,
    'RS': 17.00, 'RO': 19.50, 'RR': 20.00, 'SC': 17.00, 'SP': 18.00,
    'SE': 19.00, 'TO': 20.00
  },

  /* Estados com alíquota interestadual 12% (Sul e Sudeste exceto ES) */
  ESTADOS_ALIQUOTA_12: ['PR', 'RJ', 'RS', 'SC', 'SP'],

  /* Alíquotas federais (Simples Nacional — cálculo informativo) */
  PIS_PERC:    0.65,  /* % */
  COFINS_PERC: 3.00,  /* % */
  IPI_PADRAO:  0.00,  /* % — editável pelo usuário */

  FRETE_PADRAO: 'CIF'
};

/* ── Helpers de alíquota ─────────────────── */
function getAliquotaInterna(estado) {
  if (!estado) return DADOS_FISCAIS.ALIQUOTAS_INTERNAS['MG'] / 100;
  return (DADOS_FISCAIS.ALIQUOTAS_INTERNAS[estado.toUpperCase()] || 18.00) / 100;
}

function getAliquotaInterestadual(destino) {
  if (!destino) return 0.07;
  return DADOS_FISCAIS.ESTADOS_ALIQUOTA_12.includes(destino.toUpperCase())
    ? 0.12 : 0.07;
}

function normalizarUF(valor) {
  const uf = String(valor || '')
    .trim()
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  const nomesUF = {
    ACRE: 'AC',
    ALAGOAS: 'AL',
    AMAPA: 'AP',
    AMAZONAS: 'AM',
    BAHIA: 'BA',
    CEARA: 'CE',
    'DISTRITO FEDERAL': 'DF',
    'ESPIRITO SANTO': 'ES',
    GOIAS: 'GO',
    MARANHAO: 'MA',
    'MATO GROSSO': 'MT',
    'MATO GROSSO DO SUL': 'MS',
    'MINAS GERAIS': 'MG',
    'MINAS GERAIS': 'MG',
    PARA: 'PA',
    PARAIBA: 'PB',
    PARANA: 'PR',
    PERNAMBUCO: 'PE',
    PIAUI: 'PI',
    'RIO DE JANEIRO': 'RJ',
    'RIO GRANDE DO NORTE': 'RN',
    'RIO GRANDE DO SUL': 'RS',
    RONDONIA: 'RO',
    RORAIMA: 'RR',
    'SANTA CATARINA': 'SC',
    'SAO PAULO': 'SP',
    SERGIPE: 'SE',
    TOCANTINS: 'TO',
    TOCANTIS: 'TO'
  };

  if (DADOS_FISCAIS.ALIQUOTAS_INTERNAS[uf]) return uf;
  if (nomesUF[uf]) return nomesUF[uf];
  return uf;
}

function isEstadoMinasGerais(valor) {
  return normalizarUF(valor) === 'MG';
}

/* ══════════════════════════════════════════
   CÁLCULO FISCAL COMPLETO
   ══════════════════════════════════════════ */
function calcularFiscal(orcamento) {
  const origem       = DADOS_FISCAIS.ORIGEM;
  const destino      = normalizarUF(orcamento.estado);
  const destinoEhMG  = destino === 'MG';
  const contribuinte = orcamento.contribuinte  || '';
  const tipoFrete    = orcamento.tipoFrete     || DADOS_FISCAIS.FRETE_PADRAO;

  /* ── Base: subtotal dos itens ── */
  let subtotal = 0;
  (orcamento.itens || []).forEach(item => {
    subtotal += (parseFloat(item.total) || 0);
  });

  /* ── Desconto global ── */
  const dg = orcamento.descontoGlobal || {};
  let percDesconto = 0, valorDesconto = 0;
  if (dg.tipo === 'fixo') {
    valorDesconto = parseFloat(dg.valor) || 0;
    percDesconto  = subtotal > 0 ? parseFloat(((valorDesconto / subtotal) * 100).toFixed(10)) : 0;
  } else {
    percDesconto  = parseFloat(dg.valor || orcamento.desconto) || 0;
    valorDesconto = subtotal * percDesconto / 100;
  }
  const total = Math.max(0, subtotal - valorDesconto);

  /* ── Parâmetros fiscais (editáveis pelo usuário no form) ── */
  const fp         = orcamento.fiscal || {};
  const ipiPerc    = parseFloat(fp.ipiPerc    ?? DADOS_FISCAIS.IPI_PADRAO);
  const pisPerc    = parseFloat(fp.pisPerc    ?? DADOS_FISCAIS.PIS_PERC);
  const cofinsPerc = parseFloat(fp.cofinsPerc ?? DADOS_FISCAIS.COFINS_PERC);

  if (orcamento.operacaoInternacional || fp.internacional) {
    return {
      subtotal,
      desconto: valorDesconto,
      percDesconto,
      total,
      tipoFrete,
      contribuinte: 'nao',
      ipiPerc: 0,
      pisPerc: 0,
      cofinsPerc: 0,
      aliqOrigemPerc: '—',
      aliqInterPerc: '—',
      aliqInternaPerc: '—',
      aliqDifalPerc: '—',
      ipiVal: 0,
      pisVal: 0,
      cofinsVal: 0,
      icmsOrigemVal: 0,
      difalVal: 0,
      icmsTotalVal: 0,
      totalImpostosVal: 0,
      difalLabel: 'N/A',
      difalInfo: 'Operação internacional/exportação — impostos brasileiros não aplicados.',
      resumoFiscal: null,
      operacaoTipo: 'Internacional',
      isInterno: true,
      isContribuinte: false,
      operacaoInternacional: true,
      pais: orcamento.pais || '',
      moeda: orcamento.moeda || 'USD',
      cotacaoDolar: orcamento.cotacaoDolar || null,
      incoterm: orcamento.incoterm || ''
    };
  }

  /* ── Cálculos ── */
  const ipiVal    = total * ipiPerc    / 100;
  const pisVal    = total * pisPerc    / 100;
  const cofinsVal = total * cofinsPerc / 100;

  /* ── ICMS Origem (MG) ── */
  const aliqOrigemMG  = getAliquotaInterna(origem);
  const icmsOrigemVal = total * aliqOrigemMG;

  /* ── DIFAL ── */
  let difalVal        = 0;
  let aliqInter       = 0;
  let aliqInterna     = 0;
  let percentualDifal = 0;
  let difalLabel      = 'N/A';
  let difalInfo       = 'Operação interna ou estado não informado.';
  let resumoFiscal    = null;
  let operacaoTipo    = destino && destino !== origem ? 'Interestadual' : 'Interna';

  const isContribuinte = (contribuinte || '').toLowerCase().includes('sim');
  const isInterno      = !destino || destino === origem || destinoEhMG;

  if (!isInterno && !isContribuinte) {
    /* ══════════════════════════════════════
       NÃO CONTRIBUINTE
       DIFAL recolhido pelo Vendedor (MAERA)
       Soma no total final
    ══════════════════════════════════════ */
    aliqInterna     = getAliquotaInterna(destino);
    aliqInter       = getAliquotaInterestadual(destino);
    percentualDifal = aliqInterna - aliqInter;

    if (percentualDifal > 0) {
      difalVal   = total * percentualDifal;
      difalLabel = formatMoeda(difalVal);
      difalInfo  =
        `DIFAL = Alíq. interna ${destino} ` +
        `(${(aliqInterna * 100).toFixed(1)}%) − ` +
        `Alíq. interestadual (${(aliqInter * 100).toFixed(1)}%) = ` +
        `${(percentualDifal * 100).toFixed(1)}%`;

      resumoFiscal = {
        origem,
        destino,
        operacao:    operacaoTipo,
        aliqInter:   `${(aliqInter     * 100).toFixed(1)}%`,
        aliqInterna: `${(aliqInterna   * 100).toFixed(1)}%`,
        aliqDifal:   `${(percentualDifal * 100).toFixed(1)}%`
      };
    }

  } else if (!isInterno && isContribuinte) {
    /* ══════════════════════════════════════
       CONTRIBUINTE
       DIFAL recolhido pelo próprio Cliente
       Calculado apenas para EXIBIÇÃO informativa
       NÃO é somado ao total do orçamento
    ══════════════════════════════════════ */
    aliqInterna     = getAliquotaInterna(destino);
    aliqInter       = getAliquotaInterestadual(destino);
    percentualDifal = aliqInterna - aliqInter;

    if (percentualDifal > 0) {
      difalVal   = total * percentualDifal;   // valor informativo — NÃO entra no total
      difalLabel = formatMoeda(difalVal);
      difalInfo  =
        `DIFAL = Alíq. interna ${destino} ` +
        `(${(aliqInterna * 100).toFixed(1)}%) − ` +
        `Alíq. interestadual (${(aliqInter * 100).toFixed(1)}%) = ` +
        `${(percentualDifal * 100).toFixed(1)}%`;

      resumoFiscal = {
        origem,
        destino,
        operacao:    operacaoTipo,
        aliqInter:   `${(aliqInter     * 100).toFixed(1)}%`,
        aliqInterna: `${(aliqInterna   * 100).toFixed(1)}%`,
        aliqDifal:   `${(percentualDifal * 100).toFixed(1)}%`
      };
    }

  } else if (isInterno) {
    difalLabel = 'N/A';
    difalInfo  = 'Operação interna — sem DIFAL.';
  }

  /* ── ICMS Total (Origem + DIFAL para não contribuinte) ── */
  const icmsTotalVal = icmsOrigemVal + (isContribuinte ? 0 : difalVal);

  /* ── Total impostos arrecadados ── */
  const totalImpostosVal = ipiVal + pisVal + cofinsVal + icmsTotalVal;

  return {
    /* Base */
    subtotal,
    desconto: valorDesconto,
    percDesconto,
    total,          // ← NUNCA inclui DIFAL, independente do tipo de contribuinte
    tipoFrete,
    contribuinte,   // ← repassa para os renders

    /* Alíquotas usadas */
    ipiPerc, pisPerc, cofinsPerc,
    aliqOrigemPerc:  (aliqOrigemMG * 100).toFixed(2),
    aliqInterPerc:   aliqInter     > 0 ? (aliqInter     * 100).toFixed(2) : '—',
    aliqInternaPerc: aliqInterna   > 0 ? (aliqInterna   * 100).toFixed(2) : '—',
    aliqDifalPerc:   percentualDifal > 0 ? (percentualDifal * 100).toFixed(2) : '—',

    /* Valores calculados */
    ipiVal,
    pisVal,
    cofinsVal,
    icmsOrigemVal,
    difalVal,       // ← preenchido para ambos os tipos; para contribuinte é só informativo
    icmsTotalVal,
    totalImpostosVal,

    /* Labels / info para o template */
    difalLabel,
    difalInfo,
    resumoFiscal,
    operacaoTipo,
    isInterno,
    isContribuinte
  };
}


/* ══════════════════════════════════════════
   TABELAS DE CONDIÇÕES DE PAGAMENTO
   ══════════════════════════════════════════ */

const TabelaPix = { descontoPerc: 15 };

const TabelaCartao = [
  { parcelas: 12, descontoPerc:  0, beneficio: '' },
  { parcelas: 11, descontoPerc:  1, beneficio: '' },
  { parcelas: 10, descontoPerc:  2, beneficio: '' },
  { parcelas:  9, descontoPerc:  3, beneficio: 'Treinamento ou desconto' },
  { parcelas:  8, descontoPerc:  4, beneficio: 'Treinamento ou desconto' },
  { parcelas:  7, descontoPerc:  5, beneficio: 'Treinamento ou desconto' },
  { parcelas:  6, descontoPerc:  6, beneficio: 'Treinamento + desconto \nou Mochila + desconto' },
  { parcelas:  5, descontoPerc:  7, beneficio: 'Treinamento + desconto \nou Mochila + desconto' },
  { parcelas:  4, descontoPerc:  8, beneficio: 'Treinamento + desconto \nou Mochila + desconto' },
  { parcelas:  3, descontoPerc:  9, beneficio: 'Treinamento + desconto \nou Mochila + desconto' },
  { parcelas:  2, descontoPerc: 10, beneficio: 'Treinamento + desconto \nou Mochila + desconto' },
  { parcelas:  1, descontoPerc: 11, beneficio: 'Treinamento + desconto \nou Mochila + desconto' }
];

const TabelaBoleto = [
  { parcelas:  6, descontoPerc: 12, sinalPerc: 90 },
  { parcelas:  6, descontoPerc: 10, sinalPerc: 80 },
  { parcelas:  6, descontoPerc:  8, sinalPerc: 70 },
  { parcelas:  8, descontoPerc:  6, sinalPerc: 60 },
  { parcelas:  8, descontoPerc:  4, sinalPerc: 50 },
  { parcelas: 10, descontoPerc:  2, sinalPerc: 40 },
  { parcelas: 10, descontoPerc:  0, sinalPerc: 30 }
];


/* ══════════════════════════════════════════
   SIMULADOR DE PAGAMENTO
   ══════════════════════════════════════════ */
function simularPagamento(baseEquipamento, difal, contribuinte) {
  if (!baseEquipamento || baseEquipamento <= 0) return null;

  const isNaoContrib = contribuinte === 'nao';

  /* ── PIX ── */
  const descontoPix   = baseEquipamento * (TabelaPix.descontoPerc / 100);
  const totalPixEquip = baseEquipamento - descontoPix;
  const totalPixFinal = isNaoContrib ? totalPixEquip + difal : totalPixEquip;

  /* ── CARTÃO ── */
  const simulacoesCartao = TabelaCartao.map(linha => {
    const descValEquip = baseEquipamento * (linha.descontoPerc / 100);
    const totalEquip   = baseEquipamento - descValEquip;
    const totalFinal   = isNaoContrib ? totalEquip + difal : totalEquip;

    return {
      ...linha,
      totalComDesc:  totalFinal,
      valorParcela:  totalFinal / linha.parcelas,
      difalSeparado: difal,
      baseEquip:     totalEquip
    };
  });

  /* ── BOLETO ── */
  const simulacoesBoleto = TabelaBoleto.map(linha => {
    const descValEquip = baseEquipamento * (linha.descontoPerc / 100);
    const totalEquip   = baseEquipamento - descValEquip;
    const totalFinal   = isNaoContrib ? totalEquip + difal : totalEquip;
    const sinalVal     = totalEquip * (linha.sinalPerc / 100);

    return {
      ...linha,
      totalComDesc:  totalFinal,
      sinalVal,
      valorParcela:  linha.parcelas > 0 ? (totalEquip - sinalVal) / linha.parcelas : 0,
      difalSeparado: difal,
      baseEquip:     totalEquip
    };
  });

  return {
    pix: {
      baseEquipamento,
      descontoPerc:     TabelaPix.descontoPerc,
      descontoVal:      descontoPix,
      totalEquipamento: totalPixEquip,
      difal,
      totalFinal:       totalPixFinal
    },
    simulacoesCartao,
    simulacoesBoleto
  };
}
