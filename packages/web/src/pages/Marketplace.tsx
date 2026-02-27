import { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../hooks/useRedux';
import {
  fetchPrograms,
  fetchProgramDetail,
  fetchMyPrograms,
  createProgram,
  togglePublish,
  enrollProgram,
  submitReview,
  clearSelected,
} from '../store/marketplaceSlice';
import type { CoachProgram, ProgramCategory, ProgramDifficulty } from '@vibefit/shared';
import type { ProgramDetail } from '../store/marketplaceSlice';

// ─── Program Card ────────────────────────────────────────────
function ProgramCard({ program, onSelect }: { program: CoachProgram; onSelect: (id: string) => void }) {
  const difficultyColor: Record<string, string> = {
    beginner: '#9EFD38',
    intermediate: '#ffaa00',
    advanced: '#ff4444',
  };

  return (
    <button className="mp-card" onClick={() => onSelect(program.id)} type="button">
      <div className="mp-card__header">
        <span className="mp-card__category">{program.category}</span>
        <span className="mp-card__difficulty" style={{ color: difficultyColor[program.difficulty] ?? '#9EFD38' }}>
          {program.difficulty}
        </span>
      </div>
      <h3 className="mp-card__name">{program.name}</h3>
      <p className="mp-card__desc">{program.description.slice(0, 120)}{program.description.length > 120 ? '…' : ''}</p>
      <div className="mp-card__meta">
        <span className="mp-card__coach">by {program.coachName ?? 'Coach'}</span>
        <span className="mp-card__duration">{program.durationWeeks}w</span>
      </div>
      <div className="mp-card__footer">
        <span className="mp-card__rating">★ {program.rating.toFixed(1)} ({program.reviewCount})</span>
        <span className="mp-card__price">{program.price === 0 ? 'Free' : `$${program.price.toFixed(2)}`}</span>
        <span className="mp-card__enrollments">{program.enrollmentCount} enrolled</span>
      </div>
    </button>
  );
}

// ─── Star Rating ─────────────────────────────────────────────
function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="mp-star-rating">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          className={`mp-star ${star <= value ? 'mp-star--active' : ''}`}
          onClick={() => onChange(star)}
        >
          ★
        </button>
      ))}
    </div>
  );
}

// ─── Program Detail Panel ────────────────────────────────────
function ProgramDetailPanel({ program, onClose }: { program: ProgramDetail; onClose: () => void }) {
  const dispatch = useAppDispatch();
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [enrolled, setEnrolled] = useState(false);

  const handleEnroll = () => {
    dispatch(enrollProgram(program.id));
    setEnrolled(true);
  };

  const handleReview = () => {
    if (reviewRating === 0) return;
    dispatch(submitReview({ programId: program.id, rating: reviewRating, comment: reviewComment || undefined }));
    setReviewRating(0);
    setReviewComment('');
  };

  return (
    <div className="mp-detail-overlay" onClick={onClose} role="presentation">
      <div className="mp-detail" onClick={(e) => e.stopPropagation()} role="dialog" aria-label={program.name}>
        <button className="mp-detail__close" onClick={onClose} aria-label="Close">✕</button>

        <div className="mp-detail__header">
          <h2>{program.name}</h2>
          <span className="mp-detail__coach">by {program.coachName ?? 'Coach'}</span>
        </div>

        <div className="mp-detail__stats">
          <div className="mp-detail__stat">
            <span className="mp-detail__stat-value">★ {program.rating.toFixed(1)}</span>
            <span className="mp-detail__stat-label">{program.reviewCount} reviews</span>
          </div>
          <div className="mp-detail__stat">
            <span className="mp-detail__stat-value">{program.enrollmentCount}</span>
            <span className="mp-detail__stat-label">enrolled</span>
          </div>
          <div className="mp-detail__stat">
            <span className="mp-detail__stat-value">{program.durationWeeks}w</span>
            <span className="mp-detail__stat-label">duration</span>
          </div>
          <div className="mp-detail__stat">
            <span className="mp-detail__stat-value">{program.price === 0 ? 'Free' : `$${program.price}`}</span>
            <span className="mp-detail__stat-label">price</span>
          </div>
        </div>

        <p className="mp-detail__description">{program.description}</p>

        <div className="mp-detail__actions">
          <button
            className="vf-btn vf-btn--primary"
            onClick={handleEnroll}
            disabled={enrolled}
          >
            {enrolled ? 'Enrolled ✓' : 'Enroll Now'}
          </button>
        </div>

        {/* Reviews */}
        <div className="mp-reviews">
          <h3>Reviews ({program.reviews.length})</h3>
          {program.reviews.length === 0 && <p className="mp-reviews__empty">No reviews yet. Be the first!</p>}
          {program.reviews.map((r) => (
            <div key={r.id} className="mp-review">
              <div className="mp-review__header">
                <span className="mp-review__user">{r.userName ?? 'User'}</span>
                <span className="mp-review__rating">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span>
              </div>
              {r.comment && <p className="mp-review__comment">{r.comment}</p>}
            </div>
          ))}

          {/* Leave a review */}
          <div className="mp-review-form">
            <h4>Leave a Review</h4>
            <StarRating value={reviewRating} onChange={setReviewRating} />
            <textarea
              className="mp-review-form__textarea"
              placeholder="Write your review..."
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              maxLength={1000}
            />
            <button className="vf-btn vf-btn--primary vf-btn--sm" onClick={handleReview} disabled={reviewRating === 0}>
              Submit Review
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Create Program Form ─────────────────────────────────────
function CreateProgramForm({ onClose }: { onClose: () => void }) {
  const dispatch = useAppDispatch();
  const [form, setForm] = useState({
    name: '',
    description: '',
    price: 0,
    durationWeeks: 4,
    difficulty: 'beginner' as ProgramDifficulty,
    category: 'general' as ProgramCategory,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    dispatch(createProgram(form));
    onClose();
  };

  return (
    <div className="mp-detail-overlay" onClick={onClose} role="presentation">
      <form className="mp-create-form" onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit}>
        <button type="button" className="mp-detail__close" onClick={onClose} aria-label="Close">✕</button>
        <h2>Create Program</h2>

        <label className="mp-form-field">
          <span>Program Name</span>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
            maxLength={255}
          />
        </label>

        <label className="mp-form-field">
          <span>Description</span>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            required
            minLength={10}
            maxLength={5000}
          />
        </label>

        <div className="mp-form-row">
          <label className="mp-form-field">
            <span>Price ($)</span>
            <input
              type="number"
              min={0}
              max={999}
              step={0.01}
              value={form.price}
              onChange={(e) => setForm({ ...form, price: parseFloat(e.target.value) || 0 })}
            />
          </label>
          <label className="mp-form-field">
            <span>Duration (weeks)</span>
            <input
              type="number"
              min={1}
              max={52}
              value={form.durationWeeks}
              onChange={(e) => setForm({ ...form, durationWeeks: parseInt(e.target.value) || 4 })}
            />
          </label>
        </div>

        <div className="mp-form-row">
          <label className="mp-form-field">
            <span>Difficulty</span>
            <select value={form.difficulty} onChange={(e) => setForm({ ...form, difficulty: e.target.value as ProgramDifficulty })}>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </label>
          <label className="mp-form-field">
            <span>Category</span>
            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as ProgramCategory })}>
              <option value="strength">Strength</option>
              <option value="hypertrophy">Hypertrophy</option>
              <option value="weight-loss">Weight Loss</option>
              <option value="endurance">Endurance</option>
              <option value="powerlifting">Powerlifting</option>
              <option value="bodybuilding">Bodybuilding</option>
              <option value="athletic">Athletic</option>
              <option value="general">General</option>
            </select>
          </label>
        </div>

        <button type="submit" className="vf-btn vf-btn--primary">Create Program</button>
      </form>
    </div>
  );
}

// ─── My Programs Tab ─────────────────────────────────────────
function MyPrograms() {
  const dispatch = useAppDispatch();
  const { myPrograms } = useAppSelector((s) => s.marketplace);
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    dispatch(fetchMyPrograms());
  }, [dispatch]);

  return (
    <div className="mp-my-programs">
      <div className="mp-my-programs__header">
        <h2>My Programs</h2>
        <button className="vf-btn vf-btn--primary vf-btn--sm" onClick={() => setShowCreate(true)}>
          + Create Program
        </button>
      </div>

      {myPrograms.length === 0 ? (
        <p className="mp-empty">You haven't created any programs yet. Start sharing your expertise!</p>
      ) : (
        <div className="mp-my-list">
          {myPrograms.map((p) => (
            <div key={p.id} className="mp-my-card">
              <div className="mp-my-card__info">
                <h3>{p.name}</h3>
                <span className="mp-my-card__meta">{p.category} · {p.difficulty} · {p.durationWeeks}w · ${p.price}</span>
                <span className="mp-my-card__stats">★ {p.rating.toFixed(1)} · {p.enrollmentCount} enrolled</span>
              </div>
              <div className="mp-my-card__actions">
                <button
                  className={`vf-btn vf-btn--sm ${p.isPublished ? 'vf-btn--ghost' : 'vf-btn--primary'}`}
                  onClick={() => dispatch(togglePublish(p.id))}
                >
                  {p.isPublished ? 'Unpublish' : 'Publish'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreate && <CreateProgramForm onClose={() => setShowCreate(false)} />}
    </div>
  );
}

// ─── Main Marketplace Page ───────────────────────────────────
const CATEGORIES: ProgramCategory[] = ['strength', 'hypertrophy', 'weight-loss', 'endurance', 'powerlifting', 'bodybuilding', 'athletic', 'general'];

export function Marketplace() {
  const dispatch = useAppDispatch();
  const { programs, selected, status } = useAppSelector((s) => s.marketplace);
  const [tab, setTab] = useState<'browse' | 'mine'>('browse');
  const [category, setCategory] = useState<string>('');
  const [sort, setSort] = useState('popular');

  useEffect(() => {
    if (tab === 'browse') {
      dispatch(fetchPrograms({ category: category || undefined, sort }));
    }
  }, [dispatch, tab, category, sort]);

  const handleSelect = (id: string) => {
    dispatch(fetchProgramDetail(id));
  };

  return (
    <div className="mp-page">
      <div className="mp-page__header">
        <h1>Coach Marketplace</h1>
        <p className="mp-page__subtitle">Discover expert-crafted training programs or share your own</p>
      </div>

      <div className="mp-tabs">
        <button className={`mp-tab ${tab === 'browse' ? 'mp-tab--active' : ''}`} onClick={() => setTab('browse')}>
          Browse Programs
        </button>
        <button className={`mp-tab ${tab === 'mine' ? 'mp-tab--active' : ''}`} onClick={() => setTab('mine')}>
          My Programs
        </button>
      </div>

      {tab === 'browse' ? (
        <>
          <div className="mp-filters">
            <div className="mp-filter-group">
              <button
                className={`mp-filter-chip ${category === '' ? 'mp-filter-chip--active' : ''}`}
                onClick={() => setCategory('')}
              >
                All
              </button>
              {CATEGORIES.map((c) => (
                <button
                  key={c}
                  className={`mp-filter-chip ${category === c ? 'mp-filter-chip--active' : ''}`}
                  onClick={() => setCategory(c)}
                >
                  {c.replace('-', ' ')}
                </button>
              ))}
            </div>
            <select className="mp-sort" value={sort} onChange={(e) => setSort(e.target.value)}>
              <option value="popular">Most Popular</option>
              <option value="rating">Top Rated</option>
              <option value="newest">Newest</option>
              <option value="price">Lowest Price</option>
            </select>
          </div>

          {status === 'loading' && (
            <div className="mp-loading">
              {[1, 2, 3, 4, 5, 6].map((i) => <div key={i} className="mp-skeleton" />)}
            </div>
          )}

          {status === 'succeeded' && programs.length === 0 && (
            <div className="mp-empty">
              <p>No programs found. Check back soon or create your own!</p>
            </div>
          )}

          <div className="mp-grid">
            {programs.map((p) => (
              <ProgramCard key={p.id} program={p} onSelect={handleSelect} />
            ))}
          </div>
        </>
      ) : (
        <MyPrograms />
      )}

      {selected && (
        <ProgramDetailPanel
          program={selected}
          onClose={() => dispatch(clearSelected())}
        />
      )}
    </div>
  );
}
