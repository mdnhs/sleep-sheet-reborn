import React from "react"
import { getCurrentUser } from "@/lib/is-authenticated"
import { redirect } from "next/navigation"

async function NotificationsPage() {
  const user = await getCurrentUser()
  if (!user || (user.role !== "ADMIN" && user.role !== "MODERATOR")) {
    redirect("/")
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold">Notifications</h1>
        <p className="text-muted-foreground">Stay updated with the latest activities and alerts.</p>
      </div>
      <div className="flex min-h-[400px] flex-col items-center justify-center rounded-xl bg-muted/50 border border-dashed">
        <h2 className="text-xl font-semibold mb-2">No new notifications</h2>
        <p className="text-muted-foreground text-center">
          When you receive alerts, they will appear here.
        </p>
      </div>
    </div>
  )
}

export default NotificationsPage
