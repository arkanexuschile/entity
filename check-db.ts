import Database from "better-sqlite3";
const db = new Database("data/entity.db");
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
console.log("Tables:", tables.map((t: any) => t.name));
const userCount = db.prepare("SELECT count(*) as c FROM users").get() as any;
console.log("Users:", userCount.c);
const jobCount = db.prepare("SELECT count(*) as c FROM jobs").get() as any;
console.log("Jobs:", jobCount.c);
db.close();
