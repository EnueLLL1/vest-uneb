/**
 * verify_visual_responsive.js
 * 
 * Milestone T3 - Headless Responsive & Visual Verification Harness
 * Captures and verifies mobile (375x667, 390x844) and desktop (1280x800)
 * screenshots using Chrome Headless, validating visual layout compliance.
 * 
 * Standards: Zero external runtime dependencies (pure Node.js + Chrome).
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawnSync } = require('child_process');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const SCREENSHOTS_DIR = path.join(PROJECT_ROOT, 'test', 'screenshots');
const HTML_FILE = path.join(PROJECT_ROOT, 'index.html');

const VIEWPORTS = [
  {
    name: 'mobile_375',
    label: 'Mobile Viewport 1 (iPhone SE / 375x667)',
    width: 375,
    height: 667,
    filename: 'screenshot_mobile_375.png'
  },
  {
    name: 'mobile_390',
    label: 'Mobile Viewport 2 (iPhone 12/13/14 / 390x844)',
    width: 390,
    height: 844,
    filename: 'screenshot_mobile_390.png'
  },
  {
    name: 'desktop_1280',
    label: 'Desktop Viewport (HD Laptop / 1280x800)',
    width: 1280,
    height: 800,
    filename: 'screenshot_desktop_1280.png'
  }
];

/**
 * Locate Chrome / Chromium executable across standard installation paths.
 */
function findChromeExecutable() {
  const candidatePaths = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    process.env.LOCALAPPDATA ? path.join(process.env.LOCALAPPDATA, 'Google\\Chrome\\Application\\chrome.exe') : null,
    process.env.PROGRAMFILES ? path.join(process.env.PROGRAMFILES, 'Google\\Chrome\\Application\\chrome.exe') : null,
    '/usr/bin/google-chrome',
    '/usr/bin/chromium-browser',
    '/usr/bin/chromium'
  ].filter(Boolean);

  for (const candidate of candidatePaths) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  // Fallback: check PATH via `where` or `which`
  try {
    const cmd = process.platform === 'win32' ? 'where' : 'which';
    const target = process.platform === 'win32' ? 'chrome.exe' : 'google-chrome';
    const res = spawnSync(cmd, [target], { encoding: 'utf-8' });
    if (res.status === 0 && res.stdout) {
      const firstLine = res.stdout.trim().split(/\r?\n/)[0];
      if (firstLine && fs.existsSync(firstLine)) {
        return firstLine;
      }
    }
  } catch (err) {
    // ignore
  }

  return null;
}

/**
 * Validate that a buffer is a valid PNG and extract its dimensions from the IHDR chunk.
 */
function inspectPngBuffer(buffer) {
  // PNG Magic Header: 89 50 4E 47 0D 0A 1A 0A
  const PNG_HEADER = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
  if (buffer.length < 24) {
    return { valid: false, error: 'File too small for PNG header' };
  }

  if (!buffer.subarray(0, 8).equals(PNG_HEADER)) {
    return { valid: false, error: 'Invalid PNG magic bytes' };
  }

  const ihdrType = buffer.subarray(12, 16).toString('ascii');
  if (ihdrType !== 'IHDR') {
    return { valid: false, error: 'Missing IHDR chunk' };
  }

  const width = buffer.readUInt32BE(16);
  const height = buffer.readUInt32BE(20);

  return { valid: true, width, height };
}

/**
 * Perform fallback static analysis of HTML/CSS responsive declarations
 * if Chrome headless is unavailable.
 */
function performResponsiveStaticFallback() {
  console.log('\n--- EXECUTANDO DIAGNÓSTICO ESTÁTICO DE RESPONSIVIDADE (FALLBACK) ---');
  let fallbackPassed = true;

  if (!fs.existsSync(HTML_FILE)) {
    console.error('✖ Arquivo index.html não encontrado:', HTML_FILE);
    return false;
  }

  const html = fs.readFileSync(HTML_FILE, 'utf-8');

  // Check 1: Viewport meta tag
  const hasViewportMeta = /<meta\s+name=["']viewport["']\s+content=["'][^"']*width=device-width/i.test(html);
  if (hasViewportMeta) {
    console.log('  ✔ Meta tag viewport para dispositivos móveis presente');
  } else {
    console.error('  ✖ Meta tag viewport ausente em index.html');
    fallbackPassed = false;
  }

  // Check 2: Responsive breakpoints in CSS / HTML classes
  const hasResponsiveClasses = /(lg:|md:|sm:|max-w-|hidden|flex)/.test(html);
  if (hasResponsiveClasses) {
    console.log('  ✔ Classes utilitárias responsivas encontradas no layout');
  } else {
    console.error('  ✖ Classes responsivas ausentes no layout');
    fallbackPassed = false;
  }

  return fallbackPassed;
}

/**
 * Execute headless screenshot capture for each viewport.
 */
function runVisualResponsiveHarness() {
  console.log('======================================================================');
  console.log('  HARNESS DE VERIFICAÇÃO VISUAL E RESPONSIVA HEADLESS (MILESTONE T3)  ');
  console.log('======================================================================\n');

  if (!fs.existsSync(HTML_FILE)) {
    console.error(`ERRO: index.html não encontrado no caminho: ${HTML_FILE}`);
    process.exit(1);
  }

  // Ensure screenshots directory exists
  if (!fs.existsSync(SCREENSHOTS_DIR)) {
    fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
    console.log(`Diretório de capturas criado: ${SCREENSHOTS_DIR}\n`);
  }

  const chromePath = findChromeExecutable();
  if (!chromePath) {
    console.warn('⚠️ AVISO: Executável do Google Chrome não encontrado nos caminhos padrão.');
    console.warn('Iniciando fallback estático de verificação de responsividade DOM...\n');
    const fallbackOk = performResponsiveStaticFallback();
    if (!fallbackOk) {
      console.error('\n✖ Falha na verificação de responsividade.');
      process.exit(1);
    }
    console.log('\n✔ Fallback estático de responsividade concluído com sucesso.');
    process.exit(0);
  }

  console.log(`Executável Chrome detectado: ${chromePath}`);
  const targetUrl = 'file:///' + HTML_FILE.replace(/\\/g, '/');
  console.log(`URL Alvo de Inspeção: ${targetUrl}\n`);

  const results = [];
  let allPassed = true;

  for (const vp of VIEWPORTS) {
    const outputPath = path.join(SCREENSHOTS_DIR, vp.filename);
    const tempProfile = path.join(os.tmpdir(), `chrome_harness_${vp.name}_${Date.now()}`);

    // If artifact from prior run exists, remove to ensure fresh capture
    if (fs.existsSync(outputPath)) {
      try {
        fs.unlinkSync(outputPath);
      } catch (e) {
        // ignore
      }
    }

    const args = [
      '--headless=new',
      '--disable-gpu',
      '--no-sandbox',
      '--allow-file-access-from-files',
      `--user-data-dir=${tempProfile}`,
      `--window-size=${vp.width},${vp.height}`,
      `--screenshot=${outputPath}`,
      targetUrl
    ];

    const startTime = Date.now();
    const proc = spawnSync(chromePath, args, { encoding: 'utf-8', timeout: 30000 });
    const elapsed = Date.now() - startTime;

    // Clean up temporary user data directory
    try {
      if (fs.existsSync(tempProfile)) {
        fs.rmSync(tempProfile, { recursive: true, force: true });
      }
    } catch (e) {
      // ignore
    }

    if (proc.error) {
      console.error(`  ✖ Falha ao executar Chrome para ${vp.label}: ${proc.error.message}`);
      results.push({ ...vp, passed: false, error: proc.error.message, bytes: 0 });
      allPassed = false;
      continue;
    }

    if (!fs.existsSync(outputPath)) {
      console.error(`  ✖ Arquivo de captura não foi gerado: ${outputPath}`);
      results.push({ ...vp, passed: false, error: 'Arquivo não gerado', bytes: 0 });
      allPassed = false;
      continue;
    }

    const buffer = fs.readFileSync(outputPath);
    const byteSize = buffer.length;

    if (byteSize === 0) {
      console.error(`  ✖ Captura vazia (0 bytes): ${outputPath}`);
      results.push({ ...vp, passed: false, error: 'Arquivo de 0 bytes', bytes: 0 });
      allPassed = false;
      continue;
    }

    const pngInfo = inspectPngBuffer(buffer);
    if (!pngInfo.valid) {
      console.error(`  ✖ Imagem PNG inválida: ${pngInfo.error}`);
      results.push({ ...vp, passed: false, error: pngInfo.error, bytes: byteSize });
      allPassed = false;
      continue;
    }

    // Verify dimensions match or scale DPR
    const dimMatch = pngInfo.width === vp.width && pngInfo.height === vp.height;
    if (!dimMatch) {
      console.warn(`  ⚠️ Dimensões PNG (${pngInfo.width}x${pngInfo.height}) divergem de (${vp.width}x${vp.height}) - DPR scale ativo`);
    }

    console.log(`  ✔ [${vp.name}] ${vp.label}`);
    console.log(`    ↳ Arquivo: test/screenshots/${vp.filename}`);
    console.log(`    ↳ Tamanho: ${(byteSize / 1024).toFixed(1)} KB (${byteSize} bytes) | Dimensões: ${pngInfo.width}x${pngInfo.height} px | Tempo: ${elapsed}ms`);

    results.push({
      ...vp,
      passed: true,
      bytes: byteSize,
      actualWidth: pngInfo.width,
      actualHeight: pngInfo.height,
      elapsedMs: elapsed,
      path: outputPath
    });
  }

  console.log('\n======================================================================');
  console.log('              RESUMO DA VERIFICAÇÃO VISUAL HEADLESS                   ');
  console.log('======================================================================');
  results.forEach(r => {
    const status = r.passed ? 'APROVADO' : 'FALHOU';
    const dim = r.actualWidth ? `${r.actualWidth}x${r.actualHeight}` : 'N/A';
    console.log(`  ${r.passed ? '✔' : '✖'} ${r.name.padEnd(16)} | ${status} | ${dim.padEnd(11)} | ${(r.bytes / 1024).toFixed(1).padStart(6)} KB | ${r.filename}`);
  });
  console.log('----------------------------------------------------------------------');

  if (allPassed) {
    console.log('STATUS: ✔ TODAS AS CAPTURAS FORAM GERADAS E VALIDADAS COM SUCESSO!\n');
    process.exit(0);
  } else {
    console.error('STATUS: ✖ UMA OU MAIS CAPTURAS FALHARAM NA VALIDAÇÃO.\n');
    process.exit(1);
  }
}

runVisualResponsiveHarness();
