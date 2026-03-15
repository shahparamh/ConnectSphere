# ConnectSphere Deployment Guide (Render & Vercel)

This guide will walk you through deploying **ConnectSphere** so you can start connecting with people. We will use **Render** for the backend (Node.js/Express) and **Vercel** for the frontend (React/Vite).

---

## 🛠️ Prerequisites

1.  A **GitHub** account with your code pushed to a repository.
2.  A **MongoDB Atlas** account (already configured via `.env` with URI).
3.  A **Render** account ([render.com](https://render.com)).
4.  A **Vercel** account ([vercel.com](https://vercel.com)).

---

## 🚀 Step 1: Deploy Backend to Render

### 1. Create a New Web Service
1.  Log in to **Render** and click **New +** -> **Web Service**.
2.  Connect your GitHub repository and select the repository.
3.  Choose **Node** as the environment.

### 2. Configure Service Settings
-   **Name:** `connectsphere-backend` (or choice)
-   **Root Directory:** `backend`
-   **Build Command:** `npm install`
-   **Start Command:** `node server.js`  *(or `npm start` if registered)*
-   **Instance Type:** Free (suitable for testing)

### 3. Add Environment Variables
Click on **Advanced** -> **Add Environment Variable** and add the following:

| Key | Value |
| :--- | :--- |
| `PORT` | `10000` *(Render sets this automatically, but good practice)* |
| `MONGO_URL` | *Your MongoDB Atlas connection string* |
| `JWT_SECRET` | *A random long string (e.g., `supersecretkey_123`)* |
| `CLIENT_URL` | *Leave blank for now, you will update this after Frontend Deployment* |
| `GOOGLE_CLIENT_ID` | *Your Google OAuth Client ID* |
| `GROQ_API_KEY` | *Your Groq AI API Key* |

Click **Create Web Service**. Wait for the build to complete. 
Copy your backend URL (e.g., `https://connectsphere-backend.onrender.com`).

---

## 🚀 Step 2: Deploy Frontend to Vercel

### 1. Create a New Project
1.  Log in to **Vercel** and click **Add New** -> **Project**.
2.  Import your GitHub repository.

### 2. Configure Project Settings
-   **Framework Preset:** `Vite` (Vercel usually detects this)
-   **Root Directory:** `frontend`
-   **Build Command:** `npm run build`
-   **Output Directory:** `dist`

### 3. Add Environment Variables
Expand the **Environment Variables** section and add:

| Key | Value |
| :--- | :--- |
| `VITE_API_URL` | *Your Render Backend URL (e.g., `https://connectsphere-backend.onrender.com`)* |
| `VITE_GOOGLE_CLIENT_ID` | *Your Google OAuth Client ID* |

Click **Deploy**. Vercel will build and assign you a Live URL (e.g., `https://connectsphere.vercel.app`).

---

## 🔄 Step 3: Link Both Apps (Crucial)

### 1. Update Render Backend with Vercel URL
Now that you have your Vercel URL:
1.  Go back to **Render** -> your Web service -> **Environment**.
2.  Edit the `CLIENT_URL` variable to your Vercel URL:
    *   **Value:** `https://connectsphere.vercel.app`
3.  Save Changes. Render will re-deploy with CORS configured to allow your Vercel app.

### 2. Update Google Cloud Console (If using Google Auth)
1.  Go to **Google Cloud Console** -> APIs & Services -> Credentials.
2.  Edit your OAuth 2.0 Client ID.
3.  Add your Vercel URL to **Authorized JavaScript origins**.

---

## ✅ Deployment Verified!
Your setup is complete. You can now use your Vercel URL to log in, share location, and chat live. 

> [!NOTE]
> Since Render's Free tier goes to "sleep" after 15 minutes of inactivity, the **first request** (e.g., logging in) might take ~30 seconds to load if it is waking up.
