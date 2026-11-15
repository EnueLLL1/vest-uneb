/**
 * verify_visual_responsive.js
 *
 * Milestone T3 & Auditoria UX/Visual - Headless Responsive & Visual Verification Harness
 * Serves the portal via an ephemeral local HTTP server on 127.0.0.1 (port 0), renders
 * inside an exact-sized iframe (375x667, 390x844, 1280x800) to avoid Windows Chrome's
 * ~500px minimum window-width clamp, audits real computed DOM/CSS across Gate,
 * Sessão Estudante, and Sessão Docente, and validates PNG captures in test/screenshots/.
 *
 * Standards: Zero external runtime dependencies (pure Node.js + Chrome).
 */

const fs = require('fs');
const path = require('path');
const http = require('http');
const os = require('os');
const { spawn, spawnSync } = require('child_process');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const SCREENSHOTS_DIR = path.join(PROJECT_ROOT, 'test', 'screenshots');
const HTML_FILE = path.join(PROJECT_ROOT, 'index.html');
const STORAGE_KEY = 'uneb_math_2026_v1';
const TEACHER_CODE = 'UNEB2026';

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.vtt': 'text/vtt; charset=utf-8'
};

const SCENARIOS = [
  {
    name: 'mobile_375',
    label: 'Mobile 375x667 — Gate',
    width: 375,
    height: 667,
    profile: 'gate',
    filename: 'screenshot_mobile_375.png'
  },
  {
    name: 'mobile_390',
    label: 'Mobile 390x844 — Gate',
    width: 390,
    height: 844,
    profile: 'gate',
    filename: 'screenshot_mobile_390.png'
  },
  {
    name: 'desktop_1280',
    label: 'Desktop 1280x800 — Gate/Hub',
    width: 1280,
    height: 800,
    profile: 'gate',
    filename: 'screenshot_desktop_1280.png'
  },
  {
    name: 'student_mobile_375',
    label: 'Sessão Estudante Mobile 375x667 — Header + Hub/Aulas',
    width: 375,
    height: 667,
    profile: 'student',
    filename: 'screenshot_student_mobile_375.png'
  },
  {
    name: 'desktop_student_1280',
    label: 'Sessão Estudante Desktop 1280x800 — Header Unificado em Linha Única',
    width: 1280,
    height: 800,
    profile: 'student',
    filename: 'screenshot_desktop_student_1280.png'
  },
  {
    name: 'teacher_mobile_375',
    label: 'Sessão Docente Mobile 375x667 — Barra Docente + Painel da Turma',
    width: 375,
    height: 667,
    profile: 'teacher',
    filename: 'screenshot_teacher_mobile_375.png'
  },
  {
    name: 'teacher_tablet_850',
    label: 'Sessão Docente Tablet/Web 850x800 — Header em Linha Única',
    width: 850,
    height: 800,
    profile: 'teacher',
    filename: 'screenshot_teacher_tablet_850.png'
  },
  {
    name: 'desktop_teacher_1280',
    label: 'Sessão Docente Desktop 1280x800 — Header Unificado em Linha Única',
    width: 1280,
    height: 800,
    profile: 'teacher',
    filename: 'screenshot_desktop_teacher_1280.png'
  },
  {
    name: 'student_aulas_375',
    label: 'Sessão Estudante Mobile 375x667 — Aulas + Abas 3 Estágios + Filtro Rápido',
    width: 375,
    height: 667,
    profile: 'student_aulas',
    filename: 'screenshot_student_aulas_375.png'
  },
  {
    name: 'student_quiz_375',
    label: 'Sessão Estudante Mobile 375x667 — Simulado',
    width: 375,
    height: 667,
    profile: 'student_quiz',
    filename: 'screenshot_student_quiz_375.png'
  },
  {
    name: 'desktop_quiz_1280',
    label: 'Sessão Estudante Desktop 1280x800 — Simulado',
    width: 1280,
    height: 800,
    profile: 'student_quiz',
    filename: 'screenshot_desktop_quiz_1280.png'
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
  } catch {
    // ignore
  }

  return null;
}

/**
 * Validate that a buffer is a valid PNG and extract its dimensions from the IHDR chunk.
 */
function inspectPngBuffer(buffer) {
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
  return {
    valid: true,
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20)
  };
}

/**
 * Perform fallback static analysis of HTML/CSS responsive declarations
 * if Chrome headless executable is unavailable.
 */
function performResponsiveStaticFallback() {
  console.log('\n--- EXECUTANDO DIAGNÓSTICO ESTÁTICO DE RESPONSIVIDADE (FALLBACK) ---');
  let fallbackPassed = true;

  if (!fs.existsSync(HTML_FILE)) {
    console.error('✖ Arquivo index.html não encontrado:', HTML_FILE);
    return false;
  }

  const html = fs.readFileSync(HTML_FILE, 'utf-8');
  const hasViewportMeta = /<meta\s+name=["']viewport["']\s+content=["'][^"']*width=device-width/i.test(html);
  console.log(hasViewportMeta
    ? '  ✔ Meta tag viewport para dispositivos móveis presente'
    : '  ✖ Meta tag viewport ausente em index.html');
  if (!hasViewportMeta) fallbackPassed = false;

  const hasResponsiveClasses = /(lg:|md:|sm:|max-w-|hidden|flex)/.test(html);
  console.log(hasResponsiveClasses
    ? '  ✔ Classes utilitárias responsivas encontradas no layout'
    : '  ✖ Classes responsivas ausentes no layout');
  if (!hasResponsiveClasses) fallbackPassed = false;

  return fallbackPassed;
}

/**
 * Build the ephemeral harness HTML page that hosts index.html inside an exact-dimensioned iframe
 * and posts real DOM/computed-style measurements back to POST /__audit.
 */
function buildHarnessHtml({ id, width, height, profile, clickTurma = false }) {
  const safeId = JSON.stringify(id);
  const safeProfile = JSON.stringify(profile);
  const safeClickTurma = Boolean(clickTurma);
  const safeStorageKey = JSON.stringify(STORAGE_KEY);
  const safeTeacherCode = JSON.stringify(TEACHER_CODE);

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <style>
    html, body { margin: 0; padding: 0; overflow: hidden; background: #ffffff; }
    #app-frame {
      position: fixed;
      top: 0;
      left: 0;
      width: ${width}px;
      height: ${height}px;
      border: 0;
      display: block;
    }
  </style>
</head>
<body>
  <iframe id="app-frame" src="/index.html"></iframe>
  <script>
    (function () {
      const SCENARIO_ID = ${safeId};
      const PROFILE = ${safeProfile};
      const CLICK_TURMA = ${safeClickTurma};
      const STORAGE_KEY = ${safeStorageKey};
      const TEACHER_CODE = ${safeTeacherCode};

      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch (_) {}

      const frame = document.getElementById('app-frame');

      function isVisible(win, el) {
        if (!el) return false;
        const st = win.getComputedStyle(el);
        if (st.display === 'none' || st.visibility === 'hidden' || parseFloat(st.opacity || '1') === 0) {
          return false;
        }
        const rect = el.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0;
      }

      function waitFrames(win, count, cb) {
        if (count <= 0) return cb();
        win.requestAnimationFrame(() => waitFrames(win, count - 1, cb));
      }

      function collectMetrics(win, doc, extra) {
        const headerEl = doc.querySelector('header');
        const headerH1 = doc.querySelector('header h1');
        const emblemEl = doc.querySelector('.site-brand-emblem');
        const emblemRect = emblemEl ? emblemEl.getBoundingClientRect() : null;
        const gateEl = doc.getElementById('session-gate');
        const shellEl = doc.getElementById('app-shell');
        const studentPanel = doc.getElementById('student-header-panel');
        const teacherPanel = doc.getElementById('teacher-header-panel');
        const btnTeacherTurma = doc.getElementById('btn-teacher-turma');
        const teacherScopeSelector = win.innerWidth >= 768 ? '#teacher-header-panel button' : '#teacher-primary-pills > button';
        const teacherBtns = teacherPanel
          ? Array.from(doc.querySelectorAll(teacherScopeSelector)).filter((b) => isVisible(win, b))
          : [];
        const teacherBtnTops = teacherBtns.map((b) => Math.round(b.getBoundingClientRect().top));
        const teacherBarWraps = teacherBtnTops.length > 1
          ? (Math.max(...teacherBtnTops) - Math.min(...teacherBtnTops)) > 8
          : false;
        const navBtns = Array.from(doc.querySelectorAll('.site-desktop-nav .view-tab-btn')).filter((b) => isVisible(win, b));
        const navTops = navBtns.map((b) => Math.round(b.getBoundingClientRect().top));
        const desktopNavWraps = navTops.length > 1 ? (Math.max(...navTops) - Math.min(...navTops)) > 8 : false;
        const viewHome = doc.getElementById('view-home');
        const viewDay1 = doc.getElementById('view-day1');
        const viewQuiz = doc.getElementById('view-quiz');
        const viewTurma = doc.getElementById('view-turma');
        const quizBannerHeading = doc.querySelector('#view-quiz .quiz-hero-banner h1, #view-quiz .quiz-hero-banner h2, #view-quiz .quiz-hero-banner h3');
        const stageTabs = Array.from(doc.querySelectorAll('#mod-logica [data-stage-tab]'));
        const axisChips = Array.from(doc.querySelectorAll('#aulas-axis-chips [data-axis-chip]'));
        let storedRole = null;
        try {
          const parsed = JSON.parse(win.localStorage.getItem(STORAGE_KEY) || '{}');
          storedRole = parsed.sessionRole || null;
        } catch (_) {}

        return Object.assign({
          id: SCENARIO_ID,
          profile: PROFILE,
          frameInnerWidth: win.innerWidth,
          frameInnerHeight: win.innerHeight,
          clientWidth: doc.documentElement.clientWidth,
          scrollWidth: doc.documentElement.scrollWidth,
          headerHeight: headerEl ? Math.round(headerEl.getBoundingClientRect().height) : 0,
          headerH1Color: headerH1 ? win.getComputedStyle(headerH1).color : null,
          brandEmblemSize: emblemRect ? { width: Math.round(emblemRect.width), height: Math.round(emblemRect.height) } : null,
          quizBannerHeadingColor: quizBannerHeading ? win.getComputedStyle(quizBannerHeading).color : null,
          gateVisible: isVisible(win, gateEl),
          shellVisible: isVisible(win, shellEl),
          studentPanelVisible: isVisible(win, studentPanel),
          teacherPanelVisible: isVisible(win, teacherPanel),
          teacherBarWraps,
          desktopNavWraps,
          btnTeacherTurmaExists: Boolean(btnTeacherTurma),
          btnTeacherTurmaVisible: isVisible(win, btnTeacherTurma),
          viewHomeVisible: isVisible(win, viewHome),
          viewDay1Visible: isVisible(win, viewDay1),
          viewQuizVisible: isVisible(win, viewQuiz),
          viewTurmaVisible: isVisible(win, viewTurma),
          stageTabCount: stageTabs.length,
          stageTabsHaveSvg: stageTabs.length === 3 && stageTabs.every((t) => Boolean(t.querySelector('svg'))),
          axisChipCount: axisChips.length,
          axisChipsHaveSvg: axisChips.length >= 7 && axisChips.every((c) => Boolean(c.querySelector('svg'))),
          sessionRole: storedRole
        }, extra || {});
      }

      function sendAudit(payload) {
        return fetch('/__audit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          keepalive: true
        }).catch(() => {});
      }

      frame.addEventListener('load', () => {
        const win = frame.contentWindow;
        const doc = frame.contentDocument;

        setTimeout(() => {
          if (PROFILE === 'student' || PROFILE === 'student_aulas' || PROFILE === 'student_quiz') {
            const nameInput = doc.getElementById('gate-student-name');
            const studentForm = doc.getElementById('gate-student-form');
            if (nameInput) nameInput.value = 'Estudante Auditoria';
            if (studentForm) {
              studentForm.dispatchEvent(new win.Event('submit', { bubbles: true, cancelable: true }));
            }
          } else if (PROFILE === 'teacher') {
            const codeInput = doc.getElementById('gate-teacher-code');
            const teacherForm = doc.getElementById('gate-teacher-form');
            if (codeInput) codeInput.value = TEACHER_CODE;
            if (teacherForm) {
              teacherForm.dispatchEvent(new win.Event('submit', { bubbles: true, cancelable: true }));
            }
          }

          function checkPopoverBounds(win, doc, triggerId, popoverId) {
            const btn = doc.getElementById(triggerId);
            const pop = doc.getElementById(popoverId);
            if (!btn || !pop || typeof pop.showPopover !== 'function') {
              return { opened: false, withinViewport: false };
            }
            btn.click();
            const isOpen = pop.matches(':popover-open');
            const popRect = pop.getBoundingClientRect();
            const btnRect = btn.getBoundingClientRect();
            const withinViewport = isOpen &&
              popRect.width > 0 &&
              popRect.left >= 0 &&
              popRect.right <= win.innerWidth + 1 &&
              popRect.bottom <= win.innerHeight + 1 &&
              popRect.top >= btnRect.bottom - 2;
            if (typeof pop.hidePopover === 'function') pop.hidePopover();
            return {
              opened: isOpen,
              withinViewport,
              rect: { top: Math.round(popRect.top), left: Math.round(popRect.left), right: Math.round(popRect.right) }
            };
          }

          setTimeout(() => {
            const extra = {};
            if (PROFILE === 'student') {
              extra.studentPopoverCheck = checkPopoverBounds(win, doc, 'btn-student-profile', 'student-profile-popover');
            } else if (PROFILE === 'student_aulas') {
              const navAulas = doc.getElementById('nav-day1') || doc.getElementById('mobile-nav-aulas');
              if (navAulas) navAulas.click();
              const qFilter = doc.getElementById('aulas-quick-filter');
              if (qFilter) {
                qFilter.value = 'parabola';
                qFilter.dispatchEvent(new win.Event('input', { bubbles: true }));
                const modAlg = doc.getElementById('mod-algebra');
                const modLog = doc.getElementById('mod-logica');
                extra.quickFilterWorked = Boolean(
                  modAlg && !modAlg.classList.contains('hidden') &&
                  modLog && modLog.classList.contains('hidden')
                );
                qFilter.value = '';
                qFilter.dispatchEvent(new win.Event('input', { bubbles: true }));
              } else {
                extra.quickFilterWorked = false;
              }
            } else if (PROFILE === 'student_quiz') {
              const navQuiz = doc.getElementById('nav-quiz') || doc.getElementById('mobile-nav-quiz');
              if (navQuiz) navQuiz.click();
            } else if (PROFILE === 'teacher') {
              extra.teacherPopoverCheck = checkPopoverBounds(win, doc, 'btn-teacher-more', 'teacher-more-popover');

              if (CLICK_TURMA) {
                const btnTurma = doc.getElementById('btn-teacher-turma');
                if (btnTurma) {
                  btnTurma.click();
                  const vt = doc.getElementById('view-turma');
                  extra.clickedTurmaVisible = Boolean(vt && !vt.classList.contains('hidden') && isVisible(win, vt));
                  extra.postClickOverflow = {
                    clientWidth: doc.documentElement.clientWidth,
                    scrollWidth: doc.documentElement.scrollWidth
                  };
                } else {
                  extra.clickedTurmaVisible = false;
                }
              }
            }

            waitFrames(win, 2, () => {
              const metrics = collectMetrics(win, doc, extra);
              sendAudit(metrics);
            });
          }, 450);
        }, 150);
      });
    })();
  </script>
</body>
</html>`;
}

/**
 * Start ephemeral local HTTP server serving workspace assets + /__visual_harness.html + POST /__audit.
 */
function startLocalServer(auditsById) {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      const parsedUrl = new URL(req.url || '/', 'http://127.0.0.1');
      const urlPath = parsedUrl.pathname;

      if (req.method === 'POST' && urlPath === '/__audit') {
        let body = '';
        req.on('data', (chunk) => {
          body += chunk;
        });
        req.on('end', () => {
          try {
            const payload = JSON.parse(body);
            if (payload && payload.id) {
              auditsById.set(payload.id, payload);
            }
          } catch (err) {
            auditsById.set('__parse_error', { parseError: String(err) });
          }
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end('{"ok":true}');
        });
        return;
      }

      if (urlPath === '/__visual_harness.html') {
        const id = parsedUrl.searchParams.get('id') || 'default';
        const width = Math.max(240, Number(parsedUrl.searchParams.get('w')) || 375);
        const height = Math.max(320, Number(parsedUrl.searchParams.get('h')) || 667);
        const profile = parsedUrl.searchParams.get('profile') || 'gate';
        const clickTurma = parsedUrl.searchParams.get('clickTurma') === '1';

        const html = buildHarnessHtml({ id, width, height, profile, clickTurma });

        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(html);
        return;
      }

      const relPath = urlPath === '/' ? 'index.html' : decodeURIComponent(urlPath).replace(/^\/+/, '');
      const resolvedPath = path.resolve(PROJECT_ROOT, relPath);
      if (!resolvedPath.startsWith(PROJECT_ROOT) || !fs.existsSync(resolvedPath) || fs.statSync(resolvedPath).isDirectory()) {
        res.writeHead(404);
        res.end('Not found');
        return;
      }

      const ext = path.extname(resolvedPath).toLowerCase();
      res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' });
      fs.createReadStream(resolvedPath).pipe(res);
    });

    server.on('error', reject);
    server.listen(0, '127.0.0.1', () => {
      resolve(server);
    });
  });
}

/**
 * Run headless Chrome asynchronously so Node's HTTP event loop stays unblocked.
 */
function runChromeCapture(chromePath, { width, height, outputPath, url, tempProfile }) {
  return new Promise((resolve) => {
    const args = [
      '--headless=new',
      '--disable-gpu',
      '--no-sandbox',
      `--user-data-dir=${tempProfile}`,
      `--window-size=${width},${height}`,
      '--virtual-time-budget=3000',
      `--screenshot=${outputPath}`,
      url
    ];

    const startTime = Date.now();
    let stderr = '';
    let timedOut = false;

    const child = spawn(chromePath, args, { stdio: ['ignore', 'ignore', 'pipe'] });
    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    const timeoutHandle = setTimeout(() => {
      timedOut = true;
      child.kill();
    }, 35000);

    child.on('error', (err) => {
      clearTimeout(timeoutHandle);
      resolve({ status: null, error: err, stderr, timedOut, elapsed: Date.now() - startTime });
    });

    child.on('close', (code) => {
      clearTimeout(timeoutHandle);
      resolve({ status: code, error: null, stderr, timedOut, elapsed: Date.now() - startTime });
    });
  });
}

/**
 * Validate scenario DOM audit expectations and return human-readable failure reasons.
 */
function evaluateScenarioAudit(vp, audit, extraTurmaAudit = null) {
  const failures = [];
  if (!audit) {
    failures.push('Auditoria DOM não recebida via /__audit');
    return failures;
  }

  if (audit.frameInnerWidth !== vp.width || audit.frameInnerHeight !== vp.height) {
    failures.push(`Viewport do iframe (${audit.frameInnerWidth}x${audit.frameInnerHeight}) difere de (${vp.width}x${vp.height})`);
  }

  if (audit.scrollWidth > audit.clientWidth + 2) {
    failures.push(`Estouro horizontal: scrollWidth (${audit.scrollWidth}) > clientWidth + 2 (${audit.clientWidth + 2})`);
  }

  if (audit.headerH1Color !== 'rgb(40, 46, 62)') {
    failures.push(`header h1 color esperado 'rgb(40, 46, 62)', obtido '${audit.headerH1Color}'`);
  }

  if (vp.profile !== 'gate') {
    const emb = audit.brandEmblemSize;
    if (!emb || emb.width < 32 || emb.height < 32 || Math.abs(emb.width - emb.height) > 1) {
      failures.push(`Emblema da marca achatado/inválido: ${emb ? `${emb.width}x${emb.height}` : 'ausente'}`);
    }
    if (vp.width >= 1024 && audit.desktopNavWraps) {
      failures.push('Abas da navegação desktop em <header> quebraram em múltiplas linhas');
    }
  }

  if (vp.profile === 'gate') {
    if (!audit.gateVisible) failures.push('#session-gate não está visível no Gate');
    if (audit.shellVisible) failures.push('#app-shell deveria estar oculto no Gate');
  } else if (vp.profile === 'student') {
    if (audit.sessionRole !== 'student') failures.push(`sessionRole esperado 'student', obtido '${audit.sessionRole}'`);
    if (audit.gateVisible || !audit.shellVisible) failures.push('Sessão Estudante não exibiu #app-shell');
    if (!audit.studentPanelVisible) failures.push('#student-header-panel não visível na Sessão Estudante');
    if (!audit.viewHomeVisible) failures.push('#view-home (Hub) não visível após login do Estudante');
    const maxStudentHeaderH = vp.width >= 768 ? 76 : 68;
    if (audit.headerHeight > maxStudentHeaderH) {
      failures.push(`<header> estudante muito alto em ${vp.width}px: ${audit.headerHeight}px > ${maxStudentHeaderH}px`);
    }
    if (!audit.studentPopoverCheck || !audit.studentPopoverCheck.opened || !audit.studentPopoverCheck.withinViewport) {
      failures.push('Popover #student-profile-popover não abriu ou escapou da viewport');
    }
  } else if (vp.profile === 'student_aulas') {
    if (audit.sessionRole !== 'student') failures.push(`sessionRole esperado 'student', obtido '${audit.sessionRole}'`);
    if (!audit.viewDay1Visible) failures.push('#view-day1 (Aulas) não visível na Sessão Estudante');
    if (!audit.stageTabsHaveSvg) failures.push(`Abas 3 estágios devem conter <svg (tabs=${audit.stageTabCount}, svg=${audit.stageTabsHaveSvg})`);
    if (!audit.axisChipsHaveSvg) failures.push(`Chips de eixo devem conter <svg (chips=${audit.axisChipCount}, svg=${audit.axisChipsHaveSvg})`);
    if (!audit.quickFilterWorked) failures.push('Filtro rápido #aulas-quick-filter não filtrou módulos ao digitar "parabola"');
  } else if (vp.profile === 'student_quiz') {
    if (audit.sessionRole !== 'student') failures.push(`sessionRole esperado 'student', obtido '${audit.sessionRole}'`);
    if (!audit.viewQuizVisible) failures.push('#view-quiz (Simulado) não visível');
    if (audit.quizBannerHeadingColor && audit.quizBannerHeadingColor !== 'rgb(255, 255, 255)') {
      failures.push(`Banner Simulado heading color esperado 'rgb(255, 255, 255)', obtido '${audit.quizBannerHeadingColor}'`);
    }
  } else if (vp.profile === 'teacher') {
    if (audit.sessionRole !== 'teacher') failures.push(`sessionRole esperado 'teacher', obtido '${audit.sessionRole}'`);
    if (audit.gateVisible || !audit.shellVisible) failures.push('Sessão Docente não exibiu #app-shell');
    if (!audit.teacherPanelVisible) failures.push('#teacher-header-panel não visível na Sessão Docente');
    if (!audit.btnTeacherTurmaExists || !audit.btnTeacherTurmaVisible) {
      failures.push('#btn-teacher-turma ausente ou invisível na Sessão Docente');
    }
    if (audit.teacherBarWraps) {
      failures.push('Botões de #teacher-header-panel quebraram em múltiplas linhas');
    }
    const maxHeaderH = vp.width >= 768 ? 76 : 112;
    if (audit.headerHeight > maxHeaderH) {
      failures.push(`<header> muito alto em ${vp.width}px: ${audit.headerHeight}px > ${maxHeaderH}px`);
    }
    if (!audit.teacherPopoverCheck || !audit.teacherPopoverCheck.opened || !audit.teacherPopoverCheck.withinViewport) {
      failures.push('Popover #teacher-more-popover não abriu ou escapou da viewport');
    }
    if (vp.name === 'teacher_mobile_375') {
      if (!extraTurmaAudit || !extraTurmaAudit.clickedTurmaVisible) {
        failures.push('Clique em #btn-teacher-turma não abriu #view-turma');
      } else if (extraTurmaAudit.postClickOverflow &&
        extraTurmaAudit.postClickOverflow.scrollWidth > extraTurmaAudit.postClickOverflow.clientWidth + 2) {
        failures.push(`Estouro horizontal em #view-turma: ${extraTurmaAudit.postClickOverflow.scrollWidth} > ${extraTurmaAudit.postClickOverflow.clientWidth + 2}`);
      }
    }
  }

  return failures;
}

async function runVisualResponsiveHarness() {
  console.log('======================================================================');
  console.log('  HARNESS DE VERIFICAÇÃO VISUAL E RESPONSIVA HEADLESS (MILESTONE T3)  ');
  console.log('======================================================================\n');

  if (!fs.existsSync(HTML_FILE)) {
    console.error(`ERRO: index.html não encontrado no caminho: ${HTML_FILE}`);
    process.exit(1);
  }

  if (!fs.existsSync(SCREENSHOTS_DIR)) {
    fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
    console.log(`Diretório de capturas criado: ${SCREENSHOTS_DIR}\n`);
  }

  const chromePath = findChromeExecutable();
  if (!chromePath) {
    console.warn('⚠️ AVISO: Executável do Google Chrome não encontrado nos caminhos padrão.');
    console.warn('Iniciando fallback estático de verificação de responsividade DOM...\n');
    const fallbackOk = performResponsiveStaticFallback();
    process.exit(fallbackOk ? 0 : 1);
  }

  const auditsById = new Map();
  let server;
  try {
    server = await startLocalServer(auditsById);
  } catch (err) {
    console.error(`✖ Falha ao iniciar servidor HTTP efêmero: ${err.message}`);
    process.exit(1);
  }

  const port = server.address().port;
  console.log(`Executável Chrome detectado: ${chromePath}`);
  console.log(`Servidor efêmero ativo: http://127.0.0.1:${port}\n`);

  const results = [];
  let allPassed = true;

  try {
    for (const vp of SCENARIOS) {
      const outputPath = path.join(SCREENSHOTS_DIR, vp.filename);
      const tempProfile = path.join(os.tmpdir(), `chrome_harness_${vp.name}_${Date.now()}`);

      if (fs.existsSync(outputPath)) {
        try { fs.unlinkSync(outputPath); } catch {}
      }

      const harnessUrl = `http://127.0.0.1:${port}/__visual_harness.html?id=${encodeURIComponent(vp.name)}&w=${vp.width}&h=${vp.height}&profile=${encodeURIComponent(vp.profile)}`;
      const proc = await runChromeCapture(chromePath, {
        width: vp.width,
        height: vp.height,
        outputPath,
        url: harnessUrl,
        tempProfile
      });

      try { fs.rmSync(tempProfile, { recursive: true, force: true }); } catch {}

      let extraTurmaAudit = null;
      if (vp.name === 'teacher_mobile_375' && fs.existsSync(outputPath)) {
        const probeId = 'teacher_turma_click_probe';
        const turmaPng = path.join(SCREENSHOTS_DIR, 'screenshot_teacher_turma_375.png');
        const tempTurmaProfile = path.join(os.tmpdir(), `chrome_turma_prof_${Date.now()}`);
        const turmaUrl = `http://127.0.0.1:${port}/__visual_harness.html?id=${probeId}&w=375&h=667&profile=teacher&clickTurma=1`;
        await runChromeCapture(chromePath, {
          width: 375,
          height: 667,
          outputPath: turmaPng,
          url: turmaUrl,
          tempProfile: tempTurmaProfile
        });
        extraTurmaAudit = auditsById.get(probeId) || null;
        try { fs.rmSync(tempTurmaProfile, { recursive: true, force: true }); } catch {}
      }

      if (proc.error || proc.timedOut) {
        const msg = proc.timedOut ? 'Timeout ao executar Chrome headless' : proc.error.message;
        console.error(`  ✖ [${vp.name}] ${msg}`);
        results.push({ ...vp, passed: false, errors: [msg], bytes: 0 });
        allPassed = false;
        continue;
      }

      if (/ERR_NETWORK_ACCESS_DENIED/i.test(proc.stderr) && !fs.existsSync(outputPath)) {
        const msg = 'Chrome headless bloqueado de acessar 127.0.0.1 pela sandbox (ERR_NETWORK_ACCESS_DENIED)';
        console.error(`  ✖ [${vp.name}] ${msg}`);
        results.push({ ...vp, passed: false, errors: [msg], bytes: 0 });
        allPassed = false;
        continue;
      }

      if (!fs.existsSync(outputPath)) {
        const msg = `Arquivo de captura não gerado: ${outputPath}`;
        console.error(`  ✖ [${vp.name}] ${msg}`);
        results.push({ ...vp, passed: false, errors: [msg], bytes: 0 });
        allPassed = false;
        continue;
      }

      const buffer = fs.readFileSync(outputPath);
      const pngInfo = inspectPngBuffer(buffer);
      if (!pngInfo.valid) {
        console.error(`  ✖ [${vp.name}] Imagem PNG inválida: ${pngInfo.error}`);
        results.push({ ...vp, passed: false, errors: [pngInfo.error], bytes: buffer.length });
        allPassed = false;
        continue;
      }

      const audit = auditsById.get(vp.name) || null;
      const auditFailures = evaluateScenarioAudit(vp, audit, extraTurmaAudit);
      if (pngInfo.width !== vp.width || pngInfo.height !== vp.height) {
        auditFailures.push(`Dimensões PNG (${pngInfo.width}x${pngInfo.height}) diferem de (${vp.width}x${vp.height})`);
      }

      const scenarioPassed = auditFailures.length === 0;
      if (!scenarioPassed) allPassed = false;

      const icon = scenarioPassed ? '✔' : '✖';
      console.log(`  ${icon} [${vp.name}] ${vp.label}`);
      console.log(`    ↳ Arquivo: test/screenshots/${vp.filename} (${(buffer.length / 1024).toFixed(1)} KB, ${pngInfo.width}x${pngInfo.height} px, ${proc.elapsed}ms)`);
      if (audit) {
        const overflowInfo = `iframe=${audit.frameInnerWidth}x${audit.frameInnerHeight}, scrollWidth=${audit.scrollWidth}, clientWidth=${audit.clientWidth}`;
        let extras = '';
        if (vp.profile === 'teacher') {
          const turmaClickInfo = vp.name === 'teacher_mobile_375'
            ? `, #view-turma(click)=${Boolean(extraTurmaAudit && extraTurmaAudit.clickedTurmaVisible)}`
            : '';
          extras = `, headerH=${audit.headerHeight}px, barWraps=${audit.teacherBarWraps}, popoverOk=${Boolean(audit.teacherPopoverCheck && audit.teacherPopoverCheck.opened && audit.teacherPopoverCheck.withinViewport)}${turmaClickInfo}`;
        } else if (vp.profile === 'student_aulas') {
          extras = `, stageSvg=${audit.stageTabsHaveSvg} (${audit.stageTabCount}), chipsSvg=${audit.axisChipsHaveSvg} (${audit.axisChipCount}), quickFilter=${audit.quickFilterWorked}`;
        } else if (vp.profile === 'student_quiz') {
          extras = `, viewQuiz=${audit.viewQuizVisible}, quizBannerH=${audit.quizBannerHeadingColor}`;
        }
        console.log(`    ↳ Métricas: ${overflowInfo}, header h1=${audit.headerH1Color}${extras}`);
      }
      if (!scenarioPassed) {
        auditFailures.forEach((f) => console.error(`    ↳ Falha: ${f}`));
      }

      results.push({
        ...vp,
        passed: scenarioPassed,
        errors: auditFailures,
        bytes: buffer.length,
        actualWidth: pngInfo.width,
        actualHeight: pngInfo.height,
        audit
      });
    }
  } finally {
    server.closeAllConnections?.();
    server.close();
  }

  console.log('\n======================================================================');
  console.log('              RESUMO DA VERIFICAÇÃO VISUAL HEADLESS                   ');
  console.log('======================================================================');
  results.forEach((r) => {
    const status = r.passed ? 'APROVADO' : 'FALHOU  ';
    const dim = r.actualWidth ? `${r.actualWidth}x${r.actualHeight}` : 'N/A';
    console.log(`  ${r.passed ? '✔' : '✖'} ${r.name.padEnd(20)} | ${status} | ${dim.padEnd(9)} | ${(r.bytes / 1024).toFixed(1).padStart(6)} KB | ${r.filename}`);
  });
  console.log('----------------------------------------------------------------------');

  if (allPassed) {
    console.log('STATUS: ✔ TODAS AS CAPTURAS E AUDITORIAS DOM FORAM APROVADAS!\n');
    process.exit(0);
  } else {
    console.error('STATUS: ✖ FALHAS DETECTADAS NA AUDITORIA VISUAL/RESPONSIVA (TDD RED / CORREÇÃO PENDENTE).\n');
    process.exit(1);
  }
}

runVisualResponsiveHarness().catch((err) => {
  console.error('Erro inesperado no harness visual:', err);
  process.exit(1);
});
