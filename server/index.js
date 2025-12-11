require('dotenv').config();
const express = require('express');
const { GoogleGenAI, Type } = require('@google/genai');

const app = express();

// Increase payload limit for large base64 images
app.use(express.json({ limit: '10mb' }));

// Enable CORS for localhost development
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.warn('⚠️  GEMINI_API_KEY not set in server/.env or environment');
}

const ai = new GoogleGenAI({ apiKey: apiKey || '' });

/**
 * POST /api/analyze
 * Accepts base64Image and returns { score, feedback }
 */
app.post('/api/analyze', async (req, res) => {
  const { base64Image } = req.body;
  console.log(`--> POST /api/analyze received, body keys: ${Object.keys(req.body).join(', ')}`);

  if (!base64Image) {
    return res.status(400).json({ error: 'base64Image is required' });
  }

  // Strip data URI prefix if present
  const cleanBase64 = base64Image.replace(/^data:image\/\w+;base64,/, '');

  try {
    // New structured prompt: request breakdown scores + confidence + computed score
    const promptText = `You are a precise evaluator for bed neatness. Analyze the photo and return ONLY JSON with the following fields:\n` +
      `neatness: integer 0-100 (overall neatness)\n` +
      `corners: integer 0-100 (tucked corners and sheet edges)\n` +
      `pillows: integer 0-100 (pillow alignment and symmetry)\n` +
      `confidence: number 0.0-1.0 (model's confidence)\n` +
      `score: integer 0-100 (computed as round(0.5*neatness + 0.3*corners + 0.2*pillows))\n` +
      `feedback: string (one short encouraging sentence in Korean)\n` +
      `Ensure numbers are within the specified ranges. Return JSON only.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: cleanBase64,
            },
          },
          {
            text: promptText,
          },
        ],
      },
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            neatness: { type: Type.INTEGER },
            corners: { type: Type.INTEGER },
            pillows: { type: Type.INTEGER },
            confidence: { type: Type.NUMBER },
            score: { type: Type.INTEGER },
            feedback: { type: Type.STRING },
          },
          required: ['neatness','corners','pillows','confidence','score','feedback'],
        },
      },
    });

    if (!response.text) {
      console.error('No text response from GenAI, full response:', response);
      return res.status(502).json({ error: 'No text response from GenAI' });
    }

    // Parse and validate the structured result
    let parsed;
    try {
      parsed = JSON.parse(response.text);
    } catch (e) {
      console.error('Failed to parse GenAI text as JSON:', response.text);
      return res.status(502).json({ error: 'Invalid JSON from GenAI' });
    }

    // Basic validation helper
    const inRangeInt = (v) => Number.isInteger(v) && v >= 0 && v <= 100;
    const inRangeNum = (v) => typeof v === 'number' && v >= 0.0 && v <= 1.0;

    if (!inRangeInt(parsed.neatness) || !inRangeInt(parsed.corners) || !inRangeInt(parsed.pillows) || !inRangeNum(parsed.confidence) || !inRangeInt(parsed.score) || typeof parsed.feedback !== 'string') {
      console.error('GenAI response failed validation:', parsed);
      // Return fallback structured response
      return res.status(502).json({ error: 'GenAI response validation failed', raw: parsed });
    }

    // All good
    return res.json(parsed);
  } catch (err) {
    console.error('❌ GenAI API error:', err);
    return res.status(500).json({
      score: 50,
      feedback: '서버 오류로 정확한 분석이 불가합니다. 시도해 주셔서 감사합니다!',
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, 'localhost', () => {
  console.log(`✅ Server listening on http://localhost:${PORT}`);
  console.log(`   POST /api/analyze - Bed image analysis endpoint`);
  console.log(`   GET /health - Health check`);
});
