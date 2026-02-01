# 🐝 Rent-Swarm: The Tenant's AI Toolkit

**Level the playing field.** Rent-Swarm is an advanced AI dashboard that empowers tenants with institutional-grade intelligence to find, analyze, and negotiate their next lease.

![Rent Swarm Dashboard](https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=1200&q=80)

## ✨ Key Agents

Rent-Swarm is composed of specialized AI agents working in concert:

- **🕵️ The Scout**: An autonomous scraper that finds listings (Craigslist integrated), extracts hidden data (like image IDs), and assigns a "Scam Score" and "True Cost" estimate.
- **⚖️ The Lawyer**: A RAG-powered legal analyst. Upload a PDF lease, and it flags risky clauses, illegal terms, and red flags based on local jurisdiction laws.
- **📈 The Forecaster**: Predictive analytics engine. Tells you if a unit is overpriced based on historical data and market trends.
- **💬 The Negotiator**: Generates professional, leverage-based negotiation emails. It uses data from the Scout and Forecaster to draft persuasive copy.
- **📂 Intelligence Dossier**: Summarizes all findings for a specific listing into a downloadable, classified-style PDF report.

## 🛠️ Tech Stack

- **Frontend**: Next.js 14 (App Router), React, Tailwind CSS, Shadcn UI
- **Backend**: Next.js API Routes, Server Actions
- **Database**: MongoDB (User Data, Bookmarks)
- **Authentication**: NextAuth.js (Email/Password)
- **AI Logic**: Google Gemini 2.0 Flash (Reasoning), LangChain
- **Scraping**: Puppeteer, Browserbase (Headless Browser Infrastructure)
- **PDF Generation**: jsPDF (Client-side generation)

## 🚦 Getting Started

### Prerequisites
- Node.js 18+
- MongoDB Database (Atlas or Local)
- API Keys for Google Gemini, Browserbase

### Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/yourusername/rent-swarm.git
    cd rent-swarm/rent-swarm-dashboard
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

3.  **Environment Setup**
    Create a `.env.local` file in the root directory:
    ```env
    # Database
    MONGODB_URI=your_mongodb_connection_string

    # Auth
    NEXTAUTH_URL=http://localhost:3000
    NEXTAUTH_SECRET=your_generated_secret

    # AI & Services
    GOOGLE_API_KEY=your_gemini_api_key
    BROWSERBASE_API_KEY=your_browserbase_key
    BROWSERBASE_PROJECT_ID=your_project_id
    ```

4.  **Run the Development Server**
    ```bash
    npm run dev
    ```
    Open [http://localhost:3000](http://localhost:3000) to view the dashboard.

## 🛡️ License

This project is licensed under the MIT License.
