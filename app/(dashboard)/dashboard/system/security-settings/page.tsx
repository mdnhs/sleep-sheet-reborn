import React from "react"
import { getCurrentUser } from "@/lib/is-authenticated"
import { redirect } from "next/navigation"

async function ComingSoonPage() {
  const user = await getCurrentUser()
  if (!user || (user.role !== "ADMIN" && user.role !== "MODERATOR")) {
    redirect("/")
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <div className="flex min-h-[400px] flex-col items-center justify-center rounded-xl bg-muted/50 border border-dashed">
        <h1 className="text-2xl font-bold">Security Settings</h1>
        <p className="text-muted-foreground text-center">
          This feature is currently under development.
        </p>
      </div>
    </div>
  )
}

export default ComingSoonPage
