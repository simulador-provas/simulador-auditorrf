// /api/gerar-questao.js
// Função serverless da Vercel — 100% AUTOCONTIDA.
// NÃO importa nenhum outro arquivo local (sem require("./_lib") etc.).
// A chave da IA é lida apenas aqui, via process.env.ANTHROPIC_API_KEY.

const API_URL = "https://api.anthropic.com/v1/messages";
const MODELO_PADRAO = "claude-sonnet-4-5";
const MAX_TOKENS = 1000;
const TENTATIVAS = 2;

const NIVEIS = ["Fácil", "Médio", "Médio/Alto", "Alto"];
const BANCAS = ["Cebraspe", "FGV", "FCC", "Cesgranrio"];
const ESFERAS = ["Federal", "Estadual", "Municipal"];
const LETRAS_ME = ["A", "B", "C", "D", "E"];
const LETRAS_CE = ["C", "E"];

const ESTILO_BANCA = {
  Cebraspe: "assertivas técnicas e precisas; exploram exceções, palavras absolutas e detalhes da letra da lei",
  FGV: "enunciados com casos práticos/situações-problema e alternativas longas e parecidas entre si",
  FCC: "cobrança direta da letra da lei e de conceitos, com alternativas de redação semelhante",
  Cesgranrio: "questões objetivas e contextualizadas, com foco em aplicação prática do conceito",
};

function hojeBR() {
  return new Date().toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" });
}

function lerCorpo(req) {
  let corpo = req.body;
  if (typeof corpo === "string") {
    try {
      corpo = JSON.parse(corpo);
    } catch (e) {
      throw new Error("O corpo da requisição não é um JSON válido.");
    }
  }
  if (!corpo || typeof corpo !== "object") {
    throw new Error("Corpo da requisição vazio. Envie disciplina, assunto, nível, formato, banca e esfera.");
  }
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
  const trecho = texto.slice(inicio, fim + 1);
  try {
    return JSON.parse(trecho);
  } catch (e) {
    throw new Error("O JSON devolvido pela IA está malformado: " + e.message);
  }
}

function montarPrompts(p) {
  const ce = p.formato === "CE";
  const sistema = [
    "Você é elaborador(a) sênior de questões para concursos de Auditor Fiscal (Receita Federal, Fiscos Estaduais e Municipais).",
    "Data de hoje: " + hojeBR() + ".",
    "REGRAS OBRIGATÓRIAS:",
    "1) Use APENAS legislação vigente na data de hoje. Nunca trate norma revogada como válida.",
    "2) NUNCA invente artigo, lei, súmula, jurisprudência ou número de norma. Só cite número de artigo se tiver certeza absoluta; na dúvida, cite apenas a lei.",
    "3) Reforma Tributária: EC 132/2023 e LC 214/2025 estão vigentes, com transição de 2026 a 2033 (2026: CBS 0,9% e IBS 0,1% em fase de teste; PIS/Cofins extintos e CBS plena a partir de 2027; ICMS e ISS reduzidos gradualmente de 2029 a 2032 e extintos em 2033). ICMS, ISS, IPI, PIS e Cofins continuam válidos no período em que ainda vigoram. Se a questão tocar em ponto de transição, de alteração recente ou de legislação local (cada Estado/Município tem lei própria), preencha o campo \"aviso\"; caso contrário, deixe \"aviso\" como \"\".",
    "4) Exatamente UMA resposta correta. Distratores plausíveis, cada um com erro identificável.",
    "5) Origem: escreva sempre \"Questão autoral (estilo " + p.banca + ")\". Não atribua a questão a uma prova real.",
    "6) SEJA EXTREMAMENTE CONCISO. Limites: enunciado até 60 palavras; cada alternativa até 25 palavras; cada explicação até 20 palavras; pegadinha até 15 palavras; memorizar até 15 palavras.",
    "7) Responda SOMENTE com o objeto JSON, sem markdown, sem texto antes ou depois.",
  ].join("\n");

  const formatoJSON = ce
    ? '{"enunciado":"assertiva para julgar como Certo ou Errado","gabarito":"C ou E","explicacoes":{"C":"por que estaria certo/está certo","E":"por que estaria errado/está errado"},"pegadinha":"...","memorizar":"...","aviso":"","origem":"Questão autoral (estilo ' + p.banca + ')"}'
    : '{"enunciado":"...","alternativas":{"A":"...","B":"...","C":"...","D":"...","E":"..."},"gabarito":"letra de A a E","explicacoes":{"A":"...","B":"...","C":"...","D":"...","E":"..."},"pegadinha":"...","memorizar":"...","aviso":"","origem":"Questão autoral (estilo ' + p.banca + ')"}';

  const linhas = [
    "Crie 1 questão inédita.",
    "Disciplina: " + p.disciplina,
    "Assunto-alvo (obrigatório, não fuja dele): " + p.assunto,
    "Esfera do concurso: " + p.esfera,
    "Nível de dificuldade: " + p.nivel,
    "Banca de referência: " + p.banca + " — " + (ESTILO_BANCA[p.banca] || ""),
    "Formato: " + (ce ? "Certo/Errado (uma assertiva para julgar)" : "Múltipla escolha com 5 alternativas (A a E)"),
  ];
  if (p.evitar.length) {
    linhas.push("Não repita estas questões já feitas: " + p.evitar.map((t) => "\"" + t + "\"").join("; "));
  }
  linhas.push("Formato EXATO da resposta (JSON):");
  linhas.push(formatoJSON);

  return { sistema, usuario: linhas.join("\n") };
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
    let dica = "";
    if (resp.status === 401) dica = " (chave ANTHROPIC_API_KEY inválida — confira na Vercel em Settings → Environment Variables)";
    else if (resp.status === 404) dica = " (modelo '" + modelo + "' não encontrado — defina ANTHROPIC_MODEL na Vercel com um modelo disponível)";
    else if (resp.status === 429) dica = " (limite de uso atingido — aguarde alguns segundos)";
    else if (resp.status === 400 && /credit/i.test(detalhe)) dica = " (sem crédito na conta da Anthropic)";
    else if (resp.status === 529) dica = " (API da Anthropic sobrecarregada — tente de novo)";
    const err = new Error("API da Anthropic respondeu " + resp.status + ": " + detalhe + dica);
    err.fatal = [400, 401, 403, 404].includes(resp.status);
    throw err;
  }
  if (!data) throw new Error("A API da Anthropic devolveu uma resposta que não é JSON.");

  if (data.stop_reason === "max_tokens") {
    throw new Error("Resposta cortada: a IA atingiu o limite de " + MAX_TOKENS + " tokens antes de terminar a questão.");
  }

  const texto = (data.content || [])
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("");
  if (!texto.trim()) throw new Error("A IA devolveu uma resposta vazia.");
  return texto;
}

function validarQuestao(q, p) {
  const ce = p.formato === "CE";
  if (!q || typeof q !== "object") throw new Error("A questão gerada não é um objeto.");
  if (!q.enunciado || String(q.enunciado).trim().length < 10) throw new Error("A questão gerada veio sem enunciado.");

  const letras = ce ? LETRAS_CE : LETRAS_ME;
  let alternativas;
  if (ce) {
    alternativas = { C: "Certo", E: "Errado" };
  } else {
    if (!q.alternativas || typeof q.alternativas !== "object") throw new Error("A questão gerada veio sem alternativas.");
    alternativas = {};
    for (const l of letras) {
      if (!q.alternativas[l] || !String(q.alternativas[l]).trim()) {
        throw new Error("A questão gerada está sem a alternativa " + l + ".");
      }
      alternativas[l] = limpar(q.alternativas[l], 600);
    }
  }

  let gab = String(q.gabarito || "").trim().toUpperCase();
  if (ce) {
    if (gab.startsWith("CERT")) gab = "C";
    if (gab.startsWith("ERR")) gab = "E";
  }
  gab = gab.charAt(0);
  if (!letras.includes(gab)) throw new Error("Gabarito inválido na questão gerada: '" + q.gabarito + "'.");

  const exp = q.explicacoes || {};
  const explicacoes = {};
  for (const l of letras) {
    explicacoes[l] = limpar(exp[l] || (l === gab ? "Alternativa correta." : "Alternativa incorreta."), 400);
  }

  return {
    disciplina: p.disciplina,
    assunto: p.assunto,
    nivel: p.nivel,
    banca: p.banca,
    esfera: p.esfera,
    formato: p.formato,
    origem: limpar(q.origem, 120) || "Questão autoral (estilo " + p.banca + ")",
    aviso: limpar(q.aviso, 300),
    enunciado: limpar(q.enunciado, 1200),
    alternativas,
    gabarito: gab,
    explicacoes,
    pegadinha: limpar(q.pegadinha, 300),
    memorizar: limpar(q.memorizar, 300),
  };
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

  let p;
  try {
    const c = lerCorpo(req);
    p = {
      disciplina: limpar(c.disciplina, 120),
      assunto: limpar(c.assunto, 200),
      nivel: NIVEIS.includes(c.nivel) ? c.nivel : "Médio",
      formato: c.formato === "CE" ? "CE" : "ME",
      banca: BANCAS.includes(c.banca) ? c.banca : "FGV",
      esfera: ESFERAS.includes(c.esfera) ? c.esfera : "Federal",
      evitar: Array.isArray(c.evitar) ? c.evitar.slice(-6).map((t) => limpar(t, 90)).filter(Boolean) : [],
    };
    if (!p.disciplina) throw new Error("Campo 'disciplina' ausente na requisição.");
    if (!p.assunto) throw new Error("Campo 'assunto' ausente na requisição.");
  } catch (e) {
    res.statusCode = 400;
    return res.end(JSON.stringify({ erro: e.message }));
  }

  const { sistema, usuario } = montarPrompts(p);
  let ultimoErro = null;
  for (let tentativa = 1; tentativa <= TENTATIVAS; tentativa++) {
    try {
      const texto = await chamarClaude(chave, modelo, sistema, usuario);
      const bruto = extrairJSON(texto);
      const questao = validarQuestao(bruto, p);
      res.statusCode = 200;
      return res.end(JSON.stringify({ questao }));
    } catch (e) {
      ultimoErro = e;
      if (e.fatal) break;
    }
  }

  res.statusCode = 502;
  return res.end(JSON.stringify({
    erro: "Não foi possível gerar a questão (" + p.disciplina + " — " + p.assunto + "). Motivo: " + ultimoErro.message,
  }));
}

module.exports = handler;
module.exports.config = { maxDuration: 60 };
