# Crisis Alert Project

A containerized full-stack web application (Next.js, Node.js, MySQL) designed to track, analyze, and alert on brand mentions or keywords across social platforms.

---

## 🎯 Purpose

This system manages and alerts on negative/positive content, allowing users to monitor critical information through Alerts, Case Studies, and centralized Post management.

---

## ✨ Key Features

* **🔐 User Authentication:** Secure registration and login using JSON Web Tokens (JWT).
* **🔔 Alert Management:** Customizable "Alerts" with specific keywords and platforms to monitor.
* **📄 Multi-format Exporting:** Supports generating professional reports in both **Excel (`.xlsx`)** and **PDF** formats with corporate-standard styling.
* **📈 Interactive Dashboard:** Provides a visual overview of mentions, sentiment analysis, and alert trends.
* **🤖 Automatic Linking:** Dedicated endpoint (`POST /api/posts`) for external crawlers/scanners. The system automatically scans content and links incoming Posts to matching Alerts.
* **⚡ Efficient Data Fetching:** Utilizes `useSWR` across all 6 main pages for real-time caching, fetching, and data revalidation.
* **🔍 Flexible Filtering:**
    * Real-time filtering by keyword (debounce).
    * Multi-select filters for Platform, Sentiment, Status, and Severity.
    * Filter states are preserved in the URL for easy sharing.
* **📱 Responsive Design:** Fully responsive interface built with Tailwind CSS, optimized for both desktop and mobile devices.
* **📁 Case Study Management:** Group related posts into a "Case Study" for in-depth analysis.
* **🛡️ Backend Security:** Strict input validation using `express-validator` for all API routes.

---

## 🛠️ Tech Stack

| Component | Technologies |
| :--- | :--- |
| **Frontend** | React, Next.js, `useSWR`, Tailwind CSS, `exceljs` |
| **Backend** | Node.js, Express.js, Sequelize (ORM) |
| **Database** | MySQL 8.0 |
| **DevOps** | Docker, Docker Compose |
| **Security** | JWT, `express-validator` |

---

## 📂 Project Structure

```text
crisis-alert/
├── backend/            # Node.js Server (Express)
│   ├── config/         # DB Configuration
│   ├── controllers/    # Logic Handling
│   ├── models/         # Sequelize Models
│   ├── routes/         # API Endpoints
│   └── .env            # (Do NOT commit this file)
├── frontend/           # Next.js Client
│   ├── components/     # Reusable components
│   ├── pages/          # Next.js Pages
│   └── public/         # Static assets
├── docker-compose.yml  # Docker Configuration
└── README.md           # Documentation
```
⚙️ Environment Configuration (.env)
Before running the project, create a .env file in the backend/ directory.

Example backend/.env:

Code snippet
```text
# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=crisis_alert_db

# JWT Security
JWT_SECRET=your_jwt_secret_here

# Email Configuration (If applicable)
EMAIL_USER=your_email_here
EMAIL_PASS=your_email_password_here
EMAIL_HOST=smtp.gmail.com
```

🚀 Installation & Setup
You can choose to run via Docker (Recommended) or Manually (For development).

Option 1: Using Docker (Recommended)
Prerequisites: Docker Desktop installed.

Clone repository:
```text
Bash

git clone [https://github.com/RankOutsider/crisis-alert.git](https://github.com/RankOutsider/crisis-alert.git)
cd crisis-alert
```
Start the application:
```text
Bash

docker-compose up --build
Frontend: http://localhost:3000

Backend: http://localhost:5000

Database: Automatically initialized within the container.
```
Option 2: Manual Setup (Development)
Prerequisites: Node.js >= 18, MySQL installed and running.

1. Backend Setup:
```text
Bash

cd backend
npm install
# Ensure .env is correctly configured with your local MySQL credentials
npm run dev
```
2. Frontend Setup:
```text
Bash

cd ../frontend
npm install --legacy-peer-deps
# Note: Use --legacy-peer-deps if you encounter React version conflicts
npm run dev
```
📝 Git Workflow (Development)
Common commands for managing the source code:

Commit Changes
```text
Bash

git add .
git commit -m "Description: Details of changes"
```
Push to Development Branch
```text
Bash

git push origin development
```
Merge to Master (Release)
```text
Bash

git checkout master
git pull origin master  # Pull latest master
git merge development   # Merge changes from dev
git push origin master
git checkout development # Switch back to dev
```
📞 Contact
If you encounter issues running the project or need configuration changes, please contact the developer directly.