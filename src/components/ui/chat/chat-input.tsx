import * as React from "react"
import { Textarea } from "../textarea"
import { cn } from "@/lib/utils"

type ChatInputProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>

const ChatInput = React.forwardRef<HTMLTextAreaElement, ChatInputProps>(
  ({ className, ...props }, ref) => (
    <Textarea
      autoComplete="off"
      ref={ref}
      name="message"
      className={cn(
        "px-4 py-3 max-h-40 h-full bg-background text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 w-full rounded-md flex items-center resize-none",
        className,
      )}
      {...props}
    />
  ),
)
ChatInput.displayName = "ChatInput"

export { ChatInput }
