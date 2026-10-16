import axios, { AxiosError } from 'axios';
import { config } from '../config.js';
import {
  StudentProfile,
  OCRResult,
  AIAnalysisResponse,
  AIExplainResponse,
} from '../types/index.js';
import {
  badRequest,
  serviceUnavailable,
} from '../utils/errors.js';

export class AIService {
  // Cascading free text models for high availability
  private readonly TEXT_FALLBACK_MODELS = [
    'openrouter/free',
    'nvidia/nemotron-3.5-super-vl:free',
    'nvidia/nemotron-3.5-lightning:free',
    'cohere/north-mini-code:free',
    'google/gemma-4-31b-it:free',
    'google/gemma-4-26b-a4b-it:free',
    'google/gemini-2.5-flash',
    'google/gemini-2.5-flash-lite',
  ];

  // Cascading vision models for handwritten OCR
  private readonly VISION_FALLBACK_MODELS = [
    'nvidia/nemotron-3.5-super-vl:free',
    'openrouter/free',
    'google/gemini-2.5-flash',
    'google/gemini-2.5-flash-lite',
  ];

  private buildSystemPrompt(profile: StudentProfile): string {
    const classLevel = profile.class_level || 10;
    const board = profile.education_board || 'CBSE';
    const stateBoardInfo = profile.state_board ? ` (${profile.state_board})` : '';
    const subject = profile.subject || 'Computer Science / Computer Applications';
    const langPref = profile.preferred_language || 'english';
    const level = profile.programming_level || 'beginner';

    let languageDirective = 'Explain in simple, encouraging, crystal-clear English suitable for school students.';
    if (langPref === 'hindi') {
      languageDirective =
        'Explain in clear, natural Hindi (Devanagari script or conversational Hindi). Keep code syntax, keywords, and variable names strictly in English.';
    } else if (langPref === 'hinglish') {
      languageDirective =
        'Explain in friendly, conversational Hinglish (Hindi written using the English alphabet, mixed with natural English technical terms, e.g. "Yahan loop 1 se start ho raha hai aur har step me i ki value 1 se badhegi..."). Keep code syntax in English.';
    }

    return [
      'You are CodeSaathi AI, a helpful, patient, and warm programming tutor designed specifically for Indian school students.',
      `Student Context: Class ${classLevel} student studying ${subject} under ${board}${stateBoardInfo}. Programming experience level: ${level}. Preferred communication language: ${langPref}.`,
      '',
      'Core Pedagogical Rules:',
      `1. Language & Style: ${languageDirective}`,
      `2. Complexity Adaptation: Tailor technical depth strictly to Class ${classLevel} curriculum standard. Use relatable real-world analogies (school marks, cricket scores, railway reservations, everyday routines).`,
      '3. Encouragement: Always be supportive, positive, and polite. Never make the student feel bad about mistakes.',
      '4. Syllabus Integrity: NEVER claim to be officially trained, retrained, or endorsed by CBSE, CISCE (ICSE/ISC), or any State Board. State clearly that you align with standard educational guidelines and board syllabus patterns (e.g., ICSE Class 9/10 Java BlueJ, CBSE Class 11/12 Python/CS).',
      '5. Board Exam Focus: When appropriate, highlight exam marking tips, common viva questions, variable description tables (ICSE), dry-run traces, and syntax pitfalls that frequently cost marks in board practicals and theory papers.',
      '6. Response Format: When instructed to return JSON, provide strictly valid JSON without markdown wrapping or explanatory text outside the JSON object.',
    ].join('\n');
  }

  /**
   * Calls OpenRouter with automatic model fallback cascade.
   * If a model has no endpoints, hits rate limits, or runs out of credits,
   * it automatically tries the next available model in the priority list.
   */
  private async callOpenRouter(
    messages: Array<{ role: string; content: any }>,
    options?: { json?: boolean; model?: string; isVision?: boolean }
  ): Promise<any> {
    if (!config.OPENROUTER_API_KEY) {
      throw serviceUnavailable(
        'AI service is currently unavailable (OPENROUTER_API_KEY is not configured on the server).'
      );
    }

    const requestedModel =
      options?.model ||
      (options?.isVision ? config.OPENROUTER_VISION_MODEL : config.OPENROUTER_MODEL);

    const fallbackList = options?.isVision
      ? this.VISION_FALLBACK_MODELS
      : this.TEXT_FALLBACK_MODELS;

    // Deduplicate requested model with fallback list
    const candidateModels: string[] = [];
    if (requestedModel && requestedModel.trim().length > 0) {
      candidateModels.push(requestedModel.trim());
    }
    for (const m of fallbackList) {
      if (!candidateModels.includes(m)) {
        candidateModels.push(m);
      }
    }

    let lastErrorMessage = 'Unknown error occurred';

    for (let i = 0; i < candidateModels.length; i++) {
      const currentModel = candidateModels[i];

      // Try with json option first, and if model rejects response_format, retry without it
      const attempts = options?.json ? [true, false] : [false];

      for (const useResponseFormat of attempts) {
        try {
          const payload: Record<string, any> = {
            model: currentModel,
            messages,
            temperature: 0.2,
          };

          if (useResponseFormat) {
            payload.response_format = { type: 'json_object' };
          }

          const response = await axios.post(
            'https://openrouter.ai/api/v1/chat/completions',
            payload,
            {
              headers: {
                Authorization: `Bearer ${config.OPENROUTER_API_KEY}`,
                'HTTP-Referer': config.FRONTEND_URL || 'http://localhost:5173',
                'X-Title': 'CodeSaathi AI',
                'Content-Type': 'application/json',
              },
              timeout: 35000,
            }
          );

          const choice = response.data?.choices?.[0];
          if (!choice || !choice.message) {
            throw new Error('Empty response received from AI model.');
          }

          const rawContent = choice.message.content;
          if (!rawContent || (typeof rawContent === 'string' && rawContent.trim().length === 0)) {
            throw new Error('AI returned an empty content string.');
          }

          if (options?.json) {
            return this.parseJSONResponse(rawContent);
          }

          return rawContent;
        } catch (err: any) {
          const axiosErr = axios.isAxiosError(err) ? (err as AxiosError<any>) : null;
          const status = axiosErr?.response?.status;
          const rawErrMsg =
            axiosErr?.response?.data?.error?.message ||
            axiosErr?.message ||
            err?.message ||
            String(err);

          lastErrorMessage = rawErrMsg;

          // If error was caused by response_format not supported by this model, retry with useResponseFormat=false
          if (useResponseFormat && (status === 400 || rawErrMsg.toLowerCase().includes('response_format'))) {
            continue;
          }

          console.warn(
            `[AI Service] Model "${currentModel}" failed (${status || 'network'}): ${rawErrMsg}. Attempting fallback model...`
          );
          // Break to next candidate model
          break;
        }
      }
    }

    throw serviceUnavailable(
      `AI service error: All available models exhausted. Last error: ${lastErrorMessage}`
    );
  }

  private parseJSONResponse(raw: string): any {
    if (!raw || typeof raw !== 'string') {
      throw badRequest('AI service returned an empty response.');
    }

    let cleaned = raw.trim();

    // 1. Try markdown code block extraction first (```json ... ``` or ``` ... ```)
    const codeBlockMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (codeBlockMatch && codeBlockMatch[1]) {
      try {
        return JSON.parse(codeBlockMatch[1].trim());
      } catch {
        cleaned = codeBlockMatch[1].trim();
      }
    }

    // 2. Direct JSON parse
    try {
      return JSON.parse(cleaned);
    } catch {
      // 3. Regex extraction of outermost {...}
      const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          return JSON.parse(jsonMatch[0]);
        } catch {
          // fall through
        }
      }
      throw badRequest('Failed to parse AI response into structured format. Please retry.');
    }
  }

  async analyzeErrors(
    code: string,
    language: string,
    compilerOutput: string | undefined,
    profile: StudentProfile
  ): Promise<AIAnalysisResponse> {
    const systemPrompt = this.buildSystemPrompt(profile);

    const userPrompt = [
      `Analyze the following ${language} code written by a student.`,
      compilerOutput ? `\nCompiler / Execution Output:\n${compilerOutput}\n` : '',
      `\nStudent's Code:\n\`\`\`${language}\n${code}\n\`\`\`\n`,
      'Instructions for Analysis:',
      '1. Identify all syntax errors, logical bugs, missing semicolons/brackets, variable scope problems, and board-exam specific pitfalls.',
      '2. If there are compiler errors provided, clearly explain what the error means in beginner-friendly terms and how to fix it.',
      '3. Formulate the response strictly as a JSON object matching this schema:',
      '{',
      '  "summary": "Brief summary of code health and key findings",',
      '  "has_errors": boolean,',
      '  "issues": [',
      '    {',
      '      "line": number,',
      '      "problem_code": "exact problematic code line or snippet",',
      '      "what_is_wrong": "concise description of the mistake",',
      '      "why": "why this is incorrect or causes an error",',
      '      "corrected_code": "corrected code for this line/block",',
      '      "explanation": "friendly explanation with tips to remember in exams"',
      '    }',
      '  ],',
      '  "corrected_full_code": "complete working and properly formatted source code",',
      '  "encouragement": "motivating closing note for the student"',
      '}',
      'Return ONLY valid JSON.',
    ].join('\n');

    const result = await this.callOpenRouter(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      { json: true }
    );

    return {
      summary: result.summary || 'Code analysis completed.',
      has_errors: Boolean(result.has_errors ?? (result.issues && result.issues.length > 0)),
      issues: Array.isArray(result.issues) ? result.issues : [],
      corrected_full_code: result.corrected_full_code || code,
      encouragement: result.encouragement || 'Keep practicing! Coding gets easier with every program you write.',
    };
  }

  async explainCode(
    code: string,
    language: string,
    mode: string,
    profile: StudentProfile
  ): Promise<AIExplainResponse> {
    const systemPrompt = this.buildSystemPrompt(profile);

    let modeInstruction = '';
    switch (mode) {
      case 'line_by_line':
        modeInstruction = 'Provide a line-by-line explanation breaking down what every statement and syntax element does.';
        break;
      case 'logic':
        modeInstruction = 'Explain the core algorithmic logic, decision points (if/else), loops, and mathematical thinking behind the code.';
        break;
      case 'output':
        modeInstruction = 'Provide a detailed dry-run table showing how variables change values step-by-step and show the final predicted output.';
        break;
      case 'keywords':
        modeInstruction = 'Explain every programming keyword, data type, library method, and syntax rule used in this code.';
        break;
      case 'exam':
        modeInstruction = 'Explain the code from an Indian board exam perspective (CBSE / ICSE / State Board). Include marks-scoring points, viva questions, variable description table, and common exam traps.';
        break;
      case 'hindi':
        modeInstruction = 'Explain the code entirely in Hindi (Devanagari script or clean Hindi), keeping code syntax in English.';
        break;
      case 'hinglish':
        modeInstruction = 'Explain the code in conversational Hinglish (Hindi written in Roman script mixed with English tech terms).';
        break;
      case 'simple_english':
      default:
        modeInstruction = 'Explain the code in simple, clear, everyday English with student-friendly analogies.';
        break;
    }

    const userPrompt = [
      `Explain the following ${language} program.`,
      `Explanation Mode Requested: "${mode}".`,
      `Mode-specific Directive: ${modeInstruction}`,
      '',
      `Source Code:\n\`\`\`${language}\n${code}\n\`\`\`\n`,
      'Please return the explanation strictly as a JSON object matching this schema:',
      '{',
      '  "title": "Clear descriptive title of what this program does",',
      '  "mode": "' + mode + '",',
      '  "overview": "High-level summary of the concept and program purpose",',
      '  "sections": [',
      '    {',
      '      "title": "Section Title (e.g. Variable Declaration, Loop Execution)",',
      '      "content": "Detailed explanation for this part",',
      '      "code_snippet": "Relevant line or block of code"',
      '    }',
      '  ],',
      '  "dry_run": [',
      '    {',
      '      "step": 1,',
      '      "variables": { "varName": "value" },',
      '      "explanation": "What happened in this iteration/step"',
      '    }',
      '  ],',
      '  "key_takeaways": [',
      '    "Key point 1 to remember for exams or tests",',
      '    "Key point 2"',
      '  ]',
      '}',
      'Return ONLY valid JSON.',
    ].join('\n');

    const result = await this.callOpenRouter(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      { json: true }
    );

    const title = result.title || `${language.toUpperCase()} Program Explanation`;
    const overview = result.overview || 'Here is the step-by-step explanation of your program.';
    const sections = Array.isArray(result.sections) ? result.sections : [];
    const dryRun = Array.isArray(result.dry_run) ? result.dry_run : undefined;
    const keyTakeaways = Array.isArray(result.key_takeaways) ? result.key_takeaways : [];

    const combinedExplanation = [
      title ? `## ${title}\n` : '',
      overview ? `${overview}\n` : '',
      sections
        .map((s: any) => `### ${s.title}\n${s.content}${s.code_snippet ? `\n\`\`\`${language}\n${s.code_snippet}\n\`\`\`` : ''}`)
        .join('\n\n'),
      keyTakeaways.length > 0
        ? `\n\n### 💡 Key Exam Takeaways:\n` + keyTakeaways.map((k: string) => `- ${k}`).join('\n')
        : '',
    ].filter(Boolean).join('\n\n');

    return {
      title,
      mode,
      overview,
      explanation: combinedExplanation,
      sections,
      dry_run: dryRun,
      key_takeaways: keyTakeaways,
    };
  }

  async processOCR(imageBase64: string, mimeType: string): Promise<OCRResult> {
    if (!config.OPENROUTER_API_KEY) {
      throw serviceUnavailable(
        'AI OCR vision service is unavailable (OPENROUTER_API_KEY is not configured on the server).'
      );
    }

    const systemPrompt = [
      'You are an expert OCR transcription engine specializing in handwritten and textbook computer programming code for school students.',
      'Your task is to transcribe programming code from image with maximum accuracy.',
      'Rules:',
      '1. Transcribe the code line by line, preserving indentation and programming punctuation accurately.',
      '2. Pay extreme attention to easily confused handwritten characters:',
      '   - "0" (digit zero) vs "O" / "o" (letter O)',
      '   - "1" (digit one) vs "l" (lowercase L) vs "I" (capital i) vs "|" (pipe)',
      '   - ";" (semicolon) vs ":" (colon)',
      '   - "{" (curly brace) vs "(" (parenthesis) vs "[" (square bracket)',
      '   - "." (period) vs "," (comma)',
      '   - "=" (single equal) vs "==" (double equal)',
      '   - Quotes: convert curly quotes like “ ” to standard programming straight quotes " and \'',
      '3. For each line, estimate a confidence percentage from 0 to 100.',
      '4. If any character in a line is ambiguous or uncertain, identify its 0-based character index and possible alternatives.',
      '5. Output strictly a JSON object with this structure:',
      '{',
      '  "code": "complete transcribed code as a single string",',
      '  "lines": [',
      '    {',
      '      "line_number": 1,',
      '      "text": "code on line 1",',
      '      "confidence": 95,',
      '      "uncertain_chars": [',
      '        { "char": "l", "position": 10, "alternatives": ["1", "I"] }',
      '      ]',
      '    }',
      '  ],',
      '  "overall_confidence": 92',
      '}',
      'Return ONLY valid JSON.',
    ].join('\n');

    const imageUrl = `data:${mimeType};base64,${imageBase64}`;

    const messages = [
      { role: 'system', content: systemPrompt },
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: 'Transcribe the programming code in this image into structured JSON format with line numbers, confidence scores, and uncertain characters.',
          },
          {
            type: 'image_url',
            image_url: {
              url: imageUrl,
            },
          },
        ],
      },
    ];

    const result = await this.callOpenRouter(messages, {
      json: true,
      model: config.OPENROUTER_VISION_MODEL,
      isVision: true,
    });

    const lines = Array.isArray(result.lines)
      ? result.lines.map((l: any, idx: number) => ({
          line_number: typeof l.line_number === 'number' ? l.line_number : idx + 1,
          text: String(l.text || ''),
          confidence: typeof l.confidence === 'number' ? l.confidence : 90,
          uncertain_chars: Array.isArray(l.uncertain_chars) ? l.uncertain_chars : [],
        }))
      : [];

    const fullCode =
      typeof result.code === 'string' && result.code.length > 0
        ? result.code
        : lines.map((l: { text: string }) => l.text).join('\n');

    const overallConfidence =
      typeof result.overall_confidence === 'number'
        ? result.overall_confidence
        : lines.length > 0
        ? Math.round(lines.reduce((acc: number, cur: { confidence: number }) => acc + cur.confidence, 0) / lines.length)
        : 85;

    return {
      code: fullCode,
      lines,
      overall_confidence: overallConfidence,
    };
  }
}

export const aiService = new AIService();
