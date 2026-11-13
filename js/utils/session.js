/**
 * @fileoverview Helpers de separação de sessão Aluno vs Professor e identificação de turma (client-side).
 */

export const TEACHER_ACCESS_CODE = 'UNEB2026';
export const MAX_STUDENT_NAME_LENGTH = 40;
export const DEFAULT_CLASS_CODE = 'UNEB-A';
export const MAX_CLASS_CODE_LENGTH = 20;

/**
 * Valida o código de entrada da Sessão Docente (sem diferenciação de maiúsculas).
 * Uso exclusivo de separação de interface na sala de aula (não é autenticação criptográfica).
 * @param {unknown} input
 * @returns {boolean}
 */
export function validateTeacherCode(input) {
  if (typeof input !== 'string') return false;
  return input.trim().toUpperCase() === TEACHER_ACCESS_CODE;
}

/**
 * Higieniza e limita o nome do estudante para exibição segura no cabeçalho e resultado.
 * @param {unknown} input
 * @returns {string}
 */
export function normalizeStudentName(input) {
  if (typeof input !== 'string') return '';
  return input.trim().replace(/\s+/g, ' ').slice(0, MAX_STUDENT_NAME_LENGTH);
}

/**
 * Normaliza o código da turma (ex.: "UNEB-A") mantendo apenas [A-Z0-9_-].
 * Retorna DEFAULT_CLASS_CODE se o valor resultante estiver vazio.
 * @param {unknown} input
 * @returns {string}
 */
export function normalizeClassCode(input) {
  if (typeof input !== 'string') return DEFAULT_CLASS_CODE;
  const cleaned = input
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9_-]/g, '')
    .slice(0, MAX_CLASS_CODE_LENGTH);
  return cleaned || DEFAULT_CLASS_CODE;
}

/**
 * Gera chave normalizada única por estudante dentro de uma turma (minúscula, sem acentos).
 * @param {unknown} name
 * @returns {string}
 */
export function normalizeStudentKey(name) {
  const clean = normalizeStudentName(name);
  if (!clean) return 'anonimo';
  return clean
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim() || 'anonimo';
}
