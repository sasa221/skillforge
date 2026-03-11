import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { LlmChatRequest, LlmChatResponse, LlmProvider } from './llm-provider';

type OpenAiChatResponse = {
  choices?: Array<{ message?: { content?: string } }>;
  error?: { message?: string };
};

@Injectable()
export class OpenAiCompatibleProvider implements LlmProvider {
  constructor(private readonly config: ConfigService) {}

  async chat(req: LlmChatRequest): Promise<LlmChatResponse> {
    const baseUrl = this.config.get<string>('AI_BASE_URL') ?? 'https://api.openai.com/v1';
    const apiKey = this.config.get<string>('AI_API_KEY');
    const model = this.config.get<string>('AI_MODEL') ?? 'gpt-4o-mini';

    if (!apiKey) {
      throw new Error('AI provider is not configured');
    }

    const res = await fetch(`${baseUrl.replace(/\/$/, '')}/chat/completions`, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${apiKey}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: req.messages,
        max_tokens: req.maxOutputTokens,
        temperature: req.temperature ?? 0.4,
      }),
    });

    const json = (await res.json().catch(() => ({}))) as OpenAiChatResponse;
    if (!res.ok) {
      const msg = json?.error?.message ?? `AI provider error (${res.status})`;
      throw new Error(msg);
    }

    const text = json.choices?.[0]?.message?.content?.trim() ?? '';
    return { text };
  }
}

