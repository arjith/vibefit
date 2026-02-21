import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../hooks/useRedux';
import { fetchExerciseById, clearSelected } from '../store/exercisesSlice';

export function ExerciseDetail() {
  const { id } = useParams<{ id: string }>();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { selected: exercise, status } = useAppSelector((s) => s.exercises);

  useEffect(() => {
    if (id) dispatch(fetchExerciseById(id));
    return () => { dispatch(clearSelected()); };
  }, [id, dispatch]);

  if (status === 'loading' || !exercise) {
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

  return (
    <div className="vf-detail-page">
      <button className="vf-btn vf-btn--ghost vf-btn--sm vf-detail-back" onClick={() => navigate(-1)}>
        ← Back
      </button>

      <div className="vf-detail-card">
        {/* Hero Image */}
        <div className="vf-detail-hero">
          {exercise.imageUrls?.[0] ? (
            <img src={exercise.imageUrls[0]} alt={exercise.name} />
          ) : (
            <div className="vf-detail-hero__placeholder">💪</div>
          )}
        </div>

        {/* Header */}
        <div className="vf-detail-header">
          <h1>{exercise.name}</h1>
          <div className="vf-detail-badges">
            <span className="vf-badge vf-badge--brand">{exercise.muscleGroup}</span>
            <span className="vf-badge">{exercise.equipment}</span>
            <span className="vf-badge">{exercise.difficulty}</span>
          </div>
          {exercise.secondaryMuscles?.length > 0 && (
            <p className="vf-text--muted">
              Also targets: {exercise.secondaryMuscles.join(', ')}
            </p>
          )}
        </div>

        {/* Instructions */}
        {exercise.instructions?.length > 0 && (
          <section className="vf-detail-section">
            <h2>Instructions</h2>
            <ol className="vf-detail-steps">
              {exercise.instructions.map((step, i) => (
                <li key={i}>
                  <span className="vf-detail-step-num">{i + 1}</span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </section>
        )}

        {/* Tips */}
        {exercise.tips?.length > 0 && (
          <section className="vf-detail-section">
            <h2>Pro Tips</h2>
            <ul className="vf-detail-tips">
              {exercise.tips.map((tip, i) => (
                <li key={i}>💡 {tip}</li>
              ))}
            </ul>
          </section>
        )}

        {/* Tags */}
        {exercise.tags?.length > 0 && (
          <section className="vf-detail-section">
            <h2>Tags</h2>
            <div className="vf-detail-tags">
              {exercise.tags.map((tag) => (
                <span key={tag} className="vf-badge">{tag}</span>
              ))}
            </div>
          </section>
        )}

        {/* Image Gallery */}
        {exercise.imageUrls?.length > 1 && (
          <section className="vf-detail-section">
            <h2>Gallery</h2>
            <div className="vf-detail-gallery">
              {exercise.imageUrls.slice(1).map((url, i) => (
                <img key={i} src={url} alt={`${exercise.name} view ${i + 2}`} loading="lazy" />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
