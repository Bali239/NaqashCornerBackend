# Deploy Naqash Corner

The frontend and backend are separate GitHub repositories, so deploy them as two services.

## 1. Deploy the backend to Render

Create a **Web Service** from `Bali239/NaqashCornerBackend`, branch `main`.

| Setting | Value |
| --- | --- |
| Root Directory | `.` (repository root) |
| Runtime | Node |
| Build Command | `npm ci` |
| Start Command | `npm start` |
| Health Check Path | `/health` |

The repository pins Node to `24.21.0` with `.node-version`. Render supplies `PORT`; do not hardcode it.

Set these environment variables in Render. Keep credentials in the dashboard, never in Git:

| Variable | Value |
| --- | --- |
| `NODE_ENV` | `production` |
| `MONGO_URI` | MongoDB Atlas connection string |
| `CLIENT_URL` | Production Vercel URL, for example `https://your-store.vercel.app` |
| `GOOGLE_CLIENT_ID` | OAuth web client ID |
| `GOOGLE_CLIENT_SECRET` | OAuth web client secret |
| `GOOGLE_REDIRECT_URI` | `https://naqashcornerbackend.onrender.com/api/auth/google/callaback` |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret |
| `ADMIN_EMAILS` | Comma-separated admin email addresses |

Optional settings with defaults: `STORE_CURRENCY=PKR`, `SESSION_TTL_DAYS=7`, `MAX_IMAGE_SIZE_BYTES=5242880`, and `MAX_PRODUCT_IMAGES=8`.

For MongoDB Atlas, allow the Render service's outbound IP ranges in the Atlas project's IP Access List. Get the ranges from the Render service's **Connect → Outbound** panel. Avoid opening Atlas to all IP addresses for production.

## 2. Deploy the frontend to Vercel

Create a Vercel project from `Bali239/NaqashCornerFrontend`, branch `main`.

| Setting | Value |
| --- | --- |
| Framework Preset | Next.js |
| Root Directory | `.` (repository root) |
| Build Command | `npm run build` |

Set this Vercel environment variable for **Production**:

| Variable | Value |
| --- | --- |
| `NEXT_PUBLIC_API_URL` | `https://naqashcornerbackend.onrender.com` |

`NEXT_PUBLIC_API_URL` is embedded in the client bundle at build time, so redeploy after changing it.

## 3. Finish Google OAuth configuration

In the Google Cloud OAuth web client, add this exact **Authorized redirect URI** (replace the Render service name):

```text
https://naqashcornerbackend.onrender.com/api/auth/google/callaback
```

The callback path intentionally retains the project's existing spelling `callaback`. This URL must use the Render backend host; `CLIENT_URL` is the Vercel frontend origin that receives the user after the callback. The OAuth client ID and secret belong in Render only; do not put the client secret in Vercel.

After Vercel gives you the production URL, set that exact URL as Render's `CLIENT_URL` and redeploy the backend. This is also the allowed browser origin for the API's CORS policy. Then redeploy the frontend with the Render API URL and test `/health`, product listing, Google sign-in, and an admin sign-in.

Before making Google sign-in public, configure the OAuth consent screen and ensure the production homepage, terms, and privacy policy meet Google's verification requirements. Add your owned production domain there if you use a custom domain.
