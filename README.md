# MindVoice — AI Voice Journaling for Emotional Well-being

## 📌 Overview
MindVoice is a voice-first AI journaling application that enables users to record daily reflections through speech. The system converts voice to text using **Google Speech-to-Text**, analyzes emotional tone using **Google Gemini**, and visualizes emotional trends over time through dynamic mood graphs.

By combining voice interaction, AI-powered emotional analysis, and secure cloud storage, MindVoice helps users build emotional awareness and monitor their mental well-being consistently.

---

## 🎯 Problem Statement
Many individuals struggle to consistently monitor their mental health. Emotional patterns often go unnoticed until burnout, anxiety, or severe stress occurs. Traditional journaling lacks structured emotional insights and long-term trend visualization.

MindVoice transforms unstructured voice reflections into meaningful emotional insights using AI-powered analysis and visualization.

---

## 🌍 SDG Alignment
**SDG 3 — Good Health & Well-being**

MindVoice promotes proactive emotional awareness, early stress detection, and consistent self-reflection to support mental well-being.

---

## ✨ Key Features
- 🎤 Real-time voice journaling  
- 📝 Google Speech-to-Text transcription  
- 🤖 AI-powered emotional analysis using Google Gemini  
- 📊 Sentiment scoring (-1 to +1)  
- 🧠 Dominant emotion detection (e.g., Distress, Calm, Positive, Anxious)  
- 📈 Dynamic mood trend visualization  
- ☁️ Secure journal storage using Cloud Firestore  
- 🔐 Architecture designed for encrypted storage (Cloud KMS-ready)  

---

## 🤖 AI Integration (Google Gemini)

Google Gemini is used to:

- Analyze emotional tone of journal entries  
- Generate structured sentiment score  
- Identify dominant emotional state  
- Produce AI-generated emotional summaries  
- Support emotional trend tracking over time  

AI converts raw voice journaling into actionable emotional insights.

---

## ☁️ Google Technologies Used

- **Google Gemini API** — Emotional analysis and insights  
- **Google Speech-to-Text API** — Voice-to-text transcription  
- **Cloud Firestore** — Secure journal data storage  
- **Google Cloud Platform (GCP)** — Backend infrastructure  
- **Cloud KMS (architecture-ready)** — Encryption support  
- **Firebase Hosting** — Web deployment  

---

## 🏗 System Architecture

1. User records voice journal entry via web interface  
2. Audio sent to Google Speech-to-Text → converted to text  
3. Transcribed text sent to Google Gemini API  
4. Gemini returns:
   - Sentiment score  
   - Dominant emotion  
   - Emotional summary  
5. Journal data stored securely in Cloud Firestore  
6. Mood trend graph updates dynamically  

## 🔄 Architecture Flow Diagram
The following diagram illustrates the end-to-end emotional analysis pipeline:
```
User Voice Input (Web Application)
        ↓
Google Speech-to-Text API
(Voice → Transcribed Text)
        ↓
Transcribed Journal Entry
        ↓
Google Gemini API
(Emotion Analysis • Sentiment Score • AI Summary)
        ↓
Backend Processing (Application Logic)
        ↓
Cloud Firestore
(Secure Journal Storage)
        ↓
Mood Trend Visualization (Frontend Dashboard)
```

---

## 🧠 AI Emotional Output

Each journal entry generates:

- **Sentiment Score**: -1 (negative) to +1 (positive)  
- **Dominant Emotion**: e.g., Distress, Calm, Positive, Anxious  
- **AI Summary**: Short explanation of emotional state  

These insights help users track emotional changes and detect stress patterns over time.

---

## 🔐 Privacy & Security

- Journal entries stored securely in Cloud Firestore  
- Architecture supports encrypted storage (Cloud KMS)  
- Sensitive emotional data handled with privacy in mind  

---

## 🚀 Accessing the Application

### Live Demo
(Insert your Lovable published link here)

---

## 🛠 Editing the Project

### Use Lovable
Open the project in Lovable:
https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID

Changes made in Lovable are automatically synced to this GitHub repository.

### Use Your Own IDE (Optional)
If working locally:

```bash
git clone <YOUR_GIT_URL>
cd <YOUR_PROJECT_NAME>
npm install
npm run dev
