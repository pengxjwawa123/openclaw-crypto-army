# Bot Isolation & Security Model

## Container Isolation Guarantees

### 1. Network Isolation

#### Architecture
```
Host System (macOS/Linux)
│
├─ Control Center Container (NOT on openclaw-network)
│  │
│  └─ Communicates via: /var/run/docker.sock
│
└─ openclaw-network (bridge)
   │
   ├─ Bot Container 1 (IP: 172.18.0.2)
   ├─ Bot Container 2 (IP: 172.18.0.3)
   └─ Bot Container N (IP: 172.18.0.N)
```

#### Guarantees

**1. No Inter-Bot Communication (Default)**
```bash
# Bot 1 cannot reach Bot 2 by default
# Container isolation via separate network namespaces
# Each bot has own IP, but no routes to other bots

# Example:
# From Bot 1 container:
$ ping 172.18.0.3  # Bot 2's IP
# Result: Network unreachable (unless explicitly configured)
```

**2. Control Plane Isolation**
```
Control Center ←── Docker Socket ───→ Docker Engine
                                          │
                                          └─→ Bot Containers

• Control Center is NOT on openclaw-network
• Bot containers cannot reach Control Center
• Bot containers cannot access Docker socket
• Bots only see other containers if explicitly linked
```

**3. Internet Access**
```yaml
openclaw-network:
  type: bridge
  internal: false  # Allows external internet

Bots CAN:
  - Make outbound HTTP/HTTPS requests
  - Connect to external APIs
  - Download data from internet

Bots CANNOT:
  - Access host filesystem (unless volume mounted)
  - Access other containers (unless explicitly networked)
  - Bind to host ports (unless explicitly published)
```

### 2. Filesystem Isolation

#### Container Filesystem Namespaces
```
Host Filesystem
│
├─ /var/run/docker.sock (mounted to Control Center only)
├─ /Users/Desktop/... (host files)
│
└─ Docker Storage
   │
   ├─ Control Center Container
   │  ├─ /app (application code)
   │  └─ /app/data (database - VOLUME MOUNTED)
   │
   ├─ Bot Container 1
   │  ├─ / (isolated root filesystem)
   │  ├─ /tmp (isolated temp)
   │  └─ /app (bot-specific, isolated)
   │
   └─ Bot Container 2
      ├─ / (completely separate from Bot 1)
      └─ /app (independent filesystem)
```

#### Isolation Guarantees
- Each bot has completely separate root filesystem
- No shared files between bots (unless explicitly volume-mounted)
- Bots cannot access host filesystem (unless explicitly granted)
- Temporary files are container-specific

#### Volume Mounting (Optional)
```typescript
// User can specify volume mounts when creating bot
{
  volumes: [
    {
      source: '/host/data/bot1',      // Host path
      target: '/app/data'             // Container path
    }
  ]
}

// Each bot gets its own host directory
// No sharing between bots unless explicitly configured
```

**Security Considerations:**
```
⚠️  Volume mounts break isolation
  - Bot can read/write host files
  - Multiple bots with same source = data conflict
  - Control Center does NOT prevent this
  - User responsibility to ensure isolation
```

### 3. Process Isolation

#### PID Namespaces
```
Host PID 1: systemd/init
│
├─ PID 1234: dockerd (Docker daemon)
│
├─ Control Center Container
│  └─ PID 1 (in container): node dist/backend/index.js
│     └─ PID 23: node worker thread
│
├─ Bot Container 1
│  └─ PID 1 (in container): /usr/local/bin/openclaw-bot
│     └─ PID 15: bot subprocess
│
└─ Bot Container 2
   └─ PID 1 (in container): /usr/local/bin/openclaw-bot
      └─ PID 8: bot subprocess

Each container has own PID namespace:
  - PID 1 in container ≠ PID 1 on host
  - Bot cannot see processes from other containers
  - Bot cannot kill processes in other containers
  - Bot cannot inspect other container's memory
```

#### Resource Isolation (Future Enhancement)
```yaml
# Not currently implemented, but recommended for production:
HostConfig:
  Memory: 512MB          # Prevent memory exhaustion
  MemorySwap: 1GB        # Limit swap usage
  CpuShares: 1024        # CPU priority
  CpuQuota: 50000        # Max CPU time (50% of 1 core)
  PidsLimit: 100         # Limit number of processes

# Without limits:
  - Bot can consume all host RAM
  - Bot can consume all CPU
  - Bot can fork-bomb
```

### 4. Identity Isolation

#### Container Labeling
```javascript
// Each bot container has unique labels:
{
  'openclaw.bot.id': 'f47ac10b-58cc-4372-a567-0e02b2c3d479',  // UUID
  'openclaw.bot.name': 'my-trading-bot',                      // User-defined
  'openclaw.bot.managed': 'true'                              // Management flag
}

// Container name: openclaw-bot-{uuid}
// Example: openclaw-bot-f47ac10b-58cc-4372-a567-0e02b2c3d479
```

#### Identification Guarantees
```
1. Bot ID (UUID):
   - Globally unique
   - Generated server-side
   - Cannot be duplicated
   - Survives container restart

2. Container Name:
   - Enforced unique by Docker
   - Prevents name conflicts
   - Format: openclaw-bot-{uuid}

3. Operations:
   - All operations use bot ID
   - Label-based filtering prevents accidents
   - Cannot control non-OpenClaw containers
```

#### Label-Based Filtering
```javascript
// DockerManager only operates on containers with:
docker.listContainers({
  filters: {
    label: ['openclaw.bot.managed=true']
  }
});

// This prevents:
  - Managing system containers
  - Managing user's other containers
  - Accidental deletion of unrelated containers
```

## Security Model

### 1. Threat Model

#### Assumptions
```
✓ Host system is trusted
✓ Docker daemon is trusted
✓ Control Center code is trusted
✓ Network is trusted (localhost or private network)
✗ Bot containers are UNTRUSTED
✗ Bot code is UNTRUSTED
✗ External users may be UNTRUSTED
```

#### Threats Addressed
1. **Bot-to-Bot Interference**: ✅ Prevented by network/process isolation
2. **Bot-to-Host Escape**: ✅ Prevented by container runtime (unless volume mounted)
3. **Bot-to-Control-Center Attack**: ✅ Prevented by network separation
4. **Resource Exhaustion**: ⚠️  Not fully prevented (no resource limits)
5. **Privilege Escalation**: ✅ Bots run as non-root (if configured in image)

#### Threats NOT Addressed
1. **Unauthorized UI Access**: ❌ No authentication on HTTP endpoints
2. **Malicious Bot Code**: ⚠️  Container isolation helps, but not guaranteed
3. **Docker Socket Exploitation**: ❌ Control Center has full Docker access
4. **Secrets Exposure**: ❌ Environment variables are visible in Docker inspect
5. **DDoS via Bot Creation**: ❌ No rate limiting on bot creation

### 2. Attack Vectors & Mitigations

#### Attack: Malicious Bot Escapes Container
```
Scenario: Bot exploits kernel vulnerability to escape container

Mitigations:
  1. Keep host kernel updated
  2. Use Docker security features:
     - Seccomp profiles
     - AppArmor/SELinux
     - Read-only root filesystem
  3. Run bot containers as non-root user
  4. Drop unnecessary capabilities

Current Status: ⚠️  Basic container isolation only

Recommended Config:
  SecurityOpt:
    - "no-new-privileges:true"
    - "seccomp=default"
  User: "1000:1000"  # Non-root
  ReadonlyRootfs: true
  CapDrop: ["ALL"]
  CapAdd: ["NET_BIND_SERVICE"]  # Only if needed
```

#### Attack: Bot Consumes All Host Resources
```
Scenario: Bot runs infinite loop or memory leak

Impact:
  - Host becomes unresponsive
  - Other bots cannot run
  - Control Center may crash

Current Status: ❌ No resource limits

Mitigation:
  Add resource limits to HostConfig:
    Memory: 512 * 1024 * 1024,    // 512MB
    MemorySwap: 1024 * 1024 * 1024, // 1GB
    CpuQuota: 50000,              // 50% of 1 core
    PidsLimit: 100                // Max processes
```

#### Attack: Unauthorized Control Center Access
```
Scenario: Attacker accesses http://localhost:3000 and creates malicious bots

Impact:
  - Can create containers with host volume mounts
  - Can read Docker socket (if mounted)
  - Can DoS via bot creation spam

Current Status: ❌ No authentication

Mitigations:
  1. Reverse proxy with authentication (nginx + basic auth)
  2. Network firewall (only allow trusted IPs)
  3. JWT-based authentication in application
  4. Rate limiting on bot creation

Production Deployment:
  ┌─────────────────────────────────┐
  │ Nginx Reverse Proxy             │
  │  - HTTPS/TLS                    │
  │  - Basic Auth / OAuth           │
  │  - Rate Limiting                │
  │  - IP Whitelisting              │
  └────────────┬────────────────────┘
               │
  ┌────────────▼────────────────────┐
  │ OpenClaw Control Center         │
  │  - Bind to 127.0.0.1 only       │
  │  - No external exposure         │
  └─────────────────────────────────┘
```

#### Attack: Docker Socket Privilege Escalation
```
Scenario: Control Center is compromised, attacker gains Docker socket access

Impact:
  - Full control over Docker host
  - Can create privileged containers
  - Can mount host filesystem
  - Can escape to host

Current Status: ❌ Control Center has full Docker socket access

Mitigations:
  1. Run Control Center with read-only Docker socket (not always possible)
  2. Use Docker API authorization plugins
  3. Run Control Center as non-root user (already done in Dockerfile)
  4. Monitor Docker API calls for suspicious activity

Note: This is inherent to Docker management tools like Portainer
```

#### Attack: Secrets Exposure via Docker API
```
Scenario: Attacker uses `docker inspect` to read bot environment variables

Impact:
  - API keys exposed
  - Database passwords exposed
  - Private keys exposed

Current Status: ⚠️  Environment variables are visible

Mitigations:
  1. Use Docker secrets (Swarm mode only)
  2. Use external secret manager (Vault, AWS Secrets Manager)
  3. Mount secrets as files instead of env vars
  4. Encrypt sensitive values in database

Recommended: Volume-mount secrets
  volumes: [
    {
      source: '/host/secrets/bot1.key',
      target: '/run/secrets/api_key'
    }
  ]
```

### 3. Restart Policy Security

#### Configuration
```javascript
RestartPolicy: {
  Name: 'unless-stopped'
}
```

#### Implications

**Security Benefits:**
```
✓ Bot crashes are automatically recovered
✓ Transient failures don't require manual intervention
✓ Host reboots restart bots automatically
✓ Control Center crashes don't affect bots
```

**Security Risks:**
```
⚠️  Malicious bot keeps restarting after crash
⚠️  Infinite crash loop consumes resources
⚠️  Attacker can create persistent bots

Mitigation:
  - Monitor crash loops
  - Add failure count limits (not implemented)
  - Manual intervention for repeated failures
```

### 4. Network Security

#### openclaw-network Configuration
```yaml
Type: bridge
Driver: bridge
Internal: false  # ⚠️  Allows internet access
Subnet: 172.18.0.0/16 (example)
Gateway: 172.18.0.1
```

#### Security Implications

**Outbound Internet Access:**
```
Bots can:
  ✓ Make HTTP/HTTPS requests to any external service
  ✓ Download files from internet
  ✓ Connect to external databases/APIs
  ✓ Exfiltrate data

Risk:
  - Malicious bot can send data to attacker
  - Bot can download malware
  - Bot can participate in DDoS attacks

Mitigation:
  1. Use internal: true for network (blocks all internet)
  2. Use egress firewall rules
  3. Use proxy for controlled internet access
  4. Monitor outbound traffic
```

**Inbound Access:**
```
By default:
  ✗ No ports published to host
  ✗ Bots not accessible from outside

If ports are published:
  HostConfig: {
    PortBindings: {
      '8080/tcp': [{ HostPort: '8080' }]
    }
  }

Risk:
  - Bot becomes accessible from host
  - Can be exploited remotely
  - Enables bot-to-bot communication

Current Implementation: ❌ Port publishing not implemented
```

## Isolation Test Scenarios

### Test 1: Bot Cannot Access Other Bot's Filesystem
```bash
# Create Bot 1
docker exec openclaw-bot-{uuid1} ls /app
# Output: Bot 1's files

# Create Bot 2
docker exec openclaw-bot-{uuid2} ls /app
# Output: Bot 2's files

# From Bot 1, try to access Bot 2's filesystem
docker exec openclaw-bot-{uuid1} ls /proc/
# Output: Only Bot 1's processes visible

# Attempt to mount Bot 2's filesystem (should fail)
docker exec openclaw-bot-{uuid1} mount
# Output: Permission denied
```

### Test 2: Bot Cannot Communicate with Another Bot
```bash
# Get Bot 1 IP
docker inspect openclaw-bot-{uuid1} | grep IPAddress
# Example: 172.18.0.2

# Get Bot 2 IP
docker inspect openclaw-bot-{uuid2} | grep IPAddress
# Example: 172.18.0.3

# From Bot 1, ping Bot 2
docker exec openclaw-bot-{uuid1} ping -c 1 172.18.0.3
# Expected: Network unreachable (or timeout if network allows)

# Try HTTP request from Bot 1 to Bot 2
docker exec openclaw-bot-{uuid1} curl http://172.18.0.3:8080
# Expected: Connection refused (no exposed ports)
```

### Test 3: Bot Cannot Access Host Filesystem
```bash
# From bot, try to access host root
docker exec openclaw-bot-{uuid1} ls /host
# Expected: No such file or directory

# Try to access host proc
docker exec openclaw-bot-{uuid1} cat /proc/1/cmdline
# Output: Container's PID 1, not host's PID 1

# Verify no host mounts (unless explicitly configured)
docker inspect openclaw-bot-{uuid1} | grep -A 10 Mounts
# Expected: Empty or only bot-specific volumes
```

### Test 4: Bot Cannot Access Docker Socket
```bash
# From bot, check for Docker socket
docker exec openclaw-bot-{uuid1} ls /var/run/docker.sock
# Expected: No such file or directory

# Try Docker commands from inside bot
docker exec openclaw-bot-{uuid1} docker ps
# Expected: Command not found (or permission denied)
```

### Test 5: Resource Isolation (Manual Test)
```bash
# Create CPU-intensive bot
# Bot code: while(true) {}

# Monitor host CPU
htop

# Expected: Bot container uses CPU, but doesn't block other bots
# Actual: Without limits, bot can consume 100% CPU (⚠️  Issue)

# Recommended: Add CpuQuota to prevent this
```

## Best Practices for Production

### 1. Harden Container Configuration
```javascript
// Add to createBot() in DockerManager
HostConfig: {
  NetworkMode: NETWORK_NAME,
  RestartPolicy: { Name: 'unless-stopped' },

  // Security hardening
  SecurityOpt: [
    'no-new-privileges:true',
    'seccomp=default'
  ],

  // Resource limits
  Memory: 512 * 1024 * 1024,        // 512MB
  MemorySwap: 1024 * 1024 * 1024,   // 1GB
  CpuQuota: 50000,                  // 50% of 1 core
  PidsLimit: 100,                   // Max 100 processes

  // Drop dangerous capabilities
  CapDrop: ['ALL'],
  CapAdd: ['CHOWN', 'SETUID', 'SETGID'],  // Only essential

  // Read-only root (if bot supports it)
  ReadonlyRootfs: false,  // Set true if possible

  // Run as non-root
  User: '1000:1000'
}
```

### 2. Deploy with Authentication
```nginx
# nginx.conf
upstream control_center {
    server 127.0.0.1:3000;
}

server {
    listen 443 ssl;
    server_name openclaw.example.com;

    ssl_certificate /etc/ssl/certs/openclaw.crt;
    ssl_certificate_key /etc/ssl/private/openclaw.key;

    # Basic Authentication
    auth_basic "OpenClaw Control Center";
    auth_basic_user_file /etc/nginx/.htpasswd;

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req zone=api burst=20 nodelay;

    location / {
        proxy_pass http://control_center;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### 3. Network Isolation for Sensitive Bots
```javascript
// Create isolated network per bot (instead of shared openclaw-network)
async createIsolatedBot(config: BotConfig) {
  const networkName = `openclaw-bot-${config.id}`;

  // Create dedicated network for this bot
  await this.docker.createNetwork({
    Name: networkName,
    Driver: 'bridge',
    Internal: true  // No internet access
  });

  // Create container on isolated network
  const containerConfig = {
    ...standardConfig,
    HostConfig: {
      NetworkMode: networkName  // Isolated network
    }
  };
}
```

### 4. Secrets Management
```javascript
// Instead of env vars:
env: { API_KEY: 'secret123' }  // ❌ Visible in docker inspect

// Use volume-mounted secrets:
volumes: [
  {
    source: '/secure/secrets/bot-api-key',
    target: '/run/secrets/api_key'
  }
]

// Bot reads from file:
const apiKey = fs.readFileSync('/run/secrets/api_key', 'utf8');
```

### 5. Audit Logging
```typescript
// Log all bot operations
class AuditLogger {
  logBotCreated(botId: string, userId: string, config: BotConfig) {
    logger.info('BOT_CREATED', {
      botId,
      userId,
      image: config.image,
      timestamp: Date.now()
    });
  }

  logBotDeleted(botId: string, userId: string) {
    logger.warn('BOT_DELETED', {
      botId,
      userId,
      timestamp: Date.now()
    });
  }
}
```

## Summary

### Current Isolation Status
- ✅ Network isolation (bridge network)
- ✅ Filesystem isolation (separate containers)
- ✅ Process isolation (PID namespaces)
- ✅ Identity isolation (labels + UUIDs)
- ⚠️  Resource isolation (no limits)
- ❌ Authentication (no access control)
- ❌ Secrets management (env vars only)

### Production Readiness Checklist
- [ ] Add resource limits (CPU, memory, PIDs)
- [ ] Implement authentication (JWT or basic auth via nginx)
- [ ] Harden container security (seccomp, capabilities)
- [ ] Implement secrets management (volume-mounted)
- [ ] Add rate limiting (prevent bot creation spam)
- [ ] Enable audit logging (track all operations)
- [ ] Deploy behind reverse proxy (TLS, auth)
- [ ] Monitor resource usage (prevent exhaustion)
- [ ] Implement bot failure limits (prevent crash loops)
- [ ] Add IP whitelisting (restrict UI access)

### Recommended Security Posture
**Development**: Current implementation is acceptable
**Production**: Implement checklist above + network firewall
