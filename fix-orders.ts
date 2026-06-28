import { db } from './db/index';
import { orders } from './db/schema';
import { isNull } from 'drizzle-orm';
async function run() {
  const result = await db.update(orders).set({ guestPhone: '01776569369' }).where(isNull(orders.guestPhone));
  console.log('Fixed old orders!');
  process.exit(0);
}
run();
