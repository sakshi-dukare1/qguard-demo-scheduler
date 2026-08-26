# 🛡️ QGuard Demo Scheduler

> A production-ready demo scheduling system for quantum security solutions.

[![React](https://img.shields.io/badge/React-20232A?style=flat-square&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-43853D?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=flat-square&logo=supabase&logoColor=white)](https://supabase.com/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](http://makeapullrequest.com)

---

## 📌 Overview

**QGuard Demo Scheduler** is a full-stack web application that allows enterprise customers to schedule product demonstrations for **TrevasQ Quantum Solutions**. It handles timezone-aware booking, email confirmations with calendar invites, and secure reschedule/cancel functionality.

🔗 **Live Demo:** *Coming soon*  
📦 **GitHub:** [sakshi-dukare1/qguard-demo-scheduler](https://github.com/sakshi-dukare1/qguard-demo-scheduler)

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 📅 **Smart Scheduling** | 30-minute slots with double-booking prevention |
| 🌍 **Timezone Support** | Auto-detects user timezone with manual override |
| 📧 **Email Confirmations** | Automated emails with calendar invites (`.ics`) |
| 🔄 **Reschedule & Cancel** | Secure token-based links |
| 🔒 **Security** | Input validation, environment variables, secure tokens |
| ✅ **Confirmation Modals** | Prevent accidental bookings |

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React.js, React Router, Axios, Moment Timezone |
| **Backend** | Node.js, Express, Nodemailer, Validator.js |
| **Database** | Supabase (PostgreSQL) |
| **Security** | JWT, crypto tokens, express-validator |

---

## 📁 Project Structure

```
qguard-demo-scheduler/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── routes/
│   │   ├── services/
│   │   └── utils/
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   └── services/
│   ├── public/
│   └── package.json
├── .gitignore
├── LICENSE
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js (v16+)
- npm (v8+)
- Supabase account
- Gmail account (for email service)

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

# 4. Set up environment variables
cd ../backend
cp .env.example .env
# Edit .env with your credentials

cd ../frontend
cp .env.example .env
# Edit .env with your API URL
```

### Environment Variables

**Backend (`.env`)**
```env
SUPABASE_URL=your-supabase-url
SUPABASE_KEY=your-supabase-anon-key
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-16-digit-app-password
JWT_SECRET=your-secret-key
PORT=5000
```

**Frontend (`.env`)**
```env
REACT_APP_API_URL=http://localhost:5000/api
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
| `GET` | `/api/slots?date=YYYY-MM-DD` | Get available slots |
| `POST` | `/api/bookings` | Create a booking |
| `GET` | `/api/bookings/:token` | Get booking by token |
| `PUT` | `/api/bookings/:token/reschedule` | Reschedule booking |
| `PUT` | `/api/bookings/:token/cancel` | Cancel booking |

---

## 🔒 Security

| Measure | Implementation |
|---------|----------------|
| Input Validation | `express-validator` + `validator.js` |
| Secure Tokens | 64-character `crypto.randomBytes()` |
| Environment Variables | All secrets in `.env` (gitignored) |
| Double Booking | Database `UNIQUE` constraint |
| Email Validation | 4-layer validation (format → typo → MX → confirmation) |

---

## 🚀 Deployment

### Backend (Railway)
```bash
cd backend
railway up
```

### Frontend (Vercel)
```bash
cd frontend
vercel --prod
```

---

## 🤝 Contributing

Contributions are welcome! Please open an issue or submit a pull request.

1. Fork the repo
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

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

## ⭐ Support

If you found this project helpful, please consider giving it a ⭐ on GitHub!

---

*Built with ❤️ for TrevasQ Quantum Solutions*
