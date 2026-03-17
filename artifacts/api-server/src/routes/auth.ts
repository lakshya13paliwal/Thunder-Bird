import { Router, type IRouter, Request, Response } from "express";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import {
  RegisterUserBody,
  LoginUserBody,
  ForgotPasswordBody,
  VerifyOtpBody,
} from "@workspace/api-zod";

const router: IRouter = Router();

// In-memory OTP store: phone -> { otp, expiresAt }
const otpStore = new Map<string, { otp: string; expiresAt: number }>();

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

router.post("/register", async (req: Request, res: Response) => {
  const parsed = RegisterUserBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input: " + parsed.error.message });
    return;
  }
  const { username, email, phone, password } = parsed.data;

  try {
    const existing = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.username, username))
      .limit(1);
    if (existing.length > 0) {
      res.status(409).json({ error: "Username already taken" });
      return;
    }

    const emailExists = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, email))
      .limit(1);
    if (emailExists.length > 0) {
      res.status(409).json({ error: "Email already registered" });
      return;
    }

    const phoneExists = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.phone, phone))
      .limit(1);
    if (phoneExists.length > 0) {
      res.status(409).json({ error: "Phone already registered" });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const [user] = await db
      .insert(usersTable)
      .values({ username, email, phone, passwordHash })
      .returning();

    (req.session as any).userId = user.id;
    res.status(201).json({
      user: { id: user.id, username: user.username, email: user.email, phone: user.phone },
      message: "Account created successfully",
    });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/login", async (req: Request, res: Response) => {
  const parsed = LoginUserBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input" });
    return;
  }
  const { username, password } = parsed.data;

  try {
    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.username, username))
      .limit(1);

    if (!user) {
      res.status(401).json({ error: "Invalid username or password" });
      return;
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      res.status(401).json({ error: "Invalid username or password" });
      return;
    }

    (req.session as any).userId = user.id;
    res.json({
      user: { id: user.id, username: user.username, email: user.email, phone: user.phone },
      message: "Login successful",
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/logout", (req: Request, res: Response) => {
  req.session.destroy((err) => {
    if (err) {
      res.status(500).json({ error: "Failed to logout" });
      return;
    }
    res.clearCookie("thunderbill_session");
    res.json({ message: "Logged out successfully" });
  });
});

router.get("/me", async (req: Request, res: Response) => {
  const userId = (req.session as any)?.userId;
  if (!userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  try {
    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .limit(1);
    if (!user) {
      res.status(401).json({ error: "User not found" });
      return;
    }
    res.json({ id: user.id, username: user.username, email: user.email, phone: user.phone });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/forgot-password", async (req: Request, res: Response) => {
  const parsed = ForgotPasswordBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input" });
    return;
  }
  const { phone } = parsed.data;

  try {
    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.phone, phone))
      .limit(1);

    if (!user) {
      res.status(404).json({ error: "No account found with this phone number" });
      return;
    }

    const otp = generateOtp();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes
    otpStore.set(phone, { otp, expiresAt });

    // In development: print OTP to console
    console.log(`[ThunderBill OTP] Phone: ${phone} | OTP: ${otp} | Expires: ${new Date(expiresAt).toISOString()}`);

    res.json({ message: "OTP sent to your registered phone number" });
  } catch (err) {
    console.error("Forgot password error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/verify-otp", async (req: Request, res: Response) => {
  const parsed = VerifyOtpBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input" });
    return;
  }
  const { phone, otp, newPassword } = parsed.data;

  const stored = otpStore.get(phone);
  if (!stored) {
    res.status(400).json({ error: "No OTP requested for this phone number" });
    return;
  }

  if (Date.now() > stored.expiresAt) {
    otpStore.delete(phone);
    res.status(400).json({ error: "OTP has expired. Please request a new one." });
    return;
  }

  if (stored.otp !== otp) {
    res.status(400).json({ error: "Invalid OTP" });
    return;
  }

  try {
    const passwordHash = await bcrypt.hash(newPassword, 12);
    await db
      .update(usersTable)
      .set({ passwordHash })
      .where(eq(usersTable.phone, phone));

    otpStore.delete(phone);
    res.json({ message: "Password reset successfully. Please login." });
  } catch (err) {
    console.error("Verify OTP error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
