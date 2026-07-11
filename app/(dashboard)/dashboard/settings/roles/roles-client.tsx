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
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-4 md:pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Roles & Permissions</h2>
          <p className="text-muted-foreground mt-1">
            Manage custom roles and configure their access levels.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button onClick={handleOpenNew}>
            <Plus className="mr-2 h-4 w-4" />
            Create Role
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* System Admin Role Card */}
        <div className="rounded-xl border bg-card p-6 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <ShieldAlert className="w-24 h-24" />
          </div>
          <h3 className="font-semibold text-xl mb-2 flex items-center gap-2">
            Administrator
            <CheckCircle2 className="w-5 h-5 text-primary" />
          </h3>
          <p className="text-sm text-muted-foreground mb-6">
            System-level role with unrestricted access to all features.
          </p>
          <div className="flex flex-wrap gap-2">
            <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">All Permissions</span>
          </div>
        </div>

        {/* Custom Roles */}
        {roles?.map((role: any) => (
          <div key={role.id} className="rounded-xl border bg-card p-6 shadow-sm flex flex-col">
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-semibold text-xl">{role.name}</h3>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleOpenEdit(role)}>
                  <Edit className="h-4 w-4 text-muted-foreground" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-destructive hover:bg-destructive/10" onClick={() => {
                  if (confirm("Are you sure you want to delete this role?")) {
                    deleteRole.mutate(role.id);
                  }
                }}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Custom role with specific access.
            </p>
            <div className="flex flex-wrap gap-2 mt-auto">
              {role.permissions?.slice(0, 3).map((p: string) => (
                <span key={p} className="px-2.5 py-1 rounded-full text-[10px] font-medium bg-secondary text-secondary-foreground border border-border/50">
                  {p.replace(/_/g, " ")}
                </span>
              ))}
              {role.permissions?.length > 3 && (
                <span className="px-2.5 py-1 rounded-full text-[10px] font-medium bg-muted text-muted-foreground">
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
