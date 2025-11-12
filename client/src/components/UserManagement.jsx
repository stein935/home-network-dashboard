import { useState, useEffect } from 'react';
import { UserPlus, Trash2, Shield, Eye } from 'lucide-react';
import { usersApi } from '../utils/api';
import { useAuth } from '../hooks/useAuth';

export function UserManagement() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);

  const [formData, setFormData] = useState({
    email: '',
    name: '',
    role: 'readonly'
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await usersApi.getAll();
      setUsers(response.data);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    try {
      await usersApi.create(formData);
      setShowAddForm(false);
      setFormData({ email: '', name: '', role: 'readonly' });
      fetchUsers();
    } catch (err) {
      console.error('Error adding user:', err);
      alert(err.response?.data?.error || 'Failed to add user');
    }
  };

  const handleToggleRole = async (userId, currentRole) => {
    const newRole = currentRole === 'admin' ? 'readonly' : 'admin';
    try {
      await usersApi.updateRole(userId, newRole);
      fetchUsers();
    } catch (err) {
      console.error('Error updating user role:', err);
      alert('Failed to update user role');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!confirm('Are you sure you want to remove this user?')) {
      return;
    }

    try {
      await usersApi.delete(userId);
      fetchUsers();
    } catch (err) {
      console.error('Error deleting user:', err);
      alert(err.response?.data?.error || 'Failed to delete user');
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <p className="font-display text-xl uppercase text-accent1">
          Loading Users...
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap justify-between items-center mb-6">
        <h2 className="font-display text-display-sm uppercase text-text w-full sm:w-auto mb-1 sm:mb-0">
          User Management
        </h2>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="btn-brutal-primary flex items-center justify-center gap-2 w-full sm:w-auto"
        >
          <UserPlus size={20} />
          Add User
        </button>
      </div>

      {error && (
        <div className="mb-6 border-3 border-error bg-surface p-4">
          <p className="text-error">{error}</p>
        </div>
      )}

      {showAddForm && (
        <div className="mb-6 border-5 border-border bg-surface p-6 shadow-brutal">
          <h3 className="font-display text-xl uppercase mb-4 text-text">
            Add New User
          </h3>
          <form onSubmit={handleAddUser} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-display uppercase text-sm mb-2 text-text">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="input-brutal w-full"
                  required
                  placeholder="user@example.com"
                />
                <p className="mt-1 text-sm text-text/60">
                  User will be able to login with their Google account using this email
                </p>
              </div>
              <div>
                <label className="block font-display uppercase text-sm mb-2 text-text">
                  Name (Optional)
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input-brutal w-full"
                  placeholder="John Doe"
                />
              </div>
              <div>
                <label className="block font-display uppercase text-sm mb-2 text-text">
                  Role
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="input-brutal w-full"
                >
                  <option value="readonly">Read Only</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>
            <div className="flex gap-4">
              <button type="submit" className="btn-brutal-primary">
                Add User
              </button>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="btn-brutal"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="border-5 border-border bg-surface shadow-brutal overflow-x-auto">
        <table className="w-full">
          <thead className="border-b-3 border-border">
            <tr>
              <th className="text-left p-4 font-display uppercase text-text">Email</th>
              <th className="text-left p-4 font-display uppercase text-text">Name</th>
              <th className="text-left p-4 font-display uppercase text-text">Role</th>
              <th className="text-left p-4 font-display uppercase text-text">Last Login</th>
              <th className="text-right p-4 font-display uppercase text-text">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr
                key={user.id}
                className="border-b border-border/30 last:border-0"
              >
                <td className="p-4 font-body text-text">{user.email}</td>
                <td className="p-4 font-body text-text">{user.name || '-'}</td>
                <td className="p-4">
                  <button
                    onClick={() => handleToggleRole(user.id, user.role)}
                    disabled={user.id === currentUser?.id}
                    className={`flex items-center gap-2 ${
                      user.role === 'admin'
                        ? 'text-accent1'
                        : 'text-text/60'
                    } ${user.id === currentUser?.id ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-80'}`}
                  >
                    {user.role === 'admin' ? <Shield size={16} /> : <Eye size={16} />}
                    <span className="font-display uppercase text-sm">{user.role}</span>
                  </button>
                </td>
                <td className="p-4 font-body text-sm text-text/70">
                  {user.last_login ? new Date(user.last_login).toLocaleDateString() : 'Never'}
                </td>
                <td className="p-4 text-right">
                  <button
                    onClick={() => handleDeleteUser(user.id)}
                    disabled={user.id === currentUser?.id}
                    className={`text-error ${
                      user.id === currentUser?.id
                        ? 'opacity-30 cursor-not-allowed'
                        : 'hover:opacity-80'
                    }`}
                    aria-label="Delete user"
                  >
                    <Trash2 size={20} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default UserManagement;
