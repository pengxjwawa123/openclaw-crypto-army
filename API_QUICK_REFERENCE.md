# OpenClaw Control Center - API Quick Reference

## Base URL
```
http://localhost:3000/api
```

## Quick Reference Table

### Health & Status

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/health` | API and Docker health check | No |

### Bot Management

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/bots` | List all bots with status | No |
| GET | `/api/bots/:id` | Get single bot details | No |
| POST | `/api/bots` | Create new bot | No |
| PATCH | `/api/bots/:id` | Update bot config (name, env) | No |
| DELETE | `/api/bots/:id` | Delete bot permanently | No |

### Bot Lifecycle

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/bots/:id/start` | Start stopped bot | No |
| POST | `/api/bots/:id/stop` | Stop running bot | No |
| POST | `/api/bots/:id/restart` | Restart bot | No |
| POST | `/api/bots/:id/pause` | Pause running bot | No |
| POST | `/api/bots/:id/unpause` | Resume paused bot | No |

### Monitoring

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/bots/:id/status` | Get real-time status (CPU, memory) | No |
| GET | `/api/bots/:id/logs` | Get container logs (paginated) | No |
| GET | `/api/bots/:id/logs/stream` | Stream logs (SSE) | No |
| GET | `/api/bots/:id/stats` | Get aggregated statistics | No |

### Task Management

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/bots/:id/task` | Get current task & progress | No |
| GET | `/api/bots/:id/tasks` | Get task history | No |

### Bulk Operations

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/bots/bulk` | Bulk start/stop/restart/delete | No |

### Real-Time Updates

| Protocol | Endpoint | Description |
|----------|----------|-------------|
| WebSocket | `/ws` | Real-time bot status updates |

---

## Common Query Parameters

### Pagination
```
?limit=50&offset=0
```

### Filtering
```
?state=running
?name=trading
```

### Sorting
```
?sort=createdAt:desc
?sort=name:asc
```

### Time Ranges
```
?period=24h
?since=1707347520000
```

---

## cURL Examples

### Create Bot
```bash
curl -X POST http://localhost:3000/api/bots \
  -H "Content-Type: application/json" \
  -d '{
    "name": "trading-bot-1",
    "image": "openclaw/bot:latest",
    "env": {
      "API_KEY": "sk_test_123",
      "MODE": "production"
    }
  }'
```

### List All Bots
```bash
curl http://localhost:3000/api/bots
```

### Get Bot Status
```bash
curl http://localhost:3000/api/bots/f47ac10b-58cc-4372-a567-0e02b2c3d479/status
```

### Start Bot
```bash
curl -X POST http://localhost:3000/api/bots/f47ac10b-58cc-4372-a567-0e02b2c3d479/start
```

### Stop Bot
```bash
curl -X POST http://localhost:3000/api/bots/f47ac10b-58cc-4372-a567-0e02b2c3d479/stop \
  -H "Content-Type: application/json" \
  -d '{"timeout": 10}'
```

### Restart Bot
```bash
curl -X POST http://localhost:3000/api/bots/f47ac10b-58cc-4372-a567-0e02b2c3d479/restart
```

### Update Bot
```bash
curl -X PATCH http://localhost:3000/api/bots/f47ac10b-58cc-4372-a567-0e02b2c3d479 \
  -H "Content-Type: application/json" \
  -d '{
    "name": "trading-bot-renamed",
    "env": {
      "MODE": "staging"
    }
  }'
```

### Delete Bot
```bash
curl -X DELETE http://localhost:3000/api/bots/f47ac10b-58cc-4372-a567-0e02b2c3d479?force=true
```

### Get Logs
```bash
curl "http://localhost:3000/api/bots/f47ac10b-58cc-4372-a567-0e02b2c3d479/logs?tail=100"
```

### Get Current Task
```bash
curl http://localhost:3000/api/bots/f47ac10b-58cc-4372-a567-0e02b2c3d479/task
```

### Bulk Restart
```bash
curl -X POST http://localhost:3000/api/bots/bulk \
  -H "Content-Type: application/json" \
  -d '{
    "botIds": [
      "f47ac10b-58cc-4372-a567-0e02b2c3d479",
      "d8f3ac10-1234-4372-a567-0e02b2c3d123"
    ],
    "action": "restart"
  }'
```

---

## WebSocket Examples

### JavaScript (Browser)
```javascript
const ws = new WebSocket('ws://localhost:3000/ws');

ws.onopen = () => {
  console.log('Connected');

  // Send ping every 30 seconds
  setInterval(() => {
    ws.send(JSON.stringify({ type: 'ping' }));
  }, 30000);
};

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);

  switch (message.type) {
    case 'bot:status':
      console.log('Status update:', message.data);
      break;
    case 'bot:created':
      console.log('Bot created:', message.data);
      break;
    case 'bot:removed':
      console.log('Bot removed:', message.data);
      break;
    case 'pong':
      console.log('Pong received');
      break;
  }
};

ws.onclose = () => {
  console.log('Disconnected');
  // Reconnect after 3 seconds
  setTimeout(() => connect(), 3000);
};
```

### Node.js
```javascript
const WebSocket = require('ws');

const ws = new WebSocket('ws://localhost:3000/ws');

ws.on('open', () => {
  console.log('Connected to OpenClaw Control Center');
});

ws.on('message', (data) => {
  const message = JSON.parse(data);
  console.log('Received:', message.type);
});

ws.on('close', () => {
  console.log('Connection closed');
});
```

### Python
```python
import websocket
import json

def on_message(ws, message):
    data = json.loads(message)
    print(f"Received: {data['type']}")

def on_open(ws):
    print("Connected to OpenClaw Control Center")
    # Send ping
    ws.send(json.dumps({"type": "ping"}))

ws = websocket.WebSocketApp(
    "ws://localhost:3000/ws",
    on_message=on_message,
    on_open=on_open
)

ws.run_forever()
```

---

## HTTP Status Codes

| Code | Meaning | When Used |
|------|---------|-----------|
| 200 | OK | Successful GET/PATCH/POST (non-creation) |
| 201 | Created | Successful POST (resource created) |
| 204 | No Content | Successful DELETE |
| 400 | Bad Request | Invalid input, validation error |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Resource conflict (already exists, wrong state) |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server-side failure |
| 503 | Service Unavailable | Docker daemon unreachable |

---

## Error Response Format

All errors follow this structure:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {
      "field": "value",
      "hint": "suggestion"
    }
  }
}
```

**Common Error Codes:**
- `VALIDATION_ERROR` - Invalid request body
- `NOT_FOUND` - Resource doesn't exist
- `DOCKER_ERROR` - Docker operation failed
- `CONTAINER_NOT_RUNNING` - Operation requires running container
- `ALREADY_EXISTS` - Duplicate resource
- `DATABASE_ERROR` - Database operation failed
- `RATE_LIMIT_EXCEEDED` - Too many requests
- `CONFLICT` - Resource state conflict

---

## Response Formats

### Bot Object (Full)
```json
{
  "id": "uuid",
  "name": "string",
  "image": "string",
  "env": {},
  "volumes": [],
  "createdAt": 0,
  "updatedAt": 0,
  "status": {
    "id": "uuid",
    "name": "string",
    "containerId": "string",
    "state": "running|stopped|paused|error",
    "uptime": 0,
    "cpu": 0.0,
    "memory": 0.0
  },
  "task": {
    "current": "string",
    "progress": 0.0,
    "startedAt": 0
  }
}
```

### Success Response (Operations)
```json
{
  "success": true,
  "botId": "uuid",
  "action": "start|stop|restart",
  "timestamp": 0
}
```

### List Response (Paginated)
```json
{
  "bots": [],
  "total": 0,
  "limit": 100,
  "offset": 0
}
```

---

## Testing with httpie

### Install
```bash
brew install httpie  # macOS
apt install httpie   # Ubuntu
```

### Examples
```bash
# List bots
http GET localhost:3000/api/bots

# Create bot
http POST localhost:3000/api/bots \
  name=test-bot \
  image=openclaw/bot:latest \
  env:='{"KEY":"value"}'

# Start bot
http POST localhost:3000/api/bots/:id/start

# Get logs
http GET "localhost:3000/api/bots/:id/logs?tail=50"

# Update bot
http PATCH localhost:3000/api/bots/:id \
  name=renamed-bot

# Delete bot
http DELETE localhost:3000/api/bots/:id force==true
```

---

## Postman Collection

Import this JSON into Postman:

```json
{
  "info": {
    "name": "OpenClaw Control Center",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Health Check",
      "request": {
        "method": "GET",
        "url": "{{baseUrl}}/health"
      }
    },
    {
      "name": "List Bots",
      "request": {
        "method": "GET",
        "url": "{{baseUrl}}/bots"
      }
    },
    {
      "name": "Create Bot",
      "request": {
        "method": "POST",
        "url": "{{baseUrl}}/bots",
        "body": {
          "mode": "raw",
          "raw": "{\n  \"name\": \"test-bot\",\n  \"image\": \"openclaw/bot:latest\",\n  \"env\": {\n    \"KEY\": \"value\"\n  }\n}"
        },
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ]
      }
    },
    {
      "name": "Get Bot",
      "request": {
        "method": "GET",
        "url": "{{baseUrl}}/bots/{{botId}}"
      }
    },
    {
      "name": "Start Bot",
      "request": {
        "method": "POST",
        "url": "{{baseUrl}}/bots/{{botId}}/start"
      }
    },
    {
      "name": "Stop Bot",
      "request": {
        "method": "POST",
        "url": "{{baseUrl}}/bots/{{botId}}/stop"
      }
    },
    {
      "name": "Delete Bot",
      "request": {
        "method": "DELETE",
        "url": "{{baseUrl}}/bots/{{botId}}"
      }
    }
  ],
  "variable": [
    {
      "key": "baseUrl",
      "value": "http://localhost:3000/api"
    },
    {
      "key": "botId",
      "value": ""
    }
  ]
}
```

---

## Rate Limits (Production)

| Endpoint | Limit | Window |
|----------|-------|--------|
| GET requests | 100 | 1 minute |
| POST /api/bots | 10 | 1 minute |
| Bot operations | 30 | 1 minute |
| DELETE requests | 5 | 1 minute |
| WebSocket connections | 10 | 1 minute |

---

## Development vs Production

### Development
- No authentication
- No rate limiting
- CORS enabled for all origins
- Detailed error messages
- No HTTPS required

### Production
- JWT authentication required
- Rate limiting enabled
- CORS restricted to allowed origins
- Generic error messages (security)
- HTTPS required
- Reverse proxy (nginx) recommended

---

## Next Steps

1. **Read Full Specification:** [API_SPECIFICATION.md](API_SPECIFICATION.md)
2. **Test API:** Use cURL or Postman examples above
3. **Integrate Frontend:** Connect React app to these endpoints
4. **Add Authentication:** Implement JWT tokens for production
5. **Enable Rate Limiting:** Prevent API abuse
6. **Monitor Usage:** Track API metrics and errors
