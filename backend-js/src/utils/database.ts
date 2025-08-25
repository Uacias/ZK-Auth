import { Surreal } from 'surrealdb';
import { logger } from './logger';

export interface DatabaseConfig {
  url: string;
  user: string;
  password: string;
  namespace: string;
  database: string;
}

export class DatabaseManager {
  private db: Surreal;
  private config: DatabaseConfig;

  constructor(config: DatabaseConfig) {
    this.config = config;
    this.db = new Surreal();
  }

  async connect(): Promise<Surreal> {
    try {
      // Convert URL format to match Rust version (WebSocket connection)
      const connectionUrl = this.config.url.includes('://') 
        ? this.config.url 
        : `ws://${this.config.url}`;
      
      await this.db.connect(connectionUrl);
      
      await this.db.signin({
        username: this.config.user,
        password: this.config.password,
      });
      
      await this.db.use({
        namespace: this.config.namespace,
        database: this.config.database,
      });

      logger.info(
        `Successfully connected to SurrealDB at ${this.config.url} (namespace: ${this.config.namespace}, database: ${this.config.database})`
      );

      return this.db;
    } catch (error) {
      logger.error('Failed to connect to SurrealDB:', error);
      throw new Error(`Database connection failed: ${error}`);
    }
  }

  getDb(): Surreal {
    return this.db;
  }

  async close(): Promise<void> {
    await this.db.close();
  }
}