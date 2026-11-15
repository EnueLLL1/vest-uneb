# CONTEXTO DO PROJETO: Portal Vestibular UNEB 2026 — Imersão Matemática (2 Dias)

## 1. Visão Geral e Objetivo Pedagógico

Aplicação web educacional interativa modular em ES Modules voltada para estudantes do Ensino Médio (foco no programa Universidade Para Todos - UPT Bahia e Vestibular UNEB 2026).

- **Formato de Uso Híbrido:** Utilizada presencialmente pelo professor em 2 manhãs de aula (Modo Professor com gabaritos/dicas liberados via projeção/data-show) e pelos alunos no celular/computador (Modo Estudante para experimentação em tempo real e revisão autônoma pós-aula).
- **Estilo Visual:** Acadêmico UNEB (`#1e3a8a` primário, `#172554` azul escuro, `#0d9488` teal destaque, `#e2e8f0` bordas), tipografia serifada Merriweather nos títulos/notações matemáticas e Inter no corpo.

## 2. Arquitetura Técnica e Regras de Performance

- **Zero Dependências de Gráficos Externos:** Todos os gráficos (parábola, círculo trigonométrico, curvas de juros e histograma) são renderizados em Canvas 2D nativo com suporte a alta densidade de pixels (`devicePixelRatio`) e eventos pointer/touch.
- **Modular ES Modules + Tailwind CSS Estático:** HTML5 semântico (`index.html`), folha compilada estática (`css/app.css` + `css/custom.css`) para uso 100% offline sem runtime CDN e módulos ES nativos (`js/`), com `tailwind.config.js` e `css/input.css` para recompilação.
- **Zero Layout Shift:** Contêineres de `<canvas>` e painéis dinâmicos possuem altura/proporção reservadas e `loading="lazy"` nas imagens das questões.
- **Persistência Instantânea:** Progresso, XP acumulado, modo de visualização (Aluno/Professor), módulos concluídos e respostas dos simulados salvos no `localStorage` sob a chave `uneb_math_2026_v1` com validação na hidratação.

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

- **`index.html` & `css/` (`app.css`, `input.css`, `custom.css`):** Estrutura semântica (`day1`, `day2`, `quiz`), `<dialog id="confirm-dialog">`, estilos acessíveis e compilação Tailwind v3.
- **`js/state.js`:** Estado central (`getState`, `setState`, `loadState`, `saveState`, `subscribe`, `recalculateScore`, `markModuleComplete`, `resetStudentProgress`).
- **`js/app.js`:** Orquestração de inicialização, roteamento de abas (`day1`, `day2`, `quiz`), alternância Aluno/Professor e métricas do cabeçalho.
- **`js/data/banco_questoes.js`:** Fonte única oficial com as 4 edições (`uneb_2025`, `uneb_2024`, `uneb_2023`, `imersao_fixacao`, 51 questões e 17 figuras em `assets/`).
- **`js/modules/`:**
  - `logica.js`: Conectivos P e Q e desafio de equivalência lógica.
  - `combinatoria.js`: Arranjo vs. Combinação e calculadora de PA/PG.
  - `parabola.js` (`renderQuadratic`): Eixos cartesianos, parábola, raízes e vértice do Eixo 3.
  - `trig.js` (`renderTrigCircle`): Ciclo trigonométrico interativo do Eixo 4.
  - `financas.js` (`renderFinance`): Comparativo Juros Simples vs. Compostos do Eixo 5.
  - `stats.js` (`renderHistogramCanvas`): Sturges e histograma por classes do Eixo 6.
  - `quiz.js`: Motor do simulado, cronômetro adaptativo, navegação rápida e relatório por eixo.
- **`js/utils/`:** `canvas.js` (scaling HiDPI), `toast.js` (região viva acessível) e `confirm.js` (confirmação via `<dialog>`).
- **Pílulas de Vídeo Manim (Build-time offline):** `manim_animations/` (`.venv` Manim + MiKTeX local + TTS `VoiceStudio`), ativos otimizados em `assets/videos/` e `assets/posters/` e diretrizes completas em `docs/manim_video_pipeline.md`.
- **Scripts & Testes:** `iniciar.bat` (servidor HTTP local seguro), `verify_banco.js` (integridade do banco e imagens), `test/test_math.js`, `test/test_state.js` e `test/test_ui_hierarchy.js`.

## 5. Instruções para Novas Alterações

Ao modificar este projeto:

1. Mantenha a arquitetura modular ES sem introduzir bibliotecas externas pesadas de gráficos.
2. Preserve a responsividade mobile-first (alvos de toque >= 44px em `pointer: coarse`) e o suporte ao Modo Professor (que revela gabaritos comentados e notas de aula em todos os eixos).
3. Para animações de Estágio 1 e questões críticas, siga o **Jeito B** aprovado em `docs/manim_video_pipeline.md` (lousa escura 3B1B + `MathTex` com tradução de símbolos *"em português claro"* e narração local em `VoiceStudio`), preservando o Laboratório Vivo em Canvas intacto.
4. Após alterar classes Tailwind em `index.html` ou `js/`, recompile `css/app.css` com `npx tailwindcss@3 -i css/input.css -o css/app.css --minify`.
5. Execute `node verify_banco.js`, `node test/test_math.js`, `node test/test_state.js` e `node test/test_ui_hierarchy.js` antes de concluir alterações.
