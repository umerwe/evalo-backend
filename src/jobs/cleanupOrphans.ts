import cron from "node-cron";
import { PendingUpload } from "../models/PendingUpload";
import { deleteFromS3 } from "../services/s3.service";

// Runs every hour at minute 0
cron.schedule("0 * * * *", async () => {
  try {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    const orphans = await PendingUpload.find({
      createdAt: { $lt: oneHourAgo },
    });

    if (orphans.length === 0) {
      console.log("[Cleanup] No orphan files to clean");
      return;
    }

    console.log(`[Cleanup] Found ${orphans.length} orphan files, deleting...`);

    for (const orphan of orphans) {
      await deleteFromS3(orphan.fileKey).catch((err) => {
        console.error(`[Cleanup] Failed to delete ${orphan.fileKey}:`, err);
      });
      await PendingUpload.deleteOne({ _id: orphan._id });
    }

    console.log(`[Cleanup] Cleaned ${orphans.length} orphan files ✅`);
  } catch (error) {
    console.error("[Cleanup] Cron job failed:", error);
  }
});

console.log("[Cleanup] Orphan cleanup cron job scheduled (runs every hour)");