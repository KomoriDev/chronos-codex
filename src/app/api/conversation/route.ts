import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  const supabase = await createClient()

  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get("sessionId")

    if (!sessionId) {
      return NextResponse.json({ error: "Missing sessionId in request body." }, { status: 400 })
    }

    const { data, error } = await supabase
      .from("conversation_history")
      .select("*")
      .eq("session_id", sessionId)
      .order("turn_number", { ascending: true })

    if (error) throw error

    const messages = data.map(item => ({
      id: item.id,
      role: item.role,
      content: item.content,
      timestamp: new Date(item.timestamp || ""),
      turn_number: item.turn_number,
    }))

    return NextResponse.json({ messages })
  } catch (error) {
    console.error("Failed to get conversation history:", error)
    return NextResponse.json({ error: "Failed to get conversation history" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  try {
    const { sessionId, role, content, turnNumber } = await request.json()

    if (!sessionId || !role || !content || turnNumber === undefined) {
      return NextResponse.json({ error: "Missing requied parameters" }, { status: 400 })
    }

    const { data, error } = await supabase
      .from("conversation_history")
      .insert({
        session_id: sessionId,
        role,
        content,
        turn_number: turnNumber,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ message: data })
  } catch (error) {
    console.error("Failed to save conversation history:", error)
    return NextResponse.json({ error: "Failed to save conversation history" }, { status: 500 })
  }
}
