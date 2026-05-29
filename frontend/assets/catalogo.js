/* ============================================
   MAERA – CATÁLOGO DE PRODUTOS | CATALOGO.JS
   ============================================ */

/* ── Helper: retorna o caminho da imagem ou null ── */
function imgProduto(modelo) {
  return modelo ? `assets/img/${modelo}.png` : null;
}

const catalogoProdutos = [

  // ══════════════════════════════════════
  // PÁGINA 1
  // ══════════════════════════════════════

  {
    id: 1, modelo: 'ASE100',
    produto: 'Analisador de Segurança Elétrica',
    imagem: imgProduto('ASE100'),           // ✅ EQUIPAMENTO
    descricao: 'Acessórios inclusos: Cabo de força 20A, ponta de prova, garra jacaré, cabo USB tipo A / USB tipo A e manual do usuário. Adicionais inclusos: Software SunWeb e certificado de calibração RBC emitido pelo laboratório Metis Metrologia.',
    prazoSemCalib: '45 dias', prazoComCalib: '45 dias',
    valorUnit: 28090.00, und: 'Unid.'
  },
  {
    id: 2, modelo: 'ASE100',
    produto: 'Mochila',
    imagem: null,                           // ❌ ACESSÓRIO
    descricao: 'Mochila confeccionada em poliéster, com zíper e alça regulável. Acompanha espuma de proteção do equipamento.',
    prazoSemCalib: 'N/A', prazoComCalib: 'N/A',
    valorUnit: 488.00, und: 'Unid.'
  },
  {
    id: 3, modelo: 'SMP100',
    produto: 'Simulador Multi-paramétrico',
    imagem: imgProduto('SMP100'),           // ✅ EQUIPAMENTO
    descricao: 'Acessórios inclusos: Fonte de alimentação e carregador de bateria, cabo universal de temperatura, cabo universal de pressão invasiva, cabo USB, mangueira de silicone 120cm, conector T nylon e manual do usuário. Adicionais inclusos: Software SunWeb e certificado de calibração rastreável RBC emitido pelo laboratório Metis Metrologia.',
    prazoSemCalib: '40 dias', prazoComCalib: '45 dias',
    valorUnit: 26775.00, und: 'Unid.'
  },
  {
    id: 4, modelo: 'SMP100',
    produto: 'Volume Externo',
    imagem: null,                           // ❌ BRINDE
    descricao: 'Volume Externo Brinde nas compras do Simulador Multiparamétrico SMP100.',
    prazoSemCalib: 'N/A', prazoComCalib: 'N/A',
    valorUnit: 0.00, und: 'Unid.'
  },
  {
    id: 5, modelo: 'SMP100',
    produto: 'Mochila',
    imagem: null,                           // ❌ ACESSÓRIO
    descricao: 'Mochila confeccionada em poliéster, com zíper e alça regulável. Acompanha espuma de proteção do equipamento.',
    prazoSemCalib: 'N/A', prazoComCalib: 'N/A',
    valorUnit: 488.00, und: 'Unid.'
  },
  {
    id: 6, modelo: 'MOX100',
    produto: 'Testador de Oxímetro de Pulso',
    imagem: imgProduto('MOX100'),           // ✅ EQUIPAMENTO
    descricao: 'Acessórios inclusos: Cabo de comunicação e manual do usuário. Adicionais inclusos: Certificado de calibração rastreável RBC emitido pelo laboratório Metis Metrologia.',
    prazoSemCalib: '25 dias', prazoComCalib: '25 dias',
    valorUnit: 8560.00, und: 'Unid.'
  },
  {
    id: 7, modelo: 'MOX100',
    produto: 'Estojo',
    imagem: null,                           // ❌ ACESSÓRIO
    descricao: 'Estojo confeccionado em poliéster, com zíper e alça regulável. Acompanha espuma de proteção do equipamento.',
    prazoSemCalib: 'N/A', prazoComCalib: 'N/A',
    valorUnit: 225.00, und: 'Unid.'
  },
  {
    id: 8, modelo: 'SOP100',
    produto: 'Testador de Oxímetro de Pulso',
    imagem: imgProduto('SOP100'),           // ✅ EQUIPAMENTO
    descricao: 'Acessórios inclusos: Carregador de bateria, cabo USB tipo A / USB tipo B, cabo de comunicação e manual do usuário. Adicionais inclusos: Software SunWeb e certificado de calibração rastreável RBC emitido pelo laboratório Metis Metrologia.',
    prazoSemCalib: '70 dias', prazoComCalib: '70 dias',
    valorUnit: 10185.00, und: 'Unid.'
  },
  {
    id: 9, modelo: 'SOP100',
    produto: 'Estojo',
    imagem: null,                           // ❌ ACESSÓRIO
    descricao: 'Estojo confeccionado em poliéster com zíper e acabamento interno aveludado (pluma). Acompanha aba interna regulável.',
    prazoSemCalib: 'N/A', prazoComCalib: 'N/A',
    valorUnit: 225.00, und: 'Unid.'
  },
  {
    id: 10, modelo: 'MDC100',
    produto: 'Módulo de Débito Cardíaco',
    imagem: imgProduto('MDC100'),           // ✅ EQUIPAMENTO
    descricao: 'Acessórios inclusos: Manual do usuário, Cabo Temp. Injetado Externo, Cabo Comunicação Módulo SPK100 e SMP100 / SMP200. Adicionais inclusos: Certificado de calibração rastreável RBC emitido pelo laboratório LRM. Opcional: SMP100/SMP200/SPK100.',
    prazoSemCalib: '60 dias', prazoComCalib: '60 dias',
    valorUnit: 8295.00, und: 'Unid.'
  },

  // ══════════════════════════════════════
  // PÁGINA 2
  // ══════════════════════════════════════

  {
    id: 11, modelo: 'MDC100',
    produto: 'Estojo',
    imagem: null,                           // ❌ ACESSÓRIO
    descricao: 'Estojo confeccionado em poliéster, com zíper e acabamento interno aveludado (pluma).',
    prazoSemCalib: 'N/A', prazoComCalib: 'N/A',
    valorUnit: 168.00, und: 'Unid.'
  },
  {
    id: 12, modelo: 'PNI100',
    produto: 'Simulador de Pressão Não Invasiva',
    imagem: imgProduto('PNI100'),           // ✅ EQUIPAMENTO
    descricao: 'Acessórios inclusos: Fonte de alimentação, cabo USB, mangueira de silicone 120cm, 3 braçadeiras, conector T nylon e manual do usuário. Adicionais inclusos: Software SunWeb e certificado de calibração rastreável RBC emitido pelo laboratório Metis Metrologia.',
    prazoSemCalib: '45 dias', prazoComCalib: '45 dias',
    valorUnit: 19950.00, und: 'Unid.'
  },
  {
    id: 13, modelo: 'PNI100',
    produto: 'Mochila',
    imagem: null,                           // ❌ ACESSÓRIO
    descricao: 'Mochila confeccionada em poliéster, com zíper e alça regulável. Acompanha espuma de proteção do equipamento.',
    prazoSemCalib: 'N/A', prazoComCalib: 'N/A',
    valorUnit: 488.00, und: 'Unid.'
  },
  {
    id: 14, modelo: 'AVM100',
    produto: 'Analisador de Ventilação Mecânica',
    imagem: imgProduto('AVM100'),           // ✅ EQUIPAMENTO
    descricao: 'Acessórios inclusos: Cabo de força 10A, cabo USB tipo A / USB tipo B e manual do usuário. Adicionais inclusos: Software SunWeb e certificado de calibração rastreável RBC emitido pelo laboratório LRM.',
    prazoSemCalib: '60 dias', prazoComCalib: '60 dias',
    valorUnit: 32500.00, und: 'Unid.'
  },
  {
    id: 15, modelo: 'AVM100',
    produto: 'Mochila',
    imagem: null,                           // ❌ ACESSÓRIO
    descricao: 'Mochila confeccionada em poliéster, com zíper e alça regulável. Acompanha espuma de proteção do equipamento.',
    prazoSemCalib: 'N/A', prazoComCalib: 'N/A',
    valorUnit: 462.00, und: 'Unid.'
  },
  {
    id: 16, modelo: 'AVM100',
    produto: 'Pulmão de Teste para Ventilação Mecânica',
    imagem: null,                           // ❌ ACESSÓRIO/OPCIONAL
    descricao: 'Utilizado para simulação pulmonar em testes e verificações de ventiladores mecânicos e analisadores de ventilação. Volume: 1L | Complacência: Dinâmica de 20ml/cmH20 | Pressão máxima: 80 cmH20.',
    prazoSemCalib: 'N/A', prazoComCalib: 'N/A',
    valorUnit: 800.00, und: 'Unid.'
  },
  {
    id: 17, modelo: 'JAU200',
    produto: 'Analisador de Desfibrilador, Marca-Passo e Simulador de ECG',
    imagem: imgProduto('JAU200'),           // ✅ EQUIPAMENTO
    descricao: 'Acessórios inclusos: Fonte de alimentação e carregador de bateria, cabo USB tipo A / USB tipo B e manual do usuário. Adicionais inclusos: Software SunWeb e certificado de calibração rastreável RBC emitido pelo laboratório Metis Metrologia.',
    prazoSemCalib: '40 dias', prazoComCalib: '40 dias',
    valorUnit: 25150.00, und: 'Unid.'
  },
  {
    id: 18, modelo: 'JAU200',
    produto: 'Mochila',
    imagem: null,                           // ❌ ACESSÓRIO
    descricao: 'Mochila confeccionada em poliéster, com zíper e alça regulável. Acompanha espuma de proteção do equipamento.',
    prazoSemCalib: 'N/A', prazoComCalib: 'N/A',
    valorUnit: 462.00, und: 'Unid.'
  },
  {
    id: 19, modelo: 'MCV110',
    produto: 'Módulo de Cargas Variáveis',
    imagem: imgProduto('MCV110'),           // ✅ EQUIPAMENTO
    descricao: 'Acessórios inclusos: 4 cabos de interconexão de bornes e manual do usuário. Opcional: JAU200. Adicionais inclusos: Certificado de calibração rastreável RBC emitido pelo laboratório Metis Metrologia.',
    prazoSemCalib: '40 dias', prazoComCalib: '40 dias',
    valorUnit: 7875.00, und: 'Unid.'
  },
  {
    id: 20, modelo: 'MCV110',
    produto: 'Estojo Multiuso',
    imagem: null,                           // ❌ ACESSÓRIO
    descricao: 'Estojo confeccionado em poliéster, com zíper e acabamento interno aveludado (pluma). Acompanha aba interna regulável.',
    prazoSemCalib: 'N/A', prazoComCalib: 'N/A',
    valorUnit: 225.00, und: 'Unid.'
  },

  // ══════════════════════════════════════
  // PÁGINA 3
  // ══════════════════════════════════════

  {
    id: 21, modelo: 'IPA110',
    produto: 'Analisador de Bomba de Infusão',
    imagem: imgProduto('IPA110'),           // ✅ EQUIPAMENTO
    descricao: 'Acessórios inclusos: Fonte de alimentação, carregador de bateria, cabo USB tipo A / USB tipo C, seringa e manual do usuário. Adicionais inclusos: Certificado de calibração rastreável RBC emitido pelo laboratório Metis Metrologia.',
    prazoSemCalib: '30 dias', prazoComCalib: '35 dias',
    valorUnit: 21100.00, und: 'Unid.'
  },
  {
    id: 22, modelo: 'IPA110',
    produto: 'Canal de Fluxo (Unidade)',
    imagem: null,                           // ❌ MÓDULO OPCIONAL
    descricao: 'Kit sensor de fluxo (Opcional).',
    prazoSemCalib: '30 dias', prazoComCalib: '35 dias',
    valorUnit: 4990.00, und: 'Unid.'
  },
  {
    id: 23, modelo: 'IPA110',
    produto: 'Mochila',
    imagem: null,                           // ❌ ACESSÓRIO
    descricao: 'Mochila confeccionada em poliéster, com zíper e alça regulável. Acompanha espuma de proteção do equipamento.',
    prazoSemCalib: 'N/A', prazoComCalib: 'N/A',
    valorUnit: 488.00, und: 'Unid.'
  },
  {
    id: 24, modelo: 'AQT110',
    produto: 'Analisador de Qualificação Térmica + Módulo de Aquisição',
    imagem: imgProduto('AQT110'),           // ✅ EQUIPAMENTO
    descricao: 'Acessórios inclusos: Manual do usuário, cabo Ethernet. Adicionais inclusos: Software SunWeb e certificado de calibração RBC emitido pelo laboratório LRM.',
    prazoSemCalib: '60 dias', prazoComCalib: '60 dias',
    valorUnit: 32865.00, und: 'Unid.'
  },
  {
    id: 25, modelo: 'AQT110',
    produto: 'Mochila',
    imagem: null,                           // ❌ ACESSÓRIO
    descricao: 'Mochila confeccionada em poliéster, com zíper e alça regulável. Acompanha espuma de proteção do equipamento.',
    prazoSemCalib: 'N/A', prazoComCalib: 'N/A',
    valorUnit: 462.00, und: 'Unid.'
  },
  {
    id: 26, modelo: 'AQT110', 
    produto: 'Termopar Ponta Teflon 24AWG 2,5m',
    imagem: null,                           // ❌ CABO/ACESSÓRIO
    descricao: 'Opcional: AQT110. Garantia de 3 meses. 2,5 metros de Termopar. Ponta Teflon. Espessura 24AWG.',
    prazoSemCalib: 'N/A', prazoComCalib: 'N/A', valorUnit: 134.00, und: 'Unid.'
  },
  {
    id: 27, modelo: 'AQT110', produto: 'Termopar Ponta Teflon 24AWG 5m',
    imagem: null,
    descricao: 'Opcional: AQT110. Garantia de 3 meses. 5 metros de Termopar. Ponta Teflon. Espessura 24AWG.',
    prazoSemCalib: 'N/A', prazoComCalib: 'N/A', valorUnit: 198.00, und: 'Unid.'
  },
  {
    id: 28, modelo: 'AQT110', produto: 'Termopar Ponta Teflon 30AWG 2,5m',
    imagem: null,
    descricao: 'Opcional: AQT110. Garantia de 3 meses. 2,5 metros de Termopar. Ponta Teflon. Espessura 30AWG.',
    prazoSemCalib: 'N/A', prazoComCalib: 'N/A', valorUnit: 234.00, und: 'Unid.'
  },
  {
    id: 29, modelo: 'AQT110', produto: 'Termopar Ponta Teflon 30AWG 5m',
    imagem: null,
    descricao: 'Opcional: AQT110. Garantia de 3 meses. 5 metros de Termopar. Ponta Teflon. Espessura 30AWG.',
    prazoSemCalib: 'N/A', prazoComCalib: 'N/A', valorUnit: 377.00, und: 'Unid.'
  },

  // ══════════════════════════════════════
  // PÁGINA 4
  // ══════════════════════════════════════

  {
    id: 30, modelo: 'AQT110', produto: 'Termopar Ponta Metálica 24AWG 2,5m',
    imagem: null,
    descricao: 'Opcional: AQT110. Garantia de 3 meses. 2,5 metros de Termopar. Ponta Metálica. Espessura 24AWG.',
    prazoSemCalib: 'N/A', prazoComCalib: 'N/A', valorUnit: 136.00, und: 'Unid.'
  },
  {
    id: 31, modelo: 'AQT110', produto: 'Termopar Ponta Metálica 24AWG 5m',
    imagem: null,
    descricao: 'Opcional: AQT110. Garantia de 3 meses. 5 metros de Termopar. Ponta Metálica. Espessura 24AWG.',
    prazoSemCalib: 'N/A', prazoComCalib: 'N/A', valorUnit: 198.00, und: 'Unid.'
  },
  {
    id: 32, modelo: 'AQT110', produto: 'Termopar Ponta Metálica 30AWG 2,5m',
    imagem: null,
    descricao: 'Opcional: AQT110. Garantia de 3 meses. 2,5 metros de Termopar. Ponta Metálica. Espessura 30AWG.',
    prazoSemCalib: 'N/A', prazoComCalib: 'N/A', valorUnit: 236.00, und: 'Unid.'
  },
  {
    id: 33, modelo: 'AQT110', produto: 'Termopar Ponta Metálica 30AWG 5m',
    imagem: null,
    descricao: 'Opcional: AQT110. Garantia de 3 meses. 5 metros de Termopar. Ponta Metálica. Espessura 30AWG.',
    prazoSemCalib: 'N/A', prazoComCalib: 'N/A', valorUnit: 398.00, und: 'Unid.'
  },
  {
    id: 34, modelo: 'MPR100',
    produto: 'Módulo de Pressão',
    imagem: imgProduto('MPR100'),                          // ❌ MÓDULO OPCIONAL
    descricao: 'Opcional: AQT110. Adicionais inclusos: Certificado de calibração rastreável RBC emitido pelo laboratório LRM.',
    prazoSemCalib: 'Sob Encomenda', prazoComCalib: 'Sob Encomenda',
    valorUnit: 4460.00, und: 'Unid.'
  },
  {
    id: 35, modelo: 'MUT200',
    produto: 'Módulo de Umidade',
    iimagem: imgProduto('MUT200'),                           // ❌ MÓDULO OPCIONAL
    descricao: 'Opcional: AQT110. Adicionais inclusos: Certificado de calibração rastreável RBC emitido pelo laboratório LRM.',
    prazoSemCalib: '30 dias', prazoComCalib: '30 dias',
    valorUnit: 1550.00, und: 'Unid.'
  },
  {
    id: 36, modelo: 'SPK100',
    produto: 'Simulador Multi-paramétrico',
    imagem: imgProduto('SPK100'),           // ✅ EQUIPAMENTO
    descricao: 'Acessórios inclusos: Manual do usuário. Adicionais inclusos: Software SunWeb e certificado de calibração rastreável RBC emitido pelo laboratório Metis Metrologia.',
    prazoSemCalib: '30 dias', prazoComCalib: '30 dias',
    valorUnit: 19425.00, und: 'Unid.'
  },
  {
    id: 37, modelo: 'SPK100',
    produto: 'Estojo Multiuso',
    imagem: null,                           // ❌ ACESSÓRIO
    descricao: 'Estojo confeccionado em poliéster, com zíper e acabamento interno aveludado (pluma). Acompanha aba interna regulável.',
    prazoSemCalib: 'N/A', prazoComCalib: 'N/A',
    valorUnit: 225.00, und: 'Unid.'
  },
  {
    id: 38, modelo: 'APE100',
    produto: 'Analisador de Pressão e Esfigmomanômetro',
    imagem: imgProduto('APE100'),           // ✅ EQUIPAMENTO
    descricao: 'Acessórios inclusos: Manual do usuário. Adicionais inclusos: Software SunWeb e certificado de calibração RBC emitido pelo laboratório Metis Metrologia.',
    prazoSemCalib: 'Sob Encomenda', prazoComCalib: 'Sob Encomenda',
    valorUnit: 16380.00, und: 'Unid.'
  },
  {
    id: 39, modelo: 'APE100',
    produto: 'Estojo Multiuso',
    imagem: null,                           // ❌ ACESSÓRIO
    descricao: 'Estojo confeccionado em poliéster, com zíper e acabamento interno aveludado (pluma). Acompanha aba interna regulável.',
    prazoSemCalib: 'N/A', prazoComCalib: 'N/A',
    valorUnit: 225.00, und: 'Unid.'
  },

  // ══════════════════════════════════════
  // PÁGINA 5
  // ══════════════════════════════════════

  {
    id: 40, modelo: 'SIM300',
    produto: 'Simulador de ECG',
    imagem: imgProduto('SIM300'),           // ✅ EQUIPAMENTO
    descricao: 'Acessórios inclusos: 3 (três) Pilhas Alcalina AAA. Adicionais inclusos: Certificado de calibração rastreável RBC emitido pelo laboratório Metis Metrologia. Opcional: SMP100/SMP200/SPK100.',
    prazoSemCalib: '15 dias', prazoComCalib: '15 dias',
    valorUnit: 2750.00, und: 'Unid.'
  },
  {
    id: 41, modelo: 'SIM300',
    produto: 'Estojo',
    imagem: null,                           // ❌ ACESSÓRIO
    descricao: 'Estojo confeccionado em poliéster, com zíper e acabamento interno aveludado (pluma).',
    prazoSemCalib: 'N/A', prazoComCalib: 'N/A',
    valorUnit: 168.00, und: 'Unid.'
  },
  {
    id: 42, modelo: 'ABI100',
    produto: 'Analisador de Bisturi',
    imagem: imgProduto('ABI100'),           // ✅ EQUIPAMENTO
    descricao: 'Acessórios inclusos: Mala, fonte de alimentação e carregador de bateria, 8 cabos de interconexão de bornes, cabo USB e manual do usuário. Adicionais inclusos: Software SunWeb e certificado de calibração rastreável RBC emitido pelo laboratório Metis Metrologia.',
    prazoSemCalib: '45 dias', prazoComCalib: '45 dias',
    valorUnit: 44100.00, und: 'Unid.'
  },
  {
    id: 43, modelo: 'ABI200',
    produto: 'Analisador de Bisturi',
    imagem: imgProduto('ABI200'),           // ✅ EQUIPAMENTO
    descricao: 'Acessórios inclusos: Carregador de bateria, cabo mini USB Tipo A / Tipo B, 2 cabos de conexão pino banana e/ou garra jacaré e manual do usuário. Adicionais inclusos: Software SunWeb e certificado de calibração rastreável RBC emitido pelo laboratório Metis Metrologia.',
    prazoSemCalib: '40 dias', prazoComCalib: '45 dias',
    valorUnit: 29560.00, und: 'Unid.'
  },
  {
    id: 44, modelo: 'ABI200',
    produto: 'Estojo Multiuso',
    imagem: null,                           // ❌ ACESSÓRIO
    descricao: 'Estojo confeccionado em poliéster, com zíper e acabamento interno aveludado (pluma). Acompanha aba interna regulável.',
    prazoSemCalib: 'N/A', prazoComCalib: 'N/A',
    valorUnit: 225.00, und: 'Unid.'
  },
  {
    id: 45, modelo: 'TQC110',
    produto: 'Simulador de Impedância',
    imagem: imgProduto('TQC110'),           // ✅ EQUIPAMENTO
    descricao: 'Acessórios inclusos: Manual do usuário. Opcional: ABI100. Adicionais inclusos: Certificado de calibração rastreável RBC emitido pelo laboratório LRM.',
    prazoSemCalib: '35 dias', prazoComCalib: '35 dias',
    valorUnit: 3390.00, und: 'Unid.'
  },
  {
    id: 46, modelo: 'TQC110',
    produto: 'Estojo Multiuso',
    imagem: null,                           // ❌ ACESSÓRIO
    descricao: 'Estojo confeccionado em poliéster, com zíper e acabamento interno aveludado (pluma). Acompanha aba interna regulável.',
    prazoSemCalib: 'N/A', prazoComCalib: 'N/A',
    valorUnit: 168.00, und: 'Unid.'
  },
  {
    id: 47, modelo: 'MCV300',
    produto: 'Módulo de Cargas Variáveis',
    imagem: imgProduto('MCV300'),                          // ❌ MÓDULO OPCIONAL
    descricao: 'Acessórios inclusos: 3 cabos de retorno, 4 cabos de conexão 10cm, 4 cabos de conexão 25cm, 2 garras jacaré média, cabo de força 10A e manual do usuário. Opcional: ABI100/ABI200. Adicionais inclusos: Certificado de calibração rastreável RBC emitido pelo laboratório Metis Metrologia.',
    prazoSemCalib: 'Sob Encomenda', prazoComCalib: 'Sob Encomenda',
    valorUnit: 9930.00, und: 'Unid.'
  },
  {
    id: 48, modelo: 'MCV400',
    produto: 'Módulo de Cargas Variáveis',
    imagem: imgProduto('MCV400'),                           // ❌ MÓDULO OPCIONAL
    descricao: 'Acessórios inclusos: 3 cabos de retorno, 4 cabos de conexão 10cm, 4 cabos de conexão 25cm, 2 garras jacaré média, cabo de força 10A e manual do usuário. Opcional: ABI100/ABI200. Adicionais inclusos: Certificado de calibração rastreável RBC emitido pelo laboratório Metis Metrologia.',
    prazoSemCalib: 'Sob Encomenda', prazoComCalib: 'Sob Encomenda',
    valorUnit: 10815.00, und: 'Unid.'
  },
  {
    id: 49, modelo: 'TIN100',
    produto: 'Analisador de Incubadora Neonatal',
    imagem: imgProduto('TIN100'),           // ✅ EQUIPAMENTO
    descricao: 'Acessórios inclusos: 1 Módulo Sensor de Pele (MSP), 1 Módulo Interno Central (MIC), 4 Módulos Internos Periféricos (MIP) (A, B, C e D), 1 Cabo Força 10A, 1 Mini USB, 1 Carregador 5V, 1 USB, 4 Cabos Comunicação MIC-MIP, 1 Cabos Comunicação MIC-MSP. Adicionais inclusos: Software SunWeb e certificado de calibração rastreável RBC emitido pelo laboratório LRM.',
    prazoSemCalib: 'Sob Encomenda', prazoComCalib: 'Sob Encomenda',
    valorUnit: 59010.00, und: 'Unid.'
  },

  // ══════════════════════════════════════
  // PÁGINA 6
  // ══════════════════════════════════════

  {
    id: 50, modelo: 'TIN100',
    produto: 'Mochila',
    imagem: null,                           // ❌ ACESSÓRIO
    descricao: 'Mochila confeccionada em poliéster, com zíper e alça regulável. Acompanha espuma de proteção do equipamento.',
    prazoSemCalib: 'N/A', prazoComCalib: 'N/A',
    valorUnit: 462.00, und: 'Unid.'
  },
];