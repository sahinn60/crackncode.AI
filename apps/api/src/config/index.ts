import appConfig from './app.config';
import databaseConfig from './database.config';
import googleConfig from './google.config';
import jwtConfig from './jwt.config';
import openaiConfig from './openai.config';
import redisConfig from './redis.config';
import storageConfig from './storage.config';
import stripeConfig from './stripe.config';

export const configs = [
  appConfig,
  databaseConfig,
  redisConfig,
  jwtConfig,
  stripeConfig,
  openaiConfig,
  storageConfig,
  googleConfig,
];

export { appConfig, databaseConfig, redisConfig, jwtConfig, stripeConfig, openaiConfig, storageConfig, googleConfig };
