"use client";

import { useState } from "react";
import { converterTextoEmNumero, type ErroCalculo } from "@/lib/calculo-media";

export type Textos<C extends string> = Record<C, string>;
export type Numeros<C extends string> = Record<C, number | undefined>;
export type Saida<R> = { resultado: R } | { erros: ErroCalculo[] };

export type Formulario<C extends string, R> = {
  textos: Textos<C>;
  erros: ErroCalculo[];
  resultado: R | null;
  alterar: (campo: C, valor: string) => void;
  calcular: () => void;
  limpar: () => void;
  /**
   * Preenche campos (ex.: atalho entre abas). Com `calcular`, já calcula com
   * os novos valores; sem, descarta erros e resultado.
   */
  preencher: (parcial: Partial<Textos<C>>, opcoes?: { calcular?: boolean }) => void;
  /** Mensagem de erro de digitação do campo (avisos de faixa ficam de fora). */
  erroDe: (campo: C) => string | undefined;
};

function converterTextos<C extends string>(textos: Textos<C>): Numeros<C> {
  return Object.fromEntries(
    Object.entries<string>(textos).map(([campo, texto]) => [campo, converterTextoEmNumero(texto)]),
  ) as Numeros<C>;
}

/**
 * Estado de um formulário de cálculo: textos digitados, erros e resultado.
 * `executar` recebe os valores convertidos e chama as funções puras de cálculo.
 */
export function useFormulario<C extends string, R>(
  vazio: Textos<C>,
  executar: (entrada: Numeros<C>) => Saida<R>,
): Formulario<C, R> {
  const [textos, setTextos] = useState(vazio);
  const [erros, setErros] = useState<ErroCalculo[]>([]);
  const [resultado, setResultado] = useState<R | null>(null);

  function aplicar(valores: Textos<C>) {
    const saida = executar(converterTextos(valores));
    if ("erros" in saida) {
      setErros(saida.erros);
      setResultado(null);
    } else {
      setErros([]);
      setResultado(saida.resultado);
    }
  }

  return {
    textos,
    erros,
    resultado,
    alterar(campo, valor) {
      setTextos((t) => ({ ...t, [campo]: valor }));
      setErros((es) => es.filter((e) => e.campo !== campo));
      setResultado(null);
    },
    calcular() {
      aplicar(textos);
    },
    limpar() {
      setTextos(vazio);
      setErros([]);
      setResultado(null);
    },
    preencher(parcial, opcoes) {
      const novos = { ...textos, ...parcial };
      setTextos(novos);
      if (opcoes?.calcular) {
        aplicar(novos);
      } else {
        setErros([]);
        setResultado(null);
      }
    },
    erroDe(campo) {
      return erros.find((e) => e.campo === campo && !e.foraDaFaixaDaAvaliacaoFinal)?.message;
    },
  };
}
