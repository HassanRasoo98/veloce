import bcrypt from "bcrypt";

const BCRYPT_ROUNDS = 12;

export function hashPassword(password: string): string {
  const pw = Buffer.from(password.slice(0, 72), "utf8");
  return bcrypt.hashSync(pw, BCRYPT_ROUNDS);
}

export function verifyPassword(plain: string, hashed: string): boolean {
  try {
    const pw = Buffer.from(plain.slice(0, 72), "utf8");
    return bcrypt.compareSync(pw, hashed);
  } catch {
    return false;
  }
}
