# Production Deployment Guide

Your application is now production-ready. This guide provides instructions for deploying your full-stack application using Vercel for the frontend and Render for the backend.

---

## 1. Backend Deployment (Render)

Render is an excellent platform for hosting Node.js applications and databases.

### Step 1: Create a MongoDB Database on Render

1.  **Sign up or Log in** to [Render](https://dashboard.render.com/).
2.  From the dashboard, click **New +** > **MongoDB**.
3.  Give your database a name (e.g., `readivine-db`).
4.  Select a region close to your users.
5.  Click **Create Database**.
6.  Once created, find the **"Internal Connection String"** and copy it. This will be your `MONGODB_URI`.

### Step 2: Deploy the Node.js Backend on Render

1.  On the Render dashboard, click **New +** > **Web Service**.
2.  Connect your GitHub account and select your repository.
3.  Configure the service:
    *   **Name**: `readivine-backend` (or your preferred name).
    *   **Root Directory**: `backend` (This is crucial, as your backend is in a subdirectory).
    *   **Environment**: `Node`.
    *   **Build Command**: `npm install`.
    *   **Start Command**: `node index.js`.
4.  Click **Advanced** to set up environment variables.
5.  Click **Add Environment Variable** for each of the following:

| Key | Value | Notes |
| :--- | :--- | :--- |
| `MONGODB_URI` | `mongodb://...` | Paste the connection string from your Render MongoDB. |
| `CORS_ORIGIN` | `https://your-vercel-app-url.vercel.app` | **Important:** You will get this URL after deploying the frontend. |
| `ACCESS_TOKEN_SECRET` | `<generate a strong secret>` | Use a password generator for a long, random string. |
| `ACCESS_TOKEN_EXPIRY`| `1d` |  |
| `REFRESH_TOKEN_SECRET`| `<generate another strong secret>` | Must be different from the access token secret. |
| `REFRESH_TOKEN_EXPIRY`| `10d` |  |
| `GITHUB_CLIENT_ID` | `<your_github_client_id>` | From your GitHub OAuth App settings. |
| `GITHUB_CLIENT_SECRET`| `<your_github_client_secret>` | From your GitHub OAuth App settings. |
| `GITHUB_CALLBACK_URL`| `https://readivine-backend.onrender.com/api/v1/auth/github/callback` | Use your Render backend URL. |

6.  Click **Create Web Service**. Render will automatically build and deploy your backend.

---

## 2. Frontend Deployment (Vercel)

Vercel is optimized for hosting modern frontend frameworks like React.

### Step 1: Configure Your Project for Vercel

1.  **Sign up or Log in** to [Vercel](https://vercel.com/).
2.  Click **Add New...** > **Project**.
3.  Connect your GitHub account and select your repository.
4.  Vercel will automatically detect that you are using Vite.
5.  Expand the **Build and Output Settings** section and set the **Root Directory** to `frontend`.
6.  Expand the **Environment Variables** section and add the following:

| Key | Value | Notes |
| :--- | :--- | :--- |
| `VITE_API_URL` | `https://readivine-backend.onrender.com/api/v1` | The URL of your deployed Render backend. |

7.  Click **Deploy**. Vercel will build and deploy your frontend.

### Step 2: Update CORS Origin on Render

1.  Once your Vercel deployment is complete, you will get your public frontend URL (e.g., `https://your-app-name.vercel.app`).
2.  Go back to your backend service on **Render**.
3.  Navigate to the **Environment** tab.
4.  Update the `CORS_ORIGIN` variable with your actual Vercel frontend URL.
5.  Save the changes. Render will automatically restart your backend service with the new environment variable.

Your application is now live!
