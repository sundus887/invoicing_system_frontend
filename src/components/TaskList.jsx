// src/components/TaskList.jsx
import React, { useState } from "react";

const TaskList = () => {
  const [tasks, setTasks] = useState([
    "Follow up with Client A",
    "Send invoice to Client B",
    "Review invoice INV003",
  ]);
  const [newTask, setNewTask] = useState("");

  const addTask = () => {
    if (newTask.trim()) {
      setTasks([...tasks, newTask]);
      setNewTask("");
    }
  };

  const removeTask = (index) => {
    setTasks(tasks.filter((_, i) => i !== index));
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow">
      <h3 className="text-lg font-semibold mb-4">Pending Tasks</h3>
      <ul className="list-disc pl-6 space-y-2 text-gray-700">
        {tasks.map((task, index) => (
          <li key={index} className="flex justify-between items-center">
            {task}
            <button
              className="text-red-500 ml-2"
              onClick={() => removeTask(index)}
            >
              Delete
            </button>
          </li>
        ))}
      </ul>
      <div className="mt-4 flex">
        <input
          type="text"
          className="border p-2 rounded flex-1"
          placeholder="Add new task"
          value={newTask}
          onChange={e => setNewTask(e.target.value)}
        />
        <button
          className="bg-indigo-600 text-white px-4 py-2 rounded ml-2"
          onClick={addTask}
        >
          Add
        </button>
      </div>
    </div>
  );
};

export default TaskList;
