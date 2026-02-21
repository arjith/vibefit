import { useEffect, useMemo, useCallback, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../hooks/useRedux';
import { fetchCardio, setCardioFilters } from '../store/cardioSlice';

const DEBOUNCE_MS = 300;
const CATEGORIES = ['outdoor', 'gym', 'home', 'water', 'dance', 'sport', 'martial arts'];
const INTENSITIES = ['low', 'moderate', 'high', 'very high'];

export function Cardio() {
  const dispatch = useAppDispatch();
  const { items, filters, meta, status, error } = useAppSelector((s) => s.cardio);
  const [searchParams, setSearchParams] = useSearchParams();
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    const urlFilters = {
      search: searchParams.get('search') ?? '',
      category: searchParams.get('category') ?? '',
      intensity: searchParams.get('intensity') ?? '',
    };
    dispatch(setCardioFilters(urlFilters));
    dispatch(fetchCardio({ ...urlFilters, page: Number(searchParams.get('page')) || 1 }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const triggerFetch = useCallback((newFilters: typeof filters, page = 1) => {
    const params: Record<string, string> = {};
    if (newFilters.search) params.search = newFilters.search;
    if (newFilters.category) params.category = newFilters.category;
    if (newFilters.intensity) params.intensity = newFilters.intensity;
    if (page > 1) params.page = String(page);
    setSearchParams(params, { replace: true });
    dispatch(fetchCardio({ ...newFilters, page }));
  }, [dispatch, setSearchParams]);

  const handleFilterChange = useCallback((key: string, value: string) => {
    const newFilters = { ...filters, [key]: value };
    dispatch(setCardioFilters({ [key]: value }));
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
    <div className="vf-cardio-grid">
      {Array.from({ length: 12 }).map((_, i) => (
        <div key={i} className="vf-cardio-card vf-cardio-card--skeleton" aria-hidden="true">
          <div className="vf-skeleton vf-skeleton--image" />
          <div className="vf-skeleton vf-skeleton--text vf-skeleton--w60" />
          <div className="vf-skeleton vf-skeleton--text vf-skeleton--w40" />
        </div>
      ))}
    </div>
  ), []);

  const funStars = (rating: number) => '⭐'.repeat(Math.min(rating, 5));

  return (
    <div className="vf-cardio-page">
      <div className="vf-cardio-page__header">
        <h1>Cardio Activities</h1>
        <p className="vf-text--muted">{meta.total} activities</p>
      </div>

      <div className="vf-filters">
        <div className="vf-filters__search">
          <input
            type="search"
            placeholder="Search activities..."
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            className="vf-input"
            aria-label="Search cardio activities"
          />
        </div>
        <select
          value={filters.category}
          onChange={(e) => handleFilterChange('category', e.target.value)}
          className="vf-select"
          aria-label="Filter by category"
        >
          <option value="">All Categories</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
          ))}
        </select>
        <select
          value={filters.intensity}
          onChange={(e) => handleFilterChange('intensity', e.target.value)}
          className="vf-select"
          aria-label="Filter by intensity"
        >
          <option value="">All Intensities</option>
          {INTENSITIES.map((i) => (
            <option key={i} value={i}>{i.charAt(0).toUpperCase() + i.slice(1)}</option>
          ))}
        </select>
      </div>

      {status === 'loading' && skeleton}

      {status === 'error' && (
        <div className="vf-error-state">
          <h2>Something went wrong</h2>
          <p>{error}</p>
          <button className="vf-btn vf-btn--primary" onClick={() => triggerFetch(filters)}>Try again</button>
        </div>
      )}

      {status === 'loaded' && items.length === 0 && (
        <div className="vf-empty-state">
          <span className="vf-empty-state__icon">🏃</span>
          <h2>No activities found</h2>
          <p>Try adjusting your search or filters</p>
          <button
            className="vf-btn vf-btn--secondary"
            onClick={() => {
              dispatch(setCardioFilters({ search: '', category: '', intensity: '' }));
              triggerFetch({ search: '', category: '', intensity: '' });
            }}
          >
            Clear filters
          </button>
        </div>
      )}

      {status === 'loaded' && items.length > 0 && (
        <>
          <div className="vf-cardio-grid">
            {items.map((act) => (
              <Link to={`/cardio/${act.id}`} key={act.id} className="vf-cardio-card vf-cardio-card--link">
                <div className="vf-cardio-card__image">
                  {act.imageUrl ? (
                    <img src={act.imageUrl} alt={act.name} loading="lazy" />
                  ) : (
                    <div className="vf-cardio-card__placeholder">🏃</div>
                  )}
                </div>
                <div className="vf-cardio-card__body">
                  <h3 className="vf-cardio-card__name">{act.name}</h3>
                  <div className="vf-cardio-card__meta">
                    <span className="vf-badge vf-badge--brand">{act.category}</span>
                    <span className="vf-badge">{act.intensityLevel}</span>
                  </div>
                  <div className="vf-cardio-card__stats">
                    <span>🔥 {act.caloriesPerHour} cal/hr</span>
                    <span>⏱ {act.durationMin} min</span>
                    <span>{funStars(act.funRating)}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {meta.totalPages > 1 && (
            <div className="vf-pagination">
              <button className="vf-btn vf-btn--ghost" disabled={meta.page <= 1} onClick={() => handlePageChange(meta.page - 1)}>← Previous</button>
              <span className="vf-pagination__info">Page {meta.page} of {meta.totalPages}</span>
              <button className="vf-btn vf-btn--ghost" disabled={meta.page >= meta.totalPages} onClick={() => handlePageChange(meta.page + 1)}>Next →</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
