import { supabase } from "../supabaseClient.js";

export async function handler(event) {
  if (event.httpMethod !== "GET") return { statusCode: 405, body: "Method Not Allowed" };

  const userId = event.headers["x-user-id"];
  if (!userId) return { statusCode: 401, body: "Unauthorized" };

  try {
    const { data: user, error } = await supabase.from("Users").select("*").eq("id", userId).single();
    if (error) return { statusCode: 404, body: JSON.stringify({ message: "User not found" }) };

    return { statusCode: 200, body: JSON.stringify({ id: user.id, email: user.email }) };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: JSON.stringify({ message: "Internal server error" }) };
  }
}
