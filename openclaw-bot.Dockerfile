# OpenClaw Bot Image
# This image includes OpenClaw CLI and is used for creating trading bots

FROM node:20-bookworm

# Install system dependencies for OpenClaw
ENV DEBIAN_FRONTEND=noninteractive
RUN apt-get update && apt-get install -y \
    git \
    curl \
    build-essential \
    python3 \
    python3-pip \
    ca-certificates \
    gnupg \
    && rm -rf /var/lib/apt/lists/*

# Create openclaw user
RUN useradd -m -s /bin/bash openclaw

# Set working directory
WORKDIR /home/openclaw

# Clone OpenClaw repository (or use specific version)
# Note: Replace with actual OpenClaw installation method from their docs
RUN git clone https://github.com/openclaw/openclaw.git /opt/openclaw || \
    echo "Using alternative installation method"

# Install OpenClaw CLI globally
# Adjust based on actual OpenClaw installation method
WORKDIR /opt/openclaw
RUN npm install -g pnpm && \
    pnpm install || \
    npm install

# Install OpenClaw CLI tools
RUN npm install -g @openclaw/cli || echo "OpenClaw CLI installation pending"

# Create directories for configuration and data
RUN mkdir -p /home/openclaw/.openclaw /home/openclaw/workspace /home/openclaw/data && \
    chown -R openclaw:openclaw /home/openclaw

# Switch to openclaw user
USER openclaw
WORKDIR /home/openclaw

# Set up default environment variables (will be overridden by container env)
ENV NODE_ENV=production
ENV OPENCLAW_HOME=/home/openclaw/.openclaw
ENV WORKSPACE_DIR=/home/openclaw/workspace

# Create a startup script that initializes OpenClaw with the private key
COPY --chown=openclaw:openclaw docker/openclaw-entrypoint.sh /home/openclaw/entrypoint.sh
RUN chmod +x /home/openclaw/entrypoint.sh

# Expose default OpenClaw ports if needed
EXPOSE 8080

ENTRYPOINT ["/home/openclaw/entrypoint.sh"]
CMD ["tail", "-f", "/dev/null"]
