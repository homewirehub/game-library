process.env.NODE_ENV = 'test';
process.env.DB_TYPE = process.env.DB_TYPE || 'sqlite';
process.env.DB_SQLITE_DRIVER = 'sqlite';
process.env.DB_PATH = ':memory:';
process.env.DB_SYNCHRONIZE = 'true';
