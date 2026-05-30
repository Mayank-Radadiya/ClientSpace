import { db } from "./index";

// Seed script for local development.
// Run with: bun run db:seed
// Generates test data: org, users, clients, projects, assets, invoices,
// and 50+ activity_log entries for Activity Timeline testing.

async function seed() {
  console.log("🌱 Seeding database...");
  console.log(
    "⚠️  Seed not yet implemented. Add data here after schema is stable.",
  );
  console.log("✅ Done.");
}

seed().catch(console.error);
