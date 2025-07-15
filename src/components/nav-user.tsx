"use client"

import { User } from "@supabase/supabase-js"
import {
  IconDotsVertical,
  IconLogin,
  IconLogout,
  IconUserCircle,
} from "@tabler/icons-react"
import { useRouter } from "next/navigation"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { createClient } from "@/lib/supabase/client"

export function NavUser({ user }: { user: User | null }) {
  const { isMobile } = useSidebar()
  const router = useRouter()

  const supabase = createClient()

  const handleLogin = async () => router.push("/auth/sign-in")
  const handleLogout = async () => await supabase.auth.signOut()

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg grayscale">
                <AvatarImage src={user ? user.user_metadata.avatar_url : ""} alt={user ? user.user_metadata.username : "Visitor"} />
                <AvatarFallback className="rounded-lg">CN</AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{user ? user.user_metadata.username : "Visitor"}</span>
                <span className="text-muted-foreground truncate text-xs">
                  {user ? user.email : "Log in for the best experience"}
                </span>
              </div>
              <IconDotsVertical className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src={user ? user.user_metadata.avatar_url : ""} alt={user ? user.user_metadata.username : "Visitor"} />
                  <AvatarFallback className="rounded-lg">CN</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{user ? user.user_metadata.username : "Visitor"}</span>
                  <span className="text-muted-foreground truncate text-xs">
                    {user ? user.email : "Log in for the best experience"}
                  </span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              { user && (
                <DropdownMenuItem>
                  <IconUserCircle />
                  Account
                </DropdownMenuItem>
              )}
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={user ? handleLogout : handleLogin}>
              { user ? <IconLogout /> : <IconLogin /> }
              { user ? "Log out" : "Log in"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
