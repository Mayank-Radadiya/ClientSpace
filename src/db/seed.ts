// src/db/seed.ts
// PRD §12 DX: 50+ varied events for Activity Timeline testing
// Full implementation in a later task; scaffold now.

import { db } from "./index";

async function seed() {
  console.log("🌱 Seeding database...");
  // TODO: Create test org, users, clients, projects, files, invoices, events
  console.log("✅ Seed complete.");
}

seed().catch(console.error);
