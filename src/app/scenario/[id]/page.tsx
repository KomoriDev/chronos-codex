"use client"

import { useCallback, useEffect, useState } from "react"
import { GameSession } from "@/types/context"
import { Tables } from "@/types/database"
import ChatSection from "@/components/chat-section"
import { useAuth } from "@/hooks/use-auth"
import { useParams } from "next/navigation"

export default function ScenarioPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(true)
  const [scenario, setScenario] = useState<Tables<"scenarios">>()
  const [gameSessions, setGameSessions] = useState<GameSession[]>([])
  const [currentSessionId, setCurrentSessionId] = useState<string>("")

  useEffect(() => {
    const fetchScenarioData = async () => {
      if (!id) return
      try {
        const response = await fetch(`/api/scenario/${id}`)
        const data = await response.json()
        setScenario(data.scenarios || undefined)
      } catch (error) {
        console.error(error)
      }
    }
    fetchScenarioData()
  }, [id])

  useEffect(() => {
    const fetchUserGameSessions = async () => {
      if (!user || !scenario?.id) {
        setIsLoading(false)
        return
      }

      try {
        const response = await fetch(`/api/session?userId=${user.id}`)
        const sessions = (await response.json()).sessions as GameSession[]

        const filteredSessions = sessions.filter(
          (session) => session.scenario_id === scenario.id,
        )
        setGameSessions(filteredSessions || [])
        setIsLoading(false)

      } catch (error) {
        console.error(error)
        setIsLoading(false)
      }
    }

    if (scenario) {
      fetchUserGameSessions()
    }
  }, [user, scenario])

  const createGameSession = useCallback(async (scenarioId: string) => {
    if (!user) return

    const hasCreatedSession = sessionStorage.getItem(`created_${scenarioId}`)
    if (hasCreatedSession === "true") {
      console.log("Session already created for this scenario in this session.")
      return
    }

    try {
      const userId = user.id
      const response = await fetch("/api/session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          scenarioId,
          initialState: { level: 1, score: 0 },
        }),
      })

      const data = await response.json()
      setCurrentSessionId(data.session.id)
      setGameSessions((prev) => [...prev, data.session])
      sessionStorage.setItem(`created_${scenarioId}`, "true")

    } catch (error) {
      console.error(error)
    }
  }, [user])

  useEffect(() => {
    if (isLoading || !scenario || !user) return

    const existingSession = gameSessions.find(
      (session) => session.scenario_id === scenario.id,
    )

    if (existingSession) {
      setCurrentSessionId(existingSession.id)
    } else {
      createGameSession(scenario.id)
    }
  }, [scenario, user, gameSessions, createGameSession, isLoading])

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 h-screen flex items-center justify-center">
        <p>Loading scenario and sessions...</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 h-screen">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
        <div className="lg:col-span-1">
          <h2 className="text-xl font-semibold mb-4">{scenario?.name}</h2>
          <p className="text-sm text-zinc-500 mb-6">{scenario?.description}</p>

          <h2 className="text-xl font-semibold mb-4">History</h2>
          <div className="space-y-2">
            {gameSessions.map((session) => (
              <div key={session.id} className="p-3 border rounded-lg">
                <h4 className="font-medium text-sm">{session.scenarios.name}</h4>
                <button
                  onClick={() => setCurrentSessionId(session.id)}
                  className="mt-1 px-2 py-1 bg-zinc-800 text-white text-xs rounded hover:text-white/80"
                >
                  Continue
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2">
          {currentSessionId && (
            <ChatSection sessionId={currentSessionId} />
          )}
        </div>
      </div>
    </div>
  )
}

