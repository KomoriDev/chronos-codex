"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Tables } from "@/types/database"

export function ScenarioCard({ scenario }: { scenario: Tables<"scenarios">}) {
  const route = useRouter()

  return (
    <Card
      className="w-full max-w-sm transition hover:border-zinc-600 hover:cursor-pointer"
      onClick={() => route.push(`/scenario/${scenario.id}`)}
    >
      <CardHeader>
        <CardTitle>{scenario.name}</CardTitle>
        <CardDescription>
          {scenario.description}
        </CardDescription>
        <CardAction>
          <Button variant="link" onClick={() => route.push(`/scenario/${scenario.id}`)}>Try</Button>
        </CardAction>
      </CardHeader>
    </Card>
  )
}
