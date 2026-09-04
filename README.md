# NutriPredict

AI-powered nutrition recommendation — a trained model predicts which diet
category fits your health profile, estimates a metabolic score, and
generates a full meal plan from a real food database.

This repo has three parts:

```
NutriPredict/
├── FrontEnd/     React + Vite app (the UI)
├── BackEnd/      FastAPI + PostgreSQL API (auth, predictions, history)
└── ML_Model/     Original model training/prototype artifacts (reference only)
```

`ML_Model/` is the source-of-truth for how the model was built — the
trained `.pkl` files and food database it contains are copied into
`BackEnd/app/ml_assets/` and loaded from there at runtime; `BackEnd/` is
what actually runs. `ML_Model/app.py` was the original Streamlit
prototype used to develop the model; the backend replaces it with a
proper API (`BackEnd/app/services/prediction_engine/`, see below) and
isn't Streamlit-dependent at all.

Sign-up, login, and every prediction go through the real API — nothing is
simulated in `localStorage` (only the session token and a cached copy of
the user's own profile are kept there, same as any normal web app).

## Running it locally

Two terminals — the API first, then the frontend.

**Terminal 1 — BackEnd**

```bash
cd BackEnd
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env          # edit DATABASE_URL to match your local Postgres
createdb nutripredict         # one-time
alembic upgrade head
uvicorn app.main:app --reload --port 8000
```

**Terminal 2 — FrontEnd**

```bash
cd FrontEnd
cp .env.example .env          # default already points at localhost:8000
npm install --legacy-peer-deps
npm run dev
```

Open the URL Vite prints (`http://localhost:5173` by default). Create an
account, verify it with the code (see below for where to find it), fill in
the 4-step wizard, and you'll get a real diet recommendation with a
generated meal plan — backed by real rows in Postgres, not browser storage
or a placeholder.

Full details — folder structure, every endpoint, how the model actually
works, how auth works, deployment — are in each project's own README:

- **[FrontEnd/README.md](./FrontEnd/README.md)**
- **[BackEnd/README.md](./BackEnd/README.md)** — see especially
  ["About the trained model"](./BackEnd/README.md#about-the-trained-model)
  and ["Frontend integration"](./BackEnd/README.md#frontend-integration)

## What the model actually predicts

Three things, per request:

1. **A diet category** — `Balanced`, `Low_Carb`, or `Low_Sodium` — from a
   RandomForest classifier, with a confidence score for all three, not
   just the winner.
2. **A metabolic score** — from a second trained model. Its exact
   training target/units weren't recoverable from what shipped with the
   model; the API and UI both label it as a model estimate, not a lab
   result or diagnosis.
3. **A full meal plan** — Breakfast/Lunch/Snack/Dinner, built from a real
   food database, sized to the requested calorie target, and filtered
   against selected allergies.

See [BackEnd/README.md#about-the-trained-model](./BackEnd/README.md#about-the-trained-model)
for exactly how each of these works, including a couple of known
characteristics worth knowing about (food database size/variety, and one
input feature that barely affects the diet classifier).

## Auth, in short

Real signup/login with bcrypt-hashed passwords and JWT bearer tokens.
Every account is created **unverified**; signing up emails a 6-digit code
that must be entered before the account can log in. There's also a
working forgot/reset password flow, and a change-password option on the
Profile page for already-logged-in users. See
`BackEnd/app/routers/auth.py` and `FrontEnd/src/utils/auth.js` for all of
it. A logged-out visitor can still generate a prediction (it's just not
saved); logging in saves every prediction to that account's history
automatically.

No real email provider is wired up yet — in local dev, verification codes
and password reset links are both logged to the backend's terminal instead
of actually emailed (see `BackEnd/README.md` for details and how to plug
in a real one).

## Prediction reports

Every result on the Dashboard has a **Download PDF** button — generates a
branded report (the recommendation, confidence chart, full meal plan
table, nutrition totals) entirely client-side, so it works for guest
predictions too. See `FrontEnd/src/utils/pdfReport.js`.
