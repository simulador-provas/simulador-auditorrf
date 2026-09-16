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

  var disciplina = body.disciplina || "Direito Tributário";
  var nivel = body.nivel || "Médio";
  var formato = body.formato === "certo_errado" ? "certo_errado" : "multipla_escolha";

  var instrucoesFormato = formato === "certo_errado"
    ? 'O campo "alternativas" deve ter EXATAMENTE 2 itens, com "letra" igual a "C" (Certo) e "E" (Errado), no estilo Cebraspe (uma afirmação a ser julgada).'
    : 'O campo "alternativas" deve ter EXATAMENTE 5 itens, com "letra" de "A" a "E".';

  var systemPrompt = [
    "Você é um examinador especializado em elaborar questões para o concurso de Auditor Fiscal Federal, banca no estilo FGV, CESPE/CEBRASPE ou FCC.",
    "Regras obrigatórias, sem exceção:",
    "- Use apenas legislação vigente na data de hoje; nunca trate norma revogada como válida.",
    "- Nunca invente dispositivo legal, artigo, número de lei ou jurisprudência. Se não tiver certeza absoluta de um número de artigo ou lei específico, descreva a regra em termos gerais sem citar o número.",
    "- A questão deve ter exatamente uma alternativa correta, com as demais plausíveis e com erro identificável.",
    '- Se a questão não for baseada em uma prova real que você conhece com certeza, marque "origem" como "Questão autoral". Só cite banca/ano/concurso real se tiver certeza.',
    instrucoesFormato,
    "Responda SOMENTE com um objeto JSON válido, sem markdown, sem texto antes ou depois, seguindo exatamente este formato:",
    '{"disciplina":"...","assunto":"...","nivel":"...","origem":"...","enunciado":"...(máximo 60 palavras)","alternativas":[{"letra":"A","texto":"...","explicacao":"...(máximo 20 palavras)"}],"gabarito":"A","pegadinha":"...(máximo 15 palavras)","memorizacao":"...(máximo 15 palavras)"}',
    "Seja extremamente conciso em todos os campos de texto para caber na resposta. Não ultrapasse os limites de palavras informados."
  ].join("\n");

  var userPrompt = "Gere uma questão de " + disciplina + " no nível " + nivel + " para o concurso de Auditor Fiscal Federal.";

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
    var questao;
    try {
      questao = JSON.parse(jsonBruto);
    } catch (e) {
      res.status(502).json({ erro: "JSON retornado pelo modelo é inválido: " + e.message });
      return;
    }

    if (!questao.enunciado || !questao.alternativas || !questao.gabarito) {
      res.status(502).json({ erro: "Resposta do modelo veio incompleta (faltam campos obrigatórios)." });
      return;
    }

    questao.formato = formato;
    res.status(200).json(questao);
  } catch (err) {
    res.status(500).json({ erro: "Falha ao gerar questão: " + err.message });
  }
};
