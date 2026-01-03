import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import { compare } from 'bcryptjs';
import prisma from '@/lib/prisma';
import { sendWelcomeBackEmail, sendWelcomeEmail } from '@/lib/notifications';

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
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

        // Check if user signed up with Google
        if (!user.password) {
          throw new Error('Please sign in with Google');
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
          image: user.image,
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
    async signIn({ user, account }) {
      if (account?.provider === 'google') {
        try {
          // Check if user exists
          const existingUser = await prisma.user.findUnique({
            where: { email: user.email! },
          });

          if (!existingUser) {
            // Create new user for Google sign-in
            await prisma.user.create({
              data: {
                email: user.email!,
                name: user.name,
                image: user.image,
                provider: 'google',
              },
            });
            
            // Send welcome email for new Google users
            sendWelcomeEmail({ 
              name: user.name || user.email!, 
              email: user.email! 
            }).catch(console.error);
          } else if (!existingUser.provider) {
            // Update existing user to include Google info
            await prisma.user.update({
              where: { email: user.email! },
              data: {
                name: existingUser.name || user.name,
                image: user.image,
                provider: existingUser.password ? 'credentials' : 'google',
              },
            });
          }
        } catch (error) {
          console.error('Error during Google sign-in:', error);
          return false;
        }
      }
      return true;
    },
    async jwt({ token, user, account, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.phone = user.phone;
        token.image = user.image;
        token.hasActiveSubscription = user.hasActiveSubscription;
        token.subscriptionEnd = user.subscriptionEnd;
      }

      // For Google sign-in, fetch user data from database
      if (account?.provider === 'google') {
        const dbUser = await prisma.user.findUnique({
          where: { email: token.email! },
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

        if (dbUser) {
          token.id = dbUser.id;
          token.role = dbUser.role;
          token.phone = dbUser.phone;
          token.image = dbUser.image;
          token.hasActiveSubscription = dbUser.subscriptions.length > 0;
          token.subscriptionEnd = dbUser.subscriptions[0]?.endDate || null;
        }
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
        session.user.image = token.image as string | null;
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
