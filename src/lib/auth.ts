import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "./db";
import bcrypt from "bcryptjs";
import { Role } from "@prisma/client";

declare module "next-auth" {
  interface User {
    id?: string;
    role?: Role;
  }
  interface Session {
    user: {
      id?: string;
      role?: Role;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
  interface JWT {
    id?: string;
    role?: Role;
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const email = String(credentials.email).trim().toLowerCase();
        const password = String(credentials.password);

        const user = await prisma.user.findUnique({
          where: { email },
        });

        if (!user || !user.passwordHash) {
          return null;
        }

        const isValid = await bcrypt.compare(password, user.passwordHash);

        if (!isValid) {
          return null;
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token) {
        /* eslint-disable @typescript-eslint/no-explicit-any */
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
        /* eslint-enable @typescript-eslint/no-explicit-any */
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
});
