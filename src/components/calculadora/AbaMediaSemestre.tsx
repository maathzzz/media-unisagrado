"use client";

import type { FormEvent, ReactNode } from "react";
import { flushSync } from "react-dom";
import {
  calcularPesos,
  converterTextoEmNumero,
  formatarLista,
  formatarMedia,
  formatarPeso,
  formatarValorBruto,
  MEDIA_APROVACAO_DIRETA,
  MEDIA_REPROVACAO_DIRETA,
  MENSAGEM_ORIENTACAO_AVALIACAO_FINAL,
  ROTULO_NOTA,
  type CampoNota,
  type CampoSemestre,
  type Pesos,
  type ResultadoNotaNecessaria,
  type ResultadoSemestre,
} from "@/lib/calculo-media";
import Botoes from "./Botoes";
import CampoNumero from "./CampoNumero";
import CartaoResultado from "./CartaoResultado";
import type { Formulario } from "./useFormulario";

/** Resultado da aba 1: média completa, ou nota necessária quando há notas em branco. */
export type ResultadoAbaSemestre =
  | { tipo: "media"; media: ResultadoSemestre }
  | {
      tipo: "necessaria";
      necessaria: ResultadoNotaNecessaria;
      /** Quando não dá para atingir 7,0: o que falta para ao menos ir à avaliação final. */
      paraAvaliacaoFinal: ResultadoNotaNecessaria | null;
    };

const COMPONENTES: { campo: CampoNota; descricao: string }[] = [
  { campo: "p1", descricao: "Primeira prova" },
  { campo: "p2", descricao: "Segunda prova" },
  { campo: "quiz", descricao: "Atividades do tipo quiz" },
  { campo: "outros", descricao: "Demais atividades avaliativas" },
];

const MARCADORES_SEMESTRE = [
  { valor: MEDIA_REPROVACAO_DIRETA, rotulo: formatarMedia(MEDIA_REPROVACAO_DIRETA) },
  { valor: MEDIA_APROVACAO_DIRETA, rotulo: formatarMedia(MEDIA_APROVACAO_DIRETA) },
];

/** Pesos para pré-visualização, ou null se o peso das provas ainda for inválido. */
function pesosOuNulo(texto: string): Pesos | null {
  try {
    return calcularPesos(converterTextoEmNumero(texto));
  } catch {
    return null;
  }
}

const Destaque = ({ children }: { children: ReactNode }) => (
  <strong className="font-bold text-brand-dark">{children}</strong>
);

type AbaMediaSemestreProps = {
  idBase: string;
  form: Formulario<CampoSemestre, ResultadoAbaSemestre>;
  onIrParaAvaliacaoFinal: (mediaSemestre: number) => void;
};

export default function AbaMediaSemestre({
  idBase,
  form,
  onIrParaAvaliacaoFinal,
}: AbaMediaSemestreProps) {
  const pesos = pesosOuNulo(form.textos.pesoProvas);

  function enviar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const elemento = e.currentTarget;
    flushSync(() => form.calcular());
    elemento.querySelector<HTMLInputElement>('[aria-invalid="true"]')?.focus();
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <form noValidate onSubmit={enviar} className="rounded-[10px] bg-white p-5 shadow-card sm:p-8">
        <h2 className="text-lg font-bold text-brand-dark">Média do semestre</h2>
        <p className="mt-1 text-sm text-muted">
          Notas de 0 a 10, com decimais (ex.: 7,5). A soma de todos os pesos é sempre 10.
        </p>

        {/* Pesos */}
        <fieldset className="mt-6 rounded-[10px] border border-line bg-surface p-4">
          <legend className="sr-only">Distribuição dos pesos</legend>
          <CampoNumero
            id={`${idBase}-pesoProvas`}
            rotulo="Peso total das provas (P1 + P2)"
            placeholder="Ex.: 6"
            valor={form.textos.pesoProvas}
            onChange={(v) => form.alterar("pesoProvas", v)}
            erro={form.erroDe("pesoProvas")}
            ajuda="De 0 a 10. P1 e P2 dividem esse peso igualmente; o restante é dividido igualmente entre Quiz e Outros."
          />
          <ul aria-label="Pesos calculados" className="mt-3 grid grid-cols-4 gap-2 text-center">
            {COMPONENTES.map(({ campo }) => (
              <li key={campo} className="rounded-[10px] bg-white px-2 py-2 shadow-sm">
                <span className="block text-[11px] font-semibold uppercase tracking-wide text-muted">
                  {ROTULO_NOTA[campo]}
                </span>
                <span className="block text-lg font-extrabold text-brand-red tabular-nums">
                  {pesos ? formatarPeso(pesos[campo]) : "–"}
                </span>
              </li>
            ))}
          </ul>
        </fieldset>

        {/* Notas */}
        <fieldset className="mt-6">
          <legend className="text-sm font-bold uppercase tracking-wide text-brand-dark">Notas</legend>
          <p className="mb-4 mt-1 text-xs text-muted">
            Ainda não tem alguma nota? Deixe o campo em branco: a calculadora mostra quanto você
            precisa tirar nele para atingir média {formatarMedia(MEDIA_APROVACAO_DIRETA)}.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            {COMPONENTES.map(({ campo, descricao }) => (
              <CampoNumero
                key={campo}
                id={`${idBase}-${campo}`}
                rotulo={ROTULO_NOTA[campo]}
                placeholder="Sem nota ainda"
                complemento={
                  pesos && (
                    <span className="rounded-full bg-brand-gold/20 px-2 py-0.5 text-[11px] font-bold text-brand-dark">
                      peso {formatarPeso(pesos[campo])}
                    </span>
                  )
                }
                ajuda={descricao}
                valor={form.textos[campo]}
                onChange={(v) => form.alterar(campo, v)}
                erro={form.erroDe(campo)}
              />
            ))}
          </div>
        </fieldset>

        <Botoes onLimpar={form.limpar} />
      </form>

      {form.resultado?.tipo === "necessaria" ? (
        <CartaoNotaNecessaria
          necessaria={form.resultado.necessaria}
          paraAvaliacaoFinal={form.resultado.paraAvaliacaoFinal}
        />
      ) : (
        <CartaoMedia
          resultado={form.resultado?.media ?? null}
          onIrParaAvaliacaoFinal={onIrParaAvaliacaoFinal}
        />
      )}
    </div>
  );
}

function CartaoMedia({
  resultado,
  onIrParaAvaliacaoFinal,
}: {
  resultado: ResultadoSemestre | null;
  onIrParaAvaliacaoFinal: (mediaSemestre: number) => void;
}) {
  return (
    <CartaoResultado
      titulo="Média do semestre"
      rotuloValor="Média do semestre"
      valor={resultado?.media ?? null}
      situacao={resultado?.situacao}
      detalhe={
        resultado &&
        resultado.mediaBruta !== resultado.media &&
        `Sem arredondamento: ${formatarValorBruto(resultado.mediaBruta)}`
      }
      marcadores={MARCADORES_SEMESTRE}
    >
      {!resultado && (
        <p>Preencha o peso das provas e as notas que você já tem, e clique em Calcular.</p>
      )}

      {resultado?.situacao === "Aprovado" && (
        <p>
          Média igual ou superior a {formatarMedia(MEDIA_APROVACAO_DIRETA)}: aprovado sem
          avaliação final.
        </p>
      )}

      {resultado?.situacao === "Reprovado" && (
        <p>
          Média inferior a {formatarMedia(MEDIA_REPROVACAO_DIRETA)}: reprovado, sem avaliação
          final.
        </p>
      )}

      {resultado?.situacao === "Avaliação final" && (
        <>
          <p className="rounded-[10px] bg-brand-gold/15 p-3 text-brand-dark">
            {MENSAGEM_ORIENTACAO_AVALIACAO_FINAL}
          </p>
          <button
            type="button"
            onClick={() => onIrParaAvaliacaoFinal(resultado.media)}
            className="w-full rounded-full bg-brand-red px-6 py-3 text-sm font-bold text-white shadow-md transition hover:bg-brand-red-bright"
          >
            Quanto preciso na avaliação final? →
          </button>
        </>
      )}
    </CartaoResultado>
  );
}

/** "em Outros" / "em cada uma das notas pendentes (Quiz e Outros)". */
function ondeTirar(campos: CampoNota[]): string {
  const lista = formatarLista(campos.map((c) => ROTULO_NOTA[c]));
  return campos.length === 1 ? `em ${lista}` : `em cada uma das notas pendentes (${lista})`;
}

function CartaoNotaNecessaria({
  necessaria,
  paraAvaliacaoFinal,
}: {
  necessaria: ResultadoNotaNecessaria;
  paraAvaliacaoFinal: ResultadoNotaNecessaria | null;
}) {
  const alvo = formatarMedia(necessaria.mediaAlvo);
  const onde = ondeTirar(necessaria.camposPendentes);
  const pendentes = formatarLista(necessaria.camposPendentes.map((c) => ROTULO_NOTA[c]));

  if (necessaria.tipo === "possivel") {
    return (
      <CartaoResultado
        titulo="Quanto você precisa tirar"
        rotuloValor="Nota necessária"
        valor={necessaria.notaNecessaria}
        detalhe={`Pendente${necessaria.camposPendentes.length > 1 ? "s" : ""}: ${pendentes}`}
        marcadores={[]}
        corBarra="bg-brand-red"
      >
        <p>
          Para atingir média <Destaque>{alvo}</Destaque>, você precisa tirar pelo menos{" "}
          <Destaque>{formatarMedia(necessaria.notaNecessaria)}</Destaque> {onde}.
        </p>
        <p className="rounded-[10px] bg-surface p-3 text-xs">
          Com essa nota, sua média do semestre seria {formatarMedia(necessaria.mediaResultante)}
          {" "}(o arredondamento já foi considerado).
        </p>
      </CartaoResultado>
    );
  }

  if (necessaria.tipo === "garantido") {
    return (
      <CartaoResultado
        titulo="Quanto você precisa tirar"
        rotuloValor="Média mínima garantida"
        valor={necessaria.mediaMinima}
        situacao="Aprovado"
        detalhe={`Pendente${necessaria.camposPendentes.length > 1 ? "s" : ""}: ${pendentes}`}
        marcadores={MARCADORES_SEMESTRE}
      >
        <p>
          Mesmo tirando <Destaque>0</Destaque> {onde}, sua média será de pelo menos{" "}
          <Destaque>{formatarMedia(necessaria.mediaMinima)}</Destaque>: a aprovação já está
          garantida.
        </p>
      </CartaoResultado>
    );
  }

  return (
    <CartaoResultado
      titulo="Quanto você precisa tirar"
      rotuloValor="Média máxima possível"
      valor={necessaria.mediaMaxima}
      situacao={necessaria.situacaoMaxima}
      detalhe={`Pendente${necessaria.camposPendentes.length > 1 ? "s" : ""}: ${pendentes}`}
      marcadores={MARCADORES_SEMESTRE}
    >
      <p>
        Mesmo tirando <Destaque>10</Destaque> {onde}, a média máxima possível é{" "}
        <Destaque>{formatarMedia(necessaria.mediaMaxima)}</Destaque>: não é possível atingir{" "}
        {alvo}.
      </p>

      {paraAvaliacaoFinal?.tipo === "possivel" && (
        <p className="rounded-[10px] bg-brand-gold/15 p-3 text-brand-dark">
          Para ao menos ir para a avaliação final (média{" "}
          {formatarMedia(paraAvaliacaoFinal.mediaAlvo)}), você precisa tirar pelo menos{" "}
          <Destaque>{formatarMedia(paraAvaliacaoFinal.notaNecessaria)}</Destaque> {onde}.
        </p>
      )}
      {paraAvaliacaoFinal?.tipo === "garantido" && (
        <p className="rounded-[10px] bg-brand-gold/15 p-3 text-brand-dark">
          A avaliação final já está garantida: mesmo tirando 0 {onde}, sua média será de pelo
          menos {formatarMedia(paraAvaliacaoFinal.mediaMinima)}.
        </p>
      )}
      {necessaria.situacaoMaxima === "Reprovado" && (
        <p>
          Mesmo com nota máxima, a média fica abaixo de{" "}
          {formatarMedia(MEDIA_REPROVACAO_DIRETA)}.
        </p>
      )}
    </CartaoResultado>
  );
}
