# LeadProspectrr Training Library

A secure document vault and training platform for LeadProspectrr clients. Built with Next.js 16, Supabase, and Tailwind CSS.

## Features

- **Secure Authentication**: OAuth with Google and GitHub via Supabase Auth
- **Visual Dashboard**: Large card-based layout for easy navigation
- **6-Week Training Program**: Structured learning path covering:
  - Week 1: Creating Blog Posts
  - Week 2: Contacts and Creating Smart Lists
  - Week 3: Email Templates & Campaigns
  - Week 4: Understanding Conversations Inbox
  - Week 5: Opportunities & Pipelines
  - Week 6: Creating Calendars and Appointment Bookings
- **Resource Library**: Searchable, filterable document repository
- **Progress Tracking**: Track completion status for each week
- **File Management**: Upload and download training materials
- **Responsive Design**: Works on desktop, tablet, and mobile

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Authentication**: Supabase Auth with OAuth providers
- **Database**: Supabase PostgreSQL
- **Storage**: Supabase Storage for file uploads
- **Styling**: Tailwind CSS 4
- **UI Components**: shadcn/ui
- **Icons**: Lucide React

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd leadprospectrr-training
```

2. Install dependencies:
```bash
npm install
```

3. Copy the environment variables:
```bash
cp .env.example .env.local
```

4. Update `.env.local` with your Supabase credentials:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

5. Set up the database:
   - Go to your Supabase project SQL Editor
   - Run the migration file: `supabase/migrations/001_initial_schema.sql`

6. Configure OAuth providers in Supabase:
   - Go to Authentication > Providers
   - Enable Google and/or GitHub
   - Add your OAuth credentials

7. Run the development server:
```bash
npm run dev
```

8. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
leadprospectrr-training/
├── src/
│   ├── app/
│   │   ├── dashboard/
│   │   │   ├── training/
│   │   │   │   ├── week-1/page.tsx
│   │   │   │   ├── week-2/page.tsx
│   │   │   │   ├── week-3/page.tsx
│   │   │   │   ├── week-4/page.tsx
│   │   │   │   ├── week-5/page.tsx
│   │   │   │   ├── week-6/page.tsx
│   │   │   │   └── page.tsx
│   │   │   ├── resources/page.tsx
│   │   │   ├── layout.tsx
│   │   │   └── page.tsx
│   │   ├── auth/callback/route.ts
│   │   ├── login/page.tsx
│   │   ├── signup/page.tsx
│   │   ├── page.tsx
│   │   ├── layout.tsx
│   │   └── globals.css
│   ├── components/
│   │   ├── dashboard/
│   │   │   ├── nav.tsx
│   │   │   ├── user-nav.tsx
│   │   │   ├── week-card.tsx
│   │   │   ├── progress-overview.tsx
│   │   │   ├── recent-resources.tsx
│   │   │   └── welcome-header.tsx
│   │   ├── training/
│   │   │   ├── training-header.tsx
│   │   │   └── week-detail.tsx
│   │   ├── resources/
│   │   │   └── resources-library.tsx
│   │   └── ui/
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts
│   │   │   ├── server.ts
│   │   │   └── middleware.ts
│   │   ├── auth.ts
│   │   └── utils.ts
│   └── middleware.ts
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql
├── public/
├── .env.example
├── next.config.ts
├── package.json
├── tailwind.config.ts
└── tsconfig.json
```

## Database Schema

### Tables

- **users**: Extended user profiles
- **training_weeks**: 6-week program structure
- **resources**: Training materials (PDFs, videos, templates, etc.)
- **user_progress**: Track week completion status
- **resource_downloads**: Track user downloads

### Storage

- **training-resources**: Bucket for storing training files

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

### Environment Variables for Production

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXTAUTH_URL=
NEXTAUTH_SECRET=
```

## Admin Features

To make a user an admin, update their role in the Supabase database:

```sql
UPDATE public.users SET role = 'admin' WHERE email = 'admin@example.com';
```

Admins can:
- Upload new resources
- Manage training content
- View all user progress

## License

Private - LeadProspectrr
# Deployment trigger
