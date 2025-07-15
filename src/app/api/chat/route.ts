import { streamText } from "ai"
import { createGoogleGenerativeAI } from "@ai-sdk/google"

import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"
import { Tables } from "@/types/database"

const google = createGoogleGenerativeAI({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY!,
})

export async function POST(req: NextRequest) {
  const supabase = await createClient()

  try {
    const { messages, sessionId, d20RollResult } = await req.json()

    if (!sessionId || !messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "Invalid request: sessionId and messages are required." }, { status: 400 })
    }

    const userMessage = messages[messages.length - 1]
    if (userMessage.role === "user") {
      await supabase
        .from("conversation_history")
        .insert({
          session_id: sessionId,
          role: userMessage.role,
          content: userMessage.content,
          turn_number: messages.length - 1,
          timestamp: new Date().toISOString(),
        })
    }

    const { data: gameSessionData, error: sessionError } = await supabase
      .from("game_sessions")
      .select("*, scenarios(*)")
      .eq("id", sessionId)
      .single()

    if (sessionError || !gameSessionData) {
      console.error("Error fetching game session:", sessionError)
      return NextResponse.json({ error: "Game session not found or error fetching." }, { status: 404 })
    }

    const gameSession: Tables<"game_sessions"> = gameSessionData as Tables<"game_sessions">
    const scenario: Tables<"scenarios"> = gameSessionData.scenarios

    const systemPromptContent = `
      You are an experienced Dungeon Master (DM) hosting a D&D-style text adventure.
      Your task is to describe the scene, drive the narrative, and update the game world based on the players' actions and the game state.

      Story name: ${JSON.stringify(scenario.template_json["Dnd-Scenario"])}
      Story background: ${JSON.stringify(scenario.template_json.startingPoint, null, 2)}

      Current scene template: ${JSON.stringify(scenario.template_json, null, 2)}
      Current game status: ${JSON.stringify(gameSession.current_state, null, 2)}

      Player's D20 roll result (optional): ${d20RollResult !== null ? d20RollResult : "None"}

      Please generate a narrative response based on the information above, and also provide a JSON object containing any game states that need to be updated.
      If no specific state needs to be updated, omit this field.

      Please generate a narrative response based on the information above.
    `

    const result = streamText({
      model: google("gemini-1.5-flash"),
      system: systemPromptContent,
      messages: messages,
      onError: (error) => {
        console.error("Error from streamText:", error)
        throw error
      },
      onFinish: async (result) => {
        await supabase
          .from("conversation_history")
          .insert({
            session_id: sessionId,
            role: "assistant",
            content: result.text,
            turn_number: messages.length,
            timestamp: new Date().toISOString(),
          })
      },
    })

    return result.toDataStreamResponse()

  } catch (e) {
    return NextResponse.json({ error: e }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  const supabase = await createClient()

  try {
    const { searchParams } = new URL(req.url)
    const sessionId = searchParams.get("sessionId")

    if (!sessionId) {
      return NextResponse.json({ error: "Missing sessionId parameter." }, { status: 400 })
    }

    const { data, error } = await supabase
      .from("conversation_history")
      .select("*")
      .eq("session_id", sessionId)
      .order("turn_number", { ascending: true })

    if (error) {
      console.error("Error fetching conversation history:", error)
      return NextResponse.json({ error: "Error fetching conversation history." }, { status: 500 })
    }

    const formattedHistory = data.map(msg => ({
      id: msg.id,
      role: msg.role === "system" ? "assistant" : msg.role,
      content: msg.content,
      timestamp: new Date(msg.timestamp || "").toISOString(),
      turn_number: msg.turn_number,
    }))

    return NextResponse.json(formattedHistory, { status: 200 })

  } catch (error) {
    console.error("API Error:", error)
    return NextResponse.json({ error: "Internal server error." }, { status: 500 })
  }
}
