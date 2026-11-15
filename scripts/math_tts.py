"""
math_tts.py — Motor de Síntese de Voz Educacional para Matemática (Portal Vestibular UNEB)

Recursos:
1. Normalizador de termos matemáticos (converte fórmulas LaTeX e expressões em fala natural em PT-BR).
2. Motor Híbrido:
   - Microsoft Edge Neural TTS (pt-BR-FranciscaNeural / pt-BR-AntonioNeural): Qualidade de estúdio, 0% CPU.
   - Piper TTS Local (pt_BR-faber-medium): 100% Offline, levíssimo (~5% CPU), zero risco térmico.
3. Fallback Automático: Tenta Edge-TTS online; se estiver sem internet, usa Piper local na hora.
4. Medição de duração para sincronia perfeita com animações do Manim.
"""

import os
import re
import wave
import asyncio
import subprocess
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
PIPER_MODEL_DIR = BASE_DIR / "piper_models"
PIPER_ONNX = PIPER_MODEL_DIR / "pt_BR-faber-medium.onnx"
PIPER_JSON = PIPER_MODEL_DIR / "pt_BR-faber-medium.onnx.json"

# ==============================================================================
# 1. NORMALIZADOR DE MATEMÁTICA PARA FALA NATURAL (PT-BR)
# ==============================================================================

def normalizar_matematica(texto: str) -> str:
    """
    Substitui notações matemáticas, LaTeX e abreviações em linguagem falada fluida em português.
    """
    t = texto

    # Remover delimitadores de LaTeX comuns: $, $$, \(, \)
    t = re.sub(r'\$\$|\$|\\\(|\\\)', '', t)

    # Frações simples: \frac{a}{b} ou a/b
    t = re.sub(r'\\frac\{([^}]+)\}\{([^}]+)\}', r'\1 sobre \2', t)

    # Raízes quadradas: \sqrt{x}
    t = re.sub(r'\\sqrt\{([^}]+)\}', r'raiz quadrada de \1', t)
    t = re.sub(r'\\sqrt\[3\]\{([^}]+)\}', r'raiz cúbica de \1', t)

    # Potências comuns: x^2, x^3, x^n, (1+i)^t
    t = re.sub(r'(\w+)\^2', r'\1 ao quadrado', t)
    t = re.sub(r'(\w+)\^3', r'\1 ao cubo', t)
    t = re.sub(r'(\w+)\^(\w+)', r'\1 elevado a \2', t)
    t = re.sub(r'\(([^\)]+)\)\^(\w+)', r'abre parênteses \1 fecha parênteses elevado a \2', t)

    # Índices comuns (PA/PG): a_1, a_n, a_k
    t = re.sub(r'a_1\b', 'a um', t)
    t = re.sub(r'a_2\b', 'a dois', t)
    t = re.sub(r'a_n\b', 'a n', t)
    t = re.sub(r'a_k\b', 'a k', t)
    t = re.sub(r'(\w+)_(\w+)', r'\1 índice \2', t)

    # Funções matemáticas: f(x), g(x), P(x)
    t = re.sub(r'\bf\(x\)', 'efe de xis', t)
    t = re.sub(r'\bg\(x\)', 'gê de xis', t)
    t = re.sub(r'\bh\(x\)', 'agá de xis', t)
    t = re.sub(r'\bP\(x\)', 'pê de xis', t)

    # Letras gregas e símbolos comuns
    substituicoes = [
        (r'\\Delta|\bDelta\b', 'delta'),
        (r'\\pi|\bpi\b', 'pi'),
        (r'\\theta|\btheta\b', 'teta'),
        (r'\\alpha|\balpha\b', 'alfa'),
        (r'\\beta|\bbeta\b', 'beta'),
        (r'\\ge|>=', ' maior ou igual a '),
        (r'\\le|<=', ' menor ou igual a '),
        (r'\\neq|!=', ' diferente de '),
        (r'\\approx|~=', ' aproximadamente '),
        (r'\\pm|\+/-', ' mais ou menos '),
        (r'\\in', ' pertencente a '),
        (r'\\subset', ' contido em '),
        (r'\\times|\*', ' vezes '),
        (r'\\cdot', ' vezes '),
        (r'\\rightarrow|->', ' implica em '),
        (r'\\leftrightarrow|<->', ' se e somente se '),
        (r'\\land', ' e '),
        (r'\\lor', ' ou '),
        (r'\\mathbb\{R\}', 'conjunto dos números reais'),
        (r'\\mathbb\{N\}', 'conjunto dos números naturais'),
        (r'\\mathbb\{Z\}', 'conjunto dos números inteiros'),
        (r'\bPA\b', 'progressão aritmética'),
        (r'\bPG\b', 'progressão geométrica'),
        (r'\bUNEB\b', 'Unébi'),
    ]

    for padrao, subst in substituicoes:
        t = re.sub(padrao, subst, t, flags=re.IGNORECASE)

    # Sinais matemáticos isolados
    t = re.sub(r'(?<=\d|\w)\s*\+\s*(?=\d|\w)', ' mais ', t)
    t = re.sub(r'(?<=\d|\w)\s*-\s*(?=\d|\w)', ' menos ', t)
    t = re.sub(r'\s*=\s*', ' igual a ', t)
    t = re.sub(r'\s*>\s*', ' maior que ', t)
    t = re.sub(r'\s*<\s*', ' menor que ', t)

    # Limpeza de espaços duplicados
    t = re.sub(r'\s+', ' ', t).strip()
    return t

# ==============================================================================
# 2. MOTORES DE SÍNTESE
# ==============================================================================

async def _sintetizar_edge(texto: str, arquivo_saida: str, voz: str = "pt-BR-FranciscaNeural") -> bool:
    """Sintetiza via Microsoft Edge Neural TTS (0% CPU, excelente qualidade)."""
    try:
        import edge_tts
        communicate = edge_tts.Communicate(texto, voz, rate="+0%", pitch="+0Hz")
        await communicate.save(arquivo_saida)
        return True
    except Exception as e:
        print(f"[Aviso] Edge-TTS falhou (sem conexão?): {e}")
        return False

def _sintetizar_piper(texto: str, arquivo_saida: str) -> bool:
    """Sintetiza via Piper TTS Local (100% offline, super leve, zero superaquecimento)."""
    if not PIPER_ONNX.exists():
        print(f"[Erro] Modelo do Piper não encontrado em: {PIPER_ONNX}")
        return False

    wav_saida = str(Path(arquivo_saida).with_suffix(".wav"))
    cmd = [
        "python", "-m", "piper",
        "-m", str(PIPER_ONNX),
        "-c", str(PIPER_JSON),
        "-f", wav_saida,
        "--sentence-silence", "0.2"
    ]

    try:
        # Passa o texto normalizado via stdin para o Piper
        proc = subprocess.run(cmd, input=texto.encode("utf-8"), capture_output=True, check=True)
        # Se o formato pedido era mp3, converte com ffmpeg
        if arquivo_saida.endswith(".mp3") and wav_saida != arquivo_saida:
            subprocess.run(["ffmpeg", "-y", "-i", wav_saida, "-b:a", "192k", arquivo_saida],
                           stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            if os.path.exists(wav_saida):
                os.remove(wav_saida)
        return True
    except Exception as e:
        print(f"[Erro] Piper falhou: {e}")
        return False

def obter_duracao_audio(arquivo_audio: str) -> float:
    """Calcula a duração exata do áudio em segundos para sincronizar no Manim."""
    caminho = Path(arquivo_audio)
    if not caminho.exists():
        return 0.0

    if caminho.suffix.lower() == ".wav":
        with wave.open(str(caminho), "rb") as wf:
            frames = wf.getnframes()
            rate = wf.getframerate()
            return round(frames / float(rate), 2)
    else:
        # Usa ffprobe para MP3 ou outros formatos
        try:
            res = subprocess.run(
                ["ffprobe", "-v", "error", "-show_entries", "format=duration",
                 "-of", "default=noprint_wrappers=1:nokey=1", str(caminho)],
                capture_output=True, text=True, check=True
            )
            return round(float(res.stdout.strip()), 2)
        except Exception:
            return 3.0  # Fallback seguro

# ==============================================================================
# 3. INTERFACE PRINCIPAL
# ==============================================================================

def narrar_aula(
    texto_original: str,
    arquivo_saida: str,
    modo: str = "auto",
    voz_edge: str = "pt-BR-FranciscaNeural"
) -> tuple[str, float]:
    """
    Converte um texto explicativo ou fórmula em áudio de alta fidelidade sincronizável.
    
    Parâmetros:
      texto_original: Texto com notação matemática ($x^2$, $\\Delta$, etc.).
      arquivo_saida: Caminho do arquivo a ser salvo (.mp3 ou .wav).
      modo: 'auto' (tenta Edge online, com fallback para Piper local), 'offline' (só Piper) ou 'online' (só Edge).
      voz_edge: 'pt-BR-FranciscaNeural' (feminina, didática) ou 'pt-BR-AntonioNeural' (masculina, clara).
      
    Retorna:
      (caminho_arquivo, duracao_em_segundos)
    """
    texto_falado = normalizar_matematica(texto_original)
    os.makedirs(os.path.dirname(os.path.abspath(arquivo_saida)), exist_ok=True)

    sucesso = False
    motor_utilizado = "nenhum"

    if modo in ("auto", "online"):
        sucesso = asyncio.run(_sintetizar_edge(texto_falado, arquivo_saida, voz=voz_edge))
        if sucesso:
            motor_utilizado = f"Microsoft Edge-TTS ({voz_edge})"

    if not sucesso and modo in ("auto", "offline"):
        print("[Info] Utilizando Piper TTS Local (100% offline)...")
        sucesso = _sintetizar_piper(texto_falado, arquivo_saida)
        if sucesso:
            motor_utilizado = "Piper TTS Local (pt_BR-faber-medium)"

    if not sucesso:
        raise RuntimeError("Não foi possível sintetizar o áudio com nenhum dos motores configurados.")

    duracao = obter_duracao_audio(arquivo_saida)
    print(f"✓ Áudio gerado com sucesso via {motor_utilizado}!")
    print(f"  Texto falado: \"{texto_falado}\"")
    print(f"  Duração: {duracao}s | Arquivo: {arquivo_saida}")

    return str(Path(arquivo_saida).resolve()), duracao

if __name__ == "__main__":
    # Teste rápido de matemática
    frase_teste = (
        "No Eixo 3 da UNEB, dada a função f(x) = ax^2 + bx + c, "
        "se Delta > 0 a parábola intercepta o eixo x em duas raízes reais distintas."
    )
    saida = os.path.join(BASE_DIR, "assets", "videos", "teste_matematica.mp3")
    narrar_aula(frase_teste, saida, modo="auto")
