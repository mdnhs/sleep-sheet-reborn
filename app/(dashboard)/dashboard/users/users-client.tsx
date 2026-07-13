"use client";

import { useState, useMemo } from "react";
import type { ColumnDef, Updater } from "@tanstack/react-table";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Search, Loader2 } from "lucide-react";

import { useGetUsers } from "@/features/users/api/use-get-users";
import { useGetRoles } from "@/features/roles/api/use-get-roles";
import { useUpdateUserRole } from "@/features/users/api/use-update-user-role";
import { useCreateUser } from "@/features/users/api/use-create-user";

interface StaffRow {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  roleId: string | null;
  createdAt: string;
  assignedRole?: { id: string; name: string } | null;
}

export function UsersClient() {
  const { data: users, isLoading: loadingUsers } = useGetUsers();
  const { data: roles, isLoading: loadingRoles } = useGetRoles();
  const updateRole = useUpdateUserRole();
  const createUser = useCreateUser();

  const [searchQuery, setSearchQuery] = useState("");
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});
  
  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selectedRole, setSelectedRole] = useState("none");

  const safeUsers = useMemo(() => (users ?? []) as StaffRow[], [users]);

  const filteredUsers = useMemo(() => {
    if (!searchQuery) return safeUsers;
    return safeUsers.filter((u) =>
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [safeUsers, searchQuery]);

  const handleRoleChange = (userId: string, roleId: string) => {
    updateRole.mutate({ id: userId, roleId: roleId === "none" ? null : roleId });
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createUser.mutate(
      { 
        name, 
        email, 
        password, 
        roleId: selectedRole === "none" ? null : selectedRole 
      },
      {
        onSuccess: () => {
          setCreateOpen(false);
          setName("");
          setEmail("");
          setPassword("");
          setSelectedRole("none");
        }
      }
    );
  };

  const columns: ColumnDef<StaffRow>[] = [
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
    },
    {
      accessorKey: "email",
      header: "Email",
      cell: ({ row }) => <span>{row.original.email}</span>,
    },
    {
      accessorKey: "role",
      header: "System Role",
      cell: ({ row }) => (
        <Badge variant={row.original.role === "ADMIN" ? "default" : "secondary"}>
          {row.original.role}
        </Badge>
      ),
    },
    {
      id: "assignedRole",
      header: "Assigned Custom Role",
      cell: ({ row }) => {
        const user = row.original;
        if (user.role === "ADMIN") {
          return (
            <span className="text-sm text-muted-foreground italic">
              Admin bypasses custom roles
            </span>
          );
        }
        return (
          <Select
            defaultValue={user.roleId || "none"}
            onValueChange={(val) => handleRoleChange(user.id, val || "none")}
            disabled={updateRole.isPending}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select a role">
                {user.roleId && user.roleId !== "none"
                  ? roles?.find((r) => r.id === user.roleId)?.name || user.assignedRole?.name || user.roleId
                  : "No Custom Role"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No Custom Role</SelectItem>
              {roles?.map((r) => (
                <SelectItem key={r.id} value={r.id}>
                  {r.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      },
    },
  ];

  if (loadingUsers || loadingRoles) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-4 md:pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Staff</h2>
          <p className="text-muted-foreground">
            Manage your team members and assign custom roles. Storefront
            customers live on the Customers page.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add User
          </Button>
        </div>
      </div>

      <div className="flex items-center space-x-2 py-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div>
        <DataTable
          columns={columns}
          data={filteredUsers}
          rowSelection={rowSelection}
          onRowSelectionChange={(updater: Updater<Record<string, boolean>>) => {
            setRowSelection(typeof updater === "function" ? updater(rowSelection) : updater)
          }}
        />
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4 mt-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Name</label>
              <Input
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <Input
                type="email"
                placeholder="john@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Password</label>
              <Input
                type="password"
                placeholder="Min. 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Initial Role (Optional)</label>
              <Select value={selectedRole} onValueChange={(val) => setSelectedRole(val || "none")}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Custom Role (Basic Access)</SelectItem>
                  {roles?.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCreateOpen(false)}
                className="mr-2"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createUser.isPending}>
                Create User
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
