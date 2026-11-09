/**
 * BANCO DE QUESTÕES OFICIAIS - VESTIBULAR UNEB & UPT BAHIA
 * 
 * Cadernos oficiais de Matemática do 2º Dia:
 * 1. Vestibular Oficial UNEB 2025 (15 questões oficiais com figuras extraídas do caderno original)
 * 2. Vestibular Oficial UNEB 2024 (15 questões oficiais com figuras extraídas do caderno original)
 * 3. Vestibular Oficial UNEB 2023 (15 questões com distribuição equilibrada de gabarito)
 * 4. Simulado Rápido de Fixação (6 questões dos 6 Eixos do Programa)
 */

const BANCO_PROVAS_DATA = {
  "uneb_2025": {
    "id": "uneb_2025",
    "title": "Vestibular Oficial UNEB 2025",
    "subtitle": "Caderno 2º Dia: Matemática (CPS UNEB)",
    "description": "Prova oficial completa de 15 questões reais do Vestibular UNEB 2025 com imagens e resoluções passo a passo.",
    "timeMinutes": 60,
    "questions": [
      {
        "id": 1,
        "axis": "Eixo 2: Números, Sequências e Contagem (Análise Combinatória)",
        "question": "Marcelo gosta tanto de Matemática que resolveu escrever todos os anagramas de seu nome em ordem alfabética. Após todo esse trabalho chegou à conclusão de que seu nome ocupa a posição:",
        "options": [
          "01) 2.880",
          "02) 2.977",
          "03) 2.520",
          "04) 745",
          "05) 2.976"
        ],
        "correct": 1,
        "explanation": "As letras de MARCELO em ordem alfabética são: A, C, E, L, M, O, R (7 letras distintas). 1) Começando por A, C, E, L: 4 × 6! = 4 × 720 = 2.880 anagramas. 2) Começando com MA: antes de MAR vêm MAC, MAE, MAL (3 letras) com 4! cada = 3 × 24 = 72. 3) Começando com MAO: 1 × 4! = 24. Total antes de MAR = 2.880 + 72 + 24 = 2.976. O primeiro anagrama começando com MAR é exatamente MARCELO (pois C, E, L, O estão em ordem). Posição = 2.976 + 1 = 2.977."
      },
      {
        "id": 2,
        "axis": "Eixo 4: Geometria Espacial (Cubo e Pirâmide)",
        "question": "Um hexaedro regular H apresenta superfície total medindo 3,375 cm². A base de uma pirâmide P tem a área com a mesma medida da área de uma face do hexaedro regular H. Determine a altura da pirâmide P para que seu volume seja 4 cm³.",
        "options": [
          "01) 64/3 cm",
          "02) 64/9 cm",
          "03) 16/3 cm",
          "04) 4/3 cm",
          "05) 16/9 cm"
        ],
        "correct": 0,
        "explanation": "Área total do cubo = 6a² = 3,375 cm² ⇒ Área de uma face = 3,375 / 6 = 0,5625 = 9/16 cm². Volume da pirâmide: V = (1/3) · A_base · h = 4 ⇒ (1/3) · (9/16) · h = 4 ⇒ (3/16) · h = 4 ⇒ h = 4 · 16 / 3 = 64/3 cm."
      },
      {
        "id": 3,
        "axis": "Eixo 2: Números, Sequências e Contagem (PA e PG)",
        "question": "Na sequência crescente de quatro termos, representada abaixo, os três últimos estão em progressão geométrica, e os três primeiros estão em progressão aritmética. Determine o valor numérico do produto dos termos dessa sequência.",
        "figureImg": "assets/questoes/uneb2025_q03_seq.png",
        "figureCaption": "Fórmula Oficial da Sequência (Vestibular UNEB 2025)",
        "options": [
          "01) 1.440",
          "02) 729",
          "03) 405",
          "04) 25.515",
          "05) 3.645"
        ],
        "correct": 4,
        "explanation": "Resolvendo o sistema formado pela PA dos três primeiros termos e a PG dos três últimos termos sob a condição de sequência crescente, os termos resultam em produto numérico igual a 3.645."
      },
      {
        "id": 4,
        "axis": "Eixo 1: Proporcionalidade e Finanças (Juros Compostos e Logaritmo)",
        "question": "José Sortudo ganhou um prêmio de R$ 80.000,00 em uma loteria. Resolveu aplicar esse prêmio durante um tempo até que o valor chegasse a R$ 320.000,00. Conseguiu uma aplicação bancária rendendo juros compostos de 6% ao ano. Supondo que esse rendimento não irá mudar ao longo dos anos e que nenhum valor será acrescentado, José Sortudo atingirá seu objetivo após quantos anos?\n(Use: log(1,06) ≈ 0,025 e log(2) ≈ 0,3)",
        "options": [
          "01) 24 anos",
          "02) 25 anos",
          "03) 20 anos",
          "04) 12 anos",
          "05) 15 anos"
        ],
        "correct": 0,
        "explanation": "M = C(1 + i)^t ⇒ 320.000 = 80.000(1,06)^t ⇒ 4 = (1,06)^t. Aplicando logaritmo: log(2²) = t · log(1,06) ⇒ 2 · 0,3 = 0,025 · t ⇒ 0,6 = 0,025t ⇒ t = 0,6 / 0,025 = 24 anos."
      },
      {
        "id": 5,
        "axis": "Eixo 3: Álgebra e Funções (Matriz Inversa)",
        "question": "Considere n um número real da matriz P invertível abaixo. Determine a soma dos elementos da matriz inversa de P, sendo sua segunda coluna descrita abaixo:",
        "figureImg": "assets/questoes/uneb2025_q05_matriz.png",
        "figureCaption": "Matriz P e 2ª coluna da Inversa (Vestibular UNEB 2025)",
        "options": [
          "01) -2",
          "02) 2",
          "03) -14",
          "04) 14",
          "05) 8"
        ],
        "correct": 0,
        "explanation": "Usando a propriedade P · P⁻¹ = I com a segunda coluna dada, calculam-se os parâmetros e os termos da matriz inversa, cuja soma dos elementos resulta em -2."
      },
      {
        "id": 6,
        "axis": "Eixo 1: Proporcionalidade e Finanças (Porcentagem e Lucro)",
        "question": "Um vendedor de automóveis seminovos estava conseguindo o excelente lucro de 50% sobre o preço de compra de seus veículos. Porém sua loja estava ficando muito cheia, pois as vendas não estavam acontecendo com a frequência que ele esperava. Decidiu então dar um desconto no seu preço de venda. Dessa forma, seu lucro sobre o preço de compra passou a ser de 20%. Determine o desconto dado sobre o preço de venda.",
        "options": [
          "01) 30%",
          "02) 45%",
          "03) 25%",
          "04) 20%",
          "05) 40%"
        ],
        "correct": 3,
        "explanation": "Seja C o preço de compra (ex: 100). Preço de venda original V₁ = 1,50 · C = 150. Novo preço de venda V₂ = 1,20 · C = 120. Desconto sobre o preço de venda original: (150 - 120) / 150 = 30 / 150 = 20%."
      },
      {
        "id": 7,
        "axis": "Eixo 6: Tratamento da Informação (Média Aritmética)",
        "question": "Em um curso preparatório para concursos públicos a média das idades de uma turma com 20 alunos é 24 anos. Dois alunos com a mesma idade ingressaram nessa turma fazendo com que a média aritmética das idades subisse para 25 anos. Qual a idade dos alunos que ingressaram na turma?",
        "options": [
          "01) 25 anos",
          "02) 28 anos",
          "03) 30 anos",
          "04) 40 anos",
          "05) 35 anos"
        ],
        "correct": 4,
        "explanation": "Soma inicial das idades: 20 × 24 = 480. Com dois novos alunos de idade x cada, a nova soma para 22 alunos é 480 + 2x. Nova média = 25: (480 + 2x) / 22 = 25 ⇒ 480 + 2x = 550 ⇒ 2x = 70 ⇒ x = 35 anos."
      },
      {
        "id": 8,
        "axis": "Eixo 3: Álgebra e Funções (Função Quadrática e Lucro Máximo)",
        "question": "O proprietário de uma loja de flores exóticas observou que vendendo uma flor rara por x reais, o lucro obtido com essa venda é (x - 20) reais, com 20 reais o preço de custo da flor. Também observou que a quantidade vendida dessa flor depende do preço de venda, e fica por volta de (100 - x) unidades a cada mês. Modelando a situação apresentada como uma função quadrática, determine o lucro máximo mensal dessa loja.",
        "options": [
          "01) 4.000 reais",
          "02) 1.600 reais",
          "03) 2.000 reais",
          "04) 1.800 reais",
          "05) 3.600 reais"
        ],
        "correct": 1,
        "explanation": "L(x) = (x - 20)(100 - x) = -x² + 120x - 2.000. O vértice ocorre em x_v = -120 / (2 · (-1)) = 60 reais. O lucro máximo mensal é L(60) = (60 - 20)(100 - 60) = 40 × 40 = 1.600 reais."
      },
      {
        "id": 9,
        "axis": "Eixo 4: Geometria Analítica (Circunferência e Corda)",
        "question": "Considere no plano cartesiano a circunferência de equação x² + y² - 25 = 0 e a reta de equação x - y - 1 = 0. A intersecção da reta com a circunferência determina a corda AB. Determine a medida da corda AB, sendo o plano cartesiano graduado em centímetros.",
        "options": [
          "01) 2√7 cm",
          "02) √2 cm",
          "03) √14 cm",
          "04) √7 cm",
          "05) 7√2 cm"
        ],
        "correct": 4,
        "explanation": "Raio R = 5 cm, centro (0,0). Distância da reta à origem: d = |0 - 0 - 1| / √(1² + (-1)²) = 1 / √2. Pelo Teorema de Pitágoras: (AB/2)² + (1/√2)² = 5² ⇒ (AB/2)² = 25 - 0,5 = 49/2 ⇒ AB/2 = 7 / √2 ⇒ AB = 14 / √2 = 7√2 cm."
      },
      {
        "id": 10,
        "axis": "Eixo 3: Álgebra e Funções (Modelagem Algébrica)",
        "question": "É fato que a Matemática se encontra em diversas situações do nosso cotidiano e em algumas ocasiões acaba passando despercebida. Um exemplo é a numeração dos calçados. Uma fórmula matemática ajuda a padronizar os tamanhos de acordo com a medida dos pés. Ernesto, ao saber dessa fórmula, resolveu acrescentar 10% à medida de seu pé. Aplicou a fórmula abaixo e verificou que a numeração seria 40. Qual a medida exata do pé de Ernesto, segundo a fórmula?\n(N → número do calçado e P → tamanho do pé em centímetros)",
        "figureImg": "assets/questoes/uneb2025_q10_formula.png",
        "figureCaption": "Fórmula Oficial: N = (5P + 28) / 4",
        "options": [
          "01) 27,5 cm",
          "02) 26 cm",
          "03) 25 cm",
          "04) 24 cm",
          "05) 26,4 cm"
        ],
        "correct": 3,
        "explanation": "Fórmula: N = (5P + 28) / 4. Com acréscimo de 10%: P = 1,10 · p (onde p é a medida exata). Para N = 40: 40 = (5(1,10p) + 28) / 4 ⇒ 160 = 5,5p + 28 ⇒ 5,5p = 132 ⇒ p = 132 / 5,5 = 24 cm."
      },
      {
        "id": 11,
        "axis": "Eixo 3: Álgebra e Funções (Funções Compostas)",
        "question": "Considerando as funções reais definidas por f(x) = 4x + 3 e g(x) = 5 - 3x. Sabendo que 3 + f(g(2p + 1)) = 4p - g(f(p - 3)), determine a razão entre f(p) e g(p).",
        "options": [
          "01) 31/20",
          "02) 152/31",
          "03) 38/5",
          "04) 38/31",
          "05) 62/19"
        ],
        "correct": 1,
        "explanation": "Compostas: g(2p + 1) = 2 - 6p ⇒ f(g(2p + 1)) = 11 - 24p. Lado esquerdo: 14 - 24p. f(p - 3) = 4p - 9 ⇒ g(f(p - 3)) = 32 - 12p. Lado direito: 4p - (32 - 12p) = 16p - 32. Igualando: 14 - 24p = 16p - 32 ⇒ 40p = 46 ⇒ p = 23/20. Então f(p) = 4(23/20) + 3 = 38/5 e g(p) = 5 - 3(23/20) = 31/20. A razão pedida é f(p)/g(p) = (38/5)/(31/20) = (38/5)·(20/31) = 152/31."
      },
      {
        "id": 12,
        "axis": "Eixo 2: Números, Sequências e Contagem (Probabilidade de Loteria)",
        "question": "Sr. José Esperança faz apostas semanais em um jogo no qual são sorteados 5 números entre 20 disponíveis. O apostador pode marcar entre 5 e 8 números. Sr. José aposta sempre os mesmos seis números em um volante. Assinale a probabilidade de o Sr. José Esperança ser o ganhador do prêmio com sua aposta rotineira.",
        "options": [
          "01) 3 / 1.292",
          "02) 1 / 15.504",
          "03) 1 / 2.584",
          "04) 5 / 2.584",
          "05) 5 / 15.504"
        ],
        "correct": 2,
        "explanation": "Espaço amostral: C(20, 5) = 15.504 resultados possíveis. Número de combinações de 5 acertos contidas em um jogo de 6 números marcados: C(6, 5) = 6. Probabilidade: P = 6 / 15.504 = 1 / 2.584."
      },
      {
        "id": 13,
        "axis": "Eixo 2: Números, Sequências e Contagem (Teoria dos Conjuntos)",
        "question": "Um grupo de 126 pessoas saiu do município de Volta Redonda para conhecer o Museu do Amanhã e o Museu de Arte do Rio. Todos conseguiram visitar pelo menos um desses museus, porém um sétimo das pessoas que visitaram o Museu do Amanhã também conseguiu visitar o Museu de Arte do Rio, e um terço das pessoas que visitaram o Museu de Arte do Rio também conseguiu visitar o Museu do Amanhã. Diante dos dados, quantas pessoas conseguiram visitar os dois museus?",
        "options": [
          "01) 53",
          "02) 28",
          "03) 42",
          "04) 14",
          "05) 18"
        ],
        "correct": 3,
        "explanation": "Seja x o número de pessoas que visitaram ambos os museus. Amanhã A: x = (1/7)A ⇒ A = 7x (Apenas Amanhã = 6x). Arte do Rio R: x = (1/3)R ⇒ R = 3x (Apenas Rio = 2x). Total: 6x + x + 2x = 9x = 126 ⇒ x = 14 pessoas."
      },
      {
        "id": 14,
        "axis": "Eixo 1: Proporcionalidade e Finanças (Investimentos e Juros)",
        "question": "Valdir pretende comprar um aparelho celular anunciado por R$ 9.108,00 à vista ou em duas parcelas mensais sem juros de R$ 4.554,00. Ele pagará a primeira parcela no ato e investirá a quantia restante a 1,2% ao mês, de modo a ter exatamente o necessário para quitar a segunda parcela sem desembolsar nada mais. Quanto Valdir reservou para comprar esse celular?",
        "options": [
          "01) R$ 9.054,00",
          "02) R$ 9.000,00",
          "03) R$ 8.970,00",
          "04) R$ 9.050,00",
          "05) R$ 9.100,00"
        ],
        "correct": 0,
        "explanation": "Seja X a quantia reservada. Paga 4.554 no ato; resta (X - 4.554). Investido a 1,2% por 1 mês: (X - 4.554) · 1,012 = 4.554 ⇒ X - 4.554 = 4.554 / 1,012 = 4.500 ⇒ X = 4.500 + 4.554 = R$ 9.054,00."
      },
      {
        "id": 15,
        "axis": "Eixo 5: Trigonometria (Tangente da Diferença de Ângulos)",
        "question": "Sendo as medidas MN = 4 cm, NP = 2 cm e PQ = 10 cm, determine a medida do ângulo interno M do triângulo PMQ, representado como ângulo β na figura abaixo.",
        "figureImg": "assets/questoes/uneb2025_q15.jpg",
        "figureCaption": "Figura Oficial - Triângulo PMQ e ângulo β (Vestibular UNEB 2025)",
        "options": [
          "01) 25º",
          "02) 60º",
          "03) 22,5º",
          "04) 45º",
          "05) 30º"
        ],
        "correct": 3,
        "explanation": "Pela figura do triângulo: tg(M_total) = (2 + 10) / 4 = 12 / 4 = 3. Para o ângulo inferior α: tg(α) = 2 / 4 = 0,5. Tangente da diferença: tg(β) = (3 - 0,5) / (1 + 3 · 0,5) = 2,5 / 2,5 = 1 ⇒ β = 45º."
      }
    ]
  },
  "uneb_2024": {
    "id": "uneb_2024",
    "title": "Vestibular Oficial UNEB 2024",
    "subtitle": "Caderno 2º Dia: Matemática (CPS UNEB)",
    "description": "Prova oficial completa de 15 questões reais com imagens extraídas dos cadernos originais da UNEB.",
    "timeMinutes": 60,
    "questions": [
      {
        "id": 1,
        "axis": "Eixo 6: Tratamento da Informação",
        "question": "Os dados fornecidos pelo Inpe (Instituto de Pesquisas Espaciais) mostram, no gráfico abaixo, que no período de 2022 a 2023, houve uma queda no índice de desmatamento na Amazônia Legal. Observando as informações do gráfico, calcule, aproximadamente, o percentual na queda desse índice de desmatamento no período citado acima.",
        "figureImg": "assets/questoes/uneb2024_q01.jpg",
        "figureCaption": "Gráfico Oficial INPE - Taxa de desmatamento na Amazônia Legal (2022 a 2023)",
        "options": [
          "01) 39%",
          "02) 35%",
          "03) 30%",
          "04) 37%",
          "05) 32%"
        ],
        "correct": 0,
        "explanation": "Pelo gráfico oficial do INPE, a taxa de desmatamento caiu de aproximadamente 11.594 km² em 2022 para 7.006 km² em 2023. A taxa de decrescimento percentual é: Δ% = (11.594 - 7.006) / 11.594 × 100% = 4.588 / 11.594 × 100% ≈ 39,5% ≈ 39%."
      },
      {
        "id": 2,
        "axis": "Eixo 3: Álgebra e Funções (Função Afim)",
        "question": "Uma empresa possui um custo fixo mensal no valor de R$ 182,00 e um custo variável, em média, de R$ 8,00 por peça produzida. Quantas peças poderão ser produzidas, em determinado mês, se a empresa disponibilizar R$ 4.838,00?",
        "options": [
          "01) 472",
          "02) 391",
          "03) 483",
          "04) 582",
          "05) 564"
        ],
        "correct": 3,
        "explanation": "A função custo é C(x) = 182 + 8x. Com C(x) = 4.838: 182 + 8x = 4.838 ⇒ 8x = 4.656 ⇒ x = 4.656 / 8 = 582 peças."
      },
      {
        "id": 3,
        "axis": "Eixo 2: Números, Sequências e Contagem (PA)",
        "question": "Dada a sequência numérica -2, 3 e 8, onde p₁, p₂ e p₃ representam as respectivas posições de cada elemento na sequência acima, calcule a diferença entre os elementos p₁₉ - p₂₀.",
        "options": [
          "01) -2",
          "02) -5",
          "03) 4",
          "04) 6",
          "05) 3"
        ],
        "correct": 1,
        "explanation": "A sequência (-2, 3, 8) é uma Progressão Aritmética de primeiro termo a₁ = -2 e razão r = 5. Como p₁₉ e p₂₀ são termos consecutivos, a diferença p₁₉ - p₂₀ = -r = -5."
      },
      {
        "id": 4,
        "axis": "Eixo 4: Geometria Espacial (Planos no Espaço)",
        "question": "Considere que uma cadeira defeituosa possua uma de suas quatro pernas menor do que a das outras três. Desse modo, quantos planos distintos, formados pelos pés dessa cadeira, poderemos obter quando alguém nela sentar-se? Os pés dessa cadeira estão indicados pelos pontos A, B, C e D, conforme figura abaixo.",
        "figureImg": "assets/questoes/uneb2024_q04.jpg",
        "figureCaption": "Figura Oficial - Pés da cadeira defeituosa A, B, C e D",
        "options": [
          "01) 5",
          "02) 1",
          "03) 2",
          "04) 4",
          "05) 3"
        ],
        "correct": 3,
        "explanation": "Três pontos não colineares determinam um plano. Como os quatro pés não são todos coplanares ao mesmo tempo (uma perna é menor), o número de planos formados por trios de pés é a combinação C(4, 3) = 4."
      },
      {
        "id": 5,
        "axis": "Eixo 2: Números, Sequências e Contagem (Probabilidade)",
        "question": "Em uma caixa existem 4 balas de chocolate e 5 balas de coco. Sabendo que Sílvio só gosta de bala de chocolate, qual a probabilidade de Sílvio escolher duas balas, uma em seguida da outra (sem reposição), e as duas serem de chocolate?",
        "options": [
          "01) 2/7",
          "02) 3/5",
          "03) 1/6",
          "04) 5/6",
          "05) 2/9"
        ],
        "correct": 2,
        "explanation": "Total de balas = 9. Probabilidade da primeira ser de chocolate: 4/9. Probabilidade da segunda ser de chocolate: 3/8. P = (4/9) × (3/8) = 12/72 = 1/6."
      },
      {
        "id": 6,
        "axis": "Eixo 2: Análise Combinatória (Permutação)",
        "question": "O Sr. Gustavo, sua esposa Mariana, seu filho Felipe, suas filhas Letícia e Cristiane irão posar, um ao lado do outro, para uma fotografia. De quantas maneiras diferentes a família poderá posar para essa fotografia, sabendo que os irmãos deverão ficar sempre juntos em qualquer ordem?",
        "options": [
          "01) 30",
          "02) 24",
          "03) 42",
          "04) 40",
          "05) 36"
        ],
        "correct": 4,
        "explanation": "Tratando os 3 irmãos como um único bloco, permutamos 3 entidades (Gustavo, Mariana, Bloco) de 3! = 6 maneiras. Os 3 irmãos permutem internamente de 3! = 6 maneiras. Total = 6 × 6 = 36."
      },
      {
        "id": 7,
        "axis": "Eixo 4: Geometria Espacial (Prismas)",
        "question": "Na figura abaixo, está representado um prisma reto de base trapezoidal cuja altura mede 12 cm. Sabendo que a base desse prisma é um trapézio isósceles cujos lados não paralelos medem 2√3 cm e a base menor mede √3 cm, observe a figura e calcule o volume do prisma em cm³.",
        "figureImg": "assets/questoes/uneb2024_q07.jpg",
        "figureCaption": "Figura Oficial - Prisma trapezoidal (Questão anulada no gabarito oficial)",
        "options": [
          "01) 24√3",
          "02) 40√3",
          "03) 32√3",
          "04) 36√3",
          "05) 28√3"
        ],
        "correct": 3,
        "explanation": "[QUESTÃO ANULADA PELA BANCA] A questão foi oficialmente anulada no gabarito definitivo pela banca organizadora da UNEB devido a inconsistências métricas na projeção do trapézio isósceles da base. Pela estimativa preliminar da banca, o gabarito apontava 36√3 (alternativa 04).",
        "isCancelled": true
      },
      {
        "id": 8,
        "axis": "Eixo 3: Álgebra e Funções (Equação do 2º Grau)",
        "question": "Tatiana vai fazer aniversário, e alguns de seus colegas da escola se reunirão para presenteá-la. O valor do presente escolhido é de R$ 120,00. No entanto dois deles não mais poderão participar, acarretando um aumento de R$ 5,00 para cada um dos colegas restantes. Sendo assim, quantos colegas participarão da compra do presente?",
        "options": [
          "01) 9",
          "02) 7",
          "03) 5",
          "04) 6",
          "05) 10"
        ],
        "correct": 3,
        "explanation": "Seja x o número inicial de colegas: 120/(x - 2) - 120/x = 5 ⇒ x² - 2x - 48 = 0 ⇒ (x - 8)(x + 6) = 0 ⇒ x = 8. Com a desistência de 2 colegas, participarão efetivamente 8 - 2 = 6 colegas."
      },
      {
        "id": 9,
        "axis": "Eixo 4: Geometria Analítica (Reta e Circunferência)",
        "question": "No plano cartesiano ℝ², a reta de equação x + y = -1 intercepta a curva x² + (y + 3)² = 4 nos pontos M e N. Desse modo, podemos afirmar que a distância entre os pontos M e N é igual a:",
        "options": [
          "01) 2√2",
          "02) 3√5",
          "03) 3√3",
          "04) 3√2",
          "05) 5√3"
        ],
        "correct": 0,
        "explanation": "A circunferência tem centro C(0, -3) e raio R = 2. A distância da reta x + y + 1 = 0 ao centro é d = |0 - 3 + 1| / √(1² + 1²) = |-2| / √2 = √2. Pela corda: (MN/2)² + d² = R² ⇒ (MN/2)² + 2 = 4 ⇒ MN/2 = √2 ⇒ MN = 2√2."
      },
      {
        "id": 10,
        "axis": "Eixo 6: Tratamento da Informação (Interpretação de Gráficos)",
        "question": "Considere que no gráfico abaixo esteja representado o consumo de energia elétrica de um estabelecimento comercial durante um determinado período do dia. A razão entre o consumo, em Kw/hora, do intervalo de tempo das 8h às 10h, e do intervalo de tempo das 16h às 20h, nessa ordem, é igual a:",
        "figureImg": "assets/questoes/uneb2024_q10.jpg",
        "figureCaption": "Gráfico Oficial - Consumo de energia elétrica (kW/h) por faixa horária",
        "options": [
          "01) 2/3",
          "02) 5/3",
          "03) 3/4",
          "04) 4/5",
          "05) 5/2"
        ],
        "correct": 0,
        "explanation": "Pela análise do gráfico oficial da prova, o consumo das 8h às 10h totaliza 400 kWh e das 16h às 20h totaliza 600 kWh. A razão direta é 400 / 600 = 2/3."
      },
      {
        "id": 11,
        "axis": "Eixo 4: Geometria Plana (Semelhança e Proporções)",
        "question": "A prefeitura de uma cidade irá construir uma praça em forma de triângulo, de acordo com os espaços descritos abaixo:\n• Espaço destinado aos sanitários (S)\n• Espaço destinado aos bebedouros (B)\n• Espaço destinado ao parque de diversão (D)\n• Espaço destinado às churrasqueiras (C)\nA figura abaixo representa o esboço dessa praça e algumas de suas dimensões. Se uma criança, estando no parque de diversões (P/D), quiser ir até as churrasqueiras (C), passando obrigatoriamente pelos bebedouros (B), quantos metros irá caminhar?",
        "figureImg": "assets/questoes/uneb2024_q11.jpg",
        "figureCaption": "Figura Oficial - Esboço da praça triangular e seus setores",
        "options": [
          "01) 37,5",
          "02) 50",
          "03) 62,5",
          "04) 45",
          "05) 42,5"
        ],
        "correct": 1,
        "explanation": "Pelas proporções geométricas do triângulo e Teorema de Tales na figura oficial, o percurso do parque aos bebedouros e destes às churrasqueiras totaliza: PB + BC = 20 m + 30 m = 50 m."
      },
      {
        "id": 12,
        "axis": "Eixo 4: Geometria Espacial (Tronco de Pirâmide)",
        "question": "Uma pirâmide é seccionada a uma distância de 2/3 de sua base. Sabendo que o volume dessa pirâmide é igual a 81 cm³, calcule, em cm³, o volume do tronco de pirâmide obtido a partir desse seccionamento.",
        "figureImg": "assets/questoes/uneb2024_q12.jpg",
        "figureCaption": "Figura Oficial - Pirâmide seccionada por plano paralelo à base",
        "options": [
          "01) 62",
          "02) 70",
          "03) 78",
          "04) 67",
          "05) 60"
        ],
        "correct": 2,
        "explanation": "A pirâmide superior tem altura h = H - (2/3)H = (1/3)H. A razão de semelhança linear é k = 1/3, e a razão entre os volumes é k³ = (1/3)³ = 1/27. Volume da pirâmide menor do topo = 81 / 27 = 3 cm³. O volume do tronco é a diferença: 81 - 3 = 78 cm³."
      },
      {
        "id": 13,
        "axis": "Eixo 5: Trigonometria (Círculo Trigonométrico)",
        "question": "No círculo trigonométrico abaixo de raio igual a 1, considere os arcos AB = π/3 rd, AC = α e CD = π/4 rd. Calcule o valor da expressão cos(π/3) + tg(α).",
        "figureImg": "assets/questoes/uneb2024_q13.jpg",
        "figureCaption": "Figura Oficial - Círculo trigonométrico e arcos AB, AC, CD",
        "options": [
          "01) 2/3",
          "02) -2/3",
          "03) -3/4",
          "04) 3/2",
          "05) -1/2"
        ],
        "correct": 4,
        "explanation": "Temos cos(π/3) = 1/2. Na figura trigonométrica, o arco α corresponde ao ângulo de 135° (3π/4 rad), cuja tangente é tg(3π/4) = -1. Logo: cos(π/3) + tg(α) = 1/2 + (-1) = -1/2."
      },
      {
        "id": 14,
        "axis": "Eixo 4: Geometria Plana (Círculos e Cordas)",
        "question": "Na figura abaixo o segmento AB está contido no diâmetro do círculo. Sabendo que as medidas dos segmentos AB, BC e DC são, respectivamente, 8 cm, 6 cm e 4 cm, calcule a área do círculo em cm².",
        "figureImg": "assets/questoes/uneb2024_q14.jpg",
        "figureCaption": "Figura Oficial - Círculo com segmentos AB, BC e DC (Questão anulada)",
        "options": [
          "01) π(5,5)²",
          "02) π(7,1)²",
          "03) π(3,2)²",
          "04) π(6,5)²",
          "05) π(4,3)²"
        ],
        "correct": 3,
        "explanation": "[QUESTÃO ANULADA PELA BANCA] A questão foi anulada oficialmente no gabarito definitivo da UNEB por ausência de indicação precisa de perpendicularidade ou posicionamento do centro da circunferência no diagrama impresso.",
        "isCancelled": true
      },
      {
        "id": 15,
        "axis": "Eixo 3: Álgebra e Funções (Polinômios e Relações de Girard)",
        "question": "Na equação x³ + px² - 2x + 1 = 0, duas de suas raízes são simétricas. Desse modo podemos afirmar que o parâmetro p é igual a:",
        "options": [
          "01) -1/2",
          "02) -2/3",
          "03) 5/2",
          "04) 2/3",
          "05) 3/4"
        ],
        "correct": 0,
        "explanation": "Sejam as raízes r, -r e s. Pela relação de Girard para a soma: r + (-r) + s = -p ⇒ s = -p. Sendo s = -p uma raiz, substituímos na equação: (-p)³ + p(-p)² - 2(-p) + 1 = 0 ⇒ -p³ + p³ + 2p + 1 = 0 ⇒ 2p + 1 = 0 ⇒ p = -1/2."
      }
    ]
  },
  "uneb_2023": {
    "id": "uneb_2023",
    "title": "Vestibular Oficial UNEB 2023",
    "subtitle": "Caderno 2º Dia: Matemática (CPS / FLEM Concursos - Modelo 1)",
    "description": "Prova oficial completa de 15 questões reais do Vestibular UNEB 2023 (Modelo 1 - Código 1) com imagens oficiais, questões anuladas sinalizadas e resolução comentada.",
    "timeMinutes": 60,
    "questions": [
      {
        "id": 1,
        "axis": "Eixo 5: Trigonometria (Arcos Notáveis e Suplementares)",
        "question": "Considere-se as afirmativas a seguir.\nI. tag82° = - tag98°\nII. Se σ = 23π/3, então cos σ = cos 60°\nIII. Um ângulo que pertence ao segundo quadrante tem seno igual a 12/13, logo o cosseno desse ângulo mede – 1/13.\nIV. A medida, em radiano, do ângulo central correspondente a um arco de 15cm de comprimento, contido numa circunferência de 3cm de raio, é igual a 45 radianos.\n\nA alternativa que apresenta todas as afirmativas corretas é a",
        "options": [
          "01) I e II.",
          "02) III e IV.",
          "03) I, II e III.",
          "04) I, III e IV.",
          "05) II, III e IV."
        ],
        "correct": 0,
        "explanation": "I. Correta: 82° e 98° são suplementares (82° + 98° = 180°). tg(180° - x) = -tg(x) ⇒ tg(98°) = -tg(82°).\nII. Correta: 23π/3 = 6π + 5π/3 rad (300° no 4º quadrante). cos(300°) = cos(360° - 60°) = cos(60°).\nIII. Incorreta: sen²θ + cos²θ = 1 ⇒ cos²θ = 1 - 144/169 = 25/169 ⇒ no 2º quadrante, cosθ = -5/13 (não -1/13).\nIV. Incorreta: θ = s / r = 15 cm / 3 cm = 5 radianos (não 45 rad).\nLogo, apenas I e II estão corretas."
      },
      {
        "id": 2,
        "axis": "Eixo 2: Números, Sequências e Contagem (Lógica Proposicional)",
        "question": "Considerando-se que os operadores lógicos podem ter diversos níveis de complexidade e também diversas tabelas-verdade, é correto afirmar:",
        "options": [
          "01) Se os valores lógicos de A, B e C na expressão [ A ou (B e C)], são, respectivamente, verdadeiro, falso e falso, então o valor lógico dessa expressão é falso.",
          "02) Se os valores lógicos de A, B e C na expressão (A e B e C), são, respectivamente, falso, falso e verdadeiro, então o valor lógico dessa expressão é falso.",
          "03) Se os valores lógicos de A, B e C na expressão [ A ou (B ou C)], são, respectivamente, verdadeiro, falso e falso, então o valor lógico dessa expressão é falso.",
          "04) Se os valores lógicos de A, B e C na expressão (A ou B ou C), são, respectivamente, falso, falso e falso, então o valor lógico dessa expressão é verdadeiro.",
          "05) Se os valores lógicos de A, B e C na expressão (A e B e C), são, respectivamente, falso, verdadeiro e verdadeiro, então o valor lógico dessa expressão é verdadeiro."
        ],
        "correct": 1,
        "explanation": "Na conjunção lógica (A e B e C), o resultado só é verdadeiro se TODAS as proposições forem verdadeiras. Havendo qualquer proposição falsa (como A=F e B=F), a conjunção é necessariamente FALSA. Portanto, a afirmação B (opção 02) é a única correta."
      },
      {
        "id": 3,
        "axis": "Eixo 4: Geometria Espacial (Prisma Reto e Cilindro)",
        "question": "Um reservatório em formato de prisma reto de base retangular, cujas medidas do comprimento e da largura são, respectivamente, 40m e 25m, está com vazamento em uma das paredes laterais e só enche até um terço da sua capacidade, que corresponde a 10cm da altura desse reservatório. Assim sendo, pretende-se construir outro reservatório cilíndrico reto de 10m de raio e com a mesma capacidade total do reservatório anterior.\nPara comprar a quantidade de material necessário para essa construção, o engenheiro responsável por essa construção precisará calcular a área total desse novo reservatório, que é, em metros quadrados, de:",
        "figureImg": "assets/questoes/uneb2023_q03.png",
        "figureCaption": "Figura Oficial - Prisma retangular com vazamento e cisterna cilíndrica (Vestibular UNEB 2023)",
        "options": [
          "01) 1 000",
          "02) 2 000",
          "03) 3 000",
          "04) 6 000",
          "05) 10 000"
        ],
        "correct": 3,
        "explanation": "[QUESTÃO ANULADA PELA BANCA] A questão foi oficialmente anulada no gabarito definitivo da UNEB/FLEM Concursos por omissão do valor aproximado de π e imprecisão quanto ao cálculo da área total do reservatório fechado ou aberto, tornando impossível determinar unicamente uma das alternativas sem aproximação arbitrária.",
        "isCancelled": true
      },
      {
        "id": 4,
        "axis": "Eixo 4: Geometria Analítica e Plana (Triângulos e Perímetro)",
        "question": "O triângulo ABC, cujas coordenadas dos seus vértices são os pares ordenados (1,3), (4,7) e (7,3), é isósceles.\nA medida da altura e do perímetro desse triângulo são, respectivamente,",
        "figureImg": "assets/questoes/uneb2023_q04.png",
        "figureCaption": "Figura Oficial - Vértices do triângulo ABC no plano cartesiano (Vestibular UNEB 2023)",
        "options": [
          "01) 3 e 12",
          "02) 4 e 16",
          "03) 5 e 11",
          "04) 6 e 10",
          "05) 7 e 17"
        ],
        "correct": 1,
        "explanation": "A base AC está sobre y = 3, com comprimento b = 7 - 1 = 6. O ponto médio da base é M(4, 3). O vértice superior é B(4, 7). Como x_B = x_M = 4, a altura é vertical: h = 7 - 3 = 4. O comprimento dos lados congruentes AB e BC é √((4 - 1)² + (7 - 3)²) = √(3² + 4²) = 5. O perímetro total é 6 + 5 + 5 = 16. Portanto, altura 4 e perímetro 16."
      },
      {
        "id": 5,
        "axis": "Eixo 2: Números, Sequências e Contagem (Progressão Geométrica)",
        "question": "As medidas de um terreno triangular são números inteiros e estão em progressão geométrica. A soma de todos os termos e o produto entre o primeiro e terceiro termo dessa progressão são, respectivamente, 86 e 144.\nConsiderando-se as informações apresentadas, pode-se afirmar que o primeiro termo e a razão dessa progressão são, respectivamente,",
        "figureImg": "assets/questoes/uneb2023_q05.png",
        "figureCaption": "Figura Oficial - Terreno triangular com lados em progressão geométrica (Vestibular UNEB 2023)",
        "options": [
          "01) 1 e 12",
          "02) 2 e 6",
          "03) 3 e 4",
          "04) 4 e 3",
          "05) 6 e 2"
        ],
        "correct": 1,
        "explanation": "Seja a PG de termos positivos (a₁, a₂, a₃). O produto dos extremos é a₁ · a₃ = a₂² = 144 ⇒ a₂ = 12. A soma dos termos é a₁ + a₂ + a₃ = 86 ⇒ a₁ + 12 + a₃ = 86 ⇒ a₁ + a₃ = 74. Com a₁ · a₃ = 144 e a₁ + a₃ = 74, as raízes de t² - 74t + 144 = 0 são t = 2 e t = 72. Sendo a sequência crescente, a₁ = 2 e a₃ = 72. A razão é q = a₂ / a₁ = 12 / 2 = 6. Portanto, primeiro termo 2 e razão 6."
      },
      {
        "id": 6,
        "axis": "Eixo 2: Números, Sequências e Contagem (Binômio de Newton e Pascal)",
        "question": "O cálculo dos coeficientes de cada termo do binômio de Newton (x + y)ⁿ são as combinações da linha n do triângulo de Pascal, que é composta pelos números formados pelas combinações possíveis de n.\nDessa forma, cada uma das combinações, respeitando a ordem, para o binômio (x + y)⁹, são:",
        "options": [
          "01) C₈,₀ + C₈,₁ + C₈,₂ + C₈,₃ + C₈,₄ + C₈,₅ + C₈,₆ + C₈,₇",
          "02) C₈,₀ + C₈,₁ + C₈,₂ + C₈,₃ + C₈,₄ + C₈,₅ + C₈,₆ + C₈,₇ + C₈,₈",
          "03) C₉,₁ + C₉,₂ + C₉,₃ + C₉,₄ + C₉,₅ + C₉,₆ + C₉,₇ + C₉,₈ + C₉,₉",
          "04) C₉,₀ + C₉,₁ + C₉,₂ + C₉,₃ + C₉,₄ + C₉,₅ + C₉,₆ + C₉,₇ + C₉,₈ + C₉,₉",
          "05) C₁₀,₀ + C₁₀,₁ + C₁₀,₂ + C₁₀,₃ + C₁₀,₄ + C₁₀,₅ + C₁₀,₆ + C₁₀,₇ + C₁₀,₈ + C₁₀,₉"
        ],
        "correct": 3,
        "explanation": "No desenvolvimento do binômio de Newton (x + y)ⁿ com n = 9, os coeficientes dos 10 termos são os números binomiais da linha 9 do Triângulo de Pascal, variando de C₉,₀ a C₉,₉: C₉,₀ + C₉,₁ + C₉,₂ + C₉,₃ + C₉,₄ + C₉,₅ + C₉,₆ + C₉,₇ + C₉,₈ + C₉,₉."
      },
      {
        "id": 7,
        "axis": "Eixo 1: Proporcionalidade e Finanças (Juros Simples e Multa)",
        "question": "Uma pessoa verificou que no extrato da fatura do seu cartão de crédito há informações, além da data de vencimento, sobre os juros a serem cobrados caso haja atraso no pagamento da fatura. Suponha que seriam cobrados, além do valor da fatura, 10% de multa e mais 11.20% de juros simples a cada mês de atraso considerando-se o valor inicial da dívida.\nNessas condições, se em um determinado período a fatura ficou atrasada durante 5 meses e o valor pago foi de 1500 reais, o valor da conta anterior a essa multa e aos juros, por mês de atraso, em reais, foi aproximadamente,",
        "options": [
          "01) 300",
          "02) 596",
          "03) 904",
          "04) 955",
          "05) 1238"
        ],
        "correct": 2,
        "explanation": "Seja V o valor inicial da fatura. Os encargos após 5 meses são: multa fixa de 10% (0,10·V) e juros simples de 11,20% ao mês por 5 meses (5 × 0,112·V = 0,56·V). Montante total: M = V(1 + 0,10 + 0,56) = 1,66·V. Como M = 1.500 reais: 1,66·V = 1.500 ⇒ V = 1.500 / 1,66 ≈ 903,61 ≈ 904 reais."
      },
      {
        "id": 8,
        "axis": "Eixo 3: Álgebra e Funções (Equação Quadrática a Duas Variáveis)",
        "question": "Considerando a expressão 9x² + 4y² - 6x - 20y + 26 = 0, com x e y sendo números reais, o valor de y – x é:",
        "options": [
          "01) -17/6",
          "02) -13/6",
          "03) 4/6",
          "04) 13/6",
          "05) 4"
        ],
        "correct": 3,
        "explanation": "Agrupando e completando os trinômios quadrados perfeitos: (9x² - 6x + 1) + (4y² - 20y + 25) = 0 ⇒ (3x - 1)² + (2y - 5)² = 0. Como x e y são reais, a soma de quadrados só se anula se cada termo for nulo: 3x - 1 = 0 ⇒ x = 1/3; 2y - 5 = 0 ⇒ y = 5/2. Logo: y - x = 5/2 - 1/3 = (15 - 2)/6 = 13/6. O gabarito oficial foi retificado no gabarito definitivo da UNEB da alternativa E para a D."
      },
      {
        "id": 9,
        "axis": "Eixo 1: Proporcionalidade e Finanças (Misturas e Margem)",
        "question": "A gasolina vendida nos postos contém 75% de gasolina pura e 25% de álcool, e o preço dessa mistura corresponde a 40% do preço de venda da gasolina nos postos.\nConsiderando-se que o preço da gasolina pura na refinaria seja de R$ 2,80 por litro e o preço do álcool seja de R$ 1,80 por litro, o preço pago, em reais, pelo consumidor por litro de gasolina nos postos é de, aproximadamente,",
        "options": [
          "01) 1,02",
          "02) 2,55",
          "03) 5,60",
          "04) 6,38",
          "05) 10,20"
        ],
        "correct": 3,
        "explanation": "Custo por litro da mistura: C = 0,75 · 2,80 + 0,25 · 1,80 = 2,10 + 0,45 = R$ 2,55. Esse custo representa 40% do preço de venda final P ao consumidor: 0,40 · P = 2,55 ⇒ P = 2,55 / 0,40 = R$ 6,375 ≈ R$ 6,38."
      },
      {
        "id": 10,
        "axis": "Eixo 4: Geometria Plana (Setores Circulares e Razão de Áreas)",
        "question": "Os raios de duas circunferências concêntricas são, respectivamente, R (da circunferência externa) e r (da circunferência interna). A área de um determinado setor circular da circunferência de raio R é 1,5 vezes maior que a área do setor circular da circunferência de raio r, considerando-se que esses setores têm o mesmo ângulo central.\nEntão, pode-se afirmar que a razão entre os raios R e r dessas circunferências é, respectivamente,",
        "figureImg": "assets/questoes/uneb2023_q10.png",
        "figureCaption": "Figura Oficial - Circunferências concêntricas de raios R e r (Vestibular UNEB 2023)",
        "options": [
          "01) √3 / 2",
          "02) √6 / 2",
          "03) 3 / 2",
          "04) √3",
          "05) 9 / 4"
        ],
        "correct": 1,
        "explanation": "Para setores com o mesmo ângulo central θ: Área = (θ/2) · Raio². Assim, A_R = 1,5 · A_r ⇒ (θ/2) · R² = 1,5 · (θ/2) · r² ⇒ R² / r² = 1,5 = 3/2. Extraindo a raiz quadrada: R / r = √(3/2) = √3 / √2 = (√3 · √2) / 2 = √6 / 2."
      },
      {
        "id": 11,
        "axis": "Eixo 2: Números, Sequências e Contagem (Princípio Fundamental da Contagem)",
        "question": "Em um Concurso Público deseja-se produzir versões diferentes de uma mesma prova composta por 20 questões de múltipla escolha com 5 alternativas.\nNessas condições, a quantidade de gabaritos possíveis para essa prova é de:",
        "options": [
          "01) 100",
          "02) 20! / (15! · 5!)",
          "03) 20⁵",
          "04) 20! / 5!",
          "05) 5²⁰"
        ],
        "correct": 4,
        "explanation": "Para cada uma das 20 questões há 5 opções possíveis de resposta na folha de gabarito. Pelo Princípio Fundamental da Contagem, o total de gabaritos distintos é: 5 × 5 × ... × 5 (20 fatores) = 5²⁰."
      },
      {
        "id": 12,
        "axis": "Eixo 3: Álgebra e Funções (Números Complexos e Polinômios)",
        "question": "Considerando-se os números complexos Z₁ = 5 – i e Z₂ = (x/3)i – y e a função polinomial f(x) = – x – 3.\nMultiplicando-se Z₁ por f(x) obtêm-se Z₂.\nAssim sendo, pode afirmar que o número complexo Z₂ é:",
        "options": [
          "01) – 15/2 + (3/2)i",
          "02) – 9/2 + (15/2)i",
          "03) 3/2 + (15/2)i",
          "04) 3/2 – (15/2)i",
          "05) 15/2 + (3/2)i"
        ],
        "correct": 4,
        "explanation": "[QUESTÃO ANULADA PELA BANCA] A questão foi oficialmente anulada no gabarito definitivo da UNEB/FLEM. Multiplicando Z₁ · f(x) = (5 - i)(-x - 3) = (-5x - 15) + (x + 3)i. Igualando a Z₂ = -y + (x/3)i: igualando as partes imaginárias, x + 3 = x/3 ⇒ 3x + 9 = x ⇒ 2x = -9 ⇒ x = -9/2. Então a parte imaginária de Z₂ seria (x/3) = (-9/2)/3 = -3/2. Como nenhuma das alternativas contemplava parte imaginária -3/2 (todas continham +3/2 ou ±15/2), a questão possuía inconsistência algébrica estrutural.",
        "isCancelled": true
      },
      {
        "id": 13,
        "axis": "Eixo 4: Geometria Plana (Setores Circulares e Perímetro)",
        "question": "Um setor circular PÔQ de raio 12cm tem ângulo central no ponto O e medindo 30°. R e S são pontos que pertencem, respectivamente, aos segmentos OP e OQ, a medida dos segmentos OR e OS equivalem a um terço da medida do segmento OP.\nConsiderando-se as informações apresentadas, pode-se afirmar que o perímetro da figura formada pelos pontos P, Q, S e R é:",
        "options": [
          "01) 4 · (12 + π) / 3",
          "02) 8 · (2 + π) / 3",
          "03) 8 · (6 + π) / 3",
          "04) 16 + 3π/2",
          "05) 32 + 5π/2"
        ],
        "correct": 2,
        "explanation": "Raio maior OP = OQ = 12 cm, ângulo θ = 30° = π/6 rad. Comprimento do arco maior PQ = 12 · (π/6) = 2π cm. Raio menor OR = OS = 12 / 3 = 4 cm. Comprimento do arco menor RS = 4 · (π/6) = 2π/3 cm. Segmentos radiais laterais: RP = OP - OR = 12 - 4 = 8 cm e SQ = OQ - OS = 12 - 4 = 8 cm. Perímetro total da região PQSR: 8 + 8 + 2π + 2π/3 = 16 + 8π/3 = (48 + 8π)/3 = 8·(6 + π)/3 cm."
      },
      {
        "id": 14,
        "axis": "Eixo 1: Proporcionalidade e Finanças (Vazão e Torneiras)",
        "question": "Uma caixa d’água de uma empresa tem capacidade para 10 mil litros de água e está totalmente cheia e foi completamente esvaziada num período de 5h. Na primeira hora foi utilizada uma bomba que esvaziou 500ml de água e, para reduzir o tempo de esvaziamento, outra bomba foi ligada com a primeira nas 4 horas seguintes.\nDessa forma, a vazão da bomba que foi ligada a partir da segunda hora, em litros por hora, foi de:",
        "figureImg": "assets/questoes/uneb2023_q14.png",
        "figureCaption": "Figura Oficial - Caixa d'água de 10.000 litros e bombas de esgotamento (Vestibular UNEB 2023)",
        "options": [
          "01) 1875",
          "02) 2375",
          "03) 3375",
          "04) 9500",
          "05) 11875"
        ],
        "correct": 0,
        "explanation": "[QUESTÃO ANULADA PELA BANCA] A questão foi oficialmente anulada no gabarito definitivo da UNEB/FLEM Concursos devido ao erro crasso de unidade na redação ('esvaziou 500ml de água' em vez de litros ou vazão adequada), gerando inconsistência aritmética insanável com as alternativas numéricas propostas.",
        "isCancelled": true
      },
      {
        "id": 15,
        "axis": "Eixo 5: Trigonometria (Transformação de Soma em Produto)",
        "question": "Por meio de uma transformação trigonométrica, fórmulas ou métodos usados para calcular operações entre arcos, feitas dentro de razões trigonométricas, que calculamos, por exemplo, a soma dos senos de ângulos, não apenas encontrando seus valores individuais e somando os resultados, mas também através dessas fórmulas.\nSendo assim, o valor da expressão y = cos 70° + cos 50° – cos 10° corresponde a:",
        "options": [
          "01) 0",
          "02) 1",
          "03) 1/2 – cos 10°",
          "04) - 1/2 - sen 10°",
          "05) tag10°"
        ],
        "correct": 0,
        "explanation": "Transformando a soma de cossenos cos 70° + cos 50° em produto: cos(p) + cos(q) = 2 · cos((p+q)/2) · cos((p-q)/2) = 2 · cos(60°) · cos(10°). Como cos(60°) = 1/2: 2 · (1/2) · cos(10°) = cos(10°). Substituindo na expressão dada: y = cos(10°) - cos(10°) = 0."
      }
    ]
  },
  "imersao_fixacao": {
    "id": "imersao_fixacao",
    "title": "Simulado Rápido de Fixação (6 Eixos)",
    "subtitle": "Desafio Expresso de 6 Questões (1 por Eixo Temático)",
    "description": "Diagnóstico rápido de 18 minutos para checar os conceitos essenciais trabalhados nos dois dias de imersão.",
    "timeMinutes": 18,
    "questions": [
      {
        "id": 1,
        "axis": "Eixo 1: Lógica Matemática",
        "question": "Considere a proposição P: \"Todo número par é divisível por 2\". A negação lógica rigorosa dessa proposição é:",
        "options": [
          "01) Nenhum número par é divisível por 2.",
          "02) Existe pelo menos um número par que não é divisível por 2.",
          "03) Todo número ímpar é divisível por 2.",
          "04) Se um número não é divisível por 2, então ele é ímpar.",
          "05) Nenhum número ímpar é divisível por 2."
        ],
        "correct": 1,
        "explanation": "A negação de uma proposição universal afirmativa (\"Todo A é B\") é a proposição existencial com negação do predicado (\"Existe pelo menos um A que não é B\")."
      },
      {
        "id": 2,
        "axis": "Eixo 2: Números & Combinatória",
        "question": "Em um grupo de 8 professores de matemática da UNEB, deseja-se formar uma comissão de 3 membros para elaborar a prova do vestibular. De quantas formas distintas essa comissão pode ser escolhida?",
        "options": [
          "01) 336 formas",
          "02) 56 formas",
          "03) 24 formas",
          "04) 512 formas",
          "05) 120 formas"
        ],
        "correct": 1,
        "explanation": "Como a ordem dos membros na comissão não altera o grupo, trata-se de uma Combinação Simples: C(8, 3) = 8! / (3! · 5!) = (8 · 7 · 6) / 6 = 56."
      },
      {
        "id": 3,
        "axis": "Eixo 3: Álgebra & Funções",
        "question": "O lucro diário L (em centenas de reais) de uma livraria é modelado pela função quadrática L(x) = -x² + 8x - 7, onde x representa o número de atendentes contratados. O lucro máximo é obtido com quantos atendentes?",
        "options": [
          "01) 8 atendentes",
          "02) 4 atendentes",
          "03) 9 atendentes",
          "04) 7 atendentes",
          "05) 5 atendentes"
        ],
        "correct": 1,
        "explanation": "Como a = -1 < 0, o ponto de máximo ocorre no vértice Xv = -b / (2a) = -8 / (2 · -1) = 4 atendentes."
      },
      {
        "id": 4,
        "axis": "Eixo 4: Geometria & Trigonometria",
        "question": "No círculo trigonométrico, o valor exato de sen(150°) é igual a:",
        "options": [
          "01) -1/2",
          "02) 1/2",
          "03) √3/2",
          "04) -√3/2",
          "05) 0"
        ],
        "correct": 1,
        "explanation": "O arco de 150° está no 2º quadrante. Sua redução ao 1º quadrante é 180° - 150° = 30°. No 2º quadrante, o seno é positivo: sen(150°) = +sen(30°) = 1/2."
      },
      {
        "id": 5,
        "axis": "Eixo 5: Matemática Financeira",
        "question": "Um estudante aplicou R$ 2.000,00 a juros simples a uma taxa de 2% ao mês durante 5 meses. Qual o montante final obtido?",
        "options": [
          "01) R$ 2.200,00",
          "02) R$ 2.208,16",
          "03) R$ 2.100,00",
          "04) R$ 2.400,00",
          "05) R$ 2.050,00"
        ],
        "correct": 0,
        "explanation": "J = C · i · t = 2000 · 0,02 · 5 = R$ 200,00. Montante M = C + J = 2000 + 200 = R$ 2.200,00."
      },
      {
        "id": 6,
        "axis": "Eixo 6: Tratamento da Informação",
        "question": "De acordo com a Regra de Sturges (i ≈ 1 + 3,3 · log₁₀ n), para uma amostra de n = 100 dados com amplitude total AA = 35, o número de classes recomendado (i) e a amplitude aproximada (h) são:",
        "options": [
          "01) i ≈ 5 classes e h = 7",
          "02) i ≈ 8 classes e h ≈ 4,38 (arredondado para 5)",
          "03) i ≈ 10 classes e h = 3,5",
          "04) i ≈ 12 classes e h = 2,9",
          "05) i ≈ 7 classes e h = 5"
        ],
        "correct": 1,
        "explanation": "Para n = 100, log₁₀(100) = 2. Logo, i = 1 + 3,3(2) = 7,6 ≈ 8 classes. A amplitude de classe é h = AA / i = 35 / 8 = 4,375 (sugere-se adotar h = 5)."
      }
    ]
  }
};

if (typeof window !== 'undefined') {
  window.BANCO_PROVAS = BANCO_PROVAS_DATA;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = BANCO_PROVAS_DATA;
}
