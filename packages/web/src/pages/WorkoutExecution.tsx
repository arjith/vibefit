import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../hooks/useRedux';
import { fetchRoutineById } from '../store/routinesSlice';
import {
  startWorkout, logSet, pauseWorkout, resumeWorkout,
  completeWorkout, clearActiveSession,
} from '../store/workoutSlice';
export function WorkoutExecution() {
  const { routineId } = useParams<{ routineId: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const routine = useAppSelector((s) => s.routines.selected);
  const activeSession = useAppSelector((s) => s.workout.activeSession);

  // Workout state from URL search params
  const searchParams = new URLSearchParams(window.location.search);
  const weekNum = parseInt(searchParams.get('week') ?? '1', 10);
  const dayNum = parseInt(searchParams.get('day') ?? '1', 10);

  // Local workout state
  const [exerciseIndex, setExerciseIndex] = useState(0);
  const [currentSet, setCurrentSet] = useState(1);
  const [weight, setWeight] = useState('');
  const [reps, setReps] = useState('');
  const [rpe, setRpe] = useState('');
  const [restTimer, setRestTimer] = useState(0);
  const [isResting, setIsResting] = useState(false);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [showComplete, setShowComplete] = useState(false);
  const [sessionRpe, setSessionRpe] = useState(5);
  const [sessionMood, setSessionMood] = useState(3);
  const [sessionNotes, setSessionNotes] = useState('');
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const restRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Load routine if needed
  useEffect(() => {
    if (routineId && (!routine || routine.id !== routineId)) {
      dispatch(fetchRoutineById(routineId));
    }
  }, [dispatch, routineId, routine]);

  // Start session when routine loads
  useEffect(() => {
    if (routine && routineId && !activeSession) {
      dispatch(startWorkout({ routineId, weekNumber: weekNum, dayNumber: dayNum }));
    }
  }, [dispatch, routine, routineId, activeSession, weekNum, dayNum]);

  // Elapsed time timer
  useEffect(() => {
    timerRef.current = setInterval(() => setElapsedSec((s) => s + 1), 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  // Rest countdown
  useEffect(() => {
    if (isResting && restTimer > 0) {
      restRef.current = setInterval(() => {
        setRestTimer((t) => {
          if (t <= 1) {
            setIsResting(false);
            if (restRef.current) clearInterval(restRef.current);
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    }
    return () => { if (restRef.current) clearInterval(restRef.current); };
  }, [isResting, restTimer]);

  // Get the current day's exercises
  const currentWeek = routine?.weeks?.find((w) => w.weekNumber === weekNum);
  const currentDay = currentWeek?.days?.find((d) => d.dayNumber === dayNum);
  const exercises = currentDay?.exercises ?? [];
  const currentExercise = exercises[exerciseIndex];

  // Pre-fill weight from targetWeight
  useEffect(() => {
    if (currentExercise?.targetWeight) {
      setWeight(String(currentExercise.targetWeight));
    } else {
      setWeight('');
    }
    setReps(currentExercise ? String(currentExercise.reps) : '');
    setCurrentSet(1);
    setRpe('');
  }, [exerciseIndex, currentExercise?.targetWeight, currentExercise?.reps]);

  const handleLogSet = useCallback(async () => {
    if (!activeSession || !currentExercise) return;

    await dispatch(logSet({
      sessionId: activeSession.id,
      exerciseId: currentExercise.exerciseId,
      setNumber: currentSet,
      weight: parseFloat(weight) || 0,
      reps: parseInt(reps, 10) || 0,
      rpe: rpe ? parseInt(rpe, 10) : undefined,
    }));

    if (currentSet < currentExercise.sets) {
      setCurrentSet(currentSet + 1);
      // Start rest timer
      setRestTimer(currentExercise.restSeconds);
      setIsResting(true);
    } else {
      // Move to next exercise
      if (exerciseIndex < exercises.length - 1) {
        setExerciseIndex(exerciseIndex + 1);
      } else {
        setShowComplete(true);
      }
    }
  }, [activeSession, currentExercise, currentSet, weight, reps, rpe, exerciseIndex, exercises.length, dispatch]);

  const handleComplete = async () => {
    if (!activeSession) return;
    await dispatch(completeWorkout({
      sessionId: activeSession.id,
      rpe: sessionRpe,
      mood: sessionMood,
      notes: sessionNotes || undefined,
      totalDurationSec: elapsedSec,
    }));
    dispatch(clearActiveSession());
    navigate(`/routines/${routineId}`, { replace: true });
  };

  const handlePause = () => {
    if (activeSession) dispatch(pauseWorkout(activeSession.id));
  };

  const handleResume = () => {
    if (activeSession) dispatch(resumeWorkout(activeSession.id));
  };

  const skipRest = () => {
    setIsResting(false);
    setRestTimer(0);
    if (restRef.current) clearInterval(restRef.current);
  };

  function formatTime(sec: number): string {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  // Loading state
  if (!routine || !currentDay) {
    return (
      <div className="workout-page">
        <div className="workout-loading">
          <div className="skeleton-block" style={{ width: 200, height: 32 }} />
          <p>Loading workout...</p>
        </div>
      </div>
    );
  }

  // Completion modal
  if (showComplete) {
    return (
      <div className="workout-page">
        <div className="workout-complete-modal">
          <h2>🎉 Workout Complete!</h2>
          <p className="complete-time">Time: {formatTime(elapsedSec)}</p>
          <p className="complete-sets">Sets logged: {activeSession?.sets?.length ?? 0}</p>

          <div className="complete-field">
            <label>Session RPE (1-10)</label>
            <div className="rpe-selector">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                <button
                  key={n}
                  className={`rpe-btn ${sessionRpe === n ? 'selected' : ''}`}
                  onClick={() => setSessionRpe(n)}
                >{n}</button>
              ))}
            </div>
          </div>

          <div className="complete-field">
            <label>How do you feel?</label>
            <div className="mood-selector">
              {[
                { value: 1, emoji: '😫' },
                { value: 2, emoji: '😐' },
                { value: 3, emoji: '🙂' },
                { value: 4, emoji: '😊' },
                { value: 5, emoji: '🔥' },
              ].map((m) => (
                <button
                  key={m.value}
                  className={`mood-btn ${sessionMood === m.value ? 'selected' : ''}`}
                  onClick={() => setSessionMood(m.value)}
                >{m.emoji}</button>
              ))}
            </div>
          </div>

          <div className="complete-field">
            <label>Notes (optional)</label>
            <textarea
              placeholder="How did it go?"
              value={sessionNotes}
              onChange={(e) => setSessionNotes(e.target.value)}
              maxLength={500}
            />
          </div>

          <button className="btn-primary" onClick={handleComplete}>Save & Finish</button>
        </div>
      </div>
    );
  }

  // Rest timer overlay
  if (isResting) {
    return (
      <div className="workout-page">
        <div className="rest-timer-overlay">
          <h2>Rest</h2>
          <div className="rest-countdown">{formatTime(restTimer)}</div>
          <p>Next: Set {currentSet} of {currentExercise?.sets}</p>
          <button className="btn-outline" onClick={skipRest}>Skip Rest</button>
        </div>
      </div>
    );
  }

  return (
    <div className="workout-page">
      <div className="workout-header">
        <div className="workout-header-left">
          <h2>{currentDay?.focus ?? 'Workout'}</h2>
          <span className="workout-clock">{formatTime(elapsedSec)}</span>
        </div>
        <div className="workout-header-right">
          {activeSession?.status === 'paused' ? (
            <button className="btn-outline btn-sm" onClick={handleResume}>▶ Resume</button>
          ) : (
            <button className="btn-outline btn-sm" onClick={handlePause}>⏸ Pause</button>
          )}
          <button className="btn-outline btn-sm btn-danger" onClick={() => setShowComplete(true)}>Finish</button>
        </div>
      </div>

      {/* Exercise progress */}
      <div className="exercise-progress-bar">
        {exercises.map((_, i) => (
          <div
            key={i}
            className={`ex-dot ${i < exerciseIndex ? 'done' : ''} ${i === exerciseIndex ? 'current' : ''}`}
          />
        ))}
      </div>

      {/* Current exercise */}
      {currentExercise && (
        <div className="workout-exercise-card">
          <div className="exercise-card-header">
            <span className="exercise-number">{exerciseIndex + 1}/{exercises.length}</span>
            <h3>{currentExercise.exerciseName ?? 'Exercise'}</h3>
            {currentExercise.muscleGroup && (
              <span className="exercise-muscle-tag">{currentExercise.muscleGroup}</span>
            )}
          </div>

          <div className="set-tracker">
            <div className="set-info">
              <span className="set-label">Set {currentSet} of {currentExercise.sets}</span>
              <span className="set-prescription">
                Target: {currentExercise.reps} reps
                {currentExercise.targetWeight ? ` × ${currentExercise.targetWeight} lb` : ''}
              </span>
            </div>

            <div className="set-inputs">
              <div className="input-group">
                <label>Weight (lb)</label>
                <input
                  type="number"
                  inputMode="decimal"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  className="set-input"
                />
              </div>
              <div className="input-group">
                <label>Reps</label>
                <input
                  type="number"
                  inputMode="numeric"
                  value={reps}
                  onChange={(e) => setReps(e.target.value)}
                  className="set-input"
                />
              </div>
              <div className="input-group">
                <label>RPE</label>
                <input
                  type="number"
                  inputMode="numeric"
                  min="1"
                  max="10"
                  value={rpe}
                  onChange={(e) => setRpe(e.target.value)}
                  className="set-input set-input-sm"
                  placeholder="—"
                />
              </div>
            </div>

            <button
              className="btn-primary btn-log-set"
              onClick={handleLogSet}
              disabled={!weight || !reps}
            >
              Log Set {currentSet} ✓
            </button>
          </div>

          {/* Completed sets */}
          {activeSession?.sets && activeSession.sets.filter((s) => s.exerciseId === currentExercise.exerciseId).length > 0 && (
            <div className="completed-sets">
              <h4>Completed Sets</h4>
              <div className="sets-table">
                {activeSession.sets
                  .filter((s) => s.exerciseId === currentExercise.exerciseId)
                  .map((s) => (
                    <div key={s.id} className="set-row">
                      <span>Set {s.setNumber}</span>
                      <span>{s.weight} lb</span>
                      <span>{s.reps} reps</span>
                      {s.rpe && <span>RPE {s.rpe}</span>}
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Exercise nav */}
      <div className="exercise-nav">
        <button
          className="btn-outline btn-sm"
          disabled={exerciseIndex === 0}
          onClick={() => setExerciseIndex(exerciseIndex - 1)}
        >← Prev</button>
        <button
          className="btn-outline btn-sm"
          disabled={exerciseIndex >= exercises.length - 1}
          onClick={() => setExerciseIndex(exerciseIndex + 1)}
        >Next →</button>
      </div>
    </div>
  );
}
