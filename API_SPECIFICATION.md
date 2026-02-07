# OpenClaw Control Center - REST API Specification

## Overview

RESTful API for managing OpenClaw bot instances, inspired by Portainer's API design.

**Base URL:** `/api`
**Version:** `v1`
**Content-Type:** `application/json`

## Authentication

**Current:** None (localhost only)
**Production:** Add JWT Bearer token or API key

```http
Authorization: Bearer <token>
```

## Common Response Codes

| Code | Meaning | Usage |
|------|---------|-------|
| 200 | OK | Successful GET/PATCH/DELETE |
| 201 | Created | Successful POST (resource created) |
| 204 | No Content | Successful DELETE (no body) |
| 400 | Bad Request | Invalid input, validation error |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Resource already exists |
| 500 | Internal Server Error | Server-side failure |
| 503 | Service Unavailable | Docker daemon unreachable |

## Error Response Format

All errors return a consistent JSON structure:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Bot name is required",
    "details": {
      "field": "name",
      "constraint": "required"
    }
  }
}
```

**Error Codes:**
- `VALIDATION_ERROR` - Invalid request body
- `NOT_FOUND` - Resource doesn't exist
- `DOCKER_ERROR` - Docker operation failed
- `CONTAINER_NOT_RUNNING` - Operation requires running container
- `ALREADY_EXISTS` - Duplicate resource
- `DATABASE_ERROR` - Database operation failed

---

## Endpoints

### 1. Health Check

Check API and Docker daemon status.

**Endpoint:** `GET /api/health`

**Response 200:**
```json
{
  "status": "ok",
  "timestamp": 1707347520000,
  "version": "1.0.0",
  "docker": {
    "reachable": true,
    "version": "24.0.7"
  }
}
```

**Response 503 (Docker unreachable):**
```json
{
  "status": "degraded",
  "timestamp": 1707347520000,
  "version": "1.0.0",
  "docker": {
    "reachable": false,
    "error": "Cannot connect to Docker daemon"
  }
}
```

---

### 2. List All Bots

Retrieve all bots with their current status.

**Endpoint:** `GET /api/bots`

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `state` | string | - | Filter by state: `running`, `stopped`, `error` |
| `limit` | integer | 100 | Max results (1-1000) |
| `offset` | integer | 0 | Pagination offset |

**Example:**
```http
GET /api/bots?state=running&limit=10&offset=0
```

**Response 200:**
```json
{
  "bots": [
    {
      "id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
      "name": "trading-bot-1",
      "image": "openclaw/bot:latest",
      "env": {
        "API_KEY": "***",
        "MODE": "production"
      },
      "volumes": [
        {
          "source": "/host/data/bot1",
          "target": "/app/data"
        }
      ],
      "createdAt": 1707347520000,
      "updatedAt": 1707347520000,
      "status": {
        "id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
        "name": "trading-bot-1",
        "containerId": "a1b2c3d4e5f6789012345678901234567890",
        "state": "running",
        "status": "Up 2 hours",
        "uptime": 7200000,
        "cpu": 15.3,
        "memory": 42.7
      },
      "task": {
        "current": "Monitoring market conditions",
        "progress": 67.5,
        "startedAt": 1707347600000,
        "details": {
          "phase": "execution",
          "action": "analyzing_patterns"
        }
      }
    }
  ],
  "total": 1,
  "limit": 10,
  "offset": 0
}
```

**Response 500:**
```json
{
  "error": {
    "code": "DOCKER_ERROR",
    "message": "Failed to list containers",
    "details": {
      "reason": "Docker daemon connection timeout"
    }
  }
}
```

---

### 3. Get Single Bot

Retrieve detailed information about a specific bot.

**Endpoint:** `GET /api/bots/:id`

**Path Parameters:**
- `id` (string, required) - Bot UUID

**Example:**
```http
GET /api/bots/f47ac10b-58cc-4372-a567-0e02b2c3d479
```

**Response 200:**
```json
{
  "id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "name": "trading-bot-1",
  "image": "openclaw/bot:latest",
  "env": {
    "API_KEY": "***",
    "MODE": "production",
    "LOG_LEVEL": "info"
  },
  "volumes": [
    {
      "source": "/host/data/bot1",
      "target": "/app/data"
    }
  ],
  "createdAt": 1707347520000,
  "updatedAt": 1707347520000,
  "status": {
    "id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
    "name": "trading-bot-1",
    "containerId": "a1b2c3d4e5f6789012345678901234567890",
    "state": "running",
    "status": "Up 2 hours",
    "uptime": 7200000,
    "cpu": 15.3,
    "memory": 42.7
  },
  "task": {
    "current": "Monitoring market conditions",
    "progress": 67.5,
    "startedAt": 1707347600000,
    "details": {
      "phase": "execution",
      "action": "analyzing_patterns",
      "metadata": {
        "symbols": ["BTC/USD", "ETH/USD"],
        "interval": "1m"
      }
    }
  }
}
```

**Response 404:**
```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Bot not found",
    "details": {
      "botId": "f47ac10b-58cc-4372-a567-0e02b2c3d479"
    }
  }
}
```

---

### 4. Create Bot

Create and start a new bot instance.

**Endpoint:** `POST /api/bots`

**Request Body:**
```json
{
  "name": "trading-bot-1",
  "image": "openclaw/bot:latest",
  "env": {
    "API_KEY": "sk_test_123456",
    "MODE": "production",
    "LOG_LEVEL": "info"
  },
  "volumes": [
    {
      "source": "/host/data/bot1",
      "target": "/app/data"
    }
  ],
  "autoStart": true
}
```

**Field Validation:**
| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `name` | string | Yes | 1-100 chars, alphanumeric + `-_` |
| `image` | string | Yes | Valid Docker image reference |
| `env` | object | No | Key-value pairs, keys must be uppercase |
| `volumes` | array | No | Source and target must be absolute paths |
| `autoStart` | boolean | No | Default: `true` |

**Response 201:**
```json
{
  "id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "name": "trading-bot-1",
  "image": "openclaw/bot:latest",
  "env": {
    "API_KEY": "***",
    "MODE": "production",
    "LOG_LEVEL": "info"
  },
  "volumes": [
    {
      "source": "/host/data/bot1",
      "target": "/app/data"
    }
  ],
  "createdAt": 1707347520000,
  "updatedAt": 1707347520000,
  "status": {
    "id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
    "name": "trading-bot-1",
    "containerId": "a1b2c3d4e5f6789012345678901234567890",
    "state": "creating",
    "status": "Created"
  }
}
```

**Response 400 (Validation Error):**
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid bot configuration",
    "details": {
      "name": "Name must be 1-100 characters",
      "image": "Image name is required"
    }
  }
}
```

**Response 500 (Image Pull Failed):**
```json
{
  "error": {
    "code": "DOCKER_ERROR",
    "message": "Failed to create bot",
    "details": {
      "reason": "Image pull failed",
      "image": "openclaw/bot:latest",
      "dockerError": "manifest not found"
    }
  }
}
```

---

### 5. Update Bot Configuration

Update bot name and environment variables. **Requires restart to apply env changes.**

**Endpoint:** `PATCH /api/bots/:id`

**Path Parameters:**
- `id` (string, required) - Bot UUID

**Request Body:**
```json
{
  "name": "trading-bot-renamed",
  "env": {
    "API_KEY": "sk_new_key",
    "MODE": "staging",
    "NEW_VAR": "value"
  }
}
```

**Notes:**
- Both fields are optional
- `env` is merged (not replaced) - omit keys to keep existing values
- Changes to `env` require bot restart to take effect
- Image and volumes cannot be changed (must delete and recreate)

**Response 200:**
```json
{
  "id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "name": "trading-bot-renamed",
  "image": "openclaw/bot:latest",
  "env": {
    "API_KEY": "***",
    "MODE": "staging",
    "LOG_LEVEL": "info",
    "NEW_VAR": "value"
  },
  "volumes": [],
  "createdAt": 1707347520000,
  "updatedAt": 1707350000000,
  "status": {
    "id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
    "name": "trading-bot-renamed",
    "containerId": "a1b2c3d4e5f6789012345678901234567890",
    "state": "running",
    "status": "Up 2 hours"
  }
}
```

**Response 404:**
```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Bot not found",
    "details": {
      "botId": "f47ac10b-58cc-4372-a567-0e02b2c3d479"
    }
  }
}
```

---

### 6. Delete Bot

Stop and remove a bot permanently.

**Endpoint:** `DELETE /api/bots/:id`

**Path Parameters:**
- `id` (string, required) - Bot UUID

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `force` | boolean | false | Force remove even if running |

**Example:**
```http
DELETE /api/bots/f47ac10b-58cc-4372-a567-0e02b2c3d479?force=true
```

**Response 204:**
```
No content (successful deletion)
```

**Response 404:**
```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Bot not found",
    "details": {
      "botId": "f47ac10b-58cc-4372-a567-0e02b2c3d479"
    }
  }
}
```

**Response 409 (Running without force):**
```json
{
  "error": {
    "code": "CONFLICT",
    "message": "Cannot delete running bot without force flag",
    "details": {
      "botId": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
      "state": "running",
      "hint": "Add ?force=true to force delete"
    }
  }
}
```

---

### 7. Start Bot

Start a stopped bot.

**Endpoint:** `POST /api/bots/:id/start`

**Path Parameters:**
- `id` (string, required) - Bot UUID

**Request Body:** None

**Response 200:**
```json
{
  "success": true,
  "botId": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "action": "start",
  "timestamp": 1707347520000
}
```

**Response 404:**
```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Bot not found",
    "details": {
      "botId": "f47ac10b-58cc-4372-a567-0e02b2c3d479"
    }
  }
}
```

**Response 409 (Already Running):**
```json
{
  "error": {
    "code": "CONFLICT",
    "message": "Bot is already running",
    "details": {
      "botId": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
      "state": "running"
    }
  }
}
```

---

### 8. Stop Bot

Stop a running bot gracefully.

**Endpoint:** `POST /api/bots/:id/stop`

**Path Parameters:**
- `id` (string, required) - Bot UUID

**Request Body:**
```json
{
  "timeout": 10
}
```

**Field:**
- `timeout` (integer, optional) - Seconds to wait before force kill (default: 10)

**Response 200:**
```json
{
  "success": true,
  "botId": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "action": "stop",
  "timestamp": 1707347520000
}
```

**Response 404:**
```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Bot not found"
  }
}
```

**Response 409 (Already Stopped):**
```json
{
  "error": {
    "code": "CONFLICT",
    "message": "Bot is already stopped",
    "details": {
      "botId": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
      "state": "stopped"
    }
  }
}
```

---

### 9. Restart Bot

Restart a bot (stop then start).

**Endpoint:** `POST /api/bots/:id/restart`

**Path Parameters:**
- `id` (string, required) - Bot UUID

**Request Body:**
```json
{
  "timeout": 10
}
```

**Field:**
- `timeout` (integer, optional) - Seconds to wait before force kill (default: 10)

**Response 200:**
```json
{
  "success": true,
  "botId": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "action": "restart",
  "timestamp": 1707347520000
}
```

**Response 404:**
```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Bot not found"
  }
}
```

---

### 10. Pause Bot

Pause a running bot (freeze execution).

**Endpoint:** `POST /api/bots/:id/pause`

**Path Parameters:**
- `id` (string, required) - Bot UUID

**Request Body:** None

**Response 200:**
```json
{
  "success": true,
  "botId": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "action": "pause",
  "timestamp": 1707347520000
}
```

**Response 400 (Not Running):**
```json
{
  "error": {
    "code": "CONTAINER_NOT_RUNNING",
    "message": "Cannot pause a non-running bot",
    "details": {
      "botId": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
      "state": "stopped"
    }
  }
}
```

---

### 11. Unpause Bot

Resume a paused bot.

**Endpoint:** `POST /api/bots/:id/unpause`

**Path Parameters:**
- `id` (string, required) - Bot UUID

**Request Body:** None

**Response 200:**
```json
{
  "success": true,
  "botId": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "action": "unpause",
  "timestamp": 1707347520000
}
```

**Response 400 (Not Paused):**
```json
{
  "error": {
    "code": "CONFLICT",
    "message": "Bot is not paused",
    "details": {
      "botId": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
      "state": "running"
    }
  }
}
```

---

### 12. Get Bot Status

Get real-time status of a bot (CPU, memory, state).

**Endpoint:** `GET /api/bots/:id/status`

**Path Parameters:**
- `id` (string, required) - Bot UUID

**Response 200:**
```json
{
  "id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "name": "trading-bot-1",
  "containerId": "a1b2c3d4e5f6789012345678901234567890",
  "state": "running",
  "status": "Up 2 hours",
  "uptime": 7200000,
  "cpu": 15.3,
  "memory": 42.7,
  "network": {
    "rx": 1048576,
    "tx": 524288
  },
  "disk": {
    "read": 2097152,
    "write": 1048576
  }
}
```

**Response 404:**
```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Bot not found"
  }
}
```

---

### 13. Get Bot Logs

Retrieve container logs (stdout/stderr).

**Endpoint:** `GET /api/bots/:id/logs`

**Path Parameters:**
- `id` (string, required) - Bot UUID

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `tail` | integer | 100 | Number of lines from end (1-10000) |
| `since` | integer | - | Unix timestamp (ms) - logs since this time |
| `timestamps` | boolean | true | Include timestamps |
| `stdout` | boolean | true | Include stdout |
| `stderr` | boolean | true | Include stderr |

**Example:**
```http
GET /api/bots/f47ac10b-58cc-4372-a567-0e02b2c3d479/logs?tail=50&timestamps=true
```

**Response 200:**
```json
{
  "logs": [
    "2024-02-07T22:30:00.000Z [INFO] Bot started successfully",
    "2024-02-07T22:30:05.123Z [INFO] Connected to exchange API",
    "2024-02-07T22:30:10.456Z [INFO] Market data streaming active",
    "2024-02-07T22:31:00.789Z [WARN] High latency detected: 250ms"
  ],
  "tail": 50,
  "total": 4
}
```

**Response 404:**
```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Bot not found"
  }
}
```

---

### 14. Stream Bot Logs

Stream logs in real-time via Server-Sent Events (SSE).

**Endpoint:** `GET /api/bots/:id/logs/stream`

**Path Parameters:**
- `id` (string, required) - Bot UUID

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `timestamps` | boolean | true | Include timestamps |
| `stdout` | boolean | true | Include stdout |
| `stderr` | boolean | true | Include stderr |

**Example:**
```http
GET /api/bots/f47ac10b-58cc-4372-a567-0e02b2c3d479/logs/stream
```

**Response 200 (SSE Stream):**
```
HTTP/1.1 200 OK
Content-Type: text/event-stream
Cache-Control: no-cache
Connection: keep-alive

data: {"timestamp": "2024-02-07T22:30:00.000Z", "message": "[INFO] Bot started"}

data: {"timestamp": "2024-02-07T22:30:05.123Z", "message": "[INFO] Connected to API"}

data: {"timestamp": "2024-02-07T22:30:10.456Z", "message": "[INFO] Streaming active"}
```

**Client disconnects to stop stream**

---

### 15. Get Current Task

Get bot's current task and progress.

**Endpoint:** `GET /api/bots/:id/task`

**Path Parameters:**
- `id` (string, required) - Bot UUID

**Response 200:**
```json
{
  "botId": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "task": {
    "id": "task-123456",
    "name": "Monitoring market conditions",
    "description": "Analyzing BTC/USD patterns for entry signals",
    "progress": 67.5,
    "state": "running",
    "startedAt": 1707347600000,
    "estimatedCompletion": 1707351200000,
    "phase": "execution",
    "currentAction": "analyzing_patterns",
    "metadata": {
      "symbols": ["BTC/USD", "ETH/USD"],
      "interval": "1m",
      "dataPoints": 1000,
      "processed": 675
    }
  }
}
```

**Response 404 (No Active Task):**
```json
{
  "botId": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "task": null,
  "message": "No active task"
}
```

**Task States:**
- `queued` - Task waiting to start
- `running` - Task actively executing
- `paused` - Task temporarily paused
- `completed` - Task finished successfully
- `failed` - Task encountered error
- `cancelled` - Task cancelled by user

---

### 16. Get Task History

Retrieve past tasks for a bot.

**Endpoint:** `GET /api/bots/:id/tasks`

**Path Parameters:**
- `id` (string, required) - Bot UUID

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `limit` | integer | 20 | Max results (1-100) |
| `offset` | integer | 0 | Pagination offset |
| `state` | string | - | Filter by state |

**Example:**
```http
GET /api/bots/f47ac10b-58cc-4372-a567-0e02b2c3d479/tasks?limit=10&state=completed
```

**Response 200:**
```json
{
  "tasks": [
    {
      "id": "task-123456",
      "name": "Market analysis",
      "state": "completed",
      "progress": 100,
      "startedAt": 1707347600000,
      "completedAt": 1707351200000,
      "duration": 3600000,
      "result": {
        "success": true,
        "data": {
          "signals": 3,
          "confidence": 0.85
        }
      }
    },
    {
      "id": "task-123455",
      "name": "Data sync",
      "state": "completed",
      "progress": 100,
      "startedAt": 1707340000000,
      "completedAt": 1707343600000,
      "duration": 3600000,
      "result": {
        "success": true,
        "data": {
          "recordsSynced": 10000
        }
      }
    }
  ],
  "total": 2,
  "limit": 10,
  "offset": 0
}
```

---

### 17. Get Bot Statistics

Get aggregated statistics for a bot.

**Endpoint:** `GET /api/bots/:id/stats`

**Path Parameters:**
- `id` (string, required) - Bot UUID

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `period` | string | 1h | Time period: `5m`, `15m`, `1h`, `24h`, `7d`, `30d` |

**Example:**
```http
GET /api/bots/f47ac10b-58cc-4372-a567-0e02b2c3d479/stats?period=24h
```

**Response 200:**
```json
{
  "botId": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "period": "24h",
  "startTime": 1707261120000,
  "endTime": 1707347520000,
  "uptime": {
    "total": 86400000,
    "running": 82800000,
    "percentage": 95.8
  },
  "cpu": {
    "avg": 12.5,
    "min": 5.0,
    "max": 45.2,
    "p50": 10.3,
    "p95": 32.1,
    "p99": 42.8
  },
  "memory": {
    "avg": 38.7,
    "min": 25.0,
    "max": 55.3,
    "p50": 37.2,
    "p95": 52.1,
    "p99": 54.8
  },
  "tasks": {
    "total": 24,
    "completed": 22,
    "failed": 1,
    "cancelled": 1,
    "successRate": 91.7
  },
  "restarts": 2,
  "errors": 3
}
```

---

### 18. Bulk Operations

Perform operations on multiple bots.

**Endpoint:** `POST /api/bots/bulk`

**Request Body:**
```json
{
  "botIds": [
    "f47ac10b-58cc-4372-a567-0e02b2c3d479",
    "d8f3ac10-1234-4372-a567-0e02b2c3d123"
  ],
  "action": "restart",
  "options": {
    "timeout": 10
  }
}
```

**Actions:** `start`, `stop`, `restart`, `pause`, `unpause`, `delete`

**Response 200:**
```json
{
  "results": [
    {
      "botId": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
      "success": true,
      "action": "restart"
    },
    {
      "botId": "d8f3ac10-1234-4372-a567-0e02b2c3d123",
      "success": false,
      "error": {
        "code": "NOT_FOUND",
        "message": "Bot not found"
      }
    }
  ],
  "summary": {
    "total": 2,
    "successful": 1,
    "failed": 1
  }
}
```

---

### 19. WebSocket - Real-Time Updates

Subscribe to real-time bot status updates via WebSocket.

**Endpoint:** `WS /api/ws` or `WS /ws`

**Protocol:** WebSocket (RFC 6455)

**Connection:**
```javascript
const ws = new WebSocket('ws://localhost:3000/ws');
```

#### Client → Server Messages

**Ping (Keepalive):**
```json
{
  "type": "ping"
}
```

**Subscribe to Specific Bot:**
```json
{
  "type": "subscribe",
  "botId": "f47ac10b-58cc-4372-a567-0e02b2c3d479"
}
```

**Unsubscribe from Bot:**
```json
{
  "type": "unsubscribe",
  "botId": "f47ac10b-58cc-4372-a567-0e02b2c3d479"
}
```

#### Server → Client Messages

**Initial Connection (All Bot Statuses):**
```json
{
  "type": "bot:status",
  "data": [
    {
      "id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
      "name": "trading-bot-1",
      "containerId": "a1b2c3d4e5f6789012345678901234567890",
      "state": "running",
      "uptime": 7200000,
      "cpu": 15.3,
      "memory": 42.7
    }
  ]
}
```

**Status Update (Every 5 seconds):**
```json
{
  "type": "bot:status",
  "timestamp": 1707347520000,
  "data": [
    {
      "id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
      "name": "trading-bot-1",
      "state": "running",
      "cpu": 16.1,
      "memory": 43.2,
      "uptime": 7205000
    }
  ]
}
```

**Bot Created:**
```json
{
  "type": "bot:created",
  "timestamp": 1707347520000,
  "data": {
    "id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
    "containerId": "a1b2c3d4e5f6789012345678901234567890"
  }
}
```

**Bot Removed:**
```json
{
  "type": "bot:removed",
  "timestamp": 1707347520000,
  "data": {
    "id": "f47ac10b-58cc-4372-a567-0e02b2c3d479"
  }
}
```

**Bot Error:**
```json
{
  "type": "bot:error",
  "timestamp": 1707347520000,
  "data": {
    "id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
    "error": "Container exited with code 137 (OOM)"
  }
}
```

**Task Progress Update:**
```json
{
  "type": "bot:task:progress",
  "timestamp": 1707347520000,
  "data": {
    "botId": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
    "taskId": "task-123456",
    "progress": 75.5,
    "currentAction": "finalizing_analysis"
  }
}
```

**Pong Response:**
```json
{
  "type": "pong",
  "timestamp": 1707347520000
}
```

**Connection Lifecycle:**
1. Client connects to `/ws`
2. Server sends initial state (all bot statuses)
3. Server broadcasts updates every 5 seconds
4. Client sends `ping` periodically (recommended: 30s)
5. Server responds with `pong`
6. Client disconnects gracefully or connection drops
7. Client auto-reconnects after 3 seconds (client-side logic)

---

## Data Types

### BotConfig
```typescript
{
  id: string;                // UUID v4
  name: string;              // 1-100 chars
  image: string;             // Docker image
  env: Record<string, string>;
  volumes?: Array<{
    source: string;          // Absolute path
    target: string;          // Absolute path
  }>;
  createdAt: number;         // Unix timestamp (ms)
  updatedAt: number;         // Unix timestamp (ms)
}
```

### BotStatus
```typescript
{
  id: string;
  name: string;
  containerId?: string;
  state: 'creating' | 'running' | 'stopped' | 'paused' | 'error' | 'removing';
  status?: string;           // Docker status string
  uptime?: number;           // Milliseconds
  cpu?: number;              // Percentage (0-100)
  memory?: number;           // Percentage (0-100)
  network?: {
    rx: number;              // Bytes received
    tx: number;              // Bytes transmitted
  };
  disk?: {
    read: number;            // Bytes read
    write: number;           // Bytes written
  };
}
```

### Task
```typescript
{
  id: string;
  name: string;
  description?: string;
  progress: number;          // 0-100
  state: 'queued' | 'running' | 'paused' | 'completed' | 'failed' | 'cancelled';
  startedAt: number;
  completedAt?: number;
  estimatedCompletion?: number;
  phase?: string;
  currentAction?: string;
  metadata?: Record<string, any>;
  result?: {
    success: boolean;
    data?: any;
    error?: string;
  };
}
```

---

## Rate Limiting

**Recommended for Production:**

| Endpoint Pattern | Limit | Window |
|-----------------|-------|--------|
| `GET /api/*` | 100 req | 1 min |
| `POST /api/bots` | 10 req | 1 min |
| `POST /api/bots/:id/*` | 30 req | 1 min |
| `DELETE /api/bots/:id` | 5 req | 1 min |
| WebSocket connections | 10 connections | 1 min |

**Response Header:**
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1707347580
```

**Response 429 (Too Many Requests):**
```json
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Rate limit exceeded",
    "details": {
      "limit": 100,
      "window": "1 minute",
      "retryAfter": 45
    }
  }
}
```

---

## Security Headers

**Recommended Response Headers:**
```http
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Content-Security-Policy: default-src 'self'
Strict-Transport-Security: max-age=31536000; includeSubDomains
```

---

## API Versioning

**Current:** v1 (implicit in `/api/*`)

**Future:** Version in URL path:
```
/api/v1/bots
/api/v2/bots
```

Or in header:
```http
Accept: application/vnd.openclaw.v1+json
```

---

## Pagination

**Standard Pagination Parameters:**
- `limit` (integer, 1-1000, default: 100)
- `offset` (integer, ≥0, default: 0)

**Response Includes:**
```json
{
  "data": [...],
  "total": 250,
  "limit": 100,
  "offset": 0,
  "hasMore": true
}
```

---

## Filtering & Sorting

**Query String Format:**
```
GET /api/bots?state=running&sort=createdAt:desc&limit=50
```

**Supported Filters:**
- `state` - Bot state
- `name` - Partial name match (case-insensitive)

**Supported Sort Fields:**
- `createdAt` (default: `desc`)
- `updatedAt`
- `name`

**Sort Direction:** `:asc` or `:desc`

---

## Summary

This API provides complete control over OpenClaw bot lifecycle, monitoring, and task management. It follows RESTful principles with:

- ✅ Consistent error handling
- ✅ Real-time updates via WebSocket
- ✅ Proper HTTP status codes
- ✅ Pagination and filtering
- ✅ Bulk operations support
- ✅ Task tracking and progress monitoring
- ✅ Comprehensive logging
- ✅ Statistics and metrics

**Implementation Priority:**
1. Core CRUD (create, list, get, update, delete)
2. Lifecycle operations (start, stop, restart)
3. Logs and status
4. WebSocket real-time updates
5. Task management (if OpenClaw supports task reporting)
6. Statistics and bulk operations (optional enhancements)
