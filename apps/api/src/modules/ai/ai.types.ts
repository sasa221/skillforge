export type AiMode =
  | 'explain'
  | 'simplify'
  | 'give_example'
  | 'summarize'
  | 'hint'
  | 'quiz_me'
  | 'explain_wrong_answer';

export type ProviderChatMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

