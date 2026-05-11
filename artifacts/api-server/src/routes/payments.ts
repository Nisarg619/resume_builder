import { Router } from "express";
import Razorpay from "razorpay";
import crypto from "crypto";
import { authMiddleware, type AuthenticatedRequest } from "../middlewares/auth.js";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db/schema";
import { eq } from "@workspace/db";
import { success, badRequest, serverError, requireFields, serializeUser } from "../lib/responses.js";

let _razorpay: Razorpay | null = null;
function getRazorpay(): Razorpay {
  if (!_razorpay) {
    const keyId = process.env["RAZORPAY_KEY_ID"];
    const keySecret = process.env["RAZORPAY_KEY_SECRET"];
    if (!keyId || !keySecret) throw new Error("Razorpay credentials not configured");
    _razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });
  }
  return _razorpay;
}

const PLAN_AMOUNTS = {
  monthly: 9900,
  yearly: 69900,
} as const;

const router = Router();

router.post("/payments/create-order", authMiddleware, async (req: AuthenticatedRequest, res) => {
  const check = requireFields<{ plan: "monthly" | "yearly" }>(req.body, ["plan"]);
  if (!check.valid) {
    badRequest(res, `Missing required fields: ${check.missing.join(", ")}`);
    return;
  }
  const { plan } = check.data;

  if (!PLAN_AMOUNTS[plan]) {
    badRequest(res, "Invalid plan. Must be 'monthly' or 'yearly'.");
    return;
  }

  try {
    const order = await getRazorpay().orders.create({
      amount: PLAN_AMOUNTS[plan],
      currency: "INR",
      receipt: `receipt_${req.user.id}_${Date.now()}`,
      notes: {
        userId: req.user.id,
        plan: plan,
      },
    });

    success(res, {
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env["RAZORPAY_KEY_ID"]!,
    });
  } catch (err) {
    req.log.error({ err }, "Create payment order error");
    serverError(res, "Failed to create payment order");
  }
});

router.post("/payments/verify", authMiddleware, async (req: AuthenticatedRequest, res) => {
  const check = requireFields<{
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
    plan: "monthly" | "yearly";
  }>(req.body, ["razorpayOrderId", "razorpayPaymentId", "razorpaySignature", "plan"]);
  
  if (!check.valid) {
    badRequest(res, `Missing required fields: ${check.missing.join(", ")}`);
    return;
  }

  const { razorpayOrderId, razorpayPaymentId, razorpaySignature, plan } = check.data;

  const body = `${razorpayOrderId}|${razorpayPaymentId}`;
  const expectedSignature = crypto
    .createHmac("sha256", process.env["RAZORPAY_KEY_SECRET"]!)
    .update(body)
    .digest("hex");

  if (expectedSignature !== razorpaySignature) {
    badRequest(res, "Invalid payment signature");
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
      .where(eq(usersTable.id, req.user.id))
      .returning();

    success(res, serializeUser(updated!));
  } catch (err) {
    req.log.error({ err }, "Verify payment error");
    serverError(res, "Failed to update subscription");
  }
});

router.post("/payments/webhook", async (req, res) => {
  const signature = req.headers["x-razorpay-signature"] as string;
  const secret = process.env["RAZORPAY_WEBHOOK_SECRET"];

  if (!secret) {
    req.log.error("RAZORPAY_WEBHOOK_SECRET is not configured");
    res.status(500).send("Webhook secret missing");
    return;
  }

  // Verify signature
  const rawBody = (req as any).rawBody || JSON.stringify(req.body);
  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");

  if (expectedSignature !== signature) {
    req.log.warn("Invalid webhook signature");
    res.status(400).send("Invalid signature");
    return;
  }

  const event = req.body.event;
  const payload = req.body.payload;

  req.log.info({ event }, "Razorpay Webhook received");

  try {
    if (event === "order.paid" || event === "payment.captured") {
      const orderId = payload.order?.entity?.id || payload.payment?.entity?.order_id;
      const notes = payload.order?.entity?.notes || payload.payment?.entity?.notes;
      
      // We usually store the plan in notes or we can fetch the order details
      const userId = notes?.userId;
      const plan = notes?.plan as "monthly" | "yearly";

      if (userId && plan) {
        const expiresAt = new Date();
        if (plan === "monthly") {
          expiresAt.setMonth(expiresAt.getMonth() + 1);
        } else {
          expiresAt.setFullYear(expiresAt.getFullYear() + 1);
        }

        await db
          .update(usersTable)
          .set({ plan: "pro", subscriptionExpiresAt: expiresAt, updatedAt: new Date() })
          .where(eq(usersTable.id, userId));
          
        req.log.info({ userId, plan }, "Subscription updated via webhook");
      }
    }

    res.json({ status: "ok" });
  } catch (err) {
    req.log.error({ err }, "Webhook processing error");
    res.status(500).send("Error processing webhook");
  }
});

router.get("/payments/status", authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const [user] = await db
      .select({ 
        plan: usersTable.plan, 
        subscriptionExpiresAt: usersTable.subscriptionExpiresAt 
      })
      .from(usersTable)
      .where(eq(usersTable.id, req.user.id));

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    success(res, {
      plan: user.plan,
      expiresAt: user.subscriptionExpiresAt,
      isPro: user.plan === "pro",
    });
  } catch (err) {
    req.log.error({ err }, "Get payment status error");
    serverError(res);
  }
});

export default router;
