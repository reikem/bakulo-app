import { db_getGlucoseEntries } from './database';
import { supabase } from './supabaseClient';

export async function askAI(prompt: string, provider: 'gemini' | 'claude', userApiKey?: string) {
  // 1. Obtener contexto de salud local
  const history = await db_getGlucoseEntries();
  const context = `
    Eres un asistente experto en diabetes para la app Serenity en Chile.
    Contexto: Usuario chileno, considera términos locales y sistema GES/AUGE.
    Datos recientes: ${JSON.stringify(history.slice(0, 10))}
    Instrucción: Responde de forma empática, técnica y breve.
  `;

  const fullPrompt = `${context}\n\nUsuario dice: ${prompt}`;

  // CAMINO A: El usuario tiene su propia API Key
  if (userApiKey && userApiKey.trim() !== '') {
    if (provider === 'gemini') {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${userApiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: fullPrompt }] }] })
      });
      const data = await res.json();
      return data.candidates[0].content.parts[0].text;
    }

    if (provider === 'claude') {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': userApiKey,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'claude-3-haiku-20240307',
          max_tokens: 1024,
          messages: [{ role: 'user', content: fullPrompt }]
        })
      });
      const data = await res.json();
      return data.content[0].text;
    }
  }

  // CAMINO B: BaaS (Intermediario seguro vía Supabase Edge Functions)
  // Si no hay key, llamamos a tu función 'serenity-ai-proxy'
  const { data, error } = await supabase.functions.invoke('serenity-ai-proxy', {
    body: { prompt: fullPrompt, provider }
  });

  if (error) throw new Error('Error al conectar con el asistente BaaS');
  return data.reply;
}