const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const speech = require('@google-cloud/speech');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const admin = require("firebase-admin");
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

// --- 1. Firestore Setup ---
const serviceAccount = require('./google-credentials.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  // FORCE the ID to the one where you saw the 'entries' collection in the console
  projectId: "mindjournal-26" 
});

const db = admin.firestore();
// Force the default database settings
db.settings({ databaseId: '(default)' });

// --- 2. Google Clients ---
const speechClient = new speech.SpeechClient({
    keyFilename: './google-credentials.json' 
});

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// --- Helper: Filter Filler Words ---
const cleanText = (text) => {
    // Strips common fillers as whole words, case-insensitive, and fixes double spaces
    const fillers = /\b(um|uh|hmm|err|ah)\b/gi;
    return text.replace(fillers, "").replace(/\s\s+/g, ' ').trim();
};

// --- 3. Live Socket Logic ---
io.on('connection', (socket) => {
    console.log('Client connected for live audio');

    // Load existing entries from Firestore and send to client on connection
    db.collection('entries').orderBy('timestamp', 'desc').get()
        .then(snapshot => {
            if (snapshot.empty) {
                socket.emit('loadHistory', []);
                return;
            }
            const history = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            socket.emit('loadHistory', history);
        })
        .catch(err => {
            console.error("Firestore Error:", err.message);
            socket.emit('loadHistory', []); // Send empty array so frontend doesn't hang
        });

    let recognizeStream = null;
    let fullTranscript = ""; // Persistent accumulator for the session

    // --- NEW: Delete Functionality ---
    socket.on('deleteEntry', async (id) => {
        try {
            await db.collection('entries').doc(id).delete();
            console.log("Deleted entry from Firestore:", id);
        } catch (e) {
            console.error("Delete Error:", e);
        }
    });

    socket.on('startStream', () => {
        fullTranscript = ""; // Reset accumulator for new session
        recognizeStream = speechClient
            .streamingRecognize({
                config: {
                    encoding: 'LINEAR16',
                    sampleRateHertz: 16000,
                    languageCode: 'en-US',
                    interimResults: true,
                },
            })
            .on('error', (err) => {
                console.error('STT Error:', err);
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
                        // Append the finished segment to our global transcript
                        fullTranscript += transcript + " ";
                        socket.emit('transcriptUpdate', {
                            text: fullTranscript.trim(),
                            isFinal: true
                        });
                    } else {
                        // Show the history plus the current live guess
                        socket.emit('transcriptUpdate', {
                            text: (fullTranscript + transcript).trim(),
                            isFinal: false
                        });
                    }
                }
            });
    });

    socket.on('audioData', (chunk) => {
        if (recognizeStream && recognizeStream.writable) {
            recognizeStream.write(chunk);
        }
    });

    socket.on('stopStream', async () => {
        if (recognizeStream) {
            recognizeStream.end();
            recognizeStream = null;
        }
        
        // --- CLEAN THE TEXT BEFORE SAVING OR ANALYZING ---
        const finalText = cleanText(fullTranscript);
        if (!finalText) return;

        try {
            // --- 4. Gemini Analysis ---
            const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
            const prompt = `
                Analyze the emotional tone of this journal entry.
                Return ONLY a raw JSON object with no markdown formatting:
                {
                  "sentiment": "positive" | "neutral" | "negative",
                  "score": 0.0 to 1.0,
                  "emotion": "one word describing dominant state",
                  "summary": "one compassionate sentence"
                }
                Entry: "${finalText}"
            `;

            const result = await model.generateContent(prompt);
            const responseText = result.response.text();
            
            // Robust JSON cleaning using regex to find content between curly braces
            const jsonMatch = responseText.match(/\{[\s\S]*\}/);
            const cleanJson = jsonMatch ? jsonMatch[0] : responseText;
            const analysis = JSON.parse(cleanJson);

            // --- 5. Save to Firestore ---
            const entry = {
                text: finalText,
                ...analysis,
                timestamp: admin.firestore.FieldValue.serverTimestamp(),
                date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                dayOfWeek: new Date().toLocaleDateString('en-US', { weekday: 'short' }),
                time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
            };

            const docRef = await db.collection('entries').add(entry);
            
            // Send complete entry back to frontend
            socket.emit('saveComplete', { id: docRef.id, ...entry });
            console.log("Entry saved to Firestore:", docRef.id);

        } catch (e) { 
            console.error("Analysis/Save Error:", e);
            socket.emit('error', 'Failed to analyze or save entry');
        }
    });
});

// Global error handler to prevent server crashes
process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
});

server.listen(5000, () => console.log('Live streaming server on port 5000'));