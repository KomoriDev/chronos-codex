import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  try {
    const { name, description, templateJson } = await request.json()

    const { data, error } = await supabase
      .from("scenarios")
      .insert({
        name,
        description,
        template_json: templateJson,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ scenario: data })
  } catch (error) {
    console.error("Failed to create scenario:", error)
    return NextResponse.json({ error: "Failed to create scenario" }, { status: 500 })
  }
}
