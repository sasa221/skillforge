import { ProviderChatMessage } from '../ai.types';

export type LlmChatRequest = {
  messages: ProviderChatMessage[];
  maxOutputTokens: number;
  temperature?: number;
};

export type LlmChatResponse = {
  text: string;
};

export interface LlmProvider {
  chat(req: LlmChatRequest): Promise<LlmChatResponse>;
}

