# Mapeamento Exaustivo do Programa de Matemática: Edital Vestibular UNEB e Universidade Para Todos (UPT)

**Fonte:** Acervo Oficial do Caderno / Notebook UPT Bahia e Editais UNEB (Nº 109/2025 e Nº 066/2026)

---

## 1. Mapa do Conteúdo Programático Oficial (Os 6 Eixos Estruturantes)

### 1.1 Lógica Matemática
- **Proposições e Valoração**: Sentenças declarativas com valoração unívoca ($V$ ou $F$). Princípio da não-contradição $\neg (P \wedge \neg P)$ e princípio do terceiro excluído $P \vee \neg P$.
- **Operações Lógicas e Matrizes de Verdade**:
  - Negação ($\neg P$ ou $\sim P$): Inverte o valor lógico.
  - Conjunção ($P \wedge Q$): Verdadeira estritamente se ambos forem $V$.
  - Disjunção inclusiva ($P \vee Q$): Falsa estritamente se ambos forem $F$.
  - Condicional ($P \rightarrow Q$): Falsa estritamente se $V \rightarrow F$. Contrapositiva: $\neg Q \rightarrow \neg P$. Negação: $P \wedge \neg Q$ (regra do "Maném").
  - Bicondicional ($P \leftrightarrow Q$): Verdadeira quando os valores lógicos forem idênticos.
- **Sentenças Abertas e Quantificadores**: Quantificador universal ($\forall x$) e existencial ($\exists x$).

### 1.2 Números, Sequências e Contagem
- **Conjuntos Numéricos**: $\mathbb{N} \subset \mathbb{Z} \subset \mathbb{Q} \subset \mathbb{R} \subset \mathbb{C}$.
  - *Números Complexos*: Forma algébrica $z = a + bi$ ($i^2 = -1$). Forma trigonométrica/polar $z = |z|(\cos\theta + i\text{sen}\theta)$, onde módulo $|z| = \sqrt{a^2 + b^2}$ e argumento $\theta = \text{arctg}(b/a)$. Multiplicação polar: $z_1 \cdot z_2 = |z_1||z_2|[\cos(\theta_1 + \theta_2) + i\text{sen}(\theta_1 + \theta_2)]$.
- **Progressões Numéricas**:
  - *PA*: Termo geral $a_n = a_1 + (n-1)r$. Soma finita $S_n = \frac{(a_1 + a_n) \cdot n}{2}$.
  - *PG*: Termo geral $a_n = a_1 \cdot q^{n-1}$. Soma finita $S_n = \frac{a_1(q^n - 1)}{q - 1}$ ($q \neq 1$). Soma infinita convergente ($|q| < 1$): $S_\infty = \frac{a_1}{1 - q}$.
- **Análise Combinatória e Binômio de Newton**:
  - Arranjo simples (ordem importa): $A_{n,k} = \frac{n!}{(n-k)!}$.
  - Permutação simples: $P_n = n!$.
  - Combinação simples (ordem não importa): $C_{n,k} = \binom{n}{k} = \frac{n!}{k!(n-k)!}$.
  - Binômio de Newton: $(x+y)^n = \sum_{k=0}^{n} \binom{n}{k} x^{n-k} y^k$.
- **Probabilidade**:
  - Espaço equiprovável: $P(A) = \frac{n(A)}{n(\Omega)}$.
  - Probabilidade condicional: $P(A|B) = \frac{P(A \cap B)}{P(B)}$ ($P(B) > 0$).

### 1.3 Álgebra e Funções
- **Polinômios**: $P(x) = a_n x^n + \dots + a_0$. Teorema do Resto: divisão por $(x-a)$ tem resto $R = P(a)$. Teorema Fundamental da Álgebra ($n$ raízes complexas).
- **Funções Elementares**:
  - Função Afim (1º grau): $f(x) = ax + b$ (reta, taxa de variação constante).
  - Função Quadrática (2º grau): $f(x) = ax^2 + bx + c$, $\Delta = b^2 - 4ac$, $x = \frac{-b \pm \sqrt{\Delta}}{2a}$, Vértice $V = \left(-\frac{b}{2a}, -\frac{\Delta}{4a}\right)$.
  - Função Modular: $f(x) = |x|$.
  - Função Exponencial: $f(x) = a^x$ ($a > 0, a \neq 1$).
  - Função Logarítmica: $f(x) = \log_a x$ (inversa da exponencial).
- **Matrizes, Determinantes e Sistemas Lineares**:
  - Multiplicação matricial, Determinante $3 \times 3$ via Sarrus.
  - Regra de Cramer: $x_i = \frac{\det(A_i)}{\det(A)}$ para $\det(A) \neq 0$.

### 1.4 Geometria e Medidas
- **Geometria Plana**: Teorema de Pitágoras ($a^2 = b^2 + c^2$), Teorema de Tales, Área de Triângulo ($A = \frac{b \cdot h}{2}$ ou Fórmula de Heron $A = \sqrt{s(s-a)(s-b)(s-c)}$), Círculo ($A = \pi r^2$, Perímetro $2\pi r$), Trapézio ($A = \frac{(B+b)h}{2}$).
- **Geometria Espacial**:
  - Prisma e Cilindro: Volume $V = A_{\text{base}} \cdot h$. Área lateral cilindro $A_L = 2\pi r h$.
  - Pirâmide e Cone: Volume $V = \frac{1}{3} A_{\text{base}} \cdot h$.
  - Esfera: Volume $V = \frac{4}{3}\pi r^3$, Área de superfície $A = 4\pi r^2$.
- **Geometria Analítica**:
  - Distância entre dois pontos: $d = \sqrt{(x_2-x_1)^2 + (y_2-y_1)^2}$.
  - Equação da Reta: Geral $ax + by + c = 0$, reduzida $y = mx + n$, onde $m = \text{tg}\,\theta = \frac{y_2 - y_1}{x_2 - x_1}$.
  - Equação da Circunferência: $(x-a)^2 + (y-b)^2 = r^2$.

### 1.5 Trigonometria
- Razões no triângulo retângulo: $\text{sen}\,\theta$, $\cos\,\theta$, $\text{tg}\,\theta$.
- Identidade Fundamental: $\text{sen}^2\theta + \cos^2\theta = 1$.
- Soma e subtração de arcos: $\text{sen}(a \pm b) = \text{sen}\,a \cos\,b \pm \text{sen}\,b \cos\,a$, $\cos(a \pm b) = \cos\,a \cos\,b \mp \text{sen}\,a \text{sen}\,b$.
- Lei dos Senos: $\frac{a}{\text{sen}\,A} = \frac{b}{\text{sen}\,B} = \frac{c}{\text{sen}\,C} = 2R$.
- Lei dos Cossenos: $a^2 = b^2 + c^2 - 2bc \cos\,A$.

### 1.6 Proporcionalidade e Finanças
- Variação Percentual: $\Delta\% = \frac{V_f - V_i}{V_i} \cdot 100$.
- Capitalização Simples (Linear / PA): $J = C \cdot i \cdot t \implies M = C(1 + it)$.
- Capitalização Composta (Exponencial / PG): $M = C(1 + i)^t$.

### 1.7 Tratamento da Informação (Estatística Descritiva)
- Organização em ROL e tabelas de frequência.
- Regra de Sturges: $k = 1 + 3,3 \cdot \log_{10}(n)$.
- Amplitude de Classe: $h = \frac{AA}{k}$.
- Média aritmética ponderada: $\bar{x} = \frac{\sum f_i x_i}{n}$. Mediana (Md), Moda (Mo).
- Variância amostral: $s^2 = \frac{\sum f_i (x_i - \bar{x})^2}{n - 1}$. Desvio padrão amostral: $s = \sqrt{s^2}$.

---

## 2. Casos Práticos, Problemas e Amostras Reais

1. **Crescimento Populacional de Sapiência (Função Afim)**:
   - 1996 ($x=0$): $12.050$ hab. Em 1999 ($x=3$): $13.925$ hab.
   - Variação total: $1.875$ hab em 3 anos $\implies$ taxa constante de $625$ hab/ano.
   - Modelo: $P(x) = 12.050 + 625x$.
   - Projeção para 2015 ($x=19$): $P(19) = 12.050 + 11.875 = 23.925$ hab.
   - Conclusão crítica: Notícia do jornal estava incorreta, pois a ETE de 20.000 hab transborda em 3.925 habitantes.
2. **Topógrafo e Altura do Morro (Trigonometria)**:
   - Distância horizontal $200\,\text{m}$, elevação $30^\circ$, teodolito $1,60\,\text{m}$, $\text{tg}\,30^\circ \approx 0,57$.
   - $h = 200 \cdot 0,57 = 114\,\text{m} \implies \text{Altura total} = 115,60\,\text{m}$.
3. **Rampa do Pedreiro (Trigonometria e Radianos)**:
   - Altura $5\,\text{m}$, inclinação $36^\circ \implies 36^\circ = \frac{\pi}{5} = 0,20\pi \approx 0,628\,\text{rad}$.
   - Comprimento da rampa: $L = \frac{5}{\text{sen}(36^\circ)} \approx \frac{5}{0,5878} \approx 8,50\,\text{m}$.
4. **Determinação Experimental da Tangente de $35^\circ$**:
   - $\text{tg}_1 = 0,67$, $\text{tg}_2 = 0,75$, $\text{tg}_3 = 0,73 \implies \text{Média} \approx 0,71$.
5. **Tabela da Papelaria (Proporcionalidade Direta)**:
   - Cópias a R$ 0,08 por unidade; Plastificação a R$ 1,20 por unidade.
6. **Teorias Demográficas e Progressões**:
   - Teoria Malthusiana: População em PG ($1, 2, 4, 8 \dots$) vs Alimentos em PA ($1, 2, 3, 4 \dots$).
7. **Datasets Completos para o Laboratório Estatístico**:
   - *Vendas de 90 Ventiladores*: $n = 90$, $X_{\text{mín}} = 6$, $X_{\text{máx}} = 19$, $AA = 13$.
   - *Alunos da UFSC (2009)*: 15 cursos, total $5.434$ alunos ($2.717$ M / $2.717$ F).
   - *Faturamento Filiais A, B, C*: 8 meses cada. Filial A ($\bar{x} = 22,125$), Filial B ($\bar{x} = 22,0$), Filial C ($\bar{x} = 22,375$).
8. **Guia Excel no Caderno**:
   - Endereço de células (ex: A1). Inserção de abas (`Shift + F11`).
   - Gráficos de barras horizontais para categorias longas (cursos) vs colunas para séries curtas.
   - Ferramenta Autossoma ($\Sigma$) e classificação de dados.

---

## 3. Repositório de Questões Reais dos Cadernos

1. **Questão ESPM (Álgebra)**:
   - $E = 2x^3 - 20x^2 + 50x$ para $x = 105$.
   - Fatoração: $E = 2x(x-5)^2 = 2(105)(100)^2 = 210 \cdot 10.000 = 2,1 \cdot 10^6$. **Gabarito: C**.
2. **Questão UFSE (Trigonometria e Geometria)**:
   - Suplemento de um ângulo é o triplo dele: $180^\circ - x = 3x \implies 4x = 180^\circ \implies x = 45^\circ$.
   - Maior dos dois ângulos: $180^\circ - 45^\circ = 135^\circ$. **Gabarito: 135° (Opção 2)**.
3. **Questão ENEM 2016 (Marceneiro e Encaixe de Peças)**:
   - Furo que circunscreve quadrado de lado 4: diâmetro é a diagonal $D = 4\sqrt{2} \approx 4 \cdot 1,4 = 5,6\,\text{cm}$.

---

## 4. Diretrizes Oficiais do Vestibular UNEB

- **Estrutura das Provas**:
  - *1º Dia (4h30min)*: Português/Literatura (15), Língua Estrangeira (10), Humanas (20), Redação.
  - *2º Dia (4h00min)*: Matemática (15 questões objetivas) e Ciências da Natureza (15 questões integradas).
- **Horários Oficiais**: Portões abrem às **07h20min** e fecham às **07h50min**. Provas iniciam às **08h00min**.
- **Permanência**: Mínimo de 2 horas. Só leva o caderno no 2º dia após 4 horas completas.
- **Folha de Respostas**: Caneta esferográfica transparente com tinta azul ou preta. Não há substituição por erro.
- **Regra dos Dois Últimos Candidatos**: Encerram juntos e assinam a ata presenciando o lacre do malote.
- **Tabela Oficial de Pesos de Matemática por Curso**:
  - Matemática (Licenciatura): **4,0**
  - Engenharia de Produção Civil: **4,0**
  - Sistemas de Informação: **4,0**
  - Ciências Contábeis: **4,0**
  - Física / Química: **3,0**
  - Administração: **2,0**
  - Direito: **2,0**
  - Medicina: **1,0**

---

## 5. Bibliografia Oficial do Edital UNEB

- CRESPO, Antônio Arnot. *Estatística Fácil*. Saraiva, 1998.
- DANTE, Luiz Roberto. *Matemática: contexto e aplicações*. Ática, 2000.
- GENTIL, M. & GRECCO, S. *Matemática para o 2º grau*. Ática, 1996.
- GIOVANNI, J. R. et al. *Matemática 2º grau*. F.T.D., 1992.
- IEZZI, Gelson et al. *Fundamentos de Matemática Elementar* (Volumes 1 a 10). Atual, 1993.
- LIMA, Elon Lages et al. *A Matemática no Ensino Médio* (Volumes 1 a 3). SBM, 2016.
- NAZARETH, Helenalda. *Curso Básico de Estatística*. Ática, 1992.
- PAIVA, Manoel. *Matemática*. Moderna, 1995.
- SMOLE, K. S. & DINIZ, M. I. *Matemática - Ensino Médio*. Saraiva, 2013.
- XAVIER, C. & BARRETO, B. *Matemática: aula por aula*. FTD, 2009.
