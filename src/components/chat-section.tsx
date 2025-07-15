import { useChat } from "@ai-sdk/react"
import { useRef, useState, useEffect } from "react"

import { Avatar, AvatarFallback } from "./ui/avatar"
import { Input } from "./ui/input"
import { Button } from "./ui/button"
import { ScrollArea } from "./ui/scroll-area"
import { toast } from "sonner"

interface ChatSectionProps {
  sessionId: string
}

export default function ChatSection({ sessionId }: ChatSectionProps){
  const [d20Roll, setD20Roll] = useState<number | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)


  const { messages, input, handleInputChange, handleSubmit, status } = useChat({
    api: "/api/chat",
    onFinish: () => {
      setD20Roll(null)
    },
    onError: (error) => {
      console.log(error)
      toast.error("Oops!", { "description": error.message })
    },
  })

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  return (
    <div className="flex flex-col h-full bg-sidebar border border-sidebar rounded-lg shadow-lg">
      <div className="p-4 border-b border-sidebar-accent flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white">Chat</h2>
        <div className="text-sm text-white">Session ID: {sessionId.substring(0, 8)}...</div>
      </div>

      <ScrollArea className="flex-1 p-4 space-y-4">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex items-start gap-3 ${
              m.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            {m.role === "assistant" && (
              <Avatar className="w-8 h-8 top-2">
                <AvatarFallback className="bg-slate-200 text-slate-700">DM</AvatarFallback>
              </Avatar>
            )}
            <div
              className={`max-w-[70%] p-3 rounded-lg ${
                m.role === "user"
                  ? "bg-blue-500 text-white rounded-br-none"
                  : "bg-slate-100 text-slate-800 rounded-bl-none"
              }`}
            >
              {m.content}
            </div>
            {m.role === "user" && (
              <Avatar className="w-8 h-8">
                <AvatarFallback className="bg-blue-100 text-blue-700">您</AvatarFallback>
              </Avatar>
            )}
          </div>
        ))}
        {status !== "ready" && (
          <div className="flex items-start gap-3 justify-start">
            <Avatar className="w-8 h-8">
              <AvatarFallback className="bg-slate-200 text-slate-700">DM</AvatarFallback>
            </Avatar>
            <div className="max-w-[70%] p-3 rounded-lg bg-slate-100 text-slate-800 rounded-bl-none animate-pulse">
              :thinking:
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </ScrollArea>

      <form onSubmit={event => {
        handleSubmit(event, {
          body: {
            sessionId: sessionId,
            d20RollResult: d20Roll,
          },
        })}} className="p-4 border-t border-sidebar-accent flex items-center gap-2">
        <Input
          placeholder="Type your action..."
          value={input}
          onChange={handleInputChange}
          disabled={status !== "ready"}
          className="flex-1"
        />
        <Input
          type="number"
          placeholder="D20"
          value={d20Roll === null ? "" : d20Roll}
          onChange={(e) => setD20Roll(e.target.value === "" ? null : parseInt(e.target.value))}
          min="1"
          max="20"
          className="w-24"
          disabled={status !== "ready"}
        />
        <Button type="submit" disabled={status !== "ready" || !input.trim()}>
          Send
        </Button>
      </form>
    </div>
  )
}
