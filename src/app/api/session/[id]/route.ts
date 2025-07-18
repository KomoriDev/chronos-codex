import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { parseCurrentState, parseScenarioTemplate } from "@/lib/parse"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const supabase = await createClient()
  try {

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
      .eq("id", id)
      .single()

    if (error) throw error

    const session = {
      ...data,
      current_state: parseCurrentState(data.current_state),
      scenarios: {
        ...data.scenarios,
        template_json: parseScenarioTemplate(data.scenarios.template_json),
      },
    }

    return NextResponse.json({ session })
  } catch (error) {
    console.error("Failed to get session:", error)
    return NextResponse.json({ error: "Failed to get session" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const supabase = await createClient()

  try {
    const { data, error } = await supabase
      .from("game_sessions")
      .delete()
      .eq("id", id)
      .select(`
        *,
        scenarios (
          name,
          description,
          template_json
        )
      `)
      .order("created_at", { ascending: false })

    if (error) throw error

    return NextResponse.json({ data }, { status: 200 })
  } catch (error) {
    console.error("Failed to delete session:", error)
    return NextResponse.json({ error: "Failed to delete session" }, { status: 500 })
  }
}
