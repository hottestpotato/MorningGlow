import { BedAnalysisResult } from "../types";

/**
 * Client-side wrapper that calls the backend `/api/analyze` endpoint.
 * The real GenAI call runs server-side so the API key stays secret.
 */
export const analyzeBedImage = async (base64Image: string): Promise<BedAnalysisResult> => {
  try {
    const resp = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ base64Image }),
    });

    if (!resp.ok) {
      const text = await resp.text();
      throw new Error(`Server error ${resp.status}: ${text}`);
    }

    const json = await resp.json();
    return json as BedAnalysisResult;
  } catch (err) {
    console.error('analyzeBedImage failed:', err);
    return {
      score: 50,
      feedback: '서버와 연결할 수 없어 정확한 분석이 불가합니다. 나름 정리하신 점은 훌륭해요!'
    };
  }
};
