export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  badge?: string;
  rating?: number;
}

export const PRODUCTS: Product[] = [
  {
    id: "demo",
    name: "Demo Plan",
    description: "Try a real UPI payment end to end for just ₹1.",
    price: 1,
    badge: "Demo",
  },
  {
    id: "1",
    name: "Starter Plan",
    description: "Perfect for individuals. 100 API calls/month, email support.",
    price: 199,
    badge: "Popular",
    rating: 4.8,
  },
  {
    id: "2",
    name: "Pro Plan",
    description: "For growing teams. 10,000 API calls/month, priority support.",
    price: 499,
    rating: 4.9,
  },
  {
    id: "3",
    name: "Enterprise Plan",
    description: "Unlimited API calls, dedicated account manager, SLA guarantee.",
    price: 999,
    badge: "Best Value",
    rating: 5.0,
  },
];
