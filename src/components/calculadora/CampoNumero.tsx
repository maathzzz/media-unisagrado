import type { ReactNode, Ref } from "react";

type CampoNumeroProps = {
  id: string;
  rotulo: ReactNode;
  valor: string;
  onChange: (valor: string) => void;
  erro?: string;
  ajuda?: ReactNode;
  /** Conteúdo à direita do rótulo (ex.: peso do componente). */
  complemento?: ReactNode;
  placeholder?: string;
  /** Campo que não entra no cálculo: fica bloqueado (o texto digitado é mantido). */
  desabilitado?: boolean;
  /** Conteúdo abaixo da ajuda (ex.: opção de desconsiderar a nota). */
  rodape?: ReactNode;
  ref?: Ref<HTMLInputElement>;
};

export default function CampoNumero({
  id,
  rotulo,
  valor,
  onChange,
  erro,
  ajuda,
  complemento,
  placeholder = "0,0",
  desabilitado = false,
  rodape,
  ref,
}: CampoNumeroProps) {
  const idAjuda = `${id}-ajuda`;
  const idErro = `${id}-erro`;
  const descritoPor = [ajuda ? idAjuda : null, erro ? idErro : null].filter(Boolean).join(" ");

  return (
    <div className="min-w-0">
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <label htmlFor={id} className="text-sm font-semibold text-brand-dark">
          {rotulo}
        </label>
        {complemento}
      </div>
      <input
        id={id}
        ref={ref}
        type="text"
        inputMode="decimal"
        autoComplete="off"
        placeholder={placeholder}
        value={valor}
        disabled={desabilitado}
        aria-invalid={erro ? true : undefined}
        aria-describedby={descritoPor || undefined}
        onChange={(e) => onChange(e.target.value.replace(/[^\d.,-]/g, ""))}
        className={`w-full rounded-[10px] border bg-white px-3 py-2.5 text-sm text-brand-dark outline-none transition placeholder:text-muted/60 focus:ring-2 disabled:cursor-not-allowed disabled:bg-surface disabled:text-muted ${
          erro
            ? "border-brand-red ring-2 ring-brand-red/15 focus:ring-brand-red/25"
            : "border-line focus:border-brand-red focus:ring-brand-red/20"
        }`}
      />
      {ajuda && (
        <p id={idAjuda} className="mt-1.5 text-xs text-muted">
          {ajuda}
        </p>
      )}
      {erro && (
        <p id={idErro} className="mt-1.5 text-xs font-semibold text-brand-red">
          {erro}
        </p>
      )}
      {rodape}
    </div>
  );
}
