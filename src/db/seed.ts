import { db } from "./index";

// Seed script for local development.
// Run with: bun run db:seed
// PRD requires 50+ varied events for Activity Timeline testing.
// TODO: After schema is fully migrated, implement:
//   1. Create test org + owner user
//   2. Create 3 clients
//   3. Create 5 projects with various statuses
//   4. Upload mock assets with versions
//   5. Create invoices in draft/sent/paid states
//   6. Generate 50+ activity_log entries with varied event types

async function seed() {
  console.log("🌱 Seeding database...");
  console.log(
    "⚠️  Seed not yet implemented. Add data here after schema is stable.",
  );
  console.log("✅ Done.");
}

seed().catch(console.error);
