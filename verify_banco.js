import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

console.log('Testing js/data/banco_questoes.js integrity...\n');

let BANCO;
try {
  ({ BANCO_PROVAS: BANCO } = await import('./js/data/banco_questoes.js'));
  console.log('✔ Syntax and loading: OK');
} catch (err) {
  console.error('✖ Error loading js/data/banco_questoes.js:', err);
  process.exit(1);
}

const editions = ['uneb_2025', 'uneb_2024', 'uneb_2023', 'imersao_fixacao'];
let totalQuestions = 0;
let totalImages = 0;
let errors = 0;

for (const edKey of editions) {
  const ed = BANCO[edKey];
  if (!ed) {
    console.error(`✖ Missing edition: ${edKey}`);
    errors++;
    continue;
  }

  const expectedCount = edKey === 'imersao_fixacao' ? 6 : 15;
  if (!ed.questions || ed.questions.length !== expectedCount) {
    console.error(`✖ ${edKey} questions count mismatch: expected ${expectedCount}, got ${ed.questions ? ed.questions.length : 0}`);
    errors++;
  } else {
    console.log(`✔ ${edKey}: ${ed.questions.length} questions`);
  }

  ed.questions.forEach((q, idx) => {
    totalQuestions++;
    if (q.id !== idx + 1) {
      console.error(`✖ ${edKey} Q${idx + 1}: id is ${q.id}, expected ${idx + 1}`);
      errors++;
    }
    if (!q.axis || typeof q.axis !== 'string') {
      console.error(`✖ ${edKey} Q${q.id}: missing axis`);
      errors++;
    }
    if (!q.question || typeof q.question !== 'string') {
      console.error(`✖ ${edKey} Q${q.id}: missing question text`);
      errors++;
    }
    if (!Array.isArray(q.options) || q.options.length !== 5) {
      console.error(`✖ ${edKey} Q${q.id}: options must be array of 5 items`);
      errors++;
    } else {
      q.options.forEach((opt, oIdx) => {
        const prefix = `0${oIdx + 1})`;
        if (!opt.startsWith(prefix)) {
          console.warn(`⚠ ${edKey} Q${q.id} opt ${oIdx}: '${opt.substring(0, 5)}' does not start with '${prefix}'`);
        }
      });
    }
    if (typeof q.correct !== 'number' || q.correct < 0 || q.correct > 4) {
      console.error(`✖ ${edKey} Q${q.id}: invalid correct index ${q.correct}`);
      errors++;
    }
    if (q.figureImg) {
      totalImages++;
      const resolved = path.resolve(__dirname, q.figureImg);
      if (!fs.existsSync(resolved)) {
        console.error(`✖ ${edKey} Q${q.id}: image file not found: ${q.figureImg} (${resolved})`);
        errors++;
      }
    }
  });
}

// Check 2025 specific fixes
const q25_2 = BANCO.uneb_2025.questions[1];
if (q25_2.options[1] !== '02) 64/9 cm' || q25_2.options[4] !== '05) 16/9 cm') {
  console.error('✖ uneb_2025 Q02 options not updated correctly:', q25_2.options);
  errors++;
} else {
  console.log('✔ uneb_2025 Q02 options verified: 64/9 cm and 16/9 cm present');
}

const q25_9 = BANCO.uneb_2025.questions[8];
if (q25_9.options[2] !== '03) √14 cm') {
  console.error('✖ uneb_2025 Q09 option 03 not updated correctly:', q25_9.options[2]);
  errors++;
} else {
  console.log('✔ uneb_2025 Q09 option 03 verified: √14 cm');
}

const q25_11 = BANCO.uneb_2025.questions[10];
if (q25_11.options[1] !== '02) 152/31' || q25_11.correct !== 1) {
  console.error('✖ uneb_2025 Q11 not updated correctly:', q25_11.options, q25_11.correct);
  errors++;
} else {
  console.log('✔ uneb_2025 Q11 verified: +152/31, correct: 1');
}

const q25_12 = BANCO.uneb_2025.questions[11];
if (q25_12.options[0] !== '01) 3 / 1.292') {
  console.error('✖ uneb_2025 Q12 option 01 not updated correctly:', q25_12.options[0]);
  errors++;
} else {
  console.log('✔ uneb_2025 Q12 option 01 verified: 3 / 1.292');
}

// Check 2023 specific fixes
const q23_cancelled = [3, 12, 14];
for (const cid of q23_cancelled) {
  const q = BANCO.uneb_2023.questions[cid - 1];
  if (!q.isCancelled) {
    console.error(`✖ uneb_2023 Q${cid} should be cancelled!`);
    errors++;
  } else {
    console.log(`✔ uneb_2023 Q${cid} cancelled verified`);
  }
}

const q23_8 = BANCO.uneb_2023.questions[7];
if (q23_8.correct !== 3 || !q23_8.options[3].includes('13/6')) {
  console.error('✖ uneb_2023 Q08 should have correct: 3 (13/6):', q23_8.options, q23_8.correct);
  errors++;
} else {
  console.log('✔ uneb_2023 Q08 retificação verified: correct: 3 (13/6)');
}

console.log(`\nSummary: Total Questions = ${totalQuestions}, Total Verified Images = ${totalImages}, Total Errors = ${errors}`);

if (errors === 0) {
  console.log('\n🎉 ALL CHECKS PASSED PERFECTLY!');
  process.exit(0);
} else {
  console.error(`\n❌ FOUND ${errors} ERRORS`);
  process.exit(1);
}
