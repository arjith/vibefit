import { eq, and, desc } from 'drizzle-orm';
import { db, schema } from '@vibefit/core';
import { getAdaptiveRecommendations } from './adaptiveDifficulty.js';
import { getUserAdherencePrediction } from './adherencePrediction.js';

export interface CoachMessage {
  role: 'user' | 'coach';
  content: string;
  timestamp: Date;
  context?: Record<string, unknown>;
}

interface UserContext {
  name: string;
  fitnessLevel: string;
  goals: string[];
  currentStreak: number;
  totalWorkouts: number;
  recentRpe: number | null;
  adherenceRisk: string;
  recommendations: string[];
}

/**
 * CascadeFlow AI Coach:
 * 1. First, try to answer from local context + rules (handles ~80% of queries)
 * 2. If complex, format a prompt for cloud LLM (Ollama local / Claude API)
 *
 * This implementation provides the rule-based local layer.
 * Cloud integration is opt-in via COACH_API_URL env var.
 */
export async function askCoach(
  userId: string,
  question: string,
  conversationHistory: CoachMessage[] = [],
): Promise<CoachMessage> {
  // 1. Gather user context
  const ctx = await gatherUserContext(userId);

  // 2. Try local rule-based response
  const localResponse = tryLocalResponse(question, ctx);
  if (localResponse) {
    return {
      role: 'coach',
      content: localResponse,
      timestamp: new Date(),
      context: { source: 'local', userContext: ctx },
    };
  }

  // 3. Try cloud LLM if configured
  const cloudUrl = process.env.COACH_API_URL;
  if (cloudUrl) {
    try {
      const cloudResponse = await callCloudLLM(cloudUrl, question, ctx, conversationHistory);
      return {
        role: 'coach',
        content: cloudResponse,
        timestamp: new Date(),
        context: { source: 'cloud' },
      };
    } catch {
      // Fall through to fallback
    }
  }

  // 4. Fallback: contextual generic response
  return {
    role: 'coach',
    content: generateFallbackResponse(question, ctx),
    timestamp: new Date(),
    context: { source: 'fallback' },
  };
}

async function gatherUserContext(userId: string): Promise<UserContext> {
  const [user] = await db.select({ name: schema.users.name })
    .from(schema.users)
    .where(eq(schema.users.id, userId))
    .limit(1);

  const [profile] = await db.select()
    .from(schema.userProfiles)
    .where(eq(schema.userProfiles.userId, userId))
    .limit(1);

  const [streak] = await db.select()
    .from(schema.streaks)
    .where(eq(schema.streaks.userId, userId))
    .limit(1);

  const workouts = await db.select({ rpe: schema.workoutSessions.rpe })
    .from(schema.workoutSessions)
    .where(and(
      eq(schema.workoutSessions.userId, userId),
      eq(schema.workoutSessions.status, 'completed'),
    ))
    .orderBy(desc(schema.workoutSessions.completedAt))
    .limit(5);

  const rpeSessions = workouts.filter((w) => w.rpe !== null);
  const recentRpe = rpeSessions.length > 0
    ? rpeSessions.reduce((sum, w) => sum + w.rpe!, 0) / rpeSessions.length
    : null;

  // Get adaptive recommendations
  let recommendations: string[] = [];
  try {
    const { recommendations: recs } = await getAdaptiveRecommendations(userId);
    recommendations = recs.map((r) => r.reason);
  } catch {
    // Non-critical
  }

  // Get adherence prediction
  let adherenceRisk = 'unknown';
  try {
    const pred = await getUserAdherencePrediction(userId);
    adherenceRisk = pred.riskLevel;
  } catch {
    // Non-critical
  }

  return {
    name: user?.name ?? 'there',
    fitnessLevel: profile?.fitnessLevel ?? 'beginner',
    goals: (profile?.goals as string[]) ?? [],
    currentStreak: streak?.currentStreak ?? 0,
    totalWorkouts: workouts.length,
    recentRpe,
    adherenceRisk,
    recommendations,
  };
}

/**
 * Local rule-based responses for common fitness queries.
 * Returns null if the question needs cloud processing.
 */
function tryLocalResponse(question: string, ctx: UserContext): string | null {
  const q = question.toLowerCase();

  // Plateau / stalling
  if (q.includes('plateau') || q.includes('stall') || q.includes('not progressing') || q.includes('stuck')) {
    const tips = [
      `Hey ${ctx.name}! Plateaus are a normal part of training.`,
      ctx.recentRpe && ctx.recentRpe >= 8
        ? 'Your recent RPE is high — a deload week could help you break through.'
        : 'Try varying your rep ranges: alternate between 5×5 heavy days and 3×12 volume days.',
      ctx.fitnessLevel === 'beginner'
        ? 'As a beginner, make sure you\'re eating enough protein (1.6-2.2g/kg) and sleeping 7-9 hours.'
        : 'Consider periodization: 3 weeks hard, 1 week deload.',
    ];
    if (ctx.recommendations.length > 0) {
      tips.push(`Based on your data: ${ctx.recommendations[0]}`);
    }
    return tips.join(' ');
  }

  // Recovery / rest / soreness
  if (q.includes('recover') || q.includes('sore') || q.includes('rest day') || q.includes('overtrain')) {
    return ctx.recentRpe && ctx.recentRpe >= 9
      ? `Your recent average RPE is ${ctx.recentRpe.toFixed(1)} — that's very high. Take 1-2 rest days, focus on sleep, hydration, and light stretching. Your body adapts during rest, not during workouts.`
      : `Recovery is key! Aim for 7-9 hours of sleep, 1.6g protein per kg bodyweight, and at least 1-2 rest days per week. Active recovery (walking, yoga) on off days helps too.`;
  }

  // Motivation / skip / don't feel like it
  if (q.includes('motivat') || q.includes('skip') || q.includes('don\'t feel') || q.includes('lazy')) {
    const streakMsg = ctx.currentStreak > 0
      ? `You've got a ${ctx.currentStreak}-day streak going — don't break it!`
      : 'Starting fresh today could be the beginning of your next big streak.';
    return `${streakMsg} Remember: a 15-minute workout beats no workout. Just show up, do 3 exercises, and you'll be glad you did. The hardest part is starting.`;
  }

  // Nutrition / diet / protein
  if (q.includes('eat') || q.includes('diet') || q.includes('protein') || q.includes('nutrition') || q.includes('calori')) {
    const goalAdvice = ctx.goals.includes('muscle-building')
      ? 'For muscle building, eat at a slight surplus (200-300 cal above maintenance) with 1.6-2.2g protein per kg.'
      : ctx.goals.includes('weight-loss')
        ? 'For fat loss, aim for a moderate deficit (300-500 cal below maintenance) while keeping protein high (2g/kg) to preserve muscle.'
        : 'A balanced diet with adequate protein (1.6g/kg minimum) supports any fitness goal.';
    return `${goalAdvice} Prioritize whole foods, stay hydrated, and time some protein within 2 hours of your workout.`;
  }

  // Form / technique
  if (q.includes('form') || q.includes('technique') || q.includes('how to do') || q.includes('correct way')) {
    return 'Good form is everything! Check the Form Cues on each exercise page for phase-by-phase coaching. Key principles: control the eccentric (lowering), brace your core, full range of motion, and never sacrifice form for weight.';
  }

  // Deload
  if (q.includes('deload') || q.includes('de-load') || q.includes('light week')) {
    return 'A deload week typically means reducing volume by 40-60% while maintaining intensity. Train with the same exercises at 60% of your working weights for 2-3 sets. This gives your joints, CNS, and muscles time to recover. Schedule one every 4-6 weeks or when RPE stays above 9 for multiple sessions.';
  }

  // Progress / how am I doing
  if (q.includes('progress') || q.includes('how am i') || q.includes('doing well') || q.includes('improve')) {
    const streakInfo = ctx.currentStreak > 0 ? `${ctx.currentStreak}-day streak 🔥` : 'no active streak yet';
    return `Here's your snapshot: ${streakInfo}, adherence risk is ${ctx.adherenceRisk}. ${ctx.recommendations.length > 0 ? ctx.recommendations[0] : 'Keep logging your workouts and RPE for more detailed insights!'}`;
  }

  // Not matched — needs cloud or fallback
  return null;
}

async function callCloudLLM(
  apiUrl: string,
  question: string,
  ctx: UserContext,
  history: CoachMessage[],
): Promise<string> {
  const systemPrompt = `You are VibeFit Coach, a friendly and knowledgeable fitness AI. 
User context: ${ctx.name}, ${ctx.fitnessLevel} level, goals: ${ctx.goals.join(', ') || 'general fitness'}, 
streak: ${ctx.currentStreak} days, recent RPE: ${ctx.recentRpe?.toFixed(1) ?? 'N/A'}, 
adherence risk: ${ctx.adherenceRisk}.
${ctx.recommendations.length > 0 ? `Current recommendations: ${ctx.recommendations.join('; ')}` : ''}
Keep responses concise (2-3 paragraphs max), practical, and encouraging.`;

  const messages = [
    { role: 'system', content: systemPrompt },
    ...history.slice(-6).map((m) => ({ role: m.role === 'coach' ? 'assistant' : 'user', content: m.content })),
    { role: 'user', content: question },
  ];

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages, max_tokens: 500, temperature: 0.7 }),
      signal: controller.signal,
    });

    if (!response.ok) throw new Error(`Cloud LLM returned ${response.status}`);

    const data = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
    return data.choices?.[0]?.message?.content ?? 'I couldn\'t generate a response. Try rephrasing your question.';
  } finally {
    clearTimeout(timeout);
  }
}

function generateFallbackResponse(_question: string, ctx: UserContext): string {
  return `Great question, ${ctx.name}! While I can answer specific topics like plateaus, recovery, nutrition, and motivation, this question needs a more detailed analysis. ` +
    `For now, here's what I know: you're at ${ctx.fitnessLevel} level with a ${ctx.currentStreak}-day streak. ` +
    (ctx.recommendations.length > 0
      ? `My current recommendation: ${ctx.recommendations[0]}`
      : 'Keep training consistently and logging your RPE for more personalized advice!');
}
