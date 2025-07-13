"use client"

import {
  IconDots,
  IconFolder,
  IconShare3,
  IconTrash,
  IconScript,
} from "@tabler/icons-react"
import Link from "next/link"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"

const SCENARIO_HISTORY_KEY = "scenarioHistory"

interface ScenarioHistoryItem {
  id: string
  name: string
  lastVisited: string
}

export function NavDocuments() {
  const route = useRouter()
  const { isMobile } = useSidebar()
  const [visitedScenarios, setVisitedScenarios] = useState<ScenarioHistoryItem[]>([])

  useEffect(() => {
    try {
      const storedHistory = localStorage.getItem(SCENARIO_HISTORY_KEY)

      if (storedHistory) {
        const parsedHistory: ScenarioHistoryItem[] = JSON.parse(storedHistory)

        parsedHistory.sort((a, b) => {
          return new Date(b.lastVisited).getTime() - new Date(a.lastVisited).getTime()
        })

        setVisitedScenarios(parsedHistory)
      }
    } catch (error) {
      console.error("Error fetching scenario history from localStorage:", error)
      setVisitedScenarios([])
    }
  }, [])

  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel>Scenarios</SidebarGroupLabel>
      <SidebarMenu>
        {visitedScenarios.map((scenario) => (
          <SidebarMenuItem key={scenario.name}>
            <SidebarMenuButton asChild>
              <Link href={`/scenario/${scenario.id}`}>
                <IconScript />
                <span>{scenario.name}</span>
              </Link>
            </SidebarMenuButton>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuAction
                  showOnHover
                  className="data-[state=open]:bg-accent rounded-sm"
                >
                  <IconDots />
                  <span className="sr-only">More</span>
                </SidebarMenuAction>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-24 rounded-lg"
                side={isMobile ? "bottom" : "right"}
                align={isMobile ? "end" : "start"}
              >
                <DropdownMenuItem onClick={() => route.push(`/scenario/${scenario.id}`)}>
                  <IconFolder />
                  <span>Open</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <IconShare3 />
                  <span>Share</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive">
                  <IconTrash />
                  <span>Delete</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        ))}
        <SidebarMenuItem>
          <SidebarMenuButton className="text-sidebar-foreground/70">
            <IconDots className="text-sidebar-foreground/70" />
            <span>More</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarGroup>
  )
}
