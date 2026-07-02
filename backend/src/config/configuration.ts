import { AppConfig } from './config.interface';

export default (): AppConfig => ({
  port: parseInt(process.env.PORT || '3000', 10),
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: (() => {
      const port = parseInt(process.env.DB_PORT || '5432', 10);
      return isNaN(port) ? 5432 : port;
    })(),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    name: process.env.DB_NAME || 'photographer',
  },
  jwt: {
    secret: process.env.JWT_SECRET || '',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  frontendUrl: process.env.FRONTEND_URL || '',
  nodeEnv: process.env.NODE_ENV || 'development',
});
