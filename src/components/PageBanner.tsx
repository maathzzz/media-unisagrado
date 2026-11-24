type PageBannerProps = {
  title: string;
  subtitle?: string;
};

export default function PageBanner({ title, subtitle }: PageBannerProps) {
  return (
    <section className="relative overflow-hidden bg-brand-dark text-white">
      {/* Decorative brand shapes */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-brand-red opacity-80"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-6 top-24 h-40 w-40 rounded-full bg-brand-gold opacity-90"
      />

      <div className="relative mx-auto max-w-6xl px-4 py-12 sm:py-16">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-brand-gold">
          Estudantes e Professores
        </p>
        <h1 className="max-w-xl text-3xl font-extrabold leading-tight sm:text-4xl">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-3 max-w-xl text-sm text-white/80 sm:text-base">{subtitle}</p>
        )}
      </div>

      <div className="h-1.5 bg-gradient-to-r from-brand-red via-brand-red-bright to-brand-gold" />
    </section>
  );
}
