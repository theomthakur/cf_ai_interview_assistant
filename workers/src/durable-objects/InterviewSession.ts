// workers/src/durable-objects/InterviewSession.ts

interface SessionData {
  sessionId: string;
  userId: string;
  interviewType: string;
  messages: Array<{ message: string; response: any; timestamp: string }>;
  startTime: string;
  isActive: boolean;
}

export class InterviewSession {
  private state: any;
  private env: any;
  private sessionData: SessionData = {
    sessionId: '',
    userId: '',
    interviewType: '',
    messages: [],
    startTime: '',
    isActive: false
  };

  constructor(state: any, env: any) {
    this.state = state;
    this.env = env;
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    
    if (request.method === 'POST') {
      if (url.pathname === '/init') {
        return this.handleInit(request);
      } else if (url.pathname === '/message') {
        return this.handleMessage(request);
      }
    }
    
    if (request.method === 'GET') {
      if (url.pathname === '/session') {
        return this.handleGetSession();
      }
    }

    // Handle WebSocket upgrade
    if (request.headers.get('Upgrade') === 'websocket') {
      return this.handleWebSocket(request);
    }

    return new Response('Not Found', { status: 404 });
  }

  private async handleInit(request: Request): Promise<Response> {
    try {
      const { userId, interviewType, sessionId } = await request.json();
      
      this.sessionData = {
        sessionId,
        userId,
        interviewType,
        messages: [],
        startTime: new Date().toISOString(),
        isActive: true
      };

      // Store in Durable Object storage
      await this.state.storage.put('sessionData', this.sessionData);

      return new Response(JSON.stringify({
        success: true,
        sessionId,
        message: 'Session initialized successfully'
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Failed to initialize session'
      }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  private async handleMessage(request: Request): Promise<Response> {
    try {
      const { message, response } = await request.json();
      
      // Load existing session data
      const storedData = await this.state.storage.get('sessionData');
      if (storedData) {
        this.sessionData = storedData as SessionData;
      }

      // Add new message
      this.sessionData.messages.push({
        message,
        response,
        timestamp: new Date().toISOString()
      });

      // Save updated session data
      await this.state.storage.put('sessionData', this.sessionData);

      return new Response(JSON.stringify({
        success: true,
        messageCount: this.sessionData.messages.length
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Failed to store message'
      }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  private async handleGetSession(): Promise<Response> {
    try {
      const storedData = await this.state.storage.get('sessionData');
      const sessionData = storedData || this.sessionData;

      return new Response(JSON.stringify({
        success: true,
        session: sessionData
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Failed to retrieve session'
      }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  private handleWebSocket(request: Request): Response {
    // Create WebSocket pair using globalThis to access Cloudflare Workers WebSocket API
    const webSocketPair = new (globalThis as any).WebSocketPair();
    const client = webSocketPair[0];
    const server = webSocketPair[1];

    // Accept the WebSocket connection
    (server as any).accept();

    // Handle messages
    (server as any).addEventListener('message', (event: any) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === 'ping') {
          (server as any).send(JSON.stringify({ type: 'pong' }));
        } else if (data.type === 'message') {
          // Handle real-time message
          (server as any).send(JSON.stringify({
            type: 'response',
            data: { response: 'Message received and processed' }
          }));
        }
      } catch (error) {
        (server as any).send(JSON.stringify({
          type: 'error',
          error: 'Failed to process message'
        }));
      }
    });

    (server as any).addEventListener('close', () => {
      // Handle connection close
      console.log('WebSocket connection closed');
    });

    return new Response(null, {
      status: 101,
      // @ts-ignore - webSocket property exists in Cloudflare Workers
      webSocket: client,
    });
  }
}