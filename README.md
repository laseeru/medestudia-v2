# MedEstudia v2

An AI-powered medical education platform designed for Cuban medical students, offering educational support for preclinical and clinical studies, as well as structured navigation of clinical guidelines. The platform is bilingual (Spanish-first with English toggle) and optimized for low-resource healthcare contexts.

## Features

### Preclínico (Preclinical)
- **Subject Navigation**: Access 10 core preclinical subjects (Anatomy, Histology, Cell Biology, Biochemistry, Physiology, Microbiology, Parasitology, Immunology, Biostatistics, Pharmacology)
- **Study Tools**:
  - **MCQ Generator**: Generate topic-specific multiple-choice questions with difficulty levels (Easy, Medium, Hard)
  - **Quick Quiz**: 5-question quizzes with immediate feedback and scoring
  - **Topic Explainer**: Structured explanations with key features, diagnostic approaches, and low-resource considerations
  - **Statistics**: Track your study progress with local score tracking

### Clínico (Clinical)
- **Clinical Study Mode**: Educational preparation for clinical rotations and exams
  - Organized by clinical rotations (Internal Medicine, Surgery, Pediatrics, Gynecology, General Medicine)
  - System-based navigation (Cardiovascular, Respiratory, Endocrine, Gastrointestinal, Neurological, Renal)
  - Same study tools as Preclínico adapted for clinical contexts
- **Clinical Guidelines Mode**: Structured step-by-step guidance based on representative clinical guidelines
  - Protocol-based approach with warnings and source notes
  - Disclaimer gate for appropriate educational use

### AI-Powered Chat
- Context-aware chat interface that adapts to the selected mode and subject
- Responses explicitly reference user topics
- Guidelines mode returns structured, step-based information

### Additional Features
- **Bilingual Support**: Spanish-first interface with English toggle (language preference persists)
- **Local Score Tracking**: Quiz results saved to localStorage (no login required)
- **Chat History**: Last 20 messages per section persisted locally
- **AI Status Indicator**: Real-time status display (Online / Limited / Offline)
- **Error Handling**: Friendly error messages with retry functionality

## Tech Stack

- **Frontend**: 
  - React 18 with TypeScript
  - Vite for build tooling
  - Tailwind CSS for styling
  - shadcn/ui component library
  - React Router for navigation
  - React Query for state management

- **Backend**:
  - Vercel Serverless Functions
  - DeepSeek Chat API (OpenAI-compatible endpoint)

- **AI Integration**:
  - DeepSeek Chat model (`deepseek-chat`)
  - Server-side API key management
  - Strict JSON-only responses with robust error handling

## Setup Instructions

### Prerequisites
- Node.js 18+ (recommend using [nvm](https://github.com/nvm-sh/nvm))
- npm or yarn package manager

### Installation

1. **Clone the repository**
```sh
git clone <YOUR_GIT_URL>
   cd medestudia-ayuda-pro
   ```

2. **Install dependencies**
   ```sh
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env.local` file in the project root:
   ```env
   DEEPSEEK_API_KEY=your_deepseek_api_key_here
   ```
   
   **Important**: Never commit API keys to version control. The `.env.local` file should be in `.gitignore`.

4. **Start development server**
   ```sh
npm run dev
```

   The app will be available at `http://localhost:8080` (or the port specified in `vite.config.ts`).

### Build & Preview

- **Build for production**:
  ```sh
  npm run build
  ```

- **Preview production build**:
  ```sh
  npm run preview
  ```

- **Lint code**:
  ```sh
  npm run lint
  ```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DEEPSEEK_API_KEY` | Your DeepSeek API key for AI responses | Yes |

### Getting a DeepSeek API Key

1. Sign up at [DeepSeek](https://platform.deepseek.com/)
2. Navigate to API Keys section
3. Create a new API key
4. Add it to your `.env.local` file

## Deployment

### Vercel Deployment

The project is configured for Vercel deployment:

1. **Connect your repository** to Vercel
2. **Set environment variables** in Vercel Dashboard:
   - Go to Project Settings → Environment Variables
   - Add `DEEPSEEK_API_KEY` with your API key
3. **Deploy**: Vercel will automatically deploy on push to main branch

The `/api/ai.ts` file is automatically recognized as a Vercel Serverless Function and will be deployed to `https://your-domain.vercel.app/api/ai`.

### Custom Domain

To connect a custom domain:
- Navigate to Project Settings → Domains in Vercel Dashboard
- Add your custom domain
- Follow DNS configuration instructions

## Project Structure

```
medestudia-ayuda-pro/
├── api/
│   └── ai.ts              # Vercel serverless function for DeepSeek API
├── src/
│   ├── components/        # React components
│   │   ├── ChatInterface.tsx
│   │   ├── MCQGenerator.tsx
│   │   ├── QuickQuiz.tsx
│   │   ├── TopicExplainer.tsx
│   │   └── ui/            # shadcn/ui components
│   ├── contexts/          # React contexts
│   │   ├── LanguageContext.tsx
│   │   └── AIStatusContext.tsx
│   ├── hooks/             # Custom React hooks
│   │   └── useScoreTracking.ts
│   ├── lib/
│   │   ├── aiClient.ts    # AI API client helper
│   │   └── utils.ts
│   ├── pages/             # Page components
│   │   ├── Index.tsx
│   │   ├── Preclinical.tsx
│   │   ├── Clinical.tsx
│   │   ├── ClinicalStudy.tsx
│   │   └── ClinicalGuidelines.tsx
│   └── main.tsx           # App entry point
├── public/                # Static assets
├── package.json
├── vite.config.ts
├── tailwind.config.ts
└── README.md
```

## Safety & Disclaimer

**Important**: This platform is designed for **educational purposes only**.

- **Educational Content**: All AI-generated content is representative and intended for learning and study purposes only.
- **Not for Clinical Decision-Making**: This tool does NOT replace professional medical judgment or real clinical decision-making.
- **Representative Guidelines**: Clinical guidelines mode uses representative content. Official Cuban clinical guidelines will be integrated later using retrieval-augmented generation (RAG) techniques after corresponding institutional approval.
- **Hypothetical Cases**: Clinical study mode presents hypothetical cases for educational purposes only.

Users are required to acknowledge these disclaimers before accessing Clinical Guidelines mode.

## Local Storage

The application uses browser localStorage (no login required) for:
- **Language preference** (`medestudia_language`)
- **Quiz scores and statistics** (`medestudia_scores`)
- **Chat history** (`medestudia_chat_*`, last 20 messages per section)
- **AI status** (`medestudia_ai_status`)

All data is stored locally and is not transmitted to any external servers except for AI API calls.

## Contribution

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Style

- Use TypeScript for all new files
- Follow existing code patterns and component structure
- Ensure all components are properly typed
- Add error handling for all API calls
- Test locally before submitting PRs

## License

This project is private and proprietary. All rights reserved.

## Support

For issues, questions, or suggestions, please open an issue in the repository or contact the development team.

---

**Version**: 2.0.0  
**Last Updated**: 2024
