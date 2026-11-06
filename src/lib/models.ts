export type Model = {
  id: string;
  name: string;
  provider: string;
  vision: boolean;
  tools: boolean;
};

export const MODELS: Model[] = [
  {
    id: "openai/gpt-4o-mini",
    name: "GPT-4o mini",
    provider: "OpenAI",
    vision: true,
    tools: true,
  },
  {
    id: "anthropic/claude-haiku-5.5",
    name: "Claude Haiku 5.5",
    provider: "Anthropic",
    vision: true,
    tools: true,
  },
  {
    id: "google/gemini-3.8-flash",
    name: "Gemini 3.8 Flash",
    provider: "Google",
    vision: true,
    tools: true,
  },
  {
    id: "meta-llama/llama-3.1-8b-instruct",
    name: "Llama 3.1 8B",
    provider: "Meta",
    vision: false,
    tools: false,
  },
];

export const DEFAULT_MODEL_ID = MODELS[0].id;

export function isValidModelId(id: string): boolean {
  return MODELS.some((model) => model.id === id);
}

export function getModel(id: string): Model | undefined {
  return MODELS.find((model) => model.id === id);
}