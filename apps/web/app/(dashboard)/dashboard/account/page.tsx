import React from "react"

async function AccountPage() {

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold">Account Settings</h1>
        <p className="text-muted-foreground">Manage your profile and account preferences.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-xl border bg-card p-6 text-card-foreground shadow-sm">
          <h2 className="text-lg font-semibold mb-2">Profile Information</h2>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Name: <span className="text-foreground font-medium">{user.name}</span></p>
            <p className="text-sm text-muted-foreground">Email: <span className="text-foreground font-medium">{user.email}</span></p>
            <p className="text-sm text-muted-foreground">Role: <span className="text-foreground font-medium">{user.role}</span></p>
          </div>
        </div>
      </div>
      <div className="flex min-h-[300px] flex-col items-center justify-center rounded-xl bg-muted/50 border border-dashed">
        <p className="text-muted-foreground text-center">
          Additional account settings are under development.
        </p>
      </div>
    </div>
  )
}

export default AccountPage
