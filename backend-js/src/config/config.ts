import { program } from 'commander';

export interface Config {
  bind: string;
  port: number;
  surrealUrl: string;
  surrealUser: string;
  surrealPass: string;
  surrealNamespace: string;
  surrealDatabase: string;
}

export function parseCliArgs(): Config {
  program
    .name('zk-auth-backend')
    .description('Zero-Knowledge Auth Backend')
    .version('1.0.0')
    .option('-b, --bind <address>', 'Server bind address', process.env.BIND || '0.0.0.0')
    .option('-p, --port <number>', 'Server port', process.env.PORT || '8080')
    .option('--surreal-url <url>', 'SurrealDB URL', process.env.SURREAL_URL || 'localhost:8000')
    .option('--surreal-user <user>', 'SurrealDB user', process.env.SURREAL_USER || 'root')
    .option('--surreal-pass <password>', 'SurrealDB password', process.env.SURREAL_PASS || 'root')
    .option('--surreal-namespace <namespace>', 'SurrealDB namespace', process.env.SURREAL_NAMESPACE || 'test')
    .option('--surreal-database <database>', 'SurrealDB database', process.env.SURREAL_DATABASE || 'test')
    .parse();

  const options = program.opts();

  return {
    bind: options.bind,
    port: parseInt(options.port, 10),
    surrealUrl: options.surrealUrl,
    surrealUser: options.surrealUser,
    surrealPass: options.surrealPass,
    surrealNamespace: options.surrealNamespace,
    surrealDatabase: options.surrealDatabase,
  };
}