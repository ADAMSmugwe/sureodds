import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { compare } from 'bcryptjs';
import prisma from '@/lib/prisma';
import { sendWelcomeBackEmail } from '@/lib/notifications';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Please enter your email and password');
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
          include: {
            subscriptions: {
              where: {
                isActive: true,
                endDate: { gte: new Date() },
              },
              orderBy: { endDate: 'desc' },
              take: 1,
            },
          },
        });

        if (!user) {
          throw new Error('No account found with this email');
        }

        const isPasswordValid = await compare(credentials.password, user.password);

        if (!isPasswordValid) {
          throw new Error('Incorrect password');
        }

        // Check if user has active subscription
        const hasActiveSubscription = user.subscriptions.length > 0;
        const subscriptionEnd = user.subscriptions[0]?.endDate || null;

        // Send welcome back email (don't await - run in background)
        // Skip for admin users to avoid spam
        if (user.role !== 'ADMIN') {
          sendWelcomeBackEmail({
            name: user.name || user.email,
            email: user.email,
            hasActiveSubscription,
            subscriptionEnd,
          }).catch(console.error);
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          phone: user.phone,
          hasActiveSubscription,
          subscriptionEnd: subscriptionEnd,
        };
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.phone = user.phone;
        token.hasActiveSubscription = user.hasActiveSubscription;
        token.subscriptionEnd = user.subscriptionEnd;
      }

      // Handle subscription updates
      if (trigger === 'update' && session) {
        token.hasActiveSubscription = session.hasActiveSubscription;
        token.subscriptionEnd = session.subscriptionEnd;
      }

      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.phone = token.phone as string | null;
        session.user.hasActiveSubscription = token.hasActiveSubscription as boolean;
        session.user.subscriptionEnd = token.subscriptionEnd as Date | null;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  secret: process.env.NEXTAUTH_SECRET,
};
