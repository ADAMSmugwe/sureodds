# SureOdds - Premium Sports Predictions Platform

A modern sports predictions platform built with Next.js, featuring M-Pesa payment integration for the Kenyan market.

## 🚀 Features

- **User Authentication** - Secure login/register with NextAuth.js
- **VIP Subscriptions** - Daily, Weekly, and Monthly plans
- **M-Pesa Payments** - Seamless STK Push integration
- **Admin Dashboard** - Manage predictions and users
- **Responsive Design** - Works on all devices

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, React, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL (Neon/Supabase)
- **ORM**: Prisma
- **Auth**: NextAuth.js
- **Payments**: M-Pesa Daraja API

## 📦 Installation

1. Clone the repository:
```bash
git clone https://github.com/ADAMSmugwe/sureodds.git
cd sureodds
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your values
```

4. Set up the database:
```bash
npx prisma generate
npx prisma db push
npx prisma db seed
```

5. Run the development server:
```bash
npm run dev
```

## 🔧 Environment Variables

See `.env.example` for all required variables.

### Required for Development:
- `DATABASE_URL` - PostgreSQL connection string
- `NEXTAUTH_SECRET` - Secret for NextAuth.js
- `MPESA_*` - M-Pesa sandbox credentials

### Required for Production:
- All development variables
- `MPESA_ENVIRONMENT="production"`
- Production M-Pesa credentials
- HTTPS callback URL

## 💳 M-Pesa Setup

### Sandbox (Testing)
1. Create account at [developer.safaricom.co.ke](https://developer.safaricom.co.ke)
2. Create a new app and get sandbox credentials
3. Use ngrok for local callback testing:
   ```bash
   ngrok http 3000
   ```
4. Update `MPESA_CALLBACK_URL` with ngrok URL

### Production
1. Apply for M-Pesa Go Live
2. Get production credentials
3. Set `MPESA_ENVIRONMENT="production"`
4. Use your domain for callback URL

## 🚀 Deployment

### Vercel (Recommended)
1. Push to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy!

### Environment Variables in Vercel:
- Add all variables from `.env.production.example`
- Use Vercel's environment variable encryption

## 📱 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/*` | - | NextAuth.js routes |
| `/api/predictions` | GET/POST | Get/Create predictions |
| `/api/mpesa/stkpush` | POST | Initiate M-Pesa payment |
| `/api/mpesa/callback` | POST | M-Pesa callback (Safaricom) |
| `/api/mpesa/status` | GET | Check payment status |
| `/api/subscription` | GET | Get user subscription |
| `/api/health` | GET | Health check |

## ⚠️ Legal Disclaimer

This platform provides sports predictions for informational purposes only. Users must be 18+ and are responsible for their own betting decisions. Gamble responsibly.

## 📄 License

MIT License - see LICENSE file for details.

## 👤 Author

Adams Mugwe - [GitHub](https://github.com/ADAMSmugwe)
