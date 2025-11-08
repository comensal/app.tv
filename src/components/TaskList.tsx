import { useState } from 'react';
import { Check, Trash2, Plus, AlertCircle, Loader } from 'lucide-react';
import { useTasks } from '../hooks/useTasks';
import { type Task } from '../lib/supabase';

interface TaskListProps {
  userId: string;
}

export function TaskList({ userId }: TaskListProps) {
  const { tasks, loading, error, addTask, updateTask, deleteTask } = useTasks(userId);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    setIsAdding(true);
    await addTask(newTaskTitle, newTaskDesc);
    setNewTaskTitle('');
    setNewTaskDesc('');
    setIsAdding(false);
  };

  const handleToggleTask = async (task: Task) => {
    await updateTask(task.id, { completed: !task.completed });
  };

  const handleDeleteTask = async (taskId: string) => {
    await deleteTask(taskId);
  };

  const completedCount = tasks.filter(t => t.completed).length;
  const totalCount = tasks.length;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">My Tasks</h2>
        <p className="text-gray-600 text-sm">
          {completedCount} of {totalCount} completed
        </p>
        <div className="mt-3 h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-300"
            style={{ width: totalCount > 0 ? `${(completedCount / totalCount) * 100}%` : '0%' }}
          />
        </div>
      </div>

      <form onSubmit={handleAddTask} className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Task</h3>
        <div className="space-y-3">
          <input
            type="text"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            placeholder="Task title..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            disabled={isAdding}
          />
          <textarea
            value={newTaskDesc}
            onChange={(e) => setNewTaskDesc(e.target.value)}
            placeholder="Task description (optional)..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition resize-none h-20"
            disabled={isAdding}
          />
          <button
            type="submit"
            disabled={isAdding || !newTaskTitle.trim()}
            className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-semibold py-2 rounded-lg transition duration-200 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isAdding && <Loader className="w-4 h-4 animate-spin" />}
            <Plus className="w-4 h-4" />
            Add Task
          </button>
        </div>
      </form>

      {error && (
        <div className="flex items-gap-2 p-4 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader className="w-6 h-6 animate-spin text-blue-600" />
        </div>
      ) : tasks.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl shadow-sm">
          <p className="text-gray-500">No tasks yet. Create one to get started!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tasks.map(task => (
            <div
              key={task.id}
              className="bg-white rounded-lg shadow-sm p-4 flex items-start gap-3 hover:shadow-md transition"
            >
              <button
                onClick={() => handleToggleTask(task)}
                className={`flex-shrink-0 w-6 h-6 rounded-md border-2 flex items-center justify-center transition ${
                  task.completed
                    ? 'bg-gradient-to-r from-blue-500 to-indigo-600 border-transparent'
                    : 'border-gray-300 hover:border-blue-500'
                }`}
              >
                {task.completed && <Check className="w-4 h-4 text-white" />}
              </button>
              <div className="flex-1 min-w-0">
                <h4 className={`font-semibold transition ${
                  task.completed
                    ? 'text-gray-400 line-through'
                    : 'text-gray-900'
                }`}>
                  {task.title}
                </h4>
                {task.description && (
                  <p className={`text-sm mt-1 transition ${
                    task.completed
                      ? 'text-gray-300'
                      : 'text-gray-600'
                  }`}>
                    {task.description}
                  </p>
                )}
              </div>
              <button
                onClick={() => handleDeleteTask(task.id)}
                className="flex-shrink-0 p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
