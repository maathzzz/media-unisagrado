import Image from "next/image";
import Link from "next/link";
import { LOGO_HEIGHT, LOGO_URL, LOGO_WIDTH } from "@/lib/brand";

export default function Header() {
  return (
    <header className="bg-white shadow-[0_2px_10px_rgba(0,0,0,0.06)]">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4">
        <Link href="/" className="shrink-0" aria-label="Calculadora de Médias - início">
          <Image
            src={LOGO_URL}
            alt="UNISAGRADO"
            width={LOGO_WIDTH}
            height={LOGO_HEIGHT}
            priority
            className="h-14 w-auto sm:h-16"
          />
        </Link>
        <span className="hidden rounded-full bg-brand-gold px-4 min-[380px]:inline-block py-2 text-xs font-bold uppercase tracking-wide text-brand-dark sm:text-sm">
          Calculadora de Médias
        </span>
      </div>
    </header>
  );
}
