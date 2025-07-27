import React, { useState, useEffect } from "react";
import api from '../services/api';

const roleColors = {
  admin: "bg-red-100 text-red-700",
  consultant: "bg-black text-white",
  client: "bg-gray-200 text-gray-700",
};

const permissionsData = [
  {
    category: "Client Management",
    items: [
      { name: "View Clients", desc: "Can view client information" },
      { name: "Manage Clients", desc: "Can add, edit, and delete clients" },
    ],
  },
  {
    category: "Invoicing",
    items: [
      { name: "View All Invoices", desc: "Can view all invoices in the system" },
      { name: "Manage Invoices", desc: "Can create, edit, and delete invoices" },
    ],
  },
];

export default function UserRoles() {
  const [tab, setTab] = useState("users");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("All Roles");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // New state for fetched data
  const [users, setUsers] = useState([]);
  const [roleTemplates, setRoleTemplates] = useState({}); // ✅ Changed to object

  // State for form show/hide
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null); // ✅ Added editing state
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "", // ✅ Added password field
    role: "client", // ✅ Default role
    permissions: [] // ✅ Changed to array
  });

  // Fetch users
  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/api/users'); // ✅ Fixed API URL
      console.log('✅ Users loaded:', response.data);
      setUsers(response.data);
    } catch (err) {
      console.error('❌ Error fetching users:', err);
      setError('Failed to load users. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch role templates
  const fetchRoleTemplates = async () => {
    try {
      const response = await api.get('/api/users/meta/role-templates'); // ✅ Fixed API URL
      console.log('✅ Role templates loaded:', response.data);
      setRoleTemplates(response.data || {}); // ✅ Store as object
    } catch (err) {
      console.error('❌ Error fetching role templates:', err);
    }
  };

  // Get all users
  useEffect(() => {
    fetchUsers();
    fetchRoleTemplates();
  }, []);

  const filteredUsers = users.filter(
    (u) =>
      (roleFilter === "All Roles" || u.role === roleFilter.toLowerCase()) &&
      (u.name?.toLowerCase().includes(search.toLowerCase()) ||
        u.email?.toLowerCase().includes(search.toLowerCase()))
  );

  const allRoles = ["All Roles", "admin", "consultant", "client"];

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // ✅ Added edit user function
  const handleEditUser = (user) => {
    setEditingUser(user);
    setForm({
      name: user.name || "",
      email: user.email || "",
      password: "", // Don't show current password for security
      role: user.role || "client",
      permissions: user.permissions || []
    });
    setShowForm(true);
  };

  // ✅ Added delete user function
  const handleDeleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await api.delete(`/api/users/${userId}`);
        console.log('✅ User deleted successfully');
        await fetchUsers(); // Refresh the list
      } catch (err) {
        console.error('❌ Error deleting user:', err);
        alert('Failed to delete user. Please try again.');
      }
    }
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    try {
      // ✅ Validate required fields
      if (!form.name || !form.email || (!editingUser && !form.password)) {
        alert('Please fill in all required fields (Name, Email, Password for new users)');
        return;
      }

      if (editingUser) {
        // ✅ Update existing user
        const updateData = {
          name: form.name,
          email: form.email,
          role: form.role,
          permissions: form.permissions
        };
        
        // Only include password if it's provided
        if (form.password) {
          updateData.password = form.password;
        }

        await api.put(`/api/users/${editingUser._id}`, updateData);
        console.log('✅ User updated successfully');
      } else {
        // ✅ Create new user
        const userData = {
          name: form.name,
          email: form.email,
          password: form.password,
          role: form.role,
          permissions: form.permissions
        };

        await api.post('/api/users', userData);
        console.log('✅ User created successfully');
      }
      
      setShowForm(false);
      setEditingUser(null);
      setForm({
        name: "",
        email: "",
        password: "",
        role: "client",
        permissions: []
      });
      await fetchUsers(); // Refresh users list
    } catch (err) {
      console.error('❌ Error saving user:', err);
      if (err.response?.data?.message) {
        alert(`Failed to save user: ${err.response.data.message}`);
      } else {
        alert('Failed to save user. Please try again.');
      }
    }
  };

  // ✅ Added cancel edit function
  const handleCancelEdit = () => {
    setShowForm(false);
    setEditingUser(null);
    setForm({
      name: "",
      email: "",
      password: "",
      role: "client",
      permissions: []
    });
  };

  if (loading) {
    return <div className="text-center py-8">Loading user roles...</div>;
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-red-600 mb-4">{error}</div>
        <button 
          onClick={fetchUsers}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <div>
          <h2 className="text-2xl font-bold">User Roles</h2>
          <p className="text-gray-500">Manage Admin, Consultant, and Client access levels</p>
        </div>
        <button
          className="bg-black text-white px-5 py-2 rounded-lg font-semibold flex items-center gap-2"
          onClick={() => setShowForm(true)}
        >
          + Add User
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleAddUser}
          className="bg-white p-6 rounded-xl shadow mb-6 grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          <input 
            name="name" 
            value={form.name} 
            onChange={handleChange} 
            placeholder="Name *" 
            className="border p-2 rounded" 
            required 
          />
          <input 
            name="email" 
            value={form.email} 
            onChange={handleChange} 
            placeholder="Email *" 
            className="border p-2 rounded" 
            type="email"
            required 
          />
          <input 
            name="password" 
            value={form.password} 
            onChange={handleChange} 
            placeholder={editingUser ? "Password (leave blank to keep current)" : "Password *"} 
            className="border p-2 rounded" 
            type="password"
            required={!editingUser}
          />
          <select
            name="role"
            value={form.role}
            onChange={handleChange}
            className="border p-2 rounded"
            required
          >
            <option value="client">Client</option>
            <option value="consultant">Consultant</option>
            <option value="admin">Admin</option>
          </select>
          <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded col-span-1 md:col-span-2">
            {editingUser ? 'Update User' : 'Add User'}
          </button>
          <button type="button" onClick={handleCancelEdit} className="col-span-1 md:col-span-2 text-gray-500 mt-2">
            Cancel
          </button>
        </form>
      )}

      {/* Tabs */}
      <div className="flex space-x-2 mb-6">
        {["users", "permissions", "templates"].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-full font-medium ${
              tab === t ? "bg-gray-200" : "bg-gray-100"
            }`}
          >
            {t === "users" && "Users"}
            {t === "permissions" && "Permissions"}
            {t === "templates" && "Role Templates"}
          </button>
        ))}
      </div>

      {/* Only show user list for Users tab */}
      {tab === "users" && (
        <>
          {/* Search and Filter */}
          <div className="flex gap-4 mb-6">
            <input
              type="text"
              placeholder="Search users..."
              className="flex-1 p-3 border rounded-lg bg-gray-100"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <select
              className="p-3 border rounded-lg bg-gray-100"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
            >
              {allRoles.map((role) => (
                <option key={role}>{role.charAt(0).toUpperCase() + role.slice(1)}</option>
              ))}
            </select>
          </div>

          {/* User List */}
          <div className="space-y-4">
            {filteredUsers.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {users.length === 0 ? 'No users found.' : 'No users match your search criteria.'}
              </div>
            ) : (
              filteredUsers.map((user, idx) => (
                <div
                  key={user._id || idx}
                  className="bg-white rounded-xl shadow p-6 border border-gray-200 flex flex-col md:flex-row md:items-center md:justify-between"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-lg">{user.name || 'N/A'}</span>
                      <span className={`px-2 py-1 rounded text-xs font-semibold capitalize ${roleColors[user.role] || 'bg-gray-100 text-gray-700'}`}>
                        {user.role || 'N/A'}
                      </span>
                    </div>
                    <div className="text-gray-500 text-sm">Email</div>
                    <div className="mb-2">{user.email || 'N/A'}</div>
                    <div className="flex gap-8 text-xs text-gray-500">
                      <div>
                        <span className="font-semibold">Created</span>
                        <div>{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}</div>
                      </div>
                      <div>
                        <span className="font-semibold">Permissions</span>
                        <div>{user.permissions?.length || 0} assigned</div>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4 md:mt-0">
                    <button 
                      onClick={() => handleEditUser(user)}
                      className="border rounded-lg px-4 py-2 flex items-center gap-2 hover:bg-gray-100 text-sm"
                    >
                      {/* Black SVG pen icon */}
                      <svg width="18" height="18" fill="black" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M17.657 3.515a3.515 3.515 0 0 1 4.97 4.97l-1.414 1.414-4.97-4.97 1.414-1.414Zm-2.121 2.121-11.314 11.314a2 2 0 0 0-.574 1.06l-1 5a1 1 0 0 0 1.18 1.18l5-1a2 2 0 0 0 1.06-.574l11.314-11.314-4.97-4.97Zm-9.9 13.435 0.707-3.536 2.829 2.829-3.536 0.707Z"/></svg>
                      Edit
                    </button>
                    <button 
                      onClick={() => handleDeleteUser(user._id)}
                      className="border rounded-lg px-4 py-2 flex items-center gap-2 hover:bg-gray-100 text-sm text-red-600 hover:text-red-800"
                    >
                      <span role="img" aria-label="delete">🗑</span>
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}

      {/* Permissions Tab */}
      {tab === "permissions" && (
        <div>
          <p className="text-gray-500 mb-4">Manage system permissions and access controls</p>
          <div className="space-y-8">
            {permissionsData.map((cat, idx) => (
              <div key={idx} className="bg-white rounded-xl p-6 border">
                <div className="font-semibold mb-4">{cat.category}</div>
                <div className="space-y-4">
                  {cat.items.map((item, i) => (
                    <div key={i} className="flex items-center justify-between bg-gray-50 rounded-lg px-6 py-4">
                      <div>
                        <div className="font-medium">{item.name}</div>
                        <div className="text-xs text-gray-500">{item.desc}</div>
                      </div>
                      {/* Professional Toggle Switch */}
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Role Templates Tab */}
      {tab === "templates" && (
        <div>
          <p className="text-gray-500 mb-4">Pre-configured role templates with default permissions</p>
          {Object.keys(roleTemplates).length === 0 ? (
            <div className="text-center py-8 text-gray-500">No role templates found.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {Object.entries(roleTemplates).map(([roleKey, role], idx) => (
                <div key={idx} className="bg-white rounded-xl p-6 border flex flex-col items-start">
                  <div className="flex items-center text-lg font-bold mb-2 text-gray-800">
                    {/* Black and White Icons */}
                    {roleKey === 'admin' ? (
                      <svg className="w-6 h-6 mr-2" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2L2 7v10c0 5.55 3.84 9.74 9 11 5.16-1.26 9-5.45 9-11V7l-10-5zM12 20c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
                        <path d="M12 6c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4z"/>
                      </svg>
                    ) : roleKey === 'consultant' ? (
                      <svg className="w-6 h-6 mr-2" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm-5 14H4v-4h11v4zm0-5H4V9h11v4zm5 5h-4V9h4v9z"/>
                      </svg>
                    ) : (
                      <svg className="w-6 h-6 mr-2" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                      </svg>
                    )}
                    {role.label || roleKey}
                  </div>
                  <div className="text-gray-500 mb-4">{role.description || 'No description available'}</div>
                  <ul className="mb-4 space-y-1">
                    {role.permissions?.map((perm, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <span className="text-green-600">✓</span>
                        <span>{perm.replace(/_/g, ' ')}</span>
                      </li>
                    )) || <li className="text-gray-500">No permissions defined</li>}
                  </ul>
                  <button className="flex items-center gap-2 border rounded-lg px-4 py-2 text-sm hover:bg-gray-100">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.07-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.74,8.87 C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.8,11.69,4.8,12s0.02,0.64,0.07,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.44-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.47-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z"/>
                    </svg>
                    Configure
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}