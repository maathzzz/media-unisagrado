# Instrução: Implementação da Calculadora de Média e da Avaliação Final

## Objetivo

Implementar a calculadora de notas da universidade com **duas abas**:

1. **Média do semestre:** calcula a média a partir de P1, P2, Quiz e Outros e informa a situação do aluno.
2. **Avaliação final (exame):** calcula o resultado final de quem precisou fazer a avaliação final.

A lógica de cálculo deve ficar separada da interface. As abas apenas coletam os dados, chamam as funções de cálculo e exibem o resultado.

---

## Parte 1 — Média do semestre

### 1.1 Componentes da nota

| Componente | Descrição |
|---|---|
| P1 | Primeira prova |
| P2 | Segunda prova |
| Quiz | Atividades do tipo quiz |
| Outros | Demais atividades avaliativas |

### 1.2 Escala

- Cada nota vai de **0 a 10**, com decimais permitidos.
- A soma de todos os pesos é sempre **10**.

### 1.3 Distribuição dos pesos

1. O usuário informa o **peso total das provas** (`pesoProvas`).
2. P1 e P2 dividem esse peso **igualmente**:
   - `pesoP1 = pesoProvas / 2`
   - `pesoP2 = pesoProvas / 2`
3. O restante (`10 - pesoProvas`) é dividido **igualmente** entre Quiz e Outros:
   - `pesoQuiz = (10 - pesoProvas) / 2`
   - `pesoOutros = (10 - pesoProvas) / 2`

**Exemplo de referência:** `pesoProvas = 6`
- P1 = 3, P2 = 3
- Restante = 4 → Quiz = 2, Outros = 2

### 1.3.1 Matéria sem Quiz ou sem Outros

Algumas matérias não têm nota de Quiz ou não têm nota de Outros. Cada uma dessas duas notas tem a opção **"Não conta nesta matéria"** (checkbox):

- Só **uma** das duas pode ser desconsiderada por vez (Quiz **ou** Outros); P1 e P2 sempre contam.
- A nota desconsiderada fica com peso **0** e todo o restante (`10 - pesoProvas`) vai para a outra. A soma dos pesos continua **10**.
- O campo da nota desconsiderada fica bloqueado: não é obrigatório, não é validado, não aparece como pendente e o valor digitado nele é ignorado.

**Exemplo:** `pesoProvas = 6`, sem Quiz → P1 = 3, P2 = 3, Quiz = 0, Outros = 4.

### 1.4 Fórmula

```
mediaSemestre = (P1 * pesoP1 + P2 * pesoP2 + Quiz * pesoQuiz + Outros * pesoOutros) / 10
```

### 1.5 Situação após o semestre

| Média do semestre (arredondada) | Situação |
|---|---|
| Menor que 5,0 | **Reprovado** (automaticamente) |
| Maior ou igual a 5,0 e menor que 7,0 | **Avaliação final** |
| Maior ou igual a 7,0 | **Aprovado** (sem avaliação final) |

- A classificação usa a **média já arredondada** (ex.: 6,95 → 7,0 → Aprovado; 4,95 → 5,0 → Avaliação final).
- Quando a situação for **Avaliação final**, exibir a orientação:
  > "Não é necessário solicitar a avaliação final. Compareça no período divulgado no Calendário Acadêmico para realizar a prova."
- Quando a situação for **Avaliação final**, oferecer um atalho para a aba **Avaliação final** com a média do semestre já preenchida.

---

## Parte 2 — Avaliação final (exame)

### 2.1 Entradas

| Campo | Regra |
|---|---|
| Média do semestre | Preenchida automaticamente a partir da aba 1, quando disponível; também pode ser digitada manualmente. Deve estar entre **5,0 (inclusive) e 7,0 (exclusive)**. |
| Nota da avaliação final | De **0 a 10**, com decimais permitidos. |

### 2.2 Fórmula

```
mediaFinal = (mediaSemestre + notaAvaliacaoFinal) / 2
```

### 2.3 Situação final

| Média final (arredondada) | Situação |
|---|---|
| Maior ou igual a 6,0 | **Aprovado** |
| Menor que 6,0 | **Reprovado** |

- A classificação usa a **média final já arredondada**.
- A média do semestre usada no cálculo é a **média arredondada** da aba 1 (a mesma que o aluno vê).

### 2.4 Média do semestre fora da faixa

Se a média do semestre informada estiver fora da faixa [5,0; 7,0), a aba não deve calcular. Exibir mensagem explicativa:

- Média menor que 5,0: `"Com média inferior a 5,0, o estudante está reprovado e não realiza avaliação final."`
- Média maior ou igual a 7,0: `"Com média igual ou superior a 7,0, o estudante está aprovado sem avaliação final."`

---

## Constantes

Defina as regras em constantes, para facilitar ajustes:

```
CASAS_DECIMAIS = 1
MEDIA_REPROVACAO_DIRETA = 5      // abaixo disso: reprovado
MEDIA_APROVACAO_DIRETA = 7       // a partir disso: aprovado sem avaliação final
MEDIA_APROVACAO_FINAL = 6        // mínimo após a avaliação final
```

---

## Validações

| Situação | Comportamento esperado |
|---|---|
| Nota menor que 0 ou maior que 10 | Rejeitar com erro descritivo indicando o campo |
| Nota não numérica, `NaN`, vazia ou ausente | Rejeitar com erro descritivo indicando o campo |
| `pesoProvas` menor que 0 ou maior que 10 | Rejeitar com erro descritivo |
| `pesoProvas` não numérico ou ausente | Rejeitar com erro descritivo |
| `pesoProvas = 10` | Válido: Quiz e Outros passam a ter peso 0 |
| `pesoProvas = 0` | Válido: P1 e P2 passam a ter peso 0 |
| Média do semestre fora de [5,0; 7,0) na aba 2 | Não calcular; exibir a mensagem da seção 2.4 |

As mensagens de erro devem ser em português e identificar o campo inválido (ex.: `"A nota de P2 deve estar entre 0 e 10."`).

---

## Precisão e arredondamento

- Faça todos os cálculos com o valor **bruto**, sem arredondar etapas intermediárias dentro de cada fórmula.
- Arredonde o resultado de cada fórmula para **1 casa decimal** antes de classificar a situação.
- Trate erros de ponto flutuante (ex.: `8.299999999` deve resultar em `8.3`; `5.95` deve resultar em `6.0`, e não em `5.9`).

---

## Contratos sugeridos

```
calcularPesos(pesoProvas) -> { p1, p2, quiz, outros }

calcularMediaSemestre({ p1, p2, quiz, outros, pesoProvas }) -> {
  media: number,          // arredondada
  mediaBruta: number,     // sem arredondamento
  situacao: "Aprovado" | "Avaliação final" | "Reprovado",
  pesos: { p1, p2, quiz, outros }
}

calcularAvaliacaoFinal({ mediaSemestre, notaAvaliacaoFinal }) -> {
  mediaFinal: number,         // arredondada
  mediaFinalBruta: number,    // sem arredondamento
  situacao: "Aprovado" | "Reprovado"
}
```

- As funções devem ser **puras**: sem efeitos colaterais, sem acesso a DOM, armazenamento ou rede.
- Adapte nomes e tipagem à linguagem e às convenções já existentes no projeto.

---

## Interface

- Duas abas: **"Média do semestre"** e **"Avaliação final"**.
- Siga o padrão visual e de componentes já existente no projeto.
- Trocar de aba não deve apagar os valores já digitados.
- Na aba 1, a situação **Avaliação final** exibe a orientação da seção 1.5 e o atalho para a aba 2.
- Na aba 2, se a média vier da aba 1, o campo aparece preenchido e continua editável.

---

## Casos de teste obrigatórios

### Média do semestre

| # | pesoProvas | P1 | P2 | Quiz | Outros | Pesos (P1/P2/Quiz/Outros) | Média esperada | Situação |
|---|---|---|---|---|---|---|---|---|
| 1 | 6 | 7 | 8 | 9 | 10 | 3 / 3 / 2 / 2 | **8.3** | Aprovado |
| 2 | 8 | 5 | 6 | 10 | 10 | 4 / 4 / 1 / 1 | **6.4** | Avaliação final |
| 3 | 4 | 6 | 6 | 8 | 8 | 2 / 2 / 3 / 3 | **7.2** | Aprovado |
| 4 | 5 | 10 | 0 | 0 | 10 | 2.5 / 2.5 / 2.5 / 2.5 | **5.0** | Avaliação final (limite) |
| 5 | 10 | 7 | 9 | 0 | 0 | 5 / 5 / 0 / 0 | **8.0** | Aprovado |
| 6 | 0 | 0 | 0 | 6 | 8 | 0 / 0 / 5 / 5 | **7.0** | Aprovado (limite) |
| 7 | 6 | 0 | 0 | 0 | 0 | 3 / 3 / 2 / 2 | **0.0** | Reprovado |
| 8 | 6 | 10 | 10 | 10 | 10 | 3 / 3 / 2 / 2 | **10.0** | Aprovado |
| 9 | 6 | 7 | 7 | 6.75 | 7 | 3 / 3 / 2 / 2 | **7.0** (bruta 6.95) | Aprovado |
| 10 | 6 | 7 | 7 | 6.7 | 7 | 3 / 3 / 2 / 2 | **6.9** (bruta 6.94) | Avaliação final |
| 11 | 6 | 4 | 4 | 5 | 5 | 3 / 3 / 2 / 2 | **4.4** | Reprovado |
| 12 | 6 | 5 | 5 | 5 | 4.75 | 3 / 3 / 2 / 2 | **5.0** (bruta 4.95) | Avaliação final |
| 13 | 6 | 5 | 5 | 5 | 4.7 | 3 / 3 / 2 / 2 | **4.9** (bruta 4.94) | Reprovado |

### Avaliação final

| # | Média do semestre | Nota da avaliação final | Média final esperada | Situação |
|---|---|---|---|---|
| 14 | 6.4 | 5.6 | **6.0** | Aprovado (limite) |
| 15 | 6.0 | 10 | **8.0** | Aprovado |
| 16 | 6.9 | 5.1 | **6.0** | Aprovado |
| 17 | 5.0 | 6.9 | **6.0** (bruta 5.95) | Aprovado |
| 18 | 5.0 | 6.8 | **5.9** | Reprovado |
| 19 | 5.0 | 0 | **2.5** | Reprovado |

### Casos de erro

| # | Entrada | Resultado esperado |
|---|---|---|
| 20 | P1 = -1 | Erro em P1 |
| 21 | Quiz = 10.5 | Erro em Quiz |
| 22 | pesoProvas = 11 | Erro em pesoProvas |
| 23 | P2 ausente | Erro em P2 |
| 24 | Aba 2: média do semestre = 4.9 | Não calcula; mensagem de reprovação direta |
| 25 | Aba 2: média do semestre = 7.0 | Não calcula; mensagem de aprovação direta |
| 26 | Aba 2: nota da avaliação final = 11 | Erro na nota da avaliação final |

Também teste `calcularPesos` isoladamente e verifique que a soma dos pesos é sempre 10.

---

## Critérios de aceite

- [ ] Todos os casos de teste acima passam.
- [ ] A soma dos pesos retornados é sempre 10.
- [ ] A aba 1 classifica corretamente em Reprovado, Avaliação final e Aprovado.
- [ ] A aba 2 só calcula para médias do semestre entre 5,0 (inclusive) e 7,0 (exclusive).
- [ ] A aba 2 aprova com média final maior ou igual a 6,0.
- [ ] O atalho da aba 1 leva a média do semestre para a aba 2.
- [ ] As funções de cálculo não dependem da interface.

## Fora de escopo

- Cálculo da nota mínima necessária na avaliação final.
- Persistência das notas.

Se alguma regra parecer ambígua durante a implementação, **pare e pergunte** em vez de assumir.
