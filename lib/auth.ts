import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { createHash } from 'crypto'
import { prisma } from '@/lib/prisma'

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) return null

        const passwordHash = createHash('sha256')
          .update(credentials.password as string)
          .digest('hex')

        const user = await prisma.user.findFirst({
          where: {
            username: credentials.username as string,
            password_hash: passwordHash,
          },
        })

        if (!user) return null

        // Update last login
        await prisma.user.update({
          where: { id: user.id },
          data: { last_login: new Date().toISOString() },
        })

        return { id: String(user.id), name: user.username, email: user.username, role: user.role }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id   = user.id
        token.role = (user as any).role
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id   = token.id
        ;(session.user as any).role = token.role
      }
      return session
    },
  },
  pages: { signIn: '/login' },
  session: { strategy: 'jwt' },
})
