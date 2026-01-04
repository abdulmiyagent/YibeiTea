import { NextAuthOptions } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { db } from "./db";
import { compare, hash } from "bcryptjs";
import { Adapter } from "next-auth/adapters";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(db) as Adapter,
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
    signOut: "/",
    error: "/login",
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await db.user.findUnique({
          where: { email: credentials.email },
          include: {
            accounts: {
              where: { provider: "credentials" },
            },
          },
        });

        if (!user) {
          return null;
        }

        // Get the credentials account which stores the hashed password
        const credentialsAccount = user.accounts.find(
          (acc) => acc.provider === "credentials"
        );

        if (!credentialsAccount?.access_token) {
          return null;
        }

        // Verify password against stored hash
        const isValid = await compare(
          credentials.password,
          credentialsAccount.access_token
        );

        if (!isValid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.sub!;
        session.user.role = token.role as "USER" | "ADMIN";
        session.user.loyaltyPoints = token.loyaltyPoints as number;
        session.user.loyaltyTier = token.loyaltyTier as string;
      }
      return session;
    },
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.role = (user as any).role;
      }

      // Fetch fresh user data
      if (token.sub) {
        const dbUser = await db.user.findUnique({
          where: { id: token.sub },
          select: {
            role: true,
            loyaltyPoints: true,
            loyaltyTier: true,
          },
        });

        if (dbUser) {
          token.role = dbUser.role;
          token.loyaltyPoints = dbUser.loyaltyPoints;
          token.loyaltyTier = dbUser.loyaltyTier;
        }
      }

      return token;
    },
  },
};

// Helper function to hash passwords
export async function hashPassword(password: string): Promise<string> {
  return hash(password, 12);
}

// Helper function to verify passwords
export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return compare(password, hashedPassword);
}
