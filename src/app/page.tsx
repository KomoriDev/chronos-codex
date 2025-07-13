import { LoginForm } from "@/components/login-form"
import { ScenarioCard } from "@/components/scenario-card"
import { createClient } from "@/lib/supabase/server"

export default async function Page() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: scenarios } = await supabase.from("scenarios").select()

  return (
    <>
      <div className="flex flex-col items-center px-4 py-4 md:px-6 md:py-6">
        <h2 className="text-2xl font-bold">👋 Hello</h2>
        <p className="text-sm mt-1">Choose the scenario you like!</p>
        <span className="flex justify-evenly w-full mt-4 gap-4 md:mt-6 md:gap-6">
          {scenarios?.map((scenario) => (
            <ScenarioCard key={scenario.id} scenario={scenario} />
          ))}
        </span>
      </div>
      {!user && (
        <div className="fixed bottom-4 right-4 z-50 p-5 rounded-lg shadow-xl max-w-sm">
          <LoginForm />
        </div>
      )}
    </>

  )
}
