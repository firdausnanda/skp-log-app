import { db, connection } from "../db/index";
import { users, rencanaKinerja, skpLog, session } from "../db/schema";

async function main() {
  console.log("Fetching database statistics...");
  
  const allUsers = await db.select().from(users);
  console.log(`\nUsers count: ${allUsers.length}`);
  for (const u of allUsers) {
    console.log(`- ID: ${u.id}, Name: ${u.nama}, Email: ${u.email}, NIP: ${u.nip}`);
  }

  const allSessions = await db.select().from(session);
  console.log(`\nSessions count: ${allSessions.length}`);
  for (const s of allSessions) {
    console.log(`- ID: ${s.id}, UserId: ${s.userId}, ExpiresAt: ${s.expiresAt}`);
  }

  const allRhks = await db.select().from(rencanaKinerja);
  console.log(`\nRHKs count: ${allRhks.length}`);
  for (const r of allRhks) {
    console.log(`- ID: ${r.id}, Deskripsi: ${r.deskripsi.substring(0, 30)}..., UserId: ${r.userId}`);
  }

  const allLogs = await db.select().from(skpLog);
  console.log(`\nSKP Logs count: ${allLogs.length}`);
  for (const l of allLogs) {
    console.log(`- ID: ${l.id}, Kegiatan: ${l.kegiatan.substring(0, 30)}..., UserId: ${l.userId}`);
  }
}

main()
  .then(async () => {
    await connection.end();
    process.exit(0);
  })
  .catch(async (e) => {
    console.error("Error checking database:", e);
    await connection.end();
    process.exit(1);
  });
