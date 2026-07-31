# Deployment Configuration

## Production Domain
**Primary URL:** https://portal.trueproductsnetwork.com/

## Environment Variables

Create `.env.local` for production with these values:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# GHL Configuration
GHL_ENCRYPTION_KEY=your-256-bit-encryption-key
GHL_CLIENT_ID=your-ghl-client-id
GHL_CLIENT_SECRET=your-ghl-client-secret
GHL_REDIRECT_URI=https://portal.trueproductsnetwork.com/auth/callback
GHL_WEBHOOK_SECRET=your-webhook-secret

# App Configuration
NEXT_PUBLIC_APP_URL=https://portal.trueproductsnetwork.com
```

## DNS Configuration

Point `portal.trueproductsnetwork.com` to your hosting provider:

### Option 1: Vercel (Recommended)
1. Add domain in Vercel dashboard
2. Configure DNS:
   - Type: CNAME
   - Name: portal
   - Value: cname.vercel-dns.com

### Option 2: Netlify
1. Add domain in Netlify dashboard
2. Configure DNS:
   - Type: CNAME
   - Name: portal
   - Value: your-site.netlify.app

### Option 3: Custom Server
Point A record to server IP address.

## SSL/TLS

Ensure HTTPS is enabled:
- Vercel: Automatic SSL
- Netlify: Automatic SSL
- Custom: Use Let's Encrypt

## Pre-deployment Checklist

- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] GHL app configured with production redirect URI
- [ ] Stripe/PayPal webhooks configured for production domain
- [ ] AWS S3 CORS configured for portal domain
- [ ] Email DNS records configured (SPF, DKIM, DMARC)
- [ ] Robots.txt configured
- [ ] Sitemap generated

## Post-deployment Verification

1. Test authentication flow
2. Test GHL connection
3. Test file uploads
4. Test payment processing (in test mode)
5. Verify SSL certificate
6. Check all API endpoints respond

## Rollback Plan

Keep previous deployment ready for instant rollback if needed.
