# Mind-Sync Environment Variables

This document describes all environment variables required to run the Mind-Sync application.

## Required Variables

### Authentication (Clerk)

| Variable                            | Description                            | Required |
| ----------------------------------- | -------------------------------------- | -------- |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk public key for client-side auth  | ✅ Yes   |
| `CLERK_SECRET_KEY`                  | Clerk secret key for server-side auth  | ✅ Yes   |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL`     | Sign-in page URL (default: `/sign-in`) | Optional |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL`     | Sign-up page URL (default: `/sign-up`) | Optional |

### Database

| Variable       | Description                  | Required |
| -------------- | ---------------------------- | -------- |
| `DATABASE_URL` | PostgreSQL connection string | ✅ Yes   |

### AI Services

| Variable         | Description                           | Required |
| ---------------- | ------------------------------------- | -------- |
| `GEMINI_API_KEY` | Google Gemini API key for AI features | Optional |

### Google Calendar Integration

| Variable               | Description                | Required |
| ---------------------- | -------------------------- | -------- |
| `GOOGLE_CLIENT_ID`     | Google OAuth client ID     | Optional |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret | Optional |
| `GOOGLE_REDIRECT_URI`  | OAuth redirect URI         | Optional |

## Optional Variables

### Deployment

| Variable              | Description                        | Required |
| --------------------- | ---------------------------------- | -------- |
| `NEXT_PUBLIC_APP_URL` | Application URL for absolute links | Optional |

### Analytics & Monitoring

| Variable            | Description               | Required |
| ------------------- | ------------------------- | -------- |
| `SENTRY_DSN`        | Sentry error tracking DSN | Optional |
| `NEXT_PUBLIC_GA_ID` | Google Analytics ID       | Optional |

## GitHub Actions Secrets

The following secrets should be configured in GitHub repository settings:

| Secret                              | Description                        |
| ----------------------------------- | ---------------------------------- |
| `CLERK_SECRET_KEY`                  | Clerk secret for CI builds         |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk public key for CI builds     |
| `GEMINI_API_KEY`                    | Gemini API key for AI features     |
| `CODECOV_TOKEN`                     | Codecov token for coverage reports |
| `SNYK_TOKEN`                        | Snyk token for security scanning   |
| `NETLIFY_AUTH_TOKEN`                | Netlify deploy token               |
| `NETLIFY_SITE_ID`                   | Netlify site ID                    |

## Example .env.local

```bash
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/mindsync

# AI Services (optional)
GEMINI_API_KEY=your_gemini_api_key

# Google Calendar (optional)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback
```

## Security Notes

1. **Never commit `.env` files** to version control
2. Use `.env.local` for local development (gitignored)
3. Set production variables in your hosting platform (Vercel, Netlify, etc.)
4. Rotate secrets regularly
5. Use different keys for development and production
