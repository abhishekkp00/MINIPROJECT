import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import TaskList from '../components/Tasks/TaskList';

/**
 * ProjectDetails Component
 * Displays project details with integrated TaskList
 */
const ProjectDetails = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch project details
  useEffect(() => {
    const fetchProject = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`/api/projects/${projectId}`);
        if (response.data.success) {
          setProject(response.data.data);
        }
      } catch (err) {
        console.error('Error fetching project:', err);
        setError(err.response?.data?.message || 'Failed to load project');
      } finally {
        setLoading(false);
      }
    };

    fetchProject();
  }, [projectId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading project...</p>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {error || 'Project not found'}
          </h2>
          <button
            onClick={() => navigate('/dashboard')}
            className="mt-4 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
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
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              Back to Projects
            </button>
          </div>
        </div>
      </header>

      {/* Project Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {project.name}
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                {project.description || 'No description'}
              </p>
              
              {/* Project Meta */}
              <div className="flex flex-wrap gap-3">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  project.status === 'completed' 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                    : project.status === 'active'
                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
                    : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
                }`}>
                  {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                </span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  project.priority === 'high'
                    ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                    : project.priority === 'medium'
                    ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
                    : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                }`}>
                  {project.priority.charAt(0).toUpperCase() + project.priority.slice(1)} Priority
                </span>
                {project.deadline && (
                  <span className="px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                    Due: {new Date(project.deadline).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>

            {/* Project Stats */}
            <div className="flex gap-4">
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 text-center min-w-[100px]">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {project.taskStats?.total || 0}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Total Tasks</div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 text-center min-w-[100px]">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {project.taskStats?.completed || 0}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Completed</div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 text-center min-w-[100px]">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {project.memberCount || project.members?.length || 0}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Members</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - Task List */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <TaskList projectId={projectId} />
      </div>
    </div>
  );
};

export default ProjectDetails;
