# Environment Setup

This document describes the required environment variables for the Property Management Portal.

## Required Environment Variables

These variables must be configured in your hosting platform (Vercel, etc.) and are **not** exposed in the Site Settings UI.

### Supabase Configuration

| Variable | Description | Where to Find |
|----------|-------------|---------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL | Supabase Dashboard → Project Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public anonymous key for client-side Supabase | Supabase Dashboard → Project Settings → API → Project API Keys → `anon public` |
| `SUPABASE_SERVICE_ROLE_KEY` | **SECRET** - Service role key for server-side admin operations | Supabase Dashboard → Project Settings → API → Project API Keys → `service_role secret` |

**Security Note**: The `SUPABASE_SERVICE_ROLE_KEY` has full admin access to your database. Never expose it in client-side code or commit it to version control.

### Application URLs

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_APP_URL` | The main URL where the portal is hosted | `https://portal.trueproductsnetwork.com` |

This is used for:
- Generating login links sent to GHL
- Password reset email links
- Invitation email links

### GHL Integration (Optional)

If using GoHighLevel integration, these are configured via the Site Settings page (`/platform/site-settings`) rather than environment variables:

- `portal_url` - Stored in `app_settings` table
- `app_name` - Stored in `app_settings` table
- `support_email` - Stored in `app_settings` table

## Vercel Configuration

To set these in Vercel:

1. Go to your project dashboard
2. Click **Settings** → **Environment Variables**
3. Add each variable with its value
4. Redeploy the application

## Local Development

For local development, create a `.env.local` file:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Important**: Never commit `.env.local` to git. It should be in your `.gitignore`.

## Troubleshooting

### "Undefined" in URLs
If you see `undefined/login` or similar, the `NEXT_PUBLIC_APP_URL` environment variable is not set. The application has a fallback to `https://portal.trueproductsnetwork.com`, but you should set this explicitly.

### Database Access Errors
If you see errors about missing service role access, verify `SUPABASE_SERVICE_ROLE_KEY` is set correctly. This key is required for:
- Creating users via Platform Admin
- Fetching auth user details
- Admin operations in API routes
