import { aiService } from './ai.js';
import { OCRResult, OCRLine } from '../types/index.js';
import { badRequest } from '../utils/errors.js';

export interface PageImageInput {
  base64: string;
  mimeType: string;
  pageNumber: number;
}

export class OCRService {
  /**
   * Process multiple page images sequentially or in parallel,
   * stitch code together with correct continuous line numbering,
   * and post-process with heuristic ambiguity detection.
   */
  async processImages(images: PageImageInput[]): Promise<OCRResult> {
    if (!images || images.length === 0) {
      throw badRequest('No images provided for OCR processing.');
    }

    // Sort images by ascending page number
    const sortedImages = [...images].sort((a, b) => a.pageNumber - b.pageNumber);

    // Process each image through AI vision model
    const pageResults: OCRResult[] = [];
    for (const img of sortedImages) {
      const pageResult = await aiService.processOCR(img.base64, img.mimeType);
      pageResults.push(pageResult);
    }

    // Combine lines and adjust line numbers continuously across pages
    const combinedLines: OCRLine[] = [];
    let currentLineOffset = 0;

    for (let p = 0; p < pageResults.length; p++) {
      const page = pageResults[p];
      for (const line of page.lines) {
        currentLineOffset += 1;
        combinedLines.push({
          ...line,
          line_number: currentLineOffset,
          uncertain_chars: line.uncertain_chars ? [...line.uncertain_chars] : [],
        });
      }
    }

    // Post-process lines to detect and flag ambiguous programming symbols
    const analyzedLines = this.analyzeConfidence(combinedLines);

    // Calculate overall confidence
    const overallConfidence =
      analyzedLines.length > 0
        ? Math.round(
            analyzedLines.reduce((acc, curr) => acc + curr.confidence, 0) / analyzedLines.length
          )
        : 80;

    const fullCode = analyzedLines.map((l) => l.text).join('\n');

    return {
      code: fullCode,
      lines: analyzedLines,
      overall_confidence: overallConfidence,
    };
  }

  /**
   * Analyzes lines for common optical character recognition ambiguities in programming code:
   * 0 vs O/o, 1 vs l vs I vs |, ; vs :, { vs ( vs [, curly quotes vs straight quotes.
   */
  private analyzeConfidence(lines: OCRLine[]): OCRLine[] {
    return lines.map((line) => {
      const text = line.text;
      const uncertain = [...(line.uncertain_chars || [])];
      let confidencePenalty = 0;

      // 1. Detect curly / smart quotes (frequent in pasted / scanned code)
      for (let i = 0; i < text.length; i++) {
        const char = text[i];
        if (char === '“' || char === '”') {
          if (!uncertain.some((u) => u.position === i)) {
            uncertain.push({
              char,
              position: i,
              alternatives: ['"'],
            });
            confidencePenalty += 3;
          }
        } else if (char === '‘' || char === '’') {
          if (!uncertain.some((u) => u.position === i)) {
            uncertain.push({
              char,
              position: i,
              alternatives: ["'"],
            });
            confidencePenalty += 3;
          }
        }
      }

      // 2. Detect colon where semicolon is expected at line end in Java/C/C++
      const trimmedEnd = text.trimEnd();
      if (trimmedEnd.endsWith(':') && !trimmedEnd.startsWith('case ') && !trimmedEnd.startsWith('default:')) {
        const pos = text.lastIndexOf(':');
        if (!uncertain.some((u) => u.position === pos)) {
          uncertain.push({
            char: ':',
            position: pos,
            alternatives: [';'],
          });
          confidencePenalty += 5;
        }
      }

      // 3. Detect semicolon where colon is expected in Python (def, if, for, while, class)
      if (/^\s*(def|if|elif|else|for|while|class|try|except|finally)\b.*[;]$/.test(trimmedEnd)) {
        const pos = text.lastIndexOf(';');
        if (!uncertain.some((u) => u.position === pos)) {
          uncertain.push({
            char: ';',
            position: pos,
            alternatives: [':'],
          });
          confidencePenalty += 6;
        }
      }

      // 4. Detect number 0 vs uppercase letter O in numeric literals
      const numWithOMatch = text.match(/\b\d+[O|o]+\d*\b/g);
      if (numWithOMatch) {
        for (const token of numWithOMatch) {
          const idx = text.indexOf(token);
          for (let k = 0; k < token.length; k++) {
            if (token[k] === 'O' || token[k] === 'o') {
              const charPos = idx + k;
              if (!uncertain.some((u) => u.position === charPos)) {
                uncertain.push({
                  char: token[k],
                  position: charPos,
                  alternatives: ['0'],
                });
                confidencePenalty += 5;
              }
            }
          }
        }
      }

      // 5. Detect 1 vs lowercase l in identifiers or numbers
      const digitWithLMatch = text.match(/\b\d+l+\d*\b/g);
      if (digitWithLMatch) {
        for (const token of digitWithLMatch) {
          const idx = text.indexOf(token);
          for (let k = 0; k < token.length; k++) {
            if (token[k] === 'l') {
              const charPos = idx + k;
              if (!uncertain.some((u) => u.position === charPos)) {
                uncertain.push({
                  char: 'l',
                  position: charPos,
                  alternatives: ['1', 'I'],
                });
                confidencePenalty += 4;
              }
            }
          }
        }
      }

      const finalConfidence = Math.max(20, Math.min(100, line.confidence - confidencePenalty));

      return {
        ...line,
        confidence: finalConfidence,
        uncertain_chars: uncertain,
      };
    });
  }
}

export const ocrService = new OCRService();
