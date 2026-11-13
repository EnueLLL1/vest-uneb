/**
 * TESTE DE SANIDADE DAS FÓRMULAS MATEMÁTICAS & MÓDULOS ES
 */

import assert from 'node:assert';
import { factorial, calcArranjo, calcCombinacao, calcPA, calcPG } from '../js/modules/combinatoria.js';
import { calcBhaskara } from '../js/modules/parabola.js';
import { calcTrigValues } from '../js/modules/trig.js';
import { calcJuros } from '../js/modules/financas.js';
import { calcSturgesFormula, computeStatsFromData } from '../js/modules/stats.js';

console.log('--- Iniciando Teste de Sanidade Matemática ---');

// 1. Combinatória & Fatorial
assert.strictEqual(factorial(0), 1, '0! deve ser 1');
assert.strictEqual(factorial(1), 1, '1! deve ser 1');
assert.strictEqual(factorial(5), 120, '5! deve ser 120');
assert.strictEqual(factorial(7), 5040, '7! deve ser 5040');

assert.strictEqual(calcArranjo(7, 3), 210, 'A(7, 3) deve ser 210');
assert.strictEqual(calcCombinacao(7, 3), 35, 'C(7, 3) deve ser 35');
console.log('✔ Eixo 2 (Fatorial, Arranjo e Combinação): OK');

// 2. Sequências PA e PG
const pa = calcPA(2, 3, 10);
assert.strictEqual(pa.an, 29, 'PA a10 deve ser 29');
assert.strictEqual(pa.sn, 155, 'PA S10 deve ser 155');

const pg = calcPG(2, 3, 5);
assert.strictEqual(pg.an, 162, 'PG a5 deve ser 162');
assert.strictEqual(pg.sn, 242, 'PG S5 deve ser 242');
console.log('✔ Eixo 2 (Progressões Aritmética e Geométrica): OK');

// 3. Função Quadrática & Bhaskara
const quad1 = calcBhaskara(1, -2, -3);
assert.strictEqual(quad1.delta, 16, 'Delta de x² - 2x - 3 deve ser 16');
assert.deepStrictEqual(quad1.roots, [-1, 3], 'Raízes devem ser -1 e 3');
assert.strictEqual(quad1.vertex.xv, 1, 'Xv deve ser 1');
assert.strictEqual(quad1.vertex.yv, -4, 'Yv deve ser -4');
assert.strictEqual(quad1.vertex.type, 'Mínimo', 'a > 0 é ponto de mínimo');

const quad2 = calcBhaskara(-1, 0, 4);
assert.strictEqual(quad2.delta, 16, 'Delta de -x² + 4 deve ser 16');
assert.deepStrictEqual(quad2.roots, [-2, 2], 'Raízes devem ser -2 e 2');
assert.strictEqual(quad2.vertex.type, 'Máximo', 'a < 0 é ponto de máximo');
console.log('✔ Eixo 3 (Função Quadrática e Bhaskara): OK');

// 4. Trigonometria
const trig0 = calcTrigValues(0);
assert.strictEqual(trig0.sinVal, 0, 'sen(0°) deve ser 0');
assert.strictEqual(trig0.cosVal, 1, 'cos(0°) deve ser 1');
assert.strictEqual(trig0.tanVal, 0, 'tg(0°) deve ser 0');

const trig90 = calcTrigValues(90);
assert.strictEqual(trig90.sinVal, 1, 'sen(90°) deve ser 1');
assert.strictEqual(trig90.cosVal, 0, 'cos(90°) deve ser 0');
assert.strictEqual(trig90.tanVal, 'Indefinida', 'tg(90°) deve ser Indefinida');

const trig180 = calcTrigValues(180);
assert.strictEqual(trig180.sinVal, 0, 'sen(180°) deve ser 0');
assert.strictEqual(trig180.cosVal, -1, 'cos(180°) deve ser -1');
console.log('✔ Eixo 4 (Círculo Trigonométrico): OK');

// 5. Matemática Financeira
const fin = calcJuros(1000, 10, 6);
assert.strictEqual(fin.montanteSimples, 1600, 'Juros simples deve ser 1600.00');
assert.strictEqual(Math.round(fin.montanteComposto * 100) / 100, 1771.56, 'Juros compostos deve ser 1771.56');
assert.strictEqual(Math.round(fin.diff * 100) / 100, 171.56, 'Diferença deve ser 171.56');
console.log('✔ Eixo 5 (Matemática Financeira): OK');

// 6. Sturges & Estatística
const sturges = calcSturgesFormula(100, 48);
assert.strictEqual(sturges.rawI.toFixed(2), '7.60', 'Sturges rawI para n=100 deve ser 7.60');
assert.strictEqual(sturges.roundedI, 8, 'Classes arredondadas deve ser 8');
assert.strictEqual(sturges.h, 6, 'Amplitude h = 48 / 8 deve ser 6');

const stats = computeStatsFromData([10, 20, 20, 30]);
assert.strictEqual(stats.media, 20, 'Média deve ser 20');
assert.strictEqual(stats.mediana, 20, 'Mediana deve ser 20');
assert.strictEqual(stats.modaText, '20', 'Moda deve ser 20');
console.log('✔ Eixo 6 (Sturges e Estatística Descritiva): OK');

console.log('\n🎉 TODOS OS TESTES MATEMÁTICOS PASSARAM COM SUCESSO!');

