@echo off
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
  "$listener = New-Object System.Net.HttpListener; " ^
  "$listener.Prefixes.Add(\"http://localhost:$port/\"); " ^
  "$listener.Start(); " ^
  "Start-Process \"http://localhost:$port/\"; " ^
  "Write-Host \"Servidor ativo em http://localhost:$port/\"; " ^
  "while ($listener.IsListening) { " ^
  "  $context = $listener.GetContext(); " ^
  "  $request = $context.Request; " ^
  "  $response = $context.Response; " ^
  "  $urlPath = $request.Url.LocalPath.TrimStart('/'); " ^
  "  if ([string]::IsNullOrEmpty($urlPath)) { $urlPath = 'index.html'; } " ^
  "  $filePath = Join-Path (Get-Location) $urlPath; " ^
  "  if (Test-Path $filePath -PathType Leaf) { " ^
  "    $bytes = [System.IO.File]::ReadAllBytes($filePath); " ^
  "    $ext = [System.IO.Path]::GetExtension($filePath).ToLower(); " ^
  "    $mime = switch ($ext) { " ^
  "      '.html' { 'text/html; charset=utf-8' } " ^
  "      '.css'  { 'text/css; charset=utf-8' } " ^
  "      '.js'   { 'application/javascript; charset=utf-8' } " ^
  "      '.png'  { 'image/png' } " ^
  "      '.jpg'  { 'image/jpeg' } " ^
  "      '.jpeg' { 'image/jpeg' } " ^
  "      '.svg'  { 'image/svg+xml' } " ^
  "      '.pdf'  { 'application/pdf' } " ^
  "      default { 'application/octet-stream' } " ^
  "    }; " ^
  "    $response.ContentType = $mime; " ^
  "    $response.ContentLength64 = $bytes.Length; " ^
  "    $response.OutputStream.Write($bytes, 0, $bytes.Length); " ^
  "  } else { " ^
  "    $response.StatusCode = 404; " ^
  "    $buf = [System.Text.Encoding]::UTF8.GetBytes('404 Not Found'); " ^
  "    $response.OutputStream.Write($buf, 0, $buf.Length); " ^
  "  } " ^
  "  $response.OutputStream.Close(); " ^
  "}"
pause
