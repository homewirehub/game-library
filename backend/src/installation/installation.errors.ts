export class InstallationError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly details?: Record<string, any>
  ) {
    super(message);
    this.name = 'InstallationError';
  }
}

export class DatabaseConnectionError extends InstallationError {
  constructor(message: string, details?: Record<string, any>) {
    super(message, 'DB_CONNECTION_ERROR', details);
  }
}

export class DatabaseCreationError extends InstallationError {
  constructor(message: string, details?: Record<string, any>) {
    super(message, 'DB_CREATION_ERROR', details);
  }
}

export class StorageError extends InstallationError {
  constructor(message: string, details?: Record<string, any>) {
    super(message, 'STORAGE_ERROR', details);
  }
}

export class ConfigurationError extends InstallationError {
  constructor(message: string, details?: Record<string, any>) {
    super(message, 'CONFIGURATION_ERROR', details);
  }
}
