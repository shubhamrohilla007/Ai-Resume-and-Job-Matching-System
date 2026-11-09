#!/usr/bin/env node
/**
 * MongoDB Local -> MongoDB Atlas Migration Utility
 *
 * Usage:
 *   node scripts/migrate_mongo_to_atlas.js --dry-run
 *   node scripts/migrate_mongo_to_atlas.js --execute
 *
 * Environment variables:
 *   SOURCE_MONGO_URI: Source database (defaults to mongodb://127.0.0.1:27017/ai_resume_system)
 *   TARGET_MONGO_URI: Target database (defaults to MONGODB_URI or MONGO_URL)
 */

require("dotenv").config();
const mongoose = require("mongoose");
const { maskMongoUri, getDbName } = require("../config/db");

const args = process.argv.slice(2);
const isExecute = args.includes("--execute");
const isDryRun = args.includes("--dry-run") || !isExecute;

const sourceUri =
    process.env.SOURCE_MONGO_URI ||
    process.env.LOCAL_MONGO_URI ||
    "mongodb://127.0.0.1:27017/ai_resume_system";

const targetUri =
    process.env.TARGET_MONGO_URI ||
    process.env.ATLASDB_URL ||
    process.env.MONGODB_URI ||
    process.env.MONGO_URL;

async function migrate() {
    console.log("==================================================================");
    console.log("   AI Resume System: MongoDB Local -> MongoDB Atlas Migration     ");
    console.log("==================================================================");
    console.log(`Mode:           ${isExecute ? "EXECUTE (Live Migration)" : "DRY-RUN (Verification Only)"}`);
    console.log(`Source URI:     ${maskMongoUri(sourceUri)}`);
    console.log(`Target URI:     ${maskMongoUri(targetUri)}`);
    console.log("------------------------------------------------------------------");

    if (!targetUri) {
        console.error("ERROR: TARGET_MONGO_URI or MONGODB_URI/MONGO_URL must be specified.");
        process.exit(1);
    }

    if (sourceUri === targetUri) {
        console.error("ERROR: Source and Target URIs cannot be identical!");
        process.exit(1);
    }

    let sourceConn = null;
    let targetConn = null;

    try {
        console.log("[1/4] Connecting to Source MongoDB...");
        sourceConn = await mongoose.createConnection(sourceUri, {
            serverSelectionTimeoutMS: 5000,
        }).asPromise();
        console.log("      Connected to Source successfully.");

        console.log("[2/4] Connecting to Target MongoDB (Atlas)...");
        targetConn = await mongoose.createConnection(targetUri, {
            dbName: getDbName(targetUri),
            serverSelectionTimeoutMS: 5000,
        }).asPromise();
        console.log("      Connected to Target successfully.");

        console.log("[3/4] Inspecting Source Collections...");
        const collections = await sourceConn.db.listCollections().toArray();
        const collectionNames = collections
            .map((c) => c.name)
            .filter((name) => !name.startsWith("system."));

        if (collectionNames.length === 0) {
            console.log("      No collections found in source database.");
            return;
        }

        console.log(`      Found ${collectionNames.length} collections: ${collectionNames.join(", ")}`);
        console.log("------------------------------------------------------------------");

        const summary = [];

        for (const colName of collectionNames) {
            const sourceCol = sourceConn.db.collection(colName);
            const targetCol = targetConn.db.collection(colName);

            const sourceCount = await sourceCol.countDocuments();
            const targetInitialCount = await targetCol.countDocuments();

            if (isDryRun) {
                summary.push({
                    collection: colName,
                    sourceCount,
                    targetInitialCount,
                    status: "DRY-RUN: Ready to copy",
                });
                continue;
            }

            // Execute mode: migrate documents
            console.log(`Migrating collection '${colName}' (${sourceCount} docs)...`);
            let migratedCount = 0;
            let skippedCount = 0;

            if (sourceCount > 0) {
                const batchSize = 250;
                let skip = 0;

                while (skip < sourceCount) {
                    const docs = await sourceCol.find({}).skip(skip).limit(batchSize).toArray();
                    if (!docs.length) break;

                    const ops = docs.map((doc) => ({
                        updateOne: {
                            filter: { _id: doc._id },
                            update: { $setOnInsert: doc },
                            upsert: true,
                        },
                    }));

                    const result = await targetCol.bulkWrite(ops, { ordered: false });
                    migratedCount += result.upsertedCount || 0;
                    skippedCount += result.matchedCount || 0;
                    skip += docs.length;
                }
            }

            const targetFinalCount = await targetCol.countDocuments();
            summary.push({
                collection: colName,
                sourceCount,
                migratedCount,
                skippedCount,
                targetFinalCount,
                status: "Completed",
            });
        }

        console.log("\n==================================================================");
        console.log("                       MIGRATION SUMMARY                          ");
        console.log("==================================================================");
        console.table(summary);
        console.log("------------------------------------------------------------------");
        if (isDryRun) {
            console.log("Dry-run complete. No data was modified. To execute migration:");
            console.log("node scripts/migrate_mongo_to_atlas.js --execute");
        } else {
            console.log("Migration executed successfully. All source documents preserved.");
        }
        console.log("==================================================================");
    } catch (err) {
        console.error("Migration failed:", err.message);
        process.exit(1);
    } finally {
        if (sourceConn) await sourceConn.close();
        if (targetConn) await targetConn.close();
    }
}

if (require.main === module) {
    migrate();
}

module.exports = migrate;
