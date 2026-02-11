import { OpenRouterAdapter } from "./openrouter.js"
import { HuggingFaceAdapter } from "./huggingface.js"
import { GeminiAdapter } from "./gemini.js"
import { OpenAIAdapter } from "./openai.js"
import { AnthropicAdapter } from "./anthropic.js"
import { DeepSeekAdapter } from "./deepseek.js"
import { GroqAdapter } from "./groq.js"

/**
 * Factory function to create appropriate adapter for AI provider
 * Each provider now has its own dedicated adapter
 */
export function createAdapter(provider, config) {
  // Extract additional config (temperature, maxTokens) for n8n compatibility
  const { apiKey, model, temperature, maxTokens } = config || {}

  switch (provider) {
    case "google":
    case "gemini":
      return new GeminiAdapter({ apiKey, model })

    case "openai":
      return new OpenAIAdapter({ apiKey, model, temperature, maxTokens })

    case "anthropic":
      return new AnthropicAdapter({ apiKey, model, temperature, maxTokens })

    case "deepseek":
      return new DeepSeekAdapter({ apiKey, model })

    case "groq":
      return new GroqAdapter({ apiKey, model })

    case "openrouter":
      return new OpenRouterAdapter({ apiKey, model })

    case "huggingface":
      return new HuggingFaceAdapter({ apiKey, model })

    default:
      throw new Error(`Unknown AI provider: "${provider}". Supported providers: google, openai, anthropic, deepseek, groq, openrouter, huggingface`)
  }
}
