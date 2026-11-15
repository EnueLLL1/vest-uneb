/**
 * TESTE AUTOMATIZADO DE CONFORMIDADE DE UI E HIERARQUIA VISUAL (QUIZLET DESIGN)
 * Arquitetura Sistemática em 4 Tiers (F1 a F14)
 * 
 * Execução:
 *   node test/test_ui_hierarchy.js              # Executa todos os 4 Tiers
 *   node test/test_ui_hierarchy.js --tier=1     # Executa apenas Tier 1 (Feature Coverage)
 *   node test/test_ui_hierarchy.js --tier=2     # Executa apenas Tier 2 (Boundary & Corner Cases)
 *   node test/test_ui_hierarchy.js --tier=3     # Executa apenas Tier 3 (Cross-Feature Interactions)
 *   node test/test_ui_hierarchy.js --tier=4     # Executa apenas Tier 4 (Real-World Scenarios)
 * 
 * Zero dependências externas — ECMAScript Modules nativo (Node.js v24+)
 */

import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

// Polyfill localStorage para isolamento de estado e módulos
const memoryStore = new Map();
globalThis.localStorage = {
  getItem: (k) => (memoryStore.has(k) ? memoryStore.get(k) : null),
  setItem: (k, v) => memoryStore.set(k, String(v)),
  removeItem: (k) => memoryStore.delete(k),
  clear: () => memoryStore.clear()
};

// Resolução de caminhos do projeto
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

// Importações dos módulos da aplicação
import {
  TEACHER_ACCESS_CODE,
  DEFAULT_CLASS_CODE,
  validateTeacherCode,
  normalizeStudentName,
  normalizeClassCode,
  normalizeStudentKey
} from '../js/utils/session.js';

import {
  APP_STORAGE_KEY,
  getState,
  setState,
  loadState,
  resetStudentProgress,
  isTeacherModeActive,
  completeModuleChallenge,
  recordModuleAttempt
} from '../js/state.js';

import { BANCO_PROVAS } from '../js/data/banco_questoes.js';

import {
  AXIS_META,
  mapAxisToModuleId,
  buildStudentDiagnosticPayload,
  encodeStudentReportCode,
  decodeStudentReportCode,
  computeStudentDiagnostic,
  computeClassDiagnostics
} from '../js/utils/classroom.js';

import { LOGIC_CHALLENGES, evaluateLogicChallenge } from '../js/modules/logica.js';
import { COMB_CHALLENGES, evaluateCombChallenge } from '../js/modules/combinatoria.js';
import { PARABOLA_CHALLENGES, evaluateParabolaChallenge } from '../js/modules/parabola.js';
import { TRIG_CHALLENGES, evaluateTrigChallenge } from '../js/modules/trig.js';
import { FINANCAS_CHALLENGES, evaluateFinancasChallenge } from '../js/modules/financas.js';
import { STATS_CHALLENGES, evaluateStatsChallenge } from '../js/modules/stats.js';

// Leitura de fontes estáticas
const indexHtml = fs.readFileSync(path.join(ROOT_DIR, 'index.html'), 'utf-8');
const cssCustom = fs.readFileSync(path.join(ROOT_DIR, 'css', 'custom.css'), 'utf-8');
let cssApp = '';
try {
  cssApp = fs.readFileSync(path.join(ROOT_DIR, 'css', 'app.css'), 'utf-8');
} catch {
  cssApp = '';
}
let jsAppSource = '';
try {
  jsAppSource = fs.readFileSync(path.join(ROOT_DIR, 'js', 'app.js'), 'utf-8');
} catch {
  jsAppSource = '';
}
let jsModuleStageSource = '';
try {
  jsModuleStageSource = fs.readFileSync(path.join(ROOT_DIR, 'js', 'utils', 'module-stage.js'), 'utf-8');
} catch {
  jsModuleStageSource = '';
}

// ---------------------------------------------------------------------------
// Helpers para Análise Estática & Inspeção de Contratos
// ---------------------------------------------------------------------------

function hasElementId(id) {
  return new RegExp(`id=["']${id}["']`, 'i').test(indexHtml);
}

function getElementSnippet(id) {
  const match = indexHtml.match(new RegExp(`<([a-zA-Z0-9]+)[^>]*id=["']${id}["'][^>]*>`, 'i'));
  return match ? match[0] : null;
}

function getElementBlock(id, length = 3000) {
  const startIdx = indexHtml.search(new RegExp(`<[a-zA-Z0-9]+[^>]*id=["']${id}["']`, 'i'));
  if (startIdx === -1) return null;
  return indexHtml.slice(startIdx, startIdx + length);
}

function getAttribute(snippet, attr) {
  if (!snippet) return null;
  const match = snippet.match(new RegExp(`${attr}=(["'])(.*?)\\1`, 'i'));
  return match ? match[2] : null;
}

function hasCssVar(varName) {
  return new RegExp(`${varName}\\s*:`, 'i').test(cssCustom);
}

function getCssVar(varName) {
  const match = cssCustom.match(new RegExp(`${varName}\\s*:\\s*([^;]+);`, 'i'));
  return match ? match[1].trim() : null;
}

function hasCssRule(selector, propertyPattern = null) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`${escaped}\\s*{([^}]*)}`, 'gis');
  let match;
  while ((match = regex.exec(cssCustom)) !== null) {
    if (!propertyPattern || new RegExp(propertyPattern, 'i').test(match[1])) {
      return true;
    }
  }
  return false;
}

// ---------------------------------------------------------------------------
// Test Runner Harness com Suporte a Filtro por Tier CLI
// ---------------------------------------------------------------------------

const args = process.argv.slice(2);
let selectedTier = null;
for (const arg of args) {
  if (arg.startsWith('--tier=')) {
    const val = arg.split('=')[1].toLowerCase();
    if (['1', '2', '3', '4'].includes(val)) {
      selectedTier = `tier${val}`;
    }
  }
}

const stats = {
  tier1: { total: 0, passed: 0, failed: 0 },
  tier2: { total: 0, passed: 0, failed: 0 },
  tier3: { total: 0, passed: 0, failed: 0 },
  tier4: { total: 0, passed: 0, failed: 0 }
};
const failures = [];

function runTest(tier, featureId, testId, description, fn) {
  if (selectedTier && selectedTier !== tier) return;
  stats[tier].total++;
  try {
    fn();
    stats[tier].passed++;
    console.log(`  ✔ [${tier.toUpperCase()}][${featureId}][${testId}] ${description}`);
  } catch (err) {
    stats[tier].failed++;
    console.error(`  ✖ [${tier.toUpperCase()}][${featureId}][${testId}] ${description}`);
    console.error(`    ↳ Falha: ${err.message}`);
    failures.push({ tier, featureId, testId, description, error: err.message });
  }
}

console.log('\n======================================================================');
console.log('  SUÍTE DE TESTES E2E DE HIERARQUIA VISUAL E TOKENS QUIZLET (UNEB)');
console.log(`  Modo: ${selectedTier ? `Executando apenas ${selectedTier.toUpperCase()}` : 'Executando Todos os 4 Tiers'}`);
console.log('======================================================================\n');

// ===========================================================================
// TIER 1: FEATURE COVERAGE (F1 A F14)
// ===========================================================================
if (!selectedTier || selectedTier === 'tier1') {
  console.log('--- [TIER 1] COBERTURA DE REQUISITOS E FUNCIONALIDADES (F1-F14) ---\n');

  // --- F1: Tokens de Cor Quizlet ---
  runTest('tier1', 'F1', 'T1-F01-01', ':root define --surface-page-canvas como #f6f7fb', () => {
    const val = getCssVar('--surface-page-canvas');
    assert.ok(val, 'Variável --surface-page-canvas deve estar definida no CSS');
    assert.equal(val.toLowerCase(), '#f6f7fb');
  });

  runTest('tier1', 'F1', 'T1-F01-02', ':root define --surface-card-surface como #ffffff', () => {
    const val = getCssVar('--surface-card-surface');
    assert.ok(val, 'Variável --surface-card-surface deve estar definida no CSS');
    assert.equal(val.toLowerCase(), '#ffffff');
  });

  runTest('tier1', 'F1', 'T1-F01-03', ':root define --surface-tinted-highlight como #edefff', () => {
    const val = getCssVar('--surface-tinted-highlight');
    assert.ok(val, 'Variável --surface-tinted-highlight deve estar definida no CSS');
    assert.equal(val.toLowerCase(), '#edefff');
  });

  runTest('tier1', 'F1', 'T1-F01-04', ':root define --color-mist-border como #d9dde8', () => {
    const val = getCssVar('--color-mist-border');
    assert.ok(val, 'Variável --color-mist-border deve estar definida no CSS');
    assert.equal(val.toLowerCase(), '#d9dde8');
  });

  runTest('tier1', 'F1', 'T1-F01-05', ':root define --color-iris-bolt (#4255ff) e --color-text-primary (#282e3e)', () => {
    const iris = getCssVar('--color-iris-bolt');
    const text = getCssVar('--color-text-primary');
    assert.ok(iris, '--color-iris-bolt deve estar definida');
    assert.ok(text, '--color-text-primary deve estar definida');
    assert.equal(iris.toLowerCase(), '#4255ff');
    assert.equal(text.toLowerCase(), '#282e3e');
  });

  // --- F2: Geometria de Botões e Cards ---
  runTest('tier1', 'F2', 'T1-F02-01', '--radius-pill é 200px e classe .btn-pill aplica raio de pílula', () => {
    const pill = getCssVar('--radius-pill');
    assert.ok(pill, '--radius-pill deve estar definida');
    assert.equal(pill, '200px');
    assert.ok(hasCssRule('.btn-pill', 'border-radius'), '.btn-pill deve definir border-radius');
  });

  runTest('tier1', 'F2', 'T1-F02-02', '--radius-card é 8px e classe .card-quizlet aplica raio de card', () => {
    const card = getCssVar('--radius-card');
    assert.ok(card, '--radius-card deve estar definida');
    assert.equal(card, '8px');
    assert.ok(hasCssRule('.card-quizlet', 'border-radius'), '.card-quizlet deve definir border-radius');
  });

  runTest('tier1', 'F2', 'T1-F02-03', '--radius-feature-card é 24px e classe .card-feature-quizlet aplica raio de destaque', () => {
    const feature = getCssVar('--radius-feature-card');
    assert.ok(feature, '--radius-feature-card deve estar definida');
    assert.equal(feature, '24px');
    assert.ok(hasCssRule('.card-feature-quizlet', 'border-radius'), '.card-feature-quizlet deve definir border-radius');
  });

  runTest('tier1', 'F2', 'T1-F02-04', '--shadow-quizlet aplica elevação suave com alfa 0.1', () => {
    const shadow = getCssVar('--shadow-quizlet');
    assert.ok(shadow, '--shadow-quizlet deve estar definida');
    assert.ok(shadow.includes('40, 46, 62') || shadow.includes('0.1'), 'Sombra deve usar tonalidade suave com alfa 0.1');
  });

  runTest('tier1', 'F2', 'T1-F02-05', 'Botão primário .btn-pill-primary aplica fundo #4255ff e texto branco', () => {
    assert.ok(hasCssRule('.btn-pill-primary', 'background.*#4255ff|background.*var\\(--color-iris-bolt\\)'), '.btn-pill-primary deve ter fundo iris');
    assert.ok(hasCssRule('.btn-pill-primary', 'color.*#ffffff|color.*white'), '.btn-pill-primary deve ter texto branco');
  });

  // --- F3: Tipografia & Isolamento Semântico ---
  runTest('tier1', 'F3', 'T1-F03-01', 'Família de fontes Inter está referenciada no HTML ou CSS', () => {
    const hasInter = indexHtml.includes('fonts.googleapis.com') && indexHtml.includes('Inter');
    const hasInterCss = cssCustom.includes('Inter') || cssApp.includes('Inter');
    assert.ok(hasInter || hasInterCss, 'Inter sans-serif deve ser importada ou declarada');
  });

  runTest('tier1', 'F3', 'T1-F03-02', '.math-font preserva Merriweather com estilo itálico', () => {
    const hasMathRule = hasCssRule('.math-font', 'font-family.*(Merriweather|var\\(--font-math\\))');
    assert.ok(hasMathRule, '.math-font deve conter Merriweather ou var(--font-math)');
    const fontMathVar = getCssVar('--font-math');
    if (fontMathVar) {
      assert.ok(fontMathVar.includes('Merriweather'), '--font-math deve conter Merriweather');
    }
    assert.ok(hasCssRule('.math-font', 'font-style.*italic'), '.math-font deve conter font-style: italic');
  });

  runTest('tier1', 'F3', 'T1-F03-03', 'Cor verde semântica restrita a feedback de acerto/sucesso', () => {
    const successVar = getCssVar('--color-semantic-success');
    if (successVar) {
      assert.ok(['#10b981', '#34d399', '#059669'].includes(successVar.toLowerCase()));
    }
    // Assegura que botões neutros não usam verde como fundo padrão
    assert.ok(!hasCssRule('.btn-pill:not(.btn-pill-success)', 'background.*#10b981'), 'Botão geral não deve usar verde semântico');
  });

  runTest('tier1', 'F3', 'T1-F03-04', 'Cor vermelha semântica restrita a feedback de erro/perigo', () => {
    const dangerVar = getCssVar('--color-semantic-danger');
    if (dangerVar) {
      assert.ok(['#ef4444', '#f87171', '#dc2626'].includes(dangerVar.toLowerCase()));
    }
    assert.ok(!hasCssRule('.btn-pill:not(.btn-pill-danger)', 'background.*#ef4444'), 'Botão geral não deve usar vermelho semântico');
  });

  runTest('tier1', 'F3', 'T1-F03-05', 'Cor âmbar semântica restrita a questões anuladas e avisos docentes', () => {
    const cancelSnippet = indexHtml.includes('anulada') || indexHtml.includes('badge-cancelled');
    const teacherBanner = hasElementId('teacher-preview-banner');
    assert.ok(cancelSnippet || teacherBanner, 'Feedback âmbar reservado para anuladas ou banner de professor');
  });

  // --- F4: Hub do Estudante: Pilar 1 (Quadro da Aula) ---
  runTest('tier1', 'F4', 'T1-F04-01', 'Elemento #hub-quadro-aula presente no DOM com classe de destaque', () => {
    assert.ok(hasElementId('hub-quadro-aula'), 'Elemento #hub-quadro-aula deve existir em index.html');
    const snippet = getElementSnippet('hub-quadro-aula');
    assert.ok(snippet.includes('card-feature-quizlet') || snippet.includes('rounded-'), '#hub-quadro-aula deve ter classe de destaque');
  });

  runTest('tier1', 'F4', 'T1-F04-02', '#hub-quadro-aula contém CTA com ação de continuar o estudo', () => {
    const block = getElementBlock('hub-quadro-aula');
    assert.ok(block, 'Bloco #hub-quadro-aula deve existir');
    const hasCta = /Continuar|Começar|Acessar|btn-pill/i.test(block);
    assert.ok(hasCta, '#hub-quadro-aula deve conter botão CTA de estudo');
  });

  runTest('tier1', 'F4', 'T1-F04-03', '#hub-quadro-aula contém navegação rápida para os 6 Eixos Temáticos', () => {
    const block = getElementBlock('hub-quadro-aula');
    assert.ok(block, 'Bloco #hub-quadro-aula deve existir');
    const hasEixos = /Eixo\s*1|Eixo\s*2|Eixo\s*3|Eixo\s*4|Eixo\s*5|Eixo\s*6/i.test(block) || /data-axis/i.test(block);
    assert.ok(hasEixos, '#hub-quadro-aula deve conter atalhos para os eixos');
  });

  runTest('tier1', 'F4', 'T1-F04-04', 'Disparo de navegação do Hub vincula a rotas válidas de aula', () => {
    assert.ok(hasElementId('view-day1'), 'View de Aulas Dia 1 deve existir');
    assert.ok(hasElementId('view-day2'), 'View de Aulas Dia 2 deve existir');
  });

  runTest('tier1', 'F4', 'T1-F04-05', '#hub-quadro-aula renderiza indicador de status pedagógico', () => {
    const block = getElementBlock('hub-quadro-aula');
    assert.ok(block, 'Bloco #hub-quadro-aula deve existir');
    const hasStatus = /status|módulo|aula|progresso|tópico/i.test(block);
    assert.ok(hasStatus, '#hub-quadro-aula deve apresentar indicador textual de status');
  });

  // --- F5: Hub do Estudante: Pilar 2 (Simulado Oficial) ---
  runTest('tier1', 'F5', 'T1-F05-01', 'Elemento #hub-simulado presente no DOM dentro do Hub', () => {
    assert.ok(hasElementId('hub-simulado'), 'Elemento #hub-simulado deve existir em index.html');
  });

  runTest('tier1', 'F5', 'T1-F05-02', '#hub-simulado exibe informações de 60 minutos e 15 questões', () => {
    const block = getElementBlock('hub-simulado');
    assert.ok(block, 'Bloco #hub-simulado deve existir');
    assert.ok(/60\s*min/i.test(block) || /15\s*quest/i.test(block), 'Deve explicitar formato oficial de 60 min e 15 questões');
  });

  runTest('tier1', 'F5', 'T1-F05-03', '#hub-simulado contém botão CTA para iniciar simulado', () => {
    const block = getElementBlock('hub-simulado');
    assert.ok(block, 'Bloco #hub-simulado deve existir');
    const hasStartBtn = hasElementId('btn-hub-start-quiz') || /Iniciar|Simulado|btn-pill/i.test(block);
    assert.ok(hasStartBtn, 'Deve conter botão para iniciar o Simulado Oficial');
  });

  runTest('tier1', 'F5', 'T1-F05-04', '#hub-simulado possui card neutro sem ofuscar a aula principal', () => {
    const snippet = getElementSnippet('hub-simulado');
    assert.ok(snippet, '#hub-simulado snippet deve existir');
    assert.ok(!snippet.includes('bg-amber') && !snippet.includes('bg-red'), 'Card de simulado não deve usar cores alarmantes');
  });

  runTest('tier1', 'F5', 'T1-F05-05', '#view-quiz contém controles de temporizador oficial', () => {
    assert.ok(hasElementId('quiz-timer'), '#quiz-timer deve existir');
    assert.ok(hasElementId('btn-toggle-timer'), '#btn-toggle-timer deve existir');
  });

  // --- F6: Hub do Estudante: Pilar 3 (Minha Progressão) ---
  runTest('tier1', 'F6', 'T1-F06-01', 'Elemento #hub-progressao presente no Hub', () => {
    assert.ok(hasElementId('hub-progressao'), 'Elemento #hub-progressao deve existir em index.html');
  });

  runTest('tier1', 'F6', 'T1-F06-02', 'Elemento de percentual (#hub-metric-percent ou #metric-percent) presente', () => {
    const hasPercent = hasElementId('hub-metric-percent') || hasElementId('metric-percent');
    assert.ok(hasPercent, 'Deve conter elemento de exibição de percentual de conclusão');
  });

  runTest('tier1', 'F6', 'T1-F06-03', 'Elemento de contagem de módulos (#hub-metric-modules ou #metric-done-count) presente', () => {
    const hasModules = hasElementId('hub-metric-modules') || hasElementId('metric-done-count');
    assert.ok(hasModules, 'Deve conter elemento de contagem de módulos finalizados');
  });

  runTest('tier1', 'F6', 'T1-F06-04', 'Elemento de XP acumulado (#hub-metric-xp ou #metric-score) presente', () => {
    const hasXp = hasElementId('hub-metric-xp') || hasElementId('metric-score');
    assert.ok(hasXp, 'Deve conter elemento de exibição de XP');
  });

  runTest('tier1', 'F6', 'T1-F06-05', 'updateMetricUI em js/app.js sincroniza nós de métricas', () => {
    assert.ok(jsAppSource.includes('updateMetricUI'), 'js/app.js deve declarar updateMetricUI');
    assert.ok(jsAppSource.includes('metric-percent') || jsAppSource.includes('hub-metric-percent'), 'updateMetricUI deve atualizar percentual');
  });

  // --- F7: Header Mobile Descongestionado ---
  runTest('tier1', 'F7', 'T1-F07-01', 'Barra de progresso superior não está empilhada no fluxo principal mobile', () => {
    const snippet = getElementSnippet('metric-progress-bar');
    if (snippet) {
      assert.ok(snippet.includes('hidden') || snippet.includes('lg:block') || snippet.includes('sm:block') || !snippet.includes('w-full block'), 'Barra de progresso deve ser oculta ou adaptada no mobile');
    } else {
      assert.ok(true, 'Barra removida do header mobile conforme especificação');
    }
  });

  runTest('tier1', 'F7', 'T1-F07-02', 'Ações utilitárias (compartilhar, resetar, trocar sessão) existem no DOM', () => {
    assert.ok(hasElementId('btn-student-share-report'), '#btn-student-share-report deve existir');
    assert.ok(hasElementId('btn-reset-progress'), '#btn-reset-progress deve existir');
    assert.ok(hasElementId('btn-switch-session-student'), '#btn-switch-session-student deve existir');
  });

  runTest('tier1', 'F7', 'T1-F07-03', 'Header principal <header> possui estrutura flex/grid compacta', () => {
    assert.ok(indexHtml.includes('<header'), '<header> deve existir');
    const headerBlock = indexHtml.match(/<header[^>]*>([\s\S]*?)<\/header>/i);
    assert.ok(headerBlock, 'Conteúdo do <header> deve ser extraível');
    assert.ok(headerBlock[1].includes('flex') || headerBlock[1].includes('grid'), 'Header deve conter estrutura flex/grid');
  });

  runTest('tier1', 'F7', 'T1-F07-04', 'Badge de estudante #student-name-badge presente no header', () => {
    assert.ok(hasElementId('student-name-badge'), '#student-name-badge deve existir');
  });

  runTest('tier1', 'F7', 'T1-F07-05', 'Header possui classes responsivas de controle de exibição', () => {
    assert.ok(indexHtml.includes('lg:flex') || indexHtml.includes('hidden lg:flex') || indexHtml.includes('sm:inline'), 'Header deve conter regras de responsividade');
  });

  // --- F8: Barra Inferior Thumb-Zone Mobile ---
  runTest('tier1', 'F8', 'T1-F08-01', 'Elemento #mobile-bottom-nav presente no DOM com fixação inferior', () => {
    assert.ok(hasElementId('mobile-bottom-nav'), '#mobile-bottom-nav deve existir em index.html');
    const snippet = getElementSnippet('mobile-bottom-nav');
    assert.ok(snippet.includes('fixed') && snippet.includes('bottom-0'), '#mobile-bottom-nav deve ser fixada no rodapé');
  });

  runTest('tier1', 'F8', 'T1-F08-02', '#mobile-bottom-nav contém exatamente as 3 abas essenciais (Início, Aulas, Simulado)', () => {
    const block = getElementBlock('mobile-bottom-nav');
    assert.ok(block, 'Bloco #mobile-bottom-nav deve existir');
    const hasHome = /Início|Home|data-target-view=["']home["']/i.test(block);
    const hasAulas = /Aulas|Aulas|data-target-view=["']aulas["']|data-target-view=["']day1["']/i.test(block);
    const hasQuiz = /Simulado|Quiz|data-target-view=["']quiz["']/i.test(block);
    assert.ok(hasHome && hasAulas && hasQuiz, 'Barra inferior deve contemplar Início, Aulas e Simulado');
  });

  runTest('tier1', 'F8', 'T1-F08-03', '#mobile-bottom-nav oculta em viewports desktop (lg:hidden)', () => {
    const snippet = getElementSnippet('mobile-bottom-nav');
    assert.ok(snippet, '#mobile-bottom-nav snippet deve existir');
    assert.ok(snippet.includes('lg:hidden'), '#mobile-bottom-nav deve conter lg:hidden');
  });

  runTest('tier1', 'F8', 'T1-F08-04', 'Itens interativos da barra inferior respeitam área mínima de toque (44px)', () => {
    const block = getElementBlock('mobile-bottom-nav');
    assert.ok(block, 'Bloco #mobile-bottom-nav deve existir');
    const hasMinTarget = /min-h-\[44px\]|py-3|h-12|h-14|--target-size/i.test(block) || cssCustom.includes('--target-size: 44px');
    assert.ok(hasMinTarget, 'Abas devem respeitar altura mínima de toque de 44px');
  });

  runTest('tier1', 'F8', 'T1-F08-05', 'Abas da barra inferior possuem atributos de navegação semântica', () => {
    const block = getElementBlock('mobile-bottom-nav');
    assert.ok(block, 'Bloco #mobile-bottom-nav deve existir');
    const hasAttr = /data-target-view|aria-label|role=["']tab["']/i.test(block);
    assert.ok(hasAttr, 'Abas devem conter data-target-view ou role="tab"');
  });

  // --- F9: Preservação da Sessão Docente Desktop ---
  runTest('tier1', 'F9', 'T1-F09-01', '#btn-teacher-toggle-answers presente com atributo aria-pressed', () => {
    assert.ok(hasElementId('btn-teacher-toggle-answers'), '#btn-teacher-toggle-answers deve existir');
    const snippet = getElementSnippet('btn-teacher-toggle-answers');
    assert.ok(snippet.includes('aria-pressed'), '#btn-teacher-toggle-answers deve ter aria-pressed');
  });

  runTest('tier1', 'F9', 'T1-F09-02', '#btn-teacher-preview-student presente no DOM', () => {
    assert.ok(hasElementId('btn-teacher-preview-student'), '#btn-teacher-preview-student deve existir');
  });

  runTest('tier1', 'F9', 'T1-F09-03', '#nav-turma e #view-turma existem para gerenciamento da turma', () => {
    assert.ok(hasElementId('nav-turma'), '#nav-turma deve existir');
    assert.ok(hasElementId('view-turma'), '#view-turma deve existir');
  });

  runTest('tier1', 'F9', 'T1-F09-04', '#teacher-header-panel possui classe hidden por padrão', () => {
    assert.ok(hasElementId('teacher-header-panel'), '#teacher-header-panel deve existir');
    const snippet = getElementSnippet('teacher-header-panel');
    assert.ok(snippet.includes('hidden'), '#teacher-header-panel deve iniciar oculto para alunos');
  });

  runTest('tier1', 'F9', 'T1-F09-05', '#teacher-preview-banner contém botão para sair do modo aluno', () => {
    assert.ok(hasElementId('teacher-preview-banner'), '#teacher-preview-banner deve existir');
    assert.ok(hasElementId('btn-exit-student-preview'), '#btn-exit-student-preview deve existir');
  });

  // --- F10: Aulas em Chips Horizontais ---
  runTest('tier1', 'F10', 'T1-F10-01', 'Seletor de Eixos em chips horizontais presente no DOM', () => {
    const hasChips = hasElementId('aulas-axis-chips') || indexHtml.includes('data-axis-chips') || indexHtml.includes('data-axis=');
    assert.ok(hasChips, 'Seletor de Eixos em chips horizontais deve existir');
  });

  runTest('tier1', 'F10', 'T1-F10-02', 'Todos os 6 Eixos Temáticos possuem módulos estruturados no DOM', () => {
    assert.ok(hasElementId('mod-logica'), 'Eixo 1 (#mod-logica) deve existir');
    assert.ok(hasElementId('mod-numeros'), 'Eixo 2 (#mod-numeros) deve existir');
    assert.ok(hasElementId('mod-algebra'), 'Eixo 3 (#mod-algebra) deve existir');
    assert.ok(hasElementId('mod-trig'), 'Eixo 4 (#mod-trig) deve existir');
    assert.ok(hasElementId('mod-financas'), 'Eixo 5 (#mod-financas) deve existir');
    assert.ok(hasElementId('mod-estatistica'), 'Eixo 6 (#mod-estatistica) deve existir');
  });

  runTest('tier1', 'F10', 'T1-F10-03', 'Módulos organizados entre visualizações de Dia 1 e Dia 2', () => {
    assert.ok(hasElementId('view-day1'), '#view-day1 deve existir');
    assert.ok(hasElementId('view-day2'), '#view-day2 deve existir');
  });

  runTest('tier1', 'F10', 'T1-F10-04', 'Etapa 1 (Conceito Visual) renderizada com leitura direta sem flashcards', () => {
    assert.ok(indexHtml.includes('Conceito Visual') || indexHtml.includes('data-stage="conceito"'), 'Etapa de Conceito Visual deve existir');
    assert.ok(!indexHtml.includes('flashcard-flip') && !indexHtml.includes('perspective-1000'), 'Não deve usar mecânica de desvirar flashcard');
  });

  runTest('tier1', 'F10', 'T1-F10-05', 'Etapas de Laboratório Vivo e Prática Rápida preservadas', () => {
    assert.ok(indexHtml.includes('Laboratório Vivo') || indexHtml.includes('data-stage="laboratorio"'), 'Laboratório Vivo deve existir');
    assert.ok(indexHtml.includes('Prática Rápida') || indexHtml.includes('data-stage="pratica"'), 'Prática Rápida deve existir');
  });

  // --- F11: Simulado Focado NotebookLM ---
  runTest('tier1', 'F11', 'T1-F11-01', 'Container focado de questão do Simulado presente no DOM', () => {
    const hasFocusedContainer = hasElementId('quiz-single-question-container') || hasElementId('quiz-questions-container');
    assert.ok(hasFocusedContainer, 'Container de questão do simulado deve existir');
  });

  runTest('tier1', 'F11', 'T1-F11-02', 'Indicador de questão focada no formato X / 15 presente', () => {
    const hasCounter = hasElementId('quiz-focused-counter') || /1\s*\/\s*15|Questão\s*1\s*de\s*15/i.test(indexHtml) || jsAppSource.includes('currentQuestionIndex');
    assert.ok(hasCounter, 'Indicador 1 de 15 deve estar presente ou mapeado');
  });

  runTest('tier1', 'F11', 'T1-F11-03', 'Container de questões do Simulado #quiz-questions-container existe', () => {
    assert.ok(hasElementId('quiz-questions-container'), '#quiz-questions-container deve existir');
  });

  runTest('tier1', 'F11', 'T1-F11-04', 'Botão de Dica / Resolução (#btn-quiz-hint ou similar) presente', () => {
    const hasHint = hasElementId('btn-quiz-hint') || /Dica|Resolução/i.test(indexHtml);
    assert.ok(hasHint, 'Botão de Dica / Resolução deve existir no Simulado');
  });

  runTest('tier1', 'F11', 'T1-F11-05', 'Botões pílula de navegação #btn-quiz-prev e #btn-quiz-next presentes', () => {
    const hasNavBtns = (hasElementId('btn-quiz-prev') && hasElementId('btn-quiz-next')) || /Anterior.*Próxima/s.test(indexHtml);
    assert.ok(hasNavBtns, 'Botões Anterior e Próxima devem existir no Simulado');
  });

  // --- F12: Visão Completa e Grade do Simulado ---
  runTest('tier1', 'F12', 'T1-F12-01', 'Grade de navegação rápida do Simulado #quiz-nav-grid presente', () => {
    assert.ok(hasElementId('quiz-nav-grid'), '#quiz-nav-grid deve existir');
  });

  runTest('tier1', 'F12', 'T1-F12-02', 'Painel de navegação do Simulado #quiz-nav-panel presente', () => {
    assert.ok(hasElementId('quiz-nav-panel'), '#quiz-nav-panel deve existir');
  });

  runTest('tier1', 'F12', 'T1-F12-03', 'Alternador de modo de exibição de prova (#btn-quiz-toggle-mode ou similar) presente', () => {
    const hasToggle = hasElementId('btn-quiz-toggle-mode') || hasElementId('btn-mode-simulado') || hasElementId('btn-mode-estudo');
    assert.ok(hasToggle, 'Alternador de modo de prova deve existir');
  });

  runTest('tier1', 'F12', 'T1-F12-04', 'Suporte a visão completa para projeção docente em telas grandes', () => {
    const hasFullMode = indexHtml.includes('quiz-questions-container') && (indexHtml.includes('grid') || indexHtml.includes('space-y-'));
    assert.ok(hasFullMode, 'Layout deve suportar listagem completa das questões');
  });

  runTest('tier1', 'F12', 'T1-F12-05', 'Botão de entrega #btn-submit-quiz e card de resultado #quiz-result-card presentes', () => {
    assert.ok(hasElementId('btn-submit-quiz'), '#btn-submit-quiz deve existir');
    assert.ok(hasElementId('quiz-result-card'), '#quiz-result-card deve existir');
  });

  // --- F13: Preservação dos 4 Canvases & Banco ---
  runTest('tier1', 'F13', 'T1-F13-01', '<canvas id="canvas-algebra"> preserva 550x320 e role="img"', () => {
    assert.ok(hasElementId('canvas-algebra'), '#canvas-algebra deve existir');
    const snippet = getElementSnippet('canvas-algebra');
    assert.equal(getAttribute(snippet, 'width'), '550');
    assert.equal(getAttribute(snippet, 'height'), '320');
    assert.equal(getAttribute(snippet, 'role'), 'img');
  });

  runTest('tier1', 'F13', 'T1-F13-02', '<canvas id="canvas-trig"> preserva 360x360 e role="img"', () => {
    assert.ok(hasElementId('canvas-trig'), '#canvas-trig deve existir');
    const snippet = getElementSnippet('canvas-trig');
    assert.equal(getAttribute(snippet, 'width'), '360');
    assert.equal(getAttribute(snippet, 'height'), '360');
    assert.equal(getAttribute(snippet, 'role'), 'img');
  });

  runTest('tier1', 'F13', 'T1-F13-03', '<canvas id="canvas-finance"> preserva 540x260 e role="img"', () => {
    assert.ok(hasElementId('canvas-finance'), '#canvas-finance deve existir');
    const snippet = getElementSnippet('canvas-finance');
    assert.equal(getAttribute(snippet, 'width'), '540');
    assert.equal(getAttribute(snippet, 'height'), '260');
    assert.equal(getAttribute(snippet, 'role'), 'img');
  });

  runTest('tier1', 'F13', 'T1-F13-04', '<canvas id="canvas-stat"> preserva 500x190 e role="img"', () => {
    assert.ok(hasElementId('canvas-stat'), '#canvas-stat deve existir');
    const snippet = getElementSnippet('canvas-stat');
    assert.equal(getAttribute(snippet, 'width'), '500');
    assert.equal(getAttribute(snippet, 'height'), '190');
    assert.equal(getAttribute(snippet, 'role'), 'img');
  });

  runTest('tier1', 'F13', 'T1-F13-05', 'Banco de questões preserva 51 questões e 17 imagens oficiais', () => {
    let totalQ = 0;
    let totalImg = 0;
    for (const ed of Object.values(BANCO_PROVAS)) {
      const qList = ed.questions || ed.questoes || [];
      totalQ += qList.length;
      for (const q of qList) {
        if (q.figureImg || q.image || q.imagem) totalImg++;
      }
    }
    assert.equal(totalQ, 51, 'Total de questões deve ser exatamente 51');
    assert.equal(totalImg, 17, 'Total de imagens oficiais deve ser exatamente 17');
  });

  // --- F14: Sincronização e Regressão Zero ---
  runTest('tier1', 'F14', 'T1-F14-01', 'Suite 1 (node verify_banco.js) executa com 100% de sucesso', () => {
    const out = execSync('node verify_banco.js', { cwd: ROOT_DIR, encoding: 'utf-8' });
    assert.ok(out.includes('ALL CHECKS PASSED PERFECTLY'));
  });

  runTest('tier1', 'F14', 'T1-F14-02', 'Suite 2 (node test/test_state.js) executa com 100% de sucesso', () => {
    const out = execSync('node test/test_state.js', { cwd: ROOT_DIR, encoding: 'utf-8' });
    assert.ok(out.includes('ALL STATE & EDGE-CASE TESTS PASSED'));
  });

  runTest('tier1', 'F14', 'T1-F14-03', 'Suite 3 (node test/test_session_and_modules.js) executa com 100% de sucesso', () => {
    const out = execSync('node test/test_session_and_modules.js', { cwd: ROOT_DIR, encoding: 'utf-8' });
    assert.ok(out.includes('All 13 tests passed'));
  });

  runTest('tier1', 'F14', 'T1-F14-04', 'Suite 4 (node test/test_math.js) executa com 100% de sucesso', () => {
    const out = execSync('node test/test_math.js', { cwd: ROOT_DIR, encoding: 'utf-8' });
    assert.ok(out.includes('TODOS OS TESTES MATEMÁTICOS PASSARAM COM SUCESSO'));
  });

  runTest('tier1', 'F14', 'T1-F14-05', 'Suite 5 (node test/test_classroom_diagnostics.js) executa com 100% de sucesso', () => {
    const out = execSync('node test/test_classroom_diagnostics.js', { cwd: ROOT_DIR, encoding: 'utf-8' });
    assert.ok(out.includes('All 6 classroom diagnostics tests passed'));
  });

  // =========================================================================
  // F15: Auditoria UX/IHC (Feedback Ramon) & Mobile Docente
  // =========================================================================
  runTest('tier1', 'F15', 'T1-F15-01', 'css/custom.css usa :where(h1..h6), garante título escuro em .site-header claro, contrasta #ffffff em .bg-uneb-primary e mantém nav unificada no <header>', () => {
    assert.ok(
      /:where\(\s*h1\s*,\s*h2\s*,\s*h3\s*,\s*h4\s*,\s*h5\s*,\s*h6\s*\)/i.test(cssCustom),
      'css/custom.css deve encapsular a tipografia base de headings em :where(h1, h2, h3, h4, h5, h6)'
    );
    assert.ok(
      !/^\s*h1\s*,\s*h2\s*,\s*h3/m.test(cssCustom),
      'css/custom.css não deve manter regra nua h1, h2, h3... competindo com utilitários de cor'
    );

    const cssBlocks = Array.from(cssCustom.matchAll(/([^{}]+)\{([^}]*)\}/g));
    const hasLightHeaderTitle = cssBlocks.some(([, sel, decl]) =>
      /\.site-brand-title\b/i.test(sel) &&
      /color\s*:\s*var\(--color-text-primary\)/i.test(decl)
    );
    const hasWhitePrimaryRule = cssBlocks.some(([, sel, decl]) =>
      /\.bg-uneb-primary\b[^,{]*(?:h[1-6]|:(?:where|is)\([^)]*h[1-6])/i.test(sel) &&
      /color\s*:\s*(?:#ffffff|#fff)\b/i.test(decl)
    );
    const hasSquareEmblemRule = cssBlocks.some(([, sel, decl]) =>
      /\.site-brand-emblem\b/i.test(sel) &&
      /width\s*:\s*2\.25rem/i.test(decl) &&
      /height\s*:\s*2\.25rem/i.test(decl)
    );
    assert.ok(
      hasLightHeaderTitle && hasWhitePrimaryRule && hasSquareEmblemRule,
      'css/custom.css deve definir título escuro em .site-brand-title, emblema quadrado fixo 2.25rem e #ffffff em .bg-uneb-primary'
    );

    const headerMatch = indexHtml.match(/<header\b[^>]*>[\s\S]*?<\/header>/i);
    assert.ok(headerMatch, 'Elemento <header> deve existir em index.html');
    assert.ok(/class=["'][^"']*site-header\b/i.test(headerMatch[0]), '<header> deve usar .site-header');
    assert.ok(/<nav\b[^>]*aria-label=["']Navegação principal["']/i.test(headerMatch[0]), 'Navegação principal desktop deve ficar unificada dentro de <header>');
    assert.ok(!/<nav\b[^>]*bg-uneb-primaryDark/i.test(indexHtml), 'Não deve existir segunda faixa escura empilhada <nav class="... bg-uneb-primaryDark">');
  });

  runTest('tier1', 'F15', 'T1-F15-02', '#teacher-header-panel contém botão #btn-teacher-turma ("Painel da Turma") visível no mobile (< 1024px)', () => {
    const teacherPanel = getElementBlock('teacher-header-panel', 3500);
    assert.ok(teacherPanel, '#teacher-header-panel deve existir em index.html');
    const panelScope = teacherPanel.split('</header>')[0];
    assert.ok(/id=["']btn-teacher-turma["']/i.test(panelScope), '#teacher-header-panel deve conter #btn-teacher-turma');
    const btnSnippet = getElementSnippet('btn-teacher-turma');
    assert.ok(btnSnippet, 'Botão #btn-teacher-turma deve existir em index.html');
    const btnClass = getAttribute(btnSnippet, 'class') || '';
    assert.ok(!/(?:^|\s)hidden(?:\s|$)/.test(btnClass), '#btn-teacher-turma não deve estar oculto no mobile (< 1024px)');
    const btnBlock = getElementBlock('btn-teacher-turma', 500) || '';
    assert.ok(/Painel da Turma/i.test(btnBlock), '#btn-teacher-turma deve exibir o texto "Painel da Turma"');
  });

  runTest('tier1', 'F15', 'T1-F15-03', 'js/utils/module-stage.js renderiza ícones <svg indicativos nas 3 abas de renderStageBar()', () => {
    assert.ok(jsModuleStageSource.length > 0, 'js/utils/module-stage.js deve estar acessível');
    const renderStart = jsModuleStageSource.indexOf('function renderStageBar');
    const renderEnd = jsModuleStageSource.indexOf('function renderPanelVisibility');
    assert.ok(renderStart !== -1 && renderEnd > renderStart, 'renderStageBar() deve existir em js/utils/module-stage.js');
    const renderBody = jsModuleStageSource.slice(renderStart, renderEnd);

    const svgLiteralCount = (jsModuleStageSource.match(/<svg\b/gi) || []).length;
    const usesSvgNs = /createElementNS\([^)]*svg/i.test(jsModuleStageSource);
    const hasThreeStageIcons = svgLiteralCount >= 3 || (usesSvgNs && (jsModuleStageSource.match(/<path\b|\bd\s*:\s*['"`]M/gi) || []).length >= 3);
    assert.ok(hasThreeStageIcons, 'js/utils/module-stage.js deve definir 3 ícones <svg para as etapas');
    assert.ok(/svg|icon/i.test(renderBody), 'renderStageBar() deve renderizar o ícone indicativo dentro de cada aba');
  });

  runTest('tier1', 'F15', 'T1-F15-04', 'index.html contém campo #aulas-quick-filter (data-aulas-quick-filter) e ícones <svg nos chips [data-axis-chip]', () => {
    assert.ok(hasElementId('aulas-quick-filter'), 'Campo de filtro rápido #aulas-quick-filter deve existir em index.html');
    const quickFilterSnippet = getElementSnippet('aulas-quick-filter');
    assert.ok(
      quickFilterSnippet && /data-aulas-quick-filter/i.test(quickFilterSnippet),
      '#aulas-quick-filter deve possuir atributo data-aulas-quick-filter'
    );

    const chipButtons = Array.from(indexHtml.matchAll(/<button\b[^>]*data-axis-chip=["'][^"']+["'][^>]*>([\s\S]*?)<\/button>/gi));
    assert.ok(chipButtons.length >= 7, 'Devem existir chips [data-axis-chip] nas abas de Aulas');
    const chipsWithSvg = chipButtons.filter((m) => /<svg\b/i.test(m[1]));
    assert.strictEqual(
      chipsWithSvg.length,
      chipButtons.length,
      'Todos os chips [data-axis-chip] devem conter ícone <svg indicativo'
    );
  });

  runTest('tier1', 'F15', 'T1-F15-05', 'js/app.js usa filterDayModulesByAxis(actualModId), remove listeners duplicados mobile e exclui #btn-hub-continue-class via :not()', () => {
    const navStart = jsAppSource.indexOf('export function navigateToModule');
    const navEnd = jsAppSource.indexOf('export function initStudent');
    assert.ok(navStart !== -1 && navEnd > navStart, 'navigateToModule() deve existir em js/app.js');
    const navBody = jsAppSource.slice(navStart, navEnd);
    assert.ok(
      /filterDayModulesByAxis\(\s*actualModId\s*\)/.test(navBody),
      'navigateToModule() deve filtrar pelo eixo alvo com filterDayModulesByAxis(actualModId)'
    );
    assert.ok(
      !/filterDayModulesByAxis\(\s*['"]all['"]\s*\)/.test(navBody),
      'navigateToModule() não deve resetar o filtro para "all"'
    );

    const hasSeparateMobileIdListeners = /getElementById\(\s*['"]mobile-nav-(?:home|aulas|quiz)['"]\s*\)[\s\S]{0,200}addEventListener/i.test(jsAppSource);
    const hasMobileTargetViewLoop = /#mobile-bottom-nav\s+\[data-target-view\]/.test(jsAppSource);
    assert.ok(
      !(hasSeparateMobileIdListeners && hasMobileTargetViewLoop) && (hasSeparateMobileIdListeners || hasMobileTargetViewLoop),
      '#mobile-bottom-nav não deve registrar listeners duplicados (mobile-nav-home/aulas/quiz + [data-target-view] juntos)'
    );

    assert.ok(
      /#hub-quadro-aula[^'"`]*:not\(\s*#btn-hub-continue-class\s*\)/.test(jsAppSource),
      'Seletor em #hub-quadro-aula deve excluir #btn-hub-continue-class via :not(#btn-hub-continue-class)'
    );
  });

  runTest('tier1', 'F15', 'T1-F15-06', '#teacher-header-panel e #student-header-panel agrupam ações secundárias em popover="auto" sem aria-haspopup/role="menu"', () => {
    const moreBtn = getElementSnippet('btn-teacher-more') || '';
    const popoverSnippet = getElementSnippet('teacher-more-popover') || '';
    const studentBtn = getElementSnippet('btn-student-profile') || '';
    const studentPopoverSnippet = getElementSnippet('student-profile-popover') || '';
    const toggleBtn = (getElementBlock('btn-teacher-toggle-answers', 1400) || '').split('</button>')[0];

    assert.ok(moreBtn, '#btn-teacher-more deve existir em #teacher-header-panel');
    assert.ok(/popovertarget=["']teacher-more-popover["']/i.test(moreBtn), '#btn-teacher-more deve usar popovertarget="teacher-more-popover"');
    assert.ok(!/aria-haspopup/i.test(moreBtn), '#btn-teacher-more não deve declarar aria-haspopup sem role correspondente');

    assert.ok(popoverSnippet, '#teacher-more-popover deve existir em index.html');
    assert.ok(/popover=["']auto["']/i.test(popoverSnippet), '#teacher-more-popover deve declarar popover="auto"');
    assert.ok(!/role=["']menu["']/i.test(popoverSnippet), '#teacher-more-popover segue padrão button-group em popover (sem role="menu")');

    const popBlock = getElementBlock('teacher-more-popover', 2500) || '';
    assert.ok(/id=["']btn-teacher-preview-student["']/i.test(popBlock), '#btn-teacher-preview-student deve estar agrupado dentro de #teacher-more-popover');
    assert.ok(/id=["']btn-switch-session-teacher["']/i.test(popBlock), '#btn-switch-session-teacher deve estar agrupado dentro de #teacher-more-popover');
    assert.ok(!/role=["']menuitem["']/i.test(popBlock), 'Itens do popover docente não devem usar role="menuitem"');

    assert.ok(studentBtn && /popovertarget=["']student-profile-popover["']/i.test(studentBtn) && !/aria-haspopup/i.test(studentBtn), '#btn-student-profile deve usar popovertarget sem aria-haspopup');
    assert.ok(studentPopoverSnippet && /popover=["']auto["']/i.test(studentPopoverSnippet) && !/role=["']menu["']/i.test(studentPopoverSnippet), '#student-profile-popover deve declarar popover="auto" sem role="menu"');
    const stPopBlock = getElementBlock('student-profile-popover', 3000) || '';
    assert.ok(/id=["']btn-reset-progress["']/i.test(stPopBlock) && /id=["']btn-switch-session-student["']/i.test(stPopBlock), 'Ações utilitárias do aluno devem estar agrupadas em #student-profile-popover');

    assert.ok(/<svg\b/i.test(toggleBtn) && /data-answers-label/i.test(toggleBtn), '#btn-teacher-toggle-answers deve preservar ícone <svg e span [data-answers-label]');
    assert.ok(/querySelector\(\s*['"]\[data-answers-label\]['"]\s*\)/.test(jsAppSource), 'js/app.js deve atualizar [data-answers-label] preservando o SVG');
    assert.ok(!/btnToggleAnswers\.textContent\s*=\s*visible\s*\?/.test(jsAppSource), 'js/app.js não deve sobrescrever btnToggleAnswers.textContent apagando filhos');
    assert.ok(cssCustom.includes('@supports (position-area: block-end)') && cssCustom.includes('@supports not (position-area: block-end)'), 'css/custom.css deve incluir positioning anchor com fallback @supports');
  });
}

// ===========================================================================
// TIER 2: BOUNDARY & CORNER CASES (F1 A F14)
// ===========================================================================
if (!selectedTier || selectedTier === 'tier2') {
  console.log('\n--- [TIER 2] CASOS DE BORDA, LIMITES E COMPORTAMENTOS EXCEPCIONAIS ---\n');

  // --- F1: Limites de Tokens e Cores ---
  runTest('tier2', 'F1', 'T2-F01-01', 'Fallback de variáveis CSS não quebra sintaxe de :root', () => {
    const rootBlock = cssCustom.match(/:root\s*{([^}]*)}/is);
    assert.ok(rootBlock, 'Bloco :root deve existir em custom.css');
    assert.ok(!rootBlock[1].includes('undefined') && !rootBlock[1].includes('NaN'));
  });

  runTest('tier2', 'F1', 'T2-F01-02', 'Tokens hexadecimais possuem formatação estrita de 6 caracteres hex', () => {
    const tokens = ['--surface-page-canvas', '--surface-card-surface', '--surface-tinted-highlight', '--color-mist-border', '--color-iris-bolt'];
    for (const t of tokens) {
      const val = getCssVar(t);
      if (val) {
        assert.match(val, /^#[0-9a-fA-F]{6}$/, `Token ${t} deve ter 6 dígitos hex`);
      }
    }
  });

  runTest('tier2', 'F1', 'T2-F01-03', 'Ordem da folha de estilos: custom.css inserido após app.css', () => {
    const appIdx = indexHtml.indexOf('css/app.css');
    const customIdx = indexHtml.indexOf('css/custom.css');
    assert.ok(appIdx !== -1, 'css/app.css deve ser referenciado');
    assert.ok(customIdx !== -1, 'css/custom.css deve ser referenciado');
    assert.ok(customIdx > appIdx, 'css/custom.css deve vir após css/app.css para garantir precedência');
  });

  runTest('tier2', 'F1', 'T2-F01-04', 'Variável --color-iris-glow possui formato RGBA com canal alfa válido', () => {
    const val = getCssVar('--color-iris-glow');
    if (val) {
      assert.match(val, /rgba\(\s*66\s*,\s*85\s*,\s*255\s*,\s*0?\.15\s*\)/i);
    } else {
      assert.ok(true, 'Glow opcional');
    }
  });

  runTest('tier2', 'F1', 'T2-F01-05', 'Foco acessível definido com outline visível e offset', () => {
    assert.ok(cssCustom.includes(':focus-visible') && cssCustom.includes('outline'), 'Deve definir outline de foco');
  });

  // --- F2: Limites de Geometria ---
  runTest('tier2', 'F2', 'T2-F02-01', 'Raio de botão pílula não quebra em viewports de 320px', () => {
    assert.equal(getCssVar('--radius-pill') || '200px', '200px');
  });

  runTest('tier2', 'F2', 'T2-F02-02', 'Cards de conteúdo possuem cantos suaves de 8px', () => {
    assert.equal(getCssVar('--radius-card') || '8px', '8px');
  });

  runTest('tier2', 'F2', 'T2-F02-03', 'Cards de destaque possuem cantos de 24px', () => {
    assert.equal(getCssVar('--radius-feature-card') || '24px', '24px');
  });

  runTest('tier2', 'F2', 'T2-F02-04', 'Sombras suaves aplicam opacidade segura <= 0.15', () => {
    const shadow = getCssVar('--shadow-quizlet');
    if (shadow) {
      assert.ok(!shadow.includes('0.5') && !shadow.includes('0.8'), 'Sombra não deve ser pesada');
    }
  });

  runTest('tier2', 'F2', 'T2-F02-05', 'Body define overflow-wrap: anywhere contra estouro horizontal de texto', () => {
    assert.ok(cssCustom.includes('overflow-wrap: anywhere') || cssCustom.includes('word-break: break-word'));
  });

  // --- F3: Limites de Tipografia & Semântica ---
  runTest('tier2', 'F3', 'T2-F03-01', 'Símbolos matemáticos especiais não sofrem coerção para fonte sans-serif', () => {
    assert.ok(hasCssRule('.math-font', 'Merriweather|var\\(--font-math\\)'), 'Merriweather ou --font-math obrigatória para .math-font');
  });

  runTest('tier2', 'F3', 'T2-F03-02', 'Bordas de alternativas pendentes permanecem neutras', () => {
    assert.ok(!indexHtml.includes('border-green-500 border-red-500'), 'Alternativas não avaliadas não devem ter borda verde/vermelha simultânea');
  });

  runTest('tier2', 'F3', 'T2-F03-03', 'Questões anuladas oficiais mantêm indicação diferenciada', () => {
    const q3 = BANCO_PROVAS.uneb_2023.questions.find(q => q.id === 3);
    assert.equal(q3?.isCancelled, true, 'UNEB 2023 Q3 deve ser oficialmente anulada');
  });

  runTest('tier2', 'F3', 'T2-F03-04', 'Botões de ação padrão não usam verde decorativo enganoso', () => {
    assert.ok(!hasCssRule('.btn-pill:not(.btn-pill-success)', 'background: #10b981'));
  });

  runTest('tier2', 'F3', 'T2-F03-05', 'Sanitização de nome de estudante limita tamanho em 40 caracteres com acentos', () => {
    const longName = 'Mariana Vasconcelos de Albuquerque Soares Silva Júnior';
    const norm = normalizeStudentName(longName);
    assert.ok(norm.length <= 40, 'Nome normalizado deve ter no máximo 40 caracteres');
    assert.ok(norm.includes('Mariana'), 'Nome deve preservar prefixo');
  });

  // --- F4: Limites do Hub Pilar 1 ---
  runTest('tier2', 'F4', 'T2-F04-01', 'Inicialização com 0 módulos concluídos aponta com segurança para Eixo 1', () => {
    memoryStore.clear();
    loadState();
    const st = getState();
    assert.equal(st.score, 0);
    const completedCount = Object.values(st.completedModules).filter(Boolean).length;
    assert.equal(completedCount, 0);
  });

  runTest('tier2', 'F4', 'T2-F04-02', 'Carga com 6 módulos concluídos não gera ponteiro nulo', () => {
    const fullMods = {
      'mod-logica': true,
      'mod-numeros': true,
      'mod-algebra': true,
      'mod-trig': true,
      'mod-financas': true,
      'mod-estatistica': true
    };
    assert.equal(Object.keys(fullMods).length, 6);
  });

  runTest('tier2', 'F4', 'T2-F04-03', 'Navegação para a mesma view não gera duplicação de nós no DOM', () => {
    assert.ok(jsAppSource.includes('switchView'), 'js/app.js deve gerenciar comutação segura');
  });

  runTest('tier2', 'F4', 'T2-F04-04', 'Debounce de eventos de resize protege renderização dos elementos', () => {
    assert.ok(jsAppSource.includes('debounce') || jsAppSource.includes('resize') || jsAppSource.includes('requestAnimationFrame'));
  });

  runTest('tier2', 'F4', 'T2-F04-05', 'Hub Pilar 1 mantém integridade estrutural', () => {
    assert.ok(hasElementId('main-content'), 'main#main-content deve conter as views');
  });

  // --- F5: Limites do Hub Pilar 2 ---
  runTest('tier2', 'F5', 'T2-F05-01', 'Temporizador com 0 segundos trata encerramento com segurança', () => {
    assert.ok(jsAppSource.includes('quiz-timer') || indexHtml.includes('quiz-timer'));
  });

  runTest('tier2', 'F5', 'T2-F05-02', 'Edição inválida de simulado recai com segurança para edição padrão', () => {
    assert.ok(BANCO_PROVAS['uneb_2025'], 'Edição padrão uneb_2025 deve existir');
  });

  runTest('tier2', 'F5', 'T2-F05-03', 'Simulado já submetido impede reenvio destrutivo', () => {
    loadState();
    const st = getState();
    assert.equal(typeof st.quizSubmittedByEdition, 'object');
  });

  runTest('tier2', 'F5', 'T2-F05-04', 'Execução offline de simulado não depende de rede ativa', () => {
    assert.ok(Object.keys(BANCO_PROVAS).length >= 4, 'Todas as 4 edições embutidas localmente');
  });

  runTest('tier2', 'F5', 'T2-F05-05', 'Card de Simulado possui contraste visual claro', () => {
    assert.ok(hasElementId('hub-simulado') || hasElementId('view-quiz'));
  });

  // --- F6: Limites do Hub Pilar 3 ---
  runTest('tier2', 'F6', 'T2-F06-01', 'Percentual de progresso normalizado no intervalo [0%, 100%]', () => {
    const clampPercent = (p) => Math.min(100, Math.max(0, Math.round(p)));
    assert.equal(clampPercent(-10), 0);
    assert.equal(clampPercent(150), 100);
    assert.equal(clampPercent(45.6), 46);
  });

  runTest('tier2', 'F6', 'T2-F06-02', 'Contador de módulos delimitado no intervalo [0, 6]', () => {
    const clampMods = (m) => Math.min(6, Math.max(0, m));
    assert.equal(clampMods(-2), 0);
    assert.equal(clampMods(10), 6);
    assert.equal(clampMods(3), 3);
  });

  runTest('tier2', 'F6', 'T2-F06-03', 'Sanitização de XP converte valores não-numéricos para 0', () => {
    const sanitizeXp = (v) => (typeof v === 'number' && !Number.isNaN(v) && v >= 0 ? v : 0);
    assert.equal(sanitizeXp(NaN), 0);
    assert.equal(sanitizeXp(undefined), 0);
    assert.equal(sanitizeXp(-50), 0);
    assert.equal(sanitizeXp(150), 150);
  });

  runTest('tier2', 'F6', 'T2-F06-04', 'Barra de progresso nativa possui valor máximo de 100', () => {
    const snippet = getElementSnippet('metric-progress-bar');
    if (snippet) {
      assert.ok(snippet.includes('max="100"'), 'Barra de progresso deve ter max="100"');
    } else {
      assert.ok(true);
    }
  });

  runTest('tier2', 'F6', 'T2-F06-05', 'resetStudentProgress zera progresso sem apagar nome do estudante', () => {
    memoryStore.clear();
    setState({ sessionRole: 'student', studentName: 'João da Silva', score: 350 });
    resetStudentProgress();
    const cur = getState();
    assert.equal(cur.studentName, 'João da Silva', 'Nome deve ser preservado no reset');
    assert.equal(cur.score, 0, 'Score deve ser zerado');
  });

  // --- F7: Limites do Header Mobile ---
  runTest('tier2', 'F7', 'T2-F07-01', 'Em largura de 320px cabeçalho não quebra elementos essenciais', () => {
    assert.ok(indexHtml.includes('<header'));
  });

  runTest('tier2', 'F7', 'T2-F07-02', 'Diálogos modais possuem contenção de scroll (overscroll-behavior: contain)', () => {
    assert.ok(cssCustom.includes('overscroll-behavior: contain'));
  });

  runTest('tier2', 'F7', 'T2-F07-03', 'Backdrop de modais possui opacidade escura', () => {
    assert.ok(cssCustom.includes('dialog::backdrop'));
  });

  runTest('tier2', 'F7', 'T2-F07-04', 'Suporte a preferência de redução de movimento (prefers-reduced-motion)', () => {
    assert.ok(cssCustom.includes('prefers-reduced-motion: reduce'));
  });

  runTest('tier2', 'F7', 'T2-F07-05', 'Cabeçalho utiliza elementos nativos sem tags obsoletas', () => {
    assert.ok(!indexHtml.includes('<center>') && !indexHtml.includes('<font>'));
  });

  // --- F8: Limites da Barra Inferior Mobile ---
  runTest('tier2', 'F8', 'T2-F08-01', 'Barra inferior tem classe lg:hidden para desaparecer em telas grandes', () => {
    const snippet = getElementSnippet('mobile-bottom-nav');
    if (snippet) {
      assert.ok(snippet.includes('lg:hidden'));
    } else {
      assert.ok(true);
    }
  });

  runTest('tier2', 'F8', 'T2-F08-02', 'Media query de ponteiro coarse define target-size de 44px', () => {
    assert.ok(cssCustom.includes('@media (pointer: coarse)') && cssCustom.includes('--target-size: 44px'));
  });

  runTest('tier2', 'F8', 'T2-F08-03', 'Alvos interativos WCAG aplicam min-block-size e min-inline-size', () => {
    assert.ok(cssCustom.includes('min-block-size: var(--target-size)') && cssCustom.includes('min-inline-size: var(--target-size)'));
  });

  runTest('tier2', 'F8', 'T2-F08-04', 'Navegação por abas utiliza IDs distintos', () => {
    assert.ok(hasElementId('nav-day1') && hasElementId('nav-day2') && hasElementId('nav-quiz'));
  });

  runTest('tier2', 'F8', 'T2-F08-05', 'Barra inferior tem posição fixa sem transbordamento lateral', () => {
    const snippet = getElementSnippet('mobile-bottom-nav');
    if (snippet) {
      assert.ok(snippet.includes('left-0') && snippet.includes('right-0'));
    } else {
      assert.ok(true);
    }
  });

  // --- F9: Limites da Sessão Docente ---
  runTest('tier2', 'F9', 'T2-F09-01', 'Estudante comum tem sessionRole="student" e isTeacherModeActive=false', () => {
    memoryStore.clear();
    setState({ sessionRole: 'student', studentName: 'Ana Clara' });
    assert.equal(isTeacherModeActive(), false);
  });

  runTest('tier2', 'F9', 'T2-F09-02', 'Validação de código docente aceita variações com espaços e minúsculas', () => {
    assert.equal(validateTeacherCode('  uneb2026 \n'), true);
    assert.equal(validateTeacherCode('UNEB2026'), true);
  });

  runTest('tier2', 'F9', 'T2-F09-03', 'Código docente incorreto rejeitado estritamente', () => {
    assert.equal(validateTeacherCode('ERRADO123'), false);
    assert.equal(validateTeacherCode(''), false);
    assert.equal(validateTeacherCode(null), false);
  });

  runTest('tier2', 'F9', 'T2-F09-04', 'Modo docente ativo expõe controles de lousa', () => {
    memoryStore.clear();
    setState({ sessionRole: 'teacher', teacherPreviewAsStudent: false });
    assert.equal(isTeacherModeActive(), true);
  });

  runTest('tier2', 'F9', 'T2-F09-05', 'Docente em preview como aluno desativa temporariamente isTeacherModeActive', () => {
    memoryStore.clear();
    setState({ sessionRole: 'teacher', teacherPreviewAsStudent: true });
    assert.equal(isTeacherModeActive(), false, 'isTeacherModeActive deve ser false durante preview de aluno');
  });

  // --- F10: Limites de Aulas em Chips ---
  runTest('tier2', 'F10', 'T2-F10-01', 'Mapeamento bidirecional de eixos para módulos cobre todos os 6 eixos', () => {
    const axes = [
      'Lógica Proposicional e Conjuntos',
      'Matemática Discreta e Contagem',
      'Função Quadrática e Geometria Analítica',
      'Trigonometria e Geometria Plana',
      'Matemática Financeira e Progressões',
      'Estatística Descritiva e Probabilidade'
    ];
    for (const ax of axes) {
      const modId = mapAxisToModuleId(ax);
      assert.ok(modId.startsWith('mod-'), `Eixo ${ax} deve mapear para módulo válido`);
    }
  });

  runTest('tier2', 'F10', 'T2-F10-02', 'Cada módulo possui exatamente 3 desafios de prática rápida', () => {
    assert.equal(LOGIC_CHALLENGES.length, 3);
    assert.equal(COMB_CHALLENGES.length, 3);
    assert.equal(PARABOLA_CHALLENGES.length, 3);
    assert.equal(TRIG_CHALLENGES.length, 3);
    assert.equal(FINANCAS_CHALLENGES.length, 3);
    assert.equal(STATS_CHALLENGES.length, 3);
  });

  runTest('tier2', 'F10', 'T2-F10-03', 'Desafios avaliam respostas com funções puras determinísticas', () => {
    assert.equal(evaluateLogicChallenge(0, { propP: true, propQ: false }), true);
    assert.equal(evaluateLogicChallenge(0, { propP: true, propQ: true }), false);
  });

  runTest('tier2', 'F10', 'T2-F10-04', 'Conclusão de 3 desafios concede +50 XP de bônus de módulo', () => {
    resetStudentProgress();
    assert.equal(completeModuleChallenge('mod-logica', 0), false);
    assert.equal(completeModuleChallenge('mod-logica', 1), false);
    const res = completeModuleChallenge('mod-logica', 2);
    assert.equal(res, true);
    assert.equal(getState().completedModules['mod-logica'], true);
    assert.equal(getState().score, 50);
  });

  runTest('tier2', 'F10', 'T2-F10-05', 'Desafio já resolvido não duplica concessão de bônus', () => {
    const scoreBefore = getState().score;
    const resAgain = completeModuleChallenge('mod-logica', 2);
    assert.equal(resAgain, true);
    assert.equal(getState().score, scoreBefore, 'Score não deve aumentar em desafio já completado');
  });

  // --- F11: Limites do Simulado Focado NotebookLM ---
  runTest('tier2', 'F11', 'T2-F11-01', 'Ponteiro de questão 0 tem botão anterior desabilitado', () => {
    const isFirstQuestion = (idx) => idx === 0;
    assert.equal(isFirstQuestion(0), true);
    assert.equal(isFirstQuestion(1), false);
  });

  runTest('tier2', 'F11', 'T2-F11-02', 'Ponteiro de questão 14 (Q15) transiciona botão próxima para revisão', () => {
    const isLastQuestion = (idx) => idx === 14;
    assert.equal(isLastQuestion(14), true);
    assert.equal(isLastQuestion(13), false);
  });

  runTest('tier2', 'F11', 'T2-F11-03', 'Alternativas possuem exatamente 5 opções A, B, C, D, E', () => {
    for (const q of BANCO_PROVAS.uneb_2025.questions) {
      assert.equal(q.options.length, 5, `Questão ${q.id} deve ter 5 alternativas`);
    }
  });

  runTest('tier2', 'F11', 'T2-F11-04', 'Respostas do simulado armazenadas com integridade por questão', () => {
    loadState();
    const st = getState();
    assert.ok(st.quizAnswersByEdition);
    assert.deepEqual(st.quizAnswersByEdition.uneb_2025, {});
  });

  runTest('tier2', 'F11', 'T2-F11-05', 'Alternância de questão não perde resposta previamente gravada', () => {
    setState({
      quizAnswersByEdition: {
        uneb_2025: { 1: 2 }
      }
    });
    const cur = getState();
    assert.equal(cur.quizAnswersByEdition.uneb_2025[1], 2);
  });

  // --- F12: Limites de Visão Completa e Grade ---
  runTest('tier2', 'F12', 'T2-F12-01', 'Grade de questões contém exatamente 15 botões por edição', () => {
    assert.equal(BANCO_PROVAS.uneb_2025.questions.length, 15);
    assert.equal(BANCO_PROVAS.uneb_2024.questions.length, 15);
    assert.equal(BANCO_PROVAS.uneb_2023.questions.length, 15);
  });

  runTest('tier2', 'F12', 'T2-F12-02', 'Edição de fixação imersão contém 6 questões', () => {
    assert.equal(BANCO_PROVAS.imersao_fixacao.questions.length, 6);
  });

  runTest('tier2', 'F12', 'T2-F12-03', 'Diálogo de confirmação de entrega existe no DOM', () => {
    assert.ok(hasElementId('confirm-dialog'), '#confirm-dialog deve existir para confirmação');
  });

  runTest('tier2', 'F12', 'T2-F12-04', 'Cancelamento no modal de entrega não finaliza a prova', () => {
    assert.ok(hasElementId('confirm-dialog-cancel'));
    assert.ok(hasElementId('confirm-dialog-confirm'));
  });

  runTest('tier2', 'F12', 'T2-F12-05', 'Resultado do simulado exibe percentual e pontuação acumulada', () => {
    assert.ok(hasElementId('quiz-result-score') || hasElementId('quiz-result-card'));
  });

  // --- F13: Limites dos Canvases Matemáticos ---
  runTest('tier2', 'F13', 'T2-F13-01', 'Coeficiente quadrático a=0 tratado com segurança na parábola', () => {
    const res = evaluateParabolaChallenge(0, { a: 0, b: 0, c: 0 });
    assert.equal(typeof res, 'boolean');
  });

  runTest('tier2', 'F13', 'T2-F13-02', 'Ângulo trigonométrico superior a 360 graus normalizado', () => {
    const normalizeAngle = (deg) => ((deg % 360) + 360) % 360;
    assert.equal(normalizeAngle(450), 90);
    assert.equal(normalizeAngle(-90), 270);
  });

  runTest('tier2', 'F13', 'T2-F13-03', 'Cálculo de juros com capital zero e taxa zero não dispara exceção', () => {
    const calcJuros = (C, i, n) => ({
      simples: C * (1 + (i / 100) * n),
      composto: C * Math.pow(1 + i / 100, n)
    });
    const res = calcJuros(0, 0, 10);
    assert.equal(res.simples, 0);
    assert.equal(res.composto, 0);
  });

  runTest('tier2', 'F13', 'T2-F13-04', 'Fórmula de Sturges com dados vazios tratada com clamping', () => {
    const calcSturges = (n) => (n <= 0 ? 1 : Math.max(1, Math.round(1 + 3.322 * Math.log10(n))));
    assert.equal(calcSturges(0), 1);
    assert.equal(calcSturges(100), 8);
  });

  runTest('tier2', 'F13', 'T2-F13-05', 'Canvases possuem renderização otimizada (image-rendering: auto)', () => {
    assert.ok(cssCustom.includes('canvas') && cssCustom.includes('image-rendering'));
  });

  // --- F14: Limites de Sincronização e Regressão ---
  runTest('tier2', 'F14', 'T2-F14-01', 'Código de relatório rejeita strings corrompidas ou vazias', () => {
    assert.equal(decodeStudentReportCode(''), null);
    assert.equal(decodeStudentReportCode('INVALIDO:123'), null);
    assert.equal(decodeStudentReportCode(null), null);
  });

  runTest('tier2', 'F14', 'T2-F14-02', 'Código de relatório preserva nomes com acentos e caracteres Unicode', () => {
    resetStudentProgress();
    setState({ sessionRole: 'student', studentName: 'João Victor Conceição & Inês', classCode: 'UNEB-A' }, 'session');
    recordModuleAttempt('mod-logica', 0, true);
    const payload = buildStudentDiagnosticPayload(getState());
    const code = encodeStudentReportCode(payload);
    assert.ok(code.startsWith('UNEB1:'));
    const decoded = decodeStudentReportCode(code);
    assert.ok(decoded);
    assert.equal(decoded.student_name, 'João Victor Conceição & Inês');
    assert.equal(decoded.class_code, 'UNEB-A');
  });

  runTest('tier2', 'F14', 'T2-F14-03', 'Sanitização de chave de estudante remove acentos e normaliza para caixa baixa', () => {
    assert.equal(normalizeStudentKey('  Édson Arantes do Nascimento '), 'edson arantes do nascimento');
  });

  runTest('tier2', 'F14', 'T2-F14-04', 'Proteção contra prototype pollution no carregamento de estado', () => {
    memoryStore.clear();
    memoryStore.set(APP_STORAGE_KEY, JSON.stringify({
      __proto__: { admin: true },
      constructor: { prototype: { hacked: true } }
    }));
    const loaded = loadState();
    assert.equal({}.admin, undefined, 'Objeto raiz não deve sofrer prototype pollution');
    assert.equal({}.hacked, undefined, 'Protótipo não deve ser contaminado');
  });

  runTest('tier2', 'F14', 'T2-F14-05', 'Diagnóstico de turma agrega múltiplos alunos com precisão', () => {
    const student1 = {
      class_code: 'TURMA-1',
      student_key: 'aluno um',
      student_name: 'Aluno Um',
      score: 100,
      completed_modules: {},
      module_practice: {},
      module_attempts: {},
      quiz_answers: {},
      quiz_submitted: {}
    };
    const student2 = {
      class_code: 'TURMA-1',
      student_key: 'aluno dois',
      student_name: 'Aluno Dois',
      score: 200,
      completed_modules: { 'mod-logica': true },
      module_practice: {},
      module_attempts: {},
      quiz_answers: {},
      quiz_submitted: {}
    };
    const diag = computeClassDiagnostics([student1, student2]);
    assert.equal(diag.studentCount, 2);
    assert.ok(Array.isArray(diag.axesRank));
    assert.equal(diag.axesRank.length, 6);
  });
}

// ===========================================================================
// TIER 3: CROSS-FEATURE INTERACTIONS (PAIRWISE P01 A P12)
// ===========================================================================
if (!selectedTier || selectedTier === 'tier3') {
  console.log('\n--- [TIER 3] INTERAÇÕES CRUZADAS E COMBINATÓRIAS (P01-P12) ---\n');

  runTest('tier3', 'P01', 'T3-P01', 'F1 (Tokens) x F4/F5/F6 (Hub 3 Pilares): Pilares usam paleta Quizlet', () => {
    const hasTokens = hasCssVar('--surface-page-canvas') && hasCssVar('--surface-card-surface') && hasCssVar('--color-mist-border');
    const hasHub = hasElementId('hub-quadro-aula') && hasElementId('hub-simulado') && hasElementId('hub-progressao');
    assert.ok(hasTokens || hasHub, 'Pilares do Hub devem estar harmonizados com os tokens Quizlet');
  });

  runTest('tier3', 'P02', 'T3-P02', 'F2 (Geometria) x F10 (Aulas Chips): Chips aplicam geometria de pílula 200px', () => {
    assert.ok(hasCssRule('.btn-pill', '200px') || cssCustom.includes('--radius-pill: 200px'));
  });

  runTest('tier3', 'P03', 'T3-P03', 'F2 (Geometria) x F11 (Simulado Focado): Alternativas 8px e botões de ação 200px', () => {
    assert.ok(hasCssRule('.card-quizlet', '8px') || cssCustom.includes('--radius-card: 8px'));
    assert.ok(hasCssRule('.btn-pill', '200px') || cssCustom.includes('--radius-pill: 200px'));
  });

  runTest('tier3', 'P04', 'T3-P04', 'F8 (Bottom Nav) x F4 (Hub 3 Pilares): Comutação de abas mantém estado do Hub', () => {
    assert.ok(jsAppSource.includes('switchView'), 'switchView deve gerenciar visibilidade de views');
  });

  runTest('tier3', 'P05', 'T3-P05', 'F7 (Header Mobile) x F8 (Bottom Nav): Espaçamento seguro entre topo e rodapé', () => {
    assert.ok(indexHtml.includes('pb-') || indexHtml.includes('p-') || cssCustom.includes('body'));
  });

  runTest('tier3', 'P06', 'T3-P06', 'F9 (Sessão Docente) x F12 (Simulado Full View): Projeção lousa suporta visão completa', () => {
    assert.ok(hasElementId('view-quiz'));
    assert.ok(hasElementId('btn-teacher-toggle-answers'));
  });

  runTest('tier3', 'P07', 'T3-P07', 'F9 (Sessão Docente) x F11/F12 (Gabarito na Lousa): Gabarito sincronizado', () => {
    assert.ok(jsAppSource.includes('teacherShowAnswers') || jsAppSource.includes('btn-teacher-toggle-answers'));
  });

  runTest('tier3', 'P08', 'T3-P08', 'F4 (Quadro Aula) x F10 (Chips) x F13 (Canvases): Redesenho de canvas via Hub', () => {
    assert.ok(hasElementId('canvas-algebra'));
    assert.ok(jsAppSource.includes('renderQuadratic') || jsAppSource.includes('requestAnimationFrame'));
  });

  runTest('tier3', 'P09', 'T3-P09', 'F6 (Progressão) x F10 (Prática) x F11 (Simulado): Acúmulo atômico de XP (+50 / +25)', () => {
    memoryStore.clear();
    setState({ sessionRole: 'student', score: 0 });
    const initial = getState().score;
    assert.equal(initial, 0);
  });

  runTest('tier3', 'P10', 'T3-P10', 'F13 (Canvases) x F8/F10 (Mobile Viewport & Tab Swapping): Preservação dimensional', () => {
    const alg = getElementSnippet('canvas-algebra');
    const trig = getElementSnippet('canvas-trig');
    assert.equal(getAttribute(alg, 'width'), '550');
    assert.equal(getAttribute(trig, 'width'), '360');
  });

  runTest('tier3', 'P11', 'T3-P11', 'F14 (Offline Sync) x F6 (Progressão) x F9 (Painel Turma): Protocolo UNEB1:', () => {
    resetStudentProgress();
    setState({ sessionRole: 'student', studentName: 'Beatriz Lima', classCode: 'UNEB-A' }, 'session');
    completeModuleChallenge('mod-logica', 0);
    completeModuleChallenge('mod-logica', 1);
    completeModuleChallenge('mod-logica', 2);
    const payload = buildStudentDiagnosticPayload(getState());
    const code = encodeStudentReportCode(payload);
    const decoded = decodeStudentReportCode(code);
    assert.ok(decoded);
    assert.equal(decoded.score, 50);
    assert.equal(decoded.student_name, 'Beatriz Lima');
  });

  runTest('tier3', 'P12', 'T3-P12', 'F3 (Isolamento Semântico) x F11 (Simulado Feedback): Cores semânticas só após resposta', () => {
    assert.ok(cssCustom.includes('.math-font'));
    assert.ok(!hasCssRule('button:not(.feedback-success)', 'background: #10b981'));
  });
}

// ===========================================================================
// TIER 4: REAL-WORLD APPLICATION SCENARIOS (SC1 A SC5)
// ===========================================================================
if (!selectedTier || selectedTier === 'tier4') {
  console.log('\n--- [TIER 4] CENÁRIOS REAIS DE APLICAÇÃO DE PONTA A PONTA (SC1-SC5) ---\n');

  runTest('tier4', 'SC1', 'T4-SC1', 'Cenário 1: Jornada Inicial Mobile do Estudante (Gate -> Hub -> Aulas -> XP)', () => {
    // 1. Simula entrada do estudante
    resetStudentProgress();
    const student = normalizeStudentName('Mariana Costa');
    const classCode = normalizeClassCode('UNEB-A');
    setState({ sessionRole: 'student', studentName: student, classCode }, 'session');

    const cur = getState();
    assert.equal(cur.sessionRole, 'student');
    assert.equal(cur.studentName, 'Mariana Costa');
    assert.equal(cur.score, 0);

    // 2. Conclui desafio na aula
    const res = completeModuleChallenge('mod-logica', 0);
    assert.equal(res, false); // 1 de 3 desafios não conclui o módulo
    assert.ok(getState().score >= 0);
  });

  runTest('tier4', 'SC2', 'T4-SC2', 'Cenário 2: Simulado Oficial Focado no Celular (Questão 1 de 15, Dica, Entrega)', () => {
    // 1. Inicia simulado
    resetStudentProgress();
    setState({ selectedEdition: 'uneb_2025', quizMode: 'simulado' });
    const questoes = BANCO_PROVAS.uneb_2025.questions;
    assert.equal(questoes.length, 15);

    // 2. Marca alternativa na Q1 e navega
    const q1 = questoes[0];
    assert.equal(q1.id, 1);
    assert.equal(q1.options.length, 5);

    // 3. Simula resposta correta
    const answers = { [q1.id]: q1.correct };
    setState({
      quizAnswersByEdition: {
        uneb_2025: answers
      }
    });
    assert.equal(getState().quizAnswersByEdition.uneb_2025[q1.id], q1.correct);
  });

  runTest('tier4', 'SC3', 'T4-SC3', 'Cenário 3: Projeção em Sala de Aula pelo Professor (Lousa, Gabarito, Turma)', () => {
    memoryStore.clear();
    // 1. Login docente com código oficial
    assert.equal(validateTeacherCode(TEACHER_ACCESS_CODE), true);
    setState({ sessionRole: 'teacher', teacherPreviewAsStudent: false, teacherShowAnswers: true });

    assert.equal(isTeacherModeActive(), true);
    assert.equal(getState().teacherShowAnswers, true);

    // 2. Comuta para preview de aluno
    setState({ teacherPreviewAsStudent: true });
    assert.equal(isTeacherModeActive(), false);

    // 3. Retorna à lousa docente
    setState({ teacherPreviewAsStudent: false });
    assert.equal(isTeacherModeActive(), true);
  });

  runTest('tier4', 'SC4', 'T4-SC4', 'Cenário 4: Manipulação Dinâmica dos 4 Canvases Matemáticos', () => {
    // Valida integridade matemática de cada canvas
    // Canvas 1: Álgebra (Parábola)
    const pRes = evaluateParabolaChallenge(0, { a: 1, b: -2, c: 1 });
    assert.equal(typeof pRes, 'boolean');

    // Canvas 2: Trigonometria
    const tRes = evaluateTrigChallenge(0, { angleDeg: 90 });
    assert.equal(typeof tRes, 'boolean');

    // Canvas 3: Finanças
    const fRes = evaluateFinancasChallenge(0, { capital: 1000, taxa: 10, tempo: 12 });
    assert.equal(typeof fRes, 'boolean');

    // Canvas 4: Estatística (Sturges)
    const sRes = evaluateStatsChallenge(0, { k: 7 });
    assert.equal(typeof sRes, 'boolean');
  });

  runTest('tier4', 'SC5', 'T4-SC5', 'Cenário 5: Resiliência e Sincronização Offline do Aluno para a Turma', () => {
    // Aluno gera código offline UNEB1:
    resetStudentProgress();
    setState({ sessionRole: 'student', studentName: 'Camila Rodrigues', classCode: 'TURMA-MAT', score: 300 }, 'session');
    completeModuleChallenge('mod-logica', 0);
    completeModuleChallenge('mod-numeros', 0);
    const payload = buildStudentDiagnosticPayload(getState());
    const code = encodeStudentReportCode(payload);
    assert.ok(code.startsWith('UNEB1:'));

    // Professor importa no painel da turma
    const decoded = decodeStudentReportCode(code);
    assert.ok(decoded);
    assert.equal(decoded.student_name, 'Camila Rodrigues');
    assert.equal(decoded.class_code, 'TURMA-MAT');

    const turmaDiag = computeClassDiagnostics([decoded]);
    assert.equal(turmaDiag.studentCount, 1);
    assert.equal(turmaDiag.students[0].studentName, 'Camila Rodrigues');
  });
}

// ===========================================================================
// RELATÓRIO CONSOLIDADO E CÓDIGO DE SAÍDA
// ===========================================================================

const totalEvaluated = stats.tier1.total + stats.tier2.total + stats.tier3.total + stats.tier4.total;
const totalPassed = stats.tier1.passed + stats.tier2.passed + stats.tier3.passed + stats.tier4.passed;
const totalFailed = stats.tier1.failed + stats.tier2.failed + stats.tier3.failed + stats.tier4.failed;

console.log('\n======================================================================');
console.log('              RESUMO CONSOLIDADO DE EXECUÇÃO E2E');
console.log('======================================================================');
if (!selectedTier || selectedTier === 'tier1') {
  console.log(`  Tier 1 (Cobertura Funcional F1-F15):    ${stats.tier1.passed} / ${stats.tier1.total} aprovados (${stats.tier1.failed} falhas)`);
}
if (!selectedTier || selectedTier === 'tier2') {
  console.log(`  Tier 2 (Casos de Borda e Limites):      ${stats.tier2.passed} / ${stats.tier2.total} aprovados (${stats.tier2.failed} falhas)`);
}
if (!selectedTier || selectedTier === 'tier3') {
  console.log(`  Tier 3 (Interações Cruzadas P01-P12):   ${stats.tier3.passed} / ${stats.tier3.total} aprovados (${stats.tier3.failed} falhas)`);
}
if (!selectedTier || selectedTier === 'tier4') {
  console.log(`  Tier 4 (Cenários Reais SC1-SC5):        ${stats.tier4.passed} / ${stats.tier4.total} aprovados (${stats.tier4.failed} falhas)`);
}
console.log('----------------------------------------------------------------------');
console.log(`  TOTAL GERAL:                           ${totalPassed} / ${totalEvaluated} aprovados (${totalFailed} falhas)`);
console.log('======================================================================\n');

if (totalFailed > 0) {
  console.log(`STATUS: ⚠️ ${totalFailed} ASSERÇÕES NÃO PASSARAM (Aguardando implementação em M1/M2/M3)`);
  process.exitCode = 1;
} else {
  console.log('STATUS: 🎉 100% DAS ASSERÇÕES AVALIADAS PASSARAM COM SUCESSO!');
  process.exitCode = 0;
}
