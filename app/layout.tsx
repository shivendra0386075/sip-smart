import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'SIP Smart – SIP, Annuity & Goal Calculators',
  description: 'Calculate SIP returns, annuities, lumpsum growth and financial goals with transparent formulas.',
  openGraph: { title: 'SIP Smart', description: 'Plan your financial future with confidence.', type: 'website' },
};
export const viewport: Viewport = { width: 'device-width', initialScale: 1, viewportFit: 'cover' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (<html lang="en"><body>{children}</body></html>);
}
