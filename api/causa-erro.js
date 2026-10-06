// /api/causa-erro.js
// Função serverless da Vercel — 100% AUTOCONTIDA.
// NÃO importa nenhum outro arquivo local (sem require("./_lib") etc.).
// A chave da IA é lida apenas aqui, via process.env.ANTHROPIC_API_KEY.

const API_URL = "https://api.anthropic.com/v1/messages";
const MODELO_PADRAO = "claude-sonnet-4-5";
const MAX_TOKENS = 1000;

const CAUSAS = [
  "Falta de conhecimento",
  "Confusão entre conceitos",
  "Desatenção",
  "Desconhecimento de exceção/legislação",
  "Leitura apressada",
  "Confusão entre alternativas",
];

function lerCorpo(req) {
  let corpo = req.body;
  if (typeof corpo === "string") {
    try {
      corpo = JSON.parse(corpo);
    } catch (e) {
      throw new Error("O corpo da requisição não é um JSON válido.");
    }
  }
  if (!corpo || typeof corpo !== "object") throw new Error("Corpo da requisição vazio.");
  return corpo;
}

function limpar(texto, max) {
  return String(texto || "").replace(/\s+/g, " ").trim().slice(0, max);
}

function extrairJSON(texto) {
  const inicio = texto.indexOf("{");
  const fim = texto.lastIndexOf("}");
  if (inicio === -1 || fim <= inicio) {
    throw new Error("A IA não devolveu um objeto JSON (não há '{' ... '}' na resposta).");
  }
  try {
    return JSON.parse(texto.slice(inicio, fim + 1));
  } catch (e) {
    throw new Error("O JSON devolvido pela IA está malformado: " + e.message);
  }
}

async function chamarClaude(chave, modelo, sistema, usuario) {
  let resp;
  try {
    resp = await fetch(API_URL, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": chave,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: modelo,
        max_tokens: MAX_TOKENS,
        system: sistema,
        messages: [{ role: "user", content: usuario }],
      }),
    });
  } catch (e) {
    throw new Error("Falha de rede ao contatar a API da Anthropic: " + e.message);
  }
  const bruto = await resp.text();
  let data = null;
  try {
    data = JSON.parse(bruto);
  } catch (e) {
    /* tratado abaixo */
  }
  if (!resp.ok) {
    const detalhe = (data && data.error && data.error.message) || bruto.slice(0, 300);
    throw new Error("API da Anthropic respondeu " + resp.status + ": " + detalhe);
  }
  if (!data) throw new Error("A API da Anthropic devolveu uma resposta que não é JSON.");
  if (data.stop_reason === "max_tokens") {
    throw new Error("Resposta cortada: a IA atingiu o limite de " + MAX_TOKENS + " tokens.");
  }
  const texto = (data.content || []).filter((b) => b.type === "text").map((b) => b.text).join("");
  if (!texto.trim()) throw new Error("A IA devolveu uma resposta vazia.");
  return texto;
}

async function handler(req, res) {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  if (req.method !== "POST") {
    res.statusCode = 405;
    return res.end(JSON.stringify({ erro: "Método " + req.method + " não permitido. Use POST." }));
  }
  const chave = process.env.ANTHROPIC_API_KEY;
  if (!chave) {
    res.statusCode = 500;
    return res.end(JSON.stringify({
      erro: "ANTHROPIC_API_KEY não configurada na Vercel. Vá em Settings → Environment Variables, adicione a chave e faça Redeploy.",
    }));
  }
  const modelo = process.env.ANTHROPIC_MODEL || MODELO_PADRAO;

  let q, marcada;
  try {
    const c = lerCorpo(req);
    q = c.questao;
    marcada = limpar(c.resposta, 2).toUpperCase();
    if (!q || !q.enunciado || !q.gabarito) throw new Error("Campo 'questao' ausente ou incompleto.");
    if (!marcada) throw new Error("Campo 'resposta' (alternativa marcada) ausente.");
  } catch (e) {
    res.statusCode = 400;
    return res.end(JSON.stringify({ erro: e.message }));
  }

  const alternativas = q.alternativas || {};
  const listaAlt = Object.keys(alternativas)
    .map((l) => l + ") " + limpar(alternativas[l], 300))
    .join("\n");

  const sistema = [
    "Você é um(a) professor(a) de cursinho para Auditor Fiscal que diagnostica por que o aluno errou uma questão.",
    "Escolha a causa mais provável EXATAMENTE entre: " + CAUSAS.join("; ") + ".",
    "Seja extremamente conciso: \"explicacao\" até 30 palavras; \"dica\" até 20 palavras.",
    "Responda SOMENTE com JSON, sem markdown: {\"causa\":\"...\",\"explicacao\":\"...\",\"dica\":\"...\"}",
  ].join("\n");

  const usuario = [
    "Disciplina: " + limpar(q.disciplina, 120) + " | Assunto: " + limpar(q.assunto, 200),
    "Enunciado: " + limpar(q.enunciado, 1200),
    "Alternativas:\n" + listaAlt,
    "Gabarito: " + limpar(q.gabarito, 2),
    "Aluno marcou: " + marcada,
    "Explicação da alternativa marcada: " + limpar((q.explicacoes || {})[marcada], 300),
    "Pegadinha: " + limpar(q.pegadinha, 200),
  ].join("\n");

  try {
    const texto = await chamarClaude(chave, modelo, sistema, usuario);
    const r = extrairJSON(texto);
    let causa = limpar(r.causa, 80);
    const achada = CAUSAS.find((c) => c.toLowerCase() === causa.toLowerCase()) ||
      CAUSAS.find((c) => causa.toLowerCase().includes(c.toLowerCase().split(" ")[0]));
    causa = achada || "Confusão entre conceitos";
    res.statusCode = 200;
    return res.end(JSON.stringify({
      causa,
      explicacao: limpar(r.explicacao, 400),
      dica: limpar(r.dica, 300),
    }));
  } catch (e) {
    res.statusCode = 502;
    return res.end(JSON.stringify({ erro: "Não foi possível diagnosticar a causa do erro. Motivo: " + e.message }));
  }
}

module.exports = handler;
module.exports.config = { maxDuration: 60 };
