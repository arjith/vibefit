import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../hooks/useRedux';
import { previewRoutine, generateRoutine, clearPreview, type GenerateRequest } from '../store/routinesSlice';
import { FITNESS_GOALS, EQUIPMENT_OPTIONS, EQUIPMENT_PRESETS } from '@vibefit/shared';

const STEPS = ['Goal', 'Schedule', 'Equipment', 'Level', 'Preview'] as const;

export function RoutineBuilder() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { preview, previewStatus, error } = useAppSelector((s) => s.routines);

  const [step, setStep] = useState(0);
  const [form, setForm] = useState<GenerateRequest>({
    goal: '',
    daysPerWeek: 4,
    sessionDurationMin: 45,
    fitnessLevel: 'beginner',
    availableEquipment: [],
    totalWeeks: 4,
  });

  const canAdvance = () => {
    switch (step) {
      case 0: return form.goal !== '';
      case 1: return true;
      case 2: return form.availableEquipment.length > 0;
      case 3: return true;
      default: return false;
    }
  };

  const handleNext = async () => {
    if (step < 3) {
      setStep(step + 1);
    } else if (step === 3) {
      // Generate preview
      dispatch(previewRoutine(form));
      setStep(4);
    }
  };

  const handleBack = () => {
    if (step === 4) {
      dispatch(clearPreview());
    }
    setStep(Math.max(0, step - 1));
  };

  const handleConfirm = async () => {
    const result = await dispatch(generateRoutine(form));
    if (generateRoutine.fulfilled.match(result)) {
      navigate('/routines');
    }
  };

  const toggleEquipment = (id: string) => {
    setForm((prev) => ({
      ...prev,
      availableEquipment: prev.availableEquipment.includes(id)
        ? prev.availableEquipment.filter((e) => e !== id)
        : [...prev.availableEquipment, id],
    }));
  };

  const applyPreset = (preset: keyof typeof EQUIPMENT_PRESETS) => {
    setForm((prev) => ({ ...prev, availableEquipment: [...EQUIPMENT_PRESETS[preset]] }));
  };

  return (
    <div className="routine-builder">
      {/* Progress bar */}
      <div className="wizard-progress">
        {STEPS.map((label, i) => (
          <div key={label} className={`wizard-step ${i < step ? 'done' : ''} ${i === step ? 'active' : ''}`}>
            <div className="wizard-dot">{i < step ? '✓' : i + 1}</div>
            <span className="wizard-label">{label}</span>
          </div>
        ))}
      </div>

      <div className="wizard-body">
        {/* Step 0: Goal */}
        {step === 0 && (
          <div className="wizard-panel">
            <h2>What's your fitness goal?</h2>
            <p className="wizard-subtitle">Choose the goal that best matches what you want to achieve</p>
            <div className="goal-grid">
              {FITNESS_GOALS.map((g) => (
                <button
                  key={g.id}
                  className={`goal-card ${form.goal === g.id ? 'selected' : ''}`}
                  onClick={() => setForm({ ...form, goal: g.id })}
                >
                  <span className="goal-emoji">{g.emoji}</span>
                  <strong>{g.label}</strong>
                  <span className="goal-desc">{g.description}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 1: Schedule */}
        {step === 1 && (
          <div className="wizard-panel">
            <h2>Set your schedule</h2>
            <p className="wizard-subtitle">How often and how long can you work out?</p>

            <div className="schedule-fields">
              <div className="field-group">
                <label>Days per week</label>
                <div className="days-buttons">
                  {[2, 3, 4, 5, 6].map((d) => (
                    <button
                      key={d}
                      className={`day-btn ${form.daysPerWeek === d ? 'selected' : ''}`}
                      onClick={() => setForm({ ...form, daysPerWeek: d })}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              <div className="field-group">
                <label>Session duration: <strong>{form.sessionDurationMin} min</strong></label>
                <input
                  type="range"
                  min={15}
                  max={120}
                  step={5}
                  value={form.sessionDurationMin}
                  onChange={(e) => setForm({ ...form, sessionDurationMin: Number(e.target.value) })}
                  className="duration-slider"
                />
                <div className="slider-labels">
                  <span>15 min</span>
                  <span>120 min</span>
                </div>
              </div>

              <div className="field-group">
                <label>Total weeks</label>
                <div className="days-buttons">
                  {[4, 8, 12].map((w) => (
                    <button
                      key={w}
                      className={`day-btn ${form.totalWeeks === w ? 'selected' : ''}`}
                      onClick={() => setForm({ ...form, totalWeeks: w })}
                    >
                      {w}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Equipment */}
        {step === 2 && (
          <div className="wizard-panel">
            <h2>Available equipment</h2>
            <p className="wizard-subtitle">Select what you have access to</p>

            <div className="preset-row">
              <button className="preset-btn" onClick={() => applyPreset('gym')}>🏢 Full Gym</button>
              <button className="preset-btn" onClick={() => applyPreset('home')}>🏠 Home</button>
              <button className="preset-btn" onClick={() => applyPreset('travel')}>✈️ Travel</button>
            </div>

            <div className="equipment-grid">
              {EQUIPMENT_OPTIONS.map((eq) => (
                <button
                  key={eq.id}
                  className={`equipment-card ${form.availableEquipment.includes(eq.id) ? 'selected' : ''}`}
                  onClick={() => toggleEquipment(eq.id)}
                >
                  <span className="eq-emoji">{eq.emoji}</span>
                  <span>{eq.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Fitness Level */}
        {step === 3 && (
          <div className="wizard-panel">
            <h2>Your fitness level</h2>
            <p className="wizard-subtitle">Be honest — this adjusts exercise difficulty and progression</p>

            <div className="level-grid">
              {(['beginner', 'intermediate', 'advanced'] as const).map((level) => (
                <button
                  key={level}
                  className={`level-card ${form.fitnessLevel === level ? 'selected' : ''}`}
                  onClick={() => setForm({ ...form, fitnessLevel: level })}
                >
                  <strong>{level.charAt(0).toUpperCase() + level.slice(1)}</strong>
                  <span className="level-desc">
                    {level === 'beginner' && 'New to training or returning after a long break'}
                    {level === 'intermediate' && '6+ months of consistent training'}
                    {level === 'advanced' && '2+ years of serious training experience'}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 4: Preview */}
        {step === 4 && (
          <div className="wizard-panel">
            <h2>Your routine preview</h2>
            {previewStatus === 'loading' && (
              <div className="preview-loading">
                <div className="spinner" />
                <p>Generating your personalized routine...</p>
              </div>
            )}
            {previewStatus === 'error' && (
              <div className="preview-error">
                <p>{error || 'Something went wrong'}</p>
                <button onClick={() => dispatch(previewRoutine(form))}>Retry</button>
              </div>
            )}
            {previewStatus === 'loaded' && preview && (
              <div className="preview-content">
                <h3>{preview.name}</h3>
                <div className="preview-meta">
                  <span>{preview.daysPerWeek} days/week</span>
                  <span>{preview.sessionDurationMin} min</span>
                  <span>{preview.totalWeeks} weeks</span>
                  <span>{preview.fitnessLevel}</span>
                </div>

                {/* Show week 1 days */}
                <div className="preview-week">
                  <h4>Week 1</h4>
                  {preview.weeks[0]?.days.map((day) => (
                    <div key={day.dayNumber} className="preview-day">
                      <div className="preview-day-header">
                        <span className="day-num">Day {day.dayNumber}</span>
                        <span className="day-focus">{day.focus}</span>
                      </div>
                      <div className="preview-exercises">
                        {day.exercises.map((ex) => (
                          <div key={ex.order} className="preview-exercise">
                            <div className="preview-ex-img">
                              {ex.imageUrls?.[0] ? (
                                <img src={ex.imageUrls[0]} alt={ex.exerciseName} />
                              ) : (
                                <div className="preview-ex-placeholder">🏋️</div>
                              )}
                            </div>
                            <div className="preview-ex-info">
                              <strong>{ex.exerciseName}</strong>
                              <span className="preview-ex-detail">
                                {ex.sets}×{ex.reps} • {ex.restSeconds}s rest
                                {ex.targetWeight != null && ` • +${ex.targetWeight}lb`}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {preview.totalWeeks > 1 && (
                  <p className="preview-note">
                    Progressive overload applied across {preview.totalWeeks} weeks
                    {preview.weeks.some((w) => w.isDeload) && ' with deload weeks built in'}.
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="wizard-nav">
        {step > 0 && (
          <button className="wizard-back-btn" onClick={handleBack}>← Back</button>
        )}
        <div style={{ flex: 1 }} />
        {step < 4 && (
          <button
            className="wizard-next-btn"
            disabled={!canAdvance()}
            onClick={handleNext}
          >
            {step === 3 ? 'Generate Preview →' : 'Next →'}
          </button>
        )}
        {step === 4 && previewStatus === 'loaded' && (
          <button className="wizard-confirm-btn" onClick={handleConfirm}>
            Save Routine ✓
          </button>
        )}
      </div>
    </div>
  );
}
