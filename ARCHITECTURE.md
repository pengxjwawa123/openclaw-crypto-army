# OpenClaw Control Center - System Architecture

## High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                          CLIENT BROWSER                             │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                    React Frontend (SPA)                       │  │
│  │  ┌─────────────┐  ┌──────────────┐  ┌──────────────────┐    │  │
│  │  │  Dashboard  │  │   Bot Cards  │  │  Create/Logs UI  │    │  │
│  │  └──────┬──────┘  └──────┬───────┘  └────────┬─────────┘    │  │
│  │         │                 │                    │              │  │
│  │         └─────────────────┴────────────────────┘              │  │
│  │                           │                                   │  │
│  │              ┌────────────┴──────────────┐                   │  │
│  │              │                            │                   │  │
│  │         [HTTP/REST]               [WebSocket]                │  │
│  └─────────────┬────────────────────────┬───────────────────────┘  │
└────────────────┼────────────────────────┼──────────────────────────┘
                 │                        │
                 │                        │
┌────────────────▼────────────────────────▼──────────────────────────┐
│                     EXPRESS.JS BACKEND                              │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                      HTTP Layer                               │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────────┐  │  │
│  │  │   CORS   │  │   JSON   │  │  Static  │  │   Routes    │  │  │
│  │  │ Middleware│ │  Parser  │  │  Files   │  │  /api/bots  │  │  │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────┬──────┘  │  │
│  └───────────────────────────────────────────────────┼──────────┘  │
│                                                       │              │
│  ┌────────────────────────────────────────────────────▼──────────┐ │
│  │                   Core Services Layer                         │ │
│  │                                                                │ │
│  │  ┌──────────────────┐  ┌──────────────────┐  ┌────────────┐ │ │
│  │  │ DockerManager    │  │ WebSocketService │  │  Database  │ │ │
│  │  │                  │  │                  │  │  (lowdb)   │ │ │
│  │  │ - Create/Remove  │  │ - Connections    │  │            │ │ │
│  │  │ - Start/Stop     │  │ - Broadcasting   │  │ - Bot      │ │ │
│  │  │ - Monitoring     │  │ - Events         │  │   Configs  │ │ │
│  │  │ - Stats          │  │                  │  │ - Persist  │ │ │
│  │  └────────┬─────────┘  └────────▲─────────┘  └────────────┘ │ │
│  │           │                     │                             │ │
│  │           │     Event Emitter   │                             │ │
│  │           └─────────────────────┘                             │ │
│  └───────────────────┬──────────────────────────────────────────┘ │
└─────────────────────┼─────────────────────────────────────────────┘
                      │ dockerode
                      │ /var/run/docker.sock
┌─────────────────────▼─────────────────────────────────────────────┐
│                     DOCKER ENGINE                                  │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │              Docker Network: openclaw-network                 │ │
│  │                    (bridge, isolated)                         │ │
│  │                                                                │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │ │
│  │  │ OpenClaw Bot │  │ OpenClaw Bot │  │ OpenClaw Bot │       │ │
│  │  │   Container  │  │   Container  │  │   Container  │       │ │
│  │  │              │  │              │  │              │       │ │
│  │  │ Labels:      │  │ Labels:      │  │ Labels:      │       │ │
│  │  │ - bot.id     │  │ - bot.id     │  │ - bot.id     │       │ │
│  │  │ - bot.name   │  │ - bot.name   │  │ - bot.name   │       │ │
│  │  │ - managed    │  │ - managed    │  │ - managed    │       │ │
│  │  │              │  │              │  │              │       │ │
│  │  │ Restart:     │  │ Restart:     │  │ Restart:     │       │ │
│  │  │ unless-      │  │ unless-      │  │ unless-      │       │ │
│  │  │ stopped      │  │ stopped      │  │ stopped      │       │ │
│  │  └──────────────┘  └──────────────┘  └──────────────┘       │ │
│  │                                                                │ │
│  │  Network Isolation: No inter-container communication unless   │ │
│  │  explicitly configured. Each bot operates independently.      │ │
│  └──────────────────────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────────────────────┘
```

## Core Components

### 1. Frontend Layer (React SPA)

**Responsibilities:**
- Render bot management UI
- Display real-time status updates
- Handle user interactions (CRUD operations)
- Maintain WebSocket connection
- Cache bot state locally

**Key Modules:**
- `App.tsx` - Main orchestrator, manages global state
- `BotCard.tsx` - Individual bot display with controls
- `CreateBotModal.tsx` - Bot creation form
- `LogsModal.tsx` - Container log viewer
- `useWebSocket.ts` - WebSocket connection lifecycle
- `api.ts` - HTTP client for REST operations

**State Management:**
- React hooks (useState, useEffect)
- WebSocket data merges with REST data
- Local state updated on WebSocket events

### 2. Backend Layer (Express + TypeScript)

**Responsibilities:**
- Expose REST API for bot management
- Manage Docker container lifecycle
- Broadcast real-time updates via WebSocket
- Persist bot configurations
- Authenticate Docker operations (future: add auth middleware)

**Key Modules:**

#### a) DockerManager Service
```
Responsibilities:
- Container lifecycle (create, start, stop, restart, remove)
- Image management (pull if not exists)
- Network management (ensure openclaw-network exists)
- Stats collection (CPU, memory, uptime)
- Log retrieval
- Event emission for state changes

Critical Methods:
- createBot(config) → containerId
- startBot(botId) → void
- stopBot(botId) → void
- restartBot(botId) → void
- removeBot(botId) → void
- getBotStatus(botId) → BotStatus
- getAllBotStatuses() → BotStatus[]
- getBotLogs(botId, tail) → string[]

Internal Monitoring:
- setInterval(5000ms) for bulk status polling
- Emits 'bot:status:bulk' event every 5 seconds
- Emits individual events: 'bot:created', 'bot:removed', 'bot:error'
```

#### b) WebSocketService
```
Responsibilities:
- Manage WebSocket connections
- Subscribe to DockerManager events
- Broadcast updates to all connected clients
- Handle client lifecycle (connect, disconnect)
- Send initial state on connection

Event Handlers:
- DockerManager.on('bot:status:bulk') → broadcast to all clients
- DockerManager.on('bot:created') → broadcast creation event
- DockerManager.on('bot:removed') → broadcast removal event
- DockerManager.on('bot:error') → broadcast error event
- DockerManager.on('bot:started/stopped/restarted') → fetch status and broadcast

WebSocket Protocol:
Client → Server:
  { type: 'ping' } → keepalive check

Server → Client:
  { type: 'bot:status', data: BotStatus[] } → status updates
  { type: 'bot:created', data: { id, containerId } } → new bot
  { type: 'bot:removed', data: { id } } → deleted bot
  { type: 'bot:error', data: { id, error } } → error occurred
```

#### c) Database Service (lowdb)
```
Responsibilities:
- Persist bot configurations to JSON file
- CRUD operations on bot configs
- Atomic file writes
- Auto-create data directory

Schema:
{
  "bots": [
    {
      "id": "uuid",
      "name": "bot-name",
      "image": "openclaw/bot:latest",
      "env": { "KEY": "value" },
      "volumes": [{ "source": "/host", "target": "/container" }],
      "createdAt": 1234567890,
      "updatedAt": 1234567890
    }
  ]
}

Storage Location:
- Development: ./data/db.json
- Production: /app/data/db.json (volume mounted)
```

#### d) REST API Routes
```
GET    /api/bots              → List all bots (config + status)
GET    /api/bots/:id          → Get single bot details
POST   /api/bots              → Create new bot
PATCH  /api/bots/:id          → Update bot config (requires restart)
DELETE /api/bots/:id          → Remove bot and container

POST   /api/bots/:id/start    → Start stopped bot
POST   /api/bots/:id/stop     → Stop running bot
POST   /api/bots/:id/restart  → Restart bot

GET    /api/bots/:id/logs     → Get container logs (query: ?tail=100)

GET    /api/health            → Health check endpoint
```

### 3. Docker Layer

**Responsibilities:**
- Container runtime
- Network isolation
- Resource management
- Log collection
- Stats API

**Container Configuration:**
```javascript
{
  name: 'openclaw-bot-{uuid}',
  image: 'openclaw/bot:latest',

  // Labels for identification
  labels: {
    'openclaw.bot.id': '{uuid}',
    'openclaw.bot.name': 'user-defined-name',
    'openclaw.bot.managed': 'true'
  },

  // Network isolation
  networkMode: 'openclaw-network',

  // Auto-restart policy
  restartPolicy: {
    name: 'unless-stopped'
  },

  // Environment variables
  env: ['KEY=value', ...],

  // Volume mounts (optional)
  binds: ['/host/path:/container/path']
}
```

**Network: openclaw-network**
```
Type: bridge
Driver: bridge
Internal: false (allows external internet access)

Isolation:
- Each bot container is isolated from others by default
- No inter-container communication unless explicitly linked
- Containers can access external internet
- Control center container NOT on this network (communicates via Docker socket)
```

## Data Flow Diagrams

### 1. Bot Creation Flow

```
User clicks "Create Bot"
       │
       ▼
[CreateBotModal] - User fills form
       │
       ▼
POST /api/bots
  { name, image, env }
       │
       ▼
[BotRouter] - Validates input
       │
       ▼
[Database.saveBotConfig] - Persist config
       │
       ▼
[DockerManager.createBot]
       │
       ├─► Pull image (if not exists)
       │
       ├─► Create container
       │   - Apply labels
       │   - Set network
       │   - Set restart policy
       │
       ├─► Start container
       │
       └─► Emit 'bot:created' event
              │
              ▼
       [WebSocketService] - Broadcast to all clients
              │
              ▼
       [Frontend] - Receives WebSocket message
              │
              ▼
       [App.tsx] - Calls loadBots() to refresh list
              │
              ▼
       UI updates with new bot
```

### 2. Real-Time Status Update Flow

```
Every 5 seconds:

[DockerManager] - setInterval timer fires
       │
       ▼
Call docker.listContainers()
  Filter by label: openclaw.bot.managed=true
       │
       ▼
For each container:
  - Get container.inspect() → state, uptime
  - Get container.stats() → CPU, memory
       │
       ▼
Build BotStatus[] array
       │
       ▼
Emit 'bot:status:bulk' event
       │
       ▼
[WebSocketService] - Receives event
       │
       ▼
Broadcast to all connected WebSocket clients
  { type: 'bot:status', data: BotStatus[] }
       │
       ▼
[Frontend useWebSocket] - Receives message
       │
       ▼
Update botStatuses Map
       │
       ▼
useEffect triggers in App.tsx
       │
       ▼
Merge statuses with existing bots
       │
       ▼
React re-renders affected BotCards
       │
       ▼
UI shows updated CPU, memory, uptime
```

### 3. Bot Control Flow (Start/Stop/Restart)

```
User clicks "Stop" button
       │
       ▼
[BotCard] - Calls onStop handler
       │
       ▼
POST /api/bots/:id/stop
       │
       ▼
[BotRouter] - Validates bot exists
       │
       ▼
[DockerManager.stopBot]
       │
       ├─► Find container by label
       │
       ├─► Call container.stop()
       │
       └─► Emit 'bot:stopped' event
              │
              ▼
       [WebSocketService] - Receives event
              │
              ├─► Fetch current status
              │
              └─► Broadcast status update
                     │
                     ▼
              [Frontend] - Receives update
                     │
                     ▼
              BotCard state changes to 'stopped'
              Buttons change (Show "Start" instead of "Stop")
```

### 4. Log Retrieval Flow

```
User clicks "Logs" button
       │
       ▼
[BotCard] - Opens LogsModal
       │
       ▼
GET /api/bots/:id/logs?tail=200
       │
       ▼
[DockerManager.getBotLogs]
       │
       ├─► Find container by label
       │
       ├─► Call container.logs({ tail: 200 })
       │
       └─► Return string[]
              │
              ▼
       [LogsModal] - Display logs
              │
              ▼
       User can click refresh to fetch new logs
```

## Bot Isolation Guarantees

### 1. Network Isolation

**Docker Bridge Network:**
```
openclaw-network (bridge mode)
  │
  ├─► Bot Container 1 (isolated)
  ├─► Bot Container 2 (isolated)
  └─► Bot Container N (isolated)

By default:
- No inter-container communication
- Each bot has own IP in subnet
- No port conflicts (isolated namespaces)
- Can access external internet
```

**Control Center Isolation:**
```
Control Center Container:
  - NOT connected to openclaw-network
  - Communicates with Docker Engine via /var/run/docker.sock
  - Cannot be accessed by bot containers
  - Manages bots out-of-band
```

### 2. Resource Isolation

**Container-level isolation:**
- Each bot runs in its own container
- Separate PID namespace
- Separate filesystem namespace
- Separate network namespace
- Independent resource limits (future: add CPU/memory limits)

**Restart Policy:**
```
restartPolicy: { name: 'unless-stopped' }

Behavior:
- Bot crashes → automatically restarts
- Bot manually stopped → stays stopped
- Docker daemon restarts → bot restarts (if was running)
- Control center crash → bots continue running independently
```

### 3. Identification Isolation

**Container Labels:**
```javascript
{
  'openclaw.bot.id': 'unique-uuid',           // Never conflicts
  'openclaw.bot.name': 'user-defined-name',   // Can duplicate
  'openclaw.bot.managed': 'true'              // Identifies managed containers
}
```

**Guarantees:**
- Bot ID (UUID) ensures uniqueness
- Container name prefixed: `openclaw-bot-{uuid}`
- Docker prevents container name conflicts
- All operations use bot ID, not name

### 4. Data Isolation

**Configuration Storage:**
- Each bot config stored separately in database
- Bot deletion removes both container AND config
- No shared volumes between bots (unless explicitly configured)

**Log Isolation:**
- Each container has independent log storage
- Docker handles log rotation
- Logs retrieved per-container, never mixed

## Real-Time Status Delivery

### 1. WebSocket Architecture

**Connection Lifecycle:**
```
Client connects → /ws endpoint
       │
       ▼
WebSocketService adds to clients set
       │
       ▼
Send initial state (all bot statuses)
       │
       ▼
Connection maintained (heartbeat via 'ping'/'pong')
       │
       ├─► Receives updates every 5 seconds
       ├─► Receives event-driven updates (create/remove)
       ├─► Receives error notifications
       │
       ▼
Client disconnects
       │
       ▼
WebSocketService removes from clients set
       │
       ▼
Auto-reconnect after 3 seconds (frontend)
```

### 2. Monitoring Strategy

**Polling Approach:**
```
Why not event-driven from Docker?
- Docker Events API is complex and unreliable for stats
- Stats require active polling (no push mechanism)
- 5-second interval balances freshness vs. overhead

Monitoring Loop (every 5 seconds):
1. List all containers with label filter
2. For each container:
   - Inspect for state/uptime
   - Get stats for CPU/memory
3. Build complete BotStatus[] array
4. Emit to WebSocketService
5. Broadcast to all clients

Cost:
- N containers = N inspect calls + N stats calls
- Runs in background, non-blocking
- Stats call uses stream: false for single snapshot
```

**Event-Driven Approach (for state changes):**
```
Critical state changes emit events immediately:
- Bot created → instant notification
- Bot removed → instant notification
- Bot error → instant notification
- Start/Stop/Restart → instant status fetch and broadcast

No waiting for 5-second interval for user-initiated actions.
```

### 3. Status Data Structure

**BotStatus Interface:**
```typescript
{
  id: string;              // Bot UUID
  name: string;            // Display name
  containerId: string;     // Docker container ID
  state: 'running' | 'stopped' | 'paused' | 'error' | 'creating' | 'removing';
  status: string;          // Docker status string
  uptime: number;          // Milliseconds since start
  cpu: number;             // Percentage (0-100 per core)
  memory: number;          // Percentage (0-100)
  logs: string[];          // Not sent via WebSocket (too large)
  error: string;           // Error message if state === 'error'
}
```

**Computed Fields:**
```
uptime: Date.now() - new Date(container.State.StartedAt).getTime()
cpu: (cpuDelta / systemDelta) * numCores * 100
memory: (memoryUsage / memoryLimit) * 100
state: Mapped from Docker state (Running/Paused/Dead/Stopped)
```

### 4. Frontend State Synchronization

**Merge Strategy:**
```typescript
// Initial load via REST API
const bots = await api.getBots();  // Contains config + status

// WebSocket updates override status portion
useEffect(() => {
  if (botStatuses.size > 0) {
    setBots(prevBots =>
      prevBots.map(bot => {
        const status = botStatuses.get(bot.id);
        return status ? { ...bot, status } : bot;
      })
    );
  }
}, [botStatuses]);

// Result: Config persists, status updates in real-time
```

**Conflict Resolution:**
- WebSocket status always wins over stale REST data
- Bot deletions: Remove from list on 'bot:removed' event
- Bot creations: Trigger full refresh via REST API
- Network failures: Auto-reconnect with exponential backoff

## Scalability Considerations

### Current Design Limits
- Single-server architecture
- In-memory WebSocket connection tracking
- JSON file database (lowdb)
- No horizontal scaling

### Suitable For:
- 1-100 bot instances
- 1-50 concurrent UI users
- Single Docker host

### Future Enhancements:
1. **Multi-host support:**
   - Connect to multiple Docker hosts
   - Label bots with host identifier
   - Route operations to correct host

2. **Persistent message queue:**
   - Replace event emitter with Redis pub/sub
   - Enable multiple backend instances
   - WebSocket session affinity via load balancer

3. **Database upgrade:**
   - Replace lowdb with PostgreSQL/MongoDB
   - Enable complex queries (filter, search, tags)
   - Add audit logging

4. **Authentication:**
   - Add JWT-based auth
   - Role-based access control (admin/viewer)
   - Secure WebSocket with token validation

5. **Resource limits:**
   - Add CPU/memory limits per bot
   - Prevent resource exhaustion
   - Fair scheduling

## Security Model

### Current Implementation
- No authentication (trust localhost access)
- Docker socket access (full control)
- Bot containers isolated (no inter-communication)
- Control center in separate network

### Deployment Requirements
- Run control center in trusted environment
- Use reverse proxy (nginx/caddy) for TLS + auth
- Mount Docker socket read-only if possible
- Use secrets for sensitive env vars (not implemented)

### Risk Mitigation
- Bot containers use `unless-stopped` restart policy (limits DoS)
- No exposed ports from bot containers to host
- Container names prefixed to avoid conflicts
- Label-based filtering prevents managing non-OpenClaw containers

## Failure Modes & Recovery

### Backend Crash
```
Impact: WebSocket disconnected, no new operations
Recovery:
  - Frontend auto-reconnects after 3 seconds
  - Bot containers continue running (Docker restarts them)
  - On backend restart, loads config from database
  - WebSocket clients reconnect and receive fresh state
```

### Docker Daemon Crash
```
Impact: All containers stop
Recovery:
  - Docker restarts containers with 'unless-stopped' policy
  - Backend detects status change on next poll
  - WebSocket broadcasts updated states
  - UI shows containers restarting → running
```

### Database Corruption
```
Impact: Cannot load/save bot configs
Recovery:
  - Backend fails to start (intentional fail-fast)
  - Manual intervention: restore from backup or delete data/db.json
  - Containers still running, can be managed manually via Docker CLI
```

### Network Partition
```
Impact: Frontend cannot reach backend
Recovery:
  - WebSocket auto-reconnect (3s interval)
  - REST API calls fail, show error to user
  - Bot containers unaffected (isolated from control plane)
```

## Maintenance & Operations

### Logs
```
Backend: stdout (JSON logs recommended)
Bot Containers: Docker logs (accessible via UI)
Frontend: Browser console
```

### Monitoring Hooks
```
GET /api/health → { status: 'ok', timestamp, version }

Future:
- Prometheus metrics endpoint
- Bot success/failure rates
- WebSocket connection count
- Container stats aggregation
```

### Backup Strategy
```
Critical Data: /app/data/db.json

Backup:
  - Volume mount to host filesystem
  - Periodic copy to backup location
  - Git commit database file (if small)

Restore:
  - Replace db.json with backup
  - Restart control center
  - Existing containers remain, configs restored
```

### Upgrade Path
```
1. Stop control center
2. Bot containers continue running
3. Pull new control center image
4. Start new version
5. Reconnects to existing bot containers via labels
6. Zero downtime for bot operations
```

## Conclusion

This architecture provides:
- ✅ Isolated bot execution (Docker networks + namespaces)
- ✅ Real-time monitoring (WebSocket + polling hybrid)
- ✅ Persistent configuration (JSON database)
- ✅ Reliable container management (dockerode + restart policies)
- ✅ Responsive UI (React + Tailwind)
- ✅ Production-ready deployment (Docker multi-stage build)

Trade-offs:
- Single-server limitation (acceptable for 1-100 bots)
- 5-second status delay (acceptable for monitoring use case)
- No authentication (add reverse proxy for production)
- JSON file database (sufficient for configuration storage)

The design prioritizes correctness, simplicity, and maintainability over premature optimization.
