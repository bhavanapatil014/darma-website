---
description: How to Deploy the Application (Frontend & Backend)
---
# How to Deploy the Application (Frontend & Backend)

Since your project consists of two parts (Frontend in Next.js, Backend in Node.js/Express) and uses MongoDB, you need to deploy them appropriately.

## Prerequisites
1.  **GitHub Account**: You need to push your code to a GitHub repository.
2.  **MongoDB Atlas**: Your database is already on MongoDB Atlas (cloud), so no changes needed there. Just ensure `0.0.0.0/0` (allow all) or the specific deployment IP is whitelisted in Network Access.

---

## Part 1: Backend Deployment (Render.com - Recommended for Free/Cheap Node.js)

We will use **Render** because it makes deploying Node.js apps very easy.

1.  **Push Code to GitHub**:
    *   Initialize git in your root (`D:\Darma website`).
    *   Create a `.gitignore` if not exists (include `node_modules`, `.env`).
    *   Push to a new repo.

2.  **Create Web Service on Render**:
    *   Go to [dashboard.render.com](https://dashboard.render.com).
    *   Click **New +** -> **Web Service**.
    *   Connect your GitHub repo.
    *   **Root Directory**: `backend` (Important! Your backend is in a subfolder).
    *   **Build Command**: `npm install`
    *   **Start Command**: `node server.js`
    *   **Environment Variables**: Add the following:
        *   `MONGO_URI`: (Your full connection string)
        *   `JWT_SECRET`: (Your secret key)
        *   `PORT`: `10000` (Render uses this port usually, or standard 3000)

3.  **Get Backend URL**:
    *   Once deployed, Render will give you a URL like `https://darma-backend.onrender.com`.
    *   **Copy this URL**. You need it for the frontend.

---

## Part 2: Frontend Deployment (Vercel - Best for Next.js)

1.  **Update Frontend API Calls**:
    *   Currently, your frontend points to `http://localhost:4000`.
    *   You need to change this to an **Environment Variable**.
    *   In `frontend/src/lib/data.ts` and anywhere else you fetch data:
        *   Change `http://localhost:4000` to `process.env.NEXT_PUBLIC_API_URL`.

2.  **Create Project on Vercel**:
    *   Go to [vercel.com](https://vercel.com).
    *   **Add New...** -> **Project**.
    *   Import the same GitHub repo.
    *   **Root Directory**: click Edit and select `frontend`.
    *   **Environment Variables**:
        *   `NEXT_PUBLIC_API_URL`: Paste your Render Backend URL (e.g., `https://darma-backend.onrender.com`).
        *   (Note: Do NOT add a trailing slash `/` at the end usually, or handle it in code).

3.  **Deploy**:
    *   Click **Deploy**.
    *   Vercel will build your Next.js app and give you a live URL (e.g., `darma-website.vercel.app`).

---

## Important Code Changes Before Deploying

You **must** update your code to use the environment variable instead of localhost.

### 1. Create/Update `.env.local` (Local) and Vercel Env (Production)
In your `frontend` folder, assume:
*   `NEXT_PUBLIC_API_URL=http://localhost:4000` (for local dev)
*   On Vercel, set it to the real backend URL.

### 2. Update Files
I can automatically update your files to use this variable if you want.
Common files needing update:
*   `src/lib/data.ts`
*   `src/app/admin/...` files
*   `src/lib/cart-context.tsx`
*   `src/components/layout/navbar.tsx`

---

## Summary of Costs
*   **Vercel (Frontend)**: Free (Hobby tier).
*   **Render (Backend)**: Free (limits apply, spins down after inactivity) or $7/month for always-on.
*   **MongoDB Atlas**: Free (Sandbox) or paid.

**Would you like me to refactor your code to use `NEXT_PUBLIC_API_URL` now so it is ready for deployment?**
