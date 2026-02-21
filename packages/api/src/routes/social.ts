import { Router } from 'express';
import { z } from 'zod';
import { eq, and, desc, inArray, sql, count } from 'drizzle-orm';
import { db, schema } from '@vibefit/core';
import { authenticate } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';

export const socialRouter = Router();
socialRouter.use(authenticate);

// ─── POST /social/follow/:userId ─────────────────────────────
socialRouter.post('/follow/:userId', async (req, res, next) => {
  try {
    const targetId = req.params.userId as string;
    if (targetId === req.userId) throw new AppError(400, 'INVALID', 'Cannot follow yourself');

    // Verify target user exists
    const [target] = await db.select({ id: schema.users.id })
      .from(schema.users).where(eq(schema.users.id, targetId)).limit(1);
    if (!target) throw new AppError(404, 'NOT_FOUND', 'User not found');

    await db.insert(schema.follows).values({
      followerId: req.userId!,
      followingId: targetId,
    }).onConflictDoNothing();

    res.json({ success: true, data: { following: true } });
  } catch (err) {
    next(err);
  }
});

// ─── DELETE /social/follow/:userId ───────────────────────────
socialRouter.delete('/follow/:userId', async (req, res, next) => {
  try {
    const targetId = req.params.userId as string;
    await db.delete(schema.follows).where(and(
      eq(schema.follows.followerId, req.userId!),
      eq(schema.follows.followingId, targetId),
    ));
    res.json({ success: true, data: { following: false } });
  } catch (err) {
    next(err);
  }
});

// ─── GET /social/following ───────────────────────────────────
socialRouter.get('/following', async (req, res, next) => {
  try {
    const rows = await db.select({
      userId: schema.users.id,
      name: schema.users.name,
      avatarUrl: schema.users.avatarUrl,
      followedAt: schema.follows.createdAt,
    })
      .from(schema.follows)
      .innerJoin(schema.users, eq(schema.follows.followingId, schema.users.id))
      .where(eq(schema.follows.followerId, req.userId!))
      .orderBy(desc(schema.follows.createdAt));

    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
});

// ─── GET /social/followers ───────────────────────────────────
socialRouter.get('/followers', async (req, res, next) => {
  try {
    const rows = await db.select({
      userId: schema.users.id,
      name: schema.users.name,
      avatarUrl: schema.users.avatarUrl,
      followedAt: schema.follows.createdAt,
    })
      .from(schema.follows)
      .innerJoin(schema.users, eq(schema.follows.followerId, schema.users.id))
      .where(eq(schema.follows.followingId, req.userId!))
      .orderBy(desc(schema.follows.createdAt));

    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
});

// ─── GET /social/feed ────────────────────────────────────────
// Get feed: own posts + posts from people I follow (followers visibility)
socialRouter.get('/feed', async (req, res, next) => {
  try {
    // Get who I follow
    const followingRows = await db.select({ followingId: schema.follows.followingId })
      .from(schema.follows)
      .where(eq(schema.follows.followerId, req.userId!));
    const followingIds = followingRows.map((r) => r.followingId);
    const feedUserIds = [req.userId!, ...followingIds];

    const posts = await db.select({
      id: schema.feedPosts.id,
      userId: schema.feedPosts.userId,
      type: schema.feedPosts.type,
      content: schema.feedPosts.content,
      metadata: schema.feedPosts.metadata,
      visibility: schema.feedPosts.visibility,
      createdAt: schema.feedPosts.createdAt,
      userName: schema.users.name,
      userAvatar: schema.users.avatarUrl,
    })
      .from(schema.feedPosts)
      .innerJoin(schema.users, eq(schema.feedPosts.userId, schema.users.id))
      .where(inArray(schema.feedPosts.userId, feedUserIds))
      .orderBy(desc(schema.feedPosts.createdAt))
      .limit(50);

    // Count kudos and comments per post
    const postIds = posts.map((p) => p.id);
    let kudosCounts: Record<string, number> = {};
    let commentCounts: Record<string, number> = {};

    if (postIds.length > 0) {
      const kRows = await db.select({
        postId: schema.kudos.postId,
        c: count(),
      }).from(schema.kudos)
        .where(inArray(schema.kudos.postId, postIds))
        .groupBy(schema.kudos.postId);
      kudosCounts = Object.fromEntries(kRows.map((r) => [r.postId, Number(r.c)]));

      const cRows = await db.select({
        postId: schema.comments.postId,
        c: count(),
      }).from(schema.comments)
        .where(inArray(schema.comments.postId, postIds))
        .groupBy(schema.comments.postId);
      commentCounts = Object.fromEntries(cRows.map((r) => [r.postId, Number(r.c)]));

      // Did I kudos?
      const myKudos = await db.select({ postId: schema.kudos.postId })
        .from(schema.kudos)
        .where(and(
          inArray(schema.kudos.postId, postIds),
          eq(schema.kudos.userId, req.userId!),
        ));
      const myKudosSet = new Set(myKudos.map((r) => r.postId));

      const enrichedPosts = posts.map((p) => ({
        ...p,
        kudosCount: kudosCounts[p.id] ?? 0,
        commentCount: commentCounts[p.id] ?? 0,
        hasKudos: myKudosSet.has(p.id),
      }));

      res.json({ success: true, data: enrichedPosts });
      return;
    }

    res.json({ success: true, data: posts.map((p) => ({ ...p, kudosCount: 0, commentCount: 0, hasKudos: false })) });
  } catch (err) {
    next(err);
  }
});

// ─── POST /social/posts ──────────────────────────────────────
const postSchema = z.object({
  type: z.enum(['workout_complete', 'pr', 'achievement', 'streak_milestone', 'general']),
  content: z.string().max(500).optional(),
  metadata: z.record(z.unknown()).optional(),
  visibility: z.enum(['public', 'followers', 'private']).optional(),
});

socialRouter.post('/posts', async (req, res, next) => {
  try {
    const body = postSchema.parse(req.body);
    const [post] = await db.insert(schema.feedPosts).values({
      userId: req.userId!,
      type: body.type,
      content: body.content ?? null,
      metadata: body.metadata ?? {},
      visibility: body.visibility ?? 'followers',
    }).returning();

    res.status(201).json({ success: true, data: post });
  } catch (err) {
    next(err);
  }
});

// ─── POST /social/posts/:id/kudos ────────────────────────────
socialRouter.post('/posts/:id/kudos', async (req, res, next) => {
  try {
    const postId = req.params.id as string;
    await db.insert(schema.kudos).values({
      postId,
      userId: req.userId!,
    }).onConflictDoNothing();
    res.json({ success: true, data: { kudos: true } });
  } catch (err) {
    next(err);
  }
});

// ─── DELETE /social/posts/:id/kudos ──────────────────────────
socialRouter.delete('/posts/:id/kudos', async (req, res, next) => {
  try {
    const postId = req.params.id as string;
    await db.delete(schema.kudos).where(and(
      eq(schema.kudos.postId, postId),
      eq(schema.kudos.userId, req.userId!),
    ));
    res.json({ success: true, data: { kudos: false } });
  } catch (err) {
    next(err);
  }
});

// ─── GET /social/posts/:id/comments ──────────────────────────
socialRouter.get('/posts/:id/comments', async (req, res, next) => {
  try {
    const postId = req.params.id as string;
    const rows = await db.select({
      id: schema.comments.id,
      userId: schema.comments.userId,
      content: schema.comments.content,
      createdAt: schema.comments.createdAt,
      userName: schema.users.name,
      userAvatar: schema.users.avatarUrl,
    })
      .from(schema.comments)
      .innerJoin(schema.users, eq(schema.comments.userId, schema.users.id))
      .where(eq(schema.comments.postId, postId))
      .orderBy(schema.comments.createdAt);

    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
});

// ─── POST /social/posts/:id/comments ─────────────────────────
const commentSchema = z.object({
  content: z.string().min(1).max(500),
});

socialRouter.post('/posts/:id/comments', async (req, res, next) => {
  try {
    const postId = req.params.id as string;
    const body = commentSchema.parse(req.body);

    const [comment] = await db.insert(schema.comments).values({
      postId,
      userId: req.userId!,
      content: body.content,
    }).returning();

    res.status(201).json({ success: true, data: comment });
  } catch (err) {
    next(err);
  }
});

// ─── GET /social/search ─────────────────────────────────────
socialRouter.get('/search', async (req, res, next) => {
  try {
    const q = (req.query.q as string ?? '').trim();
    if (!q) return res.json({ success: true, data: [] });

    const users = await db.select({
      id: schema.users.id,
      name: schema.users.name,
      avatarUrl: schema.users.avatarUrl,
    })
      .from(schema.users)
      .where(sql`LOWER(${schema.users.name}) LIKE LOWER(${'%' + q + '%'})`)
      .limit(20);

    res.json({ success: true, data: users });
  } catch (err) {
    next(err);
  }
});
