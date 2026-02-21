import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../hooks/useRedux';
import { fetchProfile, saveOnboardingStep } from '../store/profileSlice';
import { FITNESS_GOALS, EQUIPMENT_OPTIONS, EQUIPMENT_PRESETS } from '@vibefit/shared';

const STEPS = [
  'Welcome',
  'Fitness Level',
  'Goals',
  'Schedule',
  'Equipment',
  'Injuries',
  'Body Metrics',
];

const INJURY_BODY_PARTS = [
  'Lower Back', 'Knees', 'Shoulders', 'Wrists', 'Neck',
  'Hips', 'Ankles', 'Elbows',
];

export function Onboarding() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { profile, status } = useAppSelector((s) => s.profile);
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  // Form data
  const [fitnessLevel, setFitnessLevel] = useState<string>('beginner');
  const [goals, setGoals] = useState<string[]>([]);
  const [daysPerWeek, setDaysPerWeek] = useState(3);
  const [sessionDuration, setSessionDuration] = useState(45);
  const [equipment, setEquipment] = useState<string[]>([]);
  const [injuries, setInjuries] = useState<Array<{ bodyPart: string; severity: string; notes: string | null }>>([]);
  const [biologicalSex, setBiologicalSex] = useState<string>('');
  const [heightCm, setHeightCm] = useState<string>('');
  const [weightKg, setWeightKg] = useState<string>('');
  const [age, setAge] = useState<string>('');

  useEffect(() => {
    if (status === 'idle') {
      dispatch(fetchProfile());
    }
  }, [dispatch, status]);

  // Resume from where user left off
  useEffect(() => {
    if (profile) {
      setStep(profile.onboardingStep);
      setFitnessLevel(profile.fitnessLevel);
      setGoals(profile.goals as string[]);
      setDaysPerWeek(profile.trainingDaysPerWeek);
      setSessionDuration(profile.sessionDurationMin);
      setEquipment(profile.preferredEquipment as string[]);
      if (profile.biologicalSex) setBiologicalSex(profile.biologicalSex);
      if (profile.heightCm) setHeightCm(String(profile.heightCm));
      if (profile.weightKg) setWeightKg(String(profile.weightKg));
      if (profile.age) setAge(String(profile.age));
      if (profile.onboardingCompleted) {
        navigate('/', { replace: true });
      }
    }
  }, [profile, navigate]);

  async function handleNext() {
    setSaving(true);
    const stepDataMap: Record<number, Record<string, unknown>> = {
      0: {},
      1: { fitnessLevel },
      2: { goals },
      3: { trainingDaysPerWeek: daysPerWeek, sessionDurationMin: sessionDuration },
      4: { preferredEquipment: equipment },
      5: { injuryZones: injuries },
      6: {
        biologicalSex: biologicalSex || null,
        heightCm: heightCm ? parseFloat(heightCm) : null,
        weightKg: weightKg ? parseFloat(weightKg) : null,
        age: age ? parseInt(age, 10) : null,
      },
    };

    await dispatch(saveOnboardingStep({ step, data: stepDataMap[step] ?? {} }));
    setSaving(false);

    if (step >= 6) {
      navigate('/', { replace: true });
    } else {
      setStep(step + 1);
    }
  }

  function handleBack() {
    if (step > 0) setStep(step - 1);
  }

  function toggleGoal(goalId: string) {
    setGoals((g) => g.includes(goalId) ? g.filter((x) => x !== goalId) : [...g, goalId]);
  }

  function toggleEquipment(equipId: string) {
    setEquipment((e) => e.includes(equipId) ? e.filter((x) => x !== equipId) : [...e, equipId]);
  }

  function applyEquipmentPreset(preset: 'gym' | 'home' | 'travel') {
    setEquipment([...EQUIPMENT_PRESETS[preset]]);
  }

  function toggleInjury(bodyPart: string) {
    setInjuries((inj) => {
      const existing = inj.find((i) => i.bodyPart === bodyPart);
      if (existing) return inj.filter((i) => i.bodyPart !== bodyPart);
      return [...inj, { bodyPart, severity: 'mild', notes: null }];
    });
  }

  function updateInjurySeverity(bodyPart: string, severity: string) {
    setInjuries((inj) => inj.map((i) => i.bodyPart === bodyPart ? { ...i, severity } : i));
  }

  if (status === 'loading') {
    return (
      <div className="onboarding-page">
        <div className="onboarding-loading">
          <div className="skeleton-block" style={{ width: 200, height: 32 }} />
        </div>
      </div>
    );
  }

  return (
    <div className="onboarding-page">
      <div className="onboarding-container">
        {/* Progress Bar */}
        <div className="onboarding-progress">
          {STEPS.map((label, i) => (
            <div
              key={label}
              className={`progress-dot ${i < step ? 'completed' : ''} ${i === step ? 'active' : ''}`}
              title={label}
            />
          ))}
        </div>
        <p className="onboarding-step-label">Step {step + 1} of {STEPS.length} — {STEPS[step]}</p>

        {/* Step Content */}
        <div className="onboarding-step-content">
          {step === 0 && (
            <div className="step-welcome">
              <h1>Welcome to VibeFit 💪</h1>
              <p>Let's personalize your fitness experience. This takes about 2 minutes and helps us build the perfect program for you.</p>
              <div className="welcome-features">
                <div className="welcome-feature">🎯 Personalized routines</div>
                <div className="welcome-feature">📈 Progressive overload</div>
                <div className="welcome-feature">🔥 Smart tracking</div>
                <div className="welcome-feature">🏆 Achievements & streaks</div>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="step-fitness-level">
              <h2>What's your fitness level?</h2>
              <p>This helps us calibrate exercise difficulty and progression speed.</p>
              <div className="level-cards">
                {(['beginner', 'intermediate', 'advanced'] as const).map((level) => (
                  <button
                    key={level}
                    className={`level-card ${fitnessLevel === level ? 'selected' : ''}`}
                    onClick={() => setFitnessLevel(level)}
                  >
                    <span className="level-emoji">
                      {level === 'beginner' ? '🌱' : level === 'intermediate' ? '💪' : '🔥'}
                    </span>
                    <span className="level-label">{level.charAt(0).toUpperCase() + level.slice(1)}</span>
                    <span className="level-desc">
                      {level === 'beginner' ? 'New to training or returning after a break'
                        : level === 'intermediate' ? '6+ months consistent training'
                        : '2+ years, ready for advanced programming'}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="step-goals">
              <h2>What are your goals?</h2>
              <p>Select one or more. We'll prioritize your primary goal.</p>
              <div className="goal-grid">
                {FITNESS_GOALS.map((g) => (
                  <button
                    key={g.id}
                    className={`goal-card ${goals.includes(g.id) ? 'selected' : ''}`}
                    onClick={() => toggleGoal(g.id)}
                  >
                    <span className="goal-emoji">{g.emoji}</span>
                    <span className="goal-label">{g.label}</span>
                    <span className="goal-desc">{g.description}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="step-schedule">
              <h2>Your Training Schedule</h2>
              <div className="schedule-field">
                <label>Days per week</label>
                <div className="day-selector">
                  {[2, 3, 4, 5, 6].map((d) => (
                    <button
                      key={d}
                      className={`day-btn ${daysPerWeek === d ? 'selected' : ''}`}
                      onClick={() => setDaysPerWeek(d)}
                    >{d}</button>
                  ))}
                </div>
              </div>
              <div className="schedule-field">
                <label>Session duration: {sessionDuration} min</label>
                <input
                  type="range"
                  min={15}
                  max={120}
                  step={5}
                  value={sessionDuration}
                  onChange={(e) => setSessionDuration(Number(e.target.value))}
                  className="duration-slider"
                />
                <div className="slider-labels">
                  <span>15 min</span>
                  <span>120 min</span>
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="step-equipment">
              <h2>Available Equipment</h2>
              <div className="equipment-presets">
                <button className="preset-btn" onClick={() => applyEquipmentPreset('gym')}>🏋️ Full Gym</button>
                <button className="preset-btn" onClick={() => applyEquipmentPreset('home')}>🏠 Home Setup</button>
                <button className="preset-btn" onClick={() => applyEquipmentPreset('travel')}>✈️ Travel</button>
              </div>
              <div className="equipment-grid">
                {EQUIPMENT_OPTIONS.map((e) => (
                  <button
                    key={e.id}
                    className={`equipment-card ${equipment.includes(e.id) ? 'selected' : ''}`}
                    onClick={() => toggleEquipment(e.id)}
                  >
                    <span>{e.emoji}</span>
                    <span>{e.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="step-injuries">
              <h2>Any Injuries or Limitations?</h2>
              <p>We'll avoid exercises that stress these areas. Skip if none.</p>
              <div className="injury-grid">
                {INJURY_BODY_PARTS.map((part) => {
                  const active = injuries.find((i) => i.bodyPart === part);
                  return (
                    <div key={part} className={`injury-card ${active ? 'selected' : ''}`}>
                      <button className="injury-toggle" onClick={() => toggleInjury(part)}>
                        {part}
                      </button>
                      {active && (
                        <div className="injury-severity">
                          {(['mild', 'moderate', 'severe'] as const).map((s) => (
                            <button
                              key={s}
                              className={`severity-btn ${active.severity === s ? 'active' : ''}`}
                              onClick={() => updateInjurySeverity(part, s)}
                            >{s}</button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {step === 6 && (
            <div className="step-metrics">
              <h2>Body Metrics <span className="optional-tag">(optional)</span></h2>
              <p>Helps us fine-tune recommendations. You can skip any field.</p>
              <div className="metrics-form">
                <div className="metric-field">
                  <label>Biological Sex</label>
                  <div className="sex-selector">
                    {[
                      { value: 'male', label: '♂ Male' },
                      { value: 'female', label: '♀ Female' },
                      { value: 'other', label: '⚧ Other' },
                      { value: 'prefer-not-to-say', label: '— Prefer not to say' },
                    ].map((opt) => (
                      <button
                        key={opt.value}
                        className={`sex-btn ${biologicalSex === opt.value ? 'selected' : ''}`}
                        onClick={() => setBiologicalSex(opt.value)}
                      >{opt.label}</button>
                    ))}
                  </div>
                </div>
                <div className="metrics-row">
                  <div className="metric-field">
                    <label>Height (cm)</label>
                    <input
                      type="number"
                      placeholder="175"
                      value={heightCm}
                      onChange={(e) => setHeightCm(e.target.value)}
                    />
                  </div>
                  <div className="metric-field">
                    <label>Weight (kg)</label>
                    <input
                      type="number"
                      placeholder="75"
                      value={weightKg}
                      onChange={(e) => setWeightKg(e.target.value)}
                    />
                  </div>
                  <div className="metric-field">
                    <label>Age</label>
                    <input
                      type="number"
                      placeholder="25"
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="onboarding-nav">
          {step > 0 && (
            <button className="btn-outline" onClick={handleBack} disabled={saving}>Back</button>
          )}
          <button
            className="btn-primary"
            onClick={handleNext}
            disabled={saving || (step === 2 && goals.length === 0)}
          >
            {saving ? 'Saving...' : step === 6 ? 'Finish Setup' : step === 0 ? 'Get Started' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
}
