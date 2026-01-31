import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaTrash, FaCalendarAlt, FaUser } from 'react-icons/fa';

// Helper to calculate progress
const calculateProgress = (tasks) => {
  if (!tasks || tasks.length === 0) return 0;
  const completedTasks = tasks.filter(task => task.status === 'Completed').length;
  return Math.round((completedTasks / tasks.length) * 100);
};

const ProjectListItem = ({ project, userInfo, onDelete }) => {
  const navigate = useNavigate();

  // --- Robust Ownership Check ---
  // This handles cases where project.owner is populated (an object) OR just an ID string
  const ownerId = project.owner?._id || project.owner;
  const userId = userInfo?._id;
  
  // We use toString() to ensure we are comparing "String" vs "String"
  // This fixes issues where one might be a MongoDB ObjectId
  const isOwner = userId && ownerId && ownerId.toString() === userId.toString();

  const progress = calculateProgress(project.tasks);

  const handleViewClick = () => {
    if (project._id) {
      navigate(`/project/${project._id}`);
    }
  };

  const handleDeleteClick = (e) => {
    e.stopPropagation(); // Prevents clicking the card background
    // Double confirmation is handled by the parent or here? The original code had it here.
    // The parent (OngoingProjectsScreen) also had a confirm check. 
    // The passed `onDelete` function in the parent ALREADY has a window.confirm check.
    // Let's rely on the passed handler, or do we want the confirm here?
    // In the original code: 
    // Child: if(confirm) onDelete(id)
    // Parent: deleteHandler(id) { if(confirm) dispatch... }
    // This looks like DOUBLE confirmation. I will keep it as is to match original behavior, but it's worth noting.
    // Wait, let's look at the original code carefully:
    // Child: if (window.confirm...) { onDelete(project._id); }
    // Parent: const deleteHandler = (id) => { if (window.confirm...) { dispatch... } }
    // Yes, that is a double confirm. I will remove the confirm check from the Child to improve UX.
    // The parent handler handles the confirmation logic.
    onDelete(project._id);
  };

  return (
    <div className="project-list-item">
      <div className="project-info">
        <Link to={`/project/${project._id}`} className="project-name-link">
          {project.name}
        </Link>
        <div className="project-metadata-capsules">
          {project.dueDate && (
            <span className="metadata-capsule">
              <FaCalendarAlt /> Due: {new Date(project.dueDate).toLocaleDateString()}
            </span>
          )}
          {project.owner && (
            <span className="metadata-capsule">
              <FaUser /> {project.owner.name}
            </span>
          )}
           <span className="metadata-capsule">
             {project.status || 'Active'}
           </span>
        </div>
      </div>
      
      <div className="project-progress">
        <div className="progress-bar-container">
           <div 
             className="progress-bar-fill"
             style={{ width: `${progress}%` }} 
           />
        </div>
        <div style={{ fontSize: '0.8rem', marginTop: '5px', textAlign: 'right', color: '#86868B' }}>
            {progress}% Complete
        </div>
      </div>

      <div className="project-footer">
        <div className="project-team-avatars">
           {project.team && project.team.members && project.team.members.slice(0, 3).map(member => (
             <div key={member._id} className="member-avatar" title={member.name}>
                {member.name ? member.name.charAt(0).toUpperCase() : '?'}
             </div>
           ))}
           {project.team && project.team.members && project.team.members.length > 3 && (
              <div className="member-avatar-more">
                +{project.team.members.length - 3}
              </div>
           )}
        </div>
        
        <div className="project-actions">
          <button 
            className="btn-view-project" 
            onClick={handleViewClick}
            type="button"
          >
            View
          </button>

          {/* Conditional Rendering: Only show if user owns the project */}
          {isOwner ? (
            <button 
                className="btn-delete-project" 
                onClick={handleDeleteClick}
                title="Delete Project"
            >
              <FaTrash />
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default ProjectListItem;
