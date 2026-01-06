# Darma E-commerce Project

## Quick Start (Standard)
1.  **Backend**: `cd backend` -> `node server.js`
2.  **Frontend**: `cd frontend` -> `npm run dev`

---

## Troubleshooting: "Command Not Found"
If you see errors like `'node' is not recognized`, use these commands instead.

### 1. Run Backend
Copy and paste this into Terminal 1:
```powershell
$env:Path = "C:\Program Files\nodejs;" + $env:Path
cd "d:\Darma website\backend"
node server.js
```

### 2. Run Frontend
Copy and paste this into Terminal 2:
```powershell
$env:Path = "C:\Program Files\nodejs;" + $env:Path
cd "d:\Darma website\frontend"
npm run dev
```
