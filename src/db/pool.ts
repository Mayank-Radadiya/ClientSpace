import postgres from "postgres";

const connectionString = process.env.DATABASE_URL!;

const globalForDb = globalThis as unknown as {
  postgresClient: postgres.Sql | undefined;
};

export const pool =
  globalForDb.postgresClient ??
  postgres(connectionString, {
    prepare: false,
    max: 8,
    idle_timeout: 20, // Free up unused connections after 20 idle seconds
    connect_timeout: 10,
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.postgresClient = pool;
}
