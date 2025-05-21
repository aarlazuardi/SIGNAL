// Script to apply the original hash field migration directly
// This bypasses Prisma's migration system and applies the SQL directly
require("dotenv").config();
const { Client } = require("pg");
const fs = require("fs");
const path = require("path");

async function applyMigration() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log("Connecting to database...");
    await client.connect();
    console.log("Connected to database");

    // Read the migration SQL file
    const migrationFilePath = path.join(
      __dirname,
      "prisma",
      "migrations",
      "add_original_hash_field",
      "migration.sql"
    );
    const migrationSQL = fs.readFileSync(migrationFilePath, "utf8");

    console.log("Applying SQL migration...");
    console.log("SQL to execute:");
    console.log(migrationSQL);

    // Execute the SQL
    await client.query(migrationSQL);

    console.log("Migration applied successfully!");
  } catch (error) {
    console.error("Error applying migration:", error.message);
  } finally {
    await client.end();
    console.log("Database connection closed");
  }
}

applyMigration();
