import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ExecutionService } from '../services/execution.js';
import { AppError, badRequest, notFound, unauthorized, rateLimited } from '../utils/errors.js';
import axios from 'axios';

vi.mock('axios');
const mockedAxios = vi.mocked(axios, true);

describe('ExecutionService', () => {
  let executionService: ExecutionService;

  beforeEach(() => {
    vi.clearAllMocks();
    executionService = new ExecutionService();
  });

  describe('Language resolution', () => {
    it('correctly maps Python language identifiers to Judge0 ID 71', () => {
      expect(executionService.getLanguageId('python')).toBe(71);
      expect(executionService.getLanguageId('py')).toBe(71);
      expect(executionService.getLanguageId('PYTHON')).toBe(71);
    });

    it('correctly maps Java language identifier to Judge0 ID 62', () => {
      expect(executionService.getLanguageId('java')).toBe(62);
      expect(executionService.getLanguageId('Java')).toBe(62);
    });

    it('correctly maps C++ and C language identifiers to Judge0 IDs 54 and 50', () => {
      expect(executionService.getLanguageId('cpp')).toBe(54);
      expect(executionService.getLanguageId('c++')).toBe(54);
      expect(executionService.getLanguageId('c')).toBe(50);
    });

    it('correctly maps JavaScript language identifiers to Judge0 ID 63', () => {
      expect(executionService.getLanguageId('javascript')).toBe(63);
      expect(executionService.getLanguageId('js')).toBe(63);
    });

    it('throws badRequest for unsupported languages', () => {
      expect(() => executionService.getLanguageId('ruby')).toThrowError(/Unsupported programming language/);
      expect(() => executionService.getLanguageId('rust')).toThrowError(/Unsupported programming language/);
    });
  });

  describe('Supported languages list', () => {
    it('returns an array of supported languages with appropriate metadata', async () => {
      const languages = await executionService.getLanguages();
      expect(Array.isArray(languages)).toBe(true);
      expect(languages.length).toBeGreaterThanOrEqual(5);

      const javaEntry = languages.find((l) => l.id === 'java');
      expect(javaEntry).toBeDefined();
      expect(javaEntry?.judge0_id).toBe(62);
      expect(javaEntry?.extension).toBe('.java');

      const pythonEntry = languages.find((l) => l.id === 'python');
      expect(pythonEntry).toBeDefined();
      expect(pythonEntry?.judge0_id).toBe(71);
    });
  });

  describe('Code execution submission', () => {
    it('successfully processes Judge0 successful execution response', async () => {
      const mockStdout = Buffer.from('Hello, CodeSaathi!\n').toString('base64');
      mockedAxios.post.mockResolvedValueOnce({
        data: {
          status: { id: 3, description: 'Accepted' },
          stdout: mockStdout,
          stderr: null,
          compile_output: null,
          time: '0.045',
          memory: 2048,
        },
      });

      const result = await executionService.execute(
        {
          source_code: 'print("Hello, CodeSaathi!")',
          language: 'python',
        },
        'test-student-1'
      );

      expect(result).toBeDefined();
      expect(result.execution_status).toBe('success');
      expect(result.output).toBe('Hello, CodeSaathi!\n');
      expect(result.user_id).toBe('test-student-1');
      expect(result.execution_time).toBe(0.045);
      expect(result.memory_used).toBe(2); // 2048 KB -> 2 MB
    });

    it('correctly handles compilation errors from Judge0', async () => {
      const mockCompileError = Buffer.from('SyntaxError: invalid syntax at line 1\n').toString('base64');
      mockedAxios.post.mockResolvedValueOnce({
        data: {
          status: { id: 6, description: 'Compilation Error' },
          stdout: null,
          stderr: null,
          compile_output: mockCompileError,
          time: '0.010',
          memory: 1024,
        },
      });

      const result = await executionService.execute(
        {
          source_code: 'print "Hello"',
          language: 'python',
        },
        'test-student-1'
      );

      expect(result.execution_status).toBe('compilation_error');
      expect(result.compile_output).toBe('SyntaxError: invalid syntax at line 1\n');
    });

    it('correctly handles runtime errors from Judge0', async () => {
      const mockStderr = Buffer.from('ZeroDivisionError: division by zero\n').toString('base64');
      mockedAxios.post.mockResolvedValueOnce({
        data: {
          status: { id: 11, description: 'Runtime Error (NZEC)' },
          stdout: null,
          stderr: mockStderr,
          compile_output: null,
          time: '0.015',
          memory: 1024,
        },
      });

      const result = await executionService.execute(
        {
          source_code: 'x = 10 / 0',
          language: 'python',
        },
        'test-student-1'
      );

      expect(result.execution_status).toBe('runtime_error');
      expect(result.error_output).toBe('ZeroDivisionError: division by zero\n');
    });
  });
});

describe('AppError & Error Factories', () => {
  it('creates AppError with correct status codes and defaults', () => {
    const err = new AppError(418, "I'm a teapot", 'TEAPOT_ERROR');
    expect(err.statusCode).toBe(418);
    expect(err.message).toBe("I'm a teapot");
    expect(err.code).toBe('TEAPOT_ERROR');
  });

  it('badRequest creates 400 error', () => {
    const err = badRequest('Invalid field input', 'FIELD_ERROR', { field: 'email' });
    expect(err.statusCode).toBe(400);
    expect(err.code).toBe('FIELD_ERROR');
    expect(err.details).toEqual({ field: 'email' });
  });

  it('unauthorized creates 401 error', () => {
    const err = unauthorized('Login required');
    expect(err.statusCode).toBe(401);
    expect(err.code).toBe('UNAUTHORIZED');
  });

  it('notFound creates 404 error', () => {
    const err = notFound('Program not found');
    expect(err.statusCode).toBe(404);
    expect(err.code).toBe('NOT_FOUND');
  });

  it('rateLimited creates 429 error', () => {
    const err = rateLimited('Too many runs');
    expect(err.statusCode).toBe(429);
    expect(err.code).toBe('RATE_LIMITED');
  });
});
