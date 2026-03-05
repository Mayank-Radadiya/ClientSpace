// src/db/index.ts
// DO NOT export a bare drizzle() instance from this file.
// All DB access must go through createDrizzleClient() from ./createDrizzleClient
// to ensure Row Level Security is active. See PRD §10.2.
export { createDrizzleClient } from "./createDrizzleClient";
