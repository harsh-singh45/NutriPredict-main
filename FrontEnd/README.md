# 🥗 NutriPredict

**NutriPredict** is an AI-powered nutrition recommendation platform. It
predicts which diet category fits a person's health profile, estimates a
metabolic score, and generates a complete one-day meal plan built from a
real food database — all from a trained model on the backend (see
`../BackEnd`), not a client-side placeholder.

---

## ✨ Key Features

### 🔮 Real Diet Recommendation
A trained classifier recommends one of three diet categories — Balanced,
Low-Carb, or Low-Sodium — from a full health profile (disease type &
severity, cholesterol, blood pressure, glucose, activity level, and more),
with a confidence score for every category, not just the top pick.

### 🍽️ Full Meal Plan Generation
A generated one-day plan across Breakfast, Lunch, Snack, and Dinner, built
from a real food database, sized to the user's calorie target, and
filtered against any selected allergies (milk, peanut, tree nut, soy, egg,
fish, shellfish, wheat).

### 🧬 Metabolic Score
A second trained model estimates a metabolic score from biometric and
dietary inputs — surfaced with a clear disclaimer that it's a model
output, not a lab result or diagnosis.

### 📊 Nutrition Breakdown
Full nutrition totals (calories, protein, fat, carbs, fiber, sodium) and a
macro-split chart for the generated plan, plus a planned-vs-target
calories-by-meal chart.

### 🎨 Premium Botanical UI
- Light, editorial health-tech aesthetic
- Real product-style dashboard previews
- Smooth scroll-reveal transitions & micro-interactions
- Dynamic progress-bar range sliders

### 🔐 Real Authentication & Persistence
- Sign up / log in against a FastAPI + PostgreSQL backend (see `../BackEnd`)
- Email verification via a 6-digit code before an account can log in
- Forgot/reset password, plus change-password from the Profile page
- Passwords hashed with bcrypt, sessions via JWT
- Prediction history stored server-side, tied to your account — not just this browser

### 📄 Downloadable PDF Reports
- Every prediction result has a "Download PDF" button
- Branded report with the diet recommendation, confidence chart, full meal
  plan table, and nutrition totals
- Generated entirely client-side (`jsPDF` + `html2canvas`) — works for guest predictions too

---

## 🛠️ Tech Stack

| Technology | Purpose |
|------------|----------|
| **React 19** | Frontend Framework |
| **Vite 8** | Build Tool |
| **Tailwind CSS v4** | Styling & UI System |
| **Recharts** | Data Visualization |
| **Lucide React** | Icons |
| **React Router DOM** | Routing |

---

## 📂 Project Structure

| Directory / File | Purpose |
|------------------|----------|
| `src/components/` | Reusable UI components (Navbar, Cards, Charts) |
| `src/layouts/` | Layout wrappers for routing |
| `src/pages/` | Core pages (Home, Signup, Login, Wizard, Dashboard, Profile) |
| `src/utils/api.js` | Central fetch wrapper for the backend API |
| `src/utils/predictions.js` | Calls the prediction API, maps its response into the shape the UI expects |
| `src/utils/auth.js` | Sign up / log in against the API, stores the session token |
| `src/App.jsx` | Main router configuration |
| `src/index.css` | Tailwind theme configuration & animations |

This app talks to the NutriPredict API in `../BackEnd` — see that project's
README for how to run it. `VITE_API_BASE_URL` in `.env` points at it
(defaults to `http://localhost:8000/api/v1`).

---

## 🚀 Getting Started

### 📌 Prerequisites
- Node.js v18 or higher
- npm

---

### 🔧 Installation

#### 1️⃣ Clone the Repository

```bash
git clone https://github.com/yourusername/nutripredict.git
cd nutripredict
```

#### 2️⃣ Install Dependencies

> Because this project uses Vite 8 and Tailwind v4, we use legacy peer deps to resolve strict dependency conflicts.

```bash
npm install --legacy-peer-deps
```

If prompted by Recharts:

```bash
npm install react-is --legacy-peer-deps
```

#### 3️⃣ Configure the API URL

```bash
cp .env.example .env
```

The default (`http://localhost:8000/api/v1`) matches the BackEnd's default
port — only change it if you're running the API somewhere else. Make sure
the BackEnd is running (see `../BackEnd/README.md`) before using the app.

#### 4️⃣ Start Development Server

```bash
npm run dev -- --force
```

#### 5️⃣ Open in Browser

Visit:

```
http://localhost:5173
```

---

## 💡 Usage Workflow

1. Create an account on the **Sign Up** page and verify your email with
   the 6-digit code (or use **Start Your Prediction** without an account —
   predictions work for guests too, just aren't saved)
2. Complete the 4-step wizard:
   - Personal Details
   - Health Profile
   - Lifestyle & Goals
   - Preferences
3. View your recommended diet, confidence breakdown, full meal plan, and
   nutrition totals
4. If you're signed in, it's automatically saved to your **Profile** history

---

## 📊 Core Concept

NutriPredict is built on a **recommendation-first approach**:

> "Know your fit. Then plan your meals."

A trained RandomForest classifier recommends a diet category from a full
health profile, a second trained model estimates a metabolic score, and a
meal planner assembles a real day's worth of food around that
recommendation — all served by the backend (see
`../BackEnd/README.md#about-the-trained-model` for exactly how the model
works and what it does and doesn't tell you).

---

## 📄 License

This project is developed for:

- Educational purposes  
- Academic submission  
- Hackathon demonstration  

Not intended for medical diagnosis or real-world clinical use.

---

## 👨‍💻 Author

**Harsh Singh**  
B.Tech Student  
Parul University, Gujarat  

---

⭐ If you like this project, consider giving it a star on GitHub!