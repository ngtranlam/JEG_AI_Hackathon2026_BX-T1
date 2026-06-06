import { exec } from "node:child_process";
import { promisify } from "node:util";
import { NextResponse } from "next/server";

const execAsync = promisify(exec);

export async function POST() {
  try {
    // Run cleanup script
    await execAsync("bash scripts/cleanup.sh", {
      cwd: process.cwd(),
    });

    return NextResponse.json({ success: true, message: "Cache cleared successfully" });
  } catch (error) {
    console.error("Cleanup error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to clear cache" },
      { status: 500 },
    );
  }
}
