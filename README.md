# 🏥 AI Medical Assistant (Professional Version)

A high-accuracy, privacy-focused medical report analysis system. This project uses **Google Gemini Pro** to extract clinical data, simplify technical jargon for patients, and provide robust medical history tracking.

---

## 📽️ Documentation & Guides
> [!IMPORTANT]
> **Getting Started?**
> Read our full [**Developer Handbook**](file:///Users/apple/Documents/Projects/ai-medical-assistant/docs/developer_handbook.md) for a step-by-step setup guide, architecture diagrams, and contribution rules.

- [**System Documentation**](file:///Users/apple/Documents/Projects/ai-medical-assistant/docs/DOCUMENTATION.md)
- [**Project Architecture**](file:///Users/apple/Documents/Projects/ai-medical-assistant/docs/project_architecture.md)

---

## 📂 Project Structure

- **`frontend/`**: Modern React + Tailwind dashboard for doctors and patients.
- **`back-end/`**: Python Flask server with Gemini AI + PostgreSQL support.
- **`docs/`**: Detailed project documentation and architecture.

---

## 🚀 Quick Start (Backend)

1. **Install Dependencies**:
   ```bash
   cd back-end && pip install -r requirements.txt
   ```
2. **Environment**: Add `GEMINI_API_KEY` to your `.env` file.
3. **Run Server**:
   ```bash
   python back-end/app/main.py
   ```

---

## ✨ Features
- **Gemini Pro AI**: High-accuracy medical analysis (summaries, vitals, entities).
- **Persistent History**: All reports are saved to a professional database (SQLite/PostgreSQL).
- **Healthcare OCR**: Advanced image preprocessing via OpenCV.
- **Multi-language**: High-quality simplified Arabic & English outputs.