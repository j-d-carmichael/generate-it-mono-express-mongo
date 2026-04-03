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
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"], // Default source for all content types
          baseUri: ["'self'"], // Restrict base tag URLs to same origin
          fontSrc: ["'self'", 'https:', 'data:'], // Allow fonts from same origin, HTTPS, and data URIs
          styleSrc: [
            "'self'",
            "'unsafe-inline'",
            'https://fonts.googleapis.com',
            'https://cdn.jsdelivr.net',
            'https://unpkg.com',
          ], // Allow styles from CDN for Monaco and Swagger UI
          formAction: ["'self'"], // Restrict form submissions to same origin
          frameAncestors: ['*'], // Allow embedding in iframes from any domain
          imgSrc: ["'self'", 'data:', 'blob:'], // Allow images from same origin, data URIs, and blobs
          objectSrc: ["'none'"], // Block all plugins (Flash, Java, etc.)
          frameSrc: ["'self'", 'https://feedback-sdk.molley.io'], // Allow iframes from Molley feedback SDK
          scriptSrc: [
            "'self'",
            "'unsafe-inline'",
            "'unsafe-eval'",
            'https://cdn.jsdelivr.net',
            'https://unpkg.com',
            'https://feedback-sdk.molley.io',
            'blob:',
          ], // Allow Monaco editor, Swagger UI from CDN, and Molley feedback SDK.
          workerSrc: ["'self'", 'blob:'], // Allow web workers for Monaco editor
          connectSrc: [
            "'self'",
            'https://cdn.jsdelivr.net',
            'https://unpkg.com',
            'https://fonts.googleapis.com',
            'https://fonts.gstatic.com',
            'https://molley.io',
            'ws:',
            'wss:',
          ], // Allow connections to CDN, Google Fonts, Molley, and websockets
          upgradeInsecureRequests: [], // Upgrade HTTP requests to HTTPS
        },
      },
    },
  } as AppMiddlewareOptions,

  // Logger mode - Controls console.log verbosity
  // Options: 'error', 'warn', 'info', 'log', 'debug', 'verbose'
  // Each level includes all higher priority levels (e.g., 'info' includes 'error' and 'warn')
  loggerMode: ProcEnvHelper.getOrSetDefault('LOGGER_MODE', 'log'),

  // EmailService
  email: {
    mode: ProcEnvHelper.getOrSetDefault('EMAIL_MODE', EmailerSendTypes.nodemailer),
    fallbackFrom: ProcEnvHelper.getOrSetDefault('EMAIL_FALLBACK_FROM', 'info@weave-apps.com'),
    supportEmail: ProcEnvHelper.getOrSetDefault('EMAIL_SUPPORT', 'info@weave-apps.com'),
    techEmail: ProcEnvHelper.getOrSetDefault('EMAIL_SUPPORT', 'info@weave-apps.com'),
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
