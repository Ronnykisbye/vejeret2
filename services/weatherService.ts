
import { GoogleGenAI, Modality } from "@google/genai";
import { WeatherData } from "../types";

const API_KEY = process.env.API_KEY || "";

export const fetchWeatherData = async (city: string): Promise<WeatherData> => {
  const ai = new GoogleGenAI({ apiKey: API_KEY });
  
  const weatherPrompt = `
    Find accurate and up-to-date weather data for the city: "${city}".
    I need the current weather (temperature in Celsius, condition, humidity, wind speed) 
    and a 5-day forecast.
    
    You MUST use Google Search to get real-time results.
    Return the data strictly as a JSON object with this structure:
    {
      "current": {
        "city": "string",
        "temp": number,
        "condition": "string",
        "humidity": number,
        "windSpeed": "string",
        "lastUpdated": "string",
        "description": "string"
      },
      "forecast": [
        {
          "date": "string (YYYY-MM-DD)",
          "dayName": "string",
          "tempHigh": number,
          "tempLow": number,
          "condition": "string"
        }
      ]
    }
    Translate everything into Danish.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: weatherPrompt,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const text = response.text || "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Could not parse weather data.");
    
    const parsedData = JSON.parse(jsonMatch[0]);
    
    // Generate AI Voice Briefing using TTS
    const summaryText = `Her er din vejr-briefing for ${parsedData.current.city}. Det er i øjeblikket ${Math.round(parsedData.current.temp)} grader med ${parsedData.current.condition}. ${parsedData.current.description}. Hav en god dag.`;
    
    let audioBase64 = undefined;
    try {
      const speechResponse = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: summaryText }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Zephyr' },
            },
          },
        },
      });
      audioBase64 = speechResponse.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    } catch (e) {
      console.warn("TTS failed, continuing without voice.");
    }

    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const sources = groundingChunks
      .filter((chunk: any) => chunk.web)
      .map((chunk: any) => ({
        title: chunk.web.title,
        uri: chunk.web.uri
      }));

    return {
      ...parsedData,
      sources,
      audioData: audioBase64
    };
  } catch (error) {
    console.error("Error fetching weather:", error);
    throw error;
  }
};

export const fetchCitySuggestions = async (query: string): Promise<string[]> => {
  if (!query || query.trim().length < 1) return [];
  const ai = new GoogleGenAI({ apiKey: API_KEY });
  const prompt = `Giv mig en liste med 5 rigtige bynavne der minder om eller starter med "${query}". Returnér KUN en JSON-array af strenge.`;
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: { responseMimeType: "application/json" },
    });
    return JSON.parse(response.text || "[]");
  } catch (error) {
    return [];
  }
};
