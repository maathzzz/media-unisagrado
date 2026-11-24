import type { ReactNode } from "react";
import { formatarMedia, NOTA_MAXIMA } from "@/lib/calculo-media";

type Situacao = "Aprovado" | "Avaliação final" | "Reprovado";

const ESTILO_SITUACAO: Record<Situacao, { selo: string; barra: string }> = {
  Aprovado: { selo: "bg-emerald-600 text-white", barra: "bg-emerald-500" },
  "Avaliação final": { selo: "bg-brand-gold text-brand-dark", barra: "bg-brand-gold" },
  Reprovado: { selo: "bg-brand-red text-white", barra: "bg-brand-red" },
};

type Marcador = { valor: number; rotulo: string };

type CartaoResultadoProps = {
  /** Nome da aba, exibido no cabeçalho do cartão. */
  titulo: string;
  rotuloValor: string;
  valor: number | null;
  situacao?: Situacao;
  /** Linha secundária abaixo do valor (ex.: média sem arredondamento). */
  detalhe?: ReactNode;
  marcadores: Marcador[];
  /** Cor da barra quando não há situação (classe Tailwind de fundo). */
  corBarra?: string;
  children?: ReactNode;
};

export default function CartaoResultado({
  titulo,
  rotuloValor,
  valor,
  situacao,
  detalhe,
  marcadores,
  corBarra = "bg-line",
  children,
}: CartaoResultadoProps) {
  const pct = (v: number) => `${Math.min(100, Math.max(0, (v / NOTA_MAXIMA) * 100))}%`;
  const estilo = situacao ? ESTILO_SITUACAO[situacao] : null;

  return (
    <aside
      aria-live="polite"
      className="h-fit overflow-hidden rounded-[10px] bg-white shadow-card lg:sticky lg:top-6"
    >
      <div className="bg-brand-dark px-6 py-4 text-white">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-gold">
          Resultado
        </p>
        <p className="mt-1 text-sm text-white/80">{titulo}</p>
      </div>

      <div className="p-6">
        <p className="text-sm font-semibold text-muted">{rotuloValor}</p>
        <p className="mt-1 text-5xl font-extrabold tabular-nums text-brand-dark">
          {valor === null ? "–" : formatarMedia(valor)}
        </p>
        {detalhe && <p className="mt-1 text-xs text-muted">{detalhe}</p>}

        {situacao && estilo && (
          <span
            className={`mt-4 inline-block rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-wide ${estilo.selo}`}
          >
            {situacao}
          </span>
        )}

        <div className="mt-6" aria-hidden>
          <div className="relative h-3 overflow-hidden rounded-full bg-surface">
            <div
              className={`h-full rounded-full transition-[width] duration-500 ${estilo?.barra ?? corBarra}`}
              style={{ width: valor === null ? "0%" : pct(valor) }}
            />
            {marcadores.map((m) => (
              <div
                key={m.valor}
                className="absolute inset-y-0 w-0.5 bg-brand-dark/70"
                style={{ left: pct(m.valor) }}
              />
            ))}
          </div>
          <div className="relative mt-1.5 h-4 text-[11px] font-semibold text-muted">
            <span className="absolute left-0">0</span>
            {marcadores.map((m) => (
              <span
                key={m.valor}
                className="absolute -translate-x-1/2 whitespace-nowrap"
                style={{ left: pct(m.valor) }}
              >
                {m.rotulo}
              </span>
            ))}
            <span className="absolute right-0">{NOTA_MAXIMA}</span>
          </div>
        </div>

        {children && <div className="mt-6 space-y-4 text-sm text-muted">{children}</div>}
      </div>
    </aside>
  );
}
