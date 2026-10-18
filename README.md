# SIP Smart (Next.js + TypeScript)
Calculators: SIP future value (step-up, sensitivity), lumpsum, annuity FV/PV, goal SIP, inflation-adjusted.
Maths lives in `lib/finance.ts` (pure, UI-free); UI in `components/`.

    npm install
    npm run dev        # http://localhost:3000
    npm test           # Node >= 22.6 built-in runner, no extra deps
    npm run typecheck && npm run build

Deploy: push to GitHub, import into Vercel. Optional env: `NEXT_PUBLIC_APP_NAME`.

Not built yet: accounts, saved scenarios, Razorpay billing + webhooks, server-side premium gating,
PDF/CSV export, retirement/withdrawal planners, tax estimator, privacy/terms, OG image/favicon, Playwright tests.
