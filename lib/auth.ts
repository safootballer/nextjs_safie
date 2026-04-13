import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { createHash } from 'crypto'

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
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

        const { prisma } = await import('@/lib/prisma')

        const user = await prisma.user.findFirst({
          where: {
            username: credentials.username as string,
            password_hash: passwordHash,
          },
        })

        if (!user) return null

        await prisma.user.update({
          where: { id: user.id },
          data: { last_login: new Date().toISOString() },
        })

        return {
          id: String(user.id),
          name: user.username,
          email: user.username,
          role: user.role,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }: any) {
      if (user) {
        token.id = user.id
        token.role = user.role
      }
      return token
    },
    async session({ session, token }: any) {
      if (session.user) {
        session.user.id = token.id
        session.user.role = token.role
      }
      return session
    },
  },
  pages: { signIn: '/login' },
  session: { strategy: 'jwt' as const },
  secret: process.env.NEXTAUTH_SECRET,
})