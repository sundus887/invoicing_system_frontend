import { useEffect, useState } from 'react';
import api from '../services/api';

function TasksPage() {
  const [tasks, setTasks] = useState([]);
  const [clients, setClients] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  
  const [form, setForm] = useState({
    title: "",
    description: "",
    dueDate: "",
    priority: "medium",
    status: "pending",
    client: "",
    taskType: "general", // New field for FBR-related tasks
    fbrReference: "", // For FBR-related tasks
    invoiceNumber: "", // For invoice-related tasks
  });

  // Task types for FBR integration
  const taskTypes = [
    "general",
    "fbr_submission",
    "fbr_compliance",
    "invoice_creation",
    "client_communication",
    "document_preparation",
    "tax_filing",
    "audit_preparation",
    "hs_code_assignment",
    "export_documentation"
  ];

  // Fetch tasks from backend
  const fetchTasks = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/api/tasks');
      console.log('✅ Tasks loaded:', response.data);
      setTasks(response.data);
    } catch (err) {
      console.error('❌ Error fetching tasks:', err);
      setError('Failed to load tasks. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch clients for task assignment
  const fetchClients = async () => {
    try {
      const response = await api.get('/api/clients');
      console.log('✅ Clients loaded for tasks:', response.data);
      setClients(response.data);
    } catch (err) {
      console.error('❌ Error fetching clients:', err);
    }
  };

  useEffect(() => {
    fetchTasks();
    fetchClients();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddTask = async (e) => {
    e.preventDefault();
    try {
      console.log('🔄 Adding task:', form);
      
      // Validate required fields
      if (!form.title || !form.dueDate) {
        setError('Please fill in all required fields (Title, Due Date)');
        return;
      }

      const response = await api.post('/api/tasks', form);
      console.log('✅ Task added successfully:', response.data);
      
      setShowForm(false);
      setForm({
        title: "",
        description: "",
        dueDate: "",
        priority: "medium",
        status: "pending",
        client: "",
        taskType: "general",
        fbrReference: "",
        invoiceNumber: "",
      });
      setError(null);
      await fetchTasks();
    } catch (err) {
      console.error('❌ Error adding task:', err);
      setError('Failed to add task. Please try again.');
    }
  };

  const handleUpdateTask = async (taskId, updates) => {
    try {
      const response = await api.put(`/api/tasks/${taskId}`, updates);
      console.log('✅ Task updated successfully:', response.data);
      await fetchTasks();
    } catch (err) {
      console.error('❌ Error updating task:', err);
      setError('Failed to update task. Please try again.');
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Are you sure you want to delete this task?')) {
      return;
    }
    
    try {
      await api.delete(`/api/tasks/${taskId}`);
      console.log('✅ Task deleted successfully');
      await fetchTasks();
    } catch (err) {
      console.error('❌ Error deleting task:', err);
      setError('Failed to delete task. Please try again.');
    }
  };

  const clearForm = () => {
    setShowForm(false);
    setError(null);
    setForm({
      title: "",
      description: "",
      dueDate: "",
      priority: "medium",
      status: "pending",
      client: "",
      taskType: "general",
      fbrReference: "",
      invoiceNumber: "",
    });
  };

  // Filter tasks based on status and priority
  const filteredTasks = tasks.filter(task => {
    const statusMatch = filterStatus === 'all' || task.status === filterStatus;
    const priorityMatch = filterPriority === 'all' || task.priority === filterPriority;
    return statusMatch && priorityMatch;
  });

  // Calculate task statistics
  const taskStats = {
    total: tasks.length,
    pending: tasks.filter(t => t.status === 'pending').length,
    completed: tasks.filter(t => t.status === 'completed').length,
    high: tasks.filter(t => t.priority === 'high').length,
    fbr: tasks.filter(t => t.taskType && t.taskType.includes('fbr')).length,
  };

  if (loading) {
    return <div className="text-center py-8">Loading tasks...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Task Management</h2>
        <button
          className="bg-black text-white px-5 py-2 rounded-lg font-semibold flex items-center gap-2"
          onClick={() => setShowForm(true)}
        >
          <span className="text-xl">+</span> Add Task
        </button>
      </div>

      {/* Task Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow text-center">
          <div className="text-2xl font-bold text-blue-600">{taskStats.total}</div>
          <div className="text-sm text-gray-600">Total Tasks</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow text-center">
          <div className="text-2xl font-bold text-yellow-600">{taskStats.pending}</div>
          <div className="text-sm text-gray-600">Pending</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow text-center">
          <div className="text-2xl font-bold text-green-600">{taskStats.completed}</div>
          <div className="text-sm text-gray-600">Completed</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow text-center">
          <div className="text-2xl font-bold text-red-600">{taskStats.high}</div>
          <div className="text-sm text-gray-600">High Priority</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow text-center">
          <div className="text-2xl font-bold text-purple-600">{taskStats.fbr}</div>
          <div className="text-sm text-gray-600">FBR Related</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="border p-2 rounded"
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="completed">Completed</option>
        </select>
        
        <select
          value={filterPriority}
          onChange={(e) => setFilterPriority(e.target.value)}
          className="border p-2 rounded"
        >
          <option value="all">All Priority</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Add Task Form */}
      {showForm && (
        <form
          onSubmit={handleAddTask}
          className="bg-white p-6 rounded-xl shadow mb-6"
        >
          <h3 className="text-lg font-semibold mb-4">Add New Task</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input 
              name="title" 
              value={form.title} 
              onChange={handleChange} 
              placeholder="Task Title *" 
              className="border p-2 rounded" 
              required 
            />
            
            <select 
              name="taskType" 
              value={form.taskType} 
              onChange={handleChange} 
              className="border p-2 rounded"
            >
              <option value="general">General Task</option>
              <option value="fbr_submission">FBR Submission</option>
              <option value="fbr_compliance">FBR Compliance</option>
              <option value="invoice_creation">Invoice Creation</option>
              <option value="client_communication">Client Communication</option>
              <option value="document_preparation">Document Preparation</option>
              <option value="tax_filing">Tax Filing</option>
              <option value="audit_preparation">Audit Preparation</option>
              <option value="hs_code_assignment">HS Code Assignment</option>
              <option value="export_documentation">Export Documentation</option>
            </select>
            
            <input 
              name="dueDate" 
              type="date" 
              value={form.dueDate} 
              onChange={handleChange} 
              className="border p-2 rounded" 
              required 
            />
            
            <select 
              name="priority" 
              value={form.priority} 
              onChange={handleChange} 
              className="border p-2 rounded"
            >
              <option value="low">Low Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="high">High Priority</option>
            </select>
            
            <select 
              name="client" 
              value={form.client} 
              onChange={handleChange} 
              className="border p-2 rounded"
            >
              <option value="">Select Client (Optional)</option>
              {clients.map(client => (
                <option key={client._id} value={client._id}>
                  {client.companyName}
                </option>
              ))}
            </select>
            
            <select 
              name="status" 
              value={form.status} 
              onChange={handleChange} 
              className="border p-2 rounded"
            >
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
            </select>
          </div>
          
          <div className="mt-4">
            <textarea 
              name="description" 
              value={form.description} 
              onChange={handleChange} 
              placeholder="Task Description" 
              className="border p-2 rounded w-full h-24 resize-none"
            />
          </div>
          
          {/* FBR-specific fields */}
          {(form.taskType === 'fbr_submission' || form.taskType === 'fbr_compliance') && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <input 
                name="fbrReference" 
                value={form.fbrReference} 
                onChange={handleChange} 
                placeholder="FBR Reference Number" 
                className="border p-2 rounded" 
              />
              <input 
                name="invoiceNumber" 
                value={form.invoiceNumber} 
                onChange={handleChange} 
                placeholder="Invoice Number" 
                className="border p-2 rounded" 
              />
            </div>
          )}
          
          <div className="flex gap-2 mt-4">
            <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700">
              Add Task
            </button>
            <button 
              type="button" 
              onClick={clearForm}
              className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Tasks List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Task</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredTasks.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-4 px-4 text-center text-gray-500">
                    No tasks found. Add your first task!
                  </td>
                </tr>
              ) : (
                filteredTasks.map((task) => (
                  <tr key={task._id} className="hover:bg-gray-50">
                    <td className="py-4 px-4">
                      <div>
                        <div className="font-medium text-gray-900">{task.title}</div>
                        {task.description && (
                          <div className="text-sm text-gray-500 truncate max-w-xs">
                            {task.description}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        task.taskType?.includes('fbr') ? 'bg-purple-100 text-purple-800' :
                        task.taskType?.includes('invoice') ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {task.taskType?.replace('_', ' ') || 'general'}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      {task.client?.companyName || '-'}
                    </td>
                    <td className="py-4 px-4">
                      {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '-'}
                    </td>
                    <td className="py-4 px-4">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        task.priority === 'high' ? 'bg-red-100 text-red-800' :
                        task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {task.priority}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <select
                        value={task.status}
                        onChange={(e) => handleUpdateTask(task._id, { status: e.target.value })}
                        className={`px-2 py-1 text-xs rounded-full border-0 ${
                          task.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        <option value="pending">Pending</option>
                        <option value="completed">Completed</option>
                      </select>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleDeleteTask(task._id)}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Information Panel */}
      <div className="mt-8 bg-blue-50 p-4 rounded-lg">
        <h4 className="font-semibold text-blue-800 mb-2">ℹ️ Task Management Information</h4>
        <div className="text-sm text-blue-700 space-y-1">
          <p><strong>FBR Tasks:</strong> Special tasks for FBR submission and compliance tracking</p>
          <p><strong>Invoice Tasks:</strong> Tasks related to invoice creation and processing</p>
          <p><strong>Priority Levels:</strong> High, Medium, Low for task prioritization</p>
          <p><strong>Status Tracking:</strong> Pending and Completed status management</p>
          <p><strong>Client Assignment:</strong> Link tasks to specific clients for better organization</p>
        </div>
      </div>
    </div>
  );
}

export default TasksPage;