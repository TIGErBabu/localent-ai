import { NextResponse } from "next/server";
import { config } from "@/lib/config";
export async function GET() {
  return NextResponse.json({ ok: true, app: "localent-ai", mode: config.demoMode ? "demo" : "live", metro: config.metro });
}
