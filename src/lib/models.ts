export const MODELS = [
  { id: "openai/gpt-4o-mini", name: "GPT-4o mini", provider: "OpenAI" },
  {id: "anthropic/claude-haiku-5.5", name : " claude-haiku-5.5", provider: "Anthropic"},
   { id: "google/gemini-3.8-flash", name: "Gemini 3.8 Flash", provider: "Google" },
  { id: "meta-llama/llama-3.1-8b-instruct", name: "Llama 3.1 8B", provider: "Meta" },
  // { id: "mistral/mistral-7b-instruct", name: "Mistral 7B", provider: "Mistral" },
];

export const DEFAULT_MODEL_ID = MODELS[0].id;

export function isValidModelId(id: string): boolean {
  return MODELS.some((model) => model.id === id);
}