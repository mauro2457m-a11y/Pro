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
    Atue como um editor chefe de uma grande editora de best-sellers e especialista em marketing de resposta direta.
    Sua tarefa é criar a estrutura de um e-book altamente lucrativo ("high ticket") sobre o tema: "${topic}".
    
    Requisitos OBRIGATÓRIOS:
    1. O e-book deve ter EXATAMENTE 10 capítulos.
    2. Título: Deve ser magnético, usar gatilhos mentais (curiosidade, promessa, ganância) e parecer um best-seller da Amazon.
    3. Descrição: Um texto persuasivo de vendas (copywriting) focado na dor e no desejo do cliente.
    4. Capítulos: Devem seguir uma ordem lógica de aprendizado, do básico ao avançado, com títulos instigantes.
    
    Retorne APENAS um objeto JSON válido.
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
            title: { type: Type.STRING, description: "Título matador para o e-book." },
            description: { type: Type.STRING, description: "Copy de vendas persuasiva para o livro." },
            targetAudience: { type: Type.STRING, description: "Definição clara do avatar/público alvo." },
            chapters: {
              type: Type.ARRAY,
              description: "Lista exata de 10 capítulos.",
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.INTEGER },
                  title: { type: Type.STRING, description: "Título atraente do capítulo." },
                  description: { type: Type.STRING, description: "O que o leitor vai aprender neste capítulo." }
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
  const model = "gemini-2.5-flash-image"; 
  
  const prompt = `
    A stunning, commercial book cover design for a book titled "${title}".
    Topic: ${topic}.
    Target Audience: ${audience}.
    Style: Professional, best-seller aesthetic, bold typography, high contrast.
    The image should look like a finished product.
    Minimal text (only the title).
    Aspect Ratio 2:3 (Vertical).
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
    });

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
    return "";
  }
};

/**
 * Step 3: Generate Chapter Content
 */
export const generateChapterContent = async (chapterTitle: string, bookTitle: string, bookContext: string): Promise<string> => {
  const model = "gemini-2.5-flash";
  
  const prompt = `
    Escreva o conteúdo COMPLETO e PROFUNDO para o capítulo: "${chapterTitle}" do livro "${bookTitle}".
    Contexto do livro: ${bookContext}.
    
    Diretrizes de Conteúdo (Foco em Valor para Venda):
    1. O conteúdo deve ser acionável e prático. Evite enrolação.
    2. Use um tom de autoridade e empatia.
    3. Use formatação Markdown rica:
       - Use subtítulos (## e ###) para quebrar o texto.
       - Use listas (bullets) para facilitar a leitura.
       - Use negrito (**texto**) para enfatizar pontos chave.
    4. Estrutura sugerida:
       - Introdução engajadora (Hook).
       - Desenvolvimento do conceito.
       - Exemplo prático ou Estudo de Caso.
       - "Dica de Ouro" ou exercício prático.
       - Conclusão breve do capítulo.
    5. Tamanho: Pelo menos 800 palavras de conteúdo de alta qualidade.
    
    Retorne apenas o corpo do texto em Markdown.
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