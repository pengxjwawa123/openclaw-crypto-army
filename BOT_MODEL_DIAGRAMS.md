# Bot Data Model - Visual Diagrams

## Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         Bot (Logical Entity)                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌────────────────────────┐         ┌───────────────────────┐  │
│  │   BotConfig            │         │   BotStatus           │  │
│  │   (Persistent)         │         │   (Ephemeral)         │  │
│  ├────────────────────────┤         ├───────────────────────┤  │
│  │ id: UUID (PK)          │────────►│ id: UUID              │  │
│  │ name: string           │         │ name: string          │  │
│  │ image: string          │         │ containerId?: string  │  │
│  │ env: object            │         │ state: BotState       │  │
│  │ volumes?: array        │         │ status?: string       │  │
│  │ createdAt: timestamp   │         │ uptime?: number       │  │
│  │ updatedAt: timestamp   │         │ cpu?: number          │  │
│  └────────────────────────┘         │ memory?: number       │  │
│           │                          │ error?: string        │  │
│           │                          └───────────────────────┘  │
│           │ stored in                         │                 │
│           ▼                                   │ computed from   │
│  ┌────────────────────────┐                  │                 │
│  │  data/db.json          │                  │                 │
│  │  ────────────────       │                  ▼                 │
│  │  {                     │         ┌───────────────────────┐  │
│  │    "bots": [           │         │  Docker Container     │  │
│  │      {                 │         │  ───────────────      │  │
│  │        "id": "...",    │         │  name: openclaw-bot-  │  │
│  │        "name": "...",  │◄────────│        {botId}        │  │
│  │        ...             │  1:1    │  labels:              │  │
│  │      }                 │         │    openclaw.bot.id    │  │
│  │    ]                   │         │    openclaw.bot.name  │  │
│  │  }                     │         │    openclaw.bot.      │  │
│  └────────────────────────┘         │      managed=true     │  │
│                                      └───────────────────────┘  │
│                                               │                 │
└───────────────────────────────────────────────┼─────────────────┘
                                                │
                                                ▼
                                       Docker Engine API
                                       (inspect, stats, logs)
```

## Bot-Container Mapping

```
DATABASE                          DOCKER ENGINE
─────────                         ─────────────

BotConfig                         Container
┌──────────────────┐             ┌──────────────────────────┐
│ id: "f47ac..."   │────────────►│ name: "openclaw-bot-     │
│ name: "bot1"     │    1:1      │        f47ac..."         │
│ image: "oc:v1"   │             │                          │
│ env: {...}       │             │ Image: "oc:v1"           │
│ volumes: [...]   │             │ Env: ["K=V", ...]        │
│ createdAt: 1707  │             │ Labels:                  │
│ updatedAt: 1707  │             │   openclaw.bot.id:       │
└──────────────────┘             │     "f47ac..."           │
       │                         │   openclaw.bot.name:     │
       │                         │     "bot1"               │
       │                         │   openclaw.bot.managed:  │
       │                         │     "true"               │
       │                         │                          │
       │                         │ State:                   │
       │                         │   Running: true          │
       │                         │   Paused: false          │
       │                         │   Dead: false            │
       │                         │   StartedAt: "2024-..."  │
       └────────────────────────►│                          │
               maps to           │ Stats:                   │
                                 │   cpu_stats: {...}       │
                                 │   memory_stats: {...}    │
                                 └──────────────────────────┘
                                          │
                                          │ inspected to create
                                          ▼
                                 ┌──────────────────────────┐
                                 │ BotStatus                │
                                 │ ──────────               │
                                 │ id: "f47ac..."           │
                                 │ name: "bot1"             │
                                 │ containerId: "a1b2c3..." │
                                 │ state: "running"         │
                                 │ uptime: 7200000          │
                                 │ cpu: 15.3                │
                                 │ memory: 42.7             │
                                 └──────────────────────────┘
```

## Container Label Structure

```
Docker Container
┌─────────────────────────────────────────────────────────┐
│ Name: openclaw-bot-f47ac10b-58cc-4372-a567-0e02b2c3d479 │
│                                                          │
│ Labels:                                                  │
│ ┌──────────────────────────────────────────────────┐   │
│ │ Key                      Value                    │   │
│ ├──────────────────────────────────────────────────┤   │
│ │ openclaw.bot.id         "f47ac10b-58cc-..."      │   │  Used for:
│ │                          ^                        │   │  - Lookup by bot ID
│ │                          │                        │   │  - Reverse mapping
│ │                          Primary identifier       │   │  - Filter queries
│ │                                                   │   │
│ │ openclaw.bot.name       "trading-bot-1"          │   │  Used for:
│ │                          ^                        │   │  - Display in UI
│ │                          │                        │   │  - Logging
│ │                          Display name             │   │  - Debugging
│ │                                                   │   │
│ │ openclaw.bot.managed    "true"                   │   │  Used for:
│ │                          ^                        │   │  - List all managed
│ │                          │                        │   │  - Safety filter
│ │                          Management flag          │   │  - Prevent accidents
│ └──────────────────────────────────────────────────┘   │
│                                                          │
│ Image: openclaw/bot:latest                              │
│ State: Running                                           │
│ Network: openclaw-network                                │
│ RestartPolicy: unless-stopped                            │
└─────────────────────────────────────────────────────────┘
```

## State Transition Diagram

```
                    POST /api/bots
                    {name, image, env}
                           │
                           ▼
                    ┌─────────────┐
                    │  CREATING   │───────────┐
                    │             │           │ Pull image fails
                    │  - Generate │           │ Container create fails
                    │    bot ID   │           ▼
                    │  - Save DB  │      ┌─────────┐
                    │  - Pull img │      │  ERROR  │
                    │  - Create   │      └─────────┘
                    │  - Start    │
                    └──────┬──────┘
                           │ Success
                           ▼
         ┌──────────────────────────────────────┐
         │                                       │
         │          NORMAL OPERATION             │
         │                                       │
    ┌────▼────┐                        ┌────────▼───┐
    │ STOPPED │◄───POST stop────────── │  RUNNING   │
    │         │                        │            │
    │ - Exists│                        │ - Active   │
    │ - Not   │ ────POST start───────► │ - Healthy  │
    │   active│                        │            │
    └────┬────┘                        └─────┬──────┘
         │                                   │
         │                                   │ Crash
         │                                   │ OOM Kill
         │                                   │ Docker error
         │                                   ▼
         │                            ┌─────────────┐
         │                            │    ERROR    │
         │                            │             │
         │                            │ - Dead      │
         │                            │ - OOMKilled │
         │                            └──────┬──────┘
         │                                   │
         │  DELETE /api/bots/:id             │
         └───────────┬───────────────────────┘
                     │
                     ▼
              ┌─────────────┐
              │  REMOVING   │
              │             │
              │  - Stop     │
              │  - Delete   │
              │    container│
              │  - Delete   │
              │    from DB  │
              └──────┬──────┘
                     │
                     ▼
              ┌─────────────┐
              │   DELETED   │
              │             │
              │  (No data)  │
              └─────────────┘

Restart Operation (POST /api/bots/:id/restart):
  RUNNING ──► STOPPED ──► RUNNING
          (internal Docker operation, not visible to client)
```

## Data Flow: Bot Creation

```
Client          API Route      Database       DockerManager    Docker Engine
  │                │              │                  │               │
  │ POST /bots     │              │                  │               │
  │───────────────>│              │                  │               │
  │                │              │                  │               │
  │                │ Generate ID  │                  │               │
  │                │ (UUID)       │                  │               │
  │                │──────────┐   │                  │               │
  │                │          │   │                  │               │
  │                │<─────────┘   │                  │               │
  │                │              │                  │               │
  │                │ BotConfig    │                  │               │
  │                │ {            │                  │               │
  │                │   id: "...", │                  │               │
  │                │   name: "bot"│                  │               │
  │                │   ...        │                  │               │
  │                │ }            │                  │               │
  │                │              │                  │               │
  │                │ saveBotConfig()                 │               │
  │                │─────────────>│                  │               │
  │                │              │                  │               │
  │                │              │ Write to         │               │
  │                │              │ db.json          │               │
  │                │              │──────────┐       │               │
  │                │              │          │       │               │
  │                │              │<─────────┘       │               │
  │                │              │                  │               │
  │                │              │ OK               │               │
  │                │<─────────────│                  │               │
  │                │              │                  │               │
  │                │ createBot(config)               │               │
  │                │─────────────────────────────────>│               │
  │                │              │                  │               │
  │                │              │                  │ Pull image    │
  │                │              │                  │──────────────>│
  │                │              │                  │               │
  │                │              │                  │<──────────────│
  │                │              │                  │               │
  │                │              │                  │ Create:       │
  │                │              │                  │  name: openclaw-bot-{id}
  │                │              │                  │  labels:      │
  │                │              │                  │    id: "..."  │
  │                │              │                  │    name: "bot"│
  │                │              │                  │    managed: true
  │                │              │                  │──────────────>│
  │                │              │                  │               │
  │                │              │                  │ Container ID  │
  │                │              │                  │<──────────────│
  │                │              │                  │               │
  │                │              │                  │ Start         │
  │                │              │                  │──────────────>│
  │                │              │                  │               │
  │                │              │                  │ OK            │
  │                │              │                  │<──────────────│
  │                │              │                  │               │
  │                │              │                  │ Container ID  │
  │                │<─────────────────────────────────│               │
  │                │              │                  │               │
  │ 201 Created    │              │                  │               │
  │ {bot+status}   │              │                  │               │
  │<───────────────│              │                  │               │
  │                │              │                  │               │

Result:
  Database: BotConfig persisted
  Docker: Container created and running
  Client: Receives bot data with initial status
```

## Data Flow: Status Monitoring

```
DockerManager    Docker Engine    EventEmitter    WebSocket    Clients
     │                │                │              │           │
     │ setInterval    │                │              │           │
     │ (5000ms)       │                │              │           │
     │────────┐       │                │              │           │
     │        │       │                │              │           │
     │<───────┘       │                │              │           │
     │                │                │              │           │
     │ listContainers(label: managed=true)            │           │
     │───────────────>│                │              │           │
     │                │                │              │           │
     │                │ [container1,   │              │           │
     │                │  container2,   │              │           │
     │                │  ...]          │              │           │
     │<───────────────│                │              │           │
     │                │                │              │           │
     │ For each:      │                │              │           │
     │  inspect()     │                │              │           │
     │  stats()       │                │              │           │
     │───────────────>│                │              │           │
     │<───────────────│                │              │           │
     │                │                │              │           │
     │ Build BotStatus[] array         │              │           │
     │──────────┐     │                │              │           │
     │          │     │                │              │           │
     │<─────────┘     │                │              │           │
     │                │                │              │           │
     │ emit('bot:status:bulk', statuses)              │           │
     │─────────────────────────────────>│              │           │
     │                │                │              │           │
     │                │                │ on('bot:status:bulk')     │
     │                │                │─────────────>│           │
     │                │                │              │           │
     │                │                │              │ broadcast │
     │                │                │              │ {type:    │
     │                │                │              │  'bot:    │
     │                │                │              │   status',│
     │                │                │              │  data:[...]}
     │                │                │              │──────────>│
     │                │                │              │           │
     │                │                │              │           │ Update UI
     │                │                │              │           │ - CPU
     │                │                │              │           │ - Memory
     │                │                │              │           │ - State
     │                │                │              │           │──────┐
     │                │                │              │           │      │
     │                │                │              │           │<─────┘
     │                │                │              │           │
```

## Lookup Operations

### Find Container by Bot ID

```
Input: botId = "f47ac10b-58cc-4372-a567-0e02b2c3d479"

Query:
┌──────────────────────────────────────────┐
│ docker.listContainers({                  │
│   filters: {                             │
│     label: [                             │
│       "openclaw.bot.id=f47ac10b-..."     │
│     ]                                    │
│   }                                      │
│ })                                       │
└──────────────────────────────────────────┘
                  │
                  ▼
Docker Engine Label Index
┌─────────────────────────────────────────────────┐
│ Label: openclaw.bot.id                          │
├─────────────────────────────────────────────────┤
│ "f47ac10b-..." → container_a1b2c3d4e5f6        │
│ "d8f3ac10-..." → container_x9y8z7w6v5u4        │
│ "a2b4c610-..." → container_m1n2o3p4q5r6        │
└─────────────────────────────────────────────────┘
                  │
                  ▼
            Single Match
┌─────────────────────────────────────────┐
│ Container ID: a1b2c3d4e5f6...           │
│ Name: openclaw-bot-f47ac10b-...         │
│ Labels:                                 │
│   openclaw.bot.id: f47ac10b-...         │
│   openclaw.bot.name: trading-bot-1      │
│   openclaw.bot.managed: true            │
│ State: Running                          │
└─────────────────────────────────────────┘

Complexity: O(1) with Docker's label index
Result: Exactly one container (or null)
```

### List All Managed Bots

```
Query:
┌──────────────────────────────────────────┐
│ docker.listContainers({                  │
│   all: true,                             │
│   filters: {                             │
│     label: [                             │
│       "openclaw.bot.managed=true"        │
│     ]                                    │
│   }                                      │
│ })                                       │
└──────────────────────────────────────────┘
                  │
                  ▼
Docker Engine Label Index
┌─────────────────────────────────────────────────┐
│ Label: openclaw.bot.managed = "true"            │
├─────────────────────────────────────────────────┤
│ container_a1b2c3d4e5f6 ✓                        │
│ container_x9y8z7w6v5u4 ✓                        │
│ container_m1n2o3p4q5r6 ✓                        │
│                                                 │
│ (Other containers not included)                 │
│ container_nginx        ✗ (no label)             │
│ container_postgres     ✗ (no label)             │
│ control_center         ✗ (no label)             │
└─────────────────────────────────────────────────┘
                  │
                  ▼
         [All Bot Containers]
┌─────────────────────────────────────────┐
│ 1. openclaw-bot-f47ac10b-...            │
│ 2. openclaw-bot-d8f3ac10-...            │
│ 3. openclaw-bot-a2b4c610-...            │
└─────────────────────────────────────────┘

Complexity: O(1) lookup + O(n) result construction
Safety: Only returns OpenClaw containers
```

## Orphan Scenarios

### Orphan Bot (Config without Container)

```
Scenario: Container deleted externally (docker rm)

Database:                    Docker:
┌──────────────────┐        ┌────────────────┐
│ BotConfig        │        │ (empty)        │
│ ────────────     │        │                │
│ id: f47ac...     │  ✗────►│ No container   │
│ name: bot1       │   no   │ with this ID   │
│ image: oc:v1     │  match │                │
│ ...              │        │                │
└──────────────────┘        └────────────────┘

Detection:
  const container = await getContainerByBotId(config.id);
  if (!container) {
    // Orphan detected
  }

Status:
  GET /api/bots/:id → Returns config with status: null

Recovery Options:
  1. DELETE /api/bots/:id → Remove orphan config
  2. POST /api/bots with same config → Recreate container
```

### Orphan Container (Container without Config)

```
Scenario: Database file deleted or corrupted

Database:                    Docker:
┌──────────────────┐        ┌─────────────────────────┐
│ (empty)          │        │ Container               │
│                  │        │ ─────────────           │
│ No config for    │  ✗─────│ name: openclaw-bot-     │
│ this bot ID      │   no   │       f47ac...          │
│                  │  match │ labels:                 │
│                  │        │   openclaw.bot.id:      │
│                  │        │     f47ac...            │
└──────────────────┘        │   openclaw.bot.managed  │
                            └─────────────────────────┘

Detection:
  const containers = await listAllBotContainers();
  const configs = await getAllBotConfigs();

  for (const container of containers) {
    const botId = container.Labels['openclaw.bot.id'];
    const config = configs.find(c => c.id === botId);
    if (!config) {
      // Orphan container detected
    }
  }

Status:
  GET /api/bots → Does not include this bot

Recovery Options:
  1. Reconstruct BotConfig from container labels/env
  2. docker stop && docker rm → Remove orphan container
  3. Manual database repair
```

## Summary

**Identity Chain:**
```
Bot ID (UUID) → Container Name → Container Labels → Container Object
    │               │                  │                  │
    │               │                  │                  └─► Runtime State
    │               │                  └────────────────────► Reverse Lookup
    │               └───────────────────────────────────────► Uniqueness
    └───────────────────────────────────────────────────────► Primary Key
```

**Data Persistence:**
```
Persistent:  BotConfig → data/db.json
Ephemeral:   BotStatus → Docker Engine (computed)
Merge Point: GET /api/bots → Combines both
```

**Mapping Guarantees:**
```
1:1 Cardinality:  ∀ bot: |containers(bot)| ≤ 1
Uniqueness:       ∀ bot1, bot2: bot1.id ≠ bot2.id
Reversibility:    containerId → botId → BotConfig
Label Safety:     Only openclaw.bot.managed=true containers operated
```
