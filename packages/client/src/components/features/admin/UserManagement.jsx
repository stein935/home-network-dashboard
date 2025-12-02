import { useState, useEffect } from 'react';
import { UserPlus, Trash2, Shield, Eye } from 'lucide-react';
import { usersApi } from '@utils/api';
import { useAuth } from '@hooks/useAuth';
import { useNotification } from '@hooks/useNotification';
import { Dialog } from '@common/Dialog';

export function UserManagement() {
  const { user: currentUser } = useAuth();
  const { notify, confirm } = useNotification();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);

  const [formData, setFormData] = useState({
    email: '',
    name: '',
    role: 'readonly',
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
      notify.error(err.response?.data?.error || 'Failed to add user');
    }
  };

  const handleToggleRole = async (userId, currentRole) => {
    const newRole = currentRole === 'admin' ? 'readonly' : 'admin';
    try {
      await usersApi.updateRole(userId, newRole);
      fetchUsers();
    } catch (err) {
      console.error('Error updating user role:', err);
      notify.error('Failed to update user role');
    }
  };

  const handleDeleteUser = async (userId) => {
    const confirmed = await confirm({
      title: 'Remove User',
      message:
        'Are you sure you want to remove this user? They will no longer be able to access the application.',
      confirmText: 'Remove',
      confirmVariant: 'danger',
      cancelText: 'Cancel',
    });

    if (!confirmed) return;

    try {
      await usersApi.delete(userId);
      fetchUsers();
    } catch (err) {
      console.error('Error deleting user:', err);
      notify.error(err.response?.data?.error || 'Failed to delete user');
    }
  };

  if (loading) {
    return (
      <div className="py-8 text-center">
        <p className="font-display text-xl uppercase text-accent1">
          Loading Users...
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between">
        <h2 className="mb-1 w-full font-display text-display-sm uppercase text-text sm:mb-0 sm:w-auto">
          User Management
        </h2>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="btn-brutal-primary flex w-full items-center justify-center gap-2 sm:w-auto"
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
        <Dialog
          title="Add New User"
          onClose={() => setShowAddForm(false)}
          footer={
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleAddUser}
                className="btn-brutal-primary flex-1"
              >
                Add User
              </button>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="btn-brutal flex-1"
              >
                Cancel
              </button>
            </div>
          }
        >
          <form onSubmit={handleAddUser} className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="mb-2 block font-display text-sm uppercase text-text">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="input-brutal w-full"
                  required
                  placeholder="user@example.com"
                />
                <p className="mt-1 text-sm text-text/60">
                  User will be able to login with their Google account using
                  this email
                </p>
              </div>
              <div>
                <label className="mb-2 block font-display text-sm uppercase text-text">
                  Name (Optional)
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="input-brutal w-full"
                  placeholder="John Doe"
                />
              </div>
              <div>
                <label className="mb-2 block font-display text-sm uppercase text-text">
                  Role
                </label>
                <select
                  value={formData.role}
                  onChange={(e) =>
                    setFormData({ ...formData, role: e.target.value })
                  }
                  className="input-brutal w-full"
                >
                  <option value="readonly">Read Only</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>
          </form>
        </Dialog>
      )}

      <div className="overflow-x-auto">
        <table className="admin">
          <thead>
            <tr>
              <th>Email</th>
              <th>Name</th>
              <th>Role</th>
              <th>Last Login</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td>{user.email}</td>
                <td>{user.name || '-'}</td>
                <td>
                  <button
                    onClick={() => handleToggleRole(user.id, user.role)}
                    disabled={user.id === currentUser?.id}
                    className={`flex items-center gap-2 border-3 border-border px-2 py-1 ${
                      user.role === 'admin' ? 'text-accent1' : 'text-text/60'
                    } ${user.id === currentUser?.id ? 'cursor-not-allowed opacity-50' : 'hover:border-accent1 hover:opacity-80'}`}
                  >
                    {user.role === 'admin' ? (
                      <Shield size={16} />
                    ) : (
                      <Eye size={16} />
                    )}
                    <span className="font-display text-sm uppercase">
                      {user.role}
                    </span>
                  </button>
                </td>
                <td>
                  {user.last_login
                    ? new Date(user.last_login).toLocaleDateString()
                    : 'Never'}
                </td>
                <td>
                  <button
                    onClick={() => handleDeleteUser(user.id)}
                    disabled={user.id === currentUser?.id}
                    className={`text-error ${
                      user.id === currentUser?.id
                        ? 'cursor-not-allowed opacity-30'
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
