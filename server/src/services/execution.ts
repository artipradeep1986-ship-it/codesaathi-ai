import axios, { AxiosError } from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { execSync, spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { config } from '../config.js';
import { ExecutionRecord, ExecutionRequest } from '../types/index.js';
import { badRequest, serviceUnavailable, rateLimited } from '../utils/errors.js';

export interface SupportedLanguage {
  id: string;
  name: string;
  extension: string;
  judge0_id: number;
}

export class ExecutionService {
  private readonly LANGUAGE_MAP: Record<string, number> = {
    java: 62,
    python: 71,
    py: 71,
    cpp: 54,
    'c++': 54,
    c: 50,
    javascript: 63,
    js: 63,
  };

  private readonly SUPPORTED_LANGUAGES: SupportedLanguage[] = [
    { id: 'java', name: 'Java (OpenJDK 17)', extension: '.java', judge0_id: 62 },
    { id: 'python', name: 'Python (3.8+)', extension: '.py', judge0_id: 71 },
    { id: 'cpp', name: 'C++ (GCC 9.2.0)', extension: '.cpp', judge0_id: 54 },
    { id: 'c', name: 'C (GCC 9.2.0)', extension: '.c', judge0_id: 50 },
    { id: 'javascript', name: 'JavaScript (Node.js)', extension: '.js', judge0_id: 63 },
  ];

  public getLanguageId(lang: string): number {
    const normalized = lang.trim().toLowerCase();
    const id = this.LANGUAGE_MAP[normalized];
    if (!id) {
      const supported = Object.keys(this.LANGUAGE_MAP).join(', ');
      throw badRequest(`Unsupported programming language: "${lang}". Supported: ${supported}`);
    }
    return id;
  }

  public async getLanguages(): Promise<SupportedLanguage[]> {
    return this.SUPPORTED_LANGUAGES;
  }

  private decodeBase64(content?: string | null): string | undefined {
    if (!content) return undefined;
    try {
      return Buffer.from(content, 'base64').toString('utf-8');
    } catch {
      return content;
    }
  }

  private mapJudge0Status(statusId: number): string {
    switch (statusId) {
      case 3: // Accepted
      case 4: // Wrong Answer (Executed successfully)
        return 'success';
      case 5: // Time Limit Exceeded
        return 'time_limit';
      case 6: // Compilation Error
        return 'compilation_error';
      case 7: // Runtime Error (SIGSEGV)
      case 8: // Runtime Error (SIGXFSZ)
      case 9: // Runtime Error (SIGFPE)
      case 10: // Runtime Error (SIGABRT)
      case 11: // Runtime Error (NZEC)
      case 12: // Runtime Error (Other)
      case 14: // Exec Format Error
        return 'runtime_error';
      case 13: // Internal Error
        return 'service_error';
      default:
        return 'unknown';
    }
  }

  public async execute(
    request: ExecutionRequest,
    userId: string = 'anonymous'
  ): Promise<ExecutionRecord> {
    // 1. First attempt execution via Judge0
    try {
      return await this.executeViaJudge0(request, userId);
    } catch (judge0Err: any) {
      console.warn(
        `[ExecutionService] Judge0 unavailable (${judge0Err.message}). Switching to local runtime sandbox fallback...`
      );

      // 2. Fallback to local compiler/interpreter (e.g. OpenJDK 17 or Node)
      return await this.executeLocally(request, userId);
    }
  }

  private async executeViaJudge0(
    request: ExecutionRequest,
    userId: string
  ): Promise<ExecutionRecord> {
    const languageId = this.getLanguageId(request.language);

    const sourceBase64 = Buffer.from(request.source_code, 'utf-8').toString('base64');
    const stdinBase64 = request.input
      ? Buffer.from(request.input, 'utf-8').toString('base64')
      : undefined;

    const judge0Url = config.JUDGE0_URL.replace(/\/+$/, '');
    const submissionEndpoint = `${judge0Url}/submissions?base64_encoded=true&wait=true`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (config.JUDGE0_API_KEY) {
      if (judge0Url.includes('rapidapi.com')) {
        headers['X-RapidAPI-Key'] = config.JUDGE0_API_KEY;
        const hostMatch = judge0Url.match(/https?:\/\/([^/]+)/);
        headers['X-RapidAPI-Host'] = hostMatch ? hostMatch[1] : 'judge0-ce.p.rapidapi.com';
      } else {
        headers['X-Auth-Token'] = config.JUDGE0_API_KEY;
      }
    }

    const payload = {
      source_code: sourceBase64,
      language_id: languageId,
      stdin: stdinBase64,
      cpu_time_limit: config.MAX_EXECUTION_TIME_SEC,
      wall_time_limit: config.MAX_EXECUTION_TIME_SEC * 2,
      memory_limit: config.MAX_MEMORY_MB * 1024,
      max_file_size: config.MAX_OUTPUT_SIZE_KB,
    };

    const response = await axios.post(submissionEndpoint, payload, {
      headers,
      timeout: (config.MAX_EXECUTION_TIME_SEC + 5) * 1000,
    });

    const data = response.data;
    const statusId = data?.status?.id ?? 0;
    const executionStatus = this.mapJudge0Status(statusId);

    const stdout = this.decodeBase64(data.stdout);
    const stderr = this.decodeBase64(data.stderr);
    const compileOutput = this.decodeBase64(data.compile_output);

    const executionTime = data.time ? parseFloat(data.time) : undefined;
    const memoryUsed = data.memory ? Math.round(data.memory / 1024) : undefined;

    return {
      id: uuidv4(),
      program_id: request.program_id,
      user_id: userId,
      language: request.language,
      source_code: request.source_code,
      input: request.input,
      execution_status: executionStatus,
      output: stdout,
      error_output: stderr,
      compile_output: compileOutput,
      execution_time: executionTime,
      memory_used: memoryUsed,
      created_at: new Date().toISOString(),
    };
  }

  /**
   * Local sandbox execution fallback using system compilers (e.g. OpenJDK javac/java, Node)
   */
  private async executeLocally(
    request: ExecutionRequest,
    userId: string
  ): Promise<ExecutionRecord> {
    const lang = request.language.toLowerCase().trim();

    if (lang === 'java') {
      return this.executeLocalJava(request, userId);
    } else if (lang === 'javascript' || lang === 'js') {
      return this.executeLocalNode(request, userId);
    }

    throw serviceUnavailable(
      `Execution engine for "${request.language}" is currently unavailable. Please start Judge0 Docker container or configure Judge0 URL.`
    );
  }

  private async executeLocalJava(
    request: ExecutionRequest,
    userId: string
  ): Promise<ExecutionRecord> {
    const startTime = Date.now();
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'codesaathi-java-'));

    try {
      // Extract class name from code (e.g. public class XYZ or class XYZ)
      const classMatch = request.source_code.match(/(?:public\s+)?class\s+([A-Za-z0-9_$]+)/);
      const className = classMatch ? classMatch[1] : 'Main';
      const sourceFile = path.join(tempDir, `${className}.java`);

      fs.writeFileSync(sourceFile, request.source_code, 'utf-8');

      // 1. Compile with javac
      try {
        execSync(`javac "${className}.java"`, {
          cwd: tempDir,
          timeout: 10000,
          stdio: 'pipe',
        });
      } catch (compileErr: any) {
        const compileOutput = (
          compileErr.stderr?.toString() ||
          compileErr.stdout?.toString() ||
          compileErr.message
        ).trim();

        return {
          id: uuidv4(),
          program_id: request.program_id,
          user_id: userId,
          language: request.language,
          source_code: request.source_code,
          input: request.input,
          execution_status: 'compilation_error',
          compile_output: compileOutput,
          execution_time: (Date.now() - startTime) / 1000,
          created_at: new Date().toISOString(),
        };
      }

      // 2. Run with java
      try {
        const proc = spawnSync('java', [className], {
          cwd: tempDir,
          input: request.input || '',
          timeout: config.MAX_EXECUTION_TIME_SEC * 1000,
          encoding: 'utf-8',
          maxBuffer: config.MAX_OUTPUT_SIZE_KB * 1024,
        });

        const executionTime = (Date.now() - startTime) / 1000;

        if (proc.error) {
          if ((proc.error as any).code === 'ETIMEDOUT') {
            return {
              id: uuidv4(),
              program_id: request.program_id,
              user_id: userId,
              language: request.language,
              source_code: request.source_code,
              input: request.input,
              execution_status: 'time_limit',
              error_output: `Program timed out after ${config.MAX_EXECUTION_TIME_SEC}s. Check for infinite loops or unprovided Scanner input.`,
              execution_time: executionTime,
              created_at: new Date().toISOString(),
            };
          }
        }

        const stdout = proc.stdout ? proc.stdout.trim() : '';
        const stderr = proc.stderr ? proc.stderr.trim() : '';
        const status = proc.status === 0 ? 'success' : 'runtime_error';

        return {
          id: uuidv4(),
          program_id: request.program_id,
          user_id: userId,
          language: request.language,
          source_code: request.source_code,
          input: request.input,
          execution_status: status,
          output: stdout,
          error_output: stderr || undefined,
          execution_time: executionTime,
          created_at: new Date().toISOString(),
        };
      } catch (runErr: any) {
        return {
          id: uuidv4(),
          program_id: request.program_id,
          user_id: userId,
          language: request.language,
          source_code: request.source_code,
          input: request.input,
          execution_status: 'runtime_error',
          error_output: runErr.message,
          execution_time: (Date.now() - startTime) / 1000,
          created_at: new Date().toISOString(),
        };
      }
    } finally {
      try {
        fs.rmSync(tempDir, { recursive: true, force: true });
      } catch {
        // ignore cleanup error
      }
    }
  }

  private async executeLocalNode(
    request: ExecutionRequest,
    userId: string
  ): Promise<ExecutionRecord> {
    const startTime = Date.now();
    try {
      const proc = spawnSync('node', ['-e', request.source_code], {
        input: request.input || '',
        timeout: config.MAX_EXECUTION_TIME_SEC * 1000,
        encoding: 'utf-8',
        maxBuffer: config.MAX_OUTPUT_SIZE_KB * 1024,
      });

      const executionTime = (Date.now() - startTime) / 1000;
      const stdout = proc.stdout ? proc.stdout.trim() : '';
      const stderr = proc.stderr ? proc.stderr.trim() : '';
      const status = proc.status === 0 ? 'success' : 'runtime_error';

      return {
        id: uuidv4(),
        program_id: request.program_id,
        user_id: userId,
        language: request.language,
        source_code: request.source_code,
        input: request.input,
        execution_status: status,
        output: stdout,
        error_output: stderr || undefined,
        execution_time: executionTime,
        created_at: new Date().toISOString(),
      };
    } catch (runErr: any) {
      return {
        id: uuidv4(),
        program_id: request.program_id,
        user_id: userId,
        language: request.language,
        source_code: request.source_code,
        input: request.input,
        execution_status: 'runtime_error',
        error_output: runErr.message,
        execution_time: (Date.now() - startTime) / 1000,
        created_at: new Date().toISOString(),
      };
    }
  }
}

export const executionService = new ExecutionService();
