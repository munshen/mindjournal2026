//server.js
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const speech = require('@google-cloud/speech');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const admin = require("firebase-admin");
require('dotenv').config();

const app = express();
const server = http.createServer(app);

// Use specific allowed origins instead of wildcard
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:8080'];

const io = new Server(server, { cors: { origin: ALLOWED_ORIGINS } });

// --- 1. Firestore Setup ---
// Use environment variable for credentials instead of file path
const serviceAccount = process.env.GOOGLE_SERVICE_ACCOUNT_JSON
  ? JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON)
  : (() => { throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON env var is required'); })();

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: process.env.PROJECTID
});

const db = admin.firestore();
db.settings({ databaseId: '(default)' });
db.collection('test').get()
  .then(() => console.log("🔥 Firestore Connection: SUCCESS"))
  .catch((err) => console.error("❌ Firestore Connection: FAILED", err.message));

// --- 2. Google Clients ---
// Use Application Default Credentials or env-based credentials
const speechClient = process.env.GOOGLE_SERVICE_ACCOUNT_JSON
  ? new speech.SpeechClient({ credentials: serviceAccount })
  : new speech.SpeechClient();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// --- Helper: Filter Filler Words ---
const cleanText = (text) => {
    const fillers = /\b(um|uh|hmm|err|ah)\b/gi;
    return text.replace(fillers, "").replace(/\s\s+/g, ' ').trim();
};

// --- Helper: Verify Firebase Auth Token ---
const verifyAuthToken = async (token) => {
  if (!token) return null;
  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    return decodedToken;
  } catch (err) {
    return null;
  }
};

// --- 3. Socket.IO Authentication Middleware ---
io.use(async (socket, next) => {
  // TEMP: skip auth for local dev
  socket.userId = "dev-user";
  next();

  // const token = socket.handshake.auth?.token;
  // const user = await verifyAuthToken(token);
  // if (!user) return next(new Error('Authentication required'));
  // socket.userId = user.uid;
  // next();
});

// --- 4. Live Socket Logic ---
io.on('connection', (socket) => {
    console.log('Authenticated client connected:', socket.userId);

    // Load only this user's entries from Firestore
    // With this temporarily:
    db.collection('entries')
        .orderBy('timestamp', 'desc')
        .get()
        .then(snapshot => {
            if (snapshot.empty) {
                socket.emit('loadHistory', []);
                return;
            }
            const history = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            socket.emit('loadHistory', history);
        })
        .catch(err => {
            console.error("Firestore load failed", { code: err.code, userId: socket.userId });
            socket.emit('loadHistory', []);
        });

    let recognizeStream = null;
    let fullTranscript = "";
    let lastInterimTranscript = "";
    let totalAudioBytes = 0;
    let streamTimeout = null;
    const MAX_SESSION_BYTES = 50 * 1024 * 1024; // 50MB max per session
    const MAX_STREAM_DURATION_MS = 5 * 60 * 1000; // 5 minutes max

    // --- Delete with ownership verification ---
    socket.on('deleteEntry', async (id) => {
        if (!id || typeof id !== 'string' || id.length > 128) {
            socket.emit('error', 'Invalid entry ID');
            return;
        }
        try {
            const doc = await db.collection('entries').doc(id).get();
            if (!doc.exists || doc.data().userId !== socket.userId) {
                socket.emit('error', 'Entry not found or unauthorized');
                return;
            }
            await db.collection('entries').doc(id).delete();
            console.log("Deleted entry:", id);
        } catch (e) {
            console.error("Delete failed", { code: e.code });
            socket.emit('error', 'Failed to delete entry');
        }
    });

    socket.on('startStream', (userLanguage = 'en-US') => {
        fullTranscript = "";
        totalAudioBytes = 0;

        // Set stream timeout
        if (streamTimeout) clearTimeout(streamTimeout);
        streamTimeout = setTimeout(() => {
            if (recognizeStream) {
                recognizeStream.end();
                recognizeStream = null;
                socket.emit('error', 'Stream duration limit exceeded');
            }
        }, MAX_STREAM_DURATION_MS);

        recognizeStream = speechClient
            .streamingRecognize({
                config: {
                    encoding: 'LINEAR16',
                    sampleRateHertz: 16000,
                    languageCode: userLanguage,
                    alternativeLanguageCodes: ['ms-MY', 'zh-CN', 'zh-HK', 'en-US'],
                    interimResults: true,
                    enableAutomaticPunctuation: true,
                },
            })
            .on('error', (err) => {
                console.error('STT stream error', { code: err.code });
                if (recognizeStream) {
                    recognizeStream.destroy();
                    recognizeStream = null;
                }
            })
            .on('data', (data) => {
                const result = data.results[0];
                if (result && result.alternatives[0]) {
                    const transcript = result.alternatives[0].transcript;
                    
                    if (result.isFinal) {
                        fullTranscript += transcript + " ";
                        lastInterimTranscript += "";
                        socket.emit('transcriptUpdate', {
                            text: fullTranscript.trim(),
                            isFinal: true
                        });
                    } else {
                        lastInterimTranscript = transcript;
                        socket.emit('transcriptUpdate', {
                            text: (fullTranscript + transcript).trim(),
                            isFinal: false
                        });
                    }
                }
            });
    });

    socket.on('audioData', (chunk) => {
        // Validate chunk is a buffer and within size limits
        if (!chunk || !(chunk instanceof Buffer || chunk instanceof ArrayBuffer || ArrayBuffer.isView(chunk))) {
            return;
        }
        const chunkSize = chunk.byteLength || chunk.length;
        if (chunkSize > 65536) { // Max 64KB per chunk
            socket.emit('error', 'Audio chunk too large');
            return;
        }
        totalAudioBytes += chunkSize;
        if (totalAudioBytes > MAX_SESSION_BYTES) {
            socket.emit('error', 'Session size limit exceeded');
            if (recognizeStream) {
                recognizeStream.end();
                recognizeStream = null;
            }
            return;
        }
        if (recognizeStream && recognizeStream.writable) {
            recognizeStream.write(chunk);
        }
    });

    socket.on('stopStream', async () => {
        console.log("🛑 stopStream called, fullTranscript:", fullTranscript);
        
        if (streamTimeout) {
            clearTimeout(streamTimeout);
            streamTimeout = null;
        }
        await new Promise(resolve => {
            if (recognizeStream) {
                recognizeStream.on('end', resolve);
                recognizeStream.end();
            } else {
                resolve();
            }
        });
        recognizeStream = null;
        
            const finalText = cleanText(fullTranscript);
            console.log("📝 finalText after clean:", finalText); 
            if (!finalText) {
                console.log("⚠️ finalText is empty, returning early"); 
                return;
            }

        try {
            console.log("🤖 Calling Gemini 2.5 Flash...");
            const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
            const prompt = `
                You are a deeply empathetic and supportive best friend/journaling companion. 
                Analyze the emotional tone of this entry: "${finalText}"
                
                IMPORTANT: Detect the language of the entry and respond in that SAME language. If the entry is in Cantonese, reply in Cantonese. If Malay, reply in Malay. Always match the user's language.

                TONE & ADVICE RULES:
                - If the user is SAD or STRESSED: Offer a gentle, human comforting sentence and one small piece of actionable, warm advice.
                - If the user is HAPPY or SUCCESSFUL: Be genuinely enthusiastic!
                
                SCORING RULES:
                - "sentiment": "positive", "neutral", or "negative".
                - "score": 0.0 (Painful) to 1.0 (Joyful). 
                
                Return ONLY JSON:
                {
                "sentiment": "string",
                "score": number,
                "emotion": "one word",
                "summary": "Your warm, human response here",
                "advice": "A short, caring suggestion based on their mood"
                }
            `;

            const result = await model.generateContent(prompt);
            const responseText = result.response.text();
            
            const jsonMatch = responseText.match(/\{[\s\S]*\}/);
            const cleanJson = jsonMatch ? jsonMatch[0] : responseText;
            const analysis = JSON.parse(cleanJson);

            // Save with user ID for data isolation
            const entry = {
                userId: socket.userId,
                text: finalText,
                ...analysis,
                timestamp: admin.firestore.FieldValue.serverTimestamp(),
                date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                dayOfWeek: new Date().toLocaleDateString('en-US', { weekday: 'short' }),
                time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
            };

            const docRef = await db.collection('entries').add(entry);
            
            socket.emit('saveComplete', { id: docRef.id, ...entry });
            console.log("Entry saved:", docRef.id);

        } catch (e) { 
            console.error("Analysis/save failed", e.message, e);
            socket.emit('error', 'Failed to analyze or save entry');
        }
    });

    socket.on('disconnect', () => {
        if (streamTimeout) clearTimeout(streamTimeout);
        if (recognizeStream) {
            recognizeStream.destroy();
            recognizeStream = null;
        }
    });
});

// Global error handler
process.on('uncaughtException', (err) => {
    console.error('Uncaught exception', { message: err.message, code: err.code });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
