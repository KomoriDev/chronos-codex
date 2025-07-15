import { useChat } from "@ai-sdk/react"
import { useRef, useState, useEffect } from "react"

import { Input } from "./ui/input"
import { Button } from "./ui/button"
import { toast } from "sonner"
import { Tables } from "@/types/database"
import { ChatMessageList } from "./ui/chat/chat-message-list"
import { ChatBubble, ChatBubbleAvatar, ChatBubbleMessage } from "./ui/chat/chat-bubble"
import { ScrollArea } from "./ui/scroll-area"

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

        if (data.length === 0) {
          setInitialMessages([
            {
              id: "initial",
              role: "assistant",
              content:
                "Welcome! You're embarking on a D&D-style text adventure. Get ready to use your imagination and face whatever challenges lie ahead.",
              turn_number: 0,
              timestamp: new Date().toISOString(),
            } as Message,
          ])
        } else {
          setInitialMessages(data)
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

      <ScrollArea className="flex-1">
        <ChatMessageList>
          {messages.map((message) => (
            <ChatBubble key={message.id} variant={message.role == "user" ? "sent" : "received"}>
              <ChatBubbleAvatar src="" fallback={message.role == "user" ? "👨🏽" : "🤖"} />
              <ChatBubbleMessage>{message.content}</ChatBubbleMessage>
            </ChatBubble>
          ))}

          {status !== "ready" && (
            <ChatBubble variant="received">
              <ChatBubbleAvatar src="" fallback="🤖" />
              <ChatBubbleMessage isLoading />
            </ChatBubble>
          )}
        </ChatMessageList>
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
