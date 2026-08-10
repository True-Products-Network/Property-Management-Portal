# Deployment Guide - LeadProspectrr Training Hub

## Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **GitHub Repository**: `True Products Network/LeadProspectrr-Training-Hub`
3. **Supabase Project**: https://vtrnshizbwkxlglthawq.supabase.co

## Environment Variables

Set these in your Vercel project settings:

```
NEXT_PUBLIC_SUPABASE_URL=https://vtrnshizbwkxlglthawq.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

## Database Setup

1. Go to Supabase SQL Editor: https://vtrnshizbwkxlglthawq.supabase.co/project/sql
2. Run the migration file: `supabase/migrations/001_initial_schema.sql`
3. Run the seed file: `supabase/seed.sql`

## OAuth Configuration

In Supabase Authentication > Providers:

### Google OAuth
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create OAuth 2.0 credentials
3. Add authorized redirect URI: `https://vtrnshizbwkxlglthawq.supabase.co/auth/v1/callback`
4. Copy Client ID and Secret to Supabase

### GitHub OAuth
1. Go to GitHub Settings > Developer settings > OAuth Apps
2. Create new OAuth App
3. Authorization callback URL: `https://vtrnshizbwkxlglthawq.supabase.co/auth/v1/callback`
4. Copy Client ID and Secret to Supabase

## Vercel Deployment

### Option 1: Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel --prod
```

### Option 2: GitHub Integration

1. Push code to GitHub
2. Import project in Vercel dashboard
3. Configure environment variables
4. Deploy

### Option 3: GitHub Actions (Automated)

The repository includes a GitHub Actions workflow (`.github/workflows/deploy.yml`) that automatically deploys on push to main.

Required secrets in GitHub:
- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Post-Deployment

1. **Create Admin User**: Run this SQL in Supabase:
```sql
UPDATE public.users SET role = 'admin' WHERE email = 'your-admin-email@example.com';
```

2. **Upload Resources**: Use Supabase Storage to upload files to the `training-resources` bucket

3. **Verify OAuth**: Test Google and GitHub login

## Architecture Notes

### Dynamic Week System
The app supports unlimited training weeks:
- Database uses `training_modules` table with `week_number`, `year`, and `cycle_number`
- Dynamic route: `/dashboard/training/[week]` handles any week number
- Easy to add Week 7, 8, etc. by inserting new records

### File Structure
```
app/dashboard/training/
├── [week]/page.tsx      # Dynamic week page
├── page.tsx             # Training listing
└── ...
```

### Adding New Weeks
To add a new week (e.g., Week 7):

```sql
INSERT INTO public.training_modules (week_number, year, cycle_number, title, description, color) 
VALUES (7, 2026, 1, 'Advanced Automation', 'Learn to automate your workflows', 'indigo');
```

The app will automatically show Week 7 in the dashboard.

## Troubleshooting

### Build Errors
- Check Node.js version (requires 18+)
- Verify all dependencies installed: `npm ci`

### Auth Issues
- Verify Supabase URL and anon key
- Check OAuth redirect URLs match exactly

### Database Issues
- Verify RLS policies are enabled
- Check migrations ran successfully

## Support

For issues, contact the development team or check Supabase/Vercel documentation.
