# 🚀 Deployment Guide — SmartInventory Pro

## Architecture
- **Frontend (React)** → Vercel (free)
- **Backend (Express)** → Render (free)
- **Database (MongoDB)** → MongoDB Atlas (free 512MB)

---

## STEP 1 — MongoDB Atlas (Free Database)

1. Go to: https://cloud.mongodb.com
2. Click **"Try Free"** → Sign up
3. Create a **free cluster** (M0 Sandbox)
4. Click **"Connect"** → **"Connect your application"**
5. Copy the connection string: `mongodb+srv://user:pass@cluster.mongodb.net/smart_inventory`
6. Go to **Network Access** → Add IP: `0.0.0.0/0` (allow all)
7. **Save your connection string** — you'll need it in Step 2 & 3

---

## STEP 2 — Backend on Render (Free)

1. Go to: https://render.com → Sign up with GitHub
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository
4. Settings:
   - **Name:** `smart-inventory-api`
   - **Build Command:** `npm install`
   - **Start Command:** `node server/index.js`
   - **Plan:** Free
5. Add **Environment Variables**:
   ```
   NODE_ENV = production
   PORT = 10000
   MONGO_URI = mongodb+srv://youruser:yourpass@cluster.mongodb.net/smart_inventory
   JWT_SECRET = smartinventory_super_secret_jwt_key_2024
   JWT_EXPIRE = 30d
   CLIENT_URL = https://smart-inventory-xxx.vercel.app
   SMTP_HOST = smtp.ethereal.email
   SMTP_PORT = 587
   SMTP_EMAIL = your_email
   SMTP_PASSWORD = your_password
   FROM_NAME = SmartInventory Pro
   FROM_EMAIL = your_email
   ```
6. Click **"Create Web Service"**
7. Wait for deployment — copy the URL: `https://smart-inventory-api.onrender.com`

---

## STEP 3 — Frontend on Vercel (Free)

1. Go to: https://vercel.com → Sign up with GitHub
2. Click **"New Project"** → Import your repository
3. Settings:
   - **Framework Preset:** Create React App
   - **Root Directory:** `client`
   - **Build Command:** `npm run build`
   - **Output Directory:** `build`
4. Add **Environment Variables**:
   ```
   REACT_APP_API_URL = https://smart-inventory-api.onrender.com/api
   ```
5. Click **"Deploy"**
6. Your app URL: `https://smart-inventory-xxx.vercel.app`

---

## STEP 4 — Update Backend CORS

After getting your Vercel URL, go to Render Dashboard:
- Update `CLIENT_URL` environment variable to your Vercel URL
- Render will auto-redeploy

---

## STEP 5 — Seed Production Database

After backend is deployed, run the seeder:
```bash
# In your local terminal
MONGO_URI="mongodb+srv://youruser:yourpass@cluster.mongodb.net/smart_inventory" node server/utils/seeder.js
```

---

## GitHub Setup (Required)

```bash
# In VS Code terminal
git init
git add .
git commit -m "Initial commit — SmartInventory Pro"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/smart-inventory.git
git push -u origin main
```

---

## Free Tier Limits

| Service | Free Limit |
|---------|-----------|
| Vercel | Unlimited deployments, 100GB bandwidth |
| Render | 750 hours/month (sleeps after 15min inactive) |
| MongoDB Atlas | 512MB storage, shared cluster |

> ⚠️ **Render free tier sleeps after 15 minutes of inactivity** — first request takes ~30 seconds to wake up. Upgrade to Starter ($7/mo) to avoid this.
