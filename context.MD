# CONTEXTO DO PROJETO: Portal Vestibular UNEB 2026 — Imersão Matemática (2 Dias)

## 1. Visão Geral e Objetivo Pedagógico

Aplicação web educacional interativa (Single-File HTML) voltada para estudantes do Ensino Médio (foco no programa Universidade Para Todos - UPT Bahia e Vestibular UNEB 2026).

- **Formato de Uso Híbrido:** Utilizada presencialmente pelo professor em 2 manhãs de aula (Modo Professor com gabaritos/dicas liberados via projeção/data-show) e pelos alunos no celular/computador (Modo Estudante para experimentação em tempo real e revisão autônoma pós-aula).
- **Estilo Visual:** Acadêmico Editorial Clássico (fundo creme/papel #FBF9F5, azul institucional UNEB #0F2C59, terracota #C84B31, verde sálvia #1E5128, tipografia serifada Fraunces nos títulos, Plus Jakarta Sans no corpo e JetBrains Mono em fórmulas/dados).

## 2. Arquitetura Técnica e Regras de Performance (App Performance Optimizer)

- **Zero Dependências de Gráficos Externos:** Todos os gráficos (parábola, círculo trigonométrico, curvas de juros e histograma) são renderizados em Canvas 2D nativo com suporte a alta densidade de pixels (devicePixelRatio) e eventos pointer/touch.
- **Single-File Architecture:** HTML5 semântico + Tailwind CSS (via CDN) + JavaScript Vanilla modularizado em um único objeto de estado global.
- **Zero Layout Shift (CLS = 0):** Todos os elementos `<canvas>` e painéis dinâmicos possuem altura/proporção reservadas.
- **Persistência Instantânea:** Progresso, XP acumulado, modo de visualização (Aluno/Professor), exercícios concluídos e respostas do simulado salvos no `localStorage` sob a chave `uneb_math_2026_v1`.

## 3. Divisão Pedagógica (Os 6 Eixos do Edital UNEB 2026)

### DIA 1: Núcleo Fundamental & Álgebra

1. **Eixo 1 — Lógica Matemática:**
   - Conteúdo: Proposições simples/compostas, conectivos (^, v, ->, <->), tabela-verdade, negação de condicional (P ^ ~Q) e contrapositiva (~Q -> ~P).
   - Minilab: Simulador de Proposições com chaves V/F para P e Q, destacando linha ativa na tabela-verdade + Desafio da Equivalência Lógica.
2. **Eixo 2 — Números, Sequências (PA/PG) e Análise Combinatória:**
   - Conteúdo: Conjuntos numéricos, PA ($a_n = a_1 + (n-1)r$), PG ($a_n = a_1 \cdot q^{n-1}$), Permutação ($P_n = n!$), Arranjo ($A_{n,p} = \frac{n!}{(n-p)!}$) e Combinação ($C_{n,p} = \frac{n!}{p!(n-p)!}$).
   - Minilab: Comparador visual Arranjo vs. Combinação com sliders para n e p + Gerador de termos e soma de PA/PG.
3. **Eixo 3 — Álgebra, Polinômios, Matrizes e Funções:**
   - Conteúdo: Função afim, quadrática ($f(x) = ax^2 + bx + c$), exponencial, logarítmica, modular e sistemas lineares.
   - Minilab: Modulador de Parábola em `<canvas>` com sliders para coeficientes a, b, c, calculando discriminante ($\Delta$), raízes reais ($x_1, x_2$) e vértice ($X_v, Y_v$).

### DIA 2: Formas, Finanças & Tratamento da Informação

4. **Eixo 4 — Geometria Plana, Espacial, Analítica e Trigonometria:**
   - Conteúdo: Semelhança, áreas, volumes de sólidos (prisma, pirâmide, cilindro, cone, esfera), retas/circunferências e ciclo trigonométrico.
   - Minilab: Círculo Trigonométrico Interativo em `<canvas>` (suporte a drag/touch e botões de arcos notáveis 0°, 30°, 45°, 60°, 90°, 180°, 270°) exibindo seno, cosseno e tangente em tempo real.
2. **Eixo 5 — Proporcionalidade e Matemática Financeira:**
   - Conteúdo: Porcentagem, descontos/acréscimos sucessivos, Juros Simples ($M = C(1 + i \cdot t)$) vs. Juros Compostos ($M = C(1 + i)^t$).
   - Minilab: Comparador gráfico em `<canvas>` da reta (Juros Simples) vs. curva exponencial (Juros Compostos) com sliders de capital, taxa mensal e tempo.
3. **Eixo 6 — Tratamento da Informação e Estatística Descritiva:**
   - Conteúdo: Leitura de tabelas (problema prático da papelaria/UPT), ROL, amplitude total ($AA = X_{max} - X_{min}$), Regra de Sturges ($i = 1 + 3,3 \log_{10}(n)$), amplitude de classe ($h = AA / i$), medidas de tendência central (média, mediana, moda) e guia de Estatística Descritiva no Excel (base UFSC: 5434 alunos, gráfico de barras horizontais vs. colunas, suplemento Ferramentas de Análise).
   - Minilab: Calculadora de Sturges + Analisador de ROL e Histograma em `<canvas>` com conjuntos de dados reais do caderno (Pesos de 50 ratos, Vendas de ventiladores, Cursos UFSC).

## 4. Mapa do Código para Modificações Rápidas

- **Estado e Persistência (`state` / `saveState`):** Controla `currentTab` ('dia1', 'dia2', 'simulado'), `teacherMode` (boolean), `xp` (number), `completedLabs` (array) e `practiceDone` (objeto).
- **Questões Rápidas por Eixo (`practiceQuestions`):** Objeto indexado de 1 a 6 contendo enunciado, alternativas, índice correto e explicação detalhada para os 6 eixos.
- **Banco do Simulado (`simuladoQuestions`):** Array de objetos com as questões no padrão UNEB (5 alternativas A–E, tag do eixo, enunciado e resolução passo a passo).
- **Funções de Renderização Canvas:**
  - `drawAlgebraCanvas()`: Desenha eixos cartesianos, parábola, raízes e vértice do Eixo 3.
  - `drawTrigCanvas()`: Desenha ciclo trigonométrico, projeções de seno/cosseno e ângulo interativo do Eixo 4.
  - `drawFinanceCanvas()`: Desenha comparativo Juros Simples vs. Compostos do Eixo 5.
  - `drawStatCanvas()`: Desenha histograma de distribuição de frequências do Eixo 6.

## 5. Instruções para Novas Alterações

Ao modificar este projeto:

1. Mantenha toda a lógica autocontida ou modularizada sem introduzir bibliotecas externas pesadas de gráficos.
2. Preserve a responsividade mobile-first (alvos de toque >= 44px) e o suporte ao Modo Professor (que revela gabaritos comentados e notas de aula em todos os eixos).
3. Sempre que adicionar novos exercícios ou datasets estatísticos, utilize os dados oficiais do caderno (Editais UNEB, Módulo UPT Bahia, Base UFSC 5434 alunos, Lotes urbanos de Paulo Lopes/SC ou Vendas de ventiladores).
