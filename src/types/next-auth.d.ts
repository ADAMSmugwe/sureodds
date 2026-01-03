import 'next-auth';
import { Role } from '@prisma/client';

declare module 'next-auth' {
  interface User {
    id: string;
    role: Role;
    phone: string | null;
    image?: string | null;
    hasActiveSubscription: boolean;
    subscriptionEnd: Date | null;
  }

  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      image?: string | null;
      role: string;
      phone: string | null;
      hasActiveSubscription: boolean;
      subscriptionEnd: Date | null;
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: string;
    phone: string | null;
    image?: string | null;
    hasActiveSubscription: boolean;
    subscriptionEnd: Date | null;
  }
}
