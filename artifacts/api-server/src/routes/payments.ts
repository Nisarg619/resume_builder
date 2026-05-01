import { Router } from "express";
import Razorpay from "razorpay";
import crypto from "crypto";
import { authMiddleware, type AuthenticatedRequest } from "../middlewares/auth.js";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";

const razorpay = new Razorpay({
  key_id: process.env["RAZORPAY_KEY_ID"]!,
  key_secret: process.env["RAZORPAY_KEY_SECRET"]!,
});

const PLAN_AMOUNTS = {
  monthly: 9900,
  yearly: 69900,
} as const;

const router = Router();

router.post("/payments/create-order", authMiddleware, async (req: AuthenticatedRequest, res) => {
  const { plan } = req.body as { plan: "monthly" | "yearly" };

  if (!plan || !PLAN_AMOUNTS[plan]) {
    res.status(400).json({ error: "Invalid plan" });
    return;
  }

  try {
    const order = await razorpay.orders.create({
      amount: PLAN_AMOUNTS[plan],
      currency: "INR",
      receipt: `receipt_${req.userId}_${Date.now()}`,
    });

    res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env["RAZORPAY_KEY_ID"]!,
    });
  } catch (err) {
    req.log.error({ err }, "Create payment order error");
    res.status(500).json({ error: "Failed to create payment order" });
  }
});

router.post("/payments/verify", authMiddleware, async (req: AuthenticatedRequest, res) => {
  const { razorpayOrderId, razorpayPaymentId, razorpaySignature, plan } = req.body as {
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
    plan: "monthly" | "yearly";
  };

  const body = `${razorpayOrderId}|${razorpayPaymentId}`;
  const expectedSignature = crypto
    .createHmac("sha256", process.env["RAZORPAY_KEY_SECRET"]!)
    .update(body)
    .digest("hex");

  if (expectedSignature !== razorpaySignature) {
    res.status(400).json({ error: "Invalid payment signature" });
    return;
  }

  try {
    const expiresAt = new Date();
    if (plan === "monthly") {
      expiresAt.setMonth(expiresAt.getMonth() + 1);
    } else {
      expiresAt.setFullYear(expiresAt.getFullYear() + 1);
    }

    const [updated] = await db
      .update(usersTable)
      .set({ plan: "pro", subscriptionExpiresAt: expiresAt, updatedAt: new Date() })
      .where(eq(usersTable.id, req.userId!))
      .returning();

    res.json({
      id: updated!.id,
      email: updated!.email,
      name: updated!.name,
      avatarUrl: updated!.avatarUrl,
      plan: updated!.plan,
      usageResumeCount: updated!.usageResumeCount,
      usageCoverLetterCount: updated!.usageCoverLetterCount,
      subscriptionExpiresAt: updated!.subscriptionExpiresAt?.toISOString() ?? null,
      createdAt: updated!.createdAt.toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "Verify payment error");
    res.status(500).json({ error: "Failed to update subscription" });
  }
});

export default router;
