# NutriPredict API

FastAPI + PostgreSQL backend for NutriPredict. It exposes real auth (with
email verification), and runs nutrition predictions through a trained
model: a diet-category recommendation classifier, a metabolic/glucose
regressor, and a meal-plan generator built on a real food database — no
placeholder logic.

- **API framework:** FastAPI
- **Database:** PostgreSQL, accessed via SQLAlchemy 2.0 (sync)
- **Migrations:** Alembic
- **Prediction model:** scikit-learn (RandomForest classifier + regressor), trained by the ML team, bundled under `app/ml_assets/`
- **Auth:** JWT bearer tokens; signup requires email verification via a 6-digit OTP; forgot/reset password; change password while logged in
- **Tests:** pytest, 81 tests covering auth, email verification, password reset/change, the prediction model's feature engineering and meal planning, and the model plug-in system

---

## Table of contents

1. [Folder structure](#folder-structure)
2. [Local setup](#local-setup)
3. [Running the tests](#running-the-tests)
4. [Using the API](#using-the-api)
5. [About the trained model](#about-the-trained-model)
6. [Making changes](#making-changes)
7. [Deploying](#deploying)
8. [Frontend integration](#frontend-integration)

---

## Folder structure

```
BackEnd/
├── .env.example          # Every config variable, documented — copy to .env
├── .gitignore
├── alembic.ini            # Alembic config (points at alembic/ below)
├── pytest.ini              # Pytest config (test discovery, output options)
├── requirements.txt        # All Python dependencies, pinned
├── README.md               # This file
│
├── alembic/
│   ├── env.py               # Wires Alembic to app settings + all models, for autogenerate
│   ├── script.py.mako       # Template used when generating new migration files
│   └── versions/
│       ├── 1b936b959bd6_initial_schema_users_with_password_auth_.py
│       │                    # Creates users (with hashed_password) + prediction_records
│       ├── ceb25f5f8678_add_password_reset_tokens_table.py
│       │                    # Adds password_reset_tokens
│       └── b482217ec5cc_add_is_verified_to_users_add_email_.py
│                            # Adds users.is_verified + email_verification_codes
│
├── app/
│   ├── main.py               # FastAPI app: creates the app, adds CORS, mounts routers, /health
│   ├── database.py           # SQLAlchemy engine, session factory, Base, get_db() dependency
│   ├── deps.py                # Shared FastAPI dependencies: get_current_user, get_current_user_optional
│   │
│   ├── core/
│   │   ├── config.py          # Settings class — reads every env var, single source of truth
│   │   └── security.py        # JWT, bcrypt password hashing, reset-token/OTP generation & hashing
│   │
│   ├── models/                # SQLAlchemy ORM models (the actual DB tables)
│   │   ├── user.py             # User: id, name, email, hashed_password, is_verified, created_at
│   │   ├── prediction.py       # PredictionRecord: input/output JSON + summary columns
│   │   ├── password_reset_token.py     # PasswordResetToken: token_hash, expires_at, used_at
│   │   └── email_verification_code.py  # EmailVerificationCode: code_hash, attempts, expires_at
│   │
│   ├── schemas/                # Pydantic request/response contracts (NOT DB models)
│   │   ├── user.py              # UserOut (includes is_verified), UserStats
│   │   ├── auth.py              # SignupRequest, SignupResponse, VerifyEmailRequest,
│   │   │                          ResendVerificationRequest, LoginRequest, ForgotPasswordRequest,
│   │   │                          ResetPasswordRequest, ChangePasswordRequest, TokenResponse
│   │   └── prediction.py        # ProfileInput, PredictionOutput, and everything in between —
│   │                              this file IS the contract your teammate's model must satisfy
│   │
│   ├── routers/                 # HTTP endpoints — thin, delegate to services/
│   │   ├── auth.py               # POST /auth/signup, /verify-email, /resend-verification, /login,
│   │   │                           /forgot-password, /reset-password, /change-password
│   │   ├── users.py              # GET /users/me, GET /users/me/stats
│   │   └── predictions.py        # POST /predictions, GET /predictions/history,
│   │                                GET /predictions/{id}, DELETE /predictions/history
│   │
│   ├── ml_assets/                # The trained model artifacts, bundled with the backend
│   │   ├── diet_recommendation_model.pkl   # RandomForestClassifier -> Balanced/Low_Carb/Low_Sodium
│   │   ├── metabolic_glucose_model.pkl     # RandomForestRegressor -> metabolic score estimate
│   │   └── processed_food_nutrition.csv    # Food database the meal planner draws from
│   │
│   └── services/
│       ├── prediction_service.py         # Orchestrates: call model -> (maybe) save -> return.
│       │                                    Also has the history/stats DB queries.
│       ├── prediction_engine/            # <<< THE MODEL PLUG-IN SYSTEM >>>
│       │   ├── base.py                     # BasePredictionModel — the abstract interface
│       │   ├── features.py                 # Feature engineering + meal-planning logic (testable,
│       │   │                                 reusable from an offline training/eval script too)
│       │   ├── ml_model.py                 # MLPredictionModel — loads the .pkl files + food_db,
│       │   │                                 wraps features.py, this is the active model
│       │   └── registry.py                 # Picks the active model from PREDICTION_MODEL env var
│       │
│       └── email/                        # Same plug-in pattern, for sending email
│           ├── base.py                     # BaseEmailSender — the abstract interface
│           ├── console_sender.py           # Default: logs the email instead of sending it
│           ├── smtp_sender.py              # Template for a real provider — start here
│           └── registry.py                 # Picks the active sender from EMAIL_BACKEND env var
│
└── tests/
    ├── conftest.py               # Test DB setup, TestClient fixture, sample_profile, auth_headers,
    │                                signup_and_verify() helper (signup + extract OTP + verify)
    ├── test_health.py             # 1 test
    ├── test_auth.py                # 12 tests: signup, login gated on verification, token enforcement
    ├── test_email_verification.py  # 10 tests: OTP verify/resend, attempt limiting, expiry
    ├── test_password_reset.py      # 8 tests: forgot/reset flow, single-use tokens, expiry
    ├── test_change_password.py     # 6 tests: authenticated password change
    ├── test_features.py            # 13 tests: feature-building, allergy filtering, meal scoring
    ├── test_predictions.py         # 23 tests: diet recommendation, meal plans, persistence, auth scoping
    └── test_model_registry.py      # 8 tests: proves the plug-in system actually works
```

### Why the code is organized this way

**`schemas/` vs `models/`** — these look similar but do different jobs.
`models/` are SQLAlchemy classes that map to actual database tables.
`schemas/` are Pydantic classes that define what JSON goes in and out of the
API. Keeping them separate means the database can evolve (add a column,
rename something internally) without automatically changing the API
contract, and vice versa.

**`routers/` vs `services/`** — routers only handle HTTP concerns (reading
the request, checking auth, returning the right status code). All the
actual logic — running a prediction, saving it, computing stats — lives in
`services/`, so it's testable and reusable without spinning up a request.

**`prediction_engine/` is its own package** — nothing in `routers/` or
`services/prediction_service.py` imports `MLPredictionModel` directly; they
only ever go through `registry.get_prediction_model()`, which returns
whatever implements `BasePredictionModel`. That indirection means a future
retrained model (v2) is a registry entry and an env var away, not a
rewrite — see [About the trained model](#about-the-trained-model).

---

## Local setup

### Prerequisites

- Python 3.11+ (developed against 3.12)
- PostgreSQL 14+ running locally (or accessible via a connection string)

### 1. Install PostgreSQL (if you don't have it)

```bash
# macOS
brew install postgresql@16
brew services start postgresql@16

# Ubuntu / Debian
sudo apt-get install postgresql postgresql-contrib
sudo service postgresql start
```

### 2. Create the database

```bash
# macOS (default user is usually your OS username, no password)
createdb nutripredict

# Ubuntu (postgres superuser)
sudo -u postgres createdb nutripredict
sudo -u postgres psql -c "ALTER USER postgres PASSWORD 'postgres';"
```

Adjust the username/password to whatever you actually set up — you'll put
the final connection string in `.env` in step 5.

### 3. Create a virtual environment and install dependencies

```bash
cd BackEnd
python3 -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

### 4. Configure environment variables

```bash
cp .env.example .env
```

Open `.env` and set `DATABASE_URL` to match your local Postgres setup, e.g.:

```
DATABASE_URL=postgresql+psycopg2://postgres:postgres@localhost:5432/nutripredict
```

Every setting is documented inline in `.env.example` — also see
`app/core/config.py`, which is the single place all of them are read.

### 5. Run migrations

```bash
alembic upgrade head
```

This creates the `users` and `prediction_records` tables. You should see
output ending in `Running upgrade -> d60081823204, initial schema...`.

### 6. Start the server

```bash
uvicorn app.main:app --reload --port 8000
```

Visit **http://localhost:8000/docs** for interactive Swagger docs (every
endpoint, with a "Try it out" button — this is the fastest way to explore
the API). A plain health check is at **http://localhost:8000/health**.

---

## Running the tests

Tests run against a **separate** database (`nutripredict_test` by default)
so they never touch your real data, and each test truncates all tables
afterward so tests stay isolated from each other.

```bash
# one-time: create the test database
createdb nutripredict_test          # or: sudo -u postgres createdb nutripredict_test

# run everything
pytest

# run one file, verbosely
pytest tests/test_predictions.py -v

# run one test
pytest tests/test_model_registry.py::test_a_new_model_can_be_registered_and_selected
```

`tests/conftest.py` points at `nutripredict_test` via an environment
variable set at import time — if you want to use a different test DB name
or host, set `DATABASE_URL` in your shell before running `pytest` and it'll
take precedence.

All 36 tests should pass out of the box. If they don't, it's almost always
one of: Postgres isn't running, `nutripredict_test` doesn't exist yet, or
your local Postgres needs a different user/password than the default in
`conftest.py`.

---

## Using the API

All endpoints are prefixed with `/api/v1` (configurable via `API_PREFIX` in
settings). `/health` is the one exception, at the root.

### 1. Sign up, verify your email, then log in

```bash
curl -X POST http://localhost:8000/api/v1/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"name": "Alex Rivera", "email": "alex@example.com", "password": "supersecret1"}'
```

This creates an **unverified** account and emails a 6-digit code — it does
**not** log the user in:

```json
{
  "message": "Account created. Check your email for a 6-digit verification code.",
  "email": "alex@example.com"
}
```

`/auth/signup` returns `409` if the email is already registered. As with
password reset, **no real email provider is configured by default** — the
`console` `EMAIL_BACKEND` logs the code (and the rest of the email body) to
the terminal running `uvicorn` instead of sending it. Look there for the
code while testing this yourself.

Submit the code to activate the account. On success this also logs the
user in (same response shape as `/auth/login`):

```bash
curl -X POST http://localhost:8000/api/v1/auth/verify-email \
  -H "Content-Type: application/json" \
  -d '{"email": "alex@example.com", "code": "123456"}'
```

```json
{
  "access_token": "eyJhbGciOi...",
  "token_type": "bearer",
  "user": { "id": "...", "name": "Alex Rivera", "email": "alex@example.com", "is_verified": true, "created_at": "..." }
}
```

Codes expire after 10 minutes and allow at most 5 wrong guesses before
they're dead (`400` either way) — request a fresh one with:

```bash
curl -X POST http://localhost:8000/api/v1/auth/resend-verification \
  -H "Content-Type: application/json" \
  -d '{"email": "alex@example.com"}'
```

Like `/forgot-password`, this always returns the same generic message
regardless of whether the email exists or is already verified.

Once verified, log back in any time with:

```bash
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "alex@example.com", "password": "supersecret1"}'
```

`/auth/login` returns `401` for a wrong password or unknown email
(intentionally the same error for both — no account-enumeration oracle),
and `403` if the credentials are correct but the account still isn't
verified. Passwords must be at least 8 characters and are hashed with
bcrypt before ever touching the database — the plaintext password is never
stored.

Save the `access_token` and send it as `Authorization: Bearer <token>` on
every subsequent request that needs it.

### 2. Forgot / reset password

```bash
curl -X POST http://localhost:8000/api/v1/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email": "alex@example.com"}'
```

Always returns the same generic message
(`"If an account exists for that email, we've sent instructions..."`)
whether or not that email is registered — this is intentional, so the
endpoint can't be used to check which emails have accounts.

If the email *is* registered, a reset link
(`{FRONTEND_URL}/reset-password?token=...`) is sent via whichever
`EMAIL_BACKEND` is configured. **In local dev, no real email provider is
configured** — the default `console` backend logs the email (including the
full reset link) to the terminal running `uvicorn` instead of sending it.
Look there for the link while testing this flow yourself. See
[services/email/](#folder-structure) and set `EMAIL_BACKEND=smtp` (after
filling in `smtp_sender.py`) once you have a real provider.

```bash
curl -X POST http://localhost:8000/api/v1/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{"token": "<token from the emailed link>", "new_password": "a-new-password"}'
```

Returns `400` if the token is invalid, already used, or expired (tokens
expire after `PASSWORD_RESET_TOKEN_EXPIRE_MINUTES`, 30 by default). Each
token can only be used once.

### 3. Change password (while logged in)

For an already-authenticated user (the Profile page's "Change Password"
card) — requires the current password rather than an emailed token:

```bash
curl -X POST http://localhost:8000/api/v1/auth/change-password \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"current_password": "supersecret1", "new_password": "an-even-better-password"}'
```

Returns `401` if `current_password` doesn't match, `422` if
`new_password` is under 8 characters.

### 4. Generate a prediction

This works **with or without** a token. Without one, you get a prediction
back but nothing is saved — useful for letting someone try the product
before signing up. With a token, it's saved to their history.

```bash
curl -X POST http://localhost:8000/api/v1/predictions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "age": 45, "gender": "Female", "height": 160, "weight": 95,
    "disease_type": "Diabetes", "severity": "Severe",
    "physical_activity_level": "Sedentary", "weekly_exercise_hours": 0,
    "daily_caloric_intake": 1800, "cholesterol_mg_dl": 240,
    "blood_pressure_mmhg": 145, "glucose_mg_dl": 180,
    "dietary_restrictions": "Low_Sugar", "allergies": ["Peanut"],
    "preferred_cuisine": "Mexican",
    "adherence_to_diet_plan": 50, "dietary_nutrient_imbalance_score": 70
  }'
```

Response shape (abbreviated):

```json
{
  "bmi": 37.11,
  "recommended_diet": "Low_Carb",
  "diet_probabilities": [
    { "diet": "Low_Carb", "probability": 92.0 },
    { "diet": "Balanced", "probability": 4.0 },
    { "diet": "Low_Sodium", "probability": 4.0 }
  ],
  "meal_plan": [
    { "meal": "Breakfast", "food": "Chicken, broiler...", "portion_g": 91.4,
      "calories": 152.0, "protein": 29.3, "fat": 3.0, "carbohydrates": 0.0,
      "fiber": null, "sodium": 63.9 }
  ],
  "nutrition_totals": { "calories": 1800.0, "protein": 285.0, "fat": 62.9, "carbohydrates": 5.2, "fiber": 4.1, "sodium": 2200.0 },
  "meal_calorie_summary": [{ "meal": "Breakfast", "calories": 450.0, "target": 450.0 }],
  "metabolic_score": 131.4,
  "model_name": "ml", "model_version": "1.0.0",
  "id": "...", "saved": true
}
```

Field constraints (enforced by Pydantic, return `422` if violated) — these
are exactly the features `diet_recommendation_model.pkl` and
`metabolic_glucose_model.pkl` were trained on; see
[About the trained model](#about-the-trained-model) for why these specific
values matter:

| Field | Type | Constraint |
|---|---|---|
| `age` | int | 1–120 |
| `gender` | string | `"Male"` \| `"Female"` |
| `height` | float | 1–300 (cm) |
| `weight` | float | 1–400 (kg) |
| `disease_type` | string | `"None"` \| `"Diabetes"` \| `"Hypertension"` \| `"Obesity"` |
| `severity` | string | `"None"` \| `"Mild"` \| `"Moderate"` \| `"Severe"` |
| `physical_activity_level` | string | `"Sedentary"` \| `"Moderate"` \| `"Active"` |
| `weekly_exercise_hours` | float | 0–40 |
| `daily_caloric_intake` | float | 1–8000 (kcal) |
| `cholesterol_mg_dl` | float | 1–500 |
| `blood_pressure_mmhg` | float | 1–260 (systolic) |
| `glucose_mg_dl` | float | 1–500 (fasting) |
| `dietary_restrictions` | string | `"None"` \| `"Low_Sodium"` \| `"Low_Sugar"` |
| `allergies` | list of strings | any of `Milk, Peanut, Tree Nut, Soy, Egg, Fish, Shellfish, Wheat`, defaults to `[]` |
| `preferred_cuisine` | string | `"Indian"` \| `"Chinese"` \| `"Italian"` \| `"Mexican"` |
| `adherence_to_diet_plan` | int | 0–100 (self-rated) |
| `dietary_nutrient_imbalance_score` | int | 0–100 (self-rated, 0=balanced) |

Returns `422` if too few foods remain in the database after allergy
filtering to build a full plan (e.g. excluding every allergen at once
against the current ~107-item food database).

### 5. View prediction history

```bash
curl http://localhost:8000/api/v1/predictions/history \
  -H "Authorization: Bearer <token>"
```

Returns the 50 most recent predictions (most recent first), lightweight —
just enough for a list view. Pass `?limit=10` to change the page size.

### 6. View one prediction in full

```bash
curl http://localhost:8000/api/v1/predictions/<prediction_id> \
  -H "Authorization: Bearer <token>"
```

Returns everything: the full input profile and the full output (diet
recommendation, complete meal plan, nutrition totals, metabolic score).
404s if the prediction doesn't exist or belongs to someone else.

### 7. Clear history

```bash
curl -X DELETE http://localhost:8000/api/v1/predictions/history \
  -H "Authorization: Bearer <token>"
```

### 8. Current user + stats

```bash
curl http://localhost:8000/api/v1/users/me -H "Authorization: Bearer <token>"
curl http://localhost:8000/api/v1/users/me/stats -H "Authorization: Bearer <token>"
```

`stats` returns `total_predictions`, `best_confidence`, and `avg_metabolic_score` —
exactly what the frontend's Profile page displays.

---

## About the trained model

### What it actually does

`POST /predictions` runs three things, in order:

1. **Diet recommendation** — `diet_recommendation_model.pkl`, a
   RandomForestClassifier, predicts one of three categories (`Balanced`,
   `Low_Carb`, `Low_Sodium`) from the full health profile, with a
   probability for each. `Disease_Type` dominates its feature importance
   by a wide margin — a Diabetes profile pushes hard toward `Low_Carb`, a
   Hypertension profile toward `Low_Sodium`.
2. **Metabolic estimate** — `metabolic_glucose_model.pkl`, a
   RandomForestRegressor over NHANES-style biometric/dietary features,
   produces `metabolic_score`. Its exact training target/units weren't
   recoverable from what shipped with the model — the output range
   (~90–140 across the profiles this was tested against) strongly
   resembles fasting glucose in mg/dL, matching the filename, but **it's a
   model estimate, not a validated clinical figure** — the API and
   frontend both surface it with that caveat rather than as a diagnosis.
3. **Meal plan** — the recommended category drives `build_meal_plan()` in
   `features.py`, which scores every food in `processed_food_nutrition.csv`
   against the category (e.g. rewarding low-carb foods for a `Low_Carb`
   recommendation), filters out anything matching a selected allergy, and
   assembles a full day's plan (Breakfast/Lunch/Snack/Dinner) sized to hit
   the requested calorie target.

Both `.pkl` files are self-contained scikit-learn `Pipeline`s — they do
their own preprocessing (imputation, one-hot encoding) internally, so
`ml_model.py` just has to build a correctly-shaped `DataFrame` and call
`.predict()`/`.predict_proba()`.

### Known characteristics worth knowing about

- **The food database is small (~107 unique items after dedup) and
  meat-heavy.** For restrictive combinations (e.g. `Low_Carb` + several
  allergies excluded), the planner can end up leaning heavily on lean
  meats, which pushes total daily protein noticeably high. This is a
  property of the current dataset and the (faithfully-ported) scoring
  heuristic, not a bug in the integration — expanding
  `processed_food_nutrition.csv` with more variety (vegetables, grains,
  dairy alternatives) would directly improve plan variety and macro
  balance without any code changes.
- **The `Allergies` feature fed to the diet classifier itself is mostly
  inert.** The classifier's `Allergies` column was trained on only two
  category strings (`'Gluten'`, `'Peanuts'`), which don't match the eight
  allergen options the API/frontend actually offer — so that specific
  input barely influences the diet recommendation (consistent with it not
  appearing in the model's top feature importances). The **meal plan's**
  allergy filtering is separate and fully functional — it excludes matching
  foods by name regardless of what the classifier does with that column
  (see `ALLERGENS` and `filter_allergies()` in `features.py`).
- **`Severity`/`Dietary_Restrictions` have no `"None"` training category**
  — sending `"None"` for either is intentional and expected (matches how
  the original prototype behaved): the one-hot encoder treats it as an
  unrecognized category (`handle_unknown="ignore"`), which just contributes
  no signal for that feature, rather than erroring.

### Swapping in a retrained model later

The plug-in architecture (`BasePredictionModel` / `registry.py`) still
applies if this model is retrained or replaced:

1. Implement a new class satisfying `BasePredictionModel` (same
   `ProfileInput -> PredictionOutput` contract, or update the schema if the
   new model's inputs/outputs genuinely differ — see
   [Making changes](#making-changes) below).
2. Add it to `_REGISTRY` in `registry.py`.
3. Set `PREDICTION_MODEL=<your key>` in `.env` and restart.

No router or service code needs to change either way — they only ever call
`registry.get_prediction_model()`. Every `PredictionRecord` also stores
`model_name`/`model_version`, so predictions from different model versions
stay distinguishable in the database once there's more than one in play.

---

## Making changes

### Adding a new field to the prediction input

Say you want to add `goal_weight` to `ProfileInput`:

1. Add it to `ProfileInput` in `app/schemas/prediction.py`.
2. Use it in `features.py` (`build_diet_features`/`build_metabolic_features`)
   if the trained model actually consumes it — adding a field the model
   was never trained on won't do anything on its own.
   `ml_model.py`).
3. If you want it queryable/indexed in the DB (not just buried in the
   `input_payload` JSON blob), add a column to `PredictionRecord` in
   `app/models/prediction.py`, and set it in
   `prediction_service.save_prediction()`.
4. Generate and apply a migration (see below).

### Adding a new endpoint

1. Add the logic to the relevant `services/` module (or create a new one).
2. Add a route in the relevant `routers/` module that calls it.
3. If it's a new resource entirely, create a new router file and
   `app.include_router(...)` it in `app/main.py`.

### Database migrations

Whenever you change a model in `app/models/`, generate a migration:

```bash
alembic revision --autogenerate -m "describe the change"
```

**Always open the generated file in `alembic/versions/` and read it** —
autogenerate is good but not infallible (it won't detect every kind of
change, e.g. some column renames look like a drop + add). Then apply it:

```bash
alembic upgrade head
```

To roll back the most recent migration:

```bash
alembic downgrade -1
```

### Code style

There's no linter/formatter wired up yet. If you want one, `ruff` (fast,
does both linting and import sorting) or `black` + `isort` are the standard
choices and would slot in cleanly — nothing here is written in a way that
fights either.

---

## Deploying

No Docker here by design — this section assumes you're deploying to a
regular server or VM (the same approach works on a plain EC2/DigitalOcean
box, a PaaS like Railway/Render's "native runtime" option, etc.).

### 1. Production dependencies

Everything needed is already in `requirements.txt`. Add a production ASGI
process manager:

```bash
pip install "uvicorn[standard]" gunicorn
```

### 2. Run with Gunicorn managing Uvicorn workers

This is the standard production setup for FastAPI — Gunicorn handles
process management/restarts, Uvicorn's worker class handles the actual
ASGI serving:

```bash
gunicorn app.main:app \
  --workers 4 \
  --worker-class uvicorn.workers.UvicornWorker \
  --bind 0.0.0.0:8000 \
  --timeout 60
```

A rough starting point for `--workers` is `(2 x CPU cores) + 1`.

### 3. Environment variables

Set these on the server (not in a committed `.env` file):

- `DATABASE_URL` — your production Postgres connection string. Most managed
  Postgres providers (RDS, Supabase, Railway, Neon, etc.) give you this
  directly.
- `JWT_SECRET` — generate a real random secret, e.g. `openssl rand -hex 32`.
  Do **not** reuse the default.
- `CORS_ORIGINS` — your actual deployed frontend URL(s), comma-separated.
- `PREDICTION_MODEL` — `ml` once the real model is live.
- `MODEL_ARTIFACT_PATH` — wherever the model file lives on the production
  box (or bake it into your deployment artifact).
- `ENV=production`

### 4. Run migrations as part of every deploy

Before starting the new process (or as a release step, if your platform
has one):

```bash
alembic upgrade head
```

### 5. Put a reverse proxy in front of it

Run Gunicorn/Uvicorn on `127.0.0.1:8000` (not exposed directly) and put
nginx or Caddy in front for TLS termination, e.g. a minimal nginx snippet:

```nginx
location /api/ {
    proxy_pass http://127.0.0.1:8000/;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

### 6. Process supervision

Use `systemd` (most VMs) so the API restarts automatically on crash or
reboot. Minimal example, `/etc/systemd/system/nutripredict-api.service`:

```ini
[Unit]
Description=NutriPredict API
After=network.target postgresql.service

[Service]
User=www-data
WorkingDirectory=/opt/nutripredict/BackEnd
EnvironmentFile=/opt/nutripredict/BackEnd/.env
ExecStart=/opt/nutripredict/BackEnd/.venv/bin/gunicorn app.main:app \
  --workers 4 --worker-class uvicorn.workers.UvicornWorker --bind 127.0.0.1:8000
Restart=always

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable --now nutripredict-api
```

---

## Frontend integration

The React app in `../FrontEnd` is connected to this API — not using
`localStorage` for auth or predictions anymore. Quick map of how:

- `FrontEnd/src/utils/api.js` — the fetch wrapper every API call goes
  through, base URL from `VITE_API_BASE_URL` (see `FrontEnd/.env.example`).
- `FrontEnd/src/utils/auth.js` — calls `POST /auth/signup` (does **not**
  store a session — the account isn't usable yet),
  `POST /auth/verify-email` (stores the session on success),
  `POST /auth/resend-verification`, `POST /auth/login`,
  `POST /auth/forgot-password`, `POST /auth/reset-password`, and
  `POST /auth/change-password`. Session (`{ token, user }`) lives in
  `localStorage` under `nutripredict_auth`.
- `FrontEnd/src/pages/VerifyEmail.jsx` — the 6-digit OTP entry screen
  (`FrontEnd/src/components/ui/OtpInput.jsx` is the segmented input
  itself, reusable anywhere else a code needs to be typed in). Signup
  routes here; so does a login attempt that comes back `403` unverified.
- `FrontEnd/src/components/profile/ChangePasswordCard.jsx` — the
  collapsible "Change Password" section on the Profile page.
- `FrontEnd/src/pages/ProfileSetup.jsx` — the 4-step wizard collecting
  exactly the fields `ProfileInput` needs (Personal Details, Health
  Profile, Lifestyle & Goals, Preferences). Includes a live daily-calorie
  suggestion (Mifflin-St Jeor) that recalculates as earlier fields change,
  until the user edits it directly.
- `FrontEnd/src/pages/Dashboard.jsx` — shows the real output: diet
  recommendation with confidence chart, a full meal plan grouped by meal,
  and a nutrition/macro breakdown — not a weight-trajectory chart.
- `FrontEnd/src/utils/predictions.js` — calls `POST /predictions`,
  `GET /predictions/history`, `GET /predictions/{id}`,
  `DELETE /predictions/history`, and `GET /users/me/stats`. It also
  translates between this API's snake_case JSON and the camelCase shape
  the UI components (`Dashboard.jsx`, `Profile.jsx`) expect — see the
  `toApiProfile`/`fromApiOutput`/`fromApiHistoryRecord` functions in that
  file if you change a field name on either side.
- `FrontEnd/src/utils/pdfReport.js` — the "Download PDF" button on the
  Dashboard. Entirely client-side (no backend endpoint involved): it reads
  the already-loaded `results` object plus screenshots of the two chart
  `<div>`s (via `html2canvas`) and assembles a report with `jsPDF` +
  `jspdf-autotable`. Works for guest predictions too, since it only needs
  what's already on screen.

**Running both together locally:** start this API on `:8000` (see
[Local setup](#local-setup) above), then in a second terminal:

```bash
cd ../FrontEnd
npm install --legacy-peer-deps
npm run dev
```

Make sure `CORS_ORIGINS` in this project's `.env` includes whatever port
Vite prints (`http://localhost:5173` by default — already included; if
Vite picks a different port because 5173 is busy, add it too).
