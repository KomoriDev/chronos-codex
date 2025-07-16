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

    const currentState = typeof gameSession.current_state === "string"
      ? JSON.parse(gameSession.current_state)
      : gameSession.current_state

    const roleStyle = currentState?.customization?.parentingStyle
    const familyType = currentState?.customization?.familyBackground

    let roleDetails = null
    let familyDetails = null

    if (roleStyle && familyType) {
      roleDetails = scenario.template_json.playerCustomizations.role.content[roleStyle]
      familyDetails = scenario.template_json.playerCustomizations.background.content[familyType]
    }

    const systemPromptContent = `
      You are a narrative AI hosting an interactive parenting simulation.
      You will act as an omniscient narrator and various NPCs (teachers, children, other parents, etc.)
      to create an immersive story about Asian parenting challenges.

      Scenario: ${JSON.stringify(scenario.template_json["Dnd-Scenario"])}
      Starting Point: ${JSON.stringify(scenario.template_json.startingPoint, null, 2)}

      Player's Role: ${roleStyle}
      ${roleDetails ? `Role Description: ${JSON.stringify(roleDetails.description)}
      Role Attributes: ${JSON.stringify(roleDetails.attributeBonus)}` : ""}

      Family Background: ${familyType}
      ${familyDetails ? `Background Description: ${JSON.stringify(familyDetails.description)}
      Background Attributes: ${JSON.stringify(familyDetails.attributeBonus)}` : ""}

      Available Attributes:
      ${Object.entries(scenario.template_json.attributes)
        .map(([name, desc]) => `- ${name}: ${desc}`)
        .join("\n      ")}

      Base Skills:
      ${Object.entries(scenario.template_json.baseSkills)
        .map(([name, skill]) => `- ${name} (${skill.attribute}): ${skill.description}`)
        .join("\n")}

      Current game state: ${JSON.stringify(gameSession.current_state, null, 2)}
      Roll result (if applicable): ${d20RollResult !== null ? d20RollResult : "None"}

      Instructions:
      1. Respond in character based on the scene and context
      2. Use the player's role and family background to inform responses and consequences
      3. Reference specific attributes and skills when they come into play
      4. Maintain consistent personality traits based on the chosen role style
      5. Consider the family background's influence on decisions and reactions
      6. Incorporate cultural elements and expectations naturally into the narrative

      Format your response as a natural conversation or narrative, but you can mark game mechanics
      with brackets when relevant, e.g. [Family Honor check: 15] or [Tiger Discipline increased by 1]
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
