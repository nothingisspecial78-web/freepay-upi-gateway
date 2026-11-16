import { useEffect, useState } from "react";
import { getSubscription, type UserSubscription } from "@/lib/subscription";

export function useSubscription() {
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setSubscription(getSubscription());
    setIsLoaded(true);

    const onUpdate = () => {
      setSubscription(getSubscription());
    };

    window.addEventListener("freepay_subscription_changed", onUpdate);
    window.addEventListener("storage", onUpdate);

    return () => {
      window.removeEventListener("freepay_subscription_changed", onUpdate);
      window.removeEventListener("storage", onUpdate);
    };
  }, []);

  return {
    subscription,
    isSubscribed: Boolean(subscription && subscription.status === "active"),
    isLoaded,
  };
}
