# 🛡️ QGuard Demo Scheduler

> A production-ready demo scheduling system for TrevasQ Quantum Solutions' QGuard product.

[![React](https://img.shields.io/badge/React-20232A?style=flat-square&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-43853D?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=flat-square&logo=supabase&logoColor=white)](https://supabase.com/)
[![Resend](https://img.shields.io/badge/Resend-000000?style=flat-square&logo=resend&logoColor=white)](https://resend.com/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](LICENSE)

---

## 📌 Overview

**QGuard Demo Scheduler** is a full-stack web application that lets visitors book a product demo for **QGuard**, TrevasQ Quantum Solutions' quantum cybersecurity offering. It handles timezone-aware slot booking, database-level double-booking prevention, automated confirmation emails with `.ics` calendar invites, and secure token-based reschedule/cancel flows.

Built as a technical assessment for the Software Developer Intern role at TrevasQ.

🔗 **Live Demo:** *[add your Vercel URL here]*
📦 **GitHub:** [sakshi-dukare1/qguard-demo-scheduler](https://github.com/sakshi-dukare1/qguard-demo-scheduler)

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 📅 **Smart Scheduling** | 30-minute slots, past slots automatically hidden |
| 🌍 **Timezone Support** | Auto-detects visitor's timezone, allows manual override, consistently converts across UI, confirmation page, and email |
| 🔒 **Double-Booking Prevention** | Enforced at both the application layer *and* the database layer via a PostgreSQL unique constraint — verified under real concurrent requests |
| 📧 **Email Confirmations** | Automated emails via Resend, including a downloadable `.ics` calendar invite |
| 🔄 **Reschedule & Cancel** | Secure, non-guessable token-based links; releases the old slot automatically |
| ✅ **Input Validation** | Layered validation (`express-validator` + `validator.js`) on every field, with clear structured error responses |
| ⚡ **Non-blocking Email** | Booking confirmation is returned to the user immediately; email sending happens in the background and can't slow down or fail the booking itself |

---

## 🏗️ Tech Stack

All technologies used are open-source (per assessment requirement).

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Frontend** | React, React Router | UI and routing |
| | Axios | API requests |
| | Moment Timezone | Timezone conversion and display |
| | react-datepicker | Date selection UI |
| **Backend** | Node.js, Express | REST API server |
| | express-validator, validator.js | Input validation |
| | Resend | Transactional email delivery |
| | `ics` (npm) | `.ics` calendar invite generation |
| | Node `crypto` module | Secure random token generation |
| **Database** | Supabase (PostgreSQL) | Bookings and available-slots storage; unique constraint for double-booking prevention |

---

## 📁 Project Structure

```
qguard-demo-scheduler/
├── backend/
│   ├── config/
│   │   └── supabase.js
│   ├── controllers/
│   │   └── booking.js
│   ├── routes/
│   │   └── booking.js
│   ├── services/
│   │   └── email.js
│   ├── utils/
│   │   └── token.js
│   ├── test-concurrency.js
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/ (BookingPage, ConfirmationPage, etc.)
│   │   └── services/
│   │       └── api.js
│   ├── public/
│   └── package.json
├── .gitignore
├── LICENSE
├── README.md
└── TESTING.md
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js (v16+)
- npm (v8+)
- A [Supabase](https://supabase.com) account (free tier)
- A [Resend](https://resend.com) account (free tier) for email sending

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/sakshi-dukare1/qguard-demo-scheduler.git
cd qguard-demo-scheduler

# 2. Install backend dependencies
cd backend
npm install

# 3. Install frontend dependencies
cd ../frontend
npm install

# 4. Set up environment variables (see below)
```

### Environment Variables

**Backend (`backend/.env`)**
```env
SUPABASE_URL=your-supabase-url
SUPABASE_KEY=your-supabase-anon-key
RESEND_API_KEY=your-resend-api-key
FRONTEND_URL=http://localhost:3000
PORT=5000
```

**Frontend (`frontend/.env`)**
```env
REACT_APP_API_URL=http://localhost:5000
```

> ⚠️ Save both `.env` files as **UTF-8 without BOM**. Some Windows tools (e.g. PowerShell's `>` redirect) write UTF-16 by default, which `dotenv` fails to parse silently. Use a code editor and confirm the encoding before saving.

### Database setup

In addition to your `available_slots` and `bookings` tables, run this once in the Supabase SQL editor to enforce double-booking prevention at the database level:

```sql
CREATE UNIQUE INDEX unique_confirmed_slot
ON bookings (slot_start)
WHERE status = 'CONFIRMED';
```

### Run Locally

```bash
# Terminal 1: Backend
cd backend
npm run dev

# Terminal 2: Frontend
cd frontend
npm start
```

Open `http://localhost:3000` to view the app.

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/slots?date=YYYY-MM-DD` | Get available slots for a date (excludes weekends, past slots, and already-booked slots) |
| `POST` | `/api/bookings` | Create a booking |
| `GET` | `/api/bookings/:token` | Get a booking by its secure token |
| `PUT` | `/api/bookings/:token/reschedule` | Reschedule to a new slot; releases the old one |
| `PUT` | `/api/bookings/:token/cancel` | Cancel a booking; releases the slot |

---

## 🔒 Security

| Measure | Implementation |
|---------|----------------|
| Input Validation | `express-validator` + `validator.js`, layered checks per field |
| Secure Tokens | Cryptographically random tokens via Node's `crypto` module — not guessable, not sequential |
| Environment Variables | All secrets loaded from `.env` (gitignored); nothing hardcoded in source |
| Double Booking | PostgreSQL `UNIQUE` index on `(slot_start)` filtered to `status = 'CONFIRMED'` — closes the race condition an application-only check can't catch |
| Past-slot Booking | Rejected server-side on both `/api/slots` and `/api/bookings`, not just hidden in the UI |
| Error Handling | Invalid/nonexistent tokens return a generic `404`, never a raw database error |

---

## 🧪 Testing

This project was tested manually and via scripted concurrency and API tests, including a specific test proving double-booking prevention holds under real simultaneous requests (not just sequential checks).

See **[TESTING.md](TESTING.md)** for the full test plan, results, and evidence.

---

## 🚀 Deployment

- **Backend:** deployed on [Render](https://render.com)
- **Frontend:** deployed on [Vercel](https://vercel.com)

Set the same environment variables listed above in each platform's dashboard (Render → Environment; Vercel → Project Settings → Environment Variables), pointing `FRONTEND_URL` and `REACT_APP_API_URL` at the deployed URLs rather than `localhost`.

---

## 📄 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

---

## 📞 Contact

**Sakshi Dukare**
📧 sakshidukare445@gmail.com
🔗 [GitHub](https://github.com/sakshi-dukare1)

**Project Link:** [https://github.com/sakshi-dukare1/qguard-demo-scheduler](https://github.com/sakshi-dukare1/qguard-demo-scheduler)

---

*Built for the Software Developer Intern technical assessment — TrevasQ Quantum Solutions.*