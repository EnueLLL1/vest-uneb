"""Verificação automatizada do pipeline Manim e dos ativos web exportados."""

from __future__ import annotations

import argparse
import json
from pathlib import Path
import shutil
import subprocess
import sys
from typing import Any

from config import ASSETS_POSTERS_DIR, ASSETS_VIDEOS_DIR, check_latex_tools
from eixo3_parabola import calc_quadratic_features, clipped_parabola_x_range

MAX_WEB_SIZE_MB = 2.5
MAX_AUDIO_SYNC_DIFF_S = 1.2
EXPECTED_AUDIO_CODECS = {".mp4": "aac", ".webm": "opus"}
NARRATED_EIXO_SLUGS = {
    "eixo1_logica",
    "eixo2_combinatoria",
    "eixo3_parabola",
    "eixo4_trigonometria",
    "eixo5_financas",
    "eixo6_estatistica",
}


def assert_math_helpers() -> None:
    # Caso base (parabola.js: a=1, b=-2, c=-3)
    f_base = calc_quadratic_features(1, -2, -3)
    assert f_base["is_quad"] is True
    assert f_base["delta"] == 16.0
    assert f_base["vertex"] == (1.0, -4.0)
    assert f_base["roots"] == [-1.0, 3.0]

    # Caso tangente (Delta = 0)
    f_tan = calc_quadratic_features(1, -2, 1)
    assert f_tan["delta"] == 0.0
    assert f_tan["roots"] == [1.0]

    # Caso sem raízes (Delta < 0)
    f_none = calc_quadratic_features(1, -2, 3)
    assert f_none["delta"] == -8.0
    assert f_none["roots"] == []

    # Caso degenerado (a = 0 -> função afim)
    f_lin = calc_quadratic_features(0, 2, -4)
    assert f_lin["is_quad"] is False
    assert f_lin["roots"] == [2.0]

    # Clamping de curva dentro da caixa visível
    lo, hi = clipped_parabola_x_range(1, -2, -3)
    assert -3.85 <= lo < hi <= 5.85
    lo_flat, hi_flat = clipped_parabola_x_range(0, 0, 1)
    assert (lo_flat, hi_flat) == (-3.85, 5.85)
    print("[ok] Helpers matemáticos de eixo3_parabola validados.")


def _parse_duration_seconds(raw: object) -> float | None:
    """Converte número ou timestamp HH:MM:SS.fffffffff em segundos."""
    if raw is None:
        return None
    if isinstance(raw, (int, float)):
        return float(raw)
    text = str(raw).strip()
    if not text:
        return None
    if ":" in text:
        parts = text.split(":")
        if len(parts) == 3:
            hours, mins, secs = parts
            return float(hours) * 3600.0 + float(mins) * 60.0 + float(secs)
    return float(text)


def _extract_stream_duration(stream: dict[str, Any]) -> float | None:
    """Obtém duração de stream via campo direto ou tag DURATION (WebM/Matroska)."""
    dur = _parse_duration_seconds(stream.get("duration"))
    if dur is not None:
        return dur
    tags = stream.get("tags") or {}
    for key, value in tags.items():
        if key.lower() == "duration":
            parsed = _parse_duration_seconds(value)
            if parsed is not None:
                return parsed
    return None


def probe_video(path: Path) -> dict[str, Any]:
    """Inspeciona streams de vídeo e áudio de um ativo via ffprobe."""
    ffprobe_bin = shutil.which("ffprobe")
    if not ffprobe_bin:
        raise RuntimeError("ffprobe não encontrado no PATH.")
    res = subprocess.run(
        [
            ffprobe_bin,
            "-v",
            "error",
            "-show_streams",
            "-show_format",
            "-of",
            "json",
            str(path),
        ],
        capture_output=True,
        text=True,
        check=True,
    )
    data = json.loads(res.stdout)
    streams = data.get("streams", [])
    video_stream = next((s for s in streams if s.get("codec_type") == "video"), None)
    if video_stream is None:
        raise RuntimeError(f"Stream de vídeo ausente em {path}")
    audio_stream = next((s for s in streams if s.get("codec_type") == "audio"), None)

    format_duration = _parse_duration_seconds(data.get("format", {}).get("duration"))
    video_duration = _extract_stream_duration(video_stream)
    if video_duration is None:
        video_duration = format_duration
    if video_duration is None:
        raise RuntimeError(f"Duração do vídeo indisponível em {path}")

    has_audio = audio_stream is not None
    audio_codec = audio_stream.get("codec_name") if audio_stream else None
    audio_duration = _extract_stream_duration(audio_stream) if audio_stream else None

    return {
        "width": int(video_stream["width"]),
        "height": int(video_stream["height"]),
        "duration": float(format_duration if format_duration is not None else video_duration),
        "video_duration": float(video_duration),
        "video_codec": video_stream.get("codec_name"),
        "has_audio": has_audio,
        "audio_codec": audio_codec,
        "audio_duration": audio_duration,
    }


def _slug_requires_audio(slug: str, require_audio: bool) -> bool:
    return require_audio or slug in NARRATED_EIXO_SLUGS


def verify_exports(slugs: list[str], require_audio: bool = False) -> None:
    """Valida resolução, duração, peso web (<= 2.5 MB) e áudio sincronizado dos vídeos."""
    latex_ok, latex_bin, dvisvgm_bin = check_latex_tools()
    assert latex_ok, f"LaTeX/dvisvgm ausente: latex={latex_bin}, dvisvgm={dvisvgm_bin}"
    print(f"[ok] LaTeX pronto: {latex_bin} | {dvisvgm_bin}")

    for slug in slugs:
        mp4 = ASSETS_VIDEOS_DIR / f"{slug}.mp4"
        webm = ASSETS_VIDEOS_DIR / f"{slug}.webm"
        poster = ASSETS_POSTERS_DIR / f"{slug}.jpg"
        for f in (mp4, webm, poster):
            assert f.exists() and f.stat().st_size > 0, f"Arquivo ausente ou vazio: {f}"

        must_have_audio = _slug_requires_audio(slug, require_audio)

        for video in (mp4, webm):
            info = probe_video(video)
            dur = info["video_duration"]
            w, h = info["width"], info["height"]
            size_mb = video.stat().st_size / (1024 * 1024)
            assert 20.0 <= dur <= 65.0, f"Duração fora da faixa 20-65s em {video.name}: {dur:.2f}s"
            assert w >= 1280 and h >= 720, f"Resolução abaixo de 720p em {video.name}: {w}x{h}"
            assert size_mb <= MAX_WEB_SIZE_MB, (
                f"Arquivo acima do alvo web ({MAX_WEB_SIZE_MB} MB) em {video.name}: {size_mb:.2f} MB"
            )

            audio_summary = "sem áudio"
            if must_have_audio or info["has_audio"]:
                assert info["has_audio"], f"Stream de áudio ausente em {video.name}"
                expected_codec = EXPECTED_AUDIO_CODECS[video.suffix.lower()]
                assert info["audio_codec"] == expected_codec, (
                    f"Codec de áudio inválido em {video.name}: {info['audio_codec']} (esperado {expected_codec})"
                )
                audio_dur = info["audio_duration"]
                assert audio_dur is not None, f"Duração do áudio indisponível em {video.name}"
                sync_diff = abs(dur - audio_dur)
                assert sync_diff <= MAX_AUDIO_SYNC_DIFF_S, (
                    f"Dessincronia vídeo/áudio em {video.name}: diff={sync_diff:.2f}s "
                    f"(vídeo={dur:.2f}s, áudio={audio_dur:.2f}s)"
                )
                audio_summary = f"áudio {info['audio_codec']} {audio_dur:.2f}s (diff {sync_diff:.2f}s)"

            print(f"[ok] {video.name}: {w}x{h}, vídeo {dur:.2f}s, {audio_summary}, {size_mb:.2f} MB")

        poster_kb = poster.stat().st_size / 1024
        print(f"[ok] {poster.name}: {poster_kb:.1f} KB")


def main() -> int:
    parser = argparse.ArgumentParser(description="Valida helpers matemáticos e ativos web Manim.")
    parser.add_argument("slugs", nargs="*", help="Slugs dos vídeos em assets/videos/ para validar.")
    parser.add_argument(
        "--require-audio",
        action="store_true",
        help="Exige stream de áudio AAC/Opus sincronizado para todos os slugs informados.",
    )
    args = parser.parse_args()

    assert_math_helpers()
    if args.slugs:
        verify_exports(args.slugs, require_audio=args.require_audio)
    return 0


if __name__ == "__main__":
    sys.exit(main())
