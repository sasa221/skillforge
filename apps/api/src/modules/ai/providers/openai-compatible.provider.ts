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
    const baseUrl =
      this.config.get<string>('AI_BASE_URL') ??
      this.config.get<string>('OPENAI_BASE_URL') ??
      'https://api.openai.com/v1';
    const apiKey =
      this.config.get<string>('AI_API_KEY') ??
      this.config.get<string>('OPENAI_API_KEY') ??
      '';
    const model =
      this.config.get<string>('AI_MODEL') ??
      this.config.get<string>('OPENAI_MODEL') ??
      'gpt-4o-mini';

    const isLocalBase = baseUrl.includes('localhost') || baseUrl.includes('127.0.0.1') || baseUrl.includes('ollama');

    if (!isLocalBase && (!apiKey || apiKey === 'replace_me')) {
      throw new Error('AI provider key missing. Set AI_API_KEY to enable live cloud AI.');
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

  async stream(req: LlmChatRequest): Promise<AsyncIterable<string>> {
    const baseUrl = this.config.get<string>('AI_BASE_URL') ?? this.config.get<string>('OPENAI_BASE_URL') ?? 'https://api.openai.com/v1';
    const apiKey = this.config.get<string>('AI_API_KEY') ?? this.config.get<string>('OPENAI_API_KEY') ?? '';
    const model = this.config.get<string>('AI_MODEL') ?? this.config.get<string>('OPENAI_MODEL') ?? 'gpt-4o-mini';
    
    const isLocalBase = baseUrl.includes('localhost') || baseUrl.includes('127.0.0.1') || baseUrl.includes('ollama');
    if (!isLocalBase && (!apiKey || apiKey === 'replace_me')) {
      throw new Error('AI provider key missing.');
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
        stream: true,
      }),
    });
  
    if (!res.ok || !res.body) {
      throw new Error(`AI provider error (${res.status})`);
    }
  
    // Return an async iterable that yields text chunks
    const body = res.body;
    async function* gen(): AsyncIterable<string> {
      const reader = body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';
        
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed === 'data: [DONE]') continue;
          if (!trimmed.startsWith('data: ')) continue;
          try {
            const json = JSON.parse(trimmed.slice(6));
            const chunk = json.choices?.[0]?.delta?.content ?? '';
            if (chunk) yield chunk;
          } catch { /* ignore parse errors */ }
        }
      }
    }
  
    return gen();
  }
}
