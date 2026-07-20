"use client";

import { useState } from "react";
import { Plus, Edit, Trash2, CheckCircle2, ShieldAlert } from "lucide-react";
import { useGetRoles } from "@/features/roles/api/use-get-roles";
import { useCreateRole } from "@/features/roles/api/use-create-role";
import { useUpdateRole } from "@/features/roles/api/use-update-role";
import { useDeleteRole } from "@/features/roles/api/use-delete-role";
import { PERMISSION_GROUPS } from "@/lib/permissions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function RolesClient() {
  const { data: roles, isLoading } = useGetRoles();
  const createRole = useCreateRole();
  const deleteRole = useDeleteRole();

  const [isOpen, setIsOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<any>(null);

  // Form State
  const [name, setName] = useState("");
  const [permissions, setPermissions] = useState<string[]>([]);

  const handleOpenNew = () => {
    setEditingRole(null);
    setName("");
    setPermissions([]);
    setIsOpen(true);
  };

  const handleOpenEdit = (role: any) => {
    setEditingRole(role);
    setName(role.name);
    setPermissions(role.permissions || []);
    setIsOpen(true);
  };

  const handleTogglePermission = (id: string, checked: boolean) => {
    if (checked) {
      setPermissions((prev) => [...prev, id]);
    } else {
      setPermissions((prev) => prev.filter((p) => p !== id));
    }
  };

  const updateRole = useUpdateRole(editingRole?.id);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (editingRole) {
      updateRole.mutate({ name, permissions }, {
        onSuccess: () => setIsOpen(false)
      });
    } else {
      createRole.mutate({ name, permissions }, {
        onSuccess: () => setIsOpen(false)
      });
    }
  };

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-4 md:pt-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Roles & Permissions</h1>
          <p className="text-muted-foreground text-sm">
            Manage custom roles and configure their access levels
          </p>
        </div>
        <Button onClick={handleOpenNew} className="gap-2 text-white bg-slate-900 hover:bg-slate-800 dark:bg-indigo-600 dark:hover:bg-indigo-700 whitespace-nowrap rounded-full px-5 h-9 text-xs font-semibold">
          <Plus className="h-4 w-4" />
          Create Role
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* System Admin Role Card */}
        <div className="rounded-3xl bg-white dark:bg-card p-6 border-none shadow-none flex flex-col justify-between space-y-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <ShieldAlert className="w-24 h-24" />
          </div>
          <div>
            <h3 className="font-bold text-xl mb-1 flex items-center gap-2">
              Administrator
              <CheckCircle2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </h3>
            <p className="text-xs text-muted-foreground">
              System-level role with unrestricted access to all features.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 pt-2">
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border-none">All Permissions</span>
          </div>
        </div>

        {/* Custom Roles */}
        {roles?.map((role: any) => (
          <div key={role.id} className="rounded-3xl bg-white dark:bg-card p-6 border-none shadow-none flex flex-col justify-between space-y-4">
            <div>
              <div className="flex justify-between items-start mb-1">
                <h3 className="font-bold text-xl">{role.name}</h3>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => handleOpenEdit(role)}>
                    <Edit className="h-4 w-4 text-muted-foreground" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:text-destructive hover:bg-destructive/10" onClick={() => {
                    if (confirm("Are you sure you want to delete this role?")) {
                      deleteRole.mutate(role.id);
                    }
                  }}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Custom role with specific access.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 pt-2">
              {role.permissions?.slice(0, 3).map((p: string) => (
                <span key={p} className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-none">
                  {p.replace(/_/g, " ")}
                </span>
              ))}
              {role.permissions?.length > 3 && (
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-500 border-none">
                  +{role.permissions.length - 3} more
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingRole ? "Edit Role" : "Create New Role"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6 mt-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Role Name</label>
              <Input
                placeholder="e.g. Cashier"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-4">
              <label className="text-sm font-medium">Permissions</label>
              <div className="grid md:grid-cols-2 gap-6">
                {PERMISSION_GROUPS.map((group) => (
                  <div key={group.label} className="space-y-3">
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      {group.label}
                    </h4>
                    {group.permissions.map((p) => (
                      <div key={p.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={p.id}
                          checked={permissions.includes(p.id)}
                          onCheckedChange={(checked) => handleTogglePermission(p.id, checked as boolean)}
                        />
                        <label
                          htmlFor={p.id}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                        >
                          {p.label}
                        </label>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t">
              <Button type="button" variant="outline" className="mr-2" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createRole.isPending || updateRole.isPending}>
                {editingRole ? "Save Changes" : "Create Role"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
