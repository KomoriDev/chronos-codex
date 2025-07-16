"use client"

import { Plus } from "lucide-react"
import { useParams } from "next/navigation"
import { useCallback, useEffect, useState } from "react"

import { Tables } from "@/types/database"
import ChatSection from "@/components/chat-section"
import { useAuth } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

interface CustomizationContent {
  description: string;
  attributeBonus: Record<string, number>;
}

interface PlayerCustomizations {
  role: {
    content: Record<string, CustomizationContent>;
    description: string;
  };
  background: {
    content: Record<string, CustomizationContent>;
    description: string;
  };
}

interface Skill {
  attribute: string;
  description: string;
}

interface TemplateJson {
  attributes: Record<string, string>;
  baseSkills: Record<string, Skill>;
  "Dnd-Scenario": string;
  startingPoint: string;
  playerCustomizations: PlayerCustomizations;
}

interface ScenarioWithTemplate extends Omit<Tables<"scenarios">, "template_json"> {
  template_json: TemplateJson;
}

export default function ScenarioPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(true)
  const [scenario, setScenario] = useState<ScenarioWithTemplate>()
  const [gameSessions, setGameSessions] = useState<Tables<"game_sessions">[]>([])
  const [currentSessionId, setCurrentSessionId] = useState<string>("")
  const [showCustomizationDialog, setShowCustomizationDialog] = useState(false)
  const [selectedParentingStyle, setSelectedParentingStyle] = useState("")
  const [selectedFamilyBackground, setSelectedFamilyBackground] = useState("")

  const createGameSession = useCallback(async () => {
    if (!user || !scenario) return

    setShowCustomizationDialog(true)
  }, [scenario, user])

  const handleCreateSession = useCallback(async () => {
    if (!user || !scenario || !selectedParentingStyle || !selectedFamilyBackground) return

    const response = await fetch("/api/session", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId: user.id,
        scenarioId: scenario.id,
        initialState: {
          level: 1,
          score: 0,
          customization: {
            parentingStyle: selectedParentingStyle,
            familyBackground: selectedFamilyBackground,
          },
        },
      }),
    })

    const data = await response.json()

    setCurrentSessionId(data.session.id)
    setGameSessions((prev) => [...prev, data.session])
    setShowCustomizationDialog(false)

    return data.session
  }, [scenario, user, selectedParentingStyle, selectedFamilyBackground])

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

        const filteredSessions = sessions.filter((session) => session.scenario_id === scenario.id)
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
    <div className="container mx-auto p-4 h-full">
      <Dialog open={showCustomizationDialog} onOpenChange={setShowCustomizationDialog}>
        <DialogContent className="max-w-3xl h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader className="flex-none">
            <DialogTitle>Customize your player</DialogTitle>
            <DialogDescription>
              Before starting a new game session, select your parenting style and family background
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="flex-1 h-0 min-h-0">
            <div className="space-y-6 p-4">
              {scenario?.template_json?.playerCustomizations && (
                <>
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">
                      {scenario.template_json.playerCustomizations.role.description}
                    </h3>
                    <RadioGroup
                      value={selectedParentingStyle}
                      onValueChange={setSelectedParentingStyle}
                    >
                      {Object.entries(
                        scenario.template_json.playerCustomizations.role.content,
                      ).map(([key, value]) => (
                        <Label key={key} className="cursor-pointer" htmlFor={`parenting-${key}`}>
                          <Card
                            className={`p-4 hover:border-zinc-600 ${
                              selectedParentingStyle === key ? "border-primary" : ""
                            }`}
                          >
                            <div className="flex items-start space-x-3">
                              <RadioGroupItem value={key} id={`parenting-${key}`} />
                              <div className="flex-1">
                                <div className="text-base font-medium">{key}</div>
                                <p className="text-sm text-zinc-500 mt-1">{value.description}</p>
                                <div className="text-xs text-zinc-500 mt-2">
                                  <span>Bonus:</span>
                                  {Object.entries(value.attributeBonus).map(([attr, bonus]) => (
                                    <span key={attr} className="ml-2">
                                      {attr} +{bonus}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </Card>
                        </Label>
                      ))}
                    </RadioGroup>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">
                      {scenario.template_json.playerCustomizations.background.description}
                    </h3>
                    <RadioGroup
                      value={selectedFamilyBackground}
                      onValueChange={setSelectedFamilyBackground}
                    >
                      {Object.entries(
                        scenario.template_json.playerCustomizations.background.content,
                      ).map(([key, value]) => (
                        <Label key={key} className="cursor-pointer" htmlFor={`background-${key}`}>
                          <Card
                            className={`p-4 hover:border-zinc-600 ${
                              selectedFamilyBackground === key ? "border-primary" : ""
                            }`}
                          >
                            <div className="flex items-start space-x-3">
                              <RadioGroupItem value={key} id={`background-${key}`} />
                              <div className="flex-1">
                                <div className="text-base font-medium">{key}</div>
                                <p className="text-sm text-zinc-500 mt-1">{value.description}</p>
                                <div className="text-xs text-zinc-500 mt-2">
                                  <span>Bonus:</span>
                                  {Object.entries(value.attributeBonus).map(([attr, bonus]) => (
                                    <span key={attr} className="ml-2">
                                      {attr} +{bonus}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </Card>
                        </Label>
                      ))}
                    </RadioGroup>
                  </div>
                </>
              )}
            </div>
          </ScrollArea>

          <div className="flex justify-end space-x-4">
            <Button variant="outline" onClick={() => setShowCustomizationDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateSession}
              disabled={!selectedParentingStyle || !selectedFamilyBackground}
            >
              Save
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
        <div className="lg:col-span-1">
          <h2 className="text-xl font-semibold mb-4">{scenario?.name}</h2>
          <p className="text-sm text-zinc-500 mb-6">{scenario?.description}</p>

          <span className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">History</h2>
            <Button variant="outline" onClick={createGameSession}>
              <Plus /> Create
            </Button>
          </span>
          <div className="space-y-2">
            {gameSessions.map((session) => (
              <div key={session.id}>
                <ContextMenu>
                  <ContextMenuTrigger>
                    <div
                      className={`p-3 border rounded-lg transition hover:border-zinc-600 hover:cursor-pointer ${
                        session.id === currentSessionId ? "border-zinc-700" : ""
                      }`}
                      onClick={() => setCurrentSessionId(session.id)}
                    >
                      <h4 className="font-medium text-sm">{scenario?.name}</h4>
                    </div>
                  </ContextMenuTrigger>
                  <ContextMenuContent>
                    <ContextMenuItem onClick={async () => deleteGameSession(session.id)}>
                      Delete
                    </ContextMenuItem>
                  </ContextMenuContent>
                </ContextMenu>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2">
          {currentSessionId && <ChatSection sessionId={currentSessionId} />}
        </div>
      </div>
    </div>
  )
}
