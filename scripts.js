import crypto from "node:crypto";

// Realistic dummy credentials (do not use in real production)
// Realistic credentials loaded from environment variables with mock fallbacks
const API_KEY = process.env.API_KEY || "demo_ak_7e8b21fa9c04421b8c19a4e69b56f892";
const SECRET_KEY = process.env.SECRET_KEY || "demo_sk_d83e1c9402a7b8e55fc4891a27e368140dbb95f12e84";
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
