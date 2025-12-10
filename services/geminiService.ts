import { GoogleGenAI, Type } from "@google/genai";
import { Chapter } from "../types";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

// Helper to validate API key
export const hasApiKey = () => !!apiKey;

/**
 * Step 1: Generate the Book Outline (Title, Description, Chapters)
 */
export const generateEbookOutline = async (topic: string): Promise<{ title: string; description: string; targetAudience: string; chapters: Omit<Chapter, 'content' | 'status'>[] }> => {
  const model = "gemini-2.5-flash";
  
  const prompt = `
    Atue como um editor de livros best-seller e estrategista de marketing digital.
    Crie a estrutura de um e-book altamente lucrativo e vendável sobre o tema: "${topic}".
    
    O e-book deve ter exatamente 10 capítulos.
    O título deve ser chamativo, usando gatilhos mentais.
    A descrição deve ser persuasiva (copywriting para vendas).
    Defina o público-alvo.
    
    Retorne APENAS um objeto JSON com a seguinte estrutura.
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: "Um título chamativo e vendável para o ebook." },
            description: { type: Type.STRING, description: "Uma descrição curta e persuasiva para a página de vendas (máx 300 caracteres)." },
            targetAudience: { type: Type.STRING, description: "Descrição do público alvo." },
            chapters: {
              type: Type.ARRAY,
              description: "Lista de 10 capítulos.",
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.INTEGER },
                  title: { type: Type.STRING, description: "Título do capítulo." },
                  description: { type: Type.STRING, description: "Breve resumo do que será abordado no capítulo." }
                },
                required: ["id", "title", "description"]
              }
            }
          },
          required: ["title", "description", "targetAudience", "chapters"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    
    return JSON.parse(text);
  } catch (error) {
    console.error("Error generating outline:", error);
    throw error;
  }
};

/**
 * Step 2: Generate the Cover Image
 */
export const generateBookCover = async (title: string, topic: string, audience: string): Promise<string> => {
  // Using Flash Image (Nano Banana) for speed and efficiency as per instructions for general image tasks unless high res requested
  const model = "gemini-2.5-flash-image"; 
  
  const prompt = `
    A professional, high-converting ebook cover for a book titled "${title}".
    Topic: ${topic}.
    Target Audience: ${audience}.
    Style: Minimalist, modern, bold typography, trustworthy, high quality, digital marketing aesthetic.
    No text on the image other than the title if possible, or just abstract symbolic imagery.
    Aspect Ratio 2:3.
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      // No responseMimeType for image models usually, but the SDK handles base64 in parts
    });

    // Check for inline data in parts
    const parts = response.candidates?.[0]?.content?.parts;
    if (parts) {
      for (const part of parts) {
        if (part.inlineData && part.inlineData.data) {
          return part.inlineData.data;
        }
      }
    }
    
    throw new Error("No image data returned");
  } catch (error) {
    console.error("Error generating cover:", error);
    // Return a fallback placeholder if generation fails to avoid breaking the UI
    return "";
  }
};

/**
 * Step 3: Generate Chapter Content
 */
export const generateChapterContent = async (chapterTitle: string, bookTitle: string, bookContext: string): Promise<string> => {
  const model = "gemini-2.5-flash";
  
  const prompt = `
    Escreva o conteúdo completo para o capítulo: "${chapterTitle}" do e-book "${bookTitle}".
    Contexto do livro: ${bookContext}.
    
    Instruções:
    - Escreva em português do Brasil.
    - Use formatação Markdown (títulos, listas, negrito, itálico).
    - O tom deve ser profissional, educativo e engajador.
    - Divida o texto em subtópicos lógicos.
    - Inclua pelo menos um exemplo prático ou estudo de caso se aplicável.
    - Mínimo de 600 palavras.
    - Não inclua o título do capítulo no início (o sistema já adiciona).
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
    });

    return response.text || "Erro ao gerar conteúdo.";
  } catch (error) {
    console.error(`Error generating chapter ${chapterTitle}:`, error);
    return "Ocorreu um erro ao gerar este capítulo. Tente novamente.";
  }
};
