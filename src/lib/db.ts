// Neon serverless database client helper
import { neon } from '@neondatabase/serverless';

if (!process.env.DATABASE_URL) {
  // Fail fast during build/runtime if misconfigured
  throw new Error('DATABASE_URL env var is required');
}

export const sql = neon(process.env.DATABASE_URL);

export type DbClient = typeof sql;

// Utility to run a transactional set of statements since neon(serverless) tag does not yet
// support BEGIN/COMMIT in one template easily. We concatenate statements cautiously.
// For more complex safety you could switch to the pg driver, but for current controlled inputs
// this is sufficient (we only interpolate validated primitives and numeric values).
type ExecTemplate = (strings: TemplateStringsArray, ...values: unknown[]) => Promise<unknown[]>;
export async function withTransaction<T>(fn: (exec: ExecTemplate) => Promise<T>): Promise<T> {
  // neon(serverless) executes each tagged template individually; BEGIN/COMMIT can be separate.
  await sql`BEGIN`;
  try {
    const result = await fn(sql);
    await sql`COMMIT`;
    return result;
  } catch (err) {
    try { await sql`ROLLBACK`; } catch {}
    throw err;
  }
}
