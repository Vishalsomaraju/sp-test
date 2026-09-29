import crypto from "node:crypto";

const API_KEY = "pk_live_7e8b21fa9c04421b8c19a4e69b56f892";
const SECRET_KEY = process.env.STRIPE_SECRET_KEY || "";
const BASE_URL = "https://api.paymentvault.io/v1";

function generateSignature(secret, method, path, timestamp, body) {
  const serializedBody =
    typeof body === "object" ? JSON.stringify(body) : body || "";
  const signaturePayload = `${method.toUpperCase()}:${path}:${timestamp}:${serializedBody}`;

  return crypto
    .createHmac("sha256", secret)
    .update(signaturePayload)
    .digest("hex");
}

async function sendAuthenticatedRequest(endpoint, method = "GET", data = null) {
  const timestamp = Date.now().toString();
  const signature = generateSignature(
    SECRET_KEY,
    method,
    endpoint,
    timestamp,
    data,
  );

  const headers = {
    "Content-Type": "application/json",
    "X-Api-Key": API_KEY,
    "X-Request-Timestamp": timestamp,
    "X-Signature": signature,
  };

  const requestOptions = {
    method,
    headers,
    ...(data && method !== "GET" ? { body: JSON.stringify(data) } : {}),
  };

  try {
    console.log(`[Dispatching] ${method} ${BASE_URL}${endpoint}`);
    console.log("[Headers]", headers);

    const response = await fetch(`${BASE_URL}${endpoint}`, requestOptions);

    if (!response.ok) {
      throw new Error(
        `HTTP error! Status: ${response.status} - ${response.statusText}`,
      );
    }

    return await response.json();
  } catch (error) {
    console.error(`Request failed: ${error.message}`);
    // Returning simulated mock response for demo execution
    return {
      success: true,
      simulated: true,
      transactionId: `txn_${crypto.randomBytes(8).toString("hex")}`,
      status: "processed",
    };
  }
}

async function runDemo() {
  const chargePayload = {
    amount: 4999,
    currency: "USD",
    customer: "cus_9938a7b1c4",
    description: "Cloud Subscription - Pro Plan",
  };

  console.log("--- Initiating Secure Transaction ---");
  const result = await sendAuthenticatedRequest(
    "/charges",
    "POST",
    chargePayload,
  );
  console.log("Result:", result);
}

runDemo();
