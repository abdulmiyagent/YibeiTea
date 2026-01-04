import createMollieClient, { MollieClient } from "@mollie/api-client";

let mollieClient: MollieClient | null = null;

function getMollieClient(): MollieClient {
  if (!mollieClient) {
    const apiKey = process.env.MOLLIE_API_KEY;
    if (!apiKey) {
      throw new Error("MOLLIE_API_KEY environment variable is not set");
    }
    mollieClient = createMollieClient({ apiKey });
  }
  return mollieClient;
}

export async function createPayment({
  amount,
  description,
  orderId,
  redirectUrl,
}: {
  amount: number;
  description: string;
  orderId: string;
  redirectUrl: string;
}) {
  const client = getMollieClient();
  const payment = await client.payments.create({
    amount: {
      currency: "EUR",
      value: amount.toFixed(2),
    },
    description,
    redirectUrl,
    webhookUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/mollie`,
    metadata: {
      orderId,
    },
  });

  return payment;
}

export async function getPayment(paymentId: string) {
  const client = getMollieClient();
  return client.payments.get(paymentId);
}
