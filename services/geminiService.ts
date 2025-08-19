import { GoogleGenAI } from "@google/genai";

let aiInstance: GoogleGenAI | null = null;

const MISSING_KEY_ERROR = "API_KEY not set as an environment variable.";

export const getAi = (): GoogleGenAI => {
    if (aiInstance) {
        return aiInstance;
    }
    if (!process.env.API_KEY) {
        throw new Error(MISSING_KEY_ERROR);
    }
    aiInstance = new GoogleGenAI({ apiKey: process.env.API_KEY });
    return aiInstance;
};

export const generateImage = async (prompt: string): Promise<string> => {
    const ai = getAi();
    const response = await ai.models.generateImages({
        model: 'imagen-3.0-generate-002',
        prompt: prompt,
        config: {
          numberOfImages: 1,
          outputMimeType: 'image/jpeg',
          aspectRatio: '1:1',
        },
    });

    const base64ImageBytes: string = response.generatedImages[0].image.imageBytes;
    return `data:image/jpeg;base64,${base64ImageBytes}`;
}

export const getSuggestion = async (prompt: string): Promise<string> => {
    const ai = getAi();
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
    });
    return response.text;
};


export const getGeminiErrorText = (error: unknown): string => {
  const defaultMessage = "Sorry, an unexpected error occurred. Please check the browser console and try again.";

  if (error && typeof error === 'object') {
    const anyError = error as any;
    
    if (anyError.message === MISSING_KEY_ERROR) {
        return 'The Gemini API key is missing. Please ensure the API_KEY environment variable is set.';
    }

    // Check for the specific quota error from the Gemini API
    if (anyError.error?.status === 'RESOURCE_EXHAUSTED' || anyError.error?.code === 429) {
      return `You've exceeded your current API quota. Please check your plan and billing details. For more information, please visit: https://ai.google.dev/gemini-api/docs/rate-limits`;
    }

    // Check for a generic error message from the API
    if (anyError.error?.message) {
      return `An API error occurred: ${anyError.error.message}`;
    }

    // Fallback for other types of Error objects
    if (anyError.message) {
      return `An error occurred: ${anyError.message}`;
    }
  }
  
  return defaultMessage;
};