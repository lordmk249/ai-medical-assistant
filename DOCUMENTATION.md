# AI Medical Assistant - Documentation

## Overview
The **AI Medical Assistant** is a web-based application designed to facilitate communication between doctors and patients by analyzing medical reports. It extracts text from images/PDFs, identifies medical entities (diseases, medications, etc.), summarizes the content for doctors, and provides a simplified explanation for patients.

## Technology Stack

### Backend
- **Framework**: Python + Flask
- **OCR (Optical Character Recognition)**: Google Cloud Vision API (extracts text from images/PDFs).
- **Entity Extraction**: AWS Comprehend Medical (identifies diseases, medications, treatments).
- **Summarization**: Hugging Face Transformers (summarizes long reports).
- **Translation**: Azure AI Translator (translates/simplifies text for patients).

### Frontend
- **Framework**: React + Vite
- **Styling**: Tailwind CSS
- **Design**: Modern, responsive dashboard with separate views for Doctors and Patients.

## Workflow Steps

1. **Upload**: User uploads a medical report (Image or PDF) via the React frontend.
2. **Preprocessing**:
   - If PDF: Converted to images using `pdf2image`.
   - Images are sent to **Google Cloud Vision** to extract raw text.
3. **Analysis**:
   - Extracted text is sent to **AWS Comprehend Medical**.
   - Entities are identified and grouped into categories:
     - *Diseases & Symptoms*
     - *Medications*
     - *Tests & Treatments*
     - *Personal Information*
4. **Summarization**:
   - The full text is summarized using a **Hugging Face** model (`sshleifer/distilbart-cnn-12-6`) to create a concise clinical summary.
5. **Patient Simplification**:
   - The summary (or text) is sent to **Azure Translator** to translate it into the patient's preferred language (e.g., Arabic, English, French).
6. **Display**:
   - **Doctor's View**: Shows the clinical summary and structured list of entities.
   - **Patient's View**: Shows the simplified/translated explanation.
   - **Raw View**: Shows the original extracted text.

## Configuration

The application requires API keys for the external services. These are stored in `back-end/.env`:

```env
GOOGLE_APPLICATION_CREDENTIALS=path/to/google-credentials.json
AWS_ACCESS_KEY_ID=your_aws_key
AWS_SECRET_ACCESS_KEY=your_aws_secret
AWS_REGION=us-east-1
AZURE_TRANSLATOR_KEY=your_azure_key
AZURE_TRANSLATOR_REGION=your_azure_region
AZURE_TRANSLATOR_ENDPOINT=https://api.cognitive.microsofttranslator.com/
```

## Running the Project

1. **Backend**:
   ```bash
   cd back-end
   # Activate environment (e.g., conda activate ai-med-py311)
   python -m app.main
   ```

2. **Frontend**:
   ```bash
   cd my-react-tailwind-app
   npm run dev
   ```
