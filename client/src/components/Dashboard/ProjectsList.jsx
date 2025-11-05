/**
 * ProjectsList Component
 * Dashboard view for displaying user's projects with filtering, sorting, and pagination
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

const ProjectsList = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // State management
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProjects, setTotalProjects] = useState(0);

  // Filter and sort state
  const [statusFilter, setStatusFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [sortBy, setSortBy] = useState('recent');

  const itemsPerPage = 9;

  // Fetch projects
  const fetchProjects = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        page: currentPage,
        limit: itemsPerPage,
      };

      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }

      const response = await axios.get('/api/projects', { params });

      if (response.data.success) {
        let fetchedProjects = response.data.data || [];

        // Apply role filter
        if (roleFilter === 'owned') {
          fetchedProjects = fetchedProjects.filter(
            (p) => p.owner._id === user?._id
          );
        } else if (roleFilter === 'member') {
          fetchedProjects = fetchedProjects.filter(
            (p) => p.owner._id !== user?._id
          );
        }

        setProjects(fetchedProjects);
        setTotalPages(response.data.pagination?.pages || 1);
        setTotalProjects(response.data.pagination?.total || fetchedProjects.length);
      }
    } catch (err) {
      console.error('Error fetching projects:', err);
      setError(err.response?.data?.message || 'Failed to load projects');
    } finally {
      setLoading(false);
    }
  }, [currentPage, statusFilter, roleFilter, user?._id]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  // Sort projects
  const sortedProjects = useMemo(() => {
    let sorted = [...projects];

    switch (sortBy) {
      case 'deadline':
        sorted.sort((a, b) => {
          if (!a.deadline) return 1;
          if (!b.deadline) return -1;
          return new Date(a.deadline) - new Date(b.deadline);
        });
        break;
      case 'recent':
        sorted.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
        break;
      case 'name':
        sorted.sort((a, b) => a.name.localeCompare(b.name));
        break;
      default:
        break;
    }

    return sorted;
  }, [projects, sortBy]);

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
      planning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
      active: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      completed: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    };
    return styles[status] || styles.active;
  };

  // Get deadline styling
  const getDeadlineStyle = (days) => {
    if (days === null) return 'text-gray-500 dark:text-gray-400';
    if (days < 0) return 'text-red-600 dark:text-red-400';
    if (days <= 7) return 'text-orange-600 dark:text-orange-400';
    return 'text-green-600 dark:text-green-400';
  };

  // Skeleton loader
  const SkeletonCard = () => (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 animate-pulse">
      <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
      <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-full mb-2"></div>
      <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-5/6 mb-4"></div>
      <div className="h-2 bg-gray-300 dark:bg-gray-700 rounded w-full mb-4"></div>
      <div className="flex justify-between items-center">
        <div className="flex -space-x-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-700"
            ></div>
          ))}
        </div>
        <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded w-20"></div>
      </div>
    </div>
  );

  // Project card component
  const ProjectCard = ({ project }) => {
    const daysRemaining = getDaysRemaining(project.deadline);
    const completionRate = project.taskStats?.completionRate || 0;
    const isOwner = project.owner._id === user?._id;

    return (
      <Link
        to={`/projects/${project._id}`}
        className="block bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 overflow-hidden group"
      >
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-start mb-3">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                {project.name}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {isOwner ? 'Owner' : 'Member'}
              </p>
            </div>
            <span
              className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(
                project.status
              )}`}
            >
              {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
            </span>
          </div>

          {/* Description */}
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 line-clamp-2">
            {project.description || 'No description provided'}
          </p>

          {/* Progress bar */}
          <div className="mb-4">
            <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
              <span>Progress</span>
              <span className="font-medium">{completionRate}%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
              <div
                className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${completionRate}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {project.taskStats?.completed || 0} of {project.taskStats?.total || 0} tasks
            </p>
          </div>

          {/* Deadline */}
          {project.deadline && (
            <div className="mb-4">
              <p className={`text-sm font-medium ${getDeadlineStyle(daysRemaining)}`}>
                {daysRemaining !== null && (
                  <>
                    {daysRemaining < 0 ? (
                      <>⚠️ Overdue by {Math.abs(daysRemaining)} days</>
                    ) : daysRemaining === 0 ? (
                      <>⏰ Due today</>
                    ) : (
                      <>📅 {daysRemaining} days remaining</>
                    )}
                  </>
                )}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Due: {new Date(project.deadline).toLocaleDateString()}
              </p>
            </div>
          )}

          {/* Team members and tags */}
          <div className="flex justify-between items-center pt-4 border-t border-gray-200 dark:border-gray-700">
            {/* Member avatars */}
            <div className="flex -space-x-2">
              {project.owner && (
                <div
                  className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold ring-2 ring-white dark:ring-gray-800"
                  title={project.owner.name}
                >
                  {project.owner.name?.charAt(0).toUpperCase()}
                </div>
              )}
              {project.members?.slice(0, 3).map((member, idx) => (
                <div
                  key={member._id || idx}
                  className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-xs font-bold ring-2 ring-white dark:ring-gray-800"
                  title={member.name}
                >
                  {member.name?.charAt(0).toUpperCase()}
                </div>
              ))}
              {project.memberCount > 4 && (
                <div
                  className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center text-gray-700 dark:text-gray-300 text-xs font-bold ring-2 ring-white dark:ring-gray-800"
                  title={`${project.memberCount - 4} more members`}
                >
                  +{project.memberCount - 4}
                </div>
              )}
            </div>

            {/* Priority badge */}
            {project.priority && (
              <span
                className={`px-2 py-1 rounded text-xs font-medium ${
                  project.priority === 'high'
                    ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                    : project.priority === 'medium'
                    ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'
                    : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                }`}
              >
                {project.priority.charAt(0).toUpperCase() + project.priority.slice(1)}
              </span>
            )}
          </div>

          {/* Tags */}
          {project.tags && project.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {project.tags.slice(0, 3).map((tag, idx) => (
                <span
                  key={idx}
                  className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-xs"
                >
                  #{tag}
                </span>
              ))}
              {project.tags.length > 3 && (
                <span className="px-2 py-1 text-gray-500 dark:text-gray-400 text-xs">
                  +{project.tags.length - 3}
                </span>
              )}
            </div>
          )}
        </div>
      </Link>
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
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
        No projects found
      </h3>
      <p className="text-gray-600 dark:text-gray-400 mb-6 text-center max-w-md">
        {statusFilter !== 'all' || roleFilter !== 'all'
          ? 'Try adjusting your filters or create a new project to get started.'
          : 'Get started by creating your first project.'}
      </p>
      <button
        onClick={() => navigate('/projects/new')}
        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
      >
        Create Project
      </button>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              My Projects
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {totalProjects} {totalProjects === 1 ? 'project' : 'projects'} total
            </p>
          </div>
          <button
            onClick={() => navigate('/projects/new')}
            className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors shadow-lg hover:shadow-xl"
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
            Create Project
          </button>
        </div>
      </div>

      {/* Filters and Sort */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        {/* Status Filter */}
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Status
          </label>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="planning">Planning</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
          </select>
        </div>

        {/* Role Filter */}
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Role
          </label>
          <select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Projects</option>
            <option value="owned">Owned by Me</option>
            <option value="member">Member</option>
          </select>
        </div>

        {/* Sort By */}
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Sort By
          </label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="recent">Most Recent</option>
            <option value="deadline">Deadline</option>
            <option value="name">Name (A-Z)</option>
          </select>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
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
            onClick={fetchProjects}
            className="mt-2 text-sm text-red-600 dark:text-red-400 hover:underline"
          >
            Try again
          </button>
        </div>
      )}

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {loading ? (
          // Skeleton loaders
          <>
            {[...Array(itemsPerPage)].map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </>
        ) : sortedProjects.length > 0 ? (
          // Project cards
          sortedProjects.map((project) => (
            <ProjectCard key={project._id} project={project} />
          ))
        ) : (
          // Empty state
          <EmptyState />
        )}
      </div>

      {/* Pagination */}
      {!loading && sortedProjects.length > 0 && totalPages > 1 && (
        <div className="flex justify-center items-center gap-2">
          <button
            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Previous
          </button>

          <div className="flex gap-2">
            {[...Array(totalPages)].map((_, idx) => {
              const page = idx + 1;
              // Show first, last, current, and adjacent pages
              if (
                page === 1 ||
                page === totalPages ||
                (page >= currentPage - 1 && page <= currentPage + 1)
              ) {
                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-10 h-10 rounded-lg font-medium transition-colors ${
                      currentPage === page
                        ? 'bg-blue-600 text-white'
                        : 'border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    {page}
                  </button>
                );
              } else if (page === currentPage - 2 || page === currentPage + 2) {
                return (
                  <span
                    key={page}
                    className="w-10 h-10 flex items-center justify-center text-gray-500"
                  >
                    ...
                  </span>
                );
              }
              return null;
            })}
          </div>

          <button
            onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default ProjectsList;
