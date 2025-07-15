import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const supabase = await createClient()

  try {
    const { data, error } = await supabase
      .from("scenarios")
      .select("*")
      .eq("id", id)
      .single()

    if (error) throw error

    return NextResponse.json({ scenarios: data })
  } catch (error) {
    console.error("Failed to get scenario:", error)
    return NextResponse.json({ error: "Failed to get scenario" }, { status: 500 })
  }
}
