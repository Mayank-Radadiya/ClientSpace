"use server";

import { db } from "@/db";
import { users } from "@/db/schema";

export async function createTestUser() {
  try {
    // Generate a random UUID for the required ID field
    const randomId = crypto.randomUUID();
    const randomEmail = `test-${Date.now()}@example.com`;

    await db.insert(users).values({
      id: randomId,
      email: randomEmail,
      name: "Test User",
    });

    return { success: true, email: randomEmail };
  } catch (error) {
    console.error("Database connection error:", error);
    return { success: false, error: String(error) };
  }
}
