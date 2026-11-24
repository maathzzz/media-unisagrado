import Image from "next/image";
import {
  AGENDA_URL,
  AUTHOR_URL,
  LOGO_HEIGHT,
  LOGO_URL,
  LOGO_WIDTH,
  REPO_URL,
  SITE_URL,
} from "@/lib/brand";

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
            Links úteis
          </h2>
          <ul className="space-y-1">
            <li>
              <a
                href={AGENDA_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-white hover:text-brand-gold transition-colors"
              >
                Calendário Acadêmico
              </a>
            </li>
            <li>
              <a
                href={SITE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-white hover:text-brand-gold transition-colors"
              >
                Site Oficial
              </a>
            </li>
          </ul>
          <a
            href={REPO_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-block font-semibold text-white hover:text-brand-gold transition-colors"
          >
            GitHub
          </a>
        </div>
      </div>

      <div className="border-t border-white/10">
        <p className="mx-auto max-w-6xl px-4 py-4 text-xs text-white/60">
          Projeto não oficial, feito por{" "}
          <a
            href={AUTHOR_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-white/80 underline-offset-2 hover:text-brand-gold hover:underline transition-colors"
          >
            Matheus de Amorim Favero
          </a>
        </p>
      </div>
    </footer>
  );
}
