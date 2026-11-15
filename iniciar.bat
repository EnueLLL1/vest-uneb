@echo off
cd /d "%~dp0"
title Portal Vestibular UNEB - Servidor Local
cls
echo ========================================================
echo   PORTAL VESTIBULAR UNEB 2026 - IMERSAO MATEMATICA
echo ========================================================
echo.
echo Iniciando servidor local offline na porta 8000...
echo Abrindo seu navegador padrao automaticamente.
echo (Para encerrar, feche esta janela ou pressione Ctrl+C)
echo.

powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$port = 8000; " ^
  "$rootPath = [System.IO.Path]::GetFullPath((Get-Location).Path).TrimEnd('\') + '\'; " ^
  "$listener = New-Object System.Net.HttpListener; " ^
  "$listener.Prefixes.Add(\"http://localhost:$port/\"); " ^
  "try { " ^
  "  $listener.Start(); " ^
  "  Start-Process \"http://localhost:$port/\"; " ^
  "  Write-Host \"Servidor ativo em http://localhost:$port/\"; " ^
  "  while ($listener.IsListening) { " ^
  "    $context = $listener.GetContext(); " ^
  "    $request = $context.Request; " ^
  "    $response = $context.Response; " ^
  "    $urlPath = $request.Url.LocalPath.TrimStart('/'); " ^
  "    if ([string]::IsNullOrEmpty($urlPath)) { $urlPath = 'index.html'; } " ^
  "    $candidatePath = [System.IO.Path]::GetFullPath([System.IO.Path]::Combine($rootPath, $urlPath)); " ^
  "    if (-not $candidatePath.StartsWith($rootPath, [System.StringComparison]::OrdinalIgnoreCase)) { " ^
  "      $response.StatusCode = 403; " ^
  "      $buf = [System.Text.Encoding]::UTF8.GetBytes('403 Forbidden'); " ^
  "      $response.OutputStream.Write($buf, 0, $buf.Length); " ^
  "    } elseif (Test-Path $candidatePath -PathType Leaf) { " ^
  "      $bytes = [System.IO.File]::ReadAllBytes($candidatePath); " ^
  "      $ext = [System.IO.Path]::GetExtension($candidatePath).ToLower(); " ^
  "      $mime = switch ($ext) { " ^
  "        '.html' { 'text/html; charset=utf-8' } " ^
  "        '.css'  { 'text/css; charset=utf-8' } " ^
  "        '.js'   { 'application/javascript; charset=utf-8' } " ^
  "        '.mjs'  { 'application/javascript; charset=utf-8' } " ^
  "        '.json' { 'application/json; charset=utf-8' } " ^
  "        '.woff2' { 'font/woff2' } " ^
  "        '.png'  { 'image/png' } " ^
  "        '.jpg'  { 'image/jpeg' } " ^
  "        '.jpeg' { 'image/jpeg' } " ^
  "        '.webp' { 'image/webp' } " ^
  "        '.svg'  { 'image/svg+xml' } " ^
  "        '.ico'  { 'image/x-icon' } " ^
  "        '.pdf'  { 'application/pdf' } " ^
  "        '.mp4'  { 'video/mp4' } " ^
  "        '.webm' { 'video/webm' } " ^
  "        '.vtt'  { 'text/vtt; charset=utf-8' } " ^
  "        '.mp3'  { 'audio/mpeg' } " ^
  "        '.wav'  { 'audio/wav' } " ^
  "        default { 'application/octet-stream' } " ^
  "      }; " ^
  "      $response.ContentType = $mime; " ^
  "      $response.Headers.Add('Cache-Control', 'no-cache'); " ^
  "      $response.ContentLength64 = $bytes.Length; " ^
  "      $response.OutputStream.Write($bytes, 0, $bytes.Length); " ^
  "    } else { " ^
  "      $response.StatusCode = 404; " ^
  "      $buf = [System.Text.Encoding]::UTF8.GetBytes('404 Not Found'); " ^
  "      $response.OutputStream.Write($buf, 0, $buf.Length); " ^
  "    } " ^
  "    $response.OutputStream.Close(); " ^
  "  } " ^
  "} finally { " ^
  "  if ($listener.IsListening) { $listener.Stop(); } " ^
  "  $listener.Close(); " ^
  "}"
pause
