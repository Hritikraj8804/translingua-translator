# 🌐 TransLingua AI - Offline Neural Translation Matrix

<div align="center">

![TransLingua Logo](https://img.shields.io/badge/TransLingua-Neural%20AI-00ffff?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDJMMTMuMDkgOC4yNkwyMCA5TDEzLjA5IDE1Ljc0TDEyIDIyTDEwLjkxIDE1Ljc0TDQgOUwxMC45MSA4LjI2TDEyIDJaIiBmaWxsPSIjMDBmZmZmIi8+Cjwvc3ZnPgo=)

**Advanced offline translation system with a conversational AI interface**

[![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=flat&logo=fastapi)](https://fastapi.tiangolo.com/)
[![Meta NLLB](https://img.shields.io/badge/Model-NLLB_600M-blue?style=flat)]()
[![Python](https://img.shields.io/badge/Python-3776AB?style=flat&logo=python&logoColor=white)](https://python.org/)
[![License](https://img.shields.io/badge/License-MIT-00ff7f?style=flat)](LICENSE)

</div>

---

## 🚀 Overview

**TransLingua** is a cutting-edge, **100% offline** AI translation application. Powered by Meta's NLLB (No Language Left Behind) sequence-to-sequence model and a blazing fast FastAPI backend, it provides highly accurate contextual translations across 25+ languages.

We've recently upgraded the UI to feature a sleek, **ChatGPT-style conversational interface** complete with translation sessions and a rich dark-mode design.

### ✨ Key Features

- 🌍 **25+ Languages** - Including major global and Indian languages.
- 🧠 **Completely Offline AI** - Runs locally on your machine using Meta's `nllb-200-distilled-600M` model. No API keys required!
- 💬 **Conversational Interface** - Translates text seamlessly within an intuitive chat layout.
- 🗂️ **Session History** - Automatically groups and caches your translations into click-to-resume sessions using SQLite.
- ⚡ **Lightweight Frontend** - Built entirely with pure HTML, CSS, and JS (no build step necessary).

---

## 🛠️ Project Structure

The repository is modularized into two primary pieces:

```text
translingua-translator/
│
├── backend/
│   ├── main.py                # FastAPI server and endpoints
│   ├── services.py            # HuggingFace NLLB model controller
│   ├── database.py            # SQLite schema configuration
│   ├── requirements.txt       # Python dependencies
│   ├── translingua.db         # Generated local SQLite database
│   └── scripts/
│       └── download_nllb.py   # Utility script to pre-fetch the 2.4GB AI Model
│
└── frontend/
    ├── index.html             # The Main Chat UI
    ├── style.css              # Premium responsive dark-mode styling
    └── app.js                 # Core frontend logic & chat engine
```

---

## 🚀 How to Run the Project

Running the project is simple and requires zero external API keys! 

### Part 1: Start the Backend

1. **Navigate to the Backend Directory**:
   ```bash
   cd backend
   ```

2. **Create and Activate a Virtual Environment** (Optional but recommended):
   ```bash
   python -m venv venv
   # On Windows:
   .\venv\Scripts\activate
   # On Mac/Linux:
   source venv/bin/activate
   ```

3. **Install Dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Download the AI Model (First Run Only)**:
   This will download the Meta NLLB model to your HuggingFace cache (~2.4GB). You only need to do this once!
   ```bash
   python scripts/download_nllb.py
   ```

5. **Start the FastAPI Server**:
   ```bash
   python main.py
   ```
   *The backend will now be actively listening on `http://localhost:8000`.*

### Part 2: Open the Frontend

Because the frontend is built using standard, frameworkless web technologies, you don't need a complex build step.

1. Navigate to the `frontend` folder in your File Explorer.
2. Double-click the `index.html` file to open it in your browser.
   *(Alternatively, use an extension like **Live Server** in VS Code, or run `python -m http.server 3000` from the frontend folder in a new terminal tab).*
3. Enjoy offline, instant translations alongside your continuous chat history!

---

## 🔒 Privacy & Architecture

- **No Data Leaves Your Machine**: Since the model runs entirely on your local hardware, no text is sent to external servers.
- **Relational Cache System**: Sent translations are stored locally in an SQLite data store (`backend/translingua.db`).

---

## 👥 Development Team

- **Lead Developer**: Hritik Raj
- **AI Specialist**: Mounika Vemala
- **UI/UX Designer**: Sannidhiraju Sai Vinay Sarma
- **Backend Engineer**: Sri Nandana Lahari Sivakavi
