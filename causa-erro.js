module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ erro: "Método não permitido. Use POST." });
    return;
  }

  var apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    res.status(500).json({ erro: "ANTHROPIC_API_KEY não configurada nas variáveis de ambiente da Vercel." });
    return;
  }

  var body = req.body;
  if (typeof body === "string") {
    try { body = JSON.parse(body); } catch (e) { body = {}; }
  }
  body = body || {};

  var disciplina = body.disciplina || "";
  var assunto = body.assunto || "";
  var enunciado = body.enunciado || "";
  var alternativaMarcada = body.alternativaMarcada || "";
  var gabarito = body.gabarito || "";

  var systemPrompt = [
    "Você analisa erros de candidatos em questões de concurso público (Auditor Fiscal Federal).",
    "Categorias possíveis de causa do erro: falta de conhecimento, confusão entre conceitos, desatenção, desconhecimento de exceção/legislação, leitura apressada, confusão entre alternativas.",
    "Escolha a categoria mais provável para este caso específico e explique em uma frase curta, máximo 25 palavras.",
    "Responda SOMENTE com um objeto JSON válido, sem markdown, sem texto antes ou depois, no formato:",
    '{"categoria":"...","causa":"...(máximo 25 palavras, frase completa explicando a causa provável)"}'
  ].join("\n");

  var userPrompt = "Disciplina: " + disciplina + "\nAssunto: " + assunto + "\nEnunciado: " + enunciado +
    "\nAlternativa marcada pelo candidato: " + alternativaMarcada + "\nGabarito correto: " + gabarito;

  try {
    var apiResp = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-sonnet-5",
        max_tokens: 1000,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }]
      })
    });

    var data = await apiResp.json();

    if (!apiResp.ok) {
      res.status(502).json({ erro: "Erro na API da Anthropic: " + (data && data.error && data.error.message ? data.error.message : apiResp.status) });
      return;
    }

    if (data.stop_reason === "max_tokens") {
      res.status(502).json({ erro: "Resposta cortada pelo limite de tokens. Tente novamente." });
      return;
    }

    var textoResposta = "";
    if (Array.isArray(data.content)) {
      for (var i = 0; i < data.content.length; i++) {
        if (data.content[i].type === "text") textoResposta += data.content[i].text;
      }
    }

    var inicio = textoResposta.indexOf("{");
    var fim = textoResposta.lastIndexOf("}");
    if (inicio === -1 || fim === -1 || fim < inicio) {
      res.status(502).json({ erro: "Não foi possível localizar um JSON na resposta do modelo." });
      return;
    }

    var jsonBruto = textoResposta.substring(inicio, fim + 1);
    var resultado;
    try {
      resultado = JSON.parse(jsonBruto);
    } catch (e) {
      res.status(502).json({ erro: "JSON retornado pelo modelo é inválido: " + e.message });
      return;
    }

    res.status(200).json(resultado);
  } catch (err) {
    res.status(500).json({ erro: "Falha ao apurar causa do erro: " + err.message });
  }
};
