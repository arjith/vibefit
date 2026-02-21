import { useEffect, useMemo, useCallback, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../hooks/useRedux';
import { fetchExercises, setFilters } from '../store/exercisesSlice';
import { MUSCLE_GROUPS, EQUIPMENT_OPTIONS } from '@vibefit/shared';

const DEBOUNCE_MS = 300;
const DIFFICULTY_OPTIONS = ['beginner', 'intermediate', 'advanced'];

export function Exercises() {
  const dispatch = useAppDispatch();
  const { items, filters, meta, status, error } = useAppSelector((s) => s.exercises);
  const [searchParams, setSearchParams] = useSearchParams();
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  // Sync URL → filters on mount
  useEffect(() => {
    const urlFilters = {
      search: searchParams.get('search') ?? '',
      muscleGroup: searchParams.get('muscleGroup') ?? '',
      equipment: searchParams.get('equipment') ?? '',
      difficulty: searchParams.get('difficulty') ?? '',
    };
    dispatch(setFilters(urlFilters));
    dispatch(fetchExercises({ ...urlFilters, page: Number(searchParams.get('page')) || 1 }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync filters → URL + fetch (debounced for search)
  const triggerFetch = useCallback((newFilters: typeof filters, page = 1) => {
    const params: Record<string, string> = {};
    if (newFilters.search) params.search = newFilters.search;
    if (newFilters.muscleGroup) params.muscleGroup = newFilters.muscleGroup;
    if (newFilters.equipment) params.equipment = newFilters.equipment;
    if (newFilters.difficulty) params.difficulty = newFilters.difficulty;
    if (page > 1) params.page = String(page);
    setSearchParams(params, { replace: true });
    dispatch(fetchExercises({ ...newFilters, page }));
  }, [dispatch, setSearchParams]);

  const handleFilterChange = useCallback((key: string, value: string) => {
    const newFilters = { ...filters, [key]: value };
    dispatch(setFilters({ [key]: value }));

    if (key === 'search') {
      clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => triggerFetch(newFilters), DEBOUNCE_MS);
    } else {
      triggerFetch(newFilters);
    }
  }, [filters, dispatch, triggerFetch]);

  const handlePageChange = useCallback((page: number) => {
    triggerFetch(filters, page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [filters, triggerFetch]);

  const skeleton = useMemo(() => (
    <div className="vf-exercise-grid">
      {Array.from({ length: 12 }).map((_, i) => (
        <div key={i} className="vf-exercise-card vf-exercise-card--skeleton" aria-hidden="true">
          <div className="vf-skeleton vf-skeleton--image" />
          <div className="vf-skeleton vf-skeleton--text vf-skeleton--w60" />
          <div className="vf-skeleton vf-skeleton--text vf-skeleton--w40" />
        </div>
      ))}
    </div>
  ), []);

  return (
    <div className="vf-exercises-page">
      <div className="vf-exercises-page__header">
        <h1>Exercise Library</h1>
        <p className="vf-text--muted">{meta.total} exercises</p>
      </div>

      {/* Filters */}
      <div className="vf-filters">
        <div className="vf-filters__search">
          <input
            type="search"
            placeholder="Search exercises..."
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            className="vf-input"
            aria-label="Search exercises"
          />
        </div>
        <select
          value={filters.muscleGroup}
          onChange={(e) => handleFilterChange('muscleGroup', e.target.value)}
          className="vf-select"
          aria-label="Filter by muscle group"
        >
          <option value="">All Muscles</option>
          {MUSCLE_GROUPS.map((mg) => (
            <option key={mg} value={mg}>{mg.charAt(0).toUpperCase() + mg.slice(1)}</option>
          ))}
        </select>
        <select
          value={filters.equipment}
          onChange={(e) => handleFilterChange('equipment', e.target.value)}
          className="vf-select"
          aria-label="Filter by equipment"
        >
          <option value="">All Equipment</option>
          {EQUIPMENT_OPTIONS.map((eq) => (
            <option key={eq} value={eq}>{eq.charAt(0).toUpperCase() + eq.slice(1)}</option>
          ))}
        </select>
        <select
          value={filters.difficulty}
          onChange={(e) => handleFilterChange('difficulty', e.target.value)}
          className="vf-select"
          aria-label="Filter by difficulty"
        >
          <option value="">All Levels</option>
          {DIFFICULTY_OPTIONS.map((d) => (
            <option key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</option>
          ))}
        </select>
      </div>

      {/* Content */}
      {status === 'loading' && skeleton}

      {status === 'error' && (
        <div className="vf-error-state">
          <h2>Something went wrong</h2>
          <p>{error}</p>
          <button className="vf-btn vf-btn--primary" onClick={() => triggerFetch(filters)}>
            Try again
          </button>
        </div>
      )}

      {status === 'loaded' && items.length === 0 && (
        <div className="vf-empty-state">
          <span className="vf-empty-state__icon">🔍</span>
          <h2>No exercises found</h2>
          <p>Try adjusting your search or filters</p>
          <button
            className="vf-btn vf-btn--secondary"
            onClick={() => {
              dispatch(setFilters({ search: '', muscleGroup: '', equipment: '', difficulty: '' }));
              triggerFetch({ search: '', muscleGroup: '', equipment: '', difficulty: '' });
            }}
          >
            Clear filters
          </button>
        </div>
      )}

      {status === 'loaded' && items.length > 0 && (
        <>
          <div className="vf-exercise-grid">
            {items.map((ex) => (
              <Link to={`/exercises/${ex.id}`} key={ex.id} className="vf-exercise-card vf-exercise-card--link">
                <div className="vf-exercise-card__image">
                  {ex.imageUrls?.[0] ? (
                    <img src={ex.imageUrls[0]} alt={ex.name} loading="lazy" />
                  ) : (
                    <div className="vf-exercise-card__placeholder">💪</div>
                  )}
                </div>
                <div className="vf-exercise-card__body">
                  <h3 className="vf-exercise-card__name">{ex.name}</h3>
                  <div className="vf-exercise-card__meta">
                    <span className="vf-badge vf-badge--brand">{ex.muscleGroup}</span>
                    <span className="vf-badge">{ex.equipment}</span>
                    <span className="vf-badge">{ex.difficulty}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Pagination */}
          {meta.totalPages > 1 && (
            <div className="vf-pagination">
              <button
                className="vf-btn vf-btn--ghost"
                disabled={meta.page <= 1}
                onClick={() => handlePageChange(meta.page - 1)}
              >
                ← Previous
              </button>
              <span className="vf-pagination__info">
                Page {meta.page} of {meta.totalPages}
              </span>
              <button
                className="vf-btn vf-btn--ghost"
                disabled={meta.page >= meta.totalPages}
                onClick={() => handlePageChange(meta.page + 1)}
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
