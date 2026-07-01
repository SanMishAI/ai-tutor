import { jwtVerify } from "jose"

const secret = new TextEncoder().encode(process.env.CHILD_JWT_SECRET ?? "fallback-secret")

export type ChildPayload = {
  childId: string
  parentId: string
  name: string
  avatarEmoji: string
}

export async function getChildSession(req: Request): Promise<ChildPayload | null> {
  const token = req.headers.get("x-child-token")
  if (!token) return null
  try {
    const { payload } = await jwtVerify(token, secret)
    return payload as unknown as ChildPayload
  } catch {
    return null
  }
}
