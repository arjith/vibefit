import { describe, it, expect } from 'vitest';
import * as schema from './db/schema';

describe('schema', () => {
  it('exports all core tables', () => {
    expect(schema.users).toBeDefined();
    expect(schema.userProfiles).toBeDefined();
    expect(schema.exercises).toBeDefined();
    expect(schema.routines).toBeDefined();
    expect(schema.workoutSessions).toBeDefined();
  });

  it('exports social tables', () => {
    expect(schema.follows).toBeDefined();
    expect(schema.feedPosts).toBeDefined();
    expect(schema.kudos).toBeDefined();
    expect(schema.comments).toBeDefined();
  });

  it('exports marketplace tables', () => {
    expect(schema.coachPrograms).toBeDefined();
    expect(schema.programReviews).toBeDefined();
  });

  it('exports enterprise tables', () => {
    expect(schema.organizations).toBeDefined();
    expect(schema.orgMembers).toBeDefined();
  });
});
