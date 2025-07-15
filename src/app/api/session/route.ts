import { NextRequest, NextResponse} from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")
    const supabase = await createClient()

    if (!userId) {
      return NextResponse.json({ error: "Missing userId in request body." }, { status: 400 })
    }

    const { data, error } = await supabase
      .from("game_sessions")
      .select(`
        *,
        scenarios (
          name,
          description,
          template_json
        )
      `)
      .eq("user_id", userId)
      .order("created_at", { ascending: false })

    if (error) throw error

    return NextResponse.json({ sessions: data })
  } catch (error) {
    console.error("Failed to get session:", error)
    return NextResponse.json({ error: "Failed to get session" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId, scenarioId, initialState } = await request.json()
    const supabase = await createClient()

    const { data, error } = await supabase
      .from("game_sessions")
      .insert({
        user_id: userId,
        scenario_id: scenarioId,
        current_state: initialState || {},
        status: "active",
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ session: data })
  } catch (error) {
    console.error("Failed to create session:", error)
    return NextResponse.json({ error: "Failed to create session" }, { status: 500 })
  }
}
