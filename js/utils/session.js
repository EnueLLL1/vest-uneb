/**
 * @fileoverview Helpers de separação de sessão Aluno vs Professor (client-side).
 */

export const TEACHER_ACCESS_CODE = 'UNEB2026';
export const MAX_STUDENT_NAME_LENGTH = 40;

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
