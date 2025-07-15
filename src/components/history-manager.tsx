"use client"

import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

const SCENARIO_HISTORY_KEY = "scenarioHistory"

interface ScenarioHistoryItem {
  id: string
  name: string
  lastVisited: string
}

export function ScenarioHistoryManager() {
  const pathname = usePathname()
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [history, setHistory] = useState<ScenarioHistoryItem[]>([])
  const supabase = createClient()

  useEffect(() => {
    const storedHistory = localStorage.getItem(SCENARIO_HISTORY_KEY)
    if (storedHistory) {
      const parsedHistory: ScenarioHistoryItem[] = JSON.parse(storedHistory)
      setHistory(parsedHistory)
    }
  }, [])

  useEffect(() => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    const urlParts = pathname.split("/")
    const potentialId = urlParts[urlParts.length - 1]

    if (urlParts[1] === "scenario" && uuidRegex.test(potentialId)) {
      const id = potentialId
      const now = new Date().toISOString()

      const updateHistory = async () => {
        let scenarioName = "未知场景"

        const { data } = await supabase
          .from("scenarios")
          .select("name")
          .eq("id", id)
          .single()

        if (data && data.name) {
          scenarioName = data.name
        }


        setHistory(prevHistory => {
          let updatedHistory: ScenarioHistoryItem[] = []
          const existingIndex = prevHistory.findIndex(item => item.id === id)

          if (existingIndex !== -1) {
            updatedHistory = prevHistory.map((item, index) =>
              index === existingIndex ? { ...item, name: scenarioName, lastVisited: now } : item,
            )
          } else {
            updatedHistory = [...prevHistory, { id, name: scenarioName, lastVisited: now }]
          }

          updatedHistory.sort((a, b) => new Date(b.lastVisited).getTime() - new Date(a.lastVisited).getTime())

          const limitedHistory = updatedHistory.slice(0, 20)

          localStorage.setItem(SCENARIO_HISTORY_KEY, JSON.stringify(limitedHistory))
          return limitedHistory
        })
      }
      updateHistory()
    }
  }, [pathname, supabase])
  return null
}
