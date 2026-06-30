import { currentUser } from "@clerk/nextjs/server"

export async function isFounderUser(): Promise<boolean> {
  const email = process.env.FOUNDER_EMAIL
  if (!email) return false
  const user = await currentUser()
  return user?.emailAddresses?.some(e => e.emailAddress === email) ?? false
}

export function isFounderEmail(email: string | null | undefined): boolean {
  return !!email && email === process.env.FOUNDER_EMAIL
}
