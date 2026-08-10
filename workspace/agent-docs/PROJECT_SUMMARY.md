# LeadProspectrr Training Hub - Project Summary

## Overview
A secure document vault and training platform for LeadProspectrr clients. Built with Next.js 16, Supabase, and Tailwind CSS. Supports a weekly recurring training clinic that builds up content over time.

## Key Features

### Authentication & Security
- OAuth login with Google and GitHub via Supabase Auth
- Secure middleware-based route protection
- Row Level Security (RLS) policies on all tables
- Protected file storage with authenticated access

### Training System
- **Dynamic Week Structure**: Supports unlimited weeks (Week 1, 2, 3... 7, 8, etc.)
- **Recurring Clinic**: Database schema supports yearly cycles
- **Progress Tracking**: Users can mark modules as Not Started, In Progress, or Completed
- **Visual Dashboard**: Large card-based layout with color-coded modules

### Content Management
- **Resource Library**: Searchable, filterable by file type and week
- **Multiple File Types**: PDF, DOC, Video, Image, Template, Cheatsheet, Guide, Worksheet, Checklist
- **Download Tracking**: Tracks which resources users have downloaded
- **File Size Display**: Shows file sizes in KB/MB

### User Experience
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Intuitive Navigation**: Easy week-to-week navigation
- **Progress Overview**: Visual stats and completion percentage
- **Professional UI**: Clean, modern design with shadcn/ui components

## Tech Stack

- **Framework**: Next.js 16.2.6 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **UI Components**: shadcn/ui
- **Authentication**: Supabase Auth
- **Database**: Supabase PostgreSQL
- **Storage**: Supabase Storage
- **Icons**: Lucide React

## Project Structure

```
leadprospectrr-training/
├── src/
│   ├── app/
│   │   ├── dashboard/
│   │   │   ├── training/
│   │   │   │   ├── [week]/page.tsx      # Dynamic week pages
│   │   │   │   └── page.tsx             # Training listing
│   │   │   ├── resources/page.tsx       # Resource library
│   │   │   ├── layout.tsx               # Dashboard layout
│   │   │   └── page.tsx                 # Dashboard home
│   │   ├── auth/callback/route.ts       # OAuth callback
│   │   ├── login/page.tsx               # Login page
│   │   ├── signup/page.tsx              # Signup page
│   │   ├── page.tsx                     # Landing page
│   │   ├── layout.tsx                   # Root layout
│   │   └── globals.css                  # Global styles
│   ├── components/
│   │   ├── dashboard/                   # Dashboard components
│   │   ├── training/                    # Training components
│   │   ├── resources/                   # Resource components
│   │   └── ui/                          # shadcn/ui components
│   ├── lib/
│   │   ├── supabase/                    # Supabase clients
│   │   ├── auth.ts                      # Auth helpers
│   │   └── utils.ts                     # Utilities
│   └── middleware.ts                    # Route protection
├── supabase/
│   ├── migrations/001_initial_schema.sql
│   └── seed.sql
├── .github/workflows/deploy.yml         # CI/CD
├── vercel.json                          # Vercel config
├── DEPLOYMENT.md                        # Deployment guide
└── README.md                            # Project documentation
```

## Database Schema

### Tables

1. **users**: Extended user profiles with roles (admin/client)
2. **training_modules**: Training content with week_number, year, cycle_number
3. **resources**: Files linked to modules
4. **user_progress**: Tracks completion status per module
5. **resource_downloads**: Tracks user downloads

### Key Features
- Supports unlimited weeks via `week_number` field
- Supports recurring yearly cycles via `year` and `cycle_number`
- RLS policies for secure data access
- Automatic updated_at timestamps

## Deployment

### Supabase Setup
1. Project URL: https://vtrnshizbwkxlglthawq.supabase.co
2. Run migration: `supabase/migrations/001_initial_schema.sql`
3. Run seed: `supabase/seed.sql`
4. Configure OAuth providers (Google, GitHub)

### Vercel Setup
1. Connect GitHub repo: `True Products Network/LeadProspectrr-Training-Hub`
2. Set environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Deploy

### Environment Variables
```
NEXT_PUBLIC_SUPABASE_URL=https://vtrnshizbwkxlglthawq.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

## Adding New Content

### Adding a New Week (Week 7+)
```sql
INSERT INTO public.training_modules (week_number, year, cycle_number, title, description, color) 
VALUES (7, 2026, 1, 'Advanced Automation', 'Learn workflow automation', 'indigo');
```

The app automatically shows new weeks in the dashboard.

### Adding Resources
1. Upload files to Supabase Storage bucket `training-resources`
2. Insert records into `resources` table with module_id

## Next Steps

1. **Deploy to Vercel**: Follow DEPLOYMENT.md
2. **Configure OAuth**: Set up Google and GitHub login
3. **Upload Real Resources**: Replace placeholder files
4. **Create Admin User**: Run SQL to set role = 'admin'
5. **Test**: Verify all flows work correctly

## Support

For technical issues or questions, refer to:
- Next.js docs: https://nextjs.org/docs
- Supabase docs: https://supabase.com/docs
- shadcn/ui docs: https://ui.shadcn.com
