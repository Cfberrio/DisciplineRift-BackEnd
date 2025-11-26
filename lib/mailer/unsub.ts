import jwt from "jsonwebtoken"

const TOKEN_EXPIRATION = "30d"

function getUnsubSecret() {
  const secret = process.env.UNSUBSCRIBE_JWT_SECRET
  if (!secret || secret.length < 32) {
    throw new Error("UNSUBSCRIBE_JWT_SECRET must be defined and at least 32 characters")
  }
  return secret
}

export function signUnsubToken(email: string) {
  if (!email) {
    throw new Error("Email is required to generate unsubscribe token")
  }

  const secret = getUnsubSecret()
  return jwt.sign({ email }, secret, {
    algorithm: "HS256",
    expiresIn: TOKEN_EXPIRATION,
  })
}

export function verifyUnsubToken(token: string | null) {
  if (!token) {
    return { email: "", valid: false }
  }

  try {
    const secret = getUnsubSecret()
    const decoded = jwt.verify(token, secret, {
      algorithms: ["HS256"],
    }) as { email?: string }

    if (!decoded.email) {
      return { email: "", valid: false }
    }

    return { email: decoded.email, valid: true }
  } catch (error) {
    console.error("[UNSUBSCRIBE] Token verification failed:", error)
    return { email: "", valid: false }
  }
}




