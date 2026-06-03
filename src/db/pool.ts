import postgres from "postgres";

let connectionString = process.env.DATABASE_URL!;

// Use transaction pooler (port 6543) instead of session pooler (port 5432) to prevent EMAXCONNSESSION errors
if (connectionString && connectionString.includes(":5432/")) {
  connectionString = connectionString.replace(":5432/", ":6543/");
}

const globalForDb = globalThis as unknown as {
  postgresClient: postgres.Sql | undefined;
};

export const pool =
  globalForDb.postgresClient ??
  postgres(connectionString, {
    prepare: false,
    max: process.env.NODE_ENV === "production" ? 8 : 3,
    idle_timeout: 20, // Free up unused connections after 20 idle seconds
    connect_timeout: 10,
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.postgresClient = pool;
}
