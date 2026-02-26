const express = require('express');
const cors = require('cors');
const multer = require('multer');
const speech = require('@google-cloud/speech');
const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Set up Multer for memory storage
const upload = multer({ storage: multer.memoryStorage() });

// Initialize Google Cloud Clients
// Note: STT automatically finds your google-credentials.json if the GOOGLE_APPLICATION_CREDENTIALS env var is set, 
// but we can pass the path directly for ease during prototyping.
const speechClient = new speech.SpeechClient({ keyFilename: './google-credentials.json' });
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.post('/api/journal/voice', upload.single('audio'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'No audio file provided' });
        
        console.log("Processing audio...");

        // 1. Google Speech-to-Text
        const audio = { content: req.file.buffer.toString('base64') };
        const config = {
            encoding: 'WEBM_OPUS', // Standard format from Chrome MediaRecorder
            sampleRateHertz: 48000,
            languageCode: 'en-US',
        };
        
        const [sttResponse] = await speechClient.recognize({ audio, config });
        const transcript = sttResponse.results
            .map(result => result.alternatives[0].transcript)
            .join('\n');

        if (!transcript) {
            return res.status(400).json({ error: 'Could not transcribe audio. Please try speaking louder.' });
        }
        console.log("Transcription successful:", transcript);

        // 2. Google Gemini Emotional Analysis
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        const prompt = `
            You are an AI emotional analyzer for a journaling app. Analyze the following journal entry.
            Return ONLY a raw JSON object with no markdown formatting or code blocks. The JSON must have the following keys:
            - "sentimentScore": A float between -1.0 (very negative) and 1.0 (very positive).
            - "dominantEmotion": A single word describing the main emotion.
            - "summary": A compassionate, one-sentence summary of the entry.
            - "uiMood": Categorize the emotion into exactly one of these three strings: "positive", "neutral", or "negative".
            
            Journal Entry: "${transcript}"
        `;

        const geminiResult = await model.generateContent(prompt);
        const aiResponseText = geminiResult.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
        const analysis = JSON.parse(aiResponseText);

        // 3. Return everything to the frontend
        res.json({
            transcript: transcript,
            analysis: analysis
        });

    } catch (error) {
        console.error("Error processing request:", error);
        res.status(500).json({ error: 'Failed to process audio and analyze emotions.' });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));