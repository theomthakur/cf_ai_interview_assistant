// workers/src/index.ts
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { handleAIRequest } from './ai-handler';
import { InterviewSession } from './durable-objects/InterviewSession';

export { InterviewSession };

type Bindings = {
  AI: any;
  INTERVIEW_SESSION: any;
  INTERVIEW_HISTORY: any;
  DB: any;
};

const app = new Hono<{ Bindings: Bindings }>();

// WebSocket route MUST come BEFORE CORS middleware
// This prevents CORS from trying to modify WebSocket upgrade responses
app.get('/api/ws', async (c) => {
  const upgradeHeader = c.req.header('Upgrade');
  if (!upgradeHeader || upgradeHeader !== 'websocket') {
    return c.text('Expected WebSocket', 426);
  }
  
  const sessionId = c.req.query('sessionId');
  if (!sessionId) {
    return c.text('Session ID required', 400);
  }
  
  const id = c.env.INTERVIEW_SESSION.idFromName(sessionId);
  const session = c.env.INTERVIEW_SESSION.get(id);
  
  // Forward the WebSocket request directly to Durable Object
  return session.fetch(c.req.raw);
});

// Apply CORS to all other routes
app.use('/*', cors({
  origin: ['http://localhost:3000',
  'https://cf-ai-interview-frontend.pages.dev',
  'https://8c2e7a52.cf-ai-interview-frontend.pages.dev'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

// Health check
app.get('/health', (c) => {
  return c.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Create new interview session
app.post('/api/session/create', async (c) => {
  const { userId, interviewType } = await c.req.json();
  
  const sessionId = crypto.randomUUID();
  
  const id = c.env.INTERVIEW_SESSION.idFromName(sessionId);
  const session = c.env.INTERVIEW_SESSION.get(id);
  
  const response = await session.fetch(new Request('http://internal/init', {
    method: 'POST',
    body: JSON.stringify({ userId, interviewType, sessionId })
  }));
  
  return c.json(await response.json());
});

// Handle interview messages
app.post('/api/interview/message', async (c) => {
  const { sessionId, message, userId } = await c.req.json();
  
  const id = c.env.INTERVIEW_SESSION.idFromName(sessionId);
  const session = c.env.INTERVIEW_SESSION.get(id);
  
  // Process message through AI
  const aiResponse = await handleAIRequest(c.env.AI, {
    message,
    context: 'technical_interview',
    sessionId
  });
  
  // Store in session
  await session.fetch(new Request('http://internal/message', {
    method: 'POST',
    body: JSON.stringify({ message, response: aiResponse })
  }));
  
  // Store in KV for history
  await c.env.INTERVIEW_HISTORY.put(
    `${userId}:${sessionId}:${Date.now()}`,
    JSON.stringify({ message, response: aiResponse }),
    { expirationTtl: 60 * 60 * 24 * 30 }
  );
  
  return c.json({ response: aiResponse });
});

// Get interview questions from database
app.get('/api/questions/:category', async (c) => {
  const category = c.req.param('category');
  
  try {
    const questions = await c.env.DB.prepare(
      'SELECT * FROM questions WHERE category = ? ORDER BY RANDOM() LIMIT 5'
    ).bind(category).all();
    
    return c.json({ questions: questions.results || [] });
  } catch (error) {
    console.error('Database error:', error);
    return c.json({ 
      questions: [{
        id: 1,
        category,
        title: "Sample Interview Question",
        description: "This is a sample question while database is being set up",
        difficulty: "medium"
      }] 
    });
  }
});

export default app;