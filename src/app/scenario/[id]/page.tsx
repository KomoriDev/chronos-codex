"use client"

import { Plus } from "lucide-react"
import { useParams } from "next/navigation"
import { useCallback, useEffect, useState } from "react"

import { Tables } from "@/types/database"
import ChatSection from "@/components/chat-section"
import { useAuth } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from "@/components/ui/context-menu"

export default function ScenarioPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(true)
  const [scenario, setScenario] = useState<Tables<"scenarios">>()
  const [gameSessions, setGameSessions] = useState<Tables<"game_sessions">[]>([])
  const [currentSessionId, setCurrentSessionId] = useState<string>("")

  const createGameSession = useCallback(async () => {
    if (!user || !scenario) return

    const userId = user.id
    const scenarioId = scenario.id
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

    return data.session
  }, [scenario, user])

  const deleteGameSession = async (sessionId: string) => {
    if (!user || !scenario) return

    await fetch(`/api/session/${sessionId}`, { method: "DELETE" })

    setGameSessions((prevSessions) => {
      const updatedSessions = prevSessions.filter((session) => session.id !== sessionId)

      if (currentSessionId === sessionId) {
        setCurrentSessionId(updatedSessions.length > 0 ? updatedSessions[0].id : "")
      }

      return updatedSessions
    })
  }

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
        const sessions = (await response.json()).sessions as Tables<"game_sessions">[]

        const filteredSessions = sessions.filter(
          (session) => session.scenario_id === scenario.id,
        )
        if (filteredSessions.length === 0) {
          await createGameSession()
        } else {
          setGameSessions(filteredSessions || [])
          setCurrentSessionId(filteredSessions[0].id)
        }
        setIsLoading(false)
      } catch (error) {
        console.error(error)
        setIsLoading(false)
      }
    }

    if (scenario) {
      fetchUserGameSessions()
    }

  }, [user, scenario, createGameSession])

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

          <span className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">History</h2>
            <Button variant="outline" onClick={createGameSession}><Plus /> 新增</Button>
          </span>
          <div className="space-y-2">
            {gameSessions.map((session) => (
              <div key={session.id}>
                <ContextMenu>
                  <ContextMenuTrigger>
                    <div
                      className={`p-3 border rounded-lg transition hover:border-zinc-600 hover:cursor-pointer ${ session.id === currentSessionId ? "border-zinc-700" : ""}`}
                      onClick={() => setCurrentSessionId(session.id)}
                    >
                      <h4 className="font-medium text-sm">{scenario?.name}</h4>
                    </div>
                  </ContextMenuTrigger>
                  <ContextMenuContent>
                    <ContextMenuItem onClick={async () => deleteGameSession(session.id)}>Delete</ContextMenuItem>
                  </ContextMenuContent>
                </ContextMenu>
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

