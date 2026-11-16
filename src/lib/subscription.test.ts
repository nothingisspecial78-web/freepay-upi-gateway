import { beforeEach, describe, expect, it } from "vitest";
import { clearSubscription, getSubscription, saveSubscription } from "./subscription";

describe("subscription manager", () => {
  beforeEach(() => {
    clearSubscription();
  });

  it("returns null when no subscription exists", () => {
    expect(getSubscription()).toBeNull();
  });

  it("saves and retrieves an active website subscription", () => {
    const saved = saveSubscription({
      planName: "Pro Plan",
      amount: 499,
      transactionRef: "FP_test_12345",
      upiId: "abdullaarimbra786@oksbi",
    });

    expect(saved.status).toBe("active");
    expect(saved.planName).toBe("Pro Plan");
    expect(saved.amount).toBe(499);
    expect(saved.upiId).toBe("abdullaarimbra786@oksbi");

    const retrieved = getSubscription();
    expect(retrieved).not.toBeNull();
    expect(retrieved?.planName).toBe("Pro Plan");
    expect(retrieved?.status).toBe("active");
  });

  it("detects expired subscriptions correctly", () => {
    saveSubscription({
      planName: "Starter Plan",
      amount: 199,
      transactionRef: "FP_test_expired",
      upiId: "abdullaarimbra786@oksbi",
      expiresAt: new Date(Date.now() - 1000).toISOString(),
    });

    const retrieved = getSubscription();
    expect(retrieved?.status).toBe("expired");
  });
});
