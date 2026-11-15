"""Eixo 2 — Números, Sequências e Combinatória: Soma de Gauss e Arranjo vs. Combinação.

Implementação oficial no estilo Jeito B (Lousa 3B1B com LaTeX — `CANVAS_DARK_THEME`):
- Classe exportável: `CombinatoriaLousaLatex` (slug `eixo2_combinatoria`)
- Parte 1: Demonstração visual da Soma de Gauss (PA em degraus + cópia invertida formando retângulo n × (a₁ + aₙ) ÷ 2)
- Parte 2: Arranjo vs. Combinação (3 alunos Ana, Beto e Caio em Pódio 1º/2º vs. Comissão sem cargos)
- Vínculo estrito por cor + caixas simultâneas "Em português claro" + locução via `config.narrated_block` / `scripts.math_tts.narrar_aula`
"""

from __future__ import annotations

import importlib.util
import os
from pathlib import Path

from manim import (
    BOLD,
    DOWN,
    LEFT,
    PI,
    RIGHT,
    UP,
    Brace,
    Create,
    DashedVMobject,
    FadeIn,
    FadeOut,
    Indicate,
    Line,
    MathTex,
    Rotate,
    RoundedRectangle,
    Scene,
    Text,
    VGroup,
    Write,
    smooth,
)

from config import (
    CANVAS_DARK_THEME,
    FONT_MONO,
    FONT_UI,
    SceneTheme,
    build_plain_pt_box,
    check_latex_tools,
    narrated_block,
)


def calc_pa_soma_gauss(a1: int, r: int, n: int) -> dict:
    """Calcula termos, último termo e soma de Gauss de uma PA finita."""
    terms = [a1 + i * r for i in range(n)]
    an = terms[-1] if terms else a1
    sn = ((a1 + an) * n) // 2
    return {"a1": a1, "an": an, "n": n, "sn": sn, "terms": terms}


def resolve_tts_mode() -> str:
    """Seleciona 'offline' se edge_tts não estiver instalado no ambiente atual (ex.: .venv)."""
    override = os.environ.get("MATH_TTS_MODE")
    if override:
        return override
    return "auto" if importlib.util.find_spec("edge_tts") is not None else "offline"


class CombinatoriaLousaLatex(Scene):
    """Jeito B: Lousa 3B1B com LaTeX e locução PT-BR para o Eixo 2 (PA & Combinatória)."""

    theme: SceneTheme = CANVAS_DARK_THEME
    slug: str = "eixo2_combinatoria"

    def make_label(
        self,
        text: str,
        font_size: int = 20,
        color: str | None = None,
        bold: bool = False,
        mono: bool = False,
    ) -> Text:
        return Text(
            text,
            font=FONT_MONO if mono else FONT_UI,
            font_size=font_size,
            weight=BOLD if bold else "NORMAL",
            color=color or self.theme.text_primary,
        )

    def make_math(self, tex: str, font_size: int = 32, color: str | None = None) -> MathTex:
        return MathTex(tex, font_size=font_size, color=color or self.theme.text_primary)

    def make_colored_math(
        self,
        tex: str,
        token_colors: dict[str, str],
        font_size: int = 32,
    ) -> MathTex:
        return MathTex(
            tex,
            font_size=font_size,
            color=self.theme.text_primary,
            tex_to_color_map=token_colors,
        )

    def make_colored_gauss_eq(self, font_size: int = 33) -> MathTex:
        t = self.theme
        return self.make_colored_math(
            r"S_n = \frac{(a_1 + a_n) \cdot n}{2}",
            {r"S_n": t.curve, r"a_1": t.y_intercept, r"a_n": t.roots, r"n": t.vertex},
            font_size=font_size,
        )

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
        formula_mob: MathTex | Text,
        plain_sym: str,
        plain_text: str,
        desc_lines: list[str],
        accent_color: str,
        panel_center,
    ) -> VGroup:
        badge = self.build_pill(step_badge, bg=self.theme.badge_bg, fg=accent_color, font_size=14)
        title = self.make_label(title_text, font_size=21, color=self.theme.text_primary, bold=True)
        if title.width > 4.35:
            title.set_width(4.35)
        if formula_mob.width > 4.35:
            formula_mob.set_width(4.35)

        plain_box = build_plain_pt_box(
            plain_sym,
            plain_text,
            accent_color=accent_color,
            theme=self.theme,
            use_latex=True,
            max_width=4.45,
        )

        items: list = [badge, title, formula_mob, plain_box]
        if desc_lines:
            desc_items = VGroup(
                *[self.make_label(ln, font_size=15, color=self.theme.text_secondary) for ln in desc_lines]
            ).arrange(DOWN, aligned_edge=LEFT, buff=0.1)
            if desc_items.width > 4.35:
                desc_items.set_width(4.35)
            items.append(desc_items)

        group = VGroup(*items).arrange(DOWN, aligned_edge=LEFT, buff=0.19)
        if group.width > 4.45:
            group.set_width(4.45)
        if group.height > 3.82:
            group.set_height(3.82)
        group.move_to(panel_center + DOWN * 0.36)
        return group

    def build_staircase_grid(
        self,
        terms: list[int],
        grid_center,
        dx: float,
        dy: float,
        *,
        fill_opacity: float = 0.88,
        stroke_width: float = 1.6,
        stroke_color: str | None = None,
    ) -> VGroup:
        """Constrói degraus da PA centrados na caixa retangular n × (a₁ + aₙ)."""
        t = self.theme
        n_cols = len(terms)
        total_rows = terms[0] + terms[-1]
        col_mid = (n_cols - 1) / 2.0
        row_mid = (total_rows - 1) / 2.0

        cols = VGroup()
        for c_idx, height in enumerate(terms):
            if c_idx == 0:
                col_color = t.y_intercept
            elif c_idx == n_cols - 1:
                col_color = t.roots
            else:
                col_color = t.curve

            col_group = VGroup()
            for r_idx in range(height):
                x = grid_center[0] + (c_idx - col_mid) * dx
                y = grid_center[1] + (r_idx - row_mid) * dy
                block = RoundedRectangle(
                    width=dx * 0.89,
                    height=dy * 0.85,
                    corner_radius=0.06,
                    fill_color=col_color,
                    fill_opacity=fill_opacity,
                    stroke_color=stroke_color or col_color,
                    stroke_width=stroke_width,
                ).move_to([x, y, 0])
                col_group.add(block)
            cols.add(col_group)
        return cols

    def build_pair_pill(self, label: str, accent: str, width: float = 2.45, height: float = 0.5) -> VGroup:
        t = self.theme
        box = RoundedRectangle(
            width=width,
            height=height,
            corner_radius=0.12,
            fill_color=t.card_bg,
            fill_opacity=0.95,
            stroke_color=accent,
            stroke_width=1.6,
        )
        txt = self.make_label(label, font_size=15, color=t.text_primary, bold=True)
        if txt.width > width - 0.24:
            txt.set_width(width - 0.24)
        txt.move_to(box.get_center())
        return VGroup(box, txt)

    def build_podium_card(self, first_name: str, first_col: str, second_name: str, second_col: str) -> VGroup:
        t = self.theme
        card = RoundedRectangle(
            width=2.35,
            height=0.92,
            corner_radius=0.14,
            fill_color=t.card_bg,
            fill_opacity=1.0,
            stroke_color=t.curve,
            stroke_width=1.6,
        )
        badge1 = self.build_pill(f"1º {first_name}", bg=t.badge_bg, fg=first_col, font_size=14)
        badge2 = self.build_pill(f"2º {second_name}", bg=t.bg, fg=second_col, font_size=14)
        badge2[0].set_stroke(second_col, width=1.1)
        row = VGroup(badge1, badge2).arrange(RIGHT, buff=0.14).move_to(card.get_center())
        if row.width > 2.15:
            row.set_width(2.15)
        return VGroup(card, row)

    def swap_card(self, old_card: VGroup, new_card: VGroup, *extra_anims, run_time: float = 0.65) -> None:
        self.play(
            FadeOut(old_card, shift=UP * 0.1),
            FadeIn(new_card, shift=UP * 0.1),
            *extra_anims,
            run_time=run_time,
        )

    def construct(self) -> None:
        ok, _, _ = check_latex_tools()
        if not ok:
            raise RuntimeError("LaTeX/dvisvgm não disponível para renderizar CombinatoriaLousaLatex.")

        t = self.theme
        tts_mode = resolve_tts_mode()
        self.camera.background_color = t.bg

        # 1. Cabeçalho padrão do Portal UNEB (Lousa 3B1B)
        axis_pill = self.build_pill("EIXO 2 • PA & CONTAGEM", bg=t.badge_bg, fg=t.badge_text, font_size=14)
        header_title = self.make_label("Soma de Gauss, Arranjo e Combinação", font_size=23, color=t.text_primary, bold=True)
        stage_pill = self.build_pill("Conceito Visual • Lousa 3B1B (LaTeX)", bg=t.card_bg, fg=t.text_secondary, font_size=14)

        left_head = VGroup(axis_pill, header_title).arrange(RIGHT, buff=0.22)
        left_head.to_corner(UP + LEFT, buff=0.38)
        stage_pill.to_corner(UP + RIGHT, buff=0.38)
        divider = Line([-6.65, 2.88, 0], [6.65, 2.88, 0], color=t.card_border, stroke_width=1.5)

        # 2. Dois cards principais
        stage_card = RoundedRectangle(
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

        eq_box = RoundedRectangle(
            width=4.55,
            height=0.88,
            corner_radius=0.14,
            fill_color=t.badge_bg,
            fill_opacity=1.0,
            stroke_color=t.accent_primary,
            stroke_width=1.4,
        ).move_to(info_card.get_top() + DOWN * 0.72)

        footer_note = self.make_label(
            "Depois experimente os sliders no Laboratório Vivo →",
            font_size=14,
            color=t.text_muted,
        ).move_to(info_card.get_bottom() + UP * 0.34)

        panel_anchor = info_card.get_center()

        # ======================================================================
        # BLOCO 1: PARTE 1 — ESCADA DA PA (a₁ = 2 até aₙ = 5, r = +1, n = 4)
        # ======================================================================
        pa_data = calc_pa_soma_gauss(a1=2, r=1, n=4)
        terms = pa_data["terms"]  # [2, 3, 4, 5]
        dx, dy = 0.76, 0.42
        grid_center = [-2.22, -0.35, 0]

        stage_badge_p1 = self.build_pill("PARTE 1 • SOMA DE GAUSS (PA)", bg=t.badge_bg, fg=t.curve, font_size=13)
        stage_badge_p1.move_to([
            stage_card.get_left()[0] + 0.32 + stage_badge_p1.width / 2.0,
            stage_card.get_top()[1] - 0.34,
            0,
        ])

        pa_subtitle = self.make_label("PA: 2, 3, 4, 5   (soma +1 por degrau)", font_size=16, color=t.text_secondary, bold=True)
        pa_subtitle.move_to([grid_center[0], 1.48, 0])

        stairs_orig = self.build_staircase_grid(terms, grid_center, dx, dy, fill_opacity=0.88, stroke_width=1.6)

        col_labels = VGroup()
        for idx, val in enumerate(terms):
            lbl_color = t.y_intercept if idx == 0 else (t.roots if idx == len(terms) - 1 else t.curve)
            tex_str = rf"a_1={val}" if idx == 0 else (rf"a_n={val}" if idx == len(terms) - 1 else str(val))
            lbl = self.make_math(tex_str, font_size=22, color=lbl_color)
            lbl.move_to([stairs_orig[idx].get_center()[0], grid_center[1] - 3.5 * dy - 0.24, 0])
            col_labels.add(lbl)

        base_line = Line(
            [grid_center[0] - 2.0 * dx + 0.04, grid_center[1] - 3.5 * dy - 0.44, 0],
            [grid_center[0] + 2.0 * dx - 0.04, grid_center[1] - 3.5 * dy - 0.44, 0],
            color=t.vertex,
            stroke_width=2.0,
        )
        n_brace = Brace(base_line, DOWN, buff=0.06, color=t.vertex)
        n_brace_lbl = self.make_math(r"n = 4\text{ termos}", font_size=24, color=t.vertex).next_to(n_brace, DOWN, buff=0.08)

        eq_pa_intro = self.make_colored_math(
            r"S_n = a_1 + a_2 + \cdots + a_n",
            {r"S_n": t.curve, r"a_1": t.y_intercept, r"a_n": t.roots},
            font_size=30,
        )
        eq_pa_intro.move_to(eq_box.get_center())

        card_pa1 = self.build_step_card(
            "1. PROGRESSÃO (PA)",
            "Degraus que Crescem Iguais",
            self.make_colored_math(
                r"a_1 = 2 \;\to\; a_4 = 5 \quad (n = 4)",
                {r"a_1": t.y_intercept, r"a_4": t.roots, r"n": t.vertex},
                font_size=28,
            ),
            r"a_1 \text{ e } a_n",
            "a₁ (roxo): primeiro termo\naₙ (verde): último termo",
            ["Queremos somar todos os blocos."],
            t.y_intercept,
            panel_anchor,
        )

        with narrated_block(
            self,
            self.slug,
            "bloco_01_pa_escada",
            "No Eixo dois, imagine uma progressão aritmética em degraus, do primeiro termo a um até o último termo a n.",
            modo=tts_mode,
        ):
            self.play(
                FadeIn(left_head),
                FadeIn(stage_pill),
                Create(divider),
                FadeIn(stage_card),
                FadeIn(info_card),
                run_time=0.8,
            )
            self.play(
                FadeIn(stage_badge_p1),
                FadeIn(pa_subtitle),
                FadeIn(eq_box),
                Write(eq_pa_intro),
                FadeIn(footer_note),
                run_time=0.9,
            )
            self.play(
                *[FadeIn(col, shift=UP * 0.14) for col in stairs_orig],
                FadeIn(col_labels),
                FadeIn(n_brace),
                FadeIn(n_brace_lbl),
                FadeIn(card_pa1),
                run_time=1.6,
            )

        # ======================================================================
        # BLOCO 2: SOMA DE GAUSS — CÓPIA INVERTIDA + DIVISÃO POR 2
        # ======================================================================
        stairs_copy = self.build_staircase_grid(
            terms,
            grid_center,
            dx,
            dy,
            fill_opacity=0.38,
            stroke_width=1.8,
            stroke_color=t.text_secondary,
        )

        rect_outline = DashedVMobject(
            RoundedRectangle(
                width=4 * dx + 0.08,
                height=7 * dy + 0.08,
                corner_radius=0.08,
                stroke_color=t.vertex,
                stroke_width=2.2,
            ).move_to(grid_center),
            num_dashes=36,
        )

        # Barras de altura na esquerda: a₁ (2 blocos embaixo) + aₙ (5 blocos em cima)
        grid_left_x = grid_center[0] - 2.0 * dx - 0.14
        y_bot = grid_center[1] - 3.5 * dy
        y_mid = grid_center[1] - 1.5 * dy
        y_top = grid_center[1] + 3.5 * dy

        bar_a1 = Line([grid_left_x, y_bot + 0.04, 0], [grid_left_x, y_mid - 0.04, 0], color=t.y_intercept, stroke_width=4.0)
        lbl_a1_left = self.make_math(r"a_1 = 2", font_size=22, color=t.y_intercept).next_to(bar_a1, LEFT, buff=0.10)

        bar_an = Line([grid_left_x, y_mid + 0.04, 0], [grid_left_x, y_top - 0.04, 0], color=t.roots, stroke_width=4.0)
        lbl_an_left = self.make_math(r"a_n = 5", font_size=22, color=t.roots).next_to(bar_an, LEFT, buff=0.10)

        lbl_sum_left = self.make_colored_math(
            r"a_1 + a_n = 7",
            {r"a_1": t.y_intercept, r"a_n": t.roots},
            font_size=22,
        )
        lbl_sum_left.move_to([-5.54, grid_center[1] - 0.15, 0])
        if lbl_sum_left.get_left()[0] < stage_card.get_left()[0] + 0.14:
            lbl_sum_left.set_width(1.25)
            lbl_sum_left.move_to([-5.56, grid_center[1] - 0.15, 0])

        # Caixa de conta à direita da grade (dentro do stage_card)
        calc_box = RoundedRectangle(
            width=1.46,
            height=2.15,
            corner_radius=0.12,
            fill_color=t.card_bg,
            fill_opacity=0.95,
            stroke_color=t.card_border,
            stroke_width=1.4,
        ).move_to([0.12, grid_center[1], 0])

        calc_title = self.make_label("Retângulo", font_size=14, color=t.text_muted, bold=True)
        calc_rect = self.make_math(r"7 \cdot 4 = 28", font_size=21, color=t.vertex)
        calc_div = self.make_math(r"\div 2", font_size=22, color=t.danger)
        calc_res = self.make_math(r"S_4 = 14", font_size=24, color=t.curve)
        calc_content = VGroup(calc_title, calc_rect, calc_div, calc_res).arrange(DOWN, buff=0.18).move_to(calc_box.get_center())

        eq_gauss = self.make_colored_gauss_eq(font_size=32).move_to(eq_box.get_center())

        card_gauss = self.build_step_card(
            "1. SOMA DE GAUSS",
            "Retângulo Dividido por 2",
            self.make_colored_gauss_eq(font_size=29),
            r"S_n",
            "Soma dos extremos (a₁ + aₙ)\nvezes a metade dos termos (n / 2).",
            ["2 cópias formam um retângulo de 28."],
            t.roots,
            panel_anchor,
        )

        with narrated_block(
            self,
            self.slug,
            "bloco_02_gauss",
            "Virando uma cópia de cabeça para baixo, formamos um retângulo de largura n por altura a um mais a n. Dividindo por dois: soma dos extremos vezes a metade dos termos.",
            modo=tts_mode,
        ):
            self.add(stairs_copy)
            self.play(
                Rotate(stairs_copy, angle=PI, about_point=grid_center, rate_func=smooth),
                FadeOut(eq_pa_intro),
                FadeIn(eq_gauss),
                run_time=2.0,
            )
            self.play(
                Create(rect_outline),
                Create(bar_a1),
                FadeIn(lbl_a1_left),
                Create(bar_an),
                FadeIn(lbl_an_left),
                FadeIn(lbl_sum_left),
                run_time=1.5,
            )
            self.swap_card(
                card_pa1,
                card_gauss,
                FadeIn(calc_box),
                FadeIn(calc_title),
                FadeIn(calc_rect),
                run_time=0.9,
            )
            self.play(
                stairs_copy.animate.set_fill(opacity=0.13).set_stroke(opacity=0.35),
                FadeIn(calc_div),
                FadeIn(calc_res),
                Indicate(calc_res, color=t.curve, scale_factor=1.18),
                run_time=1.6,
            )

        # ======================================================================
        # BLOCO 3: TRANSIÇÃO PARA COMBINATÓRIA (3 ALUNOS -> ESCOLHER 2)
        # ======================================================================
        part1_stage_items = VGroup(
            stage_badge_p1,
            pa_subtitle,
            stairs_orig,
            stairs_copy,
            col_labels,
            base_line,
            n_brace,
            n_brace_lbl,
            rect_outline,
            bar_a1,
            lbl_a1_left,
            bar_an,
            lbl_an_left,
            lbl_sum_left,
            calc_box,
            calc_content,
        )

        stage_badge_p2 = self.build_pill("PARTE 2 • ARRANJO VS. COMBINAÇÃO", bg=t.badge_bg, fg=t.roots, font_size=13)
        stage_badge_p2.move_to(stage_badge_p1.get_center())

        n_badge = self.build_pill("TOTAL DISPONÍVEL: n = 3 ALUNOS", bg=t.badge_bg, fg=t.vertex, font_size=14)
        chip_ana = self.build_pill("Ana (A)", bg=t.card_bg, fg=t.y_intercept, font_size=18)
        chip_ana[0].set_stroke(t.y_intercept, width=1.8)
        chip_beto = self.build_pill("Beto (B)", bg=t.card_bg, fg=t.curve, font_size=18)
        chip_beto[0].set_stroke(t.curve, width=1.8)
        chip_caio = self.build_pill("Caio (C)", bg=t.card_bg, fg=t.roots, font_size=18)
        chip_caio[0].set_stroke(t.roots, width=1.8)
        chips_row = VGroup(chip_ana, chip_beto, chip_caio).arrange(RIGHT, buff=0.32)

        choose_lbl = self.make_label("Escolher p = 2 vagas:", font_size=17, color=t.y_intercept, bold=True)
        slot1 = DashedVMobject(RoundedRectangle(width=1.45, height=0.58, corner_radius=0.12, stroke_color=t.y_intercept, stroke_width=1.8), num_dashes=14)
        slot2 = DashedVMobject(RoundedRectangle(width=1.45, height=0.58, corner_radius=0.12, stroke_color=t.y_intercept, stroke_width=1.8), num_dashes=14)
        q1 = self.make_label("?", font_size=20, color=t.y_intercept, bold=True).move_to(slot1.get_center())
        q2 = self.make_label("?", font_size=20, color=t.y_intercept, bold=True).move_to(slot2.get_center())
        slots_row = VGroup(choose_lbl, VGroup(slot1, q1), VGroup(slot2, q2)).arrange(RIGHT, buff=0.25)

        q_box = RoundedRectangle(
            width=5.95,
            height=1.35,
            corner_radius=0.16,
            fill_color=t.badge_bg,
            fill_opacity=0.95,
            stroke_color=t.vertex,
            stroke_width=1.8,
        )
        q_tag = self.make_label("PERGUNTA DE OURO NA UNEB", font_size=13, color=t.vertex, bold=True)
        q_main = self.make_label("Trocar a posição muda o resultado?", font_size=21, color=t.text_primary, bold=True)
        q_text = VGroup(q_tag, q_main).arrange(DOWN, buff=0.12).move_to(q_box.get_center())

        intro_p2_group = VGroup(n_badge, chips_row, slots_row, VGroup(q_box, q_text)).arrange(DOWN, buff=0.34)
        intro_p2_group.move_to(stage_card.get_center() + DOWN * 0.12)

        eq_comb_vs = MathTex(r"A_{n,p}", r"\;\;\text{vs}\;\;", r"C_{n,p}", font_size=34, color=t.text_primary)
        eq_comb_vs[0].set_color(t.curve)
        eq_comb_vs[2].set_color(t.roots)
        eq_comb_vs.move_to(eq_box.get_center())

        eq_c_intro = MathTex(r"n = 3", r"\;\text{alunos},\quad", r"p = 2", r"\;\text{escolhidos}", font_size=25, color=t.text_primary)
        eq_c_intro[0].set_color(t.vertex)
        eq_c_intro[2].set_color(t.y_intercept)

        card_c_intro = self.build_step_card(
            "2. CONTAGEM (A vs C)",
            "Ordem Importa ou Só Grupo?",
            eq_c_intro,
            r"n \text{ e } p",
            "n (âmbar): total disponível (3)\np (roxo): quantos escolhemos (2)",
            ["Compare Pódio com Comissão."],
            t.vertex,
            panel_anchor,
        )

        with narrated_block(
            self,
            self.slug,
            "bloco_03_contagem_intro",
            "Agora em contagem: três alunos, Ana, Beto e Caio, para escolher dois. Trocar a ordem muda o resultado?",
            modo=tts_mode,
        ):
            self.play(
                FadeOut(part1_stage_items),
                FadeOut(eq_gauss),
                FadeIn(stage_badge_p2),
                FadeIn(eq_comb_vs),
                run_time=0.9,
            )
            self.swap_card(card_gauss, card_c_intro, FadeIn(intro_p2_group), run_time=1.0)
            self.play(Indicate(q_main, color=t.vertex, scale_factor=1.08), run_time=0.9)

        # ======================================================================
        # BLOCO 4: CASO 1 — PÓDIO 1º / 2º LUGAR (ARRANJO: ORDEM IMPORTA)
        # ======================================================================
        case1_banner = self.build_pill("CASO 1 • PÓDIO 1º E 2º LUGAR (ORDEM IMPORTA)", bg=t.badge_bg, fg=t.curve, font_size=14)
        case1_banner.move_to([-2.70, 1.54, 0])

        pod_left = self.build_podium_card("Ana", t.y_intercept, "Beto", t.curve)
        pod_neq = self.make_math(r"\neq", font_size=36, color=t.vertex)
        pod_right = self.build_podium_card("Beto", t.curve, "Ana", t.y_intercept)
        pod_showcase = VGroup(pod_left, pod_neq, pod_right).arrange(RIGHT, buff=0.28).move_to([-2.70, 0.88, 0])

        pairs_arr = [
            ("(1º Ana, 2º Beto)", "(1º Beto, 2º Ana)"),
            ("(1º Ana, 2º Caio)", "(1º Caio, 2º Ana)"),
            ("(1º Beto, 2º Caio)", "(1º Caio, 2º Beto)"),
        ]
        x_cols = [-4.12, -1.28]
        y_rows = [-0.28, -0.94, -1.60]

        arr_grid = VGroup()
        left_pills: list[VGroup] = []
        right_pills: list[VGroup] = []
        for r_i, (p_l, p_r) in enumerate(pairs_arr):
            pill_l = self.build_pair_pill(p_l, t.curve).move_to([x_cols[0], y_rows[r_i], 0])
            pill_r = self.build_pair_pill(p_r, t.curve).move_to([x_cols[1], y_rows[r_i], 0])
            left_pills.append(pill_l)
            right_pills.append(pill_r)
            arr_grid.add(pill_l, pill_r)

        arr_total_pill = self.build_pill("TOTAL: 6 PÓDIOS DISTINTOS", bg=t.badge_bg, fg=t.curve, font_size=15)
        arr_total_pill.move_to([-2.70, -2.52, 0])

        eq_arr_formula = MathTex(r"A_{3,2}", r"=", r"\frac{3!}{(3-2)!}", r"= 6", font_size=28, color=t.text_primary)
        eq_arr_formula[0].set_color(t.curve)

        card_arr = self.build_step_card(
            "ARRANJO SIMPLES",
            "Pódio 1º e 2º Lugar",
            eq_arr_formula,
            r"A_{n,p} = \frac{n!}{(n-p)!}",
            "COM pódio / ordem importa\n1º Ana, 2º Beto ≠ 1º Beto, 2º Ana.",
            ["Cada troca gera um novo pódio."],
            t.curve,
            panel_anchor,
        )

        with narrated_block(
            self,
            self.slug,
            "bloco_04_arranjo",
            "Num pódio de primeiro e segundo lugares, Ana e Beto é diferente de Beto e Ana. Como a ordem importa, usamos arranjo de n elementos tomados p a p: seis pódios.",
            modo=tts_mode,
        ):
            self.play(
                FadeOut(intro_p2_group),
                FadeIn(case1_banner),
                FadeIn(pod_showcase),
                run_time=0.9,
            )
            self.swap_card(
                card_c_intro,
                card_arr,
                *[FadeIn(p, shift=UP * 0.08) for p in arr_grid],
                run_time=1.4,
            )
            self.play(
                FadeIn(arr_total_pill),
                Indicate(pod_neq, color=t.vertex, scale_factor=1.35),
                run_time=1.0,
            )

        # ======================================================================
        # BLOCO 5: CASO 2 — COMISSÃO SEM CARGOS (COMBINAÇÃO: DIVIDE POR p!)
        # ======================================================================
        case2_banner = self.build_pill("CASO 2 • COMISSÃO SEM CARGOS (SÓ GRUPO)", bg=t.badge_bg, fg=t.roots, font_size=14)
        case2_banner.move_to(case1_banner.get_center())

        grp_left = self.build_pill("{Ana, Beto}", bg=t.card_bg, fg=t.roots, font_size=17)
        grp_left[0].set_stroke(t.roots, width=1.8)
        grp_eq = self.make_math(r"=", font_size=36, color=t.roots)
        grp_right = self.build_pill("{Beto, Ana}", bg=t.card_bg, fg=t.roots, font_size=17)
        grp_right[0].set_stroke(t.roots, width=1.8)
        grp_showcase = VGroup(grp_left, grp_eq, grp_right).arrange(RIGHT, buff=0.32).move_to(pod_showcase.get_center())

        pairs_comb = [
            ("{Ana, Beto}", "{Beto, Ana}"),
            ("{Ana, Caio}", "{Caio, Ana}"),
            ("{Beto, Caio}", "{Caio, Beto}"),
        ]
        comb_pills_left = [self.build_pair_pill(pl, t.roots).move_to([x_cols[0], y_rows[i], 0]) for i, (pl, _) in enumerate(pairs_comb)]
        comb_pills_right = [self.build_pair_pill(pr, t.danger).move_to([x_cols[1], y_rows[i], 0]) for i, (_, pr) in enumerate(pairs_comb)]

        row_boxes = VGroup(
            *[
                DashedVMobject(
                    RoundedRectangle(
                        width=5.48,
                        height=0.60,
                        corner_radius=0.14,
                        stroke_color=t.roots,
                        stroke_width=1.5,
                    ).move_to([-2.70, y_r, 0]),
                    num_dashes=32,
                )
                for y_r in y_rows
            ]
        )

        strikes = VGroup(
            *[
                Line(
                    p.get_left() + RIGHT * 0.16,
                    p.get_right() + LEFT * 0.16,
                    color=t.danger,
                    stroke_width=3.2,
                )
                for p in comb_pills_right
            ]
        )

        div_badge = self.build_pill("÷ p! = 2! = 2", bg=t.card_bg, fg=t.danger, font_size=13)
        div_badge[0].set_stroke(t.danger, width=1.6)
        div_badge.move_to([x_cols[1], 0.28, 0])

        comb_total_pill = self.build_pill("TOTAL: 6 ÷ 2! = 3 COMISSÕES", bg=t.badge_bg, fg=t.roots, font_size=15)
        comb_total_pill.move_to(arr_total_pill.get_center())

        eq_comb_formula = self.make_colored_math(
            r"C_{3,2} = \frac{3!}{2!\,(3-2)!} = 3",
            {r"C_{3,2}": t.roots, r"2!": t.danger},
            font_size=28,
        )

        eq_rel = self.make_colored_math(
            r"C_{n,p} = \frac{A_{n,p}}{p!}",
            {r"C_{n,p}": t.roots, r"A_{n,p}": t.curve, r"p!": t.danger},
            font_size=31,
        )
        eq_rel.move_to(eq_box.get_center())

        card_comb = self.build_step_card(
            "COMBINAÇÃO SIMPLES",
            "Comissão sem Cargos",
            eq_comb_formula,
            r"C_{n,p} = \frac{n!}{p!\,(n-p)!}",
            "SÓ grupo / divide pela repetição p!\n{Ana, Beto} e {Beto, Ana} são iguais.",
            ["Corta as 2! ordens repetidas de cada par."],
            t.roots,
            panel_anchor,
        )

        with narrated_block(
            self,
            self.slug,
            "bloco_05_combinacao",
            "Já numa comissão sem cargos, Ana e Beto formam o mesmo grupo. Dividimos pelo fatorial de p para cortar repetições: três comissões pela combinação.",
            modo=tts_mode,
        ):
            self.play(
                FadeOut(case1_banner),
                FadeIn(case2_banner),
                FadeOut(pod_showcase),
                FadeIn(grp_showcase),
                FadeOut(eq_comb_vs),
                FadeIn(eq_rel),
                *[FadeOut(p) for p in left_pills + right_pills],
                *[FadeIn(p) for p in comb_pills_left + comb_pills_right],
                run_time=1.0,
            )
            self.swap_card(
                card_arr,
                card_comb,
                Create(row_boxes),
                run_time=1.0,
            )
            self.play(
                *[Create(s) for s in strikes],
                *[p.animate.set_opacity(0.28) for p in comb_pills_right],
                FadeIn(div_badge),
                FadeOut(arr_total_pill),
                FadeIn(comb_total_pill),
                run_time=1.3,
            )

        # ======================================================================
        # BLOCO 6: RESUMO FINAL E CONVITE AO LABORATÓRIO VIVO
        # ======================================================================
        part2_stage_items = VGroup(
            stage_badge_p2,
            case2_banner,
            grp_showcase,
            *comb_pills_left,
            *comb_pills_right,
            row_boxes,
            strikes,
            div_badge,
            comb_total_pill,
        )

        sum_badge = self.build_pill("RESUMO DO EIXO 2 • PORTAL UNEB", bg=t.badge_bg, fg=t.accent_primary, font_size=13)
        sum_badge.move_to(stage_badge_p1.get_center())

        box_pa_sum = RoundedRectangle(width=6.35, height=1.9, corner_radius=0.16, fill_color=t.card_bg, fill_opacity=0.95, stroke_color=t.y_intercept, stroke_width=1.6).move_to([-2.70, 0.55, 0])
        pa_sum_title = self.make_label("1. Soma de Gauss (Progressão Aritmética)", font_size=18, color=t.y_intercept, bold=True)
        pa_sum_eq = self.make_colored_gauss_eq(font_size=30)
        pa_sum_hint = self.make_label("Soma dos extremos (a₁ + aₙ) vezes a metade dos termos (n / 2)", font_size=14, color=t.text_secondary)
        pa_sum_grp = VGroup(pa_sum_title, pa_sum_eq, pa_sum_hint).arrange(DOWN, buff=0.14).move_to(box_pa_sum.get_center())

        box_c_sum = RoundedRectangle(width=6.35, height=1.9, corner_radius=0.16, fill_color=t.card_bg, fill_opacity=0.95, stroke_color=t.roots, stroke_width=1.6).move_to([-2.70, -1.65, 0])
        c_sum_title = self.make_label("2. Arranjo vs. Combinação (Trocar a ordem muda?)", font_size=18, color=t.roots, bold=True)
        c_sum_eq = self.make_colored_math(
            r"A_{n,p}\;\text{(COM pódio)} \qquad \text{vs} \qquad C_{n,p} = \frac{A_{n,p}}{p!}\;\text{(SÓ grupo)}",
            {r"A_{n,p}": t.curve, r"C_{n,p}": t.roots, r"p!": t.danger},
            font_size=24,
        )
        c_sum_hint = self.make_label("Na comissão, divida por p! para eliminar ordens repetidas", font_size=14, color=t.text_secondary)
        c_sum_grp = VGroup(c_sum_title, c_sum_eq, c_sum_hint).arrange(DOWN, buff=0.14).move_to(box_c_sum.get_center())
        if c_sum_grp.width > 5.95:
            c_sum_grp.set_width(5.95)

        eq_final_header = self.make_label("Eixo 2 • Visão Geral", font_size=21, color=t.accent_primary, bold=True).move_to(eq_box.get_center())

        card_final = self.build_step_card(
            "RESUMO DO EIXO 2",
            "Pronto para Experimentar!",
            MathTex(r"S_n \quad|\quad A_{n,p} \quad|\quad C_{n,p}", font_size=27, color=t.accent_primary),
            r"S_n,\; A_{n,p},\; C_{n,p}",
            "PA: extremos × metade dos termos.\nContagem: pódio usa A, grupo divide por p!.",
            ["Ajuste n, p, a₁ e r logo abaixo."],
            t.accent_primary,
            panel_anchor,
        )

        with narrated_block(
            self,
            self.slug,
            "bloco_06_resumo",
            "Resumo: extremos na soma e ordem no pódio. Teste os controles no Laboratório Vivo abaixo.",
            pad=0.5,
            modo=tts_mode,
        ):
            self.play(
                FadeOut(part2_stage_items),
                FadeOut(eq_rel),
                FadeIn(sum_badge),
                FadeIn(eq_final_header),
                FadeIn(box_pa_sum),
                FadeIn(pa_sum_grp),
                FadeIn(box_c_sum),
                FadeIn(c_sum_grp),
                run_time=1.0,
            )
            self.swap_card(card_comb, card_final, run_time=0.9)
