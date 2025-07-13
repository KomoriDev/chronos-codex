import { AppSidebar } from "@/components/app-sidebar"
import { LoginForm } from "@/components/login-form"
import { SiteHeader } from "@/components/site-header"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { createClient } from "@/lib/supabase/server"

export default async function Page() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">

            </div>
          </div>
        </div>
      </SidebarInset>

      {!user && (
        <div className="fixed bottom-4 right-4 z-50 p-5 rounded-lg shadow-xl max-w-sm">
          <LoginForm />
        </div>
      )}
    </SidebarProvider>
  )
}
