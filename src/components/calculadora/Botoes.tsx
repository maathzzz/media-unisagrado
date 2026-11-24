export default function Botoes({ onLimpar }: { onLimpar: () => void }) {
  return (
    <div className="mt-8 flex flex-col gap-3 sm:flex-row">
      <button
        type="submit"
        className="rounded-full bg-brand-red px-8 py-3 text-sm font-bold uppercase tracking-wide text-white shadow-md transition hover:bg-brand-red-bright focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-red"
      >
        Calcular
      </button>
      <button
        type="button"
        onClick={onLimpar}
        className="rounded-full border-2 border-brand-gold px-8 py-3 text-sm font-bold uppercase tracking-wide text-brand-dark transition hover:bg-brand-gold"
      >
        Limpar
      </button>
    </div>
  );
}
