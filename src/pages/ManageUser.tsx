import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Search, Trash2 } from "lucide-react";
import { toast } from "react-toastify";
import { useAuth } from "@/context/AuthContext";
import DeleteUserDialog from "@/user/DeleteUserDialog";

// Importing your User API
import { getAllUsers, updateUser, deleteUser as apiDeleteUser } from "../api/userApi";

interface User {
  userId: number;
  username: string;
  email: string;
  role: string;
}

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);

  const { user } = useAuth();
  const isAdmin = user?.role === "Admin";

  // --------------------------------------------
  // ✅ CSV DOWNLOAD FUNCTION
  // --------------------------------------------
  const downloadCSV = (jsonData: any[], filename = "users.csv") => {
    if (!jsonData || jsonData.length === 0) {
      toast.error("No user data available to download!");
      return;
    }

    const headers = Object.keys(jsonData[0]);
    const csvRows: string[] = [];

    csvRows.push(headers.join(","));

    jsonData.forEach((item) => {
      const values = headers.map((header) => `"${item[header] ?? ""}"`);
      csvRows.push(values.join(","));
    });

    const blob = new Blob([csvRows.join("\n")], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();

    window.URL.revokeObjectURL(url);
  };

  // Fetch all users from backend
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const data = await getAllUsers();
        setUsers(data);
      } catch (err) {
        console.error("Error fetching users:", err);
        setError("Failed to load users.");
        toast.error("Failed to load users.");
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  // Update user role through backend
  const updateRole = async (user: User, newRole: string) => {
    try {
      const updatedPayload = {
        username: user.username,
        email: user.email,
        role: newRole,
      };
      
      
      await updateUser(user.userId, updatedPayload);

      setUsers((prev) =>
        prev.map((u) => (u.userId === user.userId ? { ...u, role: newRole } : u))
      );

      toast.success("User role updated!");
    } catch (err) {
      console.error("Error updating user:", err);
      toast.error("Failed to update user role.");
    }
  };

  // Delete user (backend)
  const handleDeleteUser = async (id: number) => {
    try {
      await apiDeleteUser(id);
      setUsers((prev) => prev.filter((u) => u.userId !== id));
      toast.success("User deleted successfully!");
    } catch (err) {
      console.error("Error deleting user:", err);
      toast.error("Failed to delete user.");
    }
  };

  // Filtered results
  const filteredUsers = users.filter(
    (u) =>
      u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-2 space-y-2">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">User Management</h1>
        <p className="text-muted-foreground">Manage application users</p>
      </div>

      {/* Search + CSV Download */}
      <div className="flex items-center gap-3 sm:justify-between">
        <div className="relative w-full sm:w-1/3">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>

        {/* Only Admin can download */}
        {isAdmin && (
          <Button
            onClick={() =>
              downloadCSV(
                filteredUsers.map((u) => ({
                  username: u.username,
                  email: u.email,
                  role: u.role,
                })),
                "users.csv"
              )
            }
          >
            Download CSV
          </Button>
        )}
      </div>

      {/* Loading */}
      {loading && (
        <div className="text-center text-muted-foreground">Loading users...</div>
      )}

      {/* Error */}
      {error && (
        <div className="text-center text-destructive">{error}</div>
      )}

      {/* Users Table */}
      {!loading && !error && (
        <div className="rounded-lg border border-border bg-card shadow-sm overflow-hidden">
          <table className="w-full text-sm text-foreground">
            <thead className="bg-muted/40 text-left">
              <tr>
                <th className="p-4 font-semibold">Username</th>
                <th className="p-4 font-semibold">Email</th>
                <th className="p-4 font-semibold">Role</th>
                {isAdmin && <th className="p-4 font-semibold text-center">Actions</th>}
              </tr>
            </thead>

            <tbody>
              {filteredUsers.length > 0 ? (
                filteredUsers.map((u) => (
                  <tr
                    key={u.userId}
                    className="border-t border-border hover:bg-muted/20 transition-colors"
                  >
                    <td className="p-4 font-medium">{u.username}</td>
                    <td className="p-4">{u.email}</td>

                    <td className="p-4">
                      {isAdmin ? (
                        <select
                          value={u.role}
                          onChange={(e) =>
                            updateRole(u, e.target.value)
                          }
                          className="border border-border rounded-md bg-background px-2 py-1"
                        >
                          <option>User</option>
                          <option>Engineer</option>
                          <option>Operator</option>
                          <option>Admin</option>
                        </select>
                      ) : (
                        u.role
                      )}
                    </td>

                    {isAdmin && (
                      <td className="p-4 flex justify-center gap-2">
                        <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        // Prevent admin from deleting themselves
                        if (u.email === user?.email) {
                          toast.error("You cannot delete your own account!");
                          return;
                        }

                        // Prevent deleting other admins except specific email
                        if (u.role === "Admin" && u.email !== "admin.example.com") {
                          toast.error("You can only delete the admin with email admin.example.com");
                          return;
                        }

                        // Allow delete
                        setSelectedUser(u);
                        setShowDeleteDialog(true);
                      }}
                      className="flex items-center gap-1"
                    >
                      <Trash2 className="h-4 w-4" /> Delete
                    </Button>
                      </td>
                    )}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="text-center p-6 text-muted-foreground">
                    No users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {showDeleteDialog && selectedUser && (
        <DeleteUserDialog
          open={showDeleteDialog}
          onClose={() => setShowDeleteDialog(false)}
          user={selectedUser}
          onDeleted={(id) =>
            setUsers((prev) => prev.filter((u) => u.userId !== id))
          }
        />
      )}
    </div>
  );
}
