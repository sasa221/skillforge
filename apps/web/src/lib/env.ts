import { z } from 'zod';

// Coerce empty/whitespace to undefined so default applies (Railway build may have unset var)
const urlSchema = z.preprocess(
  (v) => (typeof v === 'string' && v.trim() ? v.trim() : undefined),
  z.string().url().default('http://localhost:3200'),
);

const envSchema = z.object({
  NEXT_PUBLIC_API_BASE_URL: urlSchema,
});

export const env = envSchema.parse({
  NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
});

