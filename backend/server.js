const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const fs = require('fs');
const https = require('https');
const path = require('path');
const { Pool } = require('pg');

const app = express();
const MODO_LOCAL = process.env.MAERA_MODO_LOCAL !== 'false';
const PORT = process.env.PORT || (MODO_LOCAL ? 3050 : 3000);

function diretorioGravavel(dir) {
  try {
    const teste = path.join(dir, `.maera_write_${Date.now()}.tmp`);
    fs.writeFileSync(teste, 'ok');
    fs.unlinkSync(teste);
    return true;
  } catch {
    return false;
  }
}

const DATA_DIR = process.env.MAERA_DATA_DIR ||
  (diretorioGravavel(__dirname)
    ? __dirname
    : path.join(process.env.LOCALAPPDATA || process.env.TEMP || __dirname, 'MAERA-Orcamentos'));

let DATA_DIR_OK = true;
try {
  fs.mkdirSync(DATA_DIR, { recursive: true });
} catch (e) {
  DATA_DIR_OK = false;
  console.warn('Nao foi possivel preparar a pasta de dados local:', e.message);
}

function caminhoDados(envName, fallback) {
  const nomeArquivo = process.env[envName] || fallback;
  const origem = path.join(__dirname, nomeArquivo);
  if (!DATA_DIR_OK) return origem;
  const destino = path.join(DATA_DIR, path.basename(nomeArquivo));
  if (!fs.existsSync(destino) && fs.existsSync(origem)) {
    try {
      fs.copyFileSync(origem, destino);
    } catch (e) {
      console.warn(`Nao foi possivel copiar ${nomeArquivo} para a pasta de dados:`, e.message);
    }
  }
  return destino;
}

const ORCAMENTOS_PATH = caminhoDados('MAERA_ORCAMENTOS_JSON', 'db_orcamentos_teste.json');
const VENDEDORES_PATH = caminhoDados('MAERA_VENDEDORES_JSON', 'vendedores_teste.json');
const MEM_STORE = new Map();
const COOKIE_NAME = 'maera_auth';
const AUTH_PASSWORD = process.env.MAERA_PASSWORD || 'maera2026';
const MASTER_LOGIN = process.env.MAERA_MASTER_LOGIN || 'master';
const AUTH_SECRET = process.env.MAERA_AUTH_SECRET || 'troque-este-segredo-no-render';
const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const DATABASE_URL = MODO_LOCAL ? '' : (process.env.DATABASE_URL || '');
const pool = DATABASE_URL
  ? new Pool({
      connectionString: DATABASE_URL,
      ssl: process.env.DATABASE_SSL === 'true'
        ? { rejectUnauthorized: false }
        : undefined
    })
  : null;

function readJson(filePath, fallback) {
  try {
    if (MEM_STORE.has(filePath)) return MEM_STORE.get(filePath);
    if (!fs.existsSync(filePath)) return fallback;
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch (e) {
    console.error(`Erro ao ler ${path.basename(filePath)}:`, e);
    return fallback;
  }
}

function writeJson(filePath, data) {
  MEM_STORE.set(filePath, data);
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  } catch (e) {
    console.warn(`Nao foi possivel gravar ${path.basename(filePath)} em disco:`, e.message);
  }
}

async function query(sql, params = []) {
  if (!pool) throw new Error('Banco SQL nao configurado.');
  return pool.query(sql, params);
}

async function iniciarBanco() {
  if (!pool) {
    console.log('Modo local ativo - usando arquivos JSON locais.');
    console.log('Orcamentos:', ORCAMENTOS_PATH);
    console.log('Vendedores:', VENDEDORES_PATH);
    return;
  }

  await query(`
    CREATE TABLE IF NOT EXISTS vendedores (
      nome TEXT PRIMARY KEY,
      criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS orcamentos (
      id TEXT PRIMARY KEY,
      numero TEXT UNIQUE,
      data JSONB NOT NULL,
      criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await query(`
    CREATE INDEX IF NOT EXISTS idx_orcamentos_atualizado_em
    ON orcamentos (atualizado_em DESC)
  `);

  await importarJsonInicial();
  console.log('Banco PostgreSQL conectado.');
}

async function importarJsonInicial() {
  const vendedoresCount = await query('SELECT COUNT(*)::int AS total FROM vendedores');
  if (vendedoresCount.rows[0].total === 0) {
    const vendedores = normalizarListaVendedores(readJson(VENDEDORES_PATH, []));
    for (const nome of vendedores) {
      await query(
        'INSERT INTO vendedores (nome) VALUES ($1) ON CONFLICT (nome) DO NOTHING',
        [nome]
      );
    }
  }

  const orcamentosCount = await query('SELECT COUNT(*)::int AS total FROM orcamentos');
  if (orcamentosCount.rows[0].total === 0) {
    const orcamentos = readJson(ORCAMENTOS_PATH, []);
    for (const orcamento of orcamentos) {
      if (!orcamento?.id) continue;
      await salvarOrcamentoSql(orcamento);
    }
  }
}

async function listarVendedores() {
  const vendedoresArquivo = normalizarListaVendedores(readJson(VENDEDORES_PATH, []));
  if (!pool || vendedoresArquivo.length) return vendedoresArquivo;
  const resultado = await query('SELECT nome FROM vendedores ORDER BY nome ASC');
  return normalizarListaVendedores(resultado.rows.map(row => row.nome));
}

async function salvarListaVendedores(lista) {
  writeJson(VENDEDORES_PATH, normalizarListaVendedores(lista));
}

async function criarVendedor(dados) {
  const vendedores = normalizarListaVendedores(await listarVendedores());
  const usuario = normalizarUsuario(dados, vendedores.length);
  const indice = vendedores.findIndex(item => item.login === usuario.login);
  if (indice >= 0) vendedores[indice] = { ...vendedores[indice], ...usuario };
  else vendedores.push(usuario);
  await salvarListaVendedores(vendedores);
  if (!pool) return sanitizarUsuario(usuario);

  await query(
    'INSERT INTO vendedores (nome) VALUES ($1) ON CONFLICT (nome) DO NOTHING',
    [usuario.nome]
  );
  return sanitizarUsuario(usuario);
}

async function atualizarVendedor(loginAtual, dados) {
  const vendedores = normalizarListaVendedores(await listarVendedores());
  const indice = vendedores.findIndex(item => item.login === loginAtual);
  if (indice < 0) return null;

  const usuarioAtual = vendedores[indice];
  const usuario = normalizarUsuario({
    ...usuarioAtual,
    ...dados,
    senha: dados?.senha ? dados.senha : usuarioAtual.senha
  }, indice);

  const duplicado = vendedores.some((item, idx) =>
    idx !== indice && item.login === usuario.login
  );
  if (duplicado) {
    const erro = new Error('Login ja cadastrado.');
    erro.statusCode = 409;
    throw erro;
  }

  vendedores[indice] = usuario;
  await salvarListaVendedores(vendedores);
  return sanitizarUsuario(usuario);
}

async function excluirVendedor(login) {
  if (!pool) {
    const vendedores = normalizarListaVendedores(readJson(VENDEDORES_PATH, []));
    const atualizados = vendedores.filter(item => item.login !== login || item.master);
    writeJson(VENDEDORES_PATH, atualizados);
    return vendedores.length !== atualizados.length;
  }

  const usuario = (await listarVendedores()).find(item => item.login === login);
  if (!usuario || usuario.master) return false;
  const resultado = await query('DELETE FROM vendedores WHERE nome = $1', [usuario.nome]);
  return resultado.rowCount > 0;
}

async function listarOrcamentos() {
  if (!pool) return readJson(ORCAMENTOS_PATH, []);
  const resultado = await query(`
    SELECT data
    FROM orcamentos
    ORDER BY criado_em ASC, id ASC
  `);
  return resultado.rows.map(row => row.data);
}

async function buscarOrcamento(id) {
  if (!pool) {
    return readJson(ORCAMENTOS_PATH, []).find(item => item.id === id);
  }

  const resultado = await query('SELECT data FROM orcamentos WHERE id = $1', [id]);
  return resultado.rows[0]?.data;
}

async function numeroOrcamentoEmUso(id, numero) {
  if (!numero) return false;
  if (!pool) {
    return readJson(ORCAMENTOS_PATH, []).some(item =>
      item.id !== id &&
      item.numero &&
      item.numero === numero
    );
  }

  const resultado = await query(
    'SELECT 1 FROM orcamentos WHERE numero = $1 AND id <> $2 LIMIT 1',
    [numero, id]
  );
  return resultado.rowCount > 0;
}

async function salvarOrcamentoSql(orcamento) {
  const criadoEm = orcamento.criadoEm || new Date().toISOString();
  const atualizadoEm = orcamento.atualizadoEm || new Date().toISOString();
  await query(
    `
      INSERT INTO orcamentos (id, numero, data, criado_em, atualizado_em)
      VALUES ($1, $2, $3::jsonb, $4, $5)
      ON CONFLICT (id)
      DO UPDATE SET
        numero = EXCLUDED.numero,
        data = EXCLUDED.data,
        atualizado_em = EXCLUDED.atualizado_em
    `,
    [
      orcamento.id,
      orcamento.numero || null,
      JSON.stringify(orcamento),
      criadoEm,
      atualizadoEm
    ]
  );
}

async function salvarOrcamento(orcamento) {
  if (!orcamento.id) {
    orcamento.id = `orc_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  }

  const orcamentos = await listarOrcamentos();
  const indice = orcamentos.findIndex(item => item.id === orcamento.id);
  const agora = new Date().toISOString();
  const numeroEmUso = await numeroOrcamentoEmUso(orcamento.id, orcamento.numero);
  const salvo = {
    ...orcamento,
    numero: !orcamento.numero || numeroEmUso
      ? gerarNumeroUnico(orcamentos, orcamento.emissao)
      : orcamento.numero,
    criadoEm: orcamento.criadoEm || agora,
    atualizadoEm: agora
  };

  if (!pool) {
    if (indice >= 0) {
      orcamentos[indice] = salvo;
    } else {
      orcamentos.push(salvo);
    }
    writeJson(ORCAMENTOS_PATH, orcamentos);
  } else {
    await salvarOrcamentoSql(salvo);
  }

  return { salvo, criado: indice < 0 };
}

async function atualizarOrcamento(id, dados) {
  const atual = await buscarOrcamento(id);
  if (!atual) return null;

  const salvo = {
    ...atual,
    ...dados,
    id,
    atualizadoEm: new Date().toISOString()
  };

  if (!pool) {
    const orcamentos = readJson(ORCAMENTOS_PATH, []);
    const indice = orcamentos.findIndex(item => item.id === id);
    orcamentos[indice] = salvo;
    writeJson(ORCAMENTOS_PATH, orcamentos);
  } else {
    await salvarOrcamentoSql(salvo);
  }

  return salvo;
}

async function excluirOrcamento(id) {
  if (!pool) {
    const orcamentos = readJson(ORCAMENTOS_PATH, []);
    const atualizados = orcamentos.filter(item => item.id !== id);
    writeJson(ORCAMENTOS_PATH, atualizados);
    return orcamentos.length !== atualizados.length;
  }

  const resultado = await query('DELETE FROM orcamentos WHERE id = $1', [id]);
  return resultado.rowCount > 0;
}

function getJsonUrl(url) {
  return new Promise((resolve, reject) => {
    const req = https
      .get(url, {
        headers: {
          'User-Agent': 'MAERA-Orcamentos-Local/1.0',
          Accept: 'application/json'
        },
        timeout: 12000
      }, resp => {
        let body = '';
        resp.setEncoding('utf8');
        resp.on('data', chunk => {
          body += chunk;
        });
        resp.on('end', () => {
          try {
            resolve({
              statusCode: resp.statusCode || 500,
              data: JSON.parse(body)
            });
          } catch (e) {
            reject(e);
          }
        });
      })
      .on('error', reject);

    req.on('timeout', () => {
      req.destroy(new Error('Tempo limite ao consultar CNPJ.'));
    });
  });
}

function dataOrcamento(valor) {
  const data = valor ? new Date(`${valor}T00:00:00`) : new Date();
  return Number.isNaN(data.getTime()) ? new Date() : data;
}

function prefixoNumeroOrcamento(data) {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const dia = String(data.getDate()).padStart(2, '0');
  return `${ano}${mes}${dia}`;
}

function gerarNumeroUnico(orcamentos, emissao) {
  const prefixo = prefixoNumeroOrcamento(dataOrcamento(emissao));
  const usados = new Set(
    orcamentos
      .map(item => String(item.numero || ''))
      .filter(numero => numero.startsWith(`${prefixo}-`))
  );

  let seq = 1;
  let numero = `${prefixo}-${String(seq).padStart(2, '0')}`;
  while (usados.has(numero)) {
    seq += 1;
    numero = `${prefixo}-${String(seq).padStart(2, '0')}`;
  }
  return numero;
}

function normalizarListaVendedores(lista) {
  const usuarios = [];
  const usados = new Set();
  (Array.isArray(lista) ? lista : []).forEach((item, index) => {
    const usuario = normalizarUsuario(item, index);
    if (!usuario.nome || usados.has(usuario.login)) return;
    usados.add(usuario.login);
    usuarios.push(usuario);
  });
  if (!usuarios.some(item => item.master)) {
    usuarios.unshift({
      nome: 'Administrador',
      login: MASTER_LOGIN,
      senha: AUTH_PASSWORD,
      master: true,
      perfil: 'admin'
    });
  }
  return usuarios.sort((a, b) => {
    if (a.master && !b.master) return -1;
    if (!a.master && b.master) return 1;
    return a.nome.localeCompare(b.nome, 'pt-BR');
  });
}

function slugLogin(valor) {
  return String(valor || '')
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '.')
    .replace(/^\.+|\.+$/g, '') || 'usuario';
}

function normalizarUsuario(item, index = 0) {
  if (typeof item === 'string') {
    const nome = item.trim();
    return {
      nome,
      login: slugLogin(nome),
      senha: AUTH_PASSWORD,
      master: false,
      perfil: 'vendedor'
    };
  }

  const nome = String(item?.nome || '').trim();
  const login = slugLogin(item?.login || nome || `usuario-${index + 1}`);
  const perfil = item?.perfil === 'admin' || item?.master ? 'admin' : 'vendedor';
  return {
    nome,
    login,
    senha: String(item?.senha || AUTH_PASSWORD),
    master: perfil === 'admin',
    perfil
  };
}

function sanitizarUsuario(usuario) {
  if (!usuario) return null;
  return {
    nome: usuario.nome,
    login: usuario.login,
    master: !!usuario.master,
    perfil: usuario.perfil || (usuario.master ? 'admin' : 'vendedor')
  };
}

function parseCookies(req) {
  return String(req.headers.cookie || '')
    .split(';')
    .map(item => item.trim())
    .filter(Boolean)
    .reduce((acc, item) => {
      const index = item.indexOf('=');
      if (index === -1) return acc;
      acc[item.slice(0, index)] = decodeURIComponent(item.slice(index + 1));
      return acc;
    }, {});
}

function assinar(valor) {
  return crypto
    .createHmac('sha256', AUTH_SECRET)
    .update(valor)
    .digest('hex');
}

function criarToken(usuario) {
  const payload = JSON.stringify({
    usuario: sanitizarUsuario(usuario),
    exp: Date.now() + ONE_DAY_MS
  });
  const base = Buffer.from(payload).toString('base64url');
  return `${base}.${assinar(base)}`;
}

function payloadToken(token) {
  if (!token || !token.includes('.')) return false;
  const [base, assinatura] = token.split('.');
  const assinaturaEsperada = assinar(base);
  if (assinatura.length !== assinaturaEsperada.length) return false;
  const ok = crypto.timingSafeEqual(
    Buffer.from(assinatura),
    Buffer.from(assinaturaEsperada)
  );
  if (!ok) return false;

  try {
    const payload = JSON.parse(Buffer.from(base, 'base64url').toString('utf-8'));
    return Number(payload.exp) > Date.now() ? payload : false;
  } catch {
    return false;
  }
}

function cookieAuth(token, req) {
  const secure = req.protocol === 'https' || req.headers['x-forwarded-proto'] === 'https';
  const sameSite = secure ? 'None' : 'Lax';
  return [
    `${COOKIE_NAME}=${encodeURIComponent(token)}`,
    'HttpOnly',
    'Path=/',
    `Max-Age=${ONE_DAY_MS / 1000}`,
    `SameSite=${sameSite}`,
    secure ? 'Secure' : ''
  ].filter(Boolean).join('; ');
}

function limparCookieAuth(req) {
  const secure = req.protocol === 'https' || req.headers['x-forwarded-proto'] === 'https';
  const sameSite = secure ? 'None' : 'Lax';
  return [
    `${COOKIE_NAME}=`,
    'HttpOnly',
    'Path=/',
    'Max-Age=0',
    `SameSite=${sameSite}`,
    secure ? 'Secure' : ''
  ].filter(Boolean).join('; ');
}

function autenticado(req) {
  return !!obterSessao(req);
}

function obterSessao(req) {
  const authHeader = String(req.headers.authorization || '');
  const bearerToken = authHeader.startsWith('Bearer ')
    ? authHeader.slice(7).trim()
    : '';
  const payload = payloadToken(parseCookies(req)[COOKIE_NAME]) || payloadToken(bearerToken);
  if (!payload?.usuario) return null;
  if (typeof payload.usuario === 'string') {
    return {
      nome: 'Administrador',
      login: MASTER_LOGIN,
      master: true,
      perfil: 'admin'
    };
  }
  return payload.usuario;
}

function exigirLogin(req, res, next) {
  const usuario = obterSessao(req);
  if (usuario) {
    req.usuario = usuario;
    return next();
  }
  return res.status(401).json({ erro: 'Login necessario.' });
}

function exigirMaster(req, res, next) {
  if (req.usuario?.master || req.usuario?.perfil === 'admin') return next();
  return res.status(403).json({ erro: 'Acesso permitido apenas ao usuario admin.' });
}

console.log('SERVER.JS iniciado - dir:', __dirname);

app.set('trust proxy', 1);
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.get('/teste', (req, res) => {
  res.send('<h1>Rota teste OK</h1>');
});

app.post('/api/login', (req, res) => {
  const login = slugLogin(req.body?.login || MASTER_LOGIN);
  const senha = String(req.body?.senha || '');
  const usuarios = normalizarListaVendedores(readJson(VENDEDORES_PATH, []));
  const usuario = usuarios.find(item => item.login === login && item.senha === senha);
  if (!usuario) {
    return res.status(401).json({ erro: 'Senha invalida.' });
  }

  const token = criarToken(usuario);
  res.setHeader('Set-Cookie', cookieAuth(token, req));
  res.json({ ok: true, token, usuario: sanitizarUsuario(usuario) });
});

app.post('/api/logout', (req, res) => {
  res.setHeader('Set-Cookie', limparCookieAuth(req));
  res.json({ ok: true });
});

app.get('/api/session', (req, res) => {
  const usuario = obterSessao(req);
  res.json({ autenticado: !!usuario, usuario });
});

app.use('/api', exigirLogin);

app.post('/api/minha-senha', async (req, res) => {
  const senhaAtual = String(req.body?.senhaAtual || '');
  const novaSenha = String(req.body?.novaSenha || '');

  if (!senhaAtual || !novaSenha) {
    return res.status(400).json({ erro: 'Informe a senha atual e a nova senha.' });
  }
  if (novaSenha.length < 3) {
    return res.status(400).json({ erro: 'A nova senha precisa ter pelo menos 3 caracteres.' });
  }

  try {
    const vendedores = normalizarListaVendedores(await listarVendedores());
    const indice = vendedores.findIndex(item => item.login === req.usuario.login);
    if (indice < 0) return res.status(404).json({ erro: 'Usuario nao encontrado.' });
    if (vendedores[indice].senha !== senhaAtual) {
      return res.status(401).json({ erro: 'Senha atual incorreta.' });
    }

    vendedores[indice] = {
      ...vendedores[indice],
      senha: novaSenha
    };
    await salvarListaVendedores(vendedores);

    const token = criarToken(vendedores[indice]);
    res.setHeader('Set-Cookie', cookieAuth(token, req));
    res.json({ ok: true, token, usuario: sanitizarUsuario(vendedores[indice]) });
  } catch (e) {
    console.error('Erro ao alterar senha:', e);
    res.status(500).json({ erro: 'Erro ao alterar senha.' });
  }
});

app.get('/api/cnpj/:cnpj', async (req, res) => {
  const cnpj = String(req.params.cnpj || '').replace(/\D/g, '');
  if (cnpj.length !== 14) {
    return res.status(400).json({ message: 'CNPJ invalido.' });
  }

  try {
    const resultado = await getJsonUrl(`https://brasilapi.com.br/api/cnpj/v1/${cnpj}`);
    res.status(resultado.statusCode).json(resultado.data);
  } catch (e) {
    console.error('Erro ao consultar BrasilAPI:', e);
    res.json({
      offline: true,
      message: 'Nao foi possivel consultar o CNPJ agora. Preencha os dados manualmente.'
    });
  }
});

app.get('/api/vendedores', async (req, res) => {
  try {
    res.json((await listarVendedores()).map(sanitizarUsuario));
  } catch (e) {
    console.error('Erro ao listar vendedores:', e);
    res.status(500).json({ erro: 'Erro ao listar vendedores.' });
  }
});

app.post('/api/vendedores', exigirMaster, async (req, res) => {
  const nome = String(req.body?.nome || '').trim();
  if (!nome) return res.status(400).json({ erro: 'Nome do vendedor e obrigatorio.' });

  try {
    res.status(201).json(await criarVendedor(req.body || {}));
  } catch (e) {
    console.error('Erro ao criar vendedor:', e);
    res.status(500).json({ erro: 'Erro ao criar vendedor.' });
  }
});

app.put('/api/vendedores/:login', exigirMaster, async (req, res) => {
  const login = slugLogin(decodeURIComponent(req.params.login || ''));
  try {
    const atualizado = await atualizarVendedor(login, req.body || {});
    if (!atualizado) return res.status(404).json({ erro: 'Login nao encontrado.' });
    res.json(atualizado);
  } catch (e) {
    console.error('Erro ao atualizar vendedor:', e);
    res.status(e.statusCode || 500).json({ erro: e.message || 'Erro ao atualizar vendedor.' });
  }
});

app.delete('/api/vendedores/:nome', exigirMaster, async (req, res) => {
  const nome = decodeURIComponent(req.params.nome || '').trim();
  try {
    const excluido = await excluirVendedor(nome);
    res.status(excluido ? 204 : 404).end();
  } catch (e) {
    console.error('Erro ao excluir vendedor:', e);
    res.status(500).json({ erro: 'Erro ao excluir vendedor.' });
  }
});

app.get('/api/orcamentos', async (req, res) => {
  try {
    res.json(await listarOrcamentos());
  } catch (e) {
    console.error('Erro ao listar orcamentos:', e);
    res.status(500).json({ erro: 'Erro ao listar orcamentos.' });
  }
});

app.get('/api/orcamentos/:id', async (req, res) => {
  try {
    const orcamento = await buscarOrcamento(req.params.id);
    if (!orcamento) return res.status(404).json({ erro: 'Orcamento nao encontrado.' });
    res.json(orcamento);
  } catch (e) {
    console.error('Erro ao buscar orcamento:', e);
    res.status(500).json({ erro: 'Erro ao buscar orcamento.' });
  }
});

app.post('/api/orcamentos', async (req, res) => {
  try {
    const dados = req.body || {};
    if (req.usuario && !req.usuario.master) dados.vendedor = req.usuario.nome;
    const { salvo, criado } = await salvarOrcamento(dados);
    res.status(criado ? 201 : 200).json(salvo);
  } catch (e) {
    console.error('Erro ao salvar orcamento:', e);
    res.status(500).json({ erro: 'Erro ao salvar orcamento.' });
  }
});

app.put('/api/orcamentos/:id', async (req, res) => {
  try {
    const dados = req.body || {};
    if (req.usuario && !req.usuario.master) dados.vendedor = req.usuario.nome;
    const salvo = await atualizarOrcamento(req.params.id, dados);
    if (!salvo) return res.status(404).json({ erro: 'Orcamento nao encontrado.' });
    res.json(salvo);
  } catch (e) {
    console.error('Erro ao atualizar orcamento:', e);
    res.status(500).json({ erro: 'Erro ao atualizar orcamento.' });
  }
});

app.delete('/api/orcamentos/:id', async (req, res) => {
  try {
    const excluido = await excluirOrcamento(req.params.id);
    res.status(excluido ? 204 : 404).end();
  } catch (e) {
    console.error('Erro ao excluir orcamento:', e);
    res.status(500).json({ erro: 'Erro ao excluir orcamento.' });
  }
});

app.get('/vendedores', (req, res) => res.redirect(301, '/api/vendedores'));

app.get('/qrcode_livreto_final_card.png', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'qrcode_livreto_final_card.png'));
});

app.use((req, res, next) => {
  const arquivoPublico =
    req.path === '/login.html' ||
    req.path.startsWith('/assets/') ||
    req.path === '/favicon.ico';
  const pedePagina = req.method === 'GET' && !req.path.startsWith('/api');

  if (arquivoPublico || !pedePagina || autenticado(req)) return next();
  return res.redirect('/login.html');
});

app.use(express.static(path.join(__dirname, '../frontend')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend', 'index.html'));
});

iniciarBanco()
  .then(() => {
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Servidor rodando na porta ${PORT}`);
    });
  })
  .catch(e => {
    console.error('Erro ao iniciar banco de dados:', e);
    process.exit(1);
  });
