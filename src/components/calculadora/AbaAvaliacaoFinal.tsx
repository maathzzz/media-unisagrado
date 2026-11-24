"use client";

import type { FormEvent, ReactNode, Ref } from "react";
import { flushSync } from "react-dom";
import {
  formatarMedia,
  MEDIA_APROVACAO_DIRETA,
  MEDIA_APROVACAO_FINAL,
  MEDIA_REPROVACAO_DIRETA,
  MENSAGEM_ORIENTACAO_AVALIACAO_FINAL,
  type ResultadoNotaNecessariaAvaliacaoFinal,
} from "@/lib/calculo-media";
import Botoes from "./Botoes";
import CampoNumero from "./CampoNumero";
import CartaoResultado from "./CartaoResultado";
import type { Formulario } from "./useFormulario";

export type CampoAbaFinal = "mediaSemestre";

const Destaque = ({ children }: { children: ReactNode }) => (
  <strong className="font-bold text-brand-dark">{children}</strong>
);

type AbaAvaliacaoFinalProps = {
  idBase: string;
  form: Formulario<CampoAbaFinal, ResultadoNotaNecessariaAvaliacaoFinal>;
  /** Média trazida da aba 1 pelo atalho (texto formatado), se houver. */
  mediaImportada: string | null;
  onLimpar: () => void;
  mediaRef?: Ref<HTMLInputElement>;
};

export default function AbaAvaliacaoFinal({
  idBase,
  form,
  mediaImportada,
  onLimpar,
  mediaRef,
}: AbaAvaliacaoFinalProps) {
  const resultado = form.resultado;
  const aviso = form.erros.find((e) => e.foraDaFaixaDaAvaliacaoFinal);
  const veioDaAba1 = mediaImportada !== null && form.textos.mediaSemestre === mediaImportada;

  function enviar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const elemento = e.currentTarget;
    flushSync(() => form.calcular());
    elemento.querySelector<HTMLInputElement>('[aria-invalid="true"]')?.focus();
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <form noValidate onSubmit={enviar} className="rounded-[10px] bg-white p-5 shadow-card sm:p-8">
        <h2 className="text-lg font-bold text-brand-dark">Avaliação final</h2>
        <p className="mt-1 text-sm text-muted">
          Informe sua média do semestre e veja quanto precisa tirar na avaliação final para ser
          aprovado. Vale para médias de {formatarMedia(MEDIA_REPROVACAO_DIRETA)} a{" "}
          {formatarMedia(MEDIA_APROVACAO_DIRETA)} (exclusive).
        </p>

        <div className="mt-6 sm:max-w-xs">
          <CampoNumero
            id={`${idBase}-mediaSemestre`}
            ref={mediaRef}
            rotulo="Média do semestre"
            placeholder="Ex.: 6,4"
            complemento={
              veioDaAba1 && (
                <span className="rounded-full bg-brand-gold/20 px-2 py-0.5 text-[11px] font-bold text-brand-dark">
                  da aba 1
                </span>
              )
            }
            ajuda={
              veioDaAba1
                ? "Preenchida a partir da aba Média do semestre. Você pode editá-la."
                : "A média arredondada, como aparece na aba Média do semestre."
            }
            valor={form.textos.mediaSemestre}
            onChange={(v) => form.alterar("mediaSemestre", v)}
            erro={form.erroDe("mediaSemestre")}
          />
        </div>

        <div className="mt-6 rounded-[10px] border border-line bg-surface p-4 text-sm text-brand-dark">
          <p className="font-semibold">
            Média final = (média do semestre + nota da avaliação final) ÷ 2
          </p>
          <p className="mt-1 text-muted">
            Aprovado com média final igual ou superior a {formatarMedia(MEDIA_APROVACAO_FINAL)}.
          </p>
        </div>

        <Botoes onLimpar={onLimpar} />
      </form>

      <CartaoResultado
        titulo="Avaliação final"
        rotuloValor="Nota necessária na avaliação final"
        valor={resultado?.notaNecessaria ?? null}
        marcadores={[]}
        corBarra="bg-brand-red"
      >
        {aviso && (
          <p role="status" className="rounded-[10px] bg-brand-gold/15 p-3 text-brand-dark">
            {aviso.message}
          </p>
        )}
        {!resultado && !aviso && (
          <p>Preencha sua média do semestre e clique em Calcular.</p>
        )}
        {resultado && (
          <>
            <p>
              Com média do semestre <Destaque>{formatarMedia(resultado.mediaSemestre)}</Destaque>,
              você precisa tirar pelo menos{" "}
              <Destaque>{formatarMedia(resultado.notaNecessaria)}</Destaque> na avaliação final
              para ser aprovado.
            </p>
            <p className="rounded-[10px] bg-surface p-3 text-xs">
              Com essa nota, sua média final seria{" "}
              {formatarMedia(resultado.mediaFinalResultante)} (o arredondamento já foi
              considerado).
            </p>
            <p className="rounded-[10px] bg-brand-gold/15 p-3 text-xs text-brand-dark">
              {MENSAGEM_ORIENTACAO_AVALIACAO_FINAL}
            </p>
          </>
        )}
      </CartaoResultado>
    </div>
  );
}
