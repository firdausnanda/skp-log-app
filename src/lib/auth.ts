import { betterAuth } from "better-auth";
import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { username } from "better-auth/plugins";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "mysql",
    schema: {
      user: schema.users,
      // We will define these in schema.ts next:
      session: schema.session,
      account: schema.account,
      verification: schema.verification,
    },
  }),
  user: {
    fields: {
      name: "nama",
    },
    additionalFields: {
      nip: { type: "string" },
      jabatan: { type: "string" },
      seksi: { type: "string" },
      pangkatGolongan: { type: "string" },
      unitKerja: { type: "string" },
      tandaTangan: { type: "string" },
    },
  },
  emailAndPassword: {
    enabled: true,
  },
  plugins: [
    username()
  ]
});
export type Auth = typeof auth;
