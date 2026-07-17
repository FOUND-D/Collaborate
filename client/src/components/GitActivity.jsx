import React, { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaGithub, FaExternalLinkAlt, FaCodeBranch, FaUserCircle } from 'react-icons/fa';
import api from '../utils/api';
import { BACKEND_URL } from '../config/runtime';
import './GitActivity.css';

// -------------------------------------------------------
// Relative time helper
// -------------------------------------------------------
const relativeTime = (dateStr) => {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 2592000) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(dateStr).toLocaleDateString();
};

// -------------------------------------------------------
// Single Commit Row
// -------------------------------------------------------
const CommitItem = ({ commit, isLast }) => {
  const { collaborateUser, githubAuthor, message, shortSha, sha, htmlUrl, authoredAt } = commit;

  // Split message into subject and body
  const [subject, ...bodyLines] = message.split('\n');
  const body = bodyLines.join('\n').trim();

  // Resolve avatar
  const avatarContent = (() => {
    if (collaborateUser?.profileImage) {
      const src = collaborateUser.profileImage.startsWith('data:image')
        ? collaborateUser.profileImage
        : `${BACKEND_URL}${collaborateUser.profileImage}`;
      return <img src={src} alt={collaborateUser.name} />;
    }
    if (githubAuthor?.avatarUrl) {
      return <img src={githubAuthor.avatarUrl} alt={githubAuthor.name} />;
    }
    // Initial fallback
    const initial = (collaborateUser?.name || githubAuthor?.name || '?').charAt(0).toUpperCase();
    return initial;
  })();

  return (
    <div className="commit-item">
      <div className="commit-avatar-col">
        <div className="commit-avatar">{avatarContent}</div>
        {!isLast && <div className="commit-timeline-line" />}
      </div>

      <div className="commit-body">
        <div className="commit-author-row">
          {collaborateUser ? (
            <Link
              to={`/profile/${collaborateUser.id}`}
              className="commit-author-name"
              title="View Collaborate profile"
            >
              {collaborateUser.name}
            </Link>
          ) : (
            <span className="commit-author-name">{githubAuthor?.name || 'Unknown'}</span>
          )}

          {collaborateUser ? (
            <span className="commit-badge-collaborate">Collaborate</span>
          ) : (
            <span className="commit-badge-github">GitHub</span>
          )}

          <span className="commit-time">{relativeTime(authoredAt)}</span>
        </div>

        <div className="commit-message">{subject}</div>
        {body && <div className="commit-message-full">{body}</div>}

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.4rem' }}>
          <a
            href={htmlUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="commit-sha-link"
            title="View commit on GitHub"
          >
            <FaCodeBranch size={10} />
            {shortSha}
          </a>
          {githubAuthor?.login && (
            <a
              href={`https://github.com/${githubAuthor.login}`}
              target="_blank"
              rel="noopener noreferrer"
              className="commit-sha-link"
              title="GitHub profile"
            >
              <FaGithub size={10} />
              {githubAuthor.login}
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

// -------------------------------------------------------
// Repo Link / Update Form
// -------------------------------------------------------
const RepoLinkForm = ({ teamId, existingRepo, isOwner, onLinked }) => {
  const [repoInput, setRepoInput] = useState(existingRepo || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(!existingRepo);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!repoInput.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const { data } = await api.put(`/api/teams/${teamId}/github`, {
        repoPath: repoInput.trim(),
      });
      onLinked(data);
      setShowForm(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to link repository');
    } finally {
      setLoading(false);
    }
  };

  if (existingRepo && !showForm) {
    return (
      <div className="github-repo-header">
        <div className="github-repo-info">
          <FaGithub className="github-repo-icon" />
          <div>
            <div className="github-repo-name">{existingRepo}</div>
            <a
              href={`https://github.com/${existingRepo}`}
              target="_blank"
              rel="noopener noreferrer"
              className="github-repo-link-anchor"
            >
              github.com/{existingRepo} <FaExternalLinkAlt size={9} />
            </a>
          </div>
        </div>
        {isOwner && (
          <button
            className="github-repo-change-btn"
            type="button"
            onClick={() => setShowForm(true)}
          >
            Change
          </button>
        )}
      </div>
    );
  }

  if (!isOwner && !existingRepo) {
    return (
      <div className="github-link-panel">
        <div className="github-link-icon">
          <FaGithub />
        </div>
        <div className="github-link-title">No Repository Linked</div>
        <p className="github-link-sub">
          The team owner hasn't linked a GitHub repository yet.
        </p>
      </div>
    );
  }

  return (
    <div className="github-link-panel">
      <div className="github-link-icon">
        <FaGithub />
      </div>
      <div className="github-link-title">
        {existingRepo ? 'Change Repository' : 'Link a GitHub Repository'}
      </div>
      <p className="github-link-sub">
        Enter the repository path (e.g. <code style={{ color: 'var(--accent-color)' }}>owner/repo-name</code>) or paste a full GitHub URL. The repository must be public.
      </p>

      {error && <div className="git-error-box" style={{ marginBottom: '1rem', width: '100%', maxWidth: 480 }}>{error}</div>}

      <form className="github-link-form" onSubmit={handleSubmit}>
        <input
          className="github-repo-input"
          placeholder="e.g. facebook/react"
          value={repoInput}
          onChange={(e) => setRepoInput(e.target.value)}
          disabled={loading}
          spellCheck={false}
          autoComplete="off"
        />
        <button
          type="submit"
          className="github-link-btn"
          disabled={loading || !repoInput.trim()}
        >
          {loading ? 'Linking…' : existingRepo ? 'Update' : 'Link Repository'}
        </button>
        {existingRepo && (
          <button
            type="button"
            className="github-repo-change-btn"
            onClick={() => { setShowForm(false); setRepoInput(existingRepo); }}
          >
            Cancel
          </button>
        )}
      </form>
    </div>
  );
};

// -------------------------------------------------------
// Main GitActivity Component
// -------------------------------------------------------
const GitActivity = ({ team, userInfo }) => {
  const isOwner = team?.owner?._id === userInfo?._id || team?.owner?.id === userInfo?._id;
  const [currentTeam, setCurrentTeam] = useState(team);
  const [commits, setCommits] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingCommits, setLoadingCommits] = useState(false);
  const [commitsError, setCommitsError] = useState(null);
  const [loadedOnce, setLoadedOnce] = useState(false);

  const repoLinked = Boolean(currentTeam?.githubRepo || currentTeam?.github_repo);
  const repoPath = currentTeam?.githubRepo || currentTeam?.github_repo;

  const fetchCommits = useCallback(async (pageNum = 1, append = false) => {
    if (!repoLinked) return;
    setLoadingCommits(true);
    setCommitsError(null);
    try {
      const { data } = await api.get(`/api/teams/${team._id}/commits?page=${pageNum}&per_page=20`);
      const newCommits = data.commits || [];
      setCommits(prev => append ? [...prev, ...newCommits] : newCommits);
      setHasMore(newCommits.length === 20);
      setLoadedOnce(true);
    } catch (err) {
      setCommitsError(err.response?.data?.message || 'Failed to load commits');
    } finally {
      setLoadingCommits(false);
    }
  }, [team._id, repoLinked]);

  // Auto-load commits when repo is linked
  useEffect(() => {
    if (repoLinked && !loadedOnce) {
      fetchCommits(1, false);
    }
  }, [repoLinked, loadedOnce, fetchCommits]);

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchCommits(nextPage, true);
  };

  const handleRepoLinked = (updatedTeam) => {
    setCurrentTeam(updatedTeam);
    setCommits([]);
    setPage(1);
    setLoadedOnce(false);
    setHasMore(true);
  };

  // Stats
  const collaborateCount = commits.filter(c => c.collaborateUser).length;
  const githubOnlyCount = commits.length - collaborateCount;

  return (
    <div>
      <RepoLinkForm
        teamId={team._id}
        existingRepo={repoPath}
        isOwner={isOwner}
        onLinked={handleRepoLinked}
      />

      {repoLinked && (
        <>
          {loadedOnce && commits.length > 0 && (
            <div className="git-stats-row">
              <div className="git-stat-chip">
                <FaCodeBranch size={11} />
                <span>{commits.length}</span> commits shown
              </div>
              <div className="git-stat-chip">
                <FaUserCircle size={11} />
                <span>{collaborateCount}</span> matched to profiles
              </div>
              {githubOnlyCount > 0 && (
                <div className="git-stat-chip">
                  <FaGithub size={11} />
                  <span>{githubOnlyCount}</span> external GitHub users
                </div>
              )}
            </div>
          )}

          {commitsError && (
            <div className="git-error-box">{commitsError}</div>
          )}

          {loadingCommits && commits.length === 0 ? (
            <div className="git-loading-row">
              <div className="git-spinner" />
              Loading commits from GitHub…
            </div>
          ) : commits.length === 0 && loadedOnce ? (
            <div className="commit-empty-state">No commits found in this repository.</div>
          ) : (
            <>
              <div className="commit-feed">
                {commits.map((commit, idx) => (
                  <CommitItem
                    key={commit.sha}
                    commit={commit}
                    isLast={idx === commits.length - 1}
                  />
                ))}
              </div>

              {loadingCommits && commits.length > 0 && (
                <div className="git-loading-row" style={{ justifyContent: 'center' }}>
                  <div className="git-spinner" />
                  Loading more…
                </div>
              )}

              {!loadingCommits && hasMore && (
                <div className="commit-load-more">
                  <button className="commit-load-more-btn" onClick={handleLoadMore}>
                    Load more commits
                  </button>
                </div>
              )}

              {!hasMore && commits.length > 0 && (
                <div className="commit-empty-state" style={{ paddingTop: '1rem' }}>
                  All commits loaded
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
};

export default GitActivity;
