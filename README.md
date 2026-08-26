<!-- PROJECT LOGO & HEADER -->
<div align="center">
  <img src="https://img.shields.io/badge/Quantum-Security-7B2FFC?style=for-the-badge&logo=quantum&logoColor=white" alt="Quantum Security" />
  <br />
  <img src="https://readme-typing-svg.demolab.com?font=Fira+Code&weight=700&size=40&duration=3000&pause=1000&color=00D4FF&center=true&vCenter=true&width=600&height=70&lines=QGuard+Demo+Scheduler;Production+Ready+Booking+System" alt="Typing Animation" />
  <br />
  <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" />
  <img src="https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white" alt="Supabase" />
  <img src="https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/JWT-000000?style=for-the-badge&logo=JSON%20web%20tokens&logoColor=white" alt="JWT" />
  <img src="https://img.shields.io/badge/Nodemailer-339933?style=for-the-badge&logo=nodemailer&logoColor=white" alt="Nodemailer" />
  <br />
  <img src="https://img.shields.io/badge/Status-Complete-brightgreen?style=for-the-badge" alt="Status" />
  <img src="https://img.shields.io/badge/License-MIT-blue?style=for-the-badge" alt="License" />
  <img src="https://img.shields.io/badge/PRs-Welcome-brightgreen?style=for-the-badge" alt="PRs Welcome" />
</div>

<br />

<!-- TABLE OF CONTENTS -->
<details>
  <summary><b>📚 Table of Contents</b></summary>
  <ol>
    <li><a href="#-about-the-project">About The Project</a></li>
    <li><a href="#-key-features">Key Features</a></li>
    <li><a href="#-technology-stack">Technology Stack</a></li>
    <li><a href="#-architecture">Architecture</a></li>
    <li><a href="#-getting-started">Getting Started</a></li>
    <li><a href="#-deployment">Deployment</a></li>
    <li><a href="#-security">Security</a></li>
    <li><a href="#-screenshots">Screenshots</a></li>
    <li><a href="#-contributing">Contributing</a></li>
    <li><a href="#-license">License</a></li>
    <li><a href="#-contact">Contact</a></li>
  </ol>
</details>

---

## 🚀 About The Project

<div align="center">
  <img src="https://readme-typing-svg.demolab.com?font=Fira+Code&weight=500&size=18&duration=2000&pause=500&color=00D4FF&center=true&vCenter=true&width=800&height=40&lines=⚡+Schedule+quantum+security+demos+in+seconds;🔒+Secure+token-based+reschedule+%26+cancel;🌍+Timezone-aware+booking+system;📧+Automated+email+confirmations+with+calendar+invites" alt="Feature Animation" />
</div>

<br />

**QGuard Demo Scheduler** is a full-stack, production-ready booking platform designed for **TrevasQ Quantum Solutions**. It allows enterprise customers to schedule product demonstrations with seamless timezone support, automated email confirmations, and secure reschedule/cancel functionality.

### 🎯 Why This Project Stands Out

| Aspect | Description |
|--------|-------------|
| **Production Ready** | Secure, scalable, and built with best practices |
| **Full-Stack** | Complete frontend + backend + database solution |
| **Enterprise Grade** | Email validation, calendar invites, token security |
| **User Experience** | Intuitive UI with confirmation modals and real-time feedback |

---

## ✨ Key Features

### 📅 Booking Experience
```mermaid
graph LR
    A[Visit Page] --> B[Fill Details]
    B --> C[Select Date & Time]
    C --> D[Review & Confirm]
    D --> E[Email Confirmation]
    E --> F[Calendar Invite]

Feature	Description	Status
Smart Timezone Detection	Auto-detects and displays slots in user's timezone	✅
Double Booking Prevention	Database-level constraints prevent conflicts	✅
30-Minute Slots	Standardized demo slots for consistency	✅
Confirmation Modals	Prevent accidental bookings	✅
📧 Email & Calendar Integration
Feature	Description	Status
Booking Confirmations	Automated HTML emails with details	✅
Calendar Invites	.ics file attachments for Google/Outlook	✅
Reschedule Links	Secure token-based links to change time	✅
Cancel Links	One-click cancellation with confirmation	✅
Cancellation Emails	User notified on cancellation	✅
🔒 Security Layer






Layer	Validation	Tool
1️⃣	Email format	validator.js
2️⃣	Common typos (.con → .com)	Custom
3️⃣	Domain existence	DNS MX lookup
4️⃣	Ownership verification	Confirmation email
🛠️ Technology Stack
Frontend






Technology	Purpose
React.js	UI framework with hooks
React Router	Navigation between pages
React Datepicker	Intuitive date selection
Moment Timezone	Timezone handling
Axios	HTTP requests
CSS3	Custom styling with animations
Backend





Technology	Purpose
Node.js	JavaScript runtime
Express	REST API framework
Supabase Client	Database queries
Nodemailer	Email automation
Validator.js	Input validation
Express Validator	Request validation
JWT	Token generation
Database
Technology	Purpose
Supabase	PostgreSQL as a service
Row Level Security	Data protection
🏗️ Architecture
System Flow







API Endpoints
Method	Endpoint	Purpose
GET	/api/slots?date=2024-01-15	Fetch available slots
POST	/api/bookings	Create new booking
GET	/api/bookings/:token	Retrieve booking details
PUT	/api/bookings/:token/reschedule	Reschedule booking
PUT	/api/bookings/:token/cancel	Cancel booking
🚀 Getting Started
Prerequisites
Tool	Version
Node.js	v16+
npm	v8+
Supabase	Account required
Gmail	For email service
Installation
bash
# 1. Clone the repository
git clone https://github.com/sakshi-dukare1/qguard-demo-scheduler.git
cd qguard-demo-scheduler

# 2. Install backend dependencies
cd backend
npm install

# 3. Install frontend dependencies
cd ../frontend
npm install

# 4. Backend environment setup
cd ../backend
cp .env.example .env
# Edit .env with your credentials

# 5. Frontend environment setup
cd ../frontend
cp .env.example .env
# Edit .env with your API URL
Environment Variables
env
# Backend .env
SUPABASE_URL="your-supabase-url"
SUPABASE_KEY="your-supabase-anon-key"
EMAIL_USER="your-email@gmail.com"
EMAIL_PASS="your-16-digit-app-password"
JWT_SECRET="your-secret-key"
PORT=5000

# Frontend .env
REACT_APP_API_URL="http://localhost:5000/api"
Running the Application
bash
# Terminal 1: Backend
cd backend
npm run dev

# Terminal 2: Frontend
cd frontend
npm start
📦 Deployment
Backend (Railway)
bash
cd backend
railway up
Frontend (Vercel)
bash
cd frontend
vercel --prod
🔐 Security
Security Measure	Implementation
Secure Tokens	64-character crypto.randomBytes()
Email Validation	4-layer validation system
Input Sanitization	express-validator middleware
Environment Variables	All secrets in .env
Database Protection	Row Level Security (RLS)
Double Booking Prevention	Database UNIQUE constraint
📸 Screenshots
<div align="center"> <img src="https://img.shields.io/badge/Screenshots-Coming_Soon-00D4FF?style=for-the-badge" alt="Screenshots" /> </div>
Page	Description
🏠 Home Page	QGuard introduction with "Schedule Demo" CTA
📝 Booking Page	Form with timezone-aware slot selection
✅ Confirmation Page	Booking details with reschedule/cancel options
🔄 Reschedule Page	Pick new time with confirmation modal
❌ Cancel Page	Confirm cancellation with warning
🤝 Contributing
We welcome contributions! Here's how:

Fork the repository

Create your branch (git checkout -b feature/AmazingFeature)

Commit changes (git commit -m 'Add some AmazingFeature')

Push to branch (git push origin feature/AmazingFeature)

Open a Pull Request

📄 License
Distributed under the MIT License. See LICENSE for more information.

📞 Contact
Sakshi Dukare
📧 sakshidukare445@gmail.com
🔗 GitHub

Project Link: https://github.com/sakshi-dukare1/qguard-demo-scheduler

⭐ Show Your Support
If this project helped you, please ⭐ star the repository!

<div align="center"> <img src="https://readme-typing-svg.demolab.com?font=Fira+Code&weight=600&size=20&duration=2000&pause=1000&color=00D4FF&center=true&vCenter=true&width=500&height=30&lines=🌟+Star+this+repo+if+you+like+it!;🚀+Built+with+❤️+by+Sakshi" alt="Footer Animation" /> </div>
<footer align="center"> <p>Built with ❤️ for <strong>TrevasQ Quantum Solutions</strong></p> <p>© 2026 Sakshi Dukare. All rights reserved.</p> </footer> ```
