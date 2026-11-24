import { describe, expect, it } from "vitest";
import {
  arredondar,
  calcularAvaliacaoFinal,
  calcularMediaSemestre,
  calcularNotaNecessaria,
  calcularNotaNecessariaAvaliacaoFinal,
  formatarLista,
  notasPendentes,
  semRuido,
  calcularPesos,
  converterTextoEmNumero,
  ErroCalculo,
  MENSAGEM_APROVADO_SEM_FINAL,
  MENSAGEM_REPROVADO_SEM_FINAL,
  type EntradaAvaliacaoFinal,
  type EntradaSemestre,
} from "./calculo-media";

/** Captura o ErroCalculo lançado por `fn` (falha se nada for lançado). */
function capturarErro(fn: () => unknown): ErroCalculo {
  try {
    fn();
  } catch (e) {
    expect(e).toBeInstanceOf(ErroCalculo);
    return e as ErroCalculo;
  }
  throw new Error("Era esperado um ErroCalculo");
}

const semestreBase: EntradaSemestre = { pesoProvas: 6, p1: 7, p2: 8, quiz: 9, outros: 10 };

describe("calcularPesos", () => {
  it("exemplo de referência: pesoProvas = 6 → 3 / 3 / 2 / 2", () => {
    expect(calcularPesos(6)).toEqual({ p1: 3, p2: 3, quiz: 2, outros: 2 });
  });

  it("pesoProvas = 10 → Quiz e Outros com peso 0", () => {
    expect(calcularPesos(10)).toEqual({ p1: 5, p2: 5, quiz: 0, outros: 0 });
  });

  it("pesoProvas = 0 → P1 e P2 com peso 0", () => {
    expect(calcularPesos(0)).toEqual({ p1: 0, p2: 0, quiz: 5, outros: 5 });
  });

  it.each([0, 0.5, 1, 2.5, 3.3, 4, 5, 6, 7.7, 8, 9.9, 10])(
    "a soma dos pesos é sempre 10 (pesoProvas = %s)",
    (pesoProvas) => {
      const { p1, p2, quiz, outros } = calcularPesos(pesoProvas);
      expect(p1).toBe(p2);
      expect(quiz).toBe(outros);
      expect(p1 + p2 + quiz + outros).toBeCloseTo(10, 10);
    },
  );

  it.each([
    [-1, "FORA_DO_INTERVALO"],
    [11, "FORA_DO_INTERVALO"],
    [undefined, "OBRIGATORIO"],
    [null, "OBRIGATORIO"],
    [NaN, "NAO_NUMERICO"],
  ] as const)("rejeita pesoProvas = %s", (pesoProvas, codigo) => {
    const erro = capturarErro(() => calcularPesos(pesoProvas));
    expect(erro.campo).toBe("pesoProvas");
    expect(erro.codigo).toBe(codigo);
  });
});

describe("calcularMediaSemestre — casos obrigatórios", () => {
  it.each([
    // #, pesoProvas, P1, P2, Quiz, Outros, pesos, média, situação, média bruta
    [1, 6, 7, 8, 9, 10, [3, 3, 2, 2], 8.3, "Aprovado", undefined],
    [2, 8, 5, 6, 10, 10, [4, 4, 1, 1], 6.4, "Avaliação final", undefined],
    [3, 4, 6, 6, 8, 8, [2, 2, 3, 3], 7.2, "Aprovado", undefined],
    [4, 5, 10, 0, 0, 10, [2.5, 2.5, 2.5, 2.5], 5.0, "Avaliação final", undefined],
    [5, 10, 7, 9, 0, 0, [5, 5, 0, 0], 8.0, "Aprovado", undefined],
    [6, 0, 0, 0, 6, 8, [0, 0, 5, 5], 7.0, "Aprovado", undefined],
    [7, 6, 0, 0, 0, 0, [3, 3, 2, 2], 0.0, "Reprovado", undefined],
    [8, 6, 10, 10, 10, 10, [3, 3, 2, 2], 10.0, "Aprovado", undefined],
    [9, 6, 7, 7, 6.75, 7, [3, 3, 2, 2], 7.0, "Aprovado", 6.95],
    [10, 6, 7, 7, 6.7, 7, [3, 3, 2, 2], 6.9, "Avaliação final", 6.94],
    [11, 6, 4, 4, 5, 5, [3, 3, 2, 2], 4.4, "Reprovado", undefined],
    [12, 6, 5, 5, 5, 4.75, [3, 3, 2, 2], 5.0, "Avaliação final", 4.95],
    [13, 6, 5, 5, 5, 4.7, [3, 3, 2, 2], 4.9, "Reprovado", 4.94],
  ] as const)(
    "caso %i",
    (_n, pesoProvas, p1, p2, quiz, outros, [w1, w2, wq, wo], media, situacao, bruta) => {
      const r = calcularMediaSemestre({ pesoProvas, p1, p2, quiz, outros });
      expect(r.pesos).toEqual({ p1: w1, p2: w2, quiz: wq, outros: wo });
      expect(r.media).toBe(media);
      expect(r.situacao).toBe(situacao);
      if (bruta !== undefined) expect(r.mediaBruta).toBeCloseTo(bruta, 10);
    },
  );
});

describe("calcularAvaliacaoFinal — casos obrigatórios", () => {
  it.each([
    // #, média do semestre, nota da avaliação final, média final, situação
    [14, 6.4, 5.6, 6.0, "Aprovado"],
    [15, 6.0, 10, 8.0, "Aprovado"],
    [16, 6.9, 5.1, 6.0, "Aprovado"],
    [17, 5.0, 6.9, 6.0, "Aprovado"],
    [18, 5.0, 6.8, 5.9, "Reprovado"],
    [19, 5.0, 0, 2.5, "Reprovado"],
  ] as const)("caso %i", (_n, mediaSemestre, notaAvaliacaoFinal, mediaFinal, situacao) => {
    const r = calcularAvaliacaoFinal({ mediaSemestre, notaAvaliacaoFinal });
    expect(r.mediaFinal).toBe(mediaFinal);
    expect(r.situacao).toBe(situacao);
  });

  it("caso 17: média final bruta 5,95 arredonda para 6,0", () => {
    const r = calcularAvaliacaoFinal({ mediaSemestre: 5.0, notaAvaliacaoFinal: 6.9 });
    expect(r.mediaFinalBruta).toBeCloseTo(5.95, 10);
    expect(r.mediaFinal).toBe(6.0);
  });

  it("aceita os limites da faixa: 5,0 calcula; 6,99 arredonda para 7,0 e não calcula", () => {
    expect(() => calcularAvaliacaoFinal({ mediaSemestre: 5, notaAvaliacaoFinal: 6 })).not.toThrow();
    const erro = capturarErro(() =>
      calcularAvaliacaoFinal({ mediaSemestre: 6.99, notaAvaliacaoFinal: 6 }),
    );
    expect(erro.codigo).toBe("APROVADO_SEM_FINAL");
  });
});

describe("casos de erro", () => {
  it("caso 20: P1 = -1 → erro em P1", () => {
    const erro = capturarErro(() => calcularMediaSemestre({ ...semestreBase, p1: -1 }));
    expect(erro.campo).toBe("p1");
    expect(erro.message).toBe("A nota de P1 deve estar entre 0 e 10.");
  });

  it("caso 21: Quiz = 10.5 → erro em Quiz", () => {
    const erro = capturarErro(() => calcularMediaSemestre({ ...semestreBase, quiz: 10.5 }));
    expect(erro.campo).toBe("quiz");
    expect(erro.message).toBe("A nota de Quiz deve estar entre 0 e 10.");
  });

  it("caso 22: pesoProvas = 11 → erro em pesoProvas", () => {
    const erro = capturarErro(() => calcularMediaSemestre({ ...semestreBase, pesoProvas: 11 }));
    expect(erro.campo).toBe("pesoProvas");
    expect(erro.message).toBe("O peso das provas deve estar entre 0 e 10.");
  });

  it("caso 23: P2 ausente → erro em P2", () => {
    const semP2: Partial<EntradaSemestre> = { ...semestreBase };
    delete semP2.p2;
    const erro = capturarErro(() => calcularMediaSemestre(semP2 as EntradaSemestre));
    expect(erro.campo).toBe("p2");
    expect(erro.message).toBe("Informe a nota de P2.");
  });

  it("caso 24: aba 2 com média do semestre 4,9 → não calcula; reprovação direta", () => {
    const erro = capturarErro(() =>
      calcularAvaliacaoFinal({ mediaSemestre: 4.9, notaAvaliacaoFinal: 8 }),
    );
    expect(erro.campo).toBe("mediaSemestre");
    expect(erro.codigo).toBe("REPROVADO_SEM_FINAL");
    expect(erro.message).toBe(MENSAGEM_REPROVADO_SEM_FINAL);
  });

  it("caso 25: aba 2 com média do semestre 7,0 → não calcula; aprovação direta", () => {
    const erro = capturarErro(() =>
      calcularAvaliacaoFinal({ mediaSemestre: 7.0, notaAvaliacaoFinal: 8 }),
    );
    expect(erro.campo).toBe("mediaSemestre");
    expect(erro.codigo).toBe("APROVADO_SEM_FINAL");
    expect(erro.message).toBe(MENSAGEM_APROVADO_SEM_FINAL);
  });

  it("caso 26: nota da avaliação final = 11 → erro na nota da avaliação final", () => {
    const erro = capturarErro(() =>
      calcularAvaliacaoFinal({ mediaSemestre: 6, notaAvaliacaoFinal: 11 }),
    );
    expect(erro.campo).toBe("notaAvaliacaoFinal");
    expect(erro.message).toBe("A nota da avaliação final deve estar entre 0 e 10.");
  });

  it.each([
    ["vazia", undefined, "Informe a nota de Outros."],
    ["NaN", NaN, "A nota de Outros deve ser um número."],
    ["não numérica", "abc" as unknown as number, "A nota de Outros deve ser um número."],
  ])("rejeita nota %s indicando o campo", (_desc, outros, mensagem) => {
    const erro = capturarErro(() => calcularMediaSemestre({ ...semestreBase, outros }));
    expect(erro.campo).toBe("outros");
    expect(erro.message).toBe(mensagem);
  });

  it("rejeita média do semestre ausente na aba 2", () => {
    const entrada: EntradaAvaliacaoFinal = { mediaSemestre: undefined, notaAvaliacaoFinal: 7 };
    const erro = capturarErro(() => calcularAvaliacaoFinal(entrada));
    expect(erro.campo).toBe("mediaSemestre");
    expect(erro.codigo).toBe("OBRIGATORIO");
  });
});

describe("arredondamento e conversão", () => {
  it.each([
    [8.299999999, 8.3],
    [5.95, 6.0],
    [4.95, 5.0],
    [6.95, 7.0],
    [6.94, 6.9],
    [0, 0],
    [10, 10],
  ])("arredondar(%s) = %s", (entrada, esperado) => {
    expect(arredondar(entrada)).toBe(esperado);
  });

  it.each([
    ["7,5", 7.5],
    ["7.5", 7.5],
    [" 10 ", 10],
    ["", undefined],
    ["   ", undefined],
  ])("converterTextoEmNumero(%j) = %s", (texto, esperado) => {
    expect(converterTextoEmNumero(texto)).toBe(esperado);
  });

  it("texto inválido vira NaN", () => {
    expect(converterTextoEmNumero("7,5,1")).toBeNaN();
  });
});

describe("calcularNotaNecessaria — notas pendentes (em branco)", () => {
  const nn = (entrada: Partial<EntradaSemestre>, alvo?: number) =>
    calcularNotaNecessaria(
      { pesoProvas: undefined, p1: undefined, p2: undefined, quiz: undefined, outros: undefined, ...entrada },
      alvo,
    );

  it("uma nota pendente: 6 | 7, 8, 9, _ → precisa de 3,3 em Outros", () => {
    // conhecidas: 7*3 + 8*3 + 9*2 = 63; 3,2 → 6,94 → 6,9 (não); 3,3 → 6,96 → 7,0 (sim)
    const r = nn({ pesoProvas: 6, p1: 7, p2: 8, quiz: 9 });
    expect(r).toMatchObject({ tipo: "possivel", notaNecessaria: 3.3, camposPendentes: ["outros"], pesoPendente: 2 });
    if (r.tipo === "possivel") expect(r.mediaResultante).toBe(7.0);
  });

  it("considera o arredondamento: basta a média bruta chegar a 6,95", () => {
    // 6 | 7, 7, _, 7 → Quiz 6,75 dá 6,95 (caso 9); na escala de 0,1 a menor nota é 6,8
    const r = nn({ pesoProvas: 6, p1: 7, p2: 7, outros: 7 });
    expect(r).toMatchObject({ tipo: "possivel", notaNecessaria: 6.8 });
    // 6,7 não basta (caso 10: 6,94 → 6,9)
    expect(calcularMediaSemestre({ pesoProvas: 6, p1: 7, p2: 7, quiz: 6.7, outros: 7 }).media).toBe(6.9);
  });

  it("várias pendentes: a mesma nota em cada uma (10, 10, _, _ → 2,4)", () => {
    const r = nn({ pesoProvas: 6, p1: 10, p2: 10 });
    expect(r).toMatchObject({ tipo: "possivel", notaNecessaria: 2.4, camposPendentes: ["quiz", "outros"], pesoPendente: 4 });
  });

  it("todas pendentes → precisa de 7,0 em cada", () => {
    expect(nn({ pesoProvas: 6 })).toMatchObject({ tipo: "possivel", notaNecessaria: 7, pesoPendente: 10 });
  });

  it("aprovação já garantida mesmo tirando 0", () => {
    const r = nn({ pesoProvas: 8, p1: 10, p2: 10, outros: 0 });
    expect(r).toMatchObject({ tipo: "garantido", mediaMinima: 8.0, camposPendentes: ["quiz"] });
  });

  it("impossível atingir 7,0: informa a média máxima e a situação", () => {
    const r = nn({ pesoProvas: 6, p1: 2, p2: 2 });
    expect(r).toMatchObject({ tipo: "impossivel", mediaMaxima: 5.2, situacaoMaxima: "Avaliação final" });
  });

  it("aceita outra média-alvo (5,0 → avaliação final)", () => {
    // conhecidas 12; 9,3 → 4,92 → 4,9 (não); 9,4 → 4,96 → 5,0 (sim)
    expect(nn({ pesoProvas: 6, p1: 2, p2: 2 }, 5)).toMatchObject({ tipo: "possivel", notaNecessaria: 9.4 });
  });

  it("pendentes com peso 0 não mudam a média (pesoProvas = 10)", () => {
    const r = nn({ pesoProvas: 10, p1: 7, p2: 9 });
    expect(r).toMatchObject({ tipo: "garantido", mediaMinima: 8.0, pesoPendente: 0 });
  });

  it("pendentes com peso 0 e média abaixo do alvo → impossível", () => {
    const r = nn({ pesoProvas: 0, quiz: 6, outros: 7 });
    expect(r).toMatchObject({ tipo: "impossivel", mediaMaxima: 6.5, pesoPendente: 0 });
  });

  it("a nota encontrada é a menor na escala de 0,1 (checa todas as combinações de uma pendente)", () => {
    for (let n = 0; n <= 100; n += 7) {
      const entrada = { pesoProvas: 6, p1: n / 10, p2: 5, quiz: 6 };
      const r = nn(entrada);
      if (r.tipo !== "possivel") continue;
      const media = (o: number) => calcularMediaSemestre({ ...entrada, outros: o }).media;
      expect(media(r.notaNecessaria)).toBeGreaterThanOrEqual(7);
      expect(media(arredondar(r.notaNecessaria - 0.1))).toBeLessThan(7);
    }
  });

  it("peso das provas continua obrigatório", () => {
    const erro = capturarErro(() => nn({ p1: 7 }));
    expect(erro.campo).toBe("pesoProvas");
    expect(erro.codigo).toBe("OBRIGATORIO");
  });

  it("notas preenchidas continuam sendo validadas", () => {
    const erro = capturarErro(() => nn({ pesoProvas: 6, p1: 11 }));
    expect(erro.campo).toBe("p1");
    expect(erro.message).toBe("A nota de P1 deve estar entre 0 e 10.");
    expect(capturarErro(() => nn({ pesoProvas: 6, quiz: NaN })).campo).toBe("quiz");
  });

  it("notasPendentes lista os campos em branco na ordem", () => {
    expect(notasPendentes({ pesoProvas: 6, p1: 7, p2: undefined, quiz: 0, outros: null })).toEqual(["p2", "outros"]);
  });

  it("formatarLista", () => {
    expect(formatarLista(["P1"])).toBe("P1");
    expect(formatarLista(["P1", "Quiz"])).toBe("P1 e Quiz");
    expect(formatarLista(["P1", "P2", "Quiz"])).toBe("P1, P2 e Quiz");
  });
});

describe("calcularNotaNecessariaAvaliacaoFinal — só a média do semestre", () => {
  it.each([
    // média do semestre, nota necessária: (média + nota) / 2 ≥ 6,0 sem arredondar
    [6.4, 5.6], // 6,4 + 5,6 = 12,0 → 6,0; com 5,5 daria 5,95 (só aprovaria arredondando)
    [5.0, 7.0], // com 6,9 daria 5,95
    [6.0, 6.0],
    [6.9, 5.1], // caso 16
    [5.5, 6.5],
  ])("média %s → precisa de %s", (mediaSemestre, nota) => {
    const r = calcularNotaNecessariaAvaliacaoFinal(mediaSemestre);
    expect(r.notaNecessaria).toBe(nota);
    expect(r.mediaFinalResultante).toBe(6.0);
    expect(r.mediaSemestre).toBe(mediaSemestre);
  });

  it("não conta com o arredondamento: média bruta ≥ 6,0 e é a menor nota possível (5,0 a 6,9)", () => {
    for (let m = 50; m < 70; m++) {
      const mediaSemestre = m / 10;
      const { notaNecessaria, mediaFinalResultante } = calcularNotaNecessariaAvaliacaoFinal(mediaSemestre);
      const bruta = (nota: number) =>
        semRuido(calcularAvaliacaoFinal({ mediaSemestre, notaAvaliacaoFinal: nota }).mediaFinalBruta);
      expect(bruta(notaNecessaria)).toBeGreaterThanOrEqual(6);
      expect(mediaFinalResultante).toBe(6);
      expect(bruta(arredondar(notaNecessaria - 0.1))).toBeLessThan(6);
    }
  });

  it("usa a média do semestre arredondada (6,44 → 6,4)", () => {
    expect(calcularNotaNecessariaAvaliacaoFinal(6.44)).toMatchObject({ mediaSemestre: 6.4, notaNecessaria: 5.6 });
  });

  it.each([
    [4.9, "REPROVADO_SEM_FINAL", MENSAGEM_REPROVADO_SEM_FINAL],
    [7.0, "APROVADO_SEM_FINAL", MENSAGEM_APROVADO_SEM_FINAL],
    [6.96, "APROVADO_SEM_FINAL", MENSAGEM_APROVADO_SEM_FINAL],
  ])("média %s fora da faixa → não calcula", (mediaSemestre, codigo, mensagem) => {
    const erro = capturarErro(() => calcularNotaNecessariaAvaliacaoFinal(mediaSemestre));
    expect(erro).toMatchObject({ campo: "mediaSemestre", codigo, message: mensagem });
  });

  it.each([
    [undefined, "OBRIGATORIO", "Informe a média do semestre."],
    [NaN, "NAO_NUMERICO", "A média do semestre deve ser um número."],
    [11, "FORA_DO_INTERVALO", "A média do semestre deve estar entre 0 e 10."],
  ])("média inválida (%s) → erro", (mediaSemestre, codigo, mensagem) => {
    const erro = capturarErro(() => calcularNotaNecessariaAvaliacaoFinal(mediaSemestre));
    expect(erro).toMatchObject({ campo: "mediaSemestre", codigo, message: mensagem });
  });
});

describe("nota desconsiderada (matéria sem Quiz ou sem Outros)", () => {
  it("o peso da nota desconsiderada vai para a outra (soma continua 10)", () => {
    expect(calcularPesos(6, "quiz")).toEqual({ p1: 3, p2: 3, quiz: 0, outros: 4 });
    expect(calcularPesos(6, "outros")).toEqual({ p1: 3, p2: 3, quiz: 4, outros: 0 });
    expect(calcularPesos(10, "quiz")).toEqual({ p1: 5, p2: 5, quiz: 0, outros: 0 });
    expect(calcularPesos(0, "outros")).toEqual({ p1: 0, p2: 0, quiz: 10, outros: 0 });
    expect(calcularPesos(6, null)).toEqual({ p1: 3, p2: 3, quiz: 2, outros: 2 });
  });

  it.each([0, 2.5, 3.3, 6, 7.7, 10])("a soma dos pesos é 10 sem Quiz ou sem Outros (pesoProvas = %s)", (peso) => {
    for (const nota of ["quiz", "outros"] as const) {
      const { p1, p2, quiz, outros } = calcularPesos(peso, nota);
      expect(p1 + p2 + quiz + outros).toBeCloseTo(10, 10);
    }
  });

  it("sem Quiz: 6 | 7, 8, —, 10 → 8,5 (Outros com peso 4)", () => {
    const r = calcularMediaSemestre({ pesoProvas: 6, p1: 7, p2: 8, quiz: undefined, outros: 10, desconsiderar: "quiz" });
    expect(r.media).toBe(8.5);
    expect(r.pesos).toEqual({ p1: 3, p2: 3, quiz: 0, outros: 4 });
  });

  it("sem Outros: 8 | 5, 6, 10, — → 6,4 (Quiz com peso 2)", () => {
    const r = calcularMediaSemestre({ pesoProvas: 8, p1: 5, p2: 6, quiz: 10, outros: undefined, desconsiderar: "outros" });
    expect(r.media).toBe(6.4);
    expect(r.situacao).toBe("Avaliação final");
  });

  it("o valor digitado na nota desconsiderada é ignorado, inclusive se for inválido", () => {
    const base = { pesoProvas: 6, p1: 7, p2: 8, outros: 10, desconsiderar: "quiz" } as const;
    expect(calcularMediaSemestre({ ...base, quiz: 0 }).media).toBe(8.5);
    expect(calcularMediaSemestre({ ...base, quiz: 11 }).media).toBe(8.5);
    expect(calcularMediaSemestre({ ...base, quiz: NaN }).media).toBe(8.5);
  });

  it("as notas consideradas continuam obrigatórias", () => {
    const erro = capturarErro(() =>
      calcularMediaSemestre({ pesoProvas: 6, p1: 7, p2: 8, quiz: 9, outros: undefined, desconsiderar: "quiz" }),
    );
    expect(erro.campo).toBe("outros");
  });

  it("a nota desconsiderada não fica pendente", () => {
    expect(
      notasPendentes({ pesoProvas: 6, p1: 7, p2: 8, quiz: undefined, outros: 10, desconsiderar: "quiz" }),
    ).toEqual([]);
    expect(
      notasPendentes({ pesoProvas: 6, p1: 7, p2: 8, quiz: undefined, outros: undefined, desconsiderar: "quiz" }),
    ).toEqual(["outros"]);
  });

  it("nota necessária sem Quiz: 6 | 7, 8, —, _ → 6,2 em Outros (peso 4)", () => {
    // conhecidas: 7*3 + 8*3 = 45; 6,1 → 6,94 → 6,9 (não); 6,2 → 6,98 → 7,0 (sim)
    const r = calcularNotaNecessaria({
      pesoProvas: 6, p1: 7, p2: 8, quiz: undefined, outros: undefined, desconsiderar: "quiz",
    });
    expect(r).toMatchObject({ tipo: "possivel", notaNecessaria: 6.2, camposPendentes: ["outros"], pesoPendente: 4 });
  });

  it("nota necessária sem Outros: 6 | 10, 10, _, — → 2,4 em Quiz (peso 4)", () => {
    const r = calcularNotaNecessaria({
      pesoProvas: 6, p1: 10, p2: 10, quiz: undefined, outros: 5, desconsiderar: "outros",
    });
    expect(r).toMatchObject({ tipo: "possivel", notaNecessaria: 2.4, camposPendentes: ["quiz"], pesoPendente: 4 });
  });
});
