"""Eixo 3 — Álgebra e Funções: Função Quadrática e Parábola (Estágio 1: Conceito Visual).

Contém duas implementações comparáveis 1-para-1:
1. ParabolaPortalClaro (Jeito A): Visual claro do portal (tokens Quizlet/UNEB) usando apenas Pango `Text` (sem LaTeX).
2. ParabolaLousaLatex (Jeito B): Visual escuro lousa/3Blue1Brown (alinhado ao Canvas 2D) usando `MathTex` (LaTeX).
"""

from __future__ import annotations

from contextlib import contextmanager
import math
from manim import (
    BOLD,
    DOWN,
    LEFT,
    RIGHT,
    UP,
    Create,
    DashedLine,
    Dot,
    FadeIn,
    FadeOut,
    Indicate,
    Line,
    MathTex,
    NumberPlane,
    RoundedRectangle,
    Scene,
    Text,
    VGroup,
    ValueTracker,
    Write,
    always_redraw,
    smooth,
)

from config import (
    CANVAS_DARK_THEME,
    FONT_MONO,
    FONT_UI,
    PORTAL_LIGHT_THEME,
    SceneTheme,
    build_plain_pt_box,
    check_latex_tools,
    get_audio_path,
    sync_audio_block,
)
from scripts.math_tts import narrar_aula

X_RANGE = (-4.0, 6.0)
Y_RANGE = (-5.0, 5.0)


def clipped_parabola_x_range(
    a: float,
    b: float,
    c: float,
    x_min: float = -3.85,
    x_max: float = 5.85,
    y_min: float = -4.85,
    y_max: float = 4.85,
) -> tuple[float, float]:
    """Calcula intervalo [x0, x1] para manter y = ax² + bx + c dentro da área visível."""
    if abs(a) < 1e-4:
        if abs(b) < 1e-4:
            return (x_min, x_max)
        xs = sorted([(y_min - c) / b, (y_max - c) / b])
        lo = max(x_min, xs[0])
        hi = min(x_max, xs[1])
        return (lo, hi) if hi > lo + 0.05 else (x_min, x_min + 0.1)

    y_bound = y_max if a > 0 else y_min
    disc = b * b - 4.0 * a * (c - y_bound)
    if disc <= 0:
        xv = -b / (2.0 * a)
        return (max(x_min, xv - 0.35), min(x_max, xv + 0.35))

    s = math.sqrt(disc)
    r1 = (-b - s) / (2.0 * a)
    r2 = (-b + s) / (2.0 * a)
    lo = max(x_min, min(r1, r2))
    hi = min(x_max, max(r1, r2))
    if hi <= lo + 0.05:
        xv = max(x_min + 0.1, min(x_max - 0.1, -b / (2.0 * a)))
        return (xv - 0.05, xv + 0.05)
    return (lo, hi)


def calc_quadratic_features(a: float, b: float, c: float) -> dict:
    """Calcula vértice, discriminante e raízes reais para anotação dinâmica."""
    if abs(a) < 1e-4:
        roots = [-c / b] if abs(b) >= 1e-4 else []
        return {"is_quad": False, "delta": None, "vertex": None, "roots": roots}

    delta = b * b - 4.0 * a * c
    xv = -b / (2.0 * a)
    yv = -delta / (4.0 * a)
    roots: list[float] = []
    if delta > 1e-6:
        s = math.sqrt(delta)
        r1 = (-b - s) / (2.0 * a)
        r2 = (-b + s) / (2.0 * a)
        roots = sorted([r1, r2])
    elif abs(delta) <= 1e-6:
        roots = [xv]
    return {"is_quad": True, "delta": delta, "vertex": (xv, yv), "roots": roots}


def format_num(val: float) -> str:
    rounded = round(val)
    if abs(val - rounded) < 1e-2:
        return str(int(rounded))
    return f"{val:.1f}"


class _BaseParabolaScene(Scene):
    """Cena base paramétrica para comparar estilo claro sem LaTeX vs estilo escuro com LaTeX."""

    theme: SceneTheme = PORTAL_LIGHT_THEME
    use_latex: bool = False
    mode_tag: str = "Sem LaTeX (Pango)"
    enable_narration: bool = False
    slug: str = "eixo3_parabola"

    def make_label(self, text: str, font_size: int = 20, color: str | None = None, bold: bool = False, mono: bool = False) -> Text:
        return Text(
            text,
            font=FONT_MONO if mono else FONT_UI,
            font_size=font_size,
            weight=BOLD if bold else "NORMAL",
            color=color or self.theme.text_primary,
        )

    def make_plot_tag(self, text: str, color: str, font_size: int = 15, z_index: int = 6) -> Text:
        lbl = self.make_label(text, font_size=font_size, color=color, bold=True, mono=True)
        lbl.add_background_rectangle(color=self.theme.plot_bg, opacity=0.88, buff=0.05)
        lbl.set_z_index(z_index)
        return lbl

    def make_formula(self, unicode_text: str, latex_text: str, font_size: int = 26, color: str | None = None) -> Text | MathTex:
        c = color or self.theme.text_primary
        if self.use_latex:
            return MathTex(latex_text, font_size=int(font_size * 1.45), color=c)
        return Text(unicode_text, font=FONT_UI, font_size=font_size, weight=BOLD, color=c)

    def make_colored_quadratic(self, font_size: int = 25) -> Text | MathTex:
        t = self.theme
        if self.use_latex:
            eq = MathTex(
                r"f(x) =", r"a", r"x^2", r"+", r"b", r"x", r"+", r"c",
                font_size=int(font_size * 1.45),
                color=t.text_primary,
            )
            eq[1].set_color(t.curve)
            eq[7].set_color(t.y_intercept)
            return eq
        return Text("f(x) = ax² + bx + c", font=FONT_UI, font_size=font_size, weight=BOLD, color=t.text_primary)

    def build_pill(self, label_text: str, bg: str, fg: str, font_size: int = 15) -> VGroup:
        txt = self.make_label(label_text, font_size=font_size, color=fg, bold=True)
        box = RoundedRectangle(
            width=txt.width + 0.36,
            height=txt.height + 0.2,
            corner_radius=0.18,
            fill_color=bg,
            fill_opacity=1.0,
            stroke_width=0,
        )
        return VGroup(box, txt.move_to(box.get_center()))

    def build_step_card(
        self,
        step_badge: str,
        title_text: str,
        formula_uni: str,
        formula_tex: str,
        plain_sym_uni: str,
        plain_sym_tex: str,
        plain_text: str,
        desc_lines: list[str],
        accent_color: str,
        panel_center,
        *,
        formula_mob: Text | MathTex | None = None,
    ) -> VGroup:
        badge = self.build_pill(step_badge, bg=self.theme.badge_bg, fg=accent_color, font_size=14)
        title = self.make_label(title_text, font_size=21, color=self.theme.text_primary, bold=True)
        formula = formula_mob if formula_mob is not None else self.make_formula(formula_uni, formula_tex, font_size=24, color=accent_color)
        if formula.width > 4.35:
            formula.set_width(4.35)

        plain_box = build_plain_pt_box(
            plain_sym_tex if self.use_latex else plain_sym_uni,
            plain_text,
            accent_color=accent_color,
            theme=self.theme,
            use_latex=self.use_latex,
            max_width=4.45,
        )

        items: list = [badge, title, formula, plain_box]
        if desc_lines:
            desc_items = VGroup(
                *[self.make_label(line, font_size=16, color=self.theme.text_secondary) for line in desc_lines]
            ).arrange(DOWN, aligned_edge=LEFT, buff=0.11)
            if desc_items.width > 4.35:
                desc_items.set_width(4.35)
            items.append(desc_items)

        group = VGroup(*items).arrange(DOWN, aligned_edge=LEFT, buff=0.2)
        if group.width > 4.45:
            group.set_width(4.45)
        if group.height > 3.85:
            group.set_height(3.85)
        group.move_to(panel_center + DOWN * 0.36)
        return group

    @contextmanager
    def narrated_step(self, clip_name: str, spoken_text: str, *, pad: float = 0.35, min_duration: float = 2.0):
        """Sincroniza um bloco visual com locução .mp3 gerada via math_tts.narrar_aula."""
        if self.enable_narration:
            out_path = get_audio_path(self.slug, clip_name)
            audio_path, duracao = narrar_aula(spoken_text, str(out_path), modo="auto")
            with sync_audio_block(self, audio_path, duracao, pad=pad, min_duration=min_duration) as alvo:
                yield alvo
        else:
            t0 = self.time
            yield min_duration
            rem = min_duration - (self.time - t0)
            if rem > 0.05:
                self.wait(rem)

    def swap_card(self, old_card: VGroup, new_card: VGroup, *extra_anims, run_time: float = 0.65) -> None:
        """Troca cards conceituais sem distorcer glifos de texto entre etapas."""
        self.play(
            FadeOut(old_card, shift=UP * 0.12),
            FadeIn(new_card, shift=UP * 0.12),
            *extra_anims,
            run_time=run_time,
        )

    def construct(self) -> None:
        if self.use_latex:
            ok, _, _ = check_latex_tools()
            if not ok:
                raise RuntimeError("LaTeX/dvisvgm não disponível para renderizar ParabolaLousaLatex.")

        t = self.theme
        self.camera.background_color = t.bg

        # 1. Cabeçalho
        axis_pill = self.build_pill("EIXO 3 • ÁLGEBRA", bg=t.badge_bg, fg=t.badge_text, font_size=15)
        header_title = self.make_label("Função Quadrática e Parábola", font_size=26, color=t.text_primary, bold=True)
        stage_pill = self.build_pill(f"Conceito Visual • {self.mode_tag}", bg=t.card_bg, fg=t.text_secondary, font_size=14)
        if t.name == "portal_claro":
            stage_pill[0].set_stroke(t.card_border, width=1.5)

        left_head = VGroup(axis_pill, header_title).arrange(RIGHT, buff=0.25)
        left_head.to_corner(UP + LEFT, buff=0.4)
        stage_pill.to_corner(UP + RIGHT, buff=0.4)
        divider = Line([-6.65, 2.88, 0], [6.65, 2.88, 0], color=t.card_border, stroke_width=1.5)

        # 2. Cards principais (Esquerda: Plano Cartesiano | Direita: Painel Conceitual)
        plot_card = RoundedRectangle(
            width=7.3,
            height=5.85,
            corner_radius=0.2,
            fill_color=t.plot_bg,
            fill_opacity=1.0,
            stroke_color=t.card_border,
            stroke_width=1.8,
        ).move_to([-2.7, -0.45, 0])

        info_card = RoundedRectangle(
            width=5.15,
            height=5.85,
            corner_radius=0.2,
            fill_color=t.card_bg,
            fill_opacity=1.0,
            stroke_color=t.card_border,
            stroke_width=1.8,
        ).move_to([3.9, -0.45, 0])

        plane = NumberPlane(
            x_range=(X_RANGE[0], X_RANGE[1], 1),
            y_range=(Y_RANGE[0], Y_RANGE[1], 1),
            x_length=6.35,
            y_length=4.95,
            background_line_style={
                "stroke_color": t.grid,
                "stroke_width": 1.2,
                "stroke_opacity": 0.9,
            },
            axis_config={
                "stroke_color": t.axis,
                "stroke_width": 2.0,
                "include_numbers": False,
            },
        ).move_to(plot_card.get_center() + DOWN * 0.08)

        ticks = VGroup()
        for xv in (-3, -2, -1, 1, 2, 3, 4, 5):
            lbl = self.make_label(str(xv), font_size=13, color=t.text_muted, mono=True)
            lbl.next_to(plane.c2p(xv, 0), DOWN, buff=0.1)
            ticks.add(lbl)
        for yv in (-4, -2, 2, 4):
            lbl = self.make_label(str(yv), font_size=13, color=t.text_muted, mono=True)
            lbl.next_to(plane.c2p(0, yv), LEFT, buff=0.1)
            ticks.add(lbl)
        x_name = self.make_label("x", font_size=16, color=t.text_secondary, bold=True).next_to(plane.c2p(5.8, 0), UP, buff=0.1)
        y_name = self.make_label("y (altura)", font_size=15, color=t.text_secondary, bold=True).next_to(plane.c2p(0, 4.7), LEFT, buff=0.12)
        ticks.add(x_name, y_name)

        # Trackers dinâmicos para (a, b, c) — caso base idêntico ao parabola.js: f(x) = x² - 2x - 3
        a_tr = ValueTracker(1.0)
        b_tr = ValueTracker(-2.0)
        c_tr = ValueTracker(-3.0)

        def build_curve():
            a, b, c = a_tr.get_value(), b_tr.get_value(), c_tr.get_value()
            x0, x1 = clipped_parabola_x_range(a, b, c)
            dx = max(0.02, (x1 - x0) / 80.0)
            return plane.plot(
                lambda x: a * x * x + b * x + c,
                x_range=[x0, x1, dx],
                color=t.curve,
                stroke_width=4.2,
            )

        curve = always_redraw(build_curve)

        # Fórmula principal no topo do painel direito com vínculo de cores
        eq_box = RoundedRectangle(
            width=4.55,
            height=0.88,
            corner_radius=0.14,
            fill_color=t.badge_bg,
            fill_opacity=0.85 if t.name == "portal_claro" else 1.0,
            stroke_color=t.accent_primary,
            stroke_width=1.4,
        ).move_to(info_card.get_top() + DOWN * 0.72)

        eq_general = self.make_colored_quadratic(font_size=25).move_to(eq_box.get_center())

        footer_note = self.make_label(
            "Depois experimente os sliders no Laboratório Vivo →",
            font_size=14,
            color=t.text_muted,
        ).move_to(info_card.get_bottom() + UP * 0.34)

        panel_anchor = info_card.get_center()

        # BLOCO 1: Montagem da lousa e tradução inicial f(x) = y
        card_intro = self.build_step_card(
            "EXEMPLO BASE",
            "Parábola: f(x) = x² - 2x - 3",
            "a = 1,   b = -2,   c = -3",
            r"a = 1,\quad b = -2,\quad c = -3",
            "y = f(x)",
            r"y = f(x)",
            "Altura da curva para cada posição x.\nAs cores ligam a fórmula ao gráfico.",
            ["Observe a curva azul e seus pontos chave."],
            t.accent_primary,
            panel_anchor,
        )
        with self.narrated_step(
            "bloco_01_intro",
            "Na função quadrática, cada letra da fórmula controla um traço visível da parábola. Veja o significado de cada uma na prática.",
            min_duration=3.5,
        ):
            self.play(
                FadeIn(left_head),
                FadeIn(stage_pill),
                Create(divider),
                FadeIn(plot_card),
                FadeIn(info_card),
                run_time=0.8,
            )
            self.play(Create(plane), FadeIn(ticks), FadeIn(eq_box), Write(eq_general), FadeIn(footer_note), run_time=1.0)
            self.play(Create(curve), FadeIn(card_intro), run_time=1.2)

        # BLOCO 2: Coeficiente a (Concavidade)
        card_a = self.build_step_card(
            "1. COEFICIENTE a",
            "Concavidade (Abertura)",
            "a > 0: Mínimo   |   a < 0: Máximo",
            r"a > 0 \;\text{(mínimo)} \quad|\quad a < 0 \;\text{(máximo)}",
            "a",
            r"a",
            "a > 0: boca para cima (tem mínimo).\na < 0: boca para baixo (tem máximo).",
            ["Quanto menor |a|, mais aberta a curva."],
            t.curve,
            panel_anchor,
        )
        ind_a = [Indicate(eq_general[1], color=t.curve, scale_factor=1.35)] if self.use_latex else []
        with self.narrated_step(
            "bloco_02_coef_a",
            "O coeficiente a manda na abertura da curva. Positivo, boca para cima com mínimo. Negativo, boca para baixo com máximo.",
            min_duration=5.5,
        ):
            self.swap_card(card_intro, card_a, *ind_a, run_time=0.7)
            self.play(a_tr.animate.set_value(0.45), b_tr.animate.set_value(-0.9), c_tr.animate.set_value(-2.5), run_time=1.3, rate_func=smooth)
            self.wait(0.35)
            self.play(a_tr.animate.set_value(-1.0), b_tr.animate.set_value(2.0), c_tr.animate.set_value(1.0), run_time=1.5, rate_func=smooth)
            self.wait(0.8)
            self.play(a_tr.animate.set_value(1.0), b_tr.animate.set_value(-2.0), c_tr.animate.set_value(-3.0), run_time=1.2, rate_func=smooth)

        # BLOCO 3: Coeficiente c (Corte no eixo Y)
        y_dot = always_redraw(lambda: Dot(plane.c2p(0, c_tr.get_value()), radius=0.095, color=t.y_intercept).set_z_index(5))
        y_tag = always_redraw(
            lambda: self.make_plot_tag(
                f"(0, {format_num(c_tr.get_value())})",
                color=t.y_intercept,
                font_size=16,
            ).next_to(plane.c2p(0, c_tr.get_value()), RIGHT, buff=0.16)
        )
        card_c = self.build_step_card(
            "2. COEFICIENTE c",
            "Ponto de Corte no Eixo Y",
            "x = 0  ⇒  f(0) = c",
            r"x = 0 \;\Rightarrow\; f(0) = c",
            "(0, c)",
            r"(0, c)",
            "Onde a curva corta a linha em pé.\nTrocando x por zero, sobra só o c.",
            ["O ponto roxo acompanha o valor de c."],
            t.y_intercept,
            panel_anchor,
        )
        ind_c = [Indicate(eq_general[7], color=t.y_intercept, scale_factor=1.35)] if self.use_latex else []
        with self.narrated_step(
            "bloco_03_coef_c",
            "O termo c em roxo marca onde a curva corta o eixo vertical. Fazendo xis igual a zero, sobra exatamente o ponto c.",
            min_duration=4.8,
        ):
            self.swap_card(card_a, card_c, FadeIn(y_dot), FadeIn(y_tag), *ind_c, run_time=0.7)
            self.play(c_tr.animate.set_value(2.0), run_time=1.6, rate_func=smooth)
            self.wait(0.6)
            self.play(c_tr.animate.set_value(-3.0), run_time=1.6, rate_func=smooth)

        # BLOCO 4: Vértice e Eixo de Simetria
        sym_line = always_redraw(
            lambda: DashedLine(
                plane.c2p(-b_tr.get_value() / (2.0 * a_tr.get_value()), Y_RANGE[0] + 0.2),
                plane.c2p(-b_tr.get_value() / (2.0 * a_tr.get_value()), Y_RANGE[1] - 0.2),
                color=t.vertex,
                stroke_width=2.4,
                dash_length=0.14,
            )
        )
        v_dot = always_redraw(
            lambda: Dot(
                plane.c2p(
                    -b_tr.get_value() / (2.0 * a_tr.get_value()),
                    a_tr.get_value() * (-b_tr.get_value() / (2.0 * a_tr.get_value())) ** 2
                    + b_tr.get_value() * (-b_tr.get_value() / (2.0 * a_tr.get_value()))
                    + c_tr.get_value(),
                ),
                radius=0.105,
                color=t.vertex,
            )
        )
        v_tag = always_redraw(
            lambda: self.make_plot_tag(
                f"V({format_num(-b_tr.get_value() / (2.0 * a_tr.get_value()))}, "
                f"{format_num(calc_quadratic_features(a_tr.get_value(), b_tr.get_value(), c_tr.get_value())['vertex'][1])})",
                color=t.vertex,
                font_size=16,
                z_index=5,
            ).next_to(v_dot, DOWN + RIGHT, buff=0.14)
        )
        v_dot.set_z_index(5)
        v_tag.set_z_index(5)

        card_v = self.build_step_card(
            "3. VÉRTICE E SIMETRIA",
            "Ponto Extremo em xᵥ",
            "xᵥ = -b / (2a)   |   yᵥ = -Δ / (4a)",
            r"x_v = \frac{-b}{2a} \quad\Big|\quad y_v = \frac{-\Delta}{4a}",
            "V(xᵥ, yᵥ)",
            r"V(x_v, y_v)",
            "Ponto mais fundo (ou mais alto).\nA linha tracejada divide a curva ao meio.",
            ["Em x² - 2x - 3: xᵥ = 1 e V(1, -4)."],
            t.vertex,
            panel_anchor,
        )
        with self.narrated_step(
            "bloco_04_vertice",
            "Em âmbar, o vértice V é o ponto mais fundo ou mais alto da curva. O eixo tracejado divide o gráfico em dois lados iguais.",
            min_duration=3.5,
        ):
            self.swap_card(
                card_c,
                card_v,
                FadeOut(y_dot),
                FadeOut(y_tag),
                Create(sym_line),
                FadeIn(v_dot),
                FadeIn(v_tag),
                run_time=0.85,
            )
            self.play(Indicate(v_dot, color=t.vertex, scale_factor=1.3), run_time=0.8)

        # BLOCO 5A: Discriminante Δ > 0 e Raízes
        def build_roots_group():
            feats = calc_quadratic_features(a_tr.get_value(), b_tr.get_value(), c_tr.get_value())
            grp = VGroup()
            for idx, r in enumerate(feats["roots"]):
                d = Dot(plane.c2p(r, 0), radius=0.095, color=t.roots).set_z_index(6)
                tag_txt = f"x={format_num(r)}" if len(feats["roots"]) == 1 else f"x{idx + 1}={format_num(r)}"
                lbl = self.make_plot_tag(tag_txt, color=t.roots, font_size=15, z_index=6)
                lbl.next_to(d, UP, buff=0.18)
                grp.add(d, lbl)
            return grp

        roots_grp = always_redraw(build_roots_group)

        card_delta_pos = self.build_step_card(
            "4. DISCRIMINANTE Δ",
            "Δ > 0 → Duas Raízes Reais",
            "Δ = b² - 4ac > 0   (x = (-b ± √Δ) / 2a)",
            r"\Delta = b^2 - 4ac > 0 \;\Rightarrow\; x = \frac{-b \pm \sqrt{\Delta}}{2a}",
            "Δ > 0",
            r"\Delta > 0",
            "Corta o chão (eixo X) 2 vezes.\nEm x² - 2x - 3: Δ = 16, x₁ = -1 e x₂ = 3.",
            [],
            t.roots,
            panel_anchor,
        )
        with self.narrated_step(
            "bloco_05a_delta_pos",
            "O delta mostra quantas vezes a curva corta o eixo horizontal. Com delta positivo, temos duas raízes reais em verde.",
            min_duration=3.2,
        ):
            self.swap_card(card_v, card_delta_pos, FadeIn(roots_grp), run_time=0.75)
            self.play(Indicate(roots_grp, color=t.roots, scale_factor=1.18), run_time=0.8)

        # BLOCO 5B: Casos Δ = 0 e Δ < 0
        card_delta_zero = self.build_step_card(
            "4. DISCRIMINANTE Δ",
            "Δ = 0 → Raiz Dupla",
            "f(x) = x² - 2x + 1   (Δ = 0)",
            r"\Delta = 0 \;\Rightarrow\; x_1 = x_2 = x_v = 1",
            "Δ = 0",
            r"\Delta = 0",
            "Só encosta no chão em 1 ponto.\nO vértice V(1, 0) toca o eixo X.",
            [],
            t.vertex,
            panel_anchor,
        )
        card_delta_neg = self.build_step_card(
            "4. DISCRIMINANTE Δ",
            "Δ < 0 → Nenhuma Raiz Real",
            "f(x) = x² - 2x + 3   (Δ = -8 < 0)",
            r"\Delta < 0 \;\Rightarrow\; \nexists\, x \in \mathbb{R} \text{ com } f(x)=0",
            "Δ < 0",
            r"\Delta < 0",
            "Não toca o chão (eixo X).\nCom a > 0, f(x) > 0 para todo x real.",
            [],
            t.danger,
            panel_anchor,
        )
        with self.narrated_step(
            "bloco_05b_delta_zero_neg",
            "Se delta zera, a curva só encosta no chão em um ponto. Se delta fica negativo, ela sobe e não toca o eixo nenhuma vez.",
            min_duration=5.5,
        ):
            self.swap_card(
                card_delta_pos,
                card_delta_zero,
                c_tr.animate.set_value(1.0),
                run_time=1.6,
            )
            self.wait(1.6)
            self.swap_card(
                card_delta_zero,
                card_delta_neg,
                c_tr.animate.set_value(3.0),
                run_time=1.6,
            )

        # BLOCO 6: Fechamento em loop harmônico
        card_final = self.build_step_card(
            "RESUMO DO EIXO 3",
            "a (Boca) • c (Corte Y) • Δ (Raízes)",
            "f(x) = ax² + bx + c",
            r"f(x) = ax^2 + bx + c",
            "a, c, V, Δ",
            r"a,\; c,\; V,\; \Delta",
            "a (azul): abertura  •  c (roxo): corte em Y\nV (âmbar): extremo  •  Δ: raízes em X",
            [],
            t.accent_primary,
            panel_anchor,
            formula_mob=self.make_colored_quadratic(font_size=24),
        )
        with self.narrated_step(
            "bloco_06_resumo",
            "Agora teste esses controles no Laboratório Vivo logo abaixo.",
            pad=0.5,
            min_duration=2.8,
        ):
            self.swap_card(
                card_delta_neg,
                card_final,
                c_tr.animate.set_value(-3.0),
                run_time=1.5,
            )


class ParabolaPortalClaro(_BaseParabolaScene):
    """Jeito A: Visual claro do portal (tokens Quizlet/UNEB) usando apenas Pango Text (sem LaTeX)."""

    theme = PORTAL_LIGHT_THEME
    use_latex = False
    mode_tag = "Portal Claro (Pango)"
    enable_narration = False


class ParabolaLousaLatex(_BaseParabolaScene):
    """Jeito B: Visual escuro lousa/3Blue1Brown (alinhado ao Canvas 2D) usando MathTex (LaTeX) + voz."""

    theme = CANVAS_DARK_THEME
    use_latex = True
    mode_tag = "Lousa 3B1B (LaTeX)"
    enable_narration = True
