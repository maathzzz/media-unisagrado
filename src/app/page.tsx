import PageBanner from "@/components/PageBanner";
import CalculadoraMedia from "@/components/calculadora/CalculadoraMedia";

export default function Home() {
  return (
    <>
      <PageBanner
        title="Calculadora de Médias"
        subtitle="Calcule sua média do semestre e, se precisar, o resultado da avaliação final."
      />
      <div className="mx-auto max-w-6xl px-4 py-10 sm:py-14">
        <CalculadoraMedia />
      </div>
    </>
  );
}
