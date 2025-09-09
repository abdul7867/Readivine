# Local OAuth Authentication Test

## Quick Test Instructions

To test the OAuth flow locally before deployment:

### 1. Start the Backend
```bash
cd backend
npm run dev
```

### 2. Start the Frontend
```bash
cd frontend
npm run dev
```

### 3. Test OAuth Redirect
Open your browser and navigate to:
```
http://localhost:8080/api/v1/auth/github
```

**Expected Result:** You should be redirected to GitHub's OAuth authorization page.

### 4. Test Auth Check Endpoint
```bash
curl http://localhost:8080/api/v1/auth/check
```

**Expected Result:** Should return a JSON response indicating authentication status.

### 5. Test Full Flow
1. Go to `http://localhost:5173`
2. Click "Login with GitHub"
3. Complete GitHub OAuth
4. Verify you're redirected to dashboard
5. Refresh the page to ensure authentication persists

## Environment Variables Required

### Backend (.env)
```bash
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
GITHUB_CALLBACK_URL=http://localhost:8080/api/v1/auth/github/callback
FRONTEND_URL=http://localhost:5173
```

### Frontend (.env)
```bash
VITE_API_BASE_URL=http://localhost:8080/api/v1
```

## Troubleshooting

- **OAuth redirect fails**: Check GitHub OAuth app configuration
- **Cookies not working**: Ensure both servers are running on correct ports
- **CORS errors**: Verify FRONTEND_URL matches the actual frontend URL

## Production Deployment

Once local testing passes:
1. Update environment variables for production URLs
2. Deploy backend to Render
3. Deploy frontend to Vercel
4. Test the production OAuth flow

The refactored code is now production-ready with proper modular structure.