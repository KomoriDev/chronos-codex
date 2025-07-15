import { useChat } from "@ai-sdk/react"
import { useRef, useState, useEffect } from "react"

import { Avatar, AvatarFallback } from "./ui/avatar"
import { Input } from "./ui/input"
import { Button } from "./ui/button"
import { ScrollArea } from "./ui/scroll-area"
import { toast } from "sonner"
import { Tables } from "@/types/database"

type ChatSectionProps = {
  sessionId: string;
}
type Message = Tables<"conversation_history">

export default function ChatSection(props: ChatSectionProps) {
  const sessionId = props.sessionId

  const lastSavedTurn = useRef(-1)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [ready, setReady] = useState(false)
  const [d20Roll, setD20Roll] = useState<number | null>(null)
  const [initialMessages, setInitialMessages] = useState<Message[] | null>(null)

  useEffect(() => {
    setInitialMessages(null)
    setReady(false)
    lastSavedTurn.current = -1

    async function fetchHistory() {
      try {
        const res = await fetch(`/api/conversation?sessionId=${encodeURIComponent(sessionId)}`)
        if (!res.ok) {
          throw new Error("Cannot obtain historical messages")
        }

        const data = (await res.json()).messages as Message[]

        if (Array.isArray(data)) {
          setInitialMessages(data)
        } else {
          setInitialMessages([])
        }
      } catch (err) {
        toast.error("加载历史消息失败", { description: String(err) })
        setInitialMessages([])
      } finally {
        setReady(true)
      }
    }
    fetchHistory()
  }, [sessionId])

  const chat = useChat({
    api: "/api/chat",
    id: sessionId,
    initialMessages: ready ? initialMessages ?? [] : [],
    onFinish: () => {
      setD20Roll(null)
    },
    onError: (error) => {
      toast.error("Oops!", { description: error.message })
    },
    key: sessionId,
  })
  const { messages, input, handleInputChange, handleSubmit, status } = chat

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  if (!ready)
    return (
      <div className="flex flex-col h-full bg-sidebar border border-sidebar rounded-lg shadow-lg">
        <div className="p-4 border-b border-sidebar-accent flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">Chat</h2>
          <div className="text-sm text-white">Session ID: {sessionId.substring(0, 8)}...</div>
        </div>
        <div className="flex-1 flex items-center justify-center text-white">加载中...</div>
      </div>
    )

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

      <form
        onSubmit={(event) => {
          handleSubmit(event, {
            body: {
              sessionId: sessionId,
              d20RollResult: d20Roll,
            },
          })
        }}
        className="p-4 border-t border-sidebar-accent flex items-center gap-2"
      >
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
