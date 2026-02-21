import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../hooks/useRedux';
import {
  fetchRoutines,
  previewRoutine,
  generateRoutine,
  deleteRoutine,
  clearPreview,
  type GenerateRequest,
} from '../store/routinesSlice';
import { FITNESS_GOALS, EQUIPMENT_OPTIONS } from '@vibefit/shared';

const fitnessLevels = ['beginner', 'intermediate', 'advanced'] as const;

export function Routines() {
  const dispatch = useAppDispatch();
  const { list, preview, status, previewStatus, error } = useAppSelector((s) => s.routines);
  const { status: authStatus } = useAppSelector((s) => s.auth);
  const isAuth = authStatus === 'authenticated';

  const [step, setStep] = useState(0); // 0=list, 1=goal, 2=config, 3=preview, 4=saved
  const [goal, setGoal] = useState('');
  const [daysPerWeek, setDaysPerWeek] = useState(4);
  const [sessionDuration, setSessionDuration] = useState(60);
  const [fitnessLevel, setFitnessLevel] = useState('intermediate');
  const [equipment, setEquipment] = useState<string[]>(['barbell', 'dumbbell', 'bodyweight']);

  useEffect(() => {
    if (isAuth && status === 'idle') dispatch(fetchRoutines());
  }, [isAuth, status, dispatch]);

  const toggleEquipment = (eq: string) => {
    setEquipment((prev) => prev.includes(eq) ? prev.filter((e) => e !== eq) : [...prev, eq]);
  };

  const buildRequest = (): GenerateRequest => ({
    goal, daysPerWeek, sessionDurationMin: sessionDuration, fitnessLevel, availableEquipment: equipment,
  });

  const handlePreview = () => {
    if (!goal) return;
    dispatch(previewRoutine(buildRequest()));
    setStep(3);
  };

  const handleSave = () => {
    if (!goal) return;
    dispatch(generateRoutine(buildRequest()));
    setStep(4);
  };

  const handleReset = () => {
    setStep(0);
    setGoal('');
    dispatch(clearPreview());
  };

  const handleDelete = (id: string) => {
    dispatch(deleteRoutine(id));
  };

  // ─── Step 0: Routine list ────────────────────────────────
  if (step === 0) return (
    <div className="routines-page">
      <div className="routines-page__header">
        <div>
          <h1>My Routines</h1>
          <p>Your personalized workout plans</p>
        </div>
        <button className="vf-btn vf-btn--primary" onClick={() => setStep(1)}>
          + Build New Routine
        </button>
      </div>

      {status === 'loading' && (
        <div className="routines-page__loading">
          {[1,2,3].map(i => <div key={i} className="skeleton-card" />)}
        </div>
      )}

      {status === 'loaded' && list.length === 0 && (
        <div className="routines-page__empty">
          <span className="routines-page__empty-emoji">🎯</span>
          <h2>No routines yet</h2>
          <p>Build your first custom routine tailored to your goals</p>
          <button className="vf-btn vf-btn--primary" onClick={() => setStep(1)}>
            Build My First Routine
          </button>
        </div>
      )}

      {status === 'loaded' && list.length > 0 && (
        <div className="routines-page__grid">
          {list.map((r) => (
            <div key={r.id} className="routine-card">
              <div className="routine-card__header">
                <h3 className="routine-card__name">{r.name}</h3>
                <span className={`routine-card__status routine-card__status--${r.status}`}>{r.status}</span>
              </div>
              <div className="routine-card__meta">
                <span className="routine-card__badge">{r.goal}</span>
                <span className="routine-card__badge routine-card__badge--info">{r.fitnessLevel}</span>
              </div>
              <div className="routine-card__stats">
                <span>{r.daysPerWeek} days/week</span>
                <span>{r.sessionDurationMin} min</span>
                <span>Week {r.currentWeek}/{r.totalWeeks}</span>
              </div>
              <div className="routine-card__actions">
                <Link to={`/routines/${r.id}`} className="vf-btn vf-btn--primary vf-btn--sm">View</Link>
                <button className="vf-btn vf-btn--ghost vf-btn--sm" onClick={() => handleDelete(r.id)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {error && <div className="error-message">{error}</div>}
    </div>
  );

  // ─── Step 1: Goal selection ──────────────────────────────
  if (step === 1) return (
    <div className="routines-page">
      <div className="builder__step-header">
        <button className="builder__back" onClick={handleReset}>← Back</button>
        <h2>Choose Your Goal</h2>
        <div className="builder__steps-indicator">
          <span className="builder__dot builder__dot--active" />
          <span className="builder__dot" />
          <span className="builder__dot" />
        </div>
      </div>
      <div className="builder__goals">
        {FITNESS_GOALS.map((g) => (
          <button
            key={g.id}
            className={`builder__goal-card ${goal === g.id ? 'builder__goal-card--active' : ''}`}
            onClick={() => { setGoal(g.id); setStep(2); }}
          >
            <span className="builder__goal-emoji">{g.emoji}</span>
            <span className="builder__goal-label">{g.label}</span>
            <span className="builder__goal-desc">{g.description}</span>
          </button>
        ))}
      </div>
    </div>
  );

  // ─── Step 2: Configuration ───────────────────────────────
  if (step === 2) return (
    <div className="routines-page">
      <div className="builder__step-header">
        <button className="builder__back" onClick={() => setStep(1)}>← Back</button>
        <h2>Customize Your Plan</h2>
        <div className="builder__steps-indicator">
          <span className="builder__dot builder__dot--done" />
          <span className="builder__dot builder__dot--active" />
          <span className="builder__dot" />
        </div>
      </div>

      <div className="builder__form">
        <div className="builder__field">
          <label>Days per Week</label>
          <div className="builder__options">
            {[2,3,4,5,6].map((d) => (
              <button
                key={d}
                className={`builder__opt-btn ${daysPerWeek === d ? 'builder__opt-btn--active' : ''}`}
                onClick={() => setDaysPerWeek(d)}
              >{d} days</button>
            ))}
          </div>
        </div>

        <div className="builder__field">
          <label>Session Duration: <strong>{sessionDuration} min</strong></label>
          <input
            type="range" min="15" max="120" step="15"
            value={sessionDuration}
            onChange={(e) => setSessionDuration(Number(e.target.value))}
            className="builder__range"
          />
          <div className="builder__range-labels">
            <span>15 min</span><span>120 min</span>
          </div>
        </div>

        <div className="builder__field">
          <label>Fitness Level</label>
          <div className="builder__options">
            {fitnessLevels.map((l) => (
              <button
                key={l}
                className={`builder__opt-btn ${fitnessLevel === l ? 'builder__opt-btn--active' : ''}`}
                onClick={() => setFitnessLevel(l)}
              >{l}</button>
            ))}
          </div>
        </div>

        <div className="builder__field">
          <label>Available Equipment</label>
          <div className="builder__equip-grid">
            {EQUIPMENT_OPTIONS.map((eq) => (
              <button
                key={eq.id}
                className={`builder__equip-btn ${equipment.includes(eq.id) ? 'builder__equip-btn--active' : ''}`}
                onClick={() => toggleEquipment(eq.id)}
              >
                <span>{eq.emoji}</span> {eq.label}
              </button>
            ))}
          </div>
        </div>

        <button
          className="vf-btn vf-btn--primary builder__gen-btn"
          onClick={handlePreview}
          disabled={!goal || equipment.length === 0}
        >
          Preview Routine
        </button>
      </div>
    </div>
  );

  // ─── Step 3: Preview ─────────────────────────────────────
  if (step === 3) return (
    <div className="routines-page">
      <div className="builder__step-header">
        <button className="builder__back" onClick={() => setStep(2)}>← Adjust</button>
        <h2>Routine Preview</h2>
        <div className="builder__steps-indicator">
          <span className="builder__dot builder__dot--done" />
          <span className="builder__dot builder__dot--done" />
          <span className="builder__dot builder__dot--active" />
        </div>
      </div>

      {previewStatus === 'loading' && (
        <div className="builder__loading">
          <div className="spinner" />
          <p>Generating your routine...</p>
        </div>
      )}

      {previewStatus === 'loaded' && preview && (
        <>
          <div className="preview__header">
            <h3>{preview.name}</h3>
            <div className="preview__meta">
              <span className="routine-card__badge">{preview.goal}</span>
              <span className="routine-card__badge routine-card__badge--info">{preview.fitnessLevel}</span>
              <span>{preview.daysPerWeek} days/week</span>
              <span>{preview.sessionDurationMin} min/session</span>
            </div>
          </div>

          <div className="preview__days">
            {preview.weeks[0]?.days.map((day) => (
              <div key={day.dayNumber} className="preview__day">
                <h4 className="preview__day-title">
                  Day {day.dayNumber} — {day.focus}
                </h4>
                <div className="preview__exercises">
                  {day.exercises.map((ex) => (
                    <div key={`${ex.exerciseId}-${ex.order}`} className="preview__exercise">
                      <div className="preview__exercise-thumb">
                        {ex.imageUrls && ex.imageUrls.length > 0 ? (
                          <img src={ex.imageUrls[0]} alt={ex.exerciseName} />
                        ) : (
                          <div className="preview__exercise-placeholder">{ex.order}</div>
                        )}
                      </div>
                      <div className="preview__exercise-info">
                        <span className="preview__exercise-name">{ex.exerciseName}</span>
                        <span className="preview__exercise-muscle">{ex.muscleGroup} · {ex.equipment}</span>
                      </div>
                      <div className="preview__exercise-stats">
                        <span className="preview__stat">{ex.sets}×{ex.reps}</span>
                        <span className="preview__rest">{ex.restSeconds}s rest</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="builder__actions">
            <button className="vf-btn vf-btn--ghost" onClick={() => setStep(2)}>← Adjust</button>
            <button className="vf-btn vf-btn--ghost" onClick={handlePreview}>Regenerate</button>
            {isAuth ? (
              <button className="vf-btn vf-btn--primary" onClick={handleSave}>Save Routine</button>
            ) : (
              <Link to="/login" className="vf-btn vf-btn--primary">Log in to Save</Link>
            )}
          </div>
        </>
      )}

      {previewStatus === 'error' && <div className="error-message">{error}</div>}
    </div>
  );

  // ─── Step 4: Saved confirmation ──────────────────────────
  return (
    <div className="routines-page">
      <div className="builder__done">
        <span className="builder__done-emoji">🎉</span>
        <h2>Routine Saved!</h2>
        <p>Your personalized routine has been created and saved.</p>
        <div className="builder__done-actions">
          <button className="vf-btn vf-btn--primary" onClick={handleReset}>View My Routines</button>
          <button className="vf-btn vf-btn--ghost" onClick={() => { dispatch(clearPreview()); setStep(1); }}>
            Build Another
          </button>
        </div>
      </div>
    </div>
  );
}
