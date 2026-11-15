# Pipeline de Vídeos Educacionais com Manim — Portal Vestibular UNEB

Este documento é a referência canônica de arquitetura, diretrizes pedagógicas, voz local e orquestração (`/swarm`) para as animações matemáticas em vídeo (**Manim**) do **Portal Vestibular UNEB (`vest-uneb`)**, na branch/worktree `visual_hierarchy_dashboard`.

---

## 1. Visão Geral do Projeto

* **Worktree / Diretório de Trabalho:** `C:\Users\Emanuel\.gemini\antigravity\worktrees\vest-uneb\visual_hierarchy_dashboard` (branch `visual_hierarchy_dashboard`)
* **Deploy:** Vercel (`vest-uneb.vercel.app`) — `.vercelignore` exclui `.venv/` e `manim_animations/`, enviando apenas `assets/videos/` e `assets/posters/`.
* **Stack do Portal:**
  * Vanilla JavaScript puro (ES6 Modules em `js/`).
  * Tailwind CSS compilado estático (`css/app.css` + `css/custom.css`).
  * Simuladores interativos dinâmicos em **Canvas 2D** (`js/utils/canvas.js`).
  * Banco oficial de 51 questões (`js/data/banco_questoes.js`: `uneb_2025`, `uneb_2024`, `uneb_2023`, `imersao_fixacao`).
* **Trilha Pedagógica Atual:** Cada um dos 6 Eixos opera em 3 estágios (`js/utils/module-stage.js`):
  1. *Conceito Visual* (`[data-stage="conceito"]`)
  2. *Laboratório Vivo* (Canvas interativo com sliders)
  3. *Prática Rápida* (3 desafios oficiais)

---

## 2. Papel do Manim no Portal

1. **No Estágio 1 (Conceito Visual):** Pílulas animadas curtas (30 a 60 segundos) com locução explicativa introduzem a intuição visual antes de o aluno mexer no Canvas.
2. **No Modal / Resolução de Questões Críticas:** Vídeos curtos de resolução passo a passo para as questões com maior taxa de erro nas provas UNEB.

> **Princípio Sagrado:** O Manim NÃO substitui o Laboratório Vivo em Canvas. O vídeo constrói o modelo mental (visual + voz); o Canvas permite experimentar parâmetros manualmente.

---

## 3. Decisões Aprovadas (Design, Didática e Voz)

### 3.1 Identidade Visual Padrão: **Jeito B — Lousa 3B1B com LaTeX**
Ficou definido o estilo escuro **Lousa 3Blue1Brown** (`CANVAS_DARK_THEME` em `manim_animations/config.py`), mantendo coerência direta com os gráficos do Laboratório Vivo em Canvas 2D:
* **Fundo da cena:** `#0f172a` | **Card do gráfico:** `#020617` | **Textos:** `#f8fafc` / `#94a3b8`
* **Destaques semânticos:** curva/foco `#38bdf8` (azul-céu), vértice/alerta `#f59e0b` (âmbar), raízes/sucesso `#10b981` (esmeralda), intercepto/secundário `#a855f7` (roxo).
* **Fórmulas:** renderizadas via `MathTex` (LaTeX/MiKTeX local).

### 3.2 Ressalva Obrigatória 1 — Acessibilidade de Símbolos ("Em Português Claro")
Os alunos do Ensino Médio / UPT Bahia frequentemente travam diante de notação formal seca (`f(x)`, `\Delta`, `a > 0`, `X_v`, `\rightarrow`, `\land`, `\lor`, `A_{n,p}`, `C_{n,p}`). Toda animação **mantém o LaTeX oficial** para familiarização com a prova, mas segue 3 regras:
1. **Tradutor simultâneo na tela:** cada símbolo importante aparece pareado com sua tradução em português simples abaixo/ao lado (ex.: `$a > 0$` → *"boca p/ cima (sorriso)"*; `$\Delta > 0$` → *"corta o chão (eixo X) 2 vezes"*; `$V$` → *"ponto mais fundo / mais alto"*).
2. **Vínculo estrito por cor:** a cor do símbolo na fórmula deve ser a mesma do ponto, reta ou região no gráfico (ex.: `$c = -3$` roxo ligado ao ponto roxo `(0, -3)`).
3. **Ordem visual antes da formalização:** mostrar primeiro o movimento/ideia intuitiva, depois nomear com o símbolo da prova. Evitar notação hermética sem legenda (preferir mostrar `$y$` *"altura"* junto de `$f(x)$` no início).

| Eixo | Símbolos críticos que exigem tradução visual |
| :--- | :--- |
| **1 — Lógica** | `P → Q` (*"SE P, ENTÃO Q"* / Vera Fischer), `∧` (*"E: precisa dos dois"*), `∨` (*"OU: basta um"*), `~P` (*"não P / negação"*) |
| **2 — Sequências & Contagem** | `aₙ` (*"termo na posição n"*), `r` (*"salto somado"*), `q` (*"multiplicador"*), `A_{n,p}` (*"com pódio / ordem importa"*) vs `C_{n,p}` (*"só escolher grupo"*) |
| **3 — Parábola / Funções** | `a` (*"abertura p/ cima ou p/ baixo"*), `c` (*"onde corta a linha em pé"*), `Δ` (*"quantas raízes reais"*), `V(Xᵥ, Yᵥ)` (*"ponto extremo"*) |
| **4 — Trigonometria** | `sen θ` (*"altura / em pé"*), `cos θ` (*"largura / deitado"*), mostrar graus (`30°, 45°, 60°`) antes/junto de radianos (`π/6`) |
| **5 — Finanças** | `C` (*"dinheiro inicial"*), `i` (*"taxa % por mês"*), `t` (*"tempo / meses"*), `M` (*"valor final com juros"*) |
| **6 — Estatística** | `ROL` (*"lista em ordem crescente"*), `AA` (*"maior menos menor"*), `x̄` (*"média"*), `Md` (*"valor do meio"*), `Mo` (*"mais repetido"*) |

### 3.3 Ressalva Obrigatória 2 — Voz Explicativa Híbrida Leve (`scripts/math_tts.py`)
Cada pílula terá narração passo a passo com sincronia visual rigorosa, gerada pelo motor híbrido implementado em `scripts/math_tts.py`:
* **Por que NÃO usar OmniVoice pesado em CPU:** O motor padrão OmniVoice (2.4 GB PyTorch) satura 100% dos 16 núcleos em instruções AVX, gerando picos térmicos (>100°C) que acionam o desligamento de emergência (Thermal Shutdown) do notebook.
* **Arquitetura Híbrida do `math_tts.py` (Zero Risco Térmico):**
  1. **Primário — Microsoft Edge-TTS (`pt-BR-FranciscaNeural` / `pt-BR-AntonioNeural`):** Qualidade de estúdio, entonação didática impecável, custo zero e **0% de uso de CPU** (não esquenta nem liga ventoinha).
  2. **Fallback Offline — Piper TTS Local (`pt_BR-faber-medium.onnx` em `piper_models/`):** 100% offline, pesando apenas ~60 MB, rodando em **1 único núcleo** (~5% de CPU). Executa em < 2 segundos sem nenhum aquecimento.
  3. **Normalizador Matemático em Português Integrado:** Converte automaticamente fórmulas LaTeX e símbolos para fala natural (ex.: `$f(x) = ax^2 + bx + c$` → *"efe de xis igual a ax ao quadrado mais bx mais c"*; `$\Delta > 0$` → *"delta maior que zero"*; `$\frac{a}{b}$` → *"a sobre b"*; `UNEB` → *"Unébi"*).
* **Sincronização Áudio-Primeiro com o Manim:**
  ```python
  from scripts.math_tts import narrar_aula

  # Gera áudio com fallback automático e obtém a duração exata
  audio_path, duracao = narrar_aula(
      "No Eixo 3 da UNEB, se Delta > 0 a parábola tem duas raízes reais.",
      "assets/videos/temp_audio.wav",
      modo="auto"  # 'auto' (Edge com fallback p/ Piper) ou 'offline' (só Piper)
  )

  # No Manim: trava a animação visual no tempo da locução
  self.add_sound(audio_path)
  self.play(Create(parabola), run_time=max(3.0, duracao))
  ```

---

## 4. Arquitetura Técnica e Contrato de Exportação Web

* **Renderização 100% Build-time:** Somente os ativos finais vão ao portal (`assets/videos/` e `assets/posters/`).
* **Formatos e Áudio em `export_web.py`:**
  * **Com locução:** remover `-an` do `ffmpeg` quando houver trilha `.wav`/`.mp3`, exportando `.mp4` (`libx264`, `yuv420p`, `+faststart`, `-c:a aac -b:a 96k`) e `.webm` (`libvpx-vp9`, `-c:a libopus -b:a 64k`).
  * **Meta de peso:** 1.0 MB a 2.5 MB por pílula (720p30 ou 1080p30).
* **Player HTML5 em `index.html`:**
  * Como navegadores bloqueiam `autoplay` com áudio ativado, usar player com controles explícitos e opt-in de som:
    ```html
    <video class="w-full rounded-xl border border-slate-800 bg-slate-950"
           controls muted playsinline preload="metadata"
           poster="assets/posters/eixo3_parabola.jpg">
      <source src="assets/videos/eixo3_parabola.webm" type="video/webm" />
      <source src="assets/videos/eixo3_parabola.mp4" type="video/mp4" />
    </video>
    ```
  * Acompanhar com aviso/botão discreto de **"Ativar áudio da explicação"** no card do Estágio 1.

---

## 5. Ambiente Já Configurado na Worktree

* **Virtualenv:** `.venv/` (Python 3.14.7, `manim==0.22.1`)
* **LaTeX Local:** MiKTeX 25.12 per-user em `C:\Users\Emanuel\AppData\Local\Programs\MiKTeX\miktex\bin\x64\` (`AutoInstall=1`; `manim_animations/config.py` já injeta no `PATH` via `ensure_miktex_in_path()`).
* **Vídeo:** `ffmpeg 9.0.2` com `libx264` e `libvpx-vp9`.
* **Arquivos existentes em `manim_animations/`:**
  * `config.py` — Temas (`CANVAS_DARK_THEME` como alvo oficial) e detecção do MiKTeX.
  * `eixo3_parabola.py` — Piloto `ParabolaLousaLatex` já renderizado (falta aplicar camada de narração + tradução simplificada de símbolos).
  * `export_web.py` — Pipeline Manim → MP4 / WebM / JPG poster.
  * `verify_pipeline.py` — Checagem de helpers, LaTeX e `ffprobe` dos ativos.
  * `preview.html` — Comparador local (já cumpriu a escolha entre Jeito A e Jeito B).

---

## 6. Inventário Alvo & Plano de Orquestração com `/swarm`

Para produzir todos os eixos e exemplos sem colisão de edição entre agentes:

### Fase 0 — Base Compartilhada (CONCLUÍDA ✓)
1. **Motor de Voz Híbrido (`scripts/math_tts.py`):** Concluído e testado. Já inclui normalizador de termos matemáticos, suporte a Edge-TTS online (0% CPU) e Piper offline (`piper_models/pt_BR-faber-medium.onnx`, 1 núcleo).
2. **Atualizar `manim_animations/config.py`:** Garantir helpers de texto *"Em português claro"* e paleta `CANVAS_DARK_THEME`.
3. **Atualizar `manim_animations/export_web.py`:** Preservar trilha de áudio (AAC para MP4 e Opus para WebM) quando gerada via `math_tts.py`.

### Fase 1 — Fan-out Paralelo por Eixo (1 worker exclusivo por arquivo `.py`)
* `worker-eixo1` → `manim_animations/eixo1_logica.py` (`#mod-logica`: Condicional `P→Q`, Negação MANÉ, Contrapositiva, De Morgan)
* `worker-eixo2` → `manim_animations/eixo2_combinatoria.py` (`#mod-numeros`: Arranjo vs. Combinação, PA vs. PG)
* `worker-eixo3` → `manim_animations/eixo3_parabola.py` (`#mod-algebra`: atualizar piloto Jeito B com voz + símbolos traduzidos: `a`, `b`, `c`, `Δ`, vértice)
* `worker-eixo4` → `manim_animations/eixo4_trigonometria.py` (`#mod-trig`: ciclo unitário `sen θ`/`cos θ`, 4 quadrantes, arcos notáveis)
* `worker-eixo5` → `manim_animations/eixo5_financas.py` (`#mod-financas`: Simples vs. Compostos, Desconto à vista vs. parcelado, taxas sucessivas)
* `worker-eixo6` → `manim_animations/eixo6_estatistica.py` (`#mod-estatistica`: Média/Mediana/Moda, ROL, Sturges, leitura de gráficos)
* *(Opcional após os 6 Eixos)* `worker-questoes` → `manim_animations/questoes/*.py` para questões críticas do `banco_questoes.js`.

### Fase 2 — Verificação & Integração (workers dedicados, sem sobreposição)
* `verifier-manim`: renderiza (`export_web.py`), valida peso/duração/áudio (`verify_pipeline.py`) e extrai frames de checagem visual (`ffmpeg`).
* `integrator-portal`: adiciona players `<video>` no Estágio 1 (`[data-stage="conceito"]`) de `index.html`, mantendo o Laboratório Vivo em Canvas intacto, e valida com `node verify_banco.js`, `node test/test_math.js`, `node test/test_state.js` e `node test/test_ui_hierarchy.js`.

---

## 7. Comandos Úteis (a partir da raiz da worktree)

```powershell
# Preview rápido em baixa resolução (480p15)
.\.venv\Scripts\manim.exe -pql manim_animations\eixo3_parabola.py ParabolaLousaLatex

# Renderização + exportação Web (720p30)
.\.venv\Scripts\python.exe manim_animations\export_web.py manim_animations\eixo3_parabola.py ParabolaLousaLatex --slug eixo3_parabola --quality qm --height 720

# Validar ativos gerados e binários LaTeX
.\.venv\Scripts\python.exe manim_animations\verify_pipeline.py eixo3_parabola
```
