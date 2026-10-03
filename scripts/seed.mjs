import {readFileSync} from 'node:fs';
import {getDb,REPO_ROOT} from './lib/db.mjs';
const db=await getDb();try {await db.exec('BEGIN');await db.exec(readFileSync(`${REPO_ROOT}/supabase/seed.sql`,'utf8'));await db.exec('COMMIT');console.log('seed: PASS (repeatable fictional studio)');} catch(e){await db.exec('ROLLBACK');throw e;} finally {await db.close();}
