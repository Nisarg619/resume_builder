import { createOpenAI } from "@ai-sdk/openai";
import { generateText, streamText, type LanguageModel } from "ai";
import { logger } from "./logger.js";
import crypto from "node:crypto";

// OpenRouter is OpenAI-compatible
const openrouter = createOpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env["OPENROUTER_API_KEY"] || "",
  headers: {
    "HTTP-Referer": process.env["SITE_URL"] || "https://resume-ai.app",
    "X-Title": "ResumeAI",
  },
});

const DEFAULT_FREE_MODEL = "deepseek/deepseek-chat-v3-0324:free";
const DEFAULT_PRO_MODEL = "anthropic/claude-3.5-sonnet";
const FALLBACK_FREE_MODEL = "google/gemini-pro-1.5";
const FALLBACK_PRO_MODEL = "openai/gpt-4o";

export type AIModelType = "free" | "pro";

// Capped in-memory cache for AI responses (prevents memory leaks)
const MAX_CACHE_SIZE = 100;
const aiCache = new Map<string, { result: string; expiry: number }>();
const CACHE_TTL = 1000 * 60 * 60; // 1 hour

/**
 * Centralized AI service to handle OpenRouter integration with optimization
 */
export class AIService {
  private static instance: AIService;

  private constructor() {}

  public static getInstance(): AIService {
    if (!AIService.instance) {
      AIService.instance = new AIService();
    }
    return AIService.instance;
  }

  private getCacheKey(prompt: string, modelType: string): string {
    return crypto.createHash("md5").update(`${modelType}:${prompt}`).digest("hex");
  }

  public getModel(type: AIModelType = "free", useFallback = false): LanguageModel {
    if (useFallback) {
      const modelName = type === "pro" 
        ? (process.env["OPENROUTER_MODEL_PRO_FALLBACK"] || FALLBACK_PRO_MODEL)
        : (process.env["OPENROUTER_MODEL_FREE_FALLBACK"] || FALLBACK_FREE_MODEL);
      return openrouter(modelName);
    }

    const modelName = type === "pro" 
      ? (process.env["OPENROUTER_MODEL_PRO"] || DEFAULT_PRO_MODEL)
      : (process.env["OPENROUTER_MODEL_FREE"] || DEFAULT_FREE_MODEL);
    
    return openrouter(modelName);
  }

  public async generate(params: {
    prompt: string;
    system?: string;
    modelType?: AIModelType;
    temperature?: number;
    maxTokens?: number;
    useCache?: boolean;
    timeout?: number;
  }) {
    const { 
      prompt, 
      system, 
      modelType = "free", 
      temperature = 0.7, 
      maxTokens, 
      useCache = true,
      timeout = 30000 // 30s default timeout
    } = params;

    // 1. Check Cache
    if (useCache) {
      const cacheKey = this.getCacheKey(prompt + (system || ""), modelType);
      const cached = aiCache.get(cacheKey);
      if (cached && cached.expiry > Date.now()) {
        logger.debug({ cacheKey, modelType }, "AI Cache Hit");
        return cached.result;
      }
    }
    
    try {
      const result = await this.executeGenerate(prompt, system, modelType, temperature, maxTokens, false, timeout);
      
      // 2. Save to Cache
      if (useCache) {
        const cacheKey = this.getCacheKey(prompt + (system || ""), modelType);
        if (aiCache.size >= MAX_CACHE_SIZE) {
          const firstKey = aiCache.keys().next().value;
          if (firstKey !== undefined) aiCache.delete(firstKey);
        }
        aiCache.set(cacheKey, { result, expiry: Date.now() + CACHE_TTL });
      }

      return result;
    } catch (err: any) {
      if (err.status && (err.status >= 500 || err.status === 429)) {
        logger.warn({ err, modelType }, "Primary AI failed, trying fallback...");
        return await this.executeGenerate(prompt, system, modelType, temperature, maxTokens, true, timeout + 15000);
      }
      throw err;
    }
  }

  private async executeGenerate(
    prompt: string,
    system: string | undefined,
    modelType: AIModelType,
    temperature: number,
    maxTokens: number | undefined,
    useFallback: boolean,
    timeout: number
  ) {
    const model = this.getModel(modelType, useFallback);
    const abortController = new AbortController();
    const timeoutId = setTimeout(() => abortController.abort(), timeout);
    
    try {
      const result = await generateText({
        model,
        prompt,
        system,
        temperature,
        maxRetries: 2,
        abortSignal: abortController.signal,
      });

      if (result.usage) {
        logger.info({
          model: result.response.modelId,
          usage: result.usage,
          type: modelType,
          fallback: useFallback
        }, "AI usage logged");
      }

      return result.text;
    } catch (err: any) {
      if (err.name === "AbortError") {
        throw new Error(`AI request timed out after ${timeout}ms`);
      }
      this.handleError(err, modelType, useFallback);
      throw err;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  public async stream(params: {
    prompt: string;
    system?: string;
    modelType?: AIModelType;
    temperature?: number;
  }) {
    const { prompt, system, modelType = "free", temperature = 0.7 } = params;
    const model = this.getModel(modelType);

    return streamText({
      model,
      prompt,
      system,
      temperature,
      maxRetries: 2,
      onFinish: (result) => {
        if (result.usage) {
          logger.info({
            model: result.response.modelId,
            usage: result.usage,
            type: modelType,
            stream: true
          }, "AI usage logged (stream)");
        }
      }
    });
  }

  private handleError(err: any, modelType: AIModelType, useFallback: boolean) {
    logger.error({ err, modelType, fallback: useFallback, status: err.status }, "AI Service Error");
    
    if (err.status === 429) throw new Error("AI service rate limited. Try again later.");
    if (err.status === 401) throw new Error("AI auth failed.");
    if (err.status === 402) throw new Error("AI quota exceeded.");
    
    throw new Error(err.message || "AI generation failed");
  }
}

export const aiService = AIService.getInstance();


