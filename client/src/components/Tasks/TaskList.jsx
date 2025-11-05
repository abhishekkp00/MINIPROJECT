/**
 * TaskList Component
 * Displays tasks for a project with filtering, sorting, and drag-and-drop
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const TaskList = ({ projectId, onTaskClick, onAddTask }) => {
  const navigate = useNavigate();
  const params = useParams();
  const activeProjectId = projectId || params.projectId;

  // State management
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter and sort state
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [assigneeFilter, setAssigneeFilter] = useState('all');
  const [sortBy, setSortBy] = useState('dueDate');

  // Drag state
  const [draggedTask, setDraggedTask] = useState(null);

  // Fetch tasks
  const fetchTasks = useCallback(async () => {
    if (!activeProjectId) return;

    try {
      setLoading(true);
      setError(null);

      const response = await axios.get(`/api/projects/${activeProjectId}/tasks`);

      if (response.data.success) {
        setTasks(response.data.data || []);
      }
    } catch (err) {
      console.error('Error fetching tasks:', err);
      setError(err.response?.data?.message || 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  }, [activeProjectId]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // Get unique assignees for filter
  const uniqueAssignees = useMemo(() => {
    const assignees = new Map();
    tasks.forEach((task) => {
      if (task.assignedTo) {
        assignees.set(task.assignedTo._id, task.assignedTo);
      }
    });
    return Array.from(assignees.values());
  }, [tasks]);

  // Filter tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      // Status filter
      if (statusFilter !== 'all' && task.status !== statusFilter) {
        return false;
      }

      // Priority filter
      if (priorityFilter !== 'all' && task.priority !== priorityFilter) {
        return false;
      }

      // Assignee filter
      if (assigneeFilter !== 'all') {
        if (assigneeFilter === 'unassigned' && task.assignedTo) {
          return false;
        }
        if (assigneeFilter !== 'unassigned' && task.assignedTo?._id !== assigneeFilter) {
          return false;
        }
      }

      return true;
    });
  }, [tasks, statusFilter, priorityFilter, assigneeFilter]);

  // Sort tasks
  const sortedTasks = useMemo(() => {
    let sorted = [...filteredTasks];

    switch (sortBy) {
      case 'dueDate':
        sorted.sort((a, b) => {
          if (!a.deadline) return 1;
          if (!b.deadline) return -1;
          return new Date(a.deadline) - new Date(b.deadline);
        });
        break;
      case 'priority': {
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        sorted.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
        break;
      }
      case 'status': {
        const statusOrder = { todo: 0, 'in-progress': 1, review: 2, completed: 3 };
        sorted.sort((a, b) => statusOrder[a.status] - statusOrder[b.status]);
        break;
      }
      default:
        break;
    }

    return sorted;
  }, [filteredTasks, sortBy]);

  // Calculate days remaining
  const getDaysRemaining = (deadline) => {
    if (!deadline) return null;
    const now = new Date();
    const end = new Date(deadline);
    const diff = end - now;
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days;
  };

  // Get status badge styling
  const getStatusBadge = (status) => {
    const styles = {
      todo: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
      'in-progress': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      review: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
      completed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    };
    return styles[status] || styles.todo;
  };

  // Get priority badge styling
  const getPriorityBadge = (priority) => {
    const styles = {
      low: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
      medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
      high: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
    };
    return styles[priority] || styles.medium;
  };

  // Get deadline styling
  const getDeadlineStyle = (days) => {
    if (days === null) return 'text-gray-500 dark:text-gray-400';
    if (days < 0) return 'text-red-600 dark:text-red-400';
    if (days <= 3) return 'text-orange-600 dark:text-orange-400';
    return 'text-green-600 dark:text-green-400';
  };

  // Format status display
  const formatStatus = (status) => {
    const labels = {
      todo: 'To Do',
      'in-progress': 'In Progress',
      review: 'Review',
      completed: 'Completed',
    };
    return labels[status] || status;
  };

  // Drag and drop handlers
  const handleDragStart = (e, task) => {
    setDraggedTask(task);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e, newStatus) => {
    e.preventDefault();

    if (!draggedTask || draggedTask.status === newStatus) {
      setDraggedTask(null);
      return;
    }

    try {
      // Optimistic update
      setTasks((prevTasks) =>
        prevTasks.map((task) =>
          task._id === draggedTask._id ? { ...task, status: newStatus } : task
        )
      );

      // API call
      await axios.put(`/api/tasks/${draggedTask._id}/status`, { status: newStatus });
    } catch (err) {
      console.error('Error updating task status:', err);
      // Revert on error
      fetchTasks();
    } finally {
      setDraggedTask(null);
    }
  };

  // Handle task click
  const handleTaskClick = (task) => {
    if (onTaskClick) {
      onTaskClick(task);
    } else {
      navigate(`/tasks/${task._id}`);
    }
  };

  // Skeleton loader
  const SkeletonCard = () => (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm animate-pulse">
      <div className="flex justify-between items-start mb-3">
        <div className="h-5 bg-gray-300 dark:bg-gray-700 rounded w-3/4"></div>
        <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded w-16"></div>
      </div>
      <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-full mb-2"></div>
      <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-5/6 mb-3"></div>
      <div className="flex justify-between items-center">
        <div className="h-8 w-8 bg-gray-300 dark:bg-gray-700 rounded-full"></div>
        <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded w-20"></div>
      </div>
    </div>
  );

  // Task card component
  const TaskCard = ({ task }) => {
    const daysRemaining = getDaysRemaining(task.deadline);

    return (
      <div
        draggable
        onDragStart={(e) => handleDragStart(e, task)}
        onClick={() => handleTaskClick(task)}
        className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer border-l-4 border-transparent hover:border-blue-500 dark:hover:border-blue-400 group"
      >
        {/* Header */}
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-1 flex-1">
            {task.title}
          </h3>
          <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${getStatusBadge(task.status)}`}>
            {formatStatus(task.status)}
          </span>
        </div>

        {/* Description */}
        {task.description && (
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-3 line-clamp-2">
            {task.description}
          </p>
        )}

        {/* Footer */}
        <div className="flex justify-between items-center pt-3 border-t border-gray-100 dark:border-gray-700">
          {/* Assignee */}
          <div className="flex items-center gap-2">
            {task.assignedTo ? (
              <>
                <div
                  className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold ring-2 ring-white dark:ring-gray-800"
                  title={task.assignedTo.name}
                >
                  {task.assignedTo.name?.charAt(0).toUpperCase()}
                </div>
                <span className="text-xs text-gray-600 dark:text-gray-400 hidden sm:block">
                  {task.assignedTo.name}
                </span>
              </>
            ) : (
              <span className="text-xs text-gray-400 dark:text-gray-500 italic">
                Unassigned
              </span>
            )}
          </div>

          {/* Priority and Deadline */}
          <div className="flex items-center gap-2">
            <span className={`px-2 py-1 rounded text-xs font-medium ${getPriorityBadge(task.priority)}`}>
              {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
            </span>
            {task.deadline && (
              <span className={`text-xs font-medium ${getDeadlineStyle(daysRemaining)}`}>
                {daysRemaining !== null && (
                  <>
                    {daysRemaining < 0 ? (
                      <>⚠️ {Math.abs(daysRemaining)}d</>
                    ) : daysRemaining === 0 ? (
                      <>⏰ Today</>
                    ) : (
                      <>{daysRemaining}d</>
                    )}
                  </>
                )}
              </span>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Empty state
  const EmptyState = () => (
    <div className="col-span-full flex flex-col items-center justify-center py-12">
      <div className="w-24 h-24 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
        <svg
          className="w-12 h-12 text-gray-400 dark:text-gray-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
          />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
        No tasks found
      </h3>
      <p className="text-gray-600 dark:text-gray-400 mb-6 text-center max-w-md">
        {statusFilter !== 'all' || priorityFilter !== 'all' || assigneeFilter !== 'all'
          ? 'Try adjusting your filters or create a new task.'
          : 'Get started by adding your first task to this project.'}
      </p>
      {onAddTask && (
        <button
          onClick={onAddTask}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
        >
          Add Task
        </button>
      )}
    </div>
  );

  // Status columns for Kanban view
  const statusColumns = [
    { id: 'todo', label: 'To Do', color: 'gray' },
    { id: 'in-progress', label: 'In Progress', color: 'blue' },
    { id: 'review', label: 'Review', color: 'purple' },
    { id: 'completed', label: 'Completed', color: 'green' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Tasks</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {sortedTasks.length} {sortedTasks.length === 1 ? 'task' : 'tasks'}
            {filteredTasks.length !== tasks.length && ` (${tasks.length} total)`}
          </p>
        </div>
        {onAddTask && (
          <button
            onClick={onAddTask}
            className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors shadow-lg hover:shadow-xl"
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Add Task
          </button>
        )}
      </div>

      {/* Filters and Sort */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Status Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Status
          </label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="todo">To Do</option>
            <option value="in-progress">In Progress</option>
            <option value="review">Review</option>
            <option value="completed">Completed</option>
          </select>
        </div>

        {/* Priority Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Priority
          </label>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Priorities</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>

        {/* Assignee Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Assignee
          </label>
          <select
            value={assigneeFilter}
            onChange={(e) => setAssigneeFilter(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Assignees</option>
            <option value="unassigned">Unassigned</option>
            {uniqueAssignees.map((assignee) => (
              <option key={assignee._id} value={assignee._id}>
                {assignee.name}
              </option>
            ))}
          </select>
        </div>

        {/* Sort By */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Sort By
          </label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="dueDate">Due Date</option>
            <option value="priority">Priority</option>
            <option value="status">Status</option>
          </select>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="flex items-center">
            <svg
              className="w-5 h-5 text-red-600 dark:text-red-400 mr-2"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            <p className="text-red-800 dark:text-red-300">{error}</p>
          </div>
          <button
            onClick={fetchTasks}
            className="mt-2 text-sm text-red-600 dark:text-red-400 hover:underline"
          >
            Try again
          </button>
        </div>
      )}

      {/* Kanban Board View */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {statusColumns.map((column) => {
          const columnTasks = sortedTasks.filter((task) => task.status === column.id);

          return (
            <div
              key={column.id}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, column.id)}
              className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 min-h-[300px]"
            >
              {/* Column Header */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <span
                    className={`w-3 h-3 rounded-full bg-${column.color}-500`}
                    style={{
                      backgroundColor:
                        column.color === 'gray'
                          ? '#6b7280'
                          : column.color === 'blue'
                          ? '#3b82f6'
                          : column.color === 'purple'
                          ? '#a855f7'
                          : '#10b981',
                    }}
                  ></span>
                  {column.label}
                </h3>
                <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                  {columnTasks.length}
                </span>
              </div>

              {/* Column Tasks */}
              <div className="space-y-3">
                {loading ? (
                  <>
                    <SkeletonCard />
                    <SkeletonCard />
                  </>
                ) : columnTasks.length > 0 ? (
                  columnTasks.map((task) => <TaskCard key={task._id} task={task} />)
                ) : (
                  <div className="text-center py-8 text-gray-400 dark:text-gray-500 text-sm">
                    No tasks
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State (when no tasks at all) */}
      {!loading && tasks.length === 0 && <EmptyState />}
    </div>
  );
};

export default TaskList;
