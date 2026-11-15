"""Eixo 4 — Geometria e Trigonometria: Ciclo Unitário e Onda Senoidal (Estágio 1: Conceito Visual).

Implementação oficial no estilo Jeito B (Lousa 3B1B com LaTeX — `CANVAS_DARK_THEME`):
- Classe exportável: `TrigonometriaLousaLatex` (slug `eixo4_trigonometria`)
- Ciclo trigonométrico unitário (R = 1) sincronizado em altura com a onda `y = sen(θ)`
- Vínculo estrito por cor + caixas "Em português claro" + locução via `scripts.math_tts.narrar_aula`
"""

from __future__ import annotations

from contextlib import contextmanager
import math
import numpy as np

from manim import (
    BOLD,
    DOWN,
    LEFT,
    RIGHT,
    UP,
    Circle,
    Create,
    DashedLine,
    Dot,
    FadeIn,
    FadeOut,
    Indicate,
    Line,
    MathTex,
    NumberPlane,
    Polygon,
    RoundedRectangle,
    Scene,
    Sector,
    Text,
    VGroup,
    ValueTracker,
    always_redraw,
    smooth,
)

from config import (
    CANVAS_DARK_THEME,
    FONT_MONO,
    FONT_UI,
    SceneTheme,
    build_plain_pt_box,
    check_latex_tools,
    get_audio_path,
    sync_audio_block,
)
from scripts.math_tts import narrar_aula


RAD_LABELS: dict[int, str] = {
    0: "0",
    30: "π/6",
    45: "π/4",
    60: "π/3",
    90: "π/2",
    120: "2π/3",
    135: "3π/4",
    150: "5π/6",
    180: "π",
    210: "7π/6",
    225: "5π/4",
    240: "4π/3",
    270: "3π/2",
    300: "5π/3",
    315: "7π/4",
    330: "11π/6",
    360: "2π",
}


def calc_unit_circle_features(deg: float) -> dict[str, float]:
    """Retorna ângulo em radianos, cos(θ) e sen(θ) limpos para evitar -0.00."""
    rad = math.radians(deg)
    cos_v = math.cos(rad)
    sin_v = math.sin(rad)
    if abs(cos_v) < 1e-6:
        cos_v = 0.0
    if abs(sin_v) < 1e-6:
        sin_v = 0.0
    return {"rad": rad, "cos": cos_v, "sin": sin_v}


def format_rad_badge(deg: float) -> str:
    """Formata ângulo em graus seguido do equivalente em radianos."""
    rounded = int(round(deg)) % 360
    if abs(deg - 360.0) < 0.6:
        rounded = 360
    rad_txt = RAD_LABELS.get(rounded)
    if rad_txt is None:
        rad_txt = f"{rounded / 180:.2f}π"
    return f"θ = {rounded}° ({rad_txt})"


class TrigonometriaLousaLatex(Scene):
    """Jeito B: Lousa 3B1B com LaTeX e locução PT-BR para o Eixo 4 (Trigonometria)."""

    theme: SceneTheme = CANVAS_DARK_THEME
    slug: str = "eixo4_trigonometria"
    enable_narration: bool = True

    def make_label(
        self,
        text: str,
        font_size: int = 18,
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

    def make_plot_tag(
        self,
        text: str,
        color: str,
        font_size: int = 13,
        z_index: int = 6,
    ) -> Text:
        lbl = self.make_label(text, font_size=font_size, color=color, bold=True, mono=True)
        lbl.add_background_rectangle(color=self.theme.plot_bg, opacity=0.88, buff=0.04)
        lbl.set_z_index(z_index)
        return lbl

    def build_pill(self, label_text: str, bg: str, fg: str, font_size: int = 14) -> VGroup:
        txt = self.make_label(label_text, font_size=font_size, color=fg, bold=True)
        box = RoundedRectangle(
            width=txt.width + 0.34,
            height=txt.height + 0.18,
            corner_radius=0.16,
            fill_color=bg,
            fill_opacity=1.0,
            stroke_width=0,
        )
        return VGroup(box, txt.move_to(box.get_center()))

    def build_left_panel_content(
        self,
        step_badge: str,
        title_text: str,
        formula_mob,
        note_text: str,
        accent_color: str,
        panel_center,
    ) -> VGroup:
        badge = self.build_pill(step_badge, bg=self.theme.badge_bg, fg=accent_color, font_size=12)
        title = self.make_label(title_text, font_size=18, color=self.theme.text_primary, bold=True)
        head = VGroup(badge, title).arrange(RIGHT, buff=0.18)
        if head.width > 5.75:
            head.set_width(5.75)

        if formula_mob.width > 5.75:
            formula_mob.set_width(5.75)
        if formula_mob.height > 0.72:
            formula_mob.set_height(0.72)

        note = self.make_label(note_text, font_size=14, color=self.theme.text_secondary)
        if note.width > 5.75:
            note.set_width(5.75)

        group = VGroup(head, formula_mob, note).arrange(DOWN, aligned_edge=LEFT, buff=0.18)
        if group.width > 5.75:
            group.set_width(5.75)
        if group.height > 1.78:
            group.set_height(1.78)
        group.move_to(panel_center)
        return group

    def build_right_plain_content(
        self,
        simbolo: str,
        traducao: str,
        accent_color: str,
        panel_center,
        panel_top,
    ) -> VGroup:
        plain_box = build_plain_pt_box(
            simbolo,
            traducao,
            accent_color=accent_color,
            theme=self.theme,
            use_latex=True,
            max_width=6.36,
        )
        if plain_box.height > 1.44:
            plain_box.set_height(1.44)
        plain_box.move_to([panel_center[0], panel_top[1] - 0.14 - plain_box.height / 2.0, 0.0])
        return plain_box

    @contextmanager
    def narrated_step(
        self,
        clip_name: str,
        spoken_text: str,
        *,
        pad: float = 0.35,
        min_duration: float = 2.0,
    ):
        """Gera áudio .mp3 em AUDIO_CACHE_DIR via narrar_aula e sincroniza o bloco."""
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

    def swap_bottom_panels(
        self,
        old_left: VGroup,
        new_left: VGroup,
        old_right: VGroup,
        new_right: VGroup,
        *extra_anims,
        run_time: float = 0.65,
    ) -> None:
        self.play(
            FadeOut(old_left, shift=UP * 0.08),
            FadeIn(new_left, shift=UP * 0.08),
            FadeOut(old_right, shift=UP * 0.08),
            FadeIn(new_right, shift=UP * 0.08),
            *extra_anims,
            run_time=run_time,
        )

    def construct(self) -> None:
        ok, _, _ = check_latex_tools()
        if not ok:
            raise RuntimeError("LaTeX/dvisvgm não disponível para renderizar TrigonometriaLousaLatex.")

        t = self.theme
        self.camera.background_color = t.bg

        # 1. Cabeçalho
        axis_pill = self.build_pill("EIXO 4 • TRIGONOMETRIA", bg=t.badge_bg, fg=t.badge_text, font_size=14)
        header_title = self.make_label("Ciclo Trigonométrico e Onda Senoidal", font_size=24, color=t.text_primary, bold=True)
        stage_pill = self.build_pill("Conceito Visual • Lousa 3B1B (LaTeX)", bg=t.card_bg, fg=t.text_secondary, font_size=13)

        left_head = VGroup(axis_pill, header_title).arrange(RIGHT, buff=0.22)
        left_head.to_corner(UP + LEFT, buff=0.38)
        stage_pill.to_corner(UP + RIGHT, buff=0.38)
        divider = Line([-6.65, 2.94, 0], [6.65, 2.94, 0], color=t.card_border, stroke_width=1.5)

        # 2. Cards Superiores (Esquerda: Ciclo R=1 | Direita: Onda Senoidal)
        circle_card = RoundedRectangle(
            width=4.86,
            height=4.24,
            corner_radius=0.18,
            fill_color=t.plot_bg,
            fill_opacity=1.0,
            stroke_color=t.card_border,
            stroke_width=1.8,
        ).move_to([-4.22, 0.68, 0])

        wave_card = RoundedRectangle(
            width=8.16,
            height=4.24,
            corner_radius=0.18,
            fill_color=t.plot_bg,
            fill_opacity=1.0,
            stroke_color=t.card_border,
            stroke_width=1.8,
        ).move_to([2.57, 0.68, 0])

        # Cards Inferiores (Esquerda: Fórmula/Leitura | Direita: Em português claro)
        bottom_left_card = RoundedRectangle(
            width=6.20,
            height=2.08,
            corner_radius=0.18,
            fill_color=t.card_bg,
            fill_opacity=1.0,
            stroke_color=t.card_border,
            stroke_width=1.8,
        ).move_to([-3.55, -2.64, 0])

        bottom_right_card = RoundedRectangle(
            width=6.82,
            height=2.08,
            corner_radius=0.18,
            fill_color=t.card_bg,
            fill_opacity=1.0,
            stroke_color=t.card_border,
            stroke_width=1.8,
        ).move_to([3.24, -2.64, 0])

        # 3. Ciclo Trigonométrico Unitário (R = 1)
        circle_center = np.array([-4.22, 0.56, 0.0])
        unit_radius = 1.35

        circle_title = self.make_label("Ciclo Unitário (R = 1)", font_size=14, color=t.text_secondary, bold=True)
        circle_title.move_to(circle_card.get_corner(UP + LEFT) + RIGHT * (0.24 + circle_title.width / 2.0) + DOWN * 0.28)

        unit_circle = Circle(radius=unit_radius, color=t.axis, stroke_width=2.4).move_to(circle_center)

        c_x_axis = Line(
            circle_center + LEFT * (unit_radius + 0.30),
            circle_center + RIGHT * (unit_radius + 0.30),
            color=t.axis,
            stroke_width=1.6,
        )
        c_y_axis = Line(
            circle_center + DOWN * (unit_radius + 0.24),
            circle_center + UP * (unit_radius + 0.24),
            color=t.axis,
            stroke_width=1.6,
        )

        # Rótulos cardeais (graus primeiro + radianos sutis onde cabe)
        cardinal_labels = VGroup(
            self.make_plot_tag("0°", t.text_muted, font_size=12).next_to(circle_center + RIGHT * unit_radius, RIGHT + DOWN * 0.35, buff=0.1),
            self.make_plot_tag("90°", t.text_muted, font_size=12).next_to(circle_center + UP * unit_radius, UP, buff=0.08),
            self.make_plot_tag("180°", t.text_muted, font_size=12).next_to(circle_center + LEFT * unit_radius, LEFT, buff=0.1),
            self.make_plot_tag("270°", t.text_muted, font_size=12).next_to(circle_center + DOWN * unit_radius, DOWN, buff=0.08),
        )
        quad_labels = VGroup(
            self.make_label("1ºQ", font_size=11, color=t.text_muted, mono=True).set_opacity(0.6).move_to(circle_center + RIGHT * 1.45 + UP * 1.42),
            self.make_label("2ºQ", font_size=11, color=t.text_muted, mono=True).set_opacity(0.6).move_to(circle_center + LEFT * 1.45 + UP * 1.42),
            self.make_label("3ºQ", font_size=11, color=t.text_muted, mono=True).set_opacity(0.6).move_to(circle_center + LEFT * 1.45 + DOWN * 1.42),
            self.make_label("4ºQ", font_size=11, color=t.text_muted, mono=True).set_opacity(0.6).move_to(circle_center + RIGHT * 1.45 + DOWN * 1.42),
        )

        # 4. Plano da Onda Senoidal (y = sen θ) com escala Y 100% alinhada ao raio R = 1
        wave_title_txt = self.make_label("Onda Senoidal:", font_size=14, color=t.text_secondary, bold=True)
        wave_title_tex = MathTex(r"y = \operatorname{sen}\theta", font_size=22, color=t.roots)
        wave_title = VGroup(wave_title_txt, wave_title_tex).arrange(RIGHT, buff=0.12)
        wave_title.move_to(wave_card.get_corner(UP + LEFT) + RIGHT * (0.26 + wave_title.width / 2.0) + DOWN * 0.27)

        leg_sin = VGroup(
            Dot(radius=0.055, color=t.roots),
            self.make_label("sen θ (em pé)", font_size=12, color=t.roots, bold=True),
        ).arrange(RIGHT, buff=0.08)
        leg_cos = VGroup(
            Dot(radius=0.055, color=t.curve),
            self.make_label("cos θ (deitado)", font_size=12, color=t.curve, bold=True),
        ).arrange(RIGHT, buff=0.08)
        wave_legend = VGroup(leg_sin, leg_cos).arrange(RIGHT, buff=0.26)
        wave_legend.move_to(wave_card.get_corner(UP + RIGHT) + LEFT * (0.24 + wave_legend.width / 2.0) + DOWN * 0.27)

        wave_plane = NumberPlane(
            x_range=(0, 360, 90),
            y_range=(-1.25, 1.25, 0.5),
            x_length=6.60,
            y_length=2.50 * unit_radius,
            background_line_style={
                "stroke_color": t.grid,
                "stroke_width": 1.1,
                "stroke_opacity": 0.9,
            },
            axis_config={
                "stroke_color": t.axis,
                "stroke_width": 1.8,
                "include_numbers": False,
            },
        )
        wave_plane.shift(np.array([-0.72, circle_center[1], 0.0]) - wave_plane.c2p(0, 0))

        amp_guides = VGroup(
            DashedLine(wave_plane.c2p(0, 1), wave_plane.c2p(360, 1), color=t.grid, stroke_width=1.4, dash_length=0.1),
            DashedLine(wave_plane.c2p(0, -1), wave_plane.c2p(360, -1), color=t.grid, stroke_width=1.4, dash_length=0.1),
        )

        wave_y_ticks = VGroup(
            self.make_plot_tag("+1", t.roots, font_size=12).next_to(wave_plane.c2p(0, 1), LEFT, buff=0.1),
            self.make_plot_tag("0", t.text_muted, font_size=12).next_to(wave_plane.c2p(0, 0), LEFT, buff=0.1),
            self.make_plot_tag("-1", t.roots, font_size=12).next_to(wave_plane.c2p(0, -1), LEFT, buff=0.1),
        )
        wave_x_ticks = VGroup()
        for deg_tick, rad_tick in ((90, "π/2"), (180, "π"), (270, "3π/2"), (360, "2π")):
            deg_lbl = self.make_plot_tag(f"{deg_tick}°", t.text_secondary, font_size=12)
            rad_lbl = self.make_plot_tag(rad_tick, t.text_muted, font_size=11)
            pair = VGroup(deg_lbl, rad_lbl).arrange(DOWN, buff=0.04)
            pair.next_to(wave_plane.c2p(deg_tick, 0), DOWN, buff=0.12)
            wave_x_ticks.add(pair)

        # 5. Trackers dinâmicos e elementos sincronizados (always_redraw sem MathTex por frame)
        theta_tr = ValueTracker(0.0)
        wave_state = {"max_deg": 0.0, "locked_full": False}
        highlight_state = {"pythagoras": False}

        def get_circle_pt(deg: float) -> np.ndarray:
            feats = calc_unit_circle_features(deg)
            return circle_center + unit_radius * np.array([feats["cos"], feats["sin"], 0.0])

        def build_angle_sector():
            deg = theta_tr.get_value()
            rad = math.radians(deg)
            if rad < 0.03 or deg >= 359.0:
                return VGroup()
            fade_scale = 1.0 if deg <= 350.0 else max(0.0, (359.0 - deg) / 9.0)
            return Sector(
                radius=unit_radius * 0.28,
                start_angle=0.0,
                angle=rad,
                arc_center=circle_center,
                fill_color=t.y_intercept,
                fill_opacity=0.22 * fade_scale,
                stroke_width=1.4,
                stroke_color=t.y_intercept,
                stroke_opacity=fade_scale,
            )

        def build_triangle_fill():
            if not highlight_state["pythagoras"]:
                return VGroup()
            deg = theta_tr.get_value()
            feats = calc_unit_circle_features(deg)
            if abs(feats["cos"]) < 0.12 or abs(feats["sin"]) < 0.12:
                return VGroup()
            px = circle_center + RIGHT * (unit_radius * feats["cos"])
            p = get_circle_pt(deg)
            tri = Polygon(
                circle_center,
                px,
                p,
                fill_color=t.vertex,
                fill_opacity=0.18,
                stroke_width=0,
            )
            sq_size = 0.16
            sx = -sq_size if feats["cos"] > 0 else sq_size
            sy = sq_size if feats["sin"] > 0 else -sq_size
            elbow = VGroup(
                Line(px + RIGHT * sx, px + RIGHT * sx + UP * sy, color=t.vertex, stroke_width=2.0),
                Line(px + RIGHT * sx + UP * sy, px + UP * sy, color=t.vertex, stroke_width=2.0),
            )
            return VGroup(tri, elbow)

        def build_cos_leg():
            feats = calc_unit_circle_features(theta_tr.get_value())
            end_pt = circle_center + RIGHT * (unit_radius * feats["cos"])
            if abs(feats["cos"]) < 0.02:
                return VGroup()
            return Line(circle_center, end_pt, color=t.curve, stroke_width=4.6).set_z_index(4)

        def build_sin_leg():
            deg = theta_tr.get_value()
            feats = calc_unit_circle_features(deg)
            base_pt = circle_center + RIGHT * (unit_radius * feats["cos"])
            tip_pt = get_circle_pt(deg)
            if abs(feats["sin"]) < 0.02:
                return VGroup()
            return Line(base_pt, tip_pt, color=t.roots, stroke_width=4.6).set_z_index(4)

        def build_radius_line():
            p = get_circle_pt(theta_tr.get_value())
            col = t.vertex if highlight_state["pythagoras"] else t.text_primary
            sw = 3.8 if highlight_state["pythagoras"] else 2.4
            return Line(circle_center, p, color=col, stroke_width=sw).set_z_index(3)

        def build_radius_tag():
            p = get_circle_pt(theta_tr.get_value())
            mid = (circle_center + p) * 0.5
            vec = p - circle_center
            norm = np.linalg.norm(vec)
            if norm < 0.2:
                return VGroup()
            perp = np.array([-vec[1], vec[0], 0.0]) / norm
            col = t.vertex if highlight_state["pythagoras"] else t.text_secondary
            lbl = self.make_plot_tag("R=1", color=col, font_size=12, z_index=7)
            lbl.move_to(mid + perp * 0.24)
            return lbl

        def build_circle_dot():
            return Dot(get_circle_pt(theta_tr.get_value()), radius=0.09, color=t.vertex).set_z_index(7)

        def build_leg_tags():
            deg = theta_tr.get_value()
            feats = calc_unit_circle_features(deg)
            grp = VGroup()
            if abs(feats["cos"]) > 0.26:
                cos_mid = circle_center + RIGHT * (unit_radius * feats["cos"] * 0.5)
                cos_dir = DOWN if feats["sin"] >= 0 else UP
                cos_lbl = self.make_plot_tag("cos", t.curve, font_size=12, z_index=6)
                cos_lbl.next_to(cos_mid, cos_dir, buff=0.12)
                grp.add(cos_lbl)
            if abs(feats["sin"]) > 0.26:
                base_pt = circle_center + RIGHT * (unit_radius * feats["cos"])
                tip_pt = get_circle_pt(deg)
                sin_mid = (base_pt + tip_pt) * 0.5
                sin_dir = RIGHT if feats["cos"] >= 0 else LEFT
                sin_lbl = self.make_plot_tag("sen", t.roots, font_size=12, z_index=6)
                sin_lbl.next_to(sin_mid, sin_dir, buff=0.12)
                grp.add(sin_lbl)
            return grp

        def build_theta_badge():
            txt = format_rad_badge(theta_tr.get_value())
            lbl = self.make_label(txt, font_size=13, color=t.vertex, bold=True, mono=True)
            lbl.move_to(circle_card.get_corner(UP + RIGHT) + LEFT * (0.22 + lbl.width / 2.0) + DOWN * 0.28)
            return lbl

        def build_wave_curve():
            deg = theta_tr.get_value()
            if not wave_state["locked_full"]:
                wave_state["max_deg"] = max(wave_state["max_deg"], deg)
            end_deg = 360.0 if wave_state["locked_full"] else wave_state["max_deg"]
            if end_deg < 1.0:
                return VGroup()
            return wave_plane.plot(
                lambda d: math.sin(math.radians(d)),
                x_range=[0.0, end_deg, 2.5],
                color=t.roots,
                stroke_width=3.8,
            ).set_z_index(4)

        def build_wave_height_bar():
            deg = theta_tr.get_value()
            feats = calc_unit_circle_features(deg)
            if abs(feats["sin"]) < 0.02:
                return VGroup()
            p0 = wave_plane.c2p(deg, 0.0)
            p1 = wave_plane.c2p(deg, feats["sin"])
            return Line(p0, p1, color=t.roots, stroke_width=4.6).set_z_index(5)

        def build_wave_dot():
            deg = theta_tr.get_value()
            feats = calc_unit_circle_features(deg)
            return Dot(wave_plane.c2p(deg, feats["sin"]), radius=0.085, color=t.roots).set_z_index(7)

        def build_projection_bridge():
            deg = theta_tr.get_value()
            feats = calc_unit_circle_features(deg)
            p_circle = get_circle_pt(deg)
            p_wave = wave_plane.c2p(deg, feats["sin"])
            return DashedLine(
                p_circle,
                p_wave,
                color=t.roots,
                stroke_width=2.0,
                dash_length=0.12,
            ).set_opacity(0.85).set_z_index(5)

        angle_sector = always_redraw(build_angle_sector)
        tri_fill = always_redraw(build_triangle_fill)
        cos_leg = always_redraw(build_cos_leg)
        sin_leg = always_redraw(build_sin_leg)
        radius_line = always_redraw(build_radius_line)
        radius_tag = always_redraw(build_radius_tag)
        circle_dot = always_redraw(build_circle_dot)
        leg_tags = always_redraw(build_leg_tags)
        theta_badge = always_redraw(build_theta_badge)

        wave_curve = always_redraw(build_wave_curve)
        wave_height_bar = always_redraw(build_wave_height_bar)
        wave_dot = always_redraw(build_wave_dot)
        projection_bridge = always_redraw(build_projection_bridge)

        bottom_left_anchor = bottom_left_card.get_center()
        bottom_right_center = bottom_right_card.get_center()
        bottom_right_top = bottom_right_card.get_top()

        footer_note = self.make_label(
            "Depois explore o círculo e os quadrantes no Laboratório Vivo →",
            font_size=13,
            color=t.text_muted,
        ).move_to(bottom_right_card.get_bottom() + UP * 0.22)

        # ======================================================================
        # BLOCO 1 — Visão Geométrica (Ordem visual antes da formalização)
        # ======================================================================
        f1 = MathTex(
            r"\operatorname{sen}\theta",
            r"\;\text{(em pé)}",
            r"\quad|\quad",
            r"\cos\theta",
            r"\;\text{(deitado)}",
            font_size=28,
            color=t.text_primary,
        )
        f1[0].set_color(t.roots)
        f1[1].set_color(t.roots)
        f1[3].set_color(t.curve)
        f1[4].set_color(t.curve)

        left_b1 = self.build_left_panel_content(
            "1. VISÃO GEOMÉTRICA",
            "Seno e Cosseno no Raio 1",
            f1,
            "A linha pontilhada verde leva a altura do círculo direto para a onda.",
            t.roots,
            bottom_left_anchor,
        )
        right_b1 = self.build_right_plain_content(
            r"\operatorname{sen}\theta \;\;|\;\; \cos\theta",
            "sen θ (verde) = altura em pé no eixo vertical.\ncos θ (azul) = largura deitada no eixo horizontal.",
            t.roots,
            bottom_right_center,
            bottom_right_top,
        )

        with self.narrated_step(
            "bloco_01_intro",
            "No ciclo de raio um, a altura em verde é o seno, e a largura em azul é o cosseno.",
            pad=0.30,
            min_duration=5.2,
        ):
            self.play(
                FadeIn(left_head),
                FadeIn(stage_pill),
                Create(divider),
                FadeIn(circle_card),
                FadeIn(wave_card),
                FadeIn(bottom_left_card),
                FadeIn(bottom_right_card),
                run_time=0.8,
            )
            self.play(
                FadeIn(circle_title),
                Create(c_x_axis),
                Create(c_y_axis),
                Create(unit_circle),
                FadeIn(cardinal_labels),
                FadeIn(quad_labels),
                FadeIn(wave_title),
                FadeIn(wave_legend),
                Create(wave_plane),
                FadeIn(amp_guides),
                FadeIn(wave_y_ticks),
                FadeIn(wave_x_ticks),
                FadeIn(footer_note),
                run_time=1.2,
            )
            self.add(
                angle_sector,
                tri_fill,
                cos_leg,
                sin_leg,
                radius_line,
                radius_tag,
                circle_dot,
                leg_tags,
                theta_badge,
                wave_curve,
                wave_height_bar,
                wave_dot,
                projection_bridge,
            )
            self.play(
                theta_tr.animate.set_value(45.0),
                FadeIn(left_b1),
                FadeIn(right_b1),
                run_time=2.4,
                rate_func=smooth,
            )

        # ======================================================================
        # BLOCO 2 — Arcos Notáveis (Graus primeiro, radianos junto: 30°, 45°, 60°)
        # ======================================================================
        f2 = MathTex(
            r"30^\circ (\tfrac{\pi}{6}): \tfrac{1}{2}",
            r"\quad|\quad",
            r"45^\circ (\tfrac{\pi}{4}): \tfrac{\sqrt{2}}{2}",
            r"\quad|\quad",
            r"60^\circ (\tfrac{\pi}{3}): \tfrac{\sqrt{3}}{2}",
            font_size=24,
            color=t.text_primary,
        )
        f2[0].set_color(t.roots)
        f2[2].set_color(t.vertex)
        f2[4].set_color(t.curve)

        left_b2 = self.build_left_panel_content(
            "2. ARCOS NOTÁVEIS",
            "Graus antes, Radianos junto",
            f2,
            "Valores de sen θ no 1º Quadrante (30°, 45° e 60°).",
            t.accent_primary,
            bottom_left_anchor,
        )
        right_b2 = self.build_right_plain_content(
            r"30^\circ,\; 45^\circ,\; 60^\circ",
            "De 30 para 60 graus, a altura (seno) cresce\ne a largura (cosseno) diminui.",
            t.accent_primary,
            bottom_right_center,
            bottom_right_top,
        )

        notable_markers = VGroup()
        for deg_m in (30, 45, 60):
            s_m = math.sin(math.radians(deg_m))
            notable_markers.add(Dot(wave_plane.c2p(deg_m, s_m), radius=0.055, color=t.vertex).set_z_index(6))

        with self.narrated_step(
            "bloco_02_notaveis",
            "Nos arcos notáveis: em trinta graus, pi sobre seis, o seno vale um meio. Em quarenta e cinco, raiz de dois sobre dois. Em sessenta, pi sobre três, sobe para raiz de três sobre dois.",
            pad=0.30,
            min_duration=7.5,
        ):
            self.swap_bottom_panels(left_b1, left_b2, right_b1, right_b2, run_time=0.6)
            self.play(theta_tr.animate.set_value(30.0), run_time=1.1, rate_func=smooth)
            self.play(FadeIn(notable_markers[0]), run_time=0.25)
            self.wait(0.8)
            self.play(theta_tr.animate.set_value(45.0), run_time=1.1, rate_func=smooth)
            self.play(FadeIn(notable_markers[1]), run_time=0.25)
            self.wait(0.8)
            self.play(theta_tr.animate.set_value(60.0), run_time=1.1, rate_func=smooth)
            self.play(FadeIn(notable_markers[2]), run_time=0.25)

        # ======================================================================
        # BLOCO 3 — Simetria nos Quadrantes (30° ↔ 150°)
        # ======================================================================
        f3 = MathTex(
            r"150^\circ (5\pi/6):\;\;",
            r"\operatorname{sen}150^\circ = +\tfrac{1}{2}",
            r"\;\;|\;\;",
            r"\cos 150^\circ = -\tfrac{\sqrt{3}}{2}",
            font_size=24,
            color=t.text_primary,
        )
        f3[0].set_color(t.y_intercept)
        f3[1].set_color(t.roots)
        f3[3].set_color(t.curve)

        left_b3 = self.build_left_panel_content(
            "3. SIMETRIA NO 2º QUADRANTE",
            "Redução: 150° espelha 30°",
            f3,
            "180° - 30° = 150°: mesma altura em pé, lado oposto deitado.",
            t.y_intercept,
            bottom_left_anchor,
        )
        right_b3 = self.build_right_plain_content(
            r"180^\circ - 30^\circ = 150^\circ",
            "Mesma altura acima do eixo horizontal: seno positivo (+).\nLado esquerdo do círculo: cosseno negativo (-).",
            t.y_intercept,
            bottom_right_center,
            bottom_right_top,
        )

        p30 = get_circle_pt(30.0)
        p150 = get_circle_pt(150.0)
        sym_circle_dot = Dot(p30, radius=0.075, color=t.y_intercept).set_z_index(6)
        sym_circle_lbl = self.make_plot_tag("30°", t.y_intercept, font_size=12, z_index=6).next_to(sym_circle_dot, UP + RIGHT, buff=0.06)
        sym_circle_mirror = DashedLine(p30, p150, color=t.y_intercept, stroke_width=2.2, dash_length=0.12).set_z_index(5)
        sym_wave_dot = Dot(wave_plane.c2p(150.0, 0.5), radius=0.065, color=t.y_intercept).set_z_index(6)
        sym_wave_mirror = DashedLine(
            wave_plane.c2p(30.0, 0.5),
            wave_plane.c2p(150.0, 0.5),
            color=t.y_intercept,
            stroke_width=1.8,
            dash_length=0.12,
        ).set_z_index(5)
        sym_group = VGroup(sym_circle_dot, sym_circle_lbl, sym_circle_mirror, sym_wave_dot, sym_wave_mirror)

        with self.narrated_step(
            "bloco_03_simetria",
            "No segundo quadrante, cento e cinquenta graus tem a mesma altura de trinta graus: seno igual a um meio, mas cosseno negativo à esquerda.",
            pad=0.30,
            min_duration=6.5,
        ):
            self.swap_bottom_panels(
                left_b2,
                left_b3,
                right_b2,
                right_b3,
                FadeOut(notable_markers),
                run_time=0.65,
            )
            self.play(theta_tr.animate.set_value(150.0), run_time=2.6, rate_func=smooth)
            self.play(Create(sym_circle_mirror), FadeIn(sym_circle_dot), FadeIn(sym_circle_lbl), run_time=0.9)
            self.play(Create(sym_wave_mirror), FadeIn(sym_wave_dot), run_time=0.8)

        # ======================================================================
        # BLOCO 4 — Volta Completa (3ºQ e 4ºQ até 360° / 2π)
        # ======================================================================
        f4 = MathTex(
            r"1^\circ\text{Q}(+,\,+)",
            r"\;\;|\;\;",
            r"2^\circ\text{Q}(-,\,+)",
            r"\;\;|\;\;",
            r"3^\circ\text{Q}(-,\,-)",
            r"\;\;|\;\;",
            r"4^\circ\text{Q}(+,\,-)",
            font_size=22,
            color=t.text_secondary,
        )
        f4[0].set_color(t.roots)
        f4[2].set_color(t.y_intercept)
        f4[4].set_color(t.danger)
        f4[6].set_color(t.curve)

        left_b4 = self.build_left_panel_content(
            "4. OS 4 QUADRANTES",
            "1 volta (360° = 2π) completa a onda",
            f4,
            "Sinais (cos, sen): 3ºQ e 4ºQ têm altura abaixo do eixo X.",
            t.roots,
            bottom_left_anchor,
        )
        right_b4 = self.build_right_plain_content(
            r"y = \operatorname{sen}\theta \in [-1,\; 1]",
            "Acima do eixo horizontal (1ºQ e 2ºQ): seno positivo.\nAbaixo do eixo horizontal (3ºQ e 4ºQ): seno negativo.",
            t.roots,
            bottom_right_center,
            bottom_right_top,
        )

        with self.narrated_step(
            "bloco_04_onda_completa",
            "Completando trezentos e sessenta graus, dois pi, a altura negativa desenha a parte de baixo da onda.",
            pad=0.30,
            min_duration=6.0,
        ):
            self.swap_bottom_panels(
                left_b3,
                left_b4,
                right_b3,
                right_b4,
                FadeOut(sym_group),
                run_time=0.6,
            )
            self.play(theta_tr.animate.set_value(360.0), run_time=4.4, rate_func=smooth)

        # Trava a onda completa [0°, 360°] na tela antes de focar o triângulo retângulo
        wave_state["locked_full"] = True

        # ======================================================================
        # BLOCO 5 — Relação Fundamental (Pitágoras no Ciclo Unitário)
        # ======================================================================
        f5 = MathTex(
            r"\operatorname{sen}^2\theta",
            r"+",
            r"\cos^2\theta",
            r"=",
            r"1",
            font_size=34,
            color=t.text_primary,
        )
        f5[0].set_color(t.roots)
        f5[2].set_color(t.curve)
        f5[4].set_color(t.vertex)

        left_b5 = self.build_left_panel_content(
            "5. RELAÇÃO FUNDAMENTAL",
            "Pitágoras dentro do Ciclo Unitário",
            f5,
            "Em 45°: (√2/2)² + (√2/2)² = 1/2 + 1/2 = 1.",
            t.vertex,
            bottom_left_anchor,
        )
        right_b5 = self.build_right_plain_content(
            r"\operatorname{sen}^2\theta + \cos^2\theta = 1",
            "Teorema de Pitágoras no círculo de raio 1:\naltura² + largura² = hipotenusa² (1²).",
            t.vertex,
            bottom_right_center,
            bottom_right_top,
        )

        highlight_state["pythagoras"] = True
        with self.narrated_step(
            "bloco_05_fundamental",
            "Pelo triângulo retângulo no círculo, seno ao quadrado mais cosseno ao quadrado é sempre igual a um.",
            pad=0.30,
            min_duration=6.0,
        ):
            self.swap_bottom_panels(
                left_b4,
                left_b5,
                right_b4,
                right_b5,
                FadeOut(wave_dot),
                FadeOut(projection_bridge),
                run_time=0.55,
            )
            theta_tr.set_value(0.0)
            self.play(FadeIn(wave_dot), FadeIn(projection_bridge), run_time=0.25)
            self.play(theta_tr.animate.set_value(45.0), run_time=2.2, rate_func=smooth)
            self.play(Indicate(f5, color=t.vertex, scale_factor=1.12), run_time=1.0)

        # ======================================================================
        # BLOCO 6 — Fechamento para o Laboratório Vivo
        # ======================================================================
        f6 = MathTex(
            r"\operatorname{sen}\theta\;\text{(verde)}",
            r"\;\;\bullet\;\;",
            r"\cos\theta\;\text{(azul)}",
            r"\;\;\bullet\;\;",
            r"R=1\;\text{(âmbar)}",
            font_size=24,
            color=t.text_primary,
        )
        f6[0].set_color(t.roots)
        f6[2].set_color(t.curve)
        f6[4].set_color(t.vertex)

        left_b6 = self.build_left_panel_content(
            "RESUMO DO EIXO 4",
            "Ciclo Unitário e Onda Conectados",
            f6,
            "Gire o ângulo em graus ou clique nos arcos notáveis UNEB.",
            t.accent_primary,
            bottom_left_anchor,
        )
        right_b6 = self.build_right_plain_content(
            r"\theta \;\;(\text{graus e radianos})",
            "Teste 30 graus, 150 graus e todos os quadrantes\nnos controles interativos logo abaixo.",
            t.accent_primary,
            bottom_right_center,
            bottom_right_top,
        )

        with self.narrated_step(
            "bloco_06_resumo",
            "Agora gire o círculo e teste os quadrantes no Laboratório Vivo.",
            pad=0.40,
            min_duration=3.0,
        ):
            self.swap_bottom_panels(left_b5, left_b6, right_b5, right_b6, run_time=0.7)
            self.play(theta_tr.animate.set_value(60.0), run_time=1.2, rate_func=smooth)
            self.play(theta_tr.animate.set_value(45.0), run_time=1.0, rate_func=smooth)
