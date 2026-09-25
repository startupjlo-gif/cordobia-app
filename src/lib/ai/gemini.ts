import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

export async function promptGeminiAgent(
  systemInstruction: string,
  userMessage: string,
  history: { role: string; text: string }[] = []
): Promise<string> {
  if (!genAI) {
    console.log('[AI Agent] No GEMINI_API_KEY configured. Returning fallback response.');
    return userMessage; // Fallback
  }

  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      systemInstruction: systemInstruction
    });

    const chatHistory = history.map(h => ({
      role: h.role === 'agente' ? 'model' : 'user',
      parts: [{ text: h.text }]
    }));

    const chat = model.startChat({ history: chatHistory });
    const result = await chat.sendMessage(userMessage);
    const responseText = result.response.text();
    return responseText.trim();
  } catch (error) {
    console.error('[AI Agent Error]', error);
    return userMessage;
  }
}

export async function generarResumenEjecutivoIA(
  nombreEmpresa: string,
  sector: string,
  agujeroPrincipal: string,
  semaforo: string,
  saludN1: number,
  saludN2: number,
  saludN3: number
): Promise<string> {
  const systemPrompt = `Eres un consultor experto en transformación digital para pymes en España.
Tu tarea es redactar un resumen ejecutivo claro, conciso (máximo 3 frases) y profesional en español de España (tuteo respetuoso) para el diagnóstico de la empresa ${nombreEmpresa} (sector: ${sector}).

Datos calculados por el motor determinista:
- Agujero principal de fuga: ${agujeroPrincipal}
- Estado del Semáforo: ${semaforo.toUpperCase()}
- Salud Nivel 1 (Operativo): ${saludN1}%
- Salud Nivel 2 (Coordinación): ${saludN2}%
- Salud Nivel 3 (Estratégico): ${saludN3}%

REGLA OBLIGATORIA: No inventes números ni puntuaciones diferentes a los proporcionados. Destaca la prioridad de conectar áreas si el semáforo es rojo.`;

  if (!genAI) {
    return `La empresa ${nombreEmpresa} (${sector}) presenta un diagnóstico clasificado en semáforo ${semaforo.toUpperCase()}. Se evidencia un foco prioritario en el área de ${agujeroPrincipal}, con un Nivel 2 de Coordinación al ${saludN2}%. Se recomienda abordar la hoja de ruta a 30 días para sistematizar el paso de información e implantar tableros de coordinación.`;
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent(systemPrompt);
    return result.response.text().trim();
  } catch (err) {
    console.error('[AI Resumen Error]', err);
    return `La empresa ${nombreEmpresa} (${sector}) presenta un diagnóstico clasificado en semáforo ${semaforo.toUpperCase()}. Se evidencia un foco prioritario en el área de ${agujeroPrincipal}, con un Nivel 2 de Coordinación al ${saludN2}%. Se recomienda abordar la hoja de ruta a 30 días para sistematizar el paso de información e implantar tableros de coordinación.`;
  }
}
