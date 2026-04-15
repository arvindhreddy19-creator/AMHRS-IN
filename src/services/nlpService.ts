import { GoogleGenAI, Type } from "@google/genai";

export async function analyzeMedicalText(text: string) {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY" || apiKey === "") {
    console.warn("Using fallback NLP: No valid GEMINI_API_KEY found.");
    // Fallback rule-based NLP if no API key
    const ageMatch = text.match(/(\d+)\s*(year|yr|yo)/i);
    const age = ageMatch ? parseInt(ageMatch[1]) : 45;
    const heartKeywords = ["chest pain", "heart", "cardiac", "stroke", "palpitations"];
    const symptoms = heartKeywords.filter(k => text.toLowerCase().includes(k));
    const isHighRisk = (age && age > 60) || symptoms.length > 0;
    
    return {
      age,
      gender: text.toLowerCase().includes("female") ? "Female" : "Male",
      symptoms: symptoms.length > 0 ? symptoms : ["General symptoms"],
      diagnosis: "Preliminary Analysis (Fallback)",
      riskLevel: isHighRisk ? "High" : "Low",
      summary: text,
      medications: []
    };
  }

  const ai = new GoogleGenAI({ apiKey });

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Analyze the following unstructured medical text and extract patient information in JSON format. 
      Ensure the output is strictly valid JSON.
      
      Medical Text: "${text}"`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            age: { type: Type.NUMBER },
            gender: { type: Type.STRING },
            symptoms: { type: Type.ARRAY, items: { type: Type.STRING } },
            diagnosis: { type: Type.STRING },
            medications: { type: Type.ARRAY, items: { type: Type.STRING } },
            riskLevel: { type: Type.STRING, enum: ["Low", "Medium", "High"] },
            summary: { type: Type.STRING }
          },
          required: ["age", "symptoms", "riskLevel", "summary"]
        }
      }
    });

    const rawText = response.text || "";
    console.log("NLP Raw Response:", rawText);
    
    if (!rawText.trim()) {
      throw new Error("The AI returned an empty response. Please try again with more detailed text.");
    }
    
    // Clean potential markdown or extra text
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    const cleanJson = jsonMatch ? jsonMatch[0] : rawText;
    
    try {
      return JSON.parse(cleanJson);
    } catch (parseErr) {
      console.error("JSON Parse Error:", parseErr, "Raw Text:", rawText);
      throw new Error("Failed to parse the AI response. The text might be too complex or ambiguous.");
    }
  } catch (err: any) {
    console.error("NLP Analysis Error:", err);
    if (err.message?.includes("API key not valid")) {
      throw new Error("Invalid Gemini API key. Please check your configuration in AI Studio Secrets.");
    }
    throw new Error(err.message || "Failed to analyze medical text. Please check your API key and input.");
  }
}
