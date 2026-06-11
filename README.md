# 🏭 SmartInventory Pro

> Advanced Inventory Management System built with the MERN Stack

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-green)
![License](https://img.shields.io/badge/license-MIT-yellow)

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🔐 **Auth & RBAC** | JWT auth with Admin / Manager / Staff / Viewer roles |
| 📦 **Products** | Full CRUD, SKU, barcode, images, location tracking |
| 🏷️ **Categories** | Hierarchical categories with color coding |
| 🚚 **Suppliers** | Supplier management with ratings & payment terms |
| 💰 **Transactions** | Sales, purchases, adjustments with stock auto-update |
| 📊 **Dashboard** | Real-time KPIs, charts, low-stock alerts |
| 📈 **Reports** | Inventory valuation, sales trends, stock movement |
| 📄 **PDF Invoices** | Professional invoice generation with jsPDF |
| 🔔 **Notifications** | Real-time alerts via Socket.io |
| 🌙 **Dark/Light Mode** | Full theme support |
| 📱 **Responsive** | Mobile-first design |

---

## 🚀 Quick Start

### Prerequisites
- Node.js >= 18
- MongoDB >= 6
- npm or yarn

### 1. Clone & Install
```bash
git clone <repo-url>
cd smart-inventory-system
npm run install-all
```

### 2. Configure Environment
```bash
cp .env.example .env
# Edit .env with your values
```

### 3. Seed Database
```bash
npm run seed
```

### 4. Start Development
```bash
npm run dev
```

App runs at: **http://localhost:3000**
API runs at: **http://localhost:5000**

---

## 🔑 Demo Credentials

| Role | Name | Email | Password |
|------|------|-------|----------|
| Admin | Jadav Hitakshi | jadavhitakshi@gmail.com | Admin@123456 |
| Manager | Nandani Soni | nandanisoni8686@gmail.com | Manager@123456 |

---

## 📁 Project Structure

```
smart-inventory-system/
├── client/                    # React frontend
│   └── src/
│       ├── components/        # Reusable UI components
│       │   ├── layout/        # Sidebar, Header, Layout
│       │   ├── products/      # Product modals
│       │   ├── transactions/  # Transaction modals
│       │   └── common/        # Shared components
│       ├── pages/             # Route pages
│       ├── redux/             # Redux Toolkit store & slices
│       ├── services/          # API client, PDF service
│       └── index.css          # Global styles & CSS variables
│
├── server/                    # Express backend
│   ├── config/                # DB, Cloudinary config
│   ├── controllers/           # Route handlers
│   ├── middleware/            # Auth, error handler, validation
│   ├── models/                # Mongoose schemas
│   ├── routes/                # Express routers
│   ├── services/              # Socket.io, Cron jobs
│   └── utils/                 # Logger, email, API features
│
├── docker-compose.yml
├── .env
└── package.json
```

---

## 🛠️ Tech Stack

**Frontend:** React 18, Redux Toolkit, React Router v6, Chart.js, Framer Motion, React Icons, jsPDF, Socket.io Client

**Backend:** Node.js, Express.js, MongoDB, Mongoose, JWT, Socket.io, Winston, Node-Cron, Nodemailer

**DevOps:** Docker, Docker Compose

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/register` | Register |
| GET | `/api/products` | List products |
| POST | `/api/products` | Create product |
| GET | `/api/products/low-stock` | Low stock items |
| GET | `/api/dashboard/stats` | Dashboard stats |
| GET | `/api/reports/inventory` | Inventory report |
| GET | `/api/reports/sales` | Sales report |
| POST | `/api/transactions` | Create transaction |

---

## 🐳 Docker

```bash
docker-compose up -d
```

---

## 📄 License

MIT © SmartInventory Pro
