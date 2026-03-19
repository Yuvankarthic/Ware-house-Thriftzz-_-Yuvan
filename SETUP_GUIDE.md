# WHT Fashion - Setup Guide

## ✅ Project Setup Complete

Your project has been successfully configured and is running on your new laptop!

---

## 🚀 Quick Start

### Start the Application:

**Terminal 1 - Backend (API Server):**
```bash
cd C:\websiteu1\server
node index.js
```
Runs on: **http://localhost:4000**

**Terminal 2 - Frontend (React App):**
```bash
cd C:\websiteu1
npm run dev
```
Runs on: **http://localhost:3003** (or next available port)

---

## 📋 What Was Configured

### Tech Stack:
- **Frontend:** React 18.2 + Vite 2.9 + React Router v5
- **Backend:** Node.js Express.js 
- **Database:** Supabase PostgreSQL
- **Animation:** Framer Motion v6.5
- **Icons:** Lucide React v0.104
- **Charts:** Recharts v2.5
- **Maps:** React Leaflet v4.2

### Database Setup:
✅ Supabase PostgreSQL connected
✅ Tables created: `products`, `staff`, `orders`, `order_timeline`
✅ 9 sample products seeded
✅ Default admin user created

### Admin Credentials:
```
Email: admin@wht.store
Password: admin123
```

---

## 🔗 URLs

| Service | URL | Description |
|---------|-----|-------------|
| **Frontend** | http://localhost:3003 | Main storefront |
| **Admin** | http://localhost:3003/admin | Admin dashboard |
| **Backend API** | http://localhost:4000 | REST API |
| **Health Check** | http://localhost:4000/health | API status |

---

## 📁 Project Structure

```
C:\websiteu1\
├── src/                 # React components & pages
├── server/              # Express backend
│   ├── routes/         # API endpoints
│   ├── .env            # Database credentials
│   └── index.js        # Server entry point
├── public/             # Static assets & images
├── package.json        # Frontend dependencies
├── server/package.json # Backend dependencies
└── vite.config.js      # Vite configuration
```

---

## 🔧 Useful Commands

### Frontend:
```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
npm run lint     # Run ESLint
```

### Backend:
```bash
cd server
npm start        # Start production server
npm run dev      # Start with nodemon (auto-reload)
node migrate.js  # Run database migrations
```

---

## ⚙️ Environment Configuration

### Backend (.env file location):
`C:\websiteu1\server\.env`

```env
DATABASE_URL=postgresql://postgres:henaankarthick@db.ueegnpygvlsxqjnuulwv.supabase.co:5432/postgres
PORT=4000
JWT_SECRET=wht_fashion_jwt_secret_key_2025_change_in_production
NODE_ENV=development
```

---

## 🐛 Troubleshooting

### Port Already in Use:
The frontend automatically switches to the next available port (3001, 3002, 3003, etc.)

### Blank Page?
- Hard refresh: `Ctrl+Shift+Esc`
- Clear browser cache
- Restart dev server

### Database Connection Issues:
- Verify Supabase credentials in `server/.env`
- Check internet connection
- Ensure Supabase project is active

### Module Errors:
```bash
rm -r node_modules package-lock.json
npm install
```

---

## 📝 Git Commit History

Latest: **Setup completed: React 18, Supabase, all dependencies configured and working**

---

## 🎯 Next Steps

1. ✅ Project cloned and running
2. ✅ Supabase database configured
3. ✅ Dependencies installed
4. ✅ Dev servers running

**You're all set!** Start building and enjoy your development environment. 🚀

---

**Last Setup:** March 19, 2026
**Status:** ✅ Fully Operational
