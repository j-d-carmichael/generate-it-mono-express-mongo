import dotenv from 'dotenv';
import { Config } from 'load-mongoose';
import { ProcEnvHelper } from 'proc-env-helper';
import packageJson from '../package.json';
import { EmailerSendTypes } from 'nunjucks-emailer';
import { AppMiddlewareOptions } from '@/http/nodegen/middleware';

dotenv.config();

/**
 * Add and remove config that you need.
 */
export default {
  // Instance
  env: ProcEnvHelper.getOrSetDefault('NODE_ENV', 'production'),
  port: ProcEnvHelper.getOrSetDefault('PORT', 8080),

  appDetails: {
    name: 'Your app',
    frontend: {
      userApp: 'https://your-domain.com',
    },
  },

  appMiddlewareOptions: {
    helmet: {
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
      crossOriginOpenerPolicy: false,
      crossOriginResourcePolicy: false,
    },
  } as AppMiddlewareOptions,

  // Logger mode - Controls console.log verbosity
  // Options: 'error', 'warn', 'info', 'log', 'debug', 'verbose'
  // Each level includes all higher priority levels (e.g., 'info' includes 'error' and 'warn')
  loggerMode: ProcEnvHelper.getOrSetDefault('LOGGER_MODE', 'log'),

  // EmailService
  email: {
    mode: ProcEnvHelper.getOrSetDefault('EMAIL_MODE', EmailerSendTypes.nodemailer),
    fallbackFrom: ProcEnvHelper.getOrSetDefault('EMAIL_FALLBACK_FROM', 'info@your-domain.com'),
    supportEmail: ProcEnvHelper.getOrSetDefault('EMAIL_SUPPORT', 'info@your-domain.com'),
    techEmail: ProcEnvHelper.getOrSetDefault('EMAIL_SUPPORT', 'info@your-domain.com'),
    nodemailer: {
      port: ProcEnvHelper.getOrSetDefault('EMAIL_PORT', 587),
      host: ProcEnvHelper.getOrSetDefault('EMAIL_HOST', 'smtp.sendgrid.net'),
      secure: ProcEnvHelper.getOrSetDefault('EMAIL_SECURE', false),
      auth: {
        user: ProcEnvHelper.getOrSetDefault('EMAIL_USERNAME', undefined),
        pass: ProcEnvHelper.getOrSetDefault('EMAIL_PASSWORD', undefined),
      },
    },
  },

  // WorkOS AuthKit
  workos: {
    apiKey: ProcEnvHelper.getOrSetDefault('WORKOS_API_KEY', 'changeme'),
    clientId: ProcEnvHelper.getOrSetDefault('WORKOS_CLIENT_ID', 'changeme'),
    cookiePassword: ProcEnvHelper.getOrSetDefault('WORKOS_COOKIE_PASSWORD', 'changeme'),
    redirectUri: ProcEnvHelper.getOrSetDefault('WORKOS_REDIRECT_URI', 'http://localhost:8080/auth/callback'),
  },

  // Mongodb connection details
  mongoDb: {
    mongoAdditionalParams: ProcEnvHelper.getOrSetDefault('MONGO_ADDITIONAL_PARAMS', 'retryWrites=true&w=majority'),
    mongoDatabase: ProcEnvHelper.getOrSetDefault('MONGO_DB', packageJson.name),
    mongoHost: ProcEnvHelper.getOrSetDefault('MONGO_HOST', 'changeme'),
    mongoPassword: ProcEnvHelper.getOrSetDefault('MONGO_PW', 'changeme'),
    mongoUser: ProcEnvHelper.getOrSetDefault('MONGO_USER', 'changeme'),
    mongoPort: ProcEnvHelper.getOrSetDefault('MONGO_PORT', false),
    mongoProtocol: ProcEnvHelper.getOrSetDefault('MONGO_PROTOCOL', 'mongodb+srv'),
    mongoUri: ProcEnvHelper.getOrSetDefault('MONGO_URI', false),
    mongoOpts: {
      ssl: ProcEnvHelper.getOrSetDefault('MONGO_SSL', undefined),
    },
  } as Config,
};
