# SehatBeat

**India's first voice-first, bilingual, offline-capable AI health bridge.**

SehatBeat is not a diagnostic tool. It is the intelligent middle layer between a patient and care — it listens, triages, guides, and connects. Built for the 500 million Indians who have no doctor nearby, no English, and no internet-dependent health tool built for them.

Live at [sehatbeat-ai.vercel.app](https://sehatbeat-ai.vercel.app)

---

## Table of Contents

- [Overview](#overview)
- [The Problem](#the-problem)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Environment Variables](#environment-variables)
- [Deployment](#deployment)
- [Architecture](#architecture)
- [Offline Capability](#offline-capability)
- [AI Engine](#ai-engine)
- [Contributing](#contributing)
- [Team](#team)
- [License](#license)

---

## Overview

SehatBeat is a Progressive Web App (PWA) that delivers AI-powered health triage in Hindi and English, fully offline, on any smartphone — without an app store. Users speak their symptoms in their native language, receive immediate AI-guided responses with causes, severity assessment, next steps, and specialist recommendations, and can access emergency services, a doctor directory, and medicine ordering — all in one platform, for free.

Built in 24 hours at Hack4Impact 2026 by Team Pixel Pioneers under the Inclusive Innovation — Technology for Social Impact track.

---

## The Problem

India's healthcare crisis is a distribution failure compounded by language and connectivity barriers.

- **45%** of all recorded deaths in India occur with zero medical attention (CRS 2020)
- **28.3 km** average rural travel distance for a single outpatient visit (MoHFW 2025)
- **90%+** of Hindi-belt population is functionally monolingual — excluded from every English-only health app
- **20%** of Indians skip essential medical treatment due to out-of-pocket cost
- **548 million** rural Indians are now connected via smartphone but have no voice-first health tool designed for them
- **1.6 million** deaths annually caused by poor-quality care; 7,000 hospital deaths per year from medication errors alone

SehatBeat is the software layer that has been missing.

---

## Features

### Voice-First AI Triage
Users speak symptoms in Hindi or English. The app uses the Web Speech API (STT) to capture input, sends it to Grok AI for analysis, and reads the response aloud using Text-to-Speech. Auto-submits after 1.5 seconds of silence — no button required. Grok achieves 91.6% accuracy on USMLE Step 1 benchmarks.

### Full Hindi and English Support
Every layer of the application — UI, AI responses, voice input, and TTS output — is fully bilingual. Language is selected at first launch and can be toggled at any time. AI responses are generated natively in Hindi, not translated.

### Offline-First PWA
Installs on any smartphone without an app store. The app caches WHO-sanctioned Community Health Worker protocols using Service Workers and localStorage, enabling full functionality at zero connectivity on 2G and above. Automatically syncs queries and data when connectivity resumes.

### Emergency Detection
The AI engine detects life-threatening symptom patterns and surfaces a one-tap 112 emergency dial button alongside a Google Maps hospital finder. Designed to bridge the 14.5 to 20 minute rural ambulance delay.

### 3D Body Map
An interactive Three.js anatomical model allows users to tap the region where they feel pain. This pre-fills the AI analysis with anatomical context and removes the literacy barrier entirely — no typing or symptom description required.

### Medicine Catalog
An AI-powered catalog of 25+ commonly needed medicines with descriptions, usage guidance, and ordering capability. Integrated with smart reminders for post-consultation medication adherence.

### Doctor Directory
A directory of 15+ specialist types across India. Users can filter by specialty and proximity, and book appointments directly from within the app.

### Smart Reminders
Automated medication and follow-up reminders that users can set from within the app after a consultation or AI triage session.

---

## Tech Stack

| Layer | Technology | Notes |
|---|---|---|
| Frontend | React + TypeScript + Vite + Tailwind CSS | PWA-ready, zero vendor lock-in |
| Backend | Next.js 15 App Router (Serverless) | Deploys to Vercel edge, auto-scales to zero cost at idle |
| AI Engine | Grok-3 (xAI) with Groq Llama 3.3 and Gemini 2.5 Flash fallback | Triple fallback for 99.9% uptime; Groq free tier: 14,400 req/day |
| Offline / PWA | Service Workers + localStorage cache | WHO-protocol first-aid cache, works on 2G |
| Voice | Web Speech API (STT + TTS) | Native to Chrome; hi-IN and en-IN language models built in |
| 3D Body Map | Three.js | Anatomical model with region-tap interaction |
| Auth | Clerk | Free to 10,000 MAU; DPDP Act 2023 compliant; no PII stored server-side |
| Database | Convex (Real-time Serverless) | Free tier: 1M document reads/day; auto-scales |
| Deployment | Vercel Edge Network | Free tier: 100GB/month; global CDN; zero-config CI/CD from GitHub |

---

## Getting Started

### Prerequisites

- Node.js 18 or higher
- npm or yarn
- A Clerk account (free tier)
- A Groq API key (free tier)
- A Convex account (free tier)

### Installation

Clone the repository:

```bash
git clone https://github.com/learning-junkie/sehatbeat-ai.git
cd sehatbeat
```

Install dependencies:

```bash
npm install
```

Set up environment variables by copying the example file:

```bash
cp .env.example .env.local
```

Fill in the required values in `.env.local` (see [Environment Variables](#environment-variables)).

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Running with PWA locally

To test offline PWA behavior locally, build and serve the production build:

```bash
npm run build
npm run start
```

---

## Project Structure

```
sehatbeat/
├── app/                        # Next.js App Router
│   ├── (auth)/                 # Clerk authentication routes
│   ├── api/                    # Serverless API routes
│   │   ├── triage/             # Grok AI triage endpoint
│   │   ├── medicines/          # Medicine catalog API
│   │   └── doctors/            # Doctor directory API
│   ├── dashboard/              # Main app dashboard
│   ├── body-map/               # Three.js 3D body map
│   ├── medicines/              # Medicine catalog and ordering
│   ├── doctors/                # Doctor directory
│   └── reminders/              # Smart reminders
├── components/
│   ├── voice/                  # STT and TTS components
│   ├── body-map/               # Three.js anatomical model
│   ├── triage/                 # AI response display
│   ├── emergency/              # Emergency detection and 112 button
│   └── ui/                     # Shared UI components
├── lib/
│   ├── ai/                     # Grok / Groq / Gemini client wrappers
│   ├── offline/                # Service worker and cache utilities
│   ├── i18n/                   # Hindi and English translation files
│   └── convex/                 # Convex database client
├── public/
│   ├── sw.js                   # Service worker
│   ├── manifest.json           # PWA manifest
│   └── offline-cache/          # WHO first-aid protocol cache
├── convex/                     # Convex schema and functions
├── .env.example
├── next.config.js
└── package.json
```

---

## Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```env
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key

# AI Engine — Grok (primary)
GROK_API_KEY=your_grok_api_key

# AI Engine — Groq (fallback)
GROQ_API_KEY=your_groq_api_key

# AI Engine — Gemini (secondary fallback)
GEMINI_API_KEY=your_gemini_api_key

# Convex Database
NEXT_PUBLIC_CONVEX_URL=your_convex_deployment_url

# App URL
NEXT_PUBLIC_APP_URL=https://sehatbeat-ai.vercel.app
```

All keys listed above have free tiers sufficient for development and initial production use.

---

## Deployment

SehatBeat is deployed on Vercel. To deploy your own instance:

1. Push your repository to GitHub.
2. Import the repository into [Vercel](https://vercel.com).
3. Add all environment variables from `.env.local` to the Vercel project settings.
4. Deploy. Vercel auto-configures CI/CD from the main branch.

The Vercel free tier includes 100GB bandwidth per month and global CDN distribution, which is sufficient through Phase 1 (0 to 10,000 users).

---

## Architecture

### Request Flow

```
User speaks symptoms (Hindi / English)
        |
        v
Web Speech API (STT)  -->  Voice input captured
        |
        v
Triage API route  -->  Grok-3 (primary)
                   -->  Groq Llama 3.3 (fallback)
                   -->  Gemini 2.5 Flash (secondary fallback)
        |
        v
AI response  -->  Rendered in UI  -->  TTS reads response aloud
        |
        v
Optional: Emergency detection  -->  112 dial button + Maps
Optional: Doctor / Medicine recommendation  -->  Directory / Catalog
```

### Offline Flow

```
App loads  -->  Service worker installs
                        |
                        v
               WHO first-aid protocols cached to localStorage
                        |
              Network available?
             /                   \
           Yes                    No
            |                      |
     Normal API flow          Serve from cache
                              Triage still functional
                              Syncs when online
```

---

## Offline Capability

The offline cache is built on WHO-sanctioned Community Health Worker protocols — the same clinical guidelines used by India's 9.2 lakh ASHA workers. The cache covers:

- Common symptom assessment trees
- First-aid response protocols for emergencies
- Medication guidance for common over-the-counter treatments
- Emergency contact information and nearest facility lookup

The cache is not custom medical content. It is WHO Community First Aid Responder guidelines, digitized and made accessible to every user regardless of connectivity.

---

## AI Engine

SehatBeat uses a triple-fallback AI architecture to ensure maximum uptime:

1. **Grok-3 (xAI)** — primary engine; 91.6% USMLE Step 1 accuracy; clinical-grade reasoning
2. **Groq Llama 3.3** — first fallback; 14,400 free requests per day on the Groq free tier
3. **Gemini 2.5 Flash** — secondary fallback; ensures response delivery even during API outages

The AI is prompted to act as a triage bridge, not a diagnostic authority. Every response includes:

- Probable causes of the reported symptom
- Severity assessment (non-urgent / urgent / emergency)
- Recommended next steps
- Specialist type to consult
- Suggested tests if applicable
- Emergency routing to 112 if life-threatening patterns are detected

SehatBeat's AI positioning is legally and clinically identical to NHS 111 and Ada Health — a triage and navigation layer, not a replacement for a doctor.

---

## Data Privacy

SehatBeat is fully compliant with India's Digital Personal Data Protection (DPDP) Act 2023.

- Client-side offline processing minimizes PII collection
- Clerk authentication provides enterprise-grade session management
- No patient data is sold or shared with third parties
- Data minimization is enforced by architecture, not only by policy
- No PII is stored server-side

---

## Contributing

Contributions are welcome. To get started:

1. Fork the repository.
2. Create a new branch from `main`:
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. Make your changes and commit with a clear message.
4. Push to your fork and open a pull request against `main`.

Please ensure your code passes linting (`npm run lint`) before submitting. For significant changes, open an issue first to discuss the approach.

---

## Team

Built by **Team Pixel Pioneers** at Hack4Impact 2026.

| Name | Role |
|---|---|
| Aditi Jha | Team Leader |
| Anshika Choudhary | Member |
| Akshat Kumar Luhia | Member |

---

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

---

**sehatbeat-ai.vercel.app** — Built in 24 hours. Live in production. Real AI. Real Hindi. Real offline mode. Real impact.
