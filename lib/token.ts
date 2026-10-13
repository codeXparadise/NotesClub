import crypto from "crypto";

const SIGNED_TOKEN_SECRET = process.env.SIGNED_TOKEN_SECRET || "notes-club-default-fallback-hmac-secret-min-32-chars";

export interface StreamTokenPayload {
  docId: string;
  sub: string; // studentId
  exp: number; // Unix timestamp in seconds
}

/**
 * Creates an HMAC-signed streaming token bound to a student and document (valid for 1 hour).
 */
export function generateStreamToken(documentId: string, studentId: string, expiresInSec = 3600): string {
  const exp = Math.floor(Date.now() / 1000) + expiresInSec;
  const payload: StreamTokenPayload = {
    docId: documentId,
    sub: studentId,
    exp,
  };

  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = crypto
    .createHmac("sha256", SIGNED_TOKEN_SECRET)
    .update(payloadB64)
    .digest("base64url");

  return `${payloadB64}.${signature}`;
}

/**
 * Verifies the HMAC-signed stream token and confirms documentId, studentId, and expiration.
 */
export function verifyStreamToken(token: string, expectedDocId: string, expectedStudentId?: string): boolean {
  if (!token) return false;
  const parts = token.split(".");
  if (parts.length !== 2) return false;

  const [payloadB64, signature] = parts;
  const expectedSig = crypto
    .createHmac("sha256", SIGNED_TOKEN_SECRET)
    .update(payloadB64)
    .digest("base64url");

  // Constant-time compare
  if (
    signature.length !== expectedSig.length ||
    !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig))
  ) {
    return false;
  }

  try {
    const payload: StreamTokenPayload = JSON.parse(
      Buffer.from(payloadB64, "base64url").toString("utf-8")
    );

    const now = Math.floor(Date.now() / 1000);
    if (payload.exp < now) {
      return false; // Expired
    }

    if (payload.docId !== expectedDocId) {
      return false; // Mismatched doc
    }

    if (expectedStudentId && payload.sub !== expectedStudentId) {
      return false; // Mismatched student
    }

    return true;
  } catch {
    return false;
  }
}
