/* =========================================================
   Simulador Auditor Fiscal — front-end (HTML/CSS/JS puro)
   - Sorteia disciplina (por peso) e assunto (pela ementa) aqui no navegador
   - Chama /api/gerar-questao e /api/causa-erro (funções serverless)
   - Dificuldade adaptativa, relatório final e cobertura da ementa
   ========================================================= */
(function () {
  "use strict";

  /* ---------------- DISCIPLINAS E PESOS (modo Misto) ---------------- */
  const DISCIPLINAS = [
    { nome: "Direito Tributário", peso: 18 },
    { nome: "Contabilidade Geral e Avançada", peso: 15 },
    { nome: "Legislação Tributária", peso: 15 },
    { nome: "Auditoria", peso: 10 },
    { nome: "Tecnologia da Informação e Análise de Dados", peso: 10 },
    { nome: "Língua Portuguesa", peso: 8 },
    { nome: "Administração Financeira e Orçamentária (AFO)", peso: 6 },
    { nome: "Direito Administrativo", peso: 6 },
    { nome: "Direito Constitucional", peso: 6 },
    { nome: "Raciocínio Lógico-Matemático e Estatística", peso: 6 },
  ];
  // Complementares: aparecem com menor frequência (peso 3 cada) se o aluno marcar a opção.
  const COMPLEMENTARES = [
    { nome: "Direito Civil e Empresarial", peso: 3 },
    { nome: "Economia e Finanças Públicas", peso: 3 },
    { nome: "Comércio Internacional e Legislação Aduaneira", peso: 3 },
  ];

  /* ---------------- EMENTA (SYLLABUS) ---------------- */
  const SYLLABUS = {
    "Direito Tributário": [
      "Sistema Tributário Nacional na CF/88",
      "Competência tributária e capacidade tributária ativa",
      "Princípios constitucionais tributários (limitações ao poder de tributar)",
      "Imunidades tributárias",
      "Espécies tributárias: impostos, taxas e contribuição de melhoria",
      "Empréstimos compulsórios e contribuições especiais",
      "Repartição constitucional das receitas tributárias",
      "Legislação tributária: vigência, aplicação, interpretação e integração (CTN)",
      "Obrigação tributária principal e acessória; fato gerador",
      "Sujeição ativa e passiva; solidariedade, capacidade e domicílio tributário",
      "Responsabilidade tributária: sucessores, terceiros e infrações",
      "Crédito tributário e lançamento (modalidades e revisão)",
      "Suspensão da exigibilidade do crédito tributário",
      "Extinção do crédito tributário: pagamento, compensação, decadência e prescrição",
      "Exclusão do crédito tributário: isenção e anistia",
      "Garantias e privilégios do crédito tributário",
      "Administração tributária: fiscalização, dívida ativa e certidões",
      "Reforma Tributária (EC 132/2023): IBS, CBS e Imposto Seletivo",
      "Simples Nacional (LC 123/2006): aspectos tributários",
      "Processo administrativo fiscal (Decreto 70.235/1972)",
    ],
    "Contabilidade Geral e Avançada": [
      "Estrutura Conceitual para Relatório Financeiro (CPC 00 R2)",
      "Patrimônio: ativo, passivo, patrimônio líquido e equação patrimonial",
      "Atos e fatos contábeis; método das partidas dobradas",
      "Plano de contas, lançamentos e balancete de verificação",
      "Operações com mercadorias e apuração do CMV",
      "Tributos recuperáveis e não recuperáveis nas compras e vendas",
      "Estoques (CPC 16)",
      "Ativo imobilizado e depreciação (CPC 27)",
      "Ativo intangível e amortização (CPC 04)",
      "Redução ao valor recuperável de ativos (CPC 01)",
      "Provisões, passivos e ativos contingentes (CPC 25)",
      "Balanço Patrimonial (Lei 6.404/1976 e CPC 26)",
      "DRE, DRA e DMPL",
      "Demonstração dos Fluxos de Caixa (CPC 03)",
      "Demonstração do Valor Adicionado (CPC 09)",
      "Investimentos e método da equivalência patrimonial (CPC 18)",
      "Consolidação das demonstrações contábeis (CPC 36)",
      "Combinação de negócios e goodwill (CPC 15)",
      "Arrendamentos (CPC 06 R2)",
      "Instrumentos financeiros e ajuste a valor presente (CPC 48 e CPC 12)",
      "Receita de contrato com cliente (CPC 47)",
      "Tributos sobre o lucro e tributos diferidos (CPC 32)",
      "Análise das demonstrações: liquidez, endividamento e rentabilidade",
    ],
    "Legislação Tributária": {
      Federal: [
        "IRPF: fato gerador, rendimentos tributáveis, isentos e deduções",
        "IRPJ: lucro real, presumido e arbitrado",
        "CSLL",
        "Imposto de Renda Retido na Fonte",
        "IPI: fato gerador, contribuintes, seletividade e não cumulatividade",
        "PIS/Pasep e Cofins: regimes cumulativo e não cumulativo",
        "Contribuições previdenciárias (Lei 8.212/1991)",
        "Imposto de Importação e Imposto de Exportação",
        "IOF",
        "ITR",
        "CBS (LC 214/2025) e cronograma de transição",
        "Imposto Seletivo (LC 214/2025)",
        "Noções de Regulamento Aduaneiro (Decreto 6.759/2009)",
        "Crimes contra a ordem tributária (Lei 8.137/1990)",
        "Processo administrativo fiscal federal e CARF",
        "Simples Nacional: tributos abrangidos e vedações",
      ],
      Estadual: [
        "ICMS na CF/88 (art. 155, II e §2º)",
        "LC 87/1996 (Lei Kandir): fato gerador e incidência do ICMS",
        "ICMS: contribuintes e responsáveis",
        "ICMS: base de cálculo e alíquotas internas e interestaduais",
        "Não cumulatividade e aproveitamento de créditos de ICMS",
        "Substituição tributária do ICMS",
        "Diferencial de alíquota (DIFAL) e EC 87/2015",
        "Convênios ICMS e benefícios fiscais (LC 24/1975 e LC 160/2017)",
        "ICMS no comércio exterior",
        "Obrigações acessórias: NF-e, EFD e SPED",
        "IPVA",
        "ITCMD (inclusive alterações da EC 132/2023)",
        "IBS: competência compartilhada e Comitê Gestor (LC 214/2025)",
        "Transição do ICMS para o IBS (2029–2033)",
        "Simples Nacional e ICMS",
        "Infrações e penalidades na legislação estadual (noções gerais)",
      ],
      Municipal: [
        "ISS na CF/88 (art. 156, III)",
        "LC 116/2003: fato gerador e lista de serviços",
        "ISS: local da prestação do serviço e exceções",
        "ISS: contribuintes, responsáveis e retenção na fonte",
        "ISS: base de cálculo e alíquotas mínima e máxima",
        "ISS de sociedades de profissionais e trabalho pessoal",
        "IPTU: fato gerador, base de cálculo e progressividade",
        "ITBI: fato gerador, base de cálculo e imunidades",
        "Taxas municipais e contribuição de iluminação pública (COSIP)",
        "Contribuição de melhoria municipal",
        "IBS municipal e Comitê Gestor (LC 214/2025)",
        "Transição do ISS para o IBS (2029–2033)",
        "NFS-e padrão nacional e obrigações acessórias",
        "Simples Nacional e ISS",
        "Lançamento e cobrança dos tributos municipais",
      ],
    },
    "Auditoria": [
      "Conceitos, objetivos e tipos de auditoria (interna, externa, fiscal e governamental)",
      "Normas de auditoria (NBC TA) e ética profissional",
      "Normas de Auditoria do TCU e NBASP",
      "Independência, ceticismo e julgamento profissional",
      "Planejamento da auditoria",
      "Materialidade e risco de auditoria",
      "Controle interno: COSO e avaliação de controles",
      "Evidência de auditoria: procedimentos, suficiência e adequação",
      "Amostragem em auditoria",
      "Papéis de trabalho e documentação de auditoria",
      "Testes de controle e procedimentos substantivos",
      "Fraude e erro (NBC TA 240)",
      "Eventos subsequentes e continuidade operacional",
      "Relatório do auditor: tipos de opinião (NBC TA 700, 705 e 706)",
      "Principais assuntos de auditoria (NBC TA 701)",
      "Auditoria fiscal: procedimentos de fiscalização tributária",
      "Auditoria operacional e de conformidade no setor público",
      "Auditoria de sistemas e trilhas digitais (SPED)",
    ],
    "Tecnologia da Informação e Análise de Dados": [
      "Banco de dados relacional e modelagem entidade-relacionamento",
      "SQL: consultas, junções e agregações",
      "Data warehouse, OLAP e modelagem dimensional",
      "Processos de ETL e integração de dados",
      "Business Intelligence e visualização de dados",
      "Mineração de dados: classificação, agrupamento e associação",
      "Aprendizado de máquina: conceitos e métricas de avaliação",
      "Estatística aplicada à análise de dados",
      "Big Data: conceitos, Hadoop e Spark",
      "Python para análise de dados (pandas)",
      "Governança e qualidade de dados",
      "LGPD (Lei 13.709/2018)",
      "Segurança da informação: princípios e criptografia",
      "Redes e protocolos (TCP/IP, HTTP/HTTPS)",
      "Computação em nuvem",
      "Governança de TI: COBIT e ITIL",
      "Inteligência artificial e IA generativa: noções",
      "Fontes de dados fiscais: SPED, NF-e e cruzamentos",
    ],
    "Língua Portuguesa": [
      "Compreensão e interpretação de textos",
      "Tipologia e gêneros textuais",
      "Ortografia oficial",
      "Acentuação gráfica",
      "Classes de palavras",
      "Emprego e colocação dos pronomes",
      "Tempos e modos verbais",
      "Concordância nominal e verbal",
      "Regência nominal e verbal",
      "Crase",
      "Pontuação",
      "Coesão e coerência textual",
      "Semântica: sinonímia, antonímia e polissemia",
      "Reescrita de frases e paráfrase",
      "Orações coordenadas e subordinadas",
      "Redação oficial (Manual de Redação da Presidência da República)",
    ],
    "Administração Financeira e Orçamentária (AFO)": [
      "Orçamento público: conceitos e princípios orçamentários",
      "Ciclo orçamentário",
      "PPA, LDO e LOA (CF/88, arts. 165 a 169)",
      "Receita pública: classificação e estágios",
      "Despesa pública: classificação e estágios (empenho, liquidação e pagamento)",
      "Créditos adicionais",
      "Restos a pagar e despesas de exercícios anteriores",
      "Lei 4.320/1964",
      "Lei de Responsabilidade Fiscal (LC 101/2000)",
      "Receita corrente líquida e limites de despesa com pessoal",
      "Dívida ativa e dívida pública",
      "Programação financeira e Conta Única do Tesouro",
      "Suprimento de fundos",
      "Emendas parlamentares impositivas",
      "Regime fiscal sustentável (LC 200/2023)",
    ],
    "Direito Administrativo": [
      "Princípios da Administração Pública",
      "Organização administrativa: Administração direta e indireta",
      "Poderes administrativos",
      "Atos administrativos: requisitos, atributos e extinção",
      "Agentes públicos e regime da Lei 8.112/1990",
      "Licitações (Lei 14.133/2021)",
      "Contratos administrativos (Lei 14.133/2021)",
      "Serviços públicos, concessões e permissões",
      "Responsabilidade civil do Estado",
      "Improbidade administrativa (Lei 8.429/1992, alterada pela Lei 14.230/2021)",
      "Processo administrativo federal (Lei 9.784/1999)",
      "Controle da Administração Pública",
      "Bens públicos",
      "Intervenção do Estado na propriedade",
      "Lei Anticorrupção (Lei 12.846/2013)",
      "Lei de Acesso à Informação (Lei 12.527/2011)",
    ],
    "Direito Constitucional": [
      "Teoria da Constituição e poder constituinte",
      "Princípios fundamentais",
      "Direitos e deveres individuais e coletivos",
      "Remédios constitucionais",
      "Direitos sociais e nacionalidade",
      "Direitos políticos",
      "Organização do Estado: União, Estados, DF e Municípios",
      "Administração Pública na CF/88 (arts. 37 a 41)",
      "Poder Legislativo e processo legislativo",
      "Poder Executivo",
      "Poder Judiciário",
      "Funções essenciais à Justiça",
      "Fiscalização contábil, financeira e orçamentária (arts. 70 a 75)",
      "Controle de constitucionalidade",
      "Ordem econômica e financeira",
      "Finanças públicas na CF/88 (arts. 163 a 169)",
    ],
    "Raciocínio Lógico-Matemático e Estatística": [
      "Proposições e conectivos lógicos",
      "Tabela-verdade, tautologia e contradição",
      "Equivalências lógicas e negação de proposições",
      "Lógica de argumentação",
      "Quantificadores e diagramas lógicos",
      "Sequências e progressões",
      "Razão, proporção e regra de três",
      "Porcentagem",
      "Juros simples e compostos; descontos e taxas equivalentes",
      "Análise combinatória",
      "Probabilidade",
      "Estatística descritiva: média, mediana e moda",
      "Medidas de dispersão",
      "Distribuições de probabilidade (binomial e normal)",
      "Amostragem e inferência estatística",
      "Correlação e regressão linear",
    ],
    "Direito Civil e Empresarial": [
      "Pessoas naturais e jurídicas",
      "Desconsideração da personalidade jurídica",
      "Negócio jurídico: defeitos e invalidade",
      "Prescrição e decadência no Código Civil",
      "Obrigações e contratos em geral",
      "Empresário individual e sociedade limitada unipessoal (SLU)",
      "Sociedades limitadas",
      "Sociedades anônimas (Lei 6.404/1976)",
      "Títulos de crédito",
      "Recuperação judicial e falência (Lei 11.101/2005)",
    ],
    "Economia e Finanças Públicas": [
      "Funções do governo: alocativa, distributiva e estabilizadora",
      "Falhas de mercado e bens públicos",
      "Princípios da tributação: equidade, neutralidade e progressividade",
      "Incidência tributária e curva de Laffer",
      "Déficit, dívida pública e sustentabilidade fiscal",
      "Política fiscal e monetária",
      "Contas nacionais: PIB e agregados",
      "Federalismo fiscal",
      "Microeconomia: oferta, demanda e elasticidade",
      "Estruturas de mercado",
    ],
    "Comércio Internacional e Legislação Aduaneira": [
      "Organização Mundial do Comércio e GATT",
      "Mercosul e Tarifa Externa Comum",
      "Classificação fiscal de mercadorias (NCM/SH)",
      "Valoração aduaneira",
      "Regras de origem",
      "Regimes aduaneiros especiais",
      "Despacho aduaneiro de importação e exportação",
      "Siscomex e controle aduaneiro",
      "Defesa comercial: antidumping, salvaguardas e medidas compensatórias",
      "Incoterms",
    ],
  };

  const NIVEIS = ["Fácil", "Médio", "Médio/Alto", "Alto"];
  const CAUSAS = [
    "Falta de conhecimento",
    "Confusão entre conceitos",
    "Desatenção",
    "Desconhecimento de exceção/legislação",
    "Leitura apressada",
    "Confusão entre alternativas",
  ];
  const CHAVE_HIST = "saf_historico_v1";
  const FRASES_CARREGANDO = [
    "Lavrando a próxima questão…",
    "Conferindo a legislação vigente…",
    "Escriturando as alternativas…",
    "Fechando o balancete da questão…",
    "Carimbando o gabarito…",
  ];

  /* ---------------- utilidades ---------------- */
  const $ = (id) => document.getElementById(id);
  const esc = (s) =>
    String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const pct = (a, n) => (n ? Math.round((a / n) * 100) : 0);
  const embaralhar = (arr) => {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  function lerHistorico() {
    try {
      const h = JSON.parse(localStorage.getItem(CHAVE_HIST) || "{}");
      return h && typeof h === "object" ? h : {};
    } catch (e) {
      return {};
    }
  }
  function salvarHistorico(h) {
    try {
      localStorage.setItem(CHAVE_HIST, JSON.stringify(h));
    } catch (e) {
      /* navegador sem storage: segue só com a sessão */
    }
  }

  async function postAPI(url, corpo) {
    let resp;
    try {
      resp = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(corpo),
      });
    } catch (e) {
      throw new Error("Falha de rede ao chamar " + url + ": " + e.message);
    }
    const texto = await resp.text();
    let data = null;
    try {
      data = JSON.parse(texto);
    } catch (e) {
      /* tratado abaixo */
    }
    if (!resp.ok) {
      const msg = (data && data.erro) || "HTTP " + resp.status + " em " + url + ": " + (texto.slice(0, 300) || "sem corpo de resposta");
      throw new Error(msg);
    }
    if (!data) throw new Error("Resposta inválida de " + url + " (não é JSON): " + texto.slice(0, 200));
    return data;
  }

  /* ---------------- estado ---------------- */
  let S = null;

  function todasDisciplinas() {
    return DISCIPLINAS.concat(COMPLEMENTARES);
  }
  function ementa(disc, esfera) {
    const e = SYLLABUS[disc];
    return Array.isArray(e) ? e : e[esfera || (S && S.cfg.esfera) || "Federal"];
  }
  function chaveDisc(disc, esfera) {
    return disc === "Legislação Tributária" ? disc + " (" + esfera + ")" : disc;
  }

  /* ---------------- tela inicial ---------------- */
  function montarTelaInicial() {
    const sel = $("cfg-disc");
    let html = '<option value="MISTO">Misto (todas, por peso)</option><optgroup label="Disciplinas principais">';
    DISCIPLINAS.forEach((d) => (html += '<option value="' + esc(d.nome) + '">' + esc(d.nome) + "</option>"));
    html += '</optgroup><optgroup label="Complementares">';
    COMPLEMENTARES.forEach((d) => (html += '<option value="' + esc(d.nome) + '">' + esc(d.nome) + "</option>"));
    html += "</optgroup>";
    sel.innerHTML = html;

    sel.addEventListener("change", atualizarCamposDisc);
    $("cfg-esfera").addEventListener("change", atualizarCamposDisc);
    $("cfg-compl").addEventListener("change", desenharPesos);
    $("cfg-banca").addEventListener("change", () => {
      const ce = $("cfg-banca").value === "Cebraspe";
      document.querySelector('input[name="cfg-formato"][value="' + (ce ? "CE" : "ME") + '"]').checked = true;
    });
    $("form-config").addEventListener("submit", (ev) => {
      ev.preventDefault();
      iniciarSimulado();
    });
    $("btn-limpar-hist").addEventListener("click", () => {
      if (window.confirm("Zerar o histórico de assuntos já estudados neste navegador?")) {
        try { localStorage.removeItem(CHAVE_HIST); } catch (e) { /* ignora */ }
        $("btn-limpar-hist").textContent = "Histórico zerado ✓";
      }
    });
    atualizarCamposDisc();
  }

  function atualizarCamposDisc() {
    const disc = $("cfg-disc").value;
    const misto = disc === "MISTO";
    $("campo-assunto").classList.toggle("hidden", misto);
    $("campo-compl").classList.toggle("hidden", !misto);
    $("tabela-pesos").classList.toggle("hidden", !misto);
    if (!misto) {
      const lista = ementa(disc, $("cfg-esfera").value);
      const hist = lerHistorico()[chaveDisc(disc, $("cfg-esfera").value)] || {};
      let html = '<option value="">Todos — rotação automática pela ementa</option>';
      lista.forEach((a) => {
        const v = hist[a] ? " (" + hist[a].vistas + "×)" : "";
        html += '<option value="' + esc(a) + '">' + esc(a + v) + "</option>";
      });
      $("cfg-assunto").innerHTML = html;
    }
    desenharPesos();
  }

  function pesosAtivos(incluirCompl) {
    return incluirCompl ? DISCIPLINAS.concat(COMPLEMENTARES) : DISCIPLINAS.slice();
  }

  function desenharPesos() {
    const lista = pesosAtivos($("cfg-compl").checked);
    const total = lista.reduce((s, d) => s + d.peso, 0);
    let html = "<table><caption>Distribuição no modo Misto</caption><tbody>";
    lista.forEach((d) => {
      const compl = COMPLEMENTARES.some((c) => c.nome === d.nome);
      html += '<tr class="' + (compl ? "compl" : "") + '"><td>' + esc(d.nome) + "</td><td>" + ((d.peso / total) * 100).toFixed(1).replace(".", ",") + "%</td></tr>";
    });
    html += "</tbody></table>";
    $("tabela-pesos").innerHTML = html;
  }

  function lerConfig() {
    let n = parseInt($("cfg-qtd").value, 10);
    if (!Number.isFinite(n)) n = 25;
    n = Math.max(5, Math.min(80, n));
    const disc = $("cfg-disc").value;
    return {
      n,
      esfera: $("cfg-esfera").value,
      banca: $("cfg-banca").value,
      formato: document.querySelector('input[name="cfg-formato"]:checked').value,
      disc,
      assunto: disc === "MISTO" ? "" : $("cfg-assunto").value,
      compl: disc === "MISTO" && $("cfg-compl").checked,
    };
  }

  /* ---------------- sorteio de disciplina e assunto ---------------- */
  function escolherDisciplina() {
    if (S.cfg.disc !== "MISTO") return S.cfg.disc;
    const lista = pesosAtivos(S.cfg.compl);
    const total = lista.reduce((s, d) => s + d.peso, 0);
    const k = S.carregadas + 1;
    // escolhe a disciplina mais "atrasada" em relação à sua cota proporcional
    let melhor = [];
    let melhorDef = -Infinity;
    lista.forEach((d) => {
      const def = (d.peso / total) * k - (S.contDisc[d.nome] || 0);
      if (def > melhorDef + 1e-9) {
        melhorDef = def;
        melhor = [d.nome];
      } else if (Math.abs(def - melhorDef) <= 1e-9) {
        melhor.push(d.nome);
      }
    });
    // evita repetir a mesma disciplina em sequência quando houver empate
    const ultima = S.ultimaDisc;
    const semUltima = melhor.filter((m) => m !== ultima);
    const pool = semUltima.length ? semUltima : melhor;
    return pool[Math.floor(Math.random() * pool.length)];
  }

  function escolherAssunto(disc, excluir) {
    if (S.cfg.assunto && disc === S.cfg.disc && !(excluir && excluir.has(S.cfg.assunto))) return S.cfg.assunto;
    const chave = chaveDisc(disc, S.cfg.esfera);
    const sessao = S.contAssunto[chave] || {};
    const hist = lerHistorico()[chave] || {};
    let lista = ementa(disc).filter((a) => !(excluir && excluir.has(a)));
    if (!lista.length) lista = ementa(disc);
    const ordenada = embaralhar(lista).sort((a, b) => {
      const s = (sessao[a] || 0) - (sessao[b] || 0);
      if (s) return s;
      return ((hist[a] && hist[a].vistas) || 0) - ((hist[b] && hist[b].vistas) || 0);
    });
    return ordenada[0];
  }

  function proximoAlvo(excluir) {
    const disciplina = escolherDisciplina();
    return { disciplina, assunto: escolherAssunto(disciplina, excluir) };
  }

  function carregarQuestao(alvo) {
    const evitar = S.respostas.slice(-5).map((r) => r.questao.enunciado.slice(0, 80));
    return postAPI("/api/gerar-questao", {
      disciplina: alvo.disciplina,
      assunto: alvo.assunto,
      nivel: NIVEIS[S.nivelIdx],
      formato: S.cfg.formato,
      banca: S.cfg.banca,
      esfera: S.cfg.esfera,
      evitar,
    }).then((d) => {
      if (!d.questao) throw new Error("A função /api/gerar-questao respondeu sem o campo 'questao'.");
      return d.questao;
    });
  }

  function iniciarPrefetch(alvo) {
    const p = { alvo, resultado: null };
    p.promessa = carregarQuestao(alvo).then(
      (q) => (p.resultado = { q }),
      (e) => (p.resultado = { erro: e })
    );
    return p;
  }

  /* ---------------- fluxo do simulado ---------------- */
  function iniciarSimulado() {
    S = {
      cfg: lerConfig(),
      nivelIdx: 1, // começa em Médio
      nivelMax: 1,
      respostas: [],
      contDisc: {},
      contAssunto: {},
      carregadas: 0,
      ultimaDisc: null,
      atual: null,
      selecionada: null,
      prefetch: null,
      alvoPendente: null,
      excluidos: new Set(),
    };
    mostrarTela("tela-questao");
    $("btn-encerrar").classList.remove("hidden");
    irParaProxima();
  }

  async function irParaProxima() {
    if (!S || S.encerrado || S.carregando) return;
    if (S.respostas.length >= S.cfg.n) return mostrarRelatorio();
    const sessao = S;
    S.carregando = true;
    mostrarCarregando();
    let resultado;
    if (S.prefetch) {
      const pf = S.prefetch;
      S.prefetch = null;
      S.alvoPendente = pf.alvo;
      await pf.promessa;
      resultado = pf.resultado;
    } else {
      S.alvoPendente = S.alvoPendente || proximoAlvo(S.excluidos);
      try {
        resultado = { q: await carregarQuestao(S.alvoPendente) };
      } catch (e) {
        resultado = { erro: e };
      }
    }
    sessao.carregando = false;
    if (S !== sessao || sessao.encerrado) return; // simulado encerrado durante o carregamento
    if (resultado.erro) return mostrarErro(resultado.erro.message);
    exibirQuestao(resultado.q);
  }

  function mostrarCarregando() {
    $("q-corpo").classList.add("hidden");
    $("q-erro").classList.add("hidden");
    $("q-carregando").classList.remove("hidden");
    $("q-carregando-txt").textContent = FRASES_CARREGANDO[Math.floor(Math.random() * FRASES_CARREGANDO.length)];
    atualizarMeta(S.respostas.length + 1);
  }

  function mostrarErro(msg) {
    $("q-carregando").classList.add("hidden");
    $("q-corpo").classList.add("hidden");
    $("q-erro").classList.remove("hidden");
    $("q-erro-msg").textContent = msg;
  }

  function atualizarMeta(numero) {
    const n = S.cfg.n;
    $("q-num").textContent = "Questão " + Math.min(numero, n) + " de " + n;
    $("q-nivel").textContent = "Nível " + NIVEIS[S.nivelIdx];
    const ac = S.respostas.filter((r) => r.acertou).length;
    $("q-placar").textContent = S.respostas.length ? ac + "/" + S.respostas.length + " · " + pct(ac, S.respostas.length) + "%" : "";
    $("progresso-fill").style.width = (S.respostas.length / n) * 100 + "%";
  }

  function exibirQuestao(q) {
    const alvo = S.alvoPendente;
    S.alvoPendente = null;
    S.excluidos = new Set();
    S.atual = q;
    S.selecionada = null;
    S.carregadas++;
    S.ultimaDisc = alvo.disciplina;
    S.contDisc[alvo.disciplina] = (S.contDisc[alvo.disciplina] || 0) + 1;
    const chave = chaveDisc(alvo.disciplina, S.cfg.esfera);
    S.contAssunto[chave] = S.contAssunto[chave] || {};
    S.contAssunto[chave][alvo.assunto] = (S.contAssunto[chave][alvo.assunto] || 0) + 1;
    q.disciplina = alvo.disciplina;
    q.assunto = alvo.assunto;

    $("q-carregando").classList.add("hidden");
    $("q-erro").classList.add("hidden");
    $("q-corpo").classList.remove("hidden");
    $("q-feedback").classList.add("hidden");
    $("q-causa").classList.add("hidden");
    $("btn-confirmar").classList.remove("hidden");
    $("btn-confirmar").disabled = true;

    $("q-nivel").textContent = "Nível " + q.nivel;
    $("q-disc").textContent = alvo.disciplina === "Legislação Tributária" ? alvo.disciplina + " · " + S.cfg.esfera : alvo.disciplina;
    $("q-assunto").textContent = alvo.assunto;
    $("q-origem").textContent = q.origem + " · " + (q.formato === "CE" ? "Certo/Errado" : "Múltipla escolha");
    $("q-aviso").textContent = q.aviso || "";
    $("q-aviso").classList.toggle("hidden", !q.aviso);
    $("q-enunciado").textContent = q.enunciado;

    const ol = $("q-alternativas");
    ol.innerHTML = "";
    Object.keys(q.alternativas).forEach((l) => {
      const li = document.createElement("li");
      const b = document.createElement("button");
      b.type = "button";
      b.className = "alt";
      b.dataset.letra = l;
      b.innerHTML = '<span class="letra">' + esc(l) + '</span><span class="txt">' + esc(q.alternativas[l]) + "</span>";
      b.addEventListener("click", () => selecionar(l));
      li.appendChild(b);
      ol.appendChild(li);
    });
    atualizarMeta(S.respostas.length + 1);
    $("q-corpo").scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function selecionar(l) {
    if (!S.atual || S.atual.respondida) return;
    S.selecionada = l;
    document.querySelectorAll("#q-alternativas .alt").forEach((b) => b.classList.toggle("selecionada", b.dataset.letra === l));
    $("btn-confirmar").disabled = false;
  }

  function ajustarNivel() {
    const n = S.respostas.length;
    if (n < 3) return;
    const p = pct(S.respostas.filter((r) => r.acertou).length, n);
    if (p >= 80) S.nivelIdx = Math.min(NIVEIS.length - 1, S.nivelIdx + 1);
    else if (p < 60) S.nivelIdx = Math.max(0, S.nivelIdx - 1);
    S.nivelMax = Math.max(S.nivelMax, S.nivelIdx);
  }

  function confirmar() {
    const q = S.atual;
    if (!q || q.respondida || !S.selecionada) return;
    q.respondida = true;
    const marcada = S.selecionada;
    const acertou = marcada === q.gabarito;
    const registro = { questao: q, marcada, acertou, causa: null };
    S.respostas.push(registro);

    // histórico no navegador
    const h = lerHistorico();
    const chave = chaveDisc(q.disciplina, S.cfg.esfera);
    h[chave] = h[chave] || {};
    const item = h[chave][q.assunto] || { vistas: 0, acertos: 0 };
    item.vistas++;
    if (acertou) item.acertos++;
    h[chave][q.assunto] = item;
    salvarHistorico(h);

    ajustarNivel();

    // feedback visual
    document.querySelectorAll("#q-alternativas .alt").forEach((b) => {
      const l = b.dataset.letra;
      b.disabled = true;
      b.classList.remove("selecionada");
      if (l === q.gabarito) b.classList.add("correta");
      else if (l === marcada) b.classList.add("errada");
      const exp = document.createElement("span");
      exp.className = "exp";
      exp.innerHTML = "<b>" + (l === q.gabarito ? "CORRETA — " : "INCORRETA — ") + "</b>" + esc(q.explicacoes[l] || "");
      b.querySelector(".txt").appendChild(exp);
    });
    $("btn-confirmar").classList.add("hidden");
    const res = $("q-resultado");
    res.className = "resultado " + (acertou ? "ok" : "nok");
    const gabTxt = q.formato === "CE" ? (q.gabarito === "C" ? "Certo" : "Errado") : q.gabarito;
    res.textContent = acertou ? "✓ ACERTOU" : "✗ ERROU — gabarito: " + gabTxt;
    $("q-pegadinha").textContent = q.pegadinha || "—";
    $("q-memorizar").textContent = q.memorizar || "—";
    $("q-feedback").classList.remove("hidden");

    const ultima = S.respostas.length >= S.cfg.n;
    $("btn-proxima").textContent = ultima ? "Ver relatório final" : "Próxima questão";
    atualizarMeta(S.respostas.length);
    $("q-nivel").textContent = "Próximo nível: " + NIVEIS[S.nivelIdx];

    if (!acertou) buscarCausa(registro);
    if (!ultima) S.prefetch = iniciarPrefetch(proximoAlvo());
  }

  function buscarCausa(registro) {
    const box = $("q-causa");
    const txt = $("q-causa-txt");
    box.classList.remove("hidden");
    txt.innerHTML = "<p><em>Analisando o motivo do erro…</em></p>";
    const q = registro.questao;
    postAPI("/api/causa-erro", {
      questao: {
        disciplina: q.disciplina, assunto: q.assunto, enunciado: q.enunciado, alternativas: q.alternativas,
        gabarito: q.gabarito, explicacoes: q.explicacoes, pegadinha: q.pegadinha,
      },
      resposta: registro.marcada,
    })
      .then((r) => {
        registro.causa = r.causa;
        if (S && S.atual === q) {
          txt.innerHTML =
            '<p><span class="causa-tag">' + esc(r.causa) + "</span> — " + esc(r.explicacao) + "</p>" +
            (r.dica ? "<p><strong>Dica:</strong> " + esc(r.dica) + "</p>" : "");
        }
      })
      .catch((e) => {
        registro.causa = "Não diagnosticada";
        if (S && S.atual === q) txt.innerHTML = '<p class="rotulo-mono">' + esc(e.message) + "</p>";
      });
  }

  /* ---------------- relatório ---------------- */
  function corPorPct(p) {
    if (p >= 80) return "var(--razao)";
    if (p >= 60) return "var(--ocre)";
    return "var(--carimbo)";
  }

  function mostrarRelatorio() {
    S.prefetch = null;
    S.encerrado = true;
    $("btn-encerrar").classList.add("hidden");
    mostrarTela("tela-relatorio");
    const R = S.respostas;
    const el = $("relatorio");
    if (!R.length) {
      el.innerHTML = "<p>Nenhuma questão foi respondida neste simulado.</p>";
      return;
    }
    const total = R.length;
    const acertos = R.filter((r) => r.acertou).length;
    const p = pct(acertos, total);

    // por disciplina
    const porDisc = {};
    R.forEach((r) => {
      const d = r.questao.disciplina;
      porDisc[d] = porDisc[d] || { n: 0, a: 0 };
      porDisc[d].n++;
      if (r.acertou) porDisc[d].a++;
    });
    const discs = Object.keys(porDisc).map((d) => ({ nome: d, n: porDisc[d].n, a: porDisc[d].a, p: pct(porDisc[d].a, porDisc[d].n) }));
    discs.sort((x, y) => y.p - x.p || y.n - x.n);

    // por assunto
    const porAss = {};
    R.forEach((r) => {
      const k = r.questao.disciplina + "||" + r.questao.assunto;
      porAss[k] = porAss[k] || { disc: r.questao.disciplina, assunto: r.questao.assunto, n: 0, e: 0 };
      porAss[k].n++;
      if (!r.acertou) porAss[k].e++;
    });
    const assuntos = Object.values(porAss);
    const comErro = assuntos.filter((a) => a.e > 0).sort((x, y) => y.e - x.e || y.n - x.n);
    const semErro = assuntos.filter((a) => a.e === 0).sort((x, y) => y.n - x.n);

    // causas
    const causas = {};
    R.filter((r) => !r.acertou).forEach((r) => {
      const c = r.causa || "Não diagnosticada";
      causas[c] = (causas[c] || 0) + 1;
    });
    const causasOrd = Object.entries(causas).sort((a, b) => b[1] - a[1]);

    // pontos fortes e fracos (disciplina se houver variedade; senão, assunto)
    let fortes, fracos, unidade;
    if (discs.length >= 3) {
      unidade = "disciplina";
      fortes = discs.filter((d) => d.p >= 60).slice(0, 3).map((d) => d.nome + " — " + d.p + "% (" + d.a + "/" + d.n + ")");
      fracos = discs.slice().reverse().filter((d) => d.p < 80).slice(0, 3).map((d) => d.nome + " — " + d.p + "% (" + d.a + "/" + d.n + ")");
    } else {
      unidade = "assunto";
      fortes = semErro.slice(0, 3).map((a) => a.assunto + " (" + a.n + "/" + a.n + ")");
      fracos = comErro.slice(0, 3).map((a) => a.assunto + " (" + a.e + " erro" + (a.e > 1 ? "s" : "") + ")");
    }

    // cobertura da ementa
    const hist = lerHistorico();
    const discsCobertura = S.cfg.disc === "MISTO" ? pesosAtivos(S.cfg.compl).map((d) => d.nome) : [S.cfg.disc];
    const cobertura = discsCobertura.map((d) => {
      const chave = chaveDisc(d, S.cfg.esfera);
      const lista = ementa(d);
      const sess = S.contAssunto[chave] || {};
      const h = hist[chave] || {};
      const cobSess = lista.filter((a) => sess[a]).length;
      const cobHist = lista.filter((a) => h[a] && h[a].vistas > 0).length;
      return { nome: d === "Legislação Tributária" ? d + " (" + S.cfg.esfera + ")" : d, total: lista.length, sess: cobSess, hist: cobHist, faltam: lista.filter((a) => !(h[a] && h[a].vistas > 0)) };
    });

    // diagnóstico
    const diag = [];
    if (p >= 80) diag.push("Desempenho de aprovação: " + p + "% de acertos. Você está acima da média esperada para Auditor Fiscal — o foco agora é manter o ritmo e eliminar erros pontuais.");
    else if (p >= 60) diag.push("Desempenho intermediário: " + p + "% de acertos. Você está na zona de corte de muitos concursos fiscais; reforçar os pontos fracos pode colocá-lo na faixa de aprovação.");
    else diag.push("Desempenho abaixo da zona de corte: " + p + "% de acertos. Priorize teoria e questões comentadas nos assuntos em que errou antes de novos simulados longos.");
    diag.push("O nível de dificuldade chegou a " + NIVEIS[S.nivelMax] + " e terminou em " + NIVEIS[S.nivelIdx] + ".");
    if (discs.length > 1) {
      const melhor = discs[0], pior = discs[discs.length - 1];
      if (melhor.p !== pior.p) diag.push("Melhor rendimento em " + melhor.nome + " (" + melhor.p + "%); maior dificuldade em " + pior.nome + " (" + pior.p + "%).");
    }
    if (causasOrd.length && causasOrd[0][0] !== "Não diagnosticada") {
      const c = causasOrd[0][0];
      const conselhos = {
        "Falta de conhecimento": "volte à teoria antes de fazer mais questões desses assuntos.",
        "Confusão entre conceitos": "monte quadros comparativos dos institutos parecidos.",
        "Desatenção": "sublinhe palavras como 'exceto', 'não' e 'sempre' antes de responder.",
        "Desconhecimento de exceção/legislação": "faça leitura seca da lei, marcando exceções e prazos.",
        "Leitura apressada": "leia o comando da questão duas vezes antes das alternativas.",
        "Confusão entre alternativas": "elimine alternativas uma a uma justificando o erro de cada.",
      };
      diag.push("Causa de erro predominante: " + c + " — " + (conselhos[c] || "revise com atenção os comentários das questões erradas."));
    }

    // plano de revisão
    const memorizar = R.filter((r) => !r.acertou && r.questao.memorizar).map((r) => r.questao.memorizar);
    const fracasDisc = discs.filter((d) => d.p < 60).map((d) => d.nome);
    const fortesDisc = discs.filter((d) => d.p >= 80).map((d) => d.nome);
    const naoCobertos = cobertura.flatMap((c) => c.faltam.slice(0, 2).map((a) => a + " (" + c.nome + ")")).slice(0, 5);

    const imediato = [];
    comErro.slice(0, 5).forEach((a) => imediato.push("Revisar a teoria de <strong>" + esc(a.assunto) + "</strong> (" + esc(a.disc) + ")."));
    if (memorizar.length) imediato.push("Reler os pontos de memorização das questões erradas (lista abaixo).");
    if (!imediato.length) imediato.push("Nenhum erro neste simulado — releia as pegadinhas das questões para fixar.");

    const proximos = [];
    if (fracasDisc.length) proximos.push("Resolver 15 a 20 questões focadas por dia em: " + esc(fracasDisc.join(", ")) + ".");
    proximos.push("Refazer um simulado só com os assuntos errados, no nível " + NIVEIS[Math.max(0, S.nivelIdx - 1)] + ".");
    if (naoCobertos.length) proximos.push("Cobrir assuntos ainda não vistos da ementa: " + esc(naoCobertos.join("; ")) + ".");

    const manutencao = [];
    if (fortesDisc.length) manutencao.push("Revisão espaçada (7, 15 e 30 dias) em: " + esc(fortesDisc.join(", ")) + ".");
    manutencao.push("Um simulado Misto de 25 questões por semana para acompanhar a evolução.");
    manutencao.push("Leitura periódica das novidades da Reforma Tributária (LC 214/2025) e da legislação da sua esfera.");

    // montar HTML
    let html = "";
    html += '<div class="kpis">' +
      kpi(p + "%", "Aproveitamento") + kpi(acertos + "/" + total, "Acertos") +
      kpi(NIVEIS[S.nivelIdx], "Nível final") + kpi(S.cfg.banca + " · " + (S.cfg.formato === "CE" ? "C/E" : "A–E"), "Banca · formato") +
      "</div>";

    html += '<div class="secao-rel"><h3>Desempenho por disciplina</h3><div class="barras">';
    discs.forEach((d) => {
      html += '<div class="barra-linha"><span>' + esc(d.nome) + '</span><div class="barra-trilho"><div class="barra-val" style="width:' + Math.max(d.p, 2) + "%;background:" + corPorPct(d.p) + '"></div></div><span class="barra-num">' + d.p + "% · " + d.a + "/" + d.n + "</span></div>";
    });
    html += '</div><p class="legenda">Linha tracejada = 60% (zona de corte de referência). Verde ≥ 80% · ocre 60–79% · vermelho &lt; 60%.</p></div>';

    html += '<div class="secao-rel"><h3>Mapa de erros por assunto</h3>';
    if (comErro.length) {
      html += '<table class="mapa"><thead><tr><th>Assunto</th><th>Disciplina</th><th>Erros</th></tr></thead><tbody>';
      comErro.forEach((a) => (html += "<tr><td>" + esc(a.assunto) + "</td><td>" + esc(a.disc) + '</td><td class="n">' + a.e + "/" + a.n + "</td></tr>"));
      html += "</tbody></table>";
    } else html += "<p>Nenhum erro registrado. Excelente!</p>";
    if (causasOrd.length) {
      html += '<p class="legenda">Causas prováveis: ' + causasOrd.map((c) => esc(c[0]) + " (" + c[1] + ")").join(" · ") + "</p>";
    }
    html += "</div>";

    html += '<div class="secao-rel duas-col"><div><h3>Pontos fortes</h3><ul class="lista-forte">' +
      (fortes.length ? fortes.map((f) => "<li>" + esc(f) + "</li>").join("") : "<li>Ainda sem " + unidade + " consolidada.</li>") +
      '</ul></div><div><h3>Pontos fracos</h3><ul class="lista-fraco">' +
      (fracos.length ? fracos.map((f) => "<li>" + esc(f) + "</li>").join("") : "<li>Nenhum ponto fraco evidente.</li>") +
      "</ul></div></div>";

    html += '<div class="secao-rel diagnostico"><h3>Diagnóstico</h3>' + diag.map((t) => "<p>" + esc(t) + "</p>").join("") + "</div>";

    html += '<div class="secao-rel"><h3>Plano de revisão</h3><div class="plano">' +
      etapa("Imediato (hoje)", imediato) + etapa("Próximos dias (2 a 7)", proximos) + etapa("Manutenção (contínuo)", manutencao) +
      "</div>";
    if (memorizar.length) {
      html += '<div class="nota memorizar"><span class="rotulo-mono">Pontos de memorização das questões erradas</span><ul>' +
        memorizar.map((m) => "<li>" + esc(m) + "</li>").join("") + "</ul></div>";
    }
    html += "</div>";

    html += '<div class="secao-rel"><h3>Cobertura da ementa</h3><table class="mapa"><thead><tr><th>Disciplina</th><th>Nesta sessão</th><th>Acumulado</th></tr></thead><tbody>';
    cobertura.forEach((c) => {
      html += "<tr><td>" + esc(c.nome) + '</td><td class="n">' + c.sess + "/" + c.total + '</td><td class="n">' + c.hist + "/" + c.total + " (" + pct(c.hist, c.total) + "%)</td></tr>";
    });
    html += '</tbody></table><p class="legenda">"Acumulado" usa o histórico salvo neste navegador.</p></div>';

    el.innerHTML = html;
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function kpi(v, r) {
    return '<div class="kpi"><span class="v">' + esc(v) + '</span><span class="r">' + esc(r) + "</span></div>";
  }
  function etapa(titulo, itens) {
    return '<div class="etapa"><h4>' + esc(titulo) + "</h4><ul>" + itens.map((i) => "<li>" + i + "</li>").join("") + "</ul></div>";
  }

  /* ---------------- navegação ---------------- */
  function mostrarTela(id) {
    ["tela-inicio", "tela-questao", "tela-relatorio"].forEach((t) => $(t).classList.toggle("hidden", t !== id));
  }

  function ligarEventos() {
    $("btn-confirmar").addEventListener("click", confirmar);
    $("btn-proxima").addEventListener("click", irParaProxima);
    $("btn-tentar").addEventListener("click", irParaProxima);
    $("btn-pular").addEventListener("click", () => {
      if (S.alvoPendente) S.excluidos.add(S.alvoPendente.assunto);
      const disc = S.alvoPendente ? S.alvoPendente.disciplina : escolherDisciplina();
      S.alvoPendente = { disciplina: disc, assunto: escolherAssunto(disc, S.excluidos) };
      irParaProxima();
    });
    $("btn-encerrar").addEventListener("click", () => {
      if (!S) return;
      if (window.confirm("Encerrar o simulado agora e ver o relatório?")) mostrarRelatorio();
    });
    $("btn-novo").addEventListener("click", () => {
      S = null;
      atualizarCamposDisc();
      mostrarTela("tela-inicio");
    });
  }

  montarTelaInicial();
  ligarEventos();
})();
