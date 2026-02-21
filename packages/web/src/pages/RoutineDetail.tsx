import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../hooks/useRedux';
import { fetchRoutineById, deleteRoutine, duplicateRoutine, clearSelectedRoutine } from '../store/routinesSlice';

const goalEmojis: Record<string, string> = {
  'muscle-building': '💪',
  strength: '🏋️',
  'weight-loss': '🔥',
  endurance: '🏃',
  flexibility: '🧘',
  'athletic-performance': '⚡',
  'general-fitness': '❤️',
};

function formatGoal(goal: string): string {
  return goal.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

export function RoutineDetail() {
  const { id } = useParams<{ id: string }>();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const routine = useAppSelector((s) => s.routines.selected);
  const [activeWeek, setActiveWeek] = useState(0);

  useEffect(() => {
    if (id) dispatch(fetchRoutineById(id));
    return () => { dispatch(clearSelectedRoutine()); };
  }, [id, dispatch]);

  const handleDelete = () => {
    if (!routine) return;
    if (window.confirm(`Delete "${routine.name}"? This cannot be undone.`)) {
      dispatch(deleteRoutine(routine.id));
      navigate('/routines');
    }
  };

  const handleDuplicate = async () => {
    if (!routine) return;
    const result = await dispatch(duplicateRoutine(routine.id));
    if (duplicateRoutine.fulfilled.match(result)) {
      navigate(`/routines/${(result.payload as any).id}`);
    }
  };

  const handleStartWorkout = () => {
    if (!routine) return;
    const week = activeWeek + 1;
    const day = currentWeekData?.days?.[0]?.dayNumber ?? 1;
    navigate(`/workout/${routine.id}?week=${week}&day=${day}`);
  };

  if (!routine) {
    return (
      <div className="routine-detail">
        <div className="routine-detail__loading">
          <div className="skeleton-card" style={{ height: 120 }} />
          <div className="skeleton-card" style={{ height: 200 }} />
          <div className="skeleton-card" style={{ height: 200 }} />
        </div>
      </div>
    );
  }

  const weeks = routine.weeks ?? [];
  const currentWeekData = weeks[activeWeek];

  return (
    <div className="routine-detail">
      {/* Header */}
      <div className="routine-detail__header">
        <Link to="/routines" className="routine-detail__back">← My Routines</Link>
        <div className="routine-detail__title-row">
          <span className="routine-detail__emoji">{goalEmojis[routine.goal] ?? '🎯'}</span>
          <div>
            <h1>{routine.name}</h1>
            <div className="routine-detail__meta">
              <span className="routine-card__badge">{formatGoal(routine.goal)}</span>
              <span className="routine-card__badge routine-card__badge--info">{routine.fitnessLevel}</span>
              <span className={`routine-card__status routine-card__status--${routine.status}`}>{routine.status}</span>
            </div>
          </div>
        </div>

        <div className="routine-detail__stats">
          <div className="routine-detail__stat">
            <span className="routine-detail__stat-value">{routine.daysPerWeek}</span>
            <span className="routine-detail__stat-label">Days/Week</span>
          </div>
          <div className="routine-detail__stat">
            <span className="routine-detail__stat-value">{routine.sessionDurationMin}</span>
            <span className="routine-detail__stat-label">Min/Session</span>
          </div>
          <div className="routine-detail__stat">
            <span className="routine-detail__stat-value">{routine.currentWeek}/{routine.totalWeeks}</span>
            <span className="routine-detail__stat-label">Current Week</span>
          </div>
        </div>
      </div>

      {/* Week tabs */}
      {weeks.length > 1 && (
        <div className="routine-detail__week-tabs">
          {weeks.map((week, idx) => (
            <button
              key={week.weekNumber}
              className={`routine-detail__week-tab ${idx === activeWeek ? 'active' : ''} ${week.isDeload ? 'deload' : ''}`}
              onClick={() => setActiveWeek(idx)}
            >
              Week {week.weekNumber}
              {week.isDeload && <span className="deload-badge">Deload</span>}
            </button>
          ))}
        </div>
      )}

      {/* Days */}
      {currentWeekData && (
        <div className="routine-detail__days">
          {currentWeekData.days.map((day) => (
            <div key={day.dayNumber} className={`routine-detail__day ${day.completed ? 'completed' : ''}`}>
              <div className="routine-detail__day-header">
                <div>
                  <span className="routine-detail__day-num">Day {day.dayNumber}</span>
                  <span className="routine-detail__day-focus">{day.focus}</span>
                </div>
                {day.completed && <span className="routine-detail__day-check">✓ Done</span>}
              </div>

              <div className="routine-detail__exercises">
                {day.exercises.map((ex) => (
                  <div key={`${ex.exerciseId}-${ex.order}`} className="routine-detail__exercise">
                    <span className="routine-detail__ex-order">{ex.order}</span>
                    <div className="routine-detail__ex-info">
                      <Link to={`/exercises/${ex.exerciseId}`} className="routine-detail__ex-name">
                        {ex.exerciseName || ex.exerciseId}
                      </Link>
                      <div className="routine-detail__ex-prescription">
                        <span>{ex.sets} sets × {ex.reps} reps</span>
                        <span className="routine-detail__ex-rest">{ex.restSeconds}s rest</span>
                        {ex.targetWeight != null && (
                          <span className="routine-detail__ex-weight">+{ex.targetWeight}lb</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="routine-detail__actions">
        <button className="vf-btn vf-btn--primary" onClick={handleStartWorkout}>▶ Start Workout</button>
        <button className="vf-btn vf-btn--ghost" onClick={handleDuplicate}>📋 Duplicate</button>
        <button className="vf-btn vf-btn--ghost vf-btn--danger" onClick={handleDelete}>Delete Routine</button>
      </div>
    </div>
  );
}
