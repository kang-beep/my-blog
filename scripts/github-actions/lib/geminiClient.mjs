const DEFAULT_MODEL = "gemini-flash-latest";
const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta";

export function getGeminiModelName() {
  return process.env.GEMINI_MODEL?.trim() || DEFAULT_MODEL;
}

export class GeminiQuotaError extends Error {
  constructor(message) {
    super(message);
    this.name = "GeminiQuotaError";
  }
}

export function isGeminiQuotaError(error) {
  if (error instanceof GeminiQuotaError) {
    return true;
  }
  const message = String(error?.message ?? error ?? "");
  return /RESOURCE_EXHAUSTED|quota|rate limit|Too Many Requests|429/i.test(message);
}

/**
 * Call Gemini generateContent and parse a JSON object from the response text.
 */
export async function generateJsonWithGemini({ apiKey, model, systemText, userText }) {
  const modelId = model || getGeminiModelName();
  const url = `${GEMINI_API_BASE}/models/${modelId}:generateContent?key=${encodeURIComponent(apiKey)}`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: {
        parts: [{ text: systemText }],
      },
      contents: [
        {
          role: "user",
          parts: [{ text: userText }],
        },
      ],
      generationConfig: {
        temperature: 0.4,
        responseMimeType: "application/json",
      },
    }),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = payload?.error?.message || JSON.stringify(payload).slice(0, 400);
    const detail = `Gemini API failed (${response.status}): ${message}`;
    if (response.status === 429 || isGeminiQuotaError({ message: detail })) {
      throw new GeminiQuotaError(detail);
    }
    throw new Error(detail);
  }

  const text = payload?.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("") ?? "";
  if (!text.trim()) {
    throw new Error("Gemini returned empty content");
  }

  return {
    model: modelId,
    rawText: text,
    data: parseJsonObject(text),
  };
}

function parseJsonObject(text) {
  const trimmed = text.trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    const start = trimmed.indexOf("{");
    const end = trimmed.lastIndexOf("}");
    if (start >= 0 && end > start) {
      return JSON.parse(trimmed.slice(start, end + 1));
    }
    throw new Error(`Could not parse Gemini JSON: ${trimmed.slice(0, 200)}`);
  }
}
