import dotenv from 'dotenv';

dotenv.config();

export interface Config {
  PORT: number;
  FRONTEND_URL: string;
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  OPENROUTER_API_KEY: string;
  OPENROUTER_MODEL: string;
  OPENROUTER_VISION_MODEL: string;
  JUDGE0_URL: string;
  JUDGE0_API_KEY: string;
  MAX_IMAGE_MB: number;
  MAX_PAGES: number;
  RUN_RATE_LIMIT_PER_MIN: number;
  AI_RATE_LIMIT_PER_MIN: number;
  MAX_EXECUTION_TIME_SEC: number;
  MAX_MEMORY_MB: number;
  MAX_OUTPUT_SIZE_KB: number;
}

const parseNumber = (val: string | undefined, defaultValue: number): number => {
  if (!val) return defaultValue;
  const parsed = parseInt(val, 10);
  return isNaN(parsed) ? defaultValue : parsed;
};

export const config: Config = {
  PORT: parseNumber(process.env.PORT, 4000),
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',
  SUPABASE_URL: process.env.SUPABASE_URL || '',
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY || '',
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY || '',
  OPENROUTER_MODEL: process.env.OPENROUTER_MODEL || 'openrouter/free',
  OPENROUTER_VISION_MODEL: process.env.OPENROUTER_VISION_MODEL || 'nvidia/nemotron-3.5-super-vl:free',
  JUDGE0_URL: process.env.JUDGE0_URL || 'https://judge0-ce.p.rapidapi.com',
  JUDGE0_API_KEY: process.env.JUDGE0_API_KEY || '',
  MAX_IMAGE_MB: parseNumber(process.env.MAX_IMAGE_MB, 10),
  MAX_PAGES: parseNumber(process.env.MAX_PAGES, 10),
  RUN_RATE_LIMIT_PER_MIN: parseNumber(process.env.RUN_RATE_LIMIT_PER_MIN, 20),
  AI_RATE_LIMIT_PER_MIN: parseNumber(process.env.AI_RATE_LIMIT_PER_MIN, 30),
  MAX_EXECUTION_TIME_SEC: parseNumber(process.env.MAX_EXECUTION_TIME_SEC, 10),
  MAX_MEMORY_MB: parseNumber(process.env.MAX_MEMORY_MB, 128),
  MAX_OUTPUT_SIZE_KB: parseNumber(process.env.MAX_OUTPUT_SIZE_KB, 128),
};
