(function () {
  "use strict";

  // ---------- Dados fixos do concurso ----------

  var DISCIPLINAS_PESOS = [
    { nome: "Direito Tributário", peso: 18 },
    { nome: "Contabilidade Geral e Avançada", peso: 15 },
    { nome: "Legislação Tributária", peso: 15 },
    { nome: "Auditoria (Fiscal e Governamental)", peso: 10 },
    { nome: "Tecnologia da Informação e Análise de Dados", peso: 10 },
    { nome: "Língua Portuguesa", peso: 8 },
    { nome: "Administração Financeira e Orçamentária (AFO)", peso: 6 },
    { nome: "Direito Administrativo", peso: 6 },
    { nome: "Direito Constitucional", peso: 6 },
    { nome: "Raciocínio Lógico-Matemático e Estatística", peso: 6 }
  ];

  var NIVEIS = ["Fácil", "Médio", "Médio/Alto", "Alto"];

  var LOADING_MSGS = [
    "Lavrando o auto de questão…",
    "Consultando a legislação vigente…",
    "Conferindo o dispositivo legal…",
    "Protocolando o enunciado…"
  ];

  // ---------- Estado ----------

  var state = {
    config: { qtd: 25, disciplina: "Misto", formato: "multipla_escolha" },
    indiceAtual: 0,
    nivelIdx: 1, // começa em Médio
    historico: [], // { disciplina, assunto, nivel, acertou, formato }
    questaoAtual: null,
    alternativaSelecionada: null,
    respondida: false
  };

  // ---------- Utilidades ----------

  function $(id) { return document.getElementById(id); }

  function sortearDisciplina() {
    var total = DISCIPLINAS_PESOS.reduce(function (s, d) { return s + d.peso; }, 0);
    var r = Math.random() * total;
    var acc = 0;
    for (var i = 0; i < DISCIPLINAS_PESOS.length; i++) {
      acc += DISCIPLINAS_PESOS[i].peso;
      if (r <= acc) return DISCIPLINAS_PESOS[i].nome;
    }
    return DISCIPLINAS_PESOS[0].nome;
  }

  function gerarNumeroProcesso() {
    var ano = new Date().getFullYear();
    var n = Math.floor(100000 + Math.random() * 899999);
    return "PROCESSO Nº " + ano + ".AF-" + n;
  }

  function calcularAcumulado() {
    if (state.historico.length === 0) return 0;
    var acertos = state.historico.filter(function (h) { return h.acertou; }).length;
    return (acertos / state.historico.length) * 100;
  }

  function ajustarNivel() {
    // A partir da 3ª questão respondida, recalcula o nível.
    if (state.historico.length < 3) return;
    var pct = calcularAcumulado();
    if (pct >= 80) {
      state.nivelIdx = Math.min(state.nivelIdx + 1, NIVEIS.length - 1);
    } else if (pct < 60) {
      state.nivelIdx = Math.max(state.nivelIdx - 1, 0);
    }
    // 60–79% mantém o nível atual.
  }

  async function chamarApi(endpoint, payload) {
    var resp = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    var data;
    try {
      data = await resp.json();
    } catch (e) {
      throw new Error("O servidor respondeu em um formato inesperado.");
    }
    if (!resp.ok) {
      throw new Error((data && data.erro) || "Falha ao comunicar com o servidor (" + resp.status + ").");
    }
    return data;
  }

  // ---------- Navegação entre telas ----------

  function mostrarTela(id) {
    ["screen-setup", "screen-question", "screen-report"].forEach(function (s) {
      $(s).hidden = (s !== id);
    });
  }

  // ---------- Tela 1: Configuração ----------

  $("btnIniciar").addEventListener("click", function () {
    var qtd = parseInt($("qtdQuestoes").value, 10);
    if (!qtd || qtd < 1) qtd = 25;
    state.config.qtd = qtd;
    state.config.disciplina = $("disciplinaSelect").value;
    state.indiceAtual = 0;
    state.nivelIdx = 1;
    state.historico = [];
    $("protoNumber").textContent = gerarNumeroProcesso();
    mostrarTela("screen-question");
    carregarQuestao();
  });

  document.querySelectorAll(".toggle-option").forEach(function (btn) {
    btn.addEventListener("click", function () {
      document.querySelectorAll(".toggle-option").forEach(function (b) { b.classList.remove("is-active"); });
      btn.classList.add("is-active");
      state.config.formato = btn.getAttribute("data-formato");
    });
  });

  // ---------- Tela 2: Questão ----------

  async function carregarQuestao() {
    state.questaoAtual = null;
    state.alternativaSelecionada = null;
    state.respondida = false;

    $("questionContent").hidden = true;
    $("questionError").hidden = true;
    $("questionLoading").hidden = false;
    $("loadingText").textContent = LOADING_MSGS[Math.floor(Math.random() * LOADING_MSGS.length)];
    $("feedbackPanel").hidden = true;
    $("btnResponder").disabled = true;
    $("btnResponder").hidden = false;
    $("btnResponder").textContent = "Confirmar resposta";

    var pct = (state.indiceAtual / state.config.qtd) * 100;
    $("progressFill").style.width = pct + "%";
    $("questionIndex").textContent = (state.indiceAtual + 1) + " / " + state.config.qtd;

    var disciplina = state.config.disciplina === "Misto" ? sortearDisciplina() : state.config.disciplina;

    try {
      var data = await chamarApi("/api/gerar-questao", {
        disciplina: disciplina,
        nivel: NIVEIS[state.nivelIdx],
        formato: state.config.formato
      });
      state.questaoAtual = data;
      renderQuestao(data);
    } catch (err) {
      $("questionLoading").hidden = true;
      $("questionError").hidden = false;
      $("questionErrorMsg").textContent = err.message;
    }
  }

  function renderQuestao(q) {
    $("questionLoading").hidden = true;
    $("questionContent").hidden = false;

    $("metaDisciplina").textContent = q.disciplina || "—";
    $("metaAssunto").textContent = q.assunto || "—";
    $("metaNivel").textContent = "Nível: " + (q.nivel || NIVEIS[state.nivelIdx]);
    $("metaOrigem").textContent = q.origem || "Questão autoral";

    $("questionEnunciado").textContent = q.enunciado || "";

    var container = $("alternativasContainer");
    container.innerHTML = "";

    var alternativas = q.alternativas || [];
    if (q.formato === "certo_errado" || (!alternativas.length && state.config.formato === "certo_errado")) {
      alternativas = [
        { letra: "C", texto: "Certo" },
        { letra: "E", texto: "Errado" }
      ];
    }

    alternativas.forEach(function (alt) {
      var el = document.createElement("button");
      el.type = "button";
      el.className = "alternativa";
      el.setAttribute("data-letra", alt.letra);
      el.innerHTML = '<span class="alternativa__letra">' + alt.letra + "</span><span>" + alt.texto + "</span>";
      el.addEventListener("click", function () {
        if (state.respondida) return;
        document.querySelectorAll(".alternativa").forEach(function (a) { a.classList.remove("is-selected"); });
        el.classList.add("is-selected");
        state.alternativaSelecionada = alt.letra;
        $("btnResponder").disabled = false;
      });
      container.appendChild(el);
    });
  }

  $("btnResponder").addEventListener("click", function () {
    if (state.respondida || !state.alternativaSelecionada) return;
    responder();
  });

  async function responder() {
    state.respondida = true;
    var q = state.questaoAtual;
    var gabarito = q.gabarito;
    var acertou = state.alternativaSelecionada === gabarito;

    document.querySelectorAll(".alternativa").forEach(function (el) {
      el.classList.add("is-disabled");
      var letra = el.getAttribute("data-letra");
      if (letra === gabarito) el.classList.add("is-correct");
      else if (letra === state.alternativaSelecionada) el.classList.add("is-incorrect");
    });

    state.historico.push({
      disciplina: q.disciplina,
      assunto: q.assunto,
      nivel: q.nivel || NIVEIS[state.nivelIdx],
      acertou: acertou
    });

    $("btnResponder").hidden = true;
    $("feedbackPanel").hidden = false;

    var verdictEl = $("feedbackVerdict");
    verdictEl.textContent = acertou ? "Gabarito confirmado: você acertou." : "Divergência apurada: você errou. Gabarito: " + gabarito + ".";
    verdictEl.classList.toggle("is-erro", !acertou);

    var listaEl = $("feedbackAlternativas");
    listaEl.innerHTML = "";
    (q.alternativas || []).forEach(function (alt) {
      var li = document.createElement("li");
      li.innerHTML = "<strong>" + alt.letra + ".</strong> " + (alt.explicacao || "");
      listaEl.appendChild(li);
    });

    $("feedbackPegadinha").textContent = q.pegadinha || "—";
    $("feedbackMemorizacao").textContent = q.memorizacao || q["memorização"] || "—";

    var causaWrap = $("feedbackCausaWrap");
    if (!acertou) {
      causaWrap.hidden = false;
      $("feedbackCausa").textContent = "Apurando causa provável…";
      try {
        var causaData = await chamarApi("/api/causa-erro", {
          disciplina: q.disciplina,
          assunto: q.assunto,
          enunciado: q.enunciado,
          alternativaMarcada: state.alternativaSelecionada,
          gabarito: gabarito
        });
        $("feedbackCausa").textContent = causaData.causa || "Não foi possível apurar a causa.";
      } catch (err) {
        $("feedbackCausa").textContent = "Não foi possível apurar a causa (" + err.message + ").";
      }
    } else {
      causaWrap.hidden = true;
    }

    ajustarNivel();
  }

  $("btnProxima").addEventListener("click", function () {
    state.indiceAtual++;
    if (state.indiceAtual >= state.config.qtd) {
      gerarRelatorio();
      mostrarTela("screen-report");
    } else {
      carregarQuestao();
    }
  });

  $("btnTentarNovamente").addEventListener("click", function () {
    carregarQuestao();
  });

  // ---------- Tela 3: Relatório ----------

  function gerarRelatorio() {
    var h = state.historico;
    var total = h.length;
    var acertos = h.filter(function (x) { return x.acertou; }).length;
    var pct = total ? Math.round((acertos / total) * 100) : 0;

    $("reportScorePct").textContent = pct + "%";
    $("reportScoreFrac").textContent = acertos + "/" + total + " acertos";

    // Desempenho por disciplina
    var porDisciplina = {};
    h.forEach(function (x) {
      if (!porDisciplina[x.disciplina]) porDisciplina[x.disciplina] = { acertos: 0, total: 0 };
      porDisciplina[x.disciplina].total++;
      if (x.acertou) porDisciplina[x.disciplina].acertos++;
    });

    var disciplinasOrdenadas = Object.keys(porDisciplina).sort(function (a, b) {
      var pa = porDisciplina[a].acertos / porDisciplina[a].total;
      var pb = porDisciplina[b].acertos / porDisciplina[b].total;
      return pb - pa;
    });

    var ledgerEl = $("reportPorDisciplina");
    ledgerEl.innerHTML = "";
    disciplinasOrdenadas.forEach(function (d) {
      var info = porDisciplina[d];
      var p = Math.round((info.acertos / info.total) * 100);
      ledgerEl.appendChild(criarLinhaLedger(d, p, info.acertos + "/" + info.total));
    });

    // Mapa de erros por assunto
    var porAssunto = {};
    h.forEach(function (x) {
      if (x.acertou) return;
      var key = x.assunto || "Assunto não identificado";
      porAssunto[key] = (porAssunto[key] || 0) + 1;
    });
    var assuntosOrdenados = Object.keys(porAssunto).sort(function (a, b) { return porAssunto[b] - porAssunto[a]; });
    var maxErros = assuntosOrdenados.length ? porAssunto[assuntosOrdenados[0]] : 1;

    var mapaEl = $("reportMapaErros");
    mapaEl.innerHTML = "";
    if (assuntosOrdenados.length === 0) {
      mapaEl.innerHTML = "<p style='color:var(--ink-soft);font-size:14px;'>Nenhum erro registrado — desempenho impecável.</p>";
    } else {
      assuntosOrdenados.forEach(function (a) {
        var n = porAssunto[a];
        var p = Math.round((n / maxErros) * 100);
        mapaEl.appendChild(criarLinhaLedger(a, p, n + " erro(s)"));
      });
    }

    // Pontos fortes / fracos
    var fortesEl = $("reportPontosFortes");
    var fracosEl = $("reportPontosFracos");
    fortesEl.innerHTML = "";
    fracosEl.innerHTML = "";

    var comDados = disciplinasOrdenadas.filter(function (d) { return porDisciplina[d].total >= 1; });
    comDados.slice(0, 3).forEach(function (d) {
      var info = porDisciplina[d];
      var p = Math.round((info.acertos / info.total) * 100);
      if (p >= 60) {
        var li = document.createElement("li");
        li.textContent = d + " (" + p + "% de acerto)";
        fortesEl.appendChild(li);
      }
    });
    if (!fortesEl.children.length) {
      var liVazio = document.createElement("li");
      liVazio.textContent = "Ainda não há disciplinas com desempenho consolidado acima de 60%.";
      fortesEl.appendChild(liVazio);
    }

    comDados.slice().reverse().slice(0, 3).forEach(function (d) {
      var info = porDisciplina[d];
      var p = Math.round((info.acertos / info.total) * 100);
      if (p < 60) {
        var li = document.createElement("li");
        li.textContent = d + " (" + p + "% de acerto)";
        fracosEl.appendChild(li);
      }
    });
    if (!fracosEl.children.length) {
      var liVazio2 = document.createElement("li");
      liVazio2.textContent = "Nenhuma disciplina abaixo de 60% — manter o ritmo de revisão.";
      fracosEl.appendChild(liVazio2);
    }

    // Diagnóstico textual
    var piorDisciplina = disciplinasOrdenadas.length ? disciplinasOrdenadas[disciplinasOrdenadas.length - 1] : null;
    var melhorDisciplina = disciplinasOrdenadas.length ? disciplinasOrdenadas[0] : null;
    var diagnostico = "Você respondeu " + total + " questões com " + pct + "% de aproveitamento geral, encerrando no nível " + NIVEIS[state.nivelIdx] + ". ";
    if (melhorDisciplina) {
      diagnostico += "Seu melhor desempenho foi em " + melhorDisciplina + ". ";
    }
    if (piorDisciplina && piorDisciplina !== melhorDisciplina) {
      diagnostico += piorDisciplina + " concentra a maior necessidade de revisão. ";
    }
    if (assuntosOrdenados.length) {
      diagnostico += "O assunto com mais incidência de erro foi " + assuntosOrdenados[0] + ".";
    }
    $("reportDiagnostico").textContent = diagnostico;

    // Plano de revisão
    $("planoImediato").textContent = assuntosOrdenados.length
      ? "Refazer questões sobre " + assuntosOrdenados.slice(0, 2).join(" e ") + " ainda hoje, revisando a explicação de cada alternativa errada."
      : "Revisar rapidamente os pontos de memorização das questões respondidas hoje.";

    $("planoProximosDias").textContent = piorDisciplina
      ? "Nos próximos 3 a 5 dias, dedicar um bloco de estudo teórico a " + piorDisciplina + " e refazer um simulado só dessa disciplina."
      : "Nos próximos dias, intercalar disciplinas em simulados mistos para consolidar o nível atual.";

    $("planoManutencao").textContent = melhorDisciplina
      ? "Manter " + melhorDisciplina + " com revisões espaçadas quinzenais para não perder o desempenho já consolidado."
      : "Agendar simulados semanais para manter o conteúdo ativo até a data da prova.";
  }

  function criarLinhaLedger(label, pct, valorTexto) {
    var row = document.createElement("div");
    row.className = "ledger__row";
    row.innerHTML =
      '<span class="ledger__label">' + label + '</span>' +
      '<span class="ledger__track"><span class="ledger__fill" style="width:' + pct + '%"></span></span>' +
      '<span class="ledger__value">' + valorTexto + '</span>';
    return row;
  }

  $("btnNovoSimulado").addEventListener("click", function () {
    mostrarTela("screen-setup");
  });

})();
