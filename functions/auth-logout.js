export async function handler(event) {
  // In serverless, sessions are stateless; logout is handled client-side by removing token/userId
  return { statusCode: 200, body: JSON.stringify({ message: "Logged out" }) };
}
