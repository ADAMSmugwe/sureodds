import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/Providers';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { GoogleAnalytics } from '@/components/GoogleAnalytics';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'SureOdds - Premium Sports Predictions',
  description: 'Get verified sports predictions with proven track record. Join VIP for daily winning tips.',
  keywords: ['sports predictions', 'betting tips', 'football predictions', 'VIP tips', 'Kenya betting'],
  authors: [{ name: 'SureOdds' }],
  openGraph: {
    title: 'SureOdds - Premium Sports Predictions',
    description: 'Get verified sports predictions with proven track record. Join VIP for daily winning tips.',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SureOdds - Premium Sports Predictions',
    description: 'Get verified sports predictions with proven track record.',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <GoogleAnalytics />
        <Providers>
          <Navbar />
          <main className="min-h-screen pt-16">
            {children}
          </main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
