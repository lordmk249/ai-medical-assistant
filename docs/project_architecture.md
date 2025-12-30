# Project Technology Stack & Architecture

This document contains a diagram of the technologies used in the AI Medical Assistant project and their data flow. You can edit the diagram below by modifying the Mermaid code.

```mermaid
flowchart TD
    %% Nodes
    User([User])
    
    subgraph Frontend ["Frontend (React + Vite)"]
        UI[User Interface]
        Upload[File Upload]
        Display[Result Display]
        Style[Tailwind CSS + Framer Motion]
    end
    
    subgraph Backend ["Backend (Python + Flask)"]
        API[API Endpoint /process]
        
        subgraph Preprocessing ["Preprocessing"]
            PDF{Is PDF?}
            Poppler[pdf2image / Poppler]
            ImgProc[Image Processing]
        end
        
        subgraph CoreAI ["AI Processing"]
            OCR[OCR Engine<br/>(Tesseract / Google Vision)]
            NER[Named Entity Recognition<br/>(SciSpaCy)]
            Sum[Summarization<br/>(HF Transformers)]
            Trans[Translation<br/>(MarianMT / Azure)]
        end
    end
    
    Output([JSON Response])

    %% Connections
    User -->|Uploads File| UI
    UI --> Upload
    Upload -->|POST /process| API
    
    API --> PDF
    PDF -- Yes --> Poppler
    Poppler -->|Images| OCR
    PDF -- No --> ImgProc
    ImgProc --> OCR
    
    OCR -->|Extracted Text| NER
    OCR -->|Extracted Text| Sum
    
    Sum -->|Summary Text| Trans
    
    NER -->|Medical Entities| Output
    Sum -->|Summary| Output
    Trans -->|Translated Text| Output
    OCR -->|Raw Text| Output
    
    Output -->|Data| Display
    Display -->|Visuals| User
    
    %% Styling
    classDef user fill:#f9f,stroke:#333,stroke-width:2px;
    classDef front fill:#e1f5fe,stroke:#01579b,stroke-width:2px;
    classDef back fill:#e8f5e9,stroke:#2e7d32,stroke-width:2px;
    classDef ai fill:#fff3e0,stroke:#ef6c00,stroke-width:2px;
    
    class User user;
    class UI,Upload,Display,Style front;
    class API,PDF,Poppler,ImgProc back;
    class OCR,NER,Sum,Trans ai;
```

## Technologies List

### Frontend
- **Framework**: React 19
- **Build Tool**: Vite
- **Styling**: Tailwind CSS 4, Framer Motion (Animations)
- **Icons**: Lucide React
- **State/Fetching**: TanStack Query
- **Routing**: React Router DOM

### Backend
- **Server**: Flask
- **OCR**: Tesseract (via `pytesseract`) or Google Vision API
- **PDF Handling**: `pdf2image` (requires Poppler), `PyPDF2`
- **NLP / NER**: `spacy` + `scispacy` models (`en_ner_bc5cdr_md`)
- **Summarization**: Hugging Face `transformers` pipeline
- **Translation**: `MarianMT` (Hugging Face) or Azure Translator
