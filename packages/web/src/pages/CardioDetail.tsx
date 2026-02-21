import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../hooks/useRedux';
import { fetchCardioById, clearSelectedCardio } from '../store/cardioSlice';

export function CardioDetail() {
  const { id } = useParams<{ id: string }>();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { selected: activity, status } = useAppSelector((s) => s.cardio);

  useEffect(() => {
    if (id) dispatch(fetchCardioById(id));
    return () => { dispatch(clearSelectedCardio()); };
  }, [id, dispatch]);

  if (status === 'loading' || !activity) {
    return (
      <div className="vf-detail-page">
        <div className="vf-detail-skeleton" aria-hidden="true">
          <div className="vf-skeleton vf-skeleton--hero" />
          <div className="vf-detail-skeleton__body">
            <div className="vf-skeleton vf-skeleton--text vf-skeleton--w60" />
            <div className="vf-skeleton vf-skeleton--text vf-skeleton--w40" />
            <div className="vf-skeleton vf-skeleton--text vf-skeleton--w80" />
          </div>
        </div>
      </div>
    );
  }

  const funStars = '⭐'.repeat(Math.min(activity.funRating, 5));

  return (
    <div className="vf-detail-page">
      <button className="vf-btn vf-btn--ghost vf-btn--sm vf-detail-back" onClick={() => navigate(-1)}>
        ← Back
      </button>

      <div className="vf-detail-card">
        {/* Hero */}
        <div className="vf-detail-hero">
          {activity.imageUrl ? (
            <img src={activity.imageUrl} alt={activity.name} />
          ) : (
            <div className="vf-detail-hero__placeholder">🏃</div>
          )}
        </div>

        {/* Header */}
        <div className="vf-detail-header">
          <h1>{activity.name}</h1>
          <div className="vf-detail-badges">
            <span className="vf-badge vf-badge--brand">{activity.category}</span>
            <span className="vf-badge">{activity.intensityLevel}</span>
          </div>

          {/* Quick Stats */}
          <div className="vf-cardio-stats">
            <div className="vf-cardio-stat">
              <span className="vf-cardio-stat__value">🔥 {activity.caloriesPerHour}</span>
              <span className="vf-cardio-stat__label">Cal / Hour</span>
            </div>
            <div className="vf-cardio-stat">
              <span className="vf-cardio-stat__value">⏱ {activity.durationMin}</span>
              <span className="vf-cardio-stat__label">Minutes</span>
            </div>
            <div className="vf-cardio-stat">
              <span className="vf-cardio-stat__value">{funStars}</span>
              <span className="vf-cardio-stat__label">Fun Rating</span>
            </div>
          </div>
        </div>

        {/* Description */}
        {activity.description && (
          <section className="vf-detail-section">
            <h2>About</h2>
            <p className="vf-detail-text">{activity.description}</p>
          </section>
        )}

        {/* How to Start */}
        {activity.howToStart && (
          <section className="vf-detail-section">
            <h2>How to Start</h2>
            <p className="vf-detail-text">{activity.howToStart}</p>
          </section>
        )}

        {/* Tags */}
        {activity.tags?.length > 0 && (
          <section className="vf-detail-section">
            <h2>Tags</h2>
            <div className="vf-detail-tags">
              {activity.tags.map((tag) => (
                <span key={tag} className="vf-badge">{tag}</span>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
