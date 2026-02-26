# MindJournal — AI Voice Journaling for Emotional Well-being

## 📌 Overview
MindJournal is a voice-first AI journaling application that enables users to record daily reflections through speech. The system converts voice to text using **Google Speech-to-Text**, analyzes emotional tone using **Google Gemini**, and visualizes emotional trends over time through dynamic mood graphs.

By combining voice interaction, AI-powered emotional analysis, and secure cloud storage, MindJournal helps users build emotional awareness and monitor their mental well-being consistently.

---

## 🎯 Problem Statement
Many individuals struggle to consistently monitor their mental health. Emotional patterns often go unnoticed until burnout, anxiety, or severe stress occurs. Traditional journaling lacks structured emotional insights and long-term trend visualization.

MindJournal transforms unstructured voice reflections into meaningful emotional insights using AI-powered analysis and visualization.

---

## 🌍 SDG Alignment
**SDG 3 — Good Health & Well-being**

MindJournal promotes proactive emotional awareness, early stress detection, and consistent self-reflection to support mental well-being.

---

## ✨ Key Features
- 🎤 Real-time voice journaling  
- 📝 Google Speech-to-Text transcription  
- 🤖 AI-powered emotional analysis using Google Gemini  
- 📊 Sentiment scoring in percentage (%)  
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

- **Sentiment Score**: 0% to 100% (negative/positive)  
- **Dominant Emotion**: e.g., Distress, Calm, Positive, Anxious  
- **AI Summary**: Short explanation of emotional state  

These insights help users track emotional changes and detect stress patterns over time.

---

## 🔐 Privacy & Security

- Journal entries stored securely in Cloud Firestore  
- Architecture supports encrypted storage (Cloud KMS)  
- Sensitive emotional data handled with privacy in mind  

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
```
---

## 🧩 Technologies Used

- React  
- TypeScript  
- Vite  
- Tailwind CSS  
- shadcn-ui  
- Google Gemini API  
- Google Speech-to-Text  
- Cloud Firestore  

---

## 📊 Impact

MindJournal improves emotional self-awareness by:

- Encouraging consistent reflection  
- Identifying emotional trends over time  
- Providing AI-assisted emotional interpretation  
- Supporting early detection of stress or burnout  

---

## 🔮 Future Improvements

- Weekly AI emotional reports  
- Advanced emotion classification (stress / burnout detection)  
- Therapist and mental health support integration  
- Full encrypted storage via Cloud KMS  
- Large-scale emotional trend analytics  
---
## 💡 Innovation

MindJournal introduces a voice-first emotional journaling experience powered by AI.

Key innovations:

- Real-time emotional analysis from voice journaling
- Automatic mood trend visualization
- AI-generated emotional summaries
- Privacy-focused emotional tracking using Firestore
- Voice → Emotion → Trend pipeline in one integrated system
---
## ⚙️ Technical Challenges & Solutions

During development, several technical challenges were encountered while integrating real-time AI emotional analysis into a live web application.

### 1. Enforcing Reliable JSON Output from Gemini

**Challenge**

Gemini occasionally wrapped its JSON output in markdown formatting (```json) or added conversational filler text. When this raw response was passed directly to the frontend, React failed to parse it using `JSON.parse()`, causing UI components such as emotional summaries and mood charts to break.

**Solution — Dual-Layered Fix**

- **Strict Prompt Engineering**  
  The Gemini prompt was explicitly designed to enforce structured output:

  > "Return ONLY a raw JSON object. Do not include markdown formatting, backticks, or conversational text."

- **Backend Sanitization Layer**  
  A lightweight parser was implemented in the backend to extract valid JSON from the response stream.  
  The system detects the first `{` and the last `}` and isolates only the valid JSON block, removing any unexpected formatting artifacts.

**Result**

- Consistent, crash-free structured data delivery  
- Stable frontend rendering of emotion summaries and mood charts  
- Maintained performance without requiring a custom ML pipeline  

---

### 2. Real-Time Emotional Trend Synchronization

**Challenge**

Ensuring that emotional analysis results from Gemini were processed and reflected immediately in the mood trend graph without delay or UI mismatch.

**Solution**

- Asynchronous backend processing pipeline  
- Structured Firestore data model for fast retrieval  
- Efficient frontend state update for smooth visualization  

**Result**

Accurate, real-time emotional trend visualization after each journal entry.

---

### 3. Secure Handling of Sensitive Emotional Data

**Challenge**

Journal entries contain sensitive emotional information that must be stored securely.

**Solution**

- Cloud Firestore secure storage  
- Architecture designed for encryption via Cloud KMS  
- Structured and isolated data model  

**Result**

Privacy-aware emotional data management suitable for real-world deployment.

---
## 📈 Scalability

MindJournal is designed to scale using Google Cloud infrastructure:

- Firestore supports large-scale emotional data storage
- Gemini API enables scalable AI analysis
- Cloud deployment allows multi-user expansion
- Architecture supports future mobile app integration
---

## 🚀 Accessing the Application

### Live Demo
(Insert your Lovable published link here)

### Demo Video: 
(YouTube link)

---
## 📄 Project Presentation

Slides: ([GoogleSlide link](https://docs.google.com/presentation/d/1IoJqTIStDfLeRltd5Q5eFDduGu81BESPVdJ5d2a8MkU/edit?usp=sharing))
