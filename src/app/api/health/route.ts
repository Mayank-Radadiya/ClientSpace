import { NextResponse } from "next/server";
import { redis } from "@/lib/redis";

export async function GET() {
  try {
    const result = await redis.ping();
    if (result === "PONG" || result) {
      return NextResponse.json({ redis: "ok" });
    }
    return NextResponse.json({ redis: "error" }, { status: 500 });
  } catch (error) {
    console.error("[healthcheck] Redis ping failed:", error);
    return NextResponse.json({ redis: "error" }, { status: 500 });
  }
}
