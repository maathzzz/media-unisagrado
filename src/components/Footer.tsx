import Image from "next/image";
import { LOGO_HEIGHT, LOGO_URL, LOGO_WIDTH, SITE_URL } from "@/lib/brand";

export default function Footer() {
  return (
    <footer className="bg-brand-dark text-white/80">
      <div className="h-1.5 bg-gradient-to-r from-brand-gold via-brand-red-bright to-brand-red" />
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-2">
        <div>
          <Image
            src={LOGO_URL}
            alt="UNISAGRADO"
            width={LOGO_WIDTH}
            height={LOGO_HEIGHT}
            className="h-12 w-auto brightness-0 invert"
          />
          <p className="mt-4 max-w-sm text-sm">
            Ferramenta de apoio aos estudantes para estimar médias e notas
            necessárias. Os resultados não substituem as informações oficiais
            da instituição.
          </p>
        </div>

        <div className="text-sm sm:text-right">
          <h2 className="mb-2 font-bold uppercase tracking-wide text-brand-gold">
            Contato
          </h2>
          <p>R. Irmã Arminda, 10-50 - Jardim Brasil</p>
          <p>Bauru - SP, 17011-160</p>
          <p className="mt-2">(14) 2107-7000</p>
          <a
            href={SITE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-block font-semibold text-white hover:text-brand-gold transition-colors"
          >
            unisagrado.edu.br
          </a>
        </div>
      </div>

      <div className="border-t border-white/10">
        <p className="mx-auto max-w-6xl px-4 py-4 text-xs text-white/60">
          Projeto não oficial, feito por estudantes. Marca e identidade visual
          pertencem ao UNISAGRADO.
        </p>
      </div>
    </footer>
  );
}
