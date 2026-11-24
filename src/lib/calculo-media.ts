/**
 * Regras de cálculo de média do UNISAGRADO (ver CALCULO_MEDIA.md).
 *
 * Funções puras: sem DOM, armazenamento ou rede. A interface apenas coleta
 * os dados, chama estas funções e exibe o resultado.
 */

// ---------------------------------------------------------------------------
// Constantes
// ---------------------------------------------------------------------------

export const CASAS_DECIMAIS = 1;
export const NOTA_MINIMA = 0;
export const NOTA_MAXIMA = 10;
/** Soma de todos os pesos. */
export const SOMA_PESOS = 10;
/** Abaixo disso: reprovado sem avaliação final. */
export const MEDIA_REPROVACAO_DIRETA = 5;
/** A partir disso: aprovado sem avaliação final. */
export const MEDIA_APROVACAO_DIRETA = 7;
/** Média mínima após a avaliação final. */
export const MEDIA_APROVACAO_FINAL = 6;

export const MENSAGEM_ORIENTACAO_AVALIACAO_FINAL =
  "Não é necessário solicitar a avaliação final. Compareça no período divulgado no Calendário Acadêmico para realizar a prova.";
export const MENSAGEM_REPROVADO_SEM_FINAL =
  "Com média inferior a 5,0, o estudante está reprovado e não realiza avaliação final.";
export const MENSAGEM_APROVADO_SEM_FINAL =
  "Com média igual ou superior a 7,0, o estudante está aprovado sem avaliação final.";

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------

export type SituacaoSemestre = "Aprovado" | "Avaliação final" | "Reprovado";
export type SituacaoFinal = "Aprovado" | "Reprovado";

export type CampoSemestre = "pesoProvas" | "p1" | "p2" | "quiz" | "outros";
export type CampoAvaliacaoFinal = "mediaSemestre" | "notaAvaliacaoFinal";
export type Campo = CampoSemestre | CampoAvaliacaoFinal;

export type CodigoErro =
  | "OBRIGATORIO"
  | "NAO_NUMERICO"
  | "FORA_DO_INTERVALO"
  | "REPROVADO_SEM_FINAL"
  | "APROVADO_SEM_FINAL";

export type Pesos = { p1: number; p2: number; quiz: number; outros: number };

/** Valor ainda não validado: pode vir vazio, ausente ou não numérico. */
type Entrada = number | null | undefined;

export type EntradaSemestre = {
  p1: Entrada;
  p2: Entrada;
  quiz: Entrada;
  outros: Entrada;
  pesoProvas: Entrada;
};

export type ResultadoSemestre = {
  /** Arredondada para CASAS_DECIMAIS. */
  media: number;
  /** Sem arredondamento. */
  mediaBruta: number;
  situacao: SituacaoSemestre;
  pesos: Pesos;
};

export type EntradaAvaliacaoFinal = {
  mediaSemestre: Entrada;
  notaAvaliacaoFinal: Entrada;
};

export type ResultadoAvaliacaoFinal = {
  /** Arredondada para CASAS_DECIMAIS. */
  mediaFinal: number;
  /** Sem arredondamento. */
  mediaFinalBruta: number;
  situacao: SituacaoFinal;
  /** Média do semestre efetivamente usada (arredondada). */
  mediaSemestre: number;
};

export class ErroCalculo extends Error {
  readonly campo: Campo;
  readonly codigo: CodigoErro;

  constructor(campo: Campo, codigo: CodigoErro, mensagem: string) {
    super(mensagem);
    this.name = "ErroCalculo";
    this.campo = campo;
    this.codigo = codigo;
  }

  /** Média do semestre fora de [5,0; 7,0): não é erro de digitação, é aviso. */
  get foraDaFaixaDaAvaliacaoFinal(): boolean {
    return this.codigo === "REPROVADO_SEM_FINAL" || this.codigo === "APROVADO_SEM_FINAL";
  }
}

// ---------------------------------------------------------------------------
// Utilitários
// ---------------------------------------------------------------------------

/** Como cada campo é citado nas mensagens de erro. */
const DESCRICAO_CAMPO: Record<Campo, string> = {
  pesoProvas: "o peso das provas",
  p1: "a nota de P1",
  p2: "a nota de P2",
  quiz: "a nota de Quiz",
  outros: "a nota de Outros",
  mediaSemestre: "a média do semestre",
  notaAvaliacaoFinal: "a nota da avaliação final",
};

const capitalizar = (texto: string) => texto.charAt(0).toUpperCase() + texto.slice(1);

/**
 * Arredonda para `casas` decimais (meio para cima), corrigindo erros de ponto
 * flutuante: 8.299999999 → 8.3; 5.95 → 6.0 (e não 5.9).
 */
export function arredondar(valor: number, casas: number = CASAS_DECIMAIS): number {
  const fator = 10 ** casas;
  // toPrecision(12) descarta o ruído binário (ex.: 59.49999999999999 → 59.5)
  return Math.round(Number((valor * fator).toPrecision(12))) / fator;
}

/**
 * Converte o texto digitado ("7,5", "7.5", "") em número.
 * Vazio → undefined; texto inválido → NaN (rejeitado na validação).
 */
export function converterTextoEmNumero(texto: string): number | undefined {
  const normalizado = texto.trim().replace(",", ".");
  if (normalizado === "") return undefined;
  return Number(normalizado);
}

/** Valida um valor de 0 a 10. Retorna o erro, ou null se for válido. */
export function validarValor(valor: unknown, campo: Campo): ErroCalculo | null {
  const descricao = DESCRICAO_CAMPO[campo];

  if (valor === undefined || valor === null || valor === "") {
    return new ErroCalculo(campo, "OBRIGATORIO", `Informe ${descricao}.`);
  }
  if (typeof valor !== "number" || Number.isNaN(valor)) {
    return new ErroCalculo(campo, "NAO_NUMERICO", `${capitalizar(descricao)} deve ser um número.`);
  }
  if (!(valor >= NOTA_MINIMA && valor <= NOTA_MAXIMA)) {
    return new ErroCalculo(
      campo,
      "FORA_DO_INTERVALO",
      `${capitalizar(descricao)} deve estar entre ${NOTA_MINIMA} e ${NOTA_MAXIMA}.`,
    );
  }
  return null;
}

function lancarSeHouverErro(erros: ErroCalculo[]): void {
  if (erros.length > 0) throw erros[0];
}

// ---------------------------------------------------------------------------
// Parte 1 — Média do semestre
// ---------------------------------------------------------------------------

/** Divide os pesos: provas (P1 = P2) e o restante (Quiz = Outros). Soma = 10. */
export function calcularPesos(pesoProvas: Entrada): Pesos {
  const erro = validarValor(pesoProvas, "pesoProvas");
  if (erro) throw erro;
  const peso = pesoProvas as number;
  const restante = SOMA_PESOS - peso;
  return { p1: peso / 2, p2: peso / 2, quiz: restante / 2, outros: restante / 2 };
}

/** Todos os erros de entrada da aba 1, na ordem dos campos. */
export function validarEntradaSemestre(entrada: EntradaSemestre): ErroCalculo[] {
  const campos: CampoSemestre[] = ["pesoProvas", "p1", "p2", "quiz", "outros"];
  return campos
    .map((campo) => validarValor(entrada[campo], campo))
    .filter((erro): erro is ErroCalculo => erro !== null);
}

export function classificarSemestre(mediaArredondada: number): SituacaoSemestre {
  if (mediaArredondada < MEDIA_REPROVACAO_DIRETA) return "Reprovado";
  if (mediaArredondada < MEDIA_APROVACAO_DIRETA) return "Avaliação final";
  return "Aprovado";
}

/** @throws {ErroCalculo} na primeira entrada inválida. */
export function calcularMediaSemestre(entrada: EntradaSemestre): ResultadoSemestre {
  lancarSeHouverErro(validarEntradaSemestre(entrada));

  const pesos = calcularPesos(entrada.pesoProvas);
  const { p1, p2, quiz, outros } = entrada as Record<CampoSemestre, number>;

  const mediaBruta =
    (p1 * pesos.p1 + p2 * pesos.p2 + quiz * pesos.quiz + outros * pesos.outros) / SOMA_PESOS;
  const media = arredondar(mediaBruta);

  return { media, mediaBruta, situacao: classificarSemestre(media), pesos };
}

// ---------------------------------------------------------------------------
// Parte 1b — Nota necessária (notas do semestre ainda não preenchidas)
// ---------------------------------------------------------------------------

export type CampoNota = Exclude<CampoSemestre, "pesoProvas">;
export const CAMPOS_NOTA: readonly CampoNota[] = ["p1", "p2", "quiz", "outros"];
export const ROTULO_NOTA: Record<CampoNota, string> = {
  p1: "P1",
  p2: "P2",
  quiz: "Quiz",
  outros: "Outros",
};

/** Menor variação de nota considerada na busca (1 casa decimal → 0,1). */
const PASSOS_POR_PONTO = 10 ** CASAS_DECIMAIS;

const estaEmBranco = (valor: unknown) => valor === undefined || valor === null || valor === "";

/** Notas que ainda não foram preenchidas, na ordem P1, P2, Quiz, Outros. */
export function notasPendentes(entrada: EntradaSemestre): CampoNota[] {
  return CAMPOS_NOTA.filter((campo) => estaEmBranco(entrada[campo]));
}

export type ResultadoNotaNecessaria = {
  mediaAlvo: number;
  camposPendentes: CampoNota[];
  /** Soma dos pesos das notas pendentes. */
  pesoPendente: number;
} & (
  | {
      /** Tirando `notaNecessaria` em cada nota pendente, a média atinge o alvo. */
      tipo: "possivel";
      notaNecessaria: number;
      /** Média (arredondada) obtida com essa nota. */
      mediaResultante: number;
    }
  | {
      /** O alvo já está garantido, mesmo tirando 0 nas notas pendentes. */
      tipo: "garantido";
      mediaMinima: number;
    }
  | {
      /** Nem tirando 10 nas notas pendentes a média atinge o alvo. */
      tipo: "impossivel";
      mediaMaxima: number;
      situacaoMaxima: SituacaoSemestre;
    }
);

/**
 * Erros de entrada para o cálculo de nota necessária: o peso das provas é
 * obrigatório; notas em branco são pendentes, mas as preenchidas precisam
 * ser válidas.
 */
export function validarEntradaNotaNecessaria(entrada: EntradaSemestre): ErroCalculo[] {
  const erros: ErroCalculo[] = [];
  const erroPeso = validarValor(entrada.pesoProvas, "pesoProvas");
  if (erroPeso) erros.push(erroPeso);
  for (const campo of CAMPOS_NOTA) {
    if (estaEmBranco(entrada[campo])) continue;
    const erro = validarValor(entrada[campo], campo);
    if (erro) erros.push(erro);
  }
  return erros;
}

/**
 * Menor nota (com CASAS_DECIMAIS casas) que o aluno precisa tirar em **cada**
 * nota pendente para que a média do semestre (arredondada) atinja `mediaAlvo`.
 * O resultado é verificado com as mesmas regras de calcularMediaSemestre,
 * inclusive o arredondamento (ex.: média bruta 6,95 → 7,0 conta como 7,0).
 *
 * @throws {ErroCalculo} se o peso das provas ou alguma nota preenchida for inválida.
 */
export function calcularNotaNecessaria(
  entrada: EntradaSemestre,
  mediaAlvo: number = MEDIA_APROVACAO_DIRETA,
): ResultadoNotaNecessaria {
  lancarSeHouverErro(validarEntradaNotaNecessaria(entrada));

  const pesos = calcularPesos(entrada.pesoProvas);
  const camposPendentes = notasPendentes(entrada);
  const pesoPendente = camposPendentes.reduce((soma, campo) => soma + pesos[campo], 0);
  const base = { mediaAlvo, camposPendentes, pesoPendente };

  /** Média (arredondada) se o aluno tirar `nota` em todas as pendentes. */
  const mediaCom = (nota: number) => {
    const preenchida = { ...entrada };
    for (const campo of camposPendentes) preenchida[campo] = nota;
    return calcularMediaSemestre(preenchida).media;
  };
  const notaNecessaria = menorNotaQueAtinge((nota) => mediaCom(nota) >= mediaAlvo);

  if (notaNecessaria === NOTA_MINIMA) {
    return { ...base, tipo: "garantido", mediaMinima: mediaCom(NOTA_MINIMA) };
  }
  if (notaNecessaria === null) {
    const mediaMaxima = mediaCom(NOTA_MAXIMA);
    return { ...base, tipo: "impossivel", mediaMaxima, situacaoMaxima: classificarSemestre(mediaMaxima) };
  }
  return { ...base, tipo: "possivel", notaNecessaria, mediaResultante: mediaCom(notaNecessaria) };
}

/**
 * Menor nota entre 0 e 10 (com CASAS_DECIMAIS casas) para a qual `atinge`
 * é verdadeiro, ou null se nem 10 bastar. `atinge` deve ser monotônica
 * (se uma nota basta, qualquer nota maior também basta).
 */
function menorNotaQueAtinge(atinge: (nota: number) => boolean): number | null {
  const passosMin = NOTA_MINIMA * PASSOS_POR_PONTO;
  const passosMax = NOTA_MAXIMA * PASSOS_POR_PONTO;
  const atingePassos = (passos: number) => atinge(passos / PASSOS_POR_PONTO);

  if (atingePassos(passosMin)) return NOTA_MINIMA;
  if (!atingePassos(passosMax)) return null;

  // Busca binária em passos inteiros (evita acumular erro de ponto flutuante).
  let falha = passosMin;
  let basta = passosMax;
  while (basta - falha > 1) {
    const meio = Math.floor((falha + basta) / 2);
    if (atingePassos(meio)) basta = meio;
    else falha = meio;
  }
  return basta / PASSOS_POR_PONTO;
}

// ---------------------------------------------------------------------------
// Parte 2 — Avaliação final
// ---------------------------------------------------------------------------

/**
 * Erros de entrada da aba 2. Se a média do semestre for válida mas estiver
 * fora de [5,0; 7,0), inclui o erro correspondente (REPROVADO_SEM_FINAL ou
 * APROVADO_SEM_FINAL) com a mensagem da seção 2.4.
 */
export function validarEntradaAvaliacaoFinal(entrada: EntradaAvaliacaoFinal): ErroCalculo[] {
  const erros = validarMediaParaAvaliacaoFinal(entrada.mediaSemestre);
  const erroNota = validarValor(entrada.notaAvaliacaoFinal, "notaAvaliacaoFinal");
  if (erroNota) erros.push(erroNota);
  return erros;
}

/**
 * Valida a média do semestre para a avaliação final: precisa ser um número
 * de 0 a 10 e, arredondada, estar em [5,0; 7,0). Fora da faixa, retorna o
 * erro REPROVADO_SEM_FINAL ou APROVADO_SEM_FINAL com a mensagem da seção 2.4.
 */
export function validarMediaParaAvaliacaoFinal(mediaSemestre: Entrada): ErroCalculo[] {
  const erro = validarValor(mediaSemestre, "mediaSemestre");
  if (erro) return [erro];

  const media = arredondar(mediaSemestre as number);
  if (media < MEDIA_REPROVACAO_DIRETA) {
    return [new ErroCalculo("mediaSemestre", "REPROVADO_SEM_FINAL", MENSAGEM_REPROVADO_SEM_FINAL)];
  }
  if (media >= MEDIA_APROVACAO_DIRETA) {
    return [new ErroCalculo("mediaSemestre", "APROVADO_SEM_FINAL", MENSAGEM_APROVADO_SEM_FINAL)];
  }
  return [];
}

export function classificarFinal(mediaFinalArredondada: number): SituacaoFinal {
  return mediaFinalArredondada >= MEDIA_APROVACAO_FINAL ? "Aprovado" : "Reprovado";
}

/**
 * @throws {ErroCalculo} se alguma entrada for inválida ou se a média do
 * semestre estiver fora de [5,0; 7,0) (nesse caso, não calcula).
 */
export function calcularAvaliacaoFinal(entrada: EntradaAvaliacaoFinal): ResultadoAvaliacaoFinal {
  lancarSeHouverErro(validarEntradaAvaliacaoFinal(entrada));

  // Usa a média arredondada, a mesma que o aluno vê na aba 1.
  const mediaSemestre = arredondar(entrada.mediaSemestre as number);
  const nota = entrada.notaAvaliacaoFinal as number;

  const mediaFinalBruta = (mediaSemestre + nota) / 2;
  const mediaFinal = arredondar(mediaFinalBruta);

  return { mediaFinal, mediaFinalBruta, situacao: classificarFinal(mediaFinal), mediaSemestre };
}

export type ResultadoNotaNecessariaAvaliacaoFinal = {
  /** Média do semestre usada (arredondada). */
  mediaSemestre: number;
  /** Menor nota na avaliação final que leva à aprovação. */
  notaNecessaria: number;
  /** Média final (arredondada) obtida com essa nota. */
  mediaFinalResultante: number;
};

/**
 * Menor nota (com CASAS_DECIMAIS casas) que o aluno precisa tirar na avaliação
 * final para ser aprovado (média final arredondada ≥ MEDIA_APROVACAO_FINAL).
 * Verificada com calcularAvaliacaoFinal, inclusive o arredondamento.
 *
 * @throws {ErroCalculo} se a média do semestre for inválida ou estiver fora
 * de [5,0; 7,0) (nesse caso, não há avaliação final).
 */
export function calcularNotaNecessariaAvaliacaoFinal(
  mediaSemestre: Entrada,
): ResultadoNotaNecessariaAvaliacaoFinal {
  lancarSeHouverErro(validarMediaParaAvaliacaoFinal(mediaSemestre));

  const mediaFinalCom = (nota: number) =>
    calcularAvaliacaoFinal({ mediaSemestre, notaAvaliacaoFinal: nota }).mediaFinal;
  const notaNecessaria = menorNotaQueAtinge((nota) => mediaFinalCom(nota) >= MEDIA_APROVACAO_FINAL);

  // Com média ≥ 5,0, tirar 10 sempre dá média final ≥ 7,5; só chega aqui se
  // as constantes forem alteradas para valores incoerentes.
  if (notaNecessaria === null) {
    throw new Error("Configuração inválida: a aprovação é inatingível na avaliação final.");
  }

  return {
    mediaSemestre: arredondar(mediaSemestre as number),
    notaNecessaria,
    mediaFinalResultante: mediaFinalCom(notaNecessaria),
  };
}

// ---------------------------------------------------------------------------
// Formatação (pt-BR)
// ---------------------------------------------------------------------------

/** 6.4 → "6,4"; 7 → "7,0". */
export function formatarMedia(valor: number): string {
  return valor.toLocaleString("pt-BR", {
    minimumFractionDigits: CASAS_DECIMAIS,
    maximumFractionDigits: CASAS_DECIMAIS,
  });
}

/** Valor sem arredondamento para exibição: 6.95 → "6,95" (sem ruído de ponto flutuante). */
export function formatarValorBruto(valor: number): string {
  return Number(valor.toPrecision(12)).toLocaleString("pt-BR", { maximumFractionDigits: 4 });
}

/** ["P1"] → "P1"; ["P1", "Quiz"] → "P1 e Quiz"; ["P1", "P2", "Quiz"] → "P1, P2 e Quiz". */
export function formatarLista(itens: readonly string[]): string {
  if (itens.length <= 1) return itens.join("");
  return `${itens.slice(0, -1).join(", ")} e ${itens[itens.length - 1]}`;
}

/** 3 → "3"; 2.5 → "2,5"; 1.25 → "1,25". */
export function formatarPeso(valor: number): string {
  return valor.toLocaleString("pt-BR", { maximumFractionDigits: 2 });
}
