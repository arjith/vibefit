import { useEffect, useState, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../hooks/useRedux';
import {
  fetchFeed,
  fetchFollowing,
  fetchFollowers,
  createPost,
  toggleKudos,
  fetchComments,
  addComment,
  searchUsers,
  followUser,
  unfollowUser,
  clearSearch,
  type FeedPost,
  type Comment,
} from '../store/socialSlice';

const POST_TYPE_ICONS: Record<string, string> = {
  workout_complete: '💪',
  pr: '🏆',
  achievement: '⭐',
  streak_milestone: '🔥',
  general: '💬',
};

const POST_TYPE_LABELS: Record<string, string> = {
  workout_complete: 'completed a workout',
  pr: 'set a new PR!',
  achievement: 'earned an achievement',
  streak_milestone: 'hit a streak milestone',
  general: '',
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

function Avatar({ name, url, size = 40 }: { name: string; url: string | null; size?: number }) {
  if (url) {
    return <img src={url} alt={name} className="social-avatar" style={{ width: size, height: size }} />;
  }
  return (
    <div
      className="social-avatar social-avatar--placeholder"
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

// ─── Post Card ───────────────────────────────────────────────
function PostCard({ post }: { post: FeedPost }) {
  const dispatch = useAppDispatch();
  const comments = useAppSelector((s) => s.social.comments[post.id]);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');

  const handleKudos = () => {
    dispatch(toggleKudos({ postId: post.id, hasKudos: post.hasKudos }));
  };

  const handleToggleComments = () => {
    if (!showComments && !comments) {
      dispatch(fetchComments(post.id));
    }
    setShowComments((p) => !p);
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = commentText.trim();
    if (!trimmed) return;
    dispatch(addComment({ postId: post.id, content: trimmed }));
    setCommentText('');
  };

  const typeLabel = POST_TYPE_LABELS[post.type];

  return (
    <div className="social-post">
      <div className="social-post__header">
        <Avatar name={post.userName} url={post.userAvatar} />
        <div className="social-post__user-info">
          <span className="social-post__name">{post.userName}</span>
          {typeLabel && (
            <span className="social-post__type">
              {POST_TYPE_ICONS[post.type]} {typeLabel}
            </span>
          )}
        </div>
        <span className="social-post__time">{timeAgo(post.createdAt)}</span>
      </div>

      {post.content && <p className="social-post__content">{post.content}</p>}

      {post.metadata && Object.keys(post.metadata).length > 0 && (
        <div className="social-post__metadata">
          {'exerciseName' in post.metadata && (
            <span className="social-post__meta-tag">🏋️ {String(post.metadata.exerciseName)}</span>
          )}
          {'weight' in post.metadata && (
            <span className="social-post__meta-tag">⚖️ {String(post.metadata.weight)} kg</span>
          )}
          {'duration' in post.metadata && (
            <span className="social-post__meta-tag">⏱️ {String(post.metadata.duration)} min</span>
          )}
        </div>
      )}

      <div className="social-post__actions">
        <button
          className={`social-action-btn ${post.hasKudos ? 'social-action-btn--active' : ''}`}
          onClick={handleKudos}
        >
          🙌 {post.kudosCount > 0 ? post.kudosCount : ''} Kudos
        </button>
        <button className="social-action-btn" onClick={handleToggleComments}>
          💬 {post.commentCount > 0 ? post.commentCount : ''} Comments
        </button>
      </div>

      {showComments && (
        <div className="social-comments">
          {comments?.map((c: Comment) => (
            <div key={c.id} className="social-comment">
              <Avatar name={c.userName} url={c.userAvatar} size={28} />
              <div className="social-comment__body">
                <span className="social-comment__name">{c.userName}</span>
                <span className="social-comment__text">{c.content}</span>
                <span className="social-comment__time">{timeAgo(c.createdAt)}</span>
              </div>
            </div>
          ))}
          {comments?.length === 0 && <p className="social-comments__empty">No comments yet</p>}
          <form className="social-comment-form" onSubmit={handleAddComment}>
            <input
              type="text"
              placeholder="Write a comment..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              className="social-comment-input"
              maxLength={500}
            />
            <button type="submit" className="vf-btn vf-btn--primary vf-btn--sm" disabled={!commentText.trim()}>
              Post
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

// ─── Compose Box ────────────────────────────────────────────
function ComposeBox() {
  const dispatch = useAppDispatch();
  const [content, setContent] = useState('');
  const [type, setType] = useState<FeedPost['type']>('general');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = content.trim();
    if (!trimmed) return;
    dispatch(createPost({ type, content: trimmed }));
    setContent('');
    setType('general');
  };

  return (
    <form className="social-compose" onSubmit={handleSubmit}>
      <textarea
        className="social-compose__input"
        placeholder="Share an update with your crew..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={3}
        maxLength={500}
      />
      <div className="social-compose__footer">
        <select
          className="social-compose__type"
          value={type}
          onChange={(e) => setType(e.target.value as FeedPost['type'])}
        >
          <option value="general">💬 General</option>
          <option value="workout_complete">💪 Workout</option>
          <option value="pr">🏆 PR</option>
          <option value="achievement">⭐ Achievement</option>
          <option value="streak_milestone">🔥 Streak</option>
        </select>
        <button type="submit" className="vf-btn vf-btn--primary vf-btn--sm" disabled={!content.trim()}>
          Post
        </button>
      </div>
    </form>
  );
}

// ─── User Search (sidebar) ──────────────────────────────────
function UserSearch() {
  const dispatch = useAppDispatch();
  const results = useAppSelector((s) => s.social.searchResults);
  const following = useAppSelector((s) => s.social.following);
  const [query, setQuery] = useState('');

  const followingIds = new Set(following.map((u) => u.userId ?? u.id));

  const handleSearch = useCallback(
    (q: string) => {
      setQuery(q);
      if (q.trim().length >= 2) {
        dispatch(searchUsers(q.trim()));
      } else {
        dispatch(clearSearch());
      }
    },
    [dispatch],
  );

  return (
    <div className="social-search">
      <input
        type="text"
        className="social-search__input"
        placeholder="Search people..."
        value={query}
        onChange={(e) => handleSearch(e.target.value)}
      />
      {results.length > 0 && (
        <ul className="social-search__results">
          {results.map((u) => {
            const uid = u.id ?? u.userId ?? '';
            const isFollowing = followingIds.has(uid);
            return (
              <li key={uid} className="social-search__item">
                <Avatar name={u.name} url={u.avatarUrl} size={32} />
                <span className="social-search__name">{u.name}</span>
                <button
                  className={`vf-btn vf-btn--sm ${isFollowing ? 'vf-btn--ghost' : 'vf-btn--primary'}`}
                  onClick={() => dispatch(isFollowing ? unfollowUser(uid) : followUser(uid))}
                >
                  {isFollowing ? 'Unfollow' : 'Follow'}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

// ─── Sidebar Stats ──────────────────────────────────────────
function SocialStats() {
  const following = useAppSelector((s) => s.social.following);
  const followers = useAppSelector((s) => s.social.followers);

  return (
    <div className="social-stats">
      <div className="social-stat">
        <span className="social-stat__num">{following.length}</span>
        <span className="social-stat__label">Following</span>
      </div>
      <div className="social-stat">
        <span className="social-stat__num">{followers.length}</span>
        <span className="social-stat__label">Followers</span>
      </div>
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────
export function Social() {
  const dispatch = useAppDispatch();
  const { feed, status, error } = useAppSelector((s) => s.social);

  useEffect(() => {
    dispatch(fetchFeed());
    dispatch(fetchFollowing());
    dispatch(fetchFollowers());
  }, [dispatch]);

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">🤝 Social Feed</h1>
          <p className="page-subtitle">See what your crew is up to</p>
        </div>
      </div>

      <div className="social-layout">
        <div className="social-layout__main">
          <ComposeBox />

          {status === 'loading' && <p className="loading-text">Loading feed...</p>}
          {status === 'error' && (
            <div className="error-state">
              <h2>Something went wrong</h2>
              <p>{error}</p>
              <button className="vf-btn vf-btn--primary" onClick={() => dispatch(fetchFeed())}>
                Try again
              </button>
            </div>
          )}

          {status === 'idle' && feed.length === 0 && (
            <div className="social-empty">
              <p className="social-empty__icon">🌱</p>
              <h3>Your feed is empty</h3>
              <p>Follow other athletes or post an update to get started!</p>
            </div>
          )}

          <div className="social-feed">
            {feed.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        </div>

        <aside className="social-layout__sidebar">
          <SocialStats />
          <UserSearch />
        </aside>
      </div>
    </div>
  );
}
