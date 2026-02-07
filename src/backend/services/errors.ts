/**
 * Custom error classes for Docker operations
 */

export class DockerError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly details?: Record<string, any>
  ) {
    super(message);
    this.name = 'DockerError';
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ContainerNotFoundError extends DockerError {
  constructor(botId: string) {
    super(
      `Container not found for bot ${botId}`,
      'CONTAINER_NOT_FOUND',
      { botId }
    );
    this.name = 'ContainerNotFoundError';
  }
}

export class ImagePullError extends DockerError {
  constructor(image: string, reason: string) {
    super(
      `Failed to pull image ${image}`,
      'IMAGE_PULL_FAILED',
      { image, reason }
    );
    this.name = 'ImagePullError';
  }
}

export class ContainerCreateError extends DockerError {
  constructor(botId: string, reason: string) {
    super(
      `Failed to create container for bot ${botId}`,
      'CONTAINER_CREATE_FAILED',
      { botId, reason }
    );
    this.name = 'ContainerCreateError';
  }
}

export class ContainerOperationError extends DockerError {
  constructor(operation: string, botId: string, reason: string) {
    super(
      `Failed to ${operation} container for bot ${botId}`,
      `CONTAINER_${operation.toUpperCase()}_FAILED`,
      { botId, operation, reason }
    );
    this.name = 'ContainerOperationError';
  }
}

export class NetworkError extends DockerError {
  constructor(networkName: string, reason: string) {
    super(
      `Failed to manage network ${networkName}`,
      'NETWORK_ERROR',
      { networkName, reason }
    );
    this.name = 'NetworkError';
  }
}
