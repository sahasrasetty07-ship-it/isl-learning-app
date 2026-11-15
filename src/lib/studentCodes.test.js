import { describe, it, expect } from 'vitest';
import {
  normalizeCode,
  formatCode,
  isCodeReady,
  hasAmbiguousChars,
  sanitizeCodeInput,
  CODE_LENGTH
} from './studentCodes';
import { isMissingBackendError } from './backendErrors';

describe('normalizeCode', () => {
  it('uppercases and strips spaces, dashes and punctuation', () => {
    expect(normalizeCode(' 34b-sd5 ')).toBe('34BSD5');
    expect(normalizeCode('abc/def.')).toBe('ABCDEF');
  });

  it('never returns undefined for empty input', () => {
    expect(normalizeCode()).toBe('');
    expect(normalizeCode(null)).toBe('');
  });
});

describe('formatCode', () => {
  it('groups the code in threes for display', () => {
    expect(formatCode('34bsd5')).toBe('34B SD5');
    expect(formatCode('')).toBe('');
  });
});

describe('code validation', () => {
  it('rejects ambiguous characters', () => {
    expect(hasAmbiguousChars('AB0DEF')).toBe(true);
    expect(hasAmbiguousChars('ABODEF')).toBe(true);
    expect(hasAmbiguousChars('AB1DEF')).toBe(true);
    expect(hasAmbiguousChars('ABIDEF')).toBe(true);
    expect(hasAmbiguousChars('34BSD5')).toBe(false);
  });

  it('is not ready until it is six unambiguous characters', () => {
    expect(isCodeReady('34BSD')).toBe(false);
    expect(isCodeReady('34BSD5')).toBe(true);
    expect(isCodeReady('34BS05')).toBe(false);
  });

  it('sanitizes typed or pasted input to the allowed characters', () => {
    expect(sanitizeCodeInput('34b sd5 extra')).toBe('34BSD5');
    expect(sanitizeCodeInput('34B-SD5').length).toBe(CODE_LENGTH);
  });
});

describe('isMissingBackendError', () => {
  it('detects Postgres/PostgREST "not installed yet" errors', () => {
    expect(isMissingBackendError({ code: 'PGRST202' })).toBe(true);
    expect(isMissingBackendError({ code: '42883' })).toBe(true);
    expect(isMissingBackendError({ code: '42P01' })).toBe(true);
    expect(isMissingBackendError({ message: 'Could not find the function public.get_my_linked_students' })).toBe(true);
    expect(isMissingBackendError({ message: 'Schema cache not updated' })).toBe(true);
    expect(isMissingBackendError({ message: 'relation "student_codes" does not exist' })).toBe(true);
  });

  it('does not treat real errors as missing setup', () => {
    expect(isMissingBackendError({ code: '23505', message: 'duplicate key' })).toBe(false);
    expect(isMissingBackendError({ message: 'invalid_code' })).toBe(false);
    expect(isMissingBackendError(null)).toBe(false);
    expect(isMissingBackendError(undefined)).toBe(false);
  });
});
