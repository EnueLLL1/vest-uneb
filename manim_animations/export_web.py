"""Exportação e compressão Web (.mp4 H.264, .webm VP9 e poster .jpg) para o Portal Vestibular UNEB."""

from __future__ import annotations

import argparse
import os
from pathlib import Path
import shutil
import subprocess
import sys

from config import ASSETS_POSTERS_DIR, ASSETS_VIDEOS_DIR, ROOT_DIR

MANIM_EXE = ROOT_DIR / ".venv" / "Scripts" / "manim.exe"
DEFAULT_QUALITY = "qh"  # 1080p60 (ou qm para 720p30)
MAX_WEB_SIZE_MB = 2.5


def run_cmd(cmd: list[str], cwd: Path | None = None, env: dict[str, str] | None = None) -> None:
    print(f"[cmd] {' '.join(cmd)}")
    proc = subprocess.run(cmd, cwd=cwd, env=env, check=False)
    if proc.returncode != 0:
        raise RuntimeError(f"Comando falhou ({proc.returncode}): {' '.join(cmd)}")


def build_manim_env(manim_dir: Path) -> dict[str, str]:
    """Injeta ROOT_DIR e manim_dir no PYTHONPATH do subprocesso Manim."""
    env = os.environ.copy()
    existing = env.get("PYTHONPATH", "")
    parts = [str(ROOT_DIR), str(manim_dir)]
    if existing:
        parts.append(existing)
    env["PYTHONPATH"] = os.pathsep.join(parts)
    return env


def has_audio_stream(video_path: Path) -> bool:
    """Detecta via ffprobe se o arquivo de vídeo possui stream de áudio."""
    ffprobe_bin = shutil.which("ffprobe")
    if not ffprobe_bin:
        return False
    proc = subprocess.run(
        [
            ffprobe_bin,
            "-v", "error",
            "-select_streams", "a",
            "-show_entries", "stream=codec_type",
            "-of", "csv=p=0",
            str(video_path),
        ],
        capture_output=True,
        text=True,
        check=False,
    )
    return proc.returncode == 0 and any(line.strip() == "audio" for line in proc.stdout.splitlines())


def find_rendered_mp4(media_dir: Path, script_stem: str, scene_name: str) -> Path:
    candidates = sorted(
        media_dir.glob(f"videos/{script_stem}/**/{scene_name}.mp4"),
        key=lambda p: p.stat().st_mtime,
        reverse=True,
    )
    if not candidates:
        raise FileNotFoundError(
            f"Vídeo renderizado não encontrado em {media_dir / 'videos' / script_stem} para {scene_name}"
        )
    return candidates[0]


def _encode_within_limit(
    build_cmd,
    out_path: Path,
    crf_values: list[int],
    max_bytes: int,
) -> None:
    """Codifica vídeo ajustando CRF se ultrapassar o limite máximo em bytes."""
    for crf in crf_values:
        run_cmd(build_cmd(crf))
        if out_path.stat().st_size <= max_bytes:
            return


def transcode_web_assets(
    raw_mp4: Path,
    out_slug: str,
    height: int = 720,
    crf_mp4: int = 26,
    crf_webm: int = 34,
    max_size_mb: float = MAX_WEB_SIZE_MB,
) -> dict[str, Path]:
    ffmpeg_bin = shutil.which("ffmpeg")
    if not ffmpeg_bin:
        raise RuntimeError("ffmpeg não encontrado no PATH.")

    ASSETS_VIDEOS_DIR.mkdir(parents=True, exist_ok=True)
    ASSETS_POSTERS_DIR.mkdir(parents=True, exist_ok=True)

    out_mp4 = ASSETS_VIDEOS_DIR / f"{out_slug}.mp4"
    out_webm = ASSETS_VIDEOS_DIR / f"{out_slug}.webm"
    out_poster = ASSETS_POSTERS_DIR / f"{out_slug}.jpg"

    scale_filter = f"scale=-2:{height}"
    audio_present = has_audio_stream(raw_mp4)
    mp4_audio_flags = ["-c:a", "aac", "-b:a", "96k", "-ac", "1", "-ar", "44100"] if audio_present else ["-an"]
    webm_audio_flags = ["-c:a", "libopus", "-b:a", "64k"] if audio_present else ["-an"]
    max_bytes = int(max_size_mb * 1024 * 1024)
    print(f"[audio] stream detectada em {raw_mp4.name}: {'sim (AAC + Opus)' if audio_present else 'não (-an)'}")

    # MP4 (H.264 + faststart para streaming progressivo no <video>)
    _encode_within_limit(
        lambda crf: [
            ffmpeg_bin, "-y", "-i", str(raw_mp4),
            "-vf", scale_filter,
            "-r", "30",
            "-c:v", "libx264", "-preset", "slow", "-crf", str(crf),
            "-pix_fmt", "yuv420p", "-movflags", "+faststart",
            *mp4_audio_flags,
            str(out_mp4),
        ],
        out_mp4,
        [crf_mp4, min(crf_mp4 + 3, 32), min(crf_mp4 + 6, 36)],
        max_bytes,
    )

    # WebM (VP9 leve para navegadores modernos)
    _encode_within_limit(
        lambda crf: [
            ffmpeg_bin, "-y", "-i", str(raw_mp4),
            "-vf", scale_filter,
            "-r", "30",
            "-c:v", "libvpx-vp9", "-b:v", "0", "-crf", str(crf),
            "-row-mt", "1",
            *webm_audio_flags,
            str(out_webm),
        ],
        out_webm,
        [crf_webm, min(crf_webm + 4, 42), min(crf_webm + 8, 48)],
        max_bytes,
    )

    # Poster JPG (captura de quadro representativo com gráfico e fórmula visíveis)
    run_cmd([
        ffmpeg_bin, "-y", "-ss", "00:00:05", "-i", str(out_mp4),
        "-frames:v", "1", "-update", "1", "-q:v", "4",
        str(out_poster),
    ])

    return {"mp4": out_mp4, "webm": out_webm, "poster": out_poster}


def render_and_export(script_path: Path, scene_name: str, out_slug: str, quality: str = "qm", height: int = 720) -> dict[str, Path]:
    manim_bin = str(MANIM_EXE if MANIM_EXE.exists() else "manim")
    manim_dir = script_path.parent
    media_dir = manim_dir / "media"

    run_cmd([
        manim_bin,
        f"-{quality}",
        "--format=mp4",
        "--media_dir", str(media_dir),
        str(script_path),
        scene_name,
    ], cwd=manim_dir, env=build_manim_env(manim_dir))

    raw_mp4 = find_rendered_mp4(media_dir, script_path.stem, scene_name)
    outputs = transcode_web_assets(raw_mp4, out_slug=out_slug, height=height)

    for kind, path in outputs.items():
        size_mb = path.stat().st_size / (1024 * 1024)
        print(f"  [ok] {kind:6s}: {path} ({size_mb:.2f} MB)")

    return outputs


def main() -> int:
    parser = argparse.ArgumentParser(description="Renderiza cena Manim e exporta MP4/WebM/Poster otimizados.")
    parser.add_argument("script", help="Caminho do script .py em manim_animations/")
    parser.add_argument("scene", help="Nome da classe Scene")
    parser.add_argument("--slug", help="Nome base dos arquivos finais (padrão: nome da cena em minúsculas)")
    parser.add_argument("--quality", default="qm", choices=["ql", "qm", "qh"], help="Qualidade Manim (ql=480p15, qm=720p30, qh=1080p60)")
    parser.add_argument("--height", type=int, default=720, help="Altura final dos arquivos web (720 ou 1080)")
    args = parser.parse_args()

    script_path = Path(args.script).resolve()
    out_slug = args.slug or args.scene.lower()
    render_and_export(script_path, args.scene, out_slug, quality=args.quality, height=args.height)
    return 0


if __name__ == "__main__":
    sys.exit(main())
