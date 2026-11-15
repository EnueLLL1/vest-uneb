"""Configurações visuais, paletas e utilitários do pipeline Manim — Portal Vestibular UNEB."""

from __future__ import annotations

from contextlib import contextmanager
from dataclasses import dataclass
import os
from pathlib import Path
import shutil
import sys
from typing import TYPE_CHECKING, Iterator

if TYPE_CHECKING:
    from manim import Scene, VGroup

ROOT_DIR = Path(__file__).resolve().parent.parent
ASSETS_VIDEOS_DIR = ROOT_DIR / "assets" / "videos"
ASSETS_POSTERS_DIR = ROOT_DIR / "assets" / "posters"
AUDIO_CACHE_DIR = ROOT_DIR / "manim_animations" / "media" / "audio"

FONT_UI = "Segoe UI"
FONT_MONO = "Consolas"


def ensure_root_in_sys_path() -> Path:
    """Garante que ROOT_DIR esteja em sys.path para importar scripts.math_tts."""
    root_str = str(ROOT_DIR)
    if root_str not in sys.path:
        sys.path.insert(0, root_str)
    return ROOT_DIR


ensure_root_in_sys_path()


def ensure_miktex_in_path() -> None:
    """Garante que binários per-user do MiKTeX estejam no PATH da sessão atual."""
    local_app_data = os.environ.get("LOCALAPPDATA")
    if not local_app_data:
        return
    miktex_bin = Path(local_app_data) / "Programs" / "MiKTeX" / "miktex" / "bin" / "x64"
    if miktex_bin.exists() and str(miktex_bin) not in os.environ.get("PATH", ""):
        os.environ["PATH"] = f"{miktex_bin}{os.pathsep}{os.environ.get('PATH', '')}"


ensure_miktex_in_path()


@dataclass(frozen=True)
class SceneTheme:
    name: str
    bg: str
    card_bg: str
    card_border: str
    plot_bg: str
    grid: str
    axis: str
    text_primary: str
    text_secondary: str
    text_muted: str
    accent_primary: str
    curve: str
    vertex: str
    roots: str
    y_intercept: str
    danger: str
    badge_bg: str
    badge_text: str


# Jeito A: Visual claro editorial integrado aos tokens Quizlet/UNEB (css/custom.css)
PORTAL_LIGHT_THEME = SceneTheme(
    name="portal_claro",
    bg="#f6f7fb",
    card_bg="#ffffff",
    card_border="#d9dde8",
    plot_bg="#ffffff",
    grid="#eaedf4",
    axis="#586380",
    text_primary="#282e3e",
    text_secondary="#586380",
    text_muted="#939bb4",
    accent_primary="#4255ff",
    curve="#4255ff",
    vertex="#d97706",
    roots="#059669",
    y_intercept="#7c3aed",
    danger="#dc2626",
    badge_bg="#edefff",
    badge_text="#4255ff",
)

# Jeito B: Visual escuro lousa / 3Blue1Brown alinhado ao Canvas 2D (js/modules/parabola.js)
CANVAS_DARK_THEME = SceneTheme(
    name="lousa_3b1b",
    bg="#0f172a",
    card_bg="#020617",
    card_border="#1e293b",
    plot_bg="#020617",
    grid="#1e293b",
    axis="#64748b",
    text_primary="#f8fafc",
    text_secondary="#cbd5e1",
    text_muted="#94a3b8",
    accent_primary="#38bdf8",
    curve="#38bdf8",
    vertex="#f59e0b",
    roots="#10b981",
    y_intercept="#a855f7",
    danger="#f87171",
    badge_bg="#172554",
    badge_text="#38bdf8",
)


def check_latex_tools() -> tuple[bool, str | None, str | None]:
    """Retorna (disponivel, caminho_latex, caminho_dvisvgm)."""
    latex_bin = shutil.which("latex") or shutil.which("pdflatex")
    dvisvgm_bin = shutil.which("dvisvgm")
    return (bool(latex_bin and dvisvgm_bin), latex_bin, dvisvgm_bin)


def get_audio_path(slug: str, clip_name: str) -> Path:
    """Retorna caminho .mp3 temporário em AUDIO_CACHE_DIR/<slug>/ (nunca em assets/videos/)."""
    safe_slug = Path(slug).name or "geral"
    clip_stem = Path(clip_name).stem or "bloco"
    out_dir = AUDIO_CACHE_DIR / safe_slug
    out_dir.mkdir(parents=True, exist_ok=True)
    return out_dir / f"{clip_stem}.mp3"


def gerar_locucao(
    slug: str,
    clip_name: str,
    texto: str,
    *,
    modo: str = "auto",
    voz_edge: str = "pt-BR-FranciscaNeural",
) -> tuple[str, float]:
    """Gera áudio .mp3 em AUDIO_CACHE_DIR via math_tts.narrar_aula e retorna (caminho, duracao)."""
    ensure_root_in_sys_path()
    from scripts.math_tts import narrar_aula

    audio_path = get_audio_path(slug, clip_name)
    return narrar_aula(texto, str(audio_path), modo=modo, voz_edge=voz_edge)


@contextmanager
def sync_audio_block(
    scene: Scene,
    audio_path: str,
    duracao: float,
    *,
    pad: float = 0.35,
    min_duration: float = 0.0,
) -> Iterator[float]:
    """Anexa áudio já sintetizado à cena e aguarda ao menos duracao + pad ao fim do bloco."""
    alvo = max(min_duration, duracao + pad)
    t0 = scene.time
    scene.add_sound(audio_path)
    yield alvo
    restante = alvo - (scene.time - t0)
    if restante > 0.05:
        scene.wait(restante)


@contextmanager
def narrated_block(
    scene: Scene,
    slug: str,
    clip_name: str,
    texto: str,
    *,
    pad: float = 0.35,
    min_duration: float = 0.0,
    modo: str = "auto",
    voz_edge: str = "pt-BR-FranciscaNeural",
) -> Iterator[float]:
    """Context manager que gera locução .mp3 em AUDIO_CACHE_DIR e sincroniza o bloco."""
    audio_path, duracao = gerar_locucao(slug, clip_name, texto, modo=modo, voz_edge=voz_edge)
    with sync_audio_block(scene, audio_path, duracao, pad=pad, min_duration=min_duration) as alvo:
        yield alvo


def play_narrated(
    scene: Scene,
    slug: str,
    clip_name: str,
    texto: str,
    *anims,
    pad: float = 0.35,
    min_duration: float = 0.0,
    anim_run_time: float | None = None,
    modo: str = "auto",
    voz_edge: str = "pt-BR-FranciscaNeural",
    **play_kwargs,
) -> float:
    """Executa animações (ou espera) sincronizadas com a locução TTS e retorna a duração total."""
    with narrated_block(
        scene,
        slug,
        clip_name,
        texto,
        pad=pad,
        min_duration=min_duration,
        modo=modo,
        voz_edge=voz_edge,
    ) as alvo:
        if anims:
            rt = alvo if anim_run_time is None else min(alvo, anim_run_time)
            scene.play(*anims, run_time=rt, **play_kwargs)
    return alvo


def build_plain_pt_box(
    simbolo: str,
    traducao: str,
    accent_color: str,
    theme: SceneTheme = CANVAS_DARK_THEME,
    *,
    tag: str = "EM PORTUGUÊS CLARO",
    use_latex: bool = True,
    max_width: float = 4.45,
) -> VGroup:
    """Cria caixa de tradução simultânea 'Em português claro' com vínculo estrito de cor."""
    from manim import BOLD, DOWN, LEFT, RIGHT, MathTex, RoundedRectangle, Text, VGroup

    inner_max_w = max_width - 0.36
    badge_txt = Text(tag, font=FONT_UI, font_size=11, weight=BOLD, color=accent_color)
    badge_bg = RoundedRectangle(
        width=badge_txt.width + 0.2,
        height=badge_txt.height + 0.12,
        corner_radius=0.08,
        fill_color=theme.badge_bg,
        fill_opacity=1.0,
        stroke_width=0,
    )
    badge = VGroup(badge_bg, badge_txt.move_to(badge_bg.get_center()))

    if simbolo.strip():
        sym_mob = (
            MathTex(simbolo, font_size=26, color=accent_color)
            if use_latex
            else Text(simbolo, font=FONT_UI, font_size=17, weight=BOLD, color=accent_color)
        )
        if sym_mob.width > inner_max_w:
            sym_mob.set_width(inner_max_w)
        if badge.width + 0.18 + sym_mob.width <= inner_max_w:
            header = VGroup(badge, sym_mob).arrange(RIGHT, buff=0.18)
        else:
            header = VGroup(badge, sym_mob).arrange(DOWN, aligned_edge=LEFT, buff=0.1)
    else:
        header = badge

    linhas = [ln.strip() for ln in traducao.splitlines() if ln.strip()] or [traducao]
    body = VGroup(
        *[Text(ln, font=FONT_UI, font_size=15, color=theme.text_primary) for ln in linhas]
    ).arrange(DOWN, aligned_edge=LEFT, buff=0.08)
    if body.width > inner_max_w:
        body.set_width(inner_max_w)

    content = VGroup(header, body).arrange(DOWN, aligned_edge=LEFT, buff=0.12)
    if content.width > inner_max_w:
        content.set_width(inner_max_w)

    box_fill = theme.bg if theme.name == "lousa_3b1b" else theme.badge_bg
    box = RoundedRectangle(
        width=max_width,
        height=content.height + 0.28,
        corner_radius=0.12,
        fill_color=box_fill,
        fill_opacity=0.95,
        stroke_color=accent_color,
        stroke_width=1.6,
    )
    content.move_to(box.get_left() + RIGHT * (0.18 + content.width / 2.0))
    return VGroup(box, content)
