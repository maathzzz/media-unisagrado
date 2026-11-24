"use client";

import { useId, useRef, useState, type KeyboardEvent } from "react";
import { flushSync } from "react-dom";
import {
  calcularMediaSemestre,
  calcularNotaNecessaria,
  calcularNotaNecessariaAvaliacaoFinal,
  formatarMedia,
  MEDIA_APROVACAO_DIRETA,
  MEDIA_REPROVACAO_DIRETA,
  notasPendentes,
  validarEntradaNotaNecessaria,
  validarMediaParaAvaliacaoFinal,
  validarEntradaSemestre,
  type CampoSemestre,
  type EntradaSemestre,
  type ResultadoNotaNecessariaAvaliacaoFinal,
} from "@/lib/calculo-media";
import AbaAvaliacaoFinal, { type CampoAbaFinal } from "./AbaAvaliacaoFinal";
import AbaMediaSemestre, { type ResultadoAbaSemestre } from "./AbaMediaSemestre";
import { useFormulario, type Numeros, type Saida, type Textos } from "./useFormulario";

const ABAS = [
  { id: "semestre", rotulo: "Média do semestre" },
  { id: "final", rotulo: "Avaliação final" },
] as const;
type Aba = (typeof ABAS)[number]["id"];

const SEMESTRE_VAZIO: Textos<CampoSemestre> = { pesoProvas: "", p1: "", p2: "", quiz: "", outros: "" };
const FINAL_VAZIO: Textos<CampoAbaFinal> = { mediaSemestre: "" };

function executarSemestre(entrada: EntradaSemestre): Saida<ResultadoAbaSemestre> {
  // Todas as notas preenchidas: média do semestre normal.
  if (notasPendentes(entrada).length === 0) {
    const erros = validarEntradaSemestre(entrada);
    return erros.length > 0
      ? { erros }
      : { resultado: { tipo: "media", media: calcularMediaSemestre(entrada) } };
  }

  // Alguma nota em branco: quanto é preciso tirar nela(s) para atingir 7,0.
  const erros = validarEntradaNotaNecessaria(entrada);
  if (erros.length > 0) return { erros };

  const necessaria = calcularNotaNecessaria(entrada, MEDIA_APROVACAO_DIRETA);
  const paraAvaliacaoFinal =
    necessaria.tipo === "impossivel" && necessaria.situacaoMaxima === "Avaliação final"
      ? calcularNotaNecessaria(entrada, MEDIA_REPROVACAO_DIRETA)
      : null;
  return { resultado: { tipo: "necessaria", necessaria, paraAvaliacaoFinal } };
}

/** Aba 2: só a média do semestre → nota necessária na avaliação final. */
function executarFinal({
  mediaSemestre,
}: Numeros<CampoAbaFinal>): Saida<ResultadoNotaNecessariaAvaliacaoFinal> {
  const erros = validarMediaParaAvaliacaoFinal(mediaSemestre);
  return erros.length > 0
    ? { erros }
    : { resultado: calcularNotaNecessariaAvaliacaoFinal(mediaSemestre) };
}

export default function CalculadoraMedia() {
  const idBase = useId();
  const idAba = (aba: Aba) => `${idBase}-aba-${aba}`;
  const idPainel = (aba: Aba) => `${idBase}-painel-${aba}`;

  const [aba, setAba] = useState<Aba>("semestre");
  const semestre = useFormulario(SEMESTRE_VAZIO, executarSemestre);
  const final = useFormulario(FINAL_VAZIO, executarFinal);
  const [mediaImportada, setMediaImportada] = useState<string | null>(null);

  const abasRef = useRef<HTMLDivElement>(null);
  const mediaFinalRef = useRef<HTMLInputElement>(null);

  function irParaAvaliacaoFinal(mediaSemestre: number) {
    const texto = formatarMedia(mediaSemestre);
    flushSync(() => {
      final.preencher({ mediaSemestre: texto }, { calcular: true });
      setMediaImportada(texto);
      setAba("final");
    });
    abasRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    mediaFinalRef.current?.focus({ preventScroll: true });
  }

  function limparFinal() {
    final.limpar();
    setMediaImportada(null);
  }

  function navegarPorTeclado(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight" && e.key !== "Home" && e.key !== "End") {
      return;
    }
    e.preventDefault();
    const atual = ABAS.findIndex((a) => a.id === aba);
    const proxima =
      e.key === "Home"
        ? 0
        : e.key === "End"
          ? ABAS.length - 1
          : (atual + (e.key === "ArrowRight" ? 1 : -1) + ABAS.length) % ABAS.length;
    setAba(ABAS[proxima].id);
    document.getElementById(idAba(ABAS[proxima].id))?.focus();
  }

  return (
    <div ref={abasRef} className="scroll-mt-6">
      <div
        role="tablist"
        aria-label="Tipo de cálculo"
        onKeyDown={navegarPorTeclado}
        className="mb-6 grid grid-cols-2 gap-1 rounded-full bg-white p-1.5 shadow-card sm:inline-grid"
      >
        {ABAS.map((a, i) => {
          const ativa = a.id === aba;
          return (
            <button
              key={a.id}
              id={idAba(a.id)}
              type="button"
              role="tab"
              aria-selected={ativa}
              aria-controls={idPainel(a.id)}
              tabIndex={ativa ? 0 : -1}
              onClick={() => setAba(a.id)}
              className={`flex items-center justify-center gap-1.5 whitespace-nowrap rounded-full px-2 py-2.5 text-xs font-bold transition min-[400px]:text-sm sm:gap-2 sm:px-6 ${
                ativa ? "bg-brand-red text-white shadow-md" : "text-brand-dark hover:text-brand-red"
              }`}
            >
              <span
                aria-hidden
                className={`grid h-5 w-5 shrink-0 place-items-center rounded-full text-[11px] ${
                  ativa ? "bg-white text-brand-red" : "bg-brand-gold text-brand-dark"
                }`}
              >
                {i + 1}
              </span>
              {a.rotulo}
            </button>
          );
        })}
      </div>

      {/* Os dois painéis ficam montados: trocar de aba não apaga o que foi digitado. */}
      <div
        role="tabpanel"
        id={idPainel("semestre")}
        aria-labelledby={idAba("semestre")}
        hidden={aba !== "semestre"}
      >
        <AbaMediaSemestre
          idBase={`${idBase}-semestre`}
          form={semestre}
          onIrParaAvaliacaoFinal={irParaAvaliacaoFinal}
        />
      </div>
      <div
        role="tabpanel"
        id={idPainel("final")}
        aria-labelledby={idAba("final")}
        hidden={aba !== "final"}
      >
        <AbaAvaliacaoFinal
          idBase={`${idBase}-final`}
          form={final}
          mediaImportada={mediaImportada}
          onLimpar={limparFinal}
          mediaRef={mediaFinalRef}
        />
      </div>
    </div>
  );
}
