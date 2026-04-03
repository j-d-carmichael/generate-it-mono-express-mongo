import loadMongoose from 'load-mongoose';
import path from 'path';
import process from 'process';
import config from '@/config';
import { emailerSetupAsync } from 'nunjucks-emailer';
import { EmailerConstructor } from 'nunjucks-emailer/build/interfaces/EmailerContructor';
import { runMigrations } from '@/utils/migrationRunner';
import syncPermissions from '@/utils/syncPermissions';

export default async () => {
  // Load all database connections
  await loadMongoose(config.mongoDb);
  console.log('Mongo atlas database connection established: ' + config.mongoDb.mongoHost);

  // Run database migrations
  await runMigrations();

  // Sync permissions from OpenAPI file
  const shouldWriteBackPermissions = config.env === 'local' || config.env === 'develop';
  await syncPermissions({ writeBackToDisk: shouldWriteBackPermissions });

  // Setup the emailer
  const emailerSetup: EmailerConstructor = {
    templatePath: path.join(process.cwd(), 'emails/templates'),
    logPath: path.join(process.cwd(), 'emails/logs'),
    sendType: config.email.mode,
    fallbackFrom: {
      email: config.email.fallbackFrom,
      name: config.appDetails.name,
    },
    fallbackSubject: config.appDetails.name,
    makeCssInline: true,
    makeCssInlineOptions: {
      url: config.appDetails.frontend.userApp,
      preserveMediaQueries: true,
    },
    templateGlobalObject: {
      frontend: config.appDetails.frontend,
      noReply: config.email.fallbackFrom,
    },
    nodemailer: {
      port: config.email.nodemailer.port,
      host: config.email.nodemailer.host,
      secure: config.email.nodemailer.secure,
      auth:
        config.email.nodemailer.auth.user && config.email.nodemailer.auth.pass
          ? config.email.nodemailer.auth
          : undefined,
    },
  };

  await emailerSetupAsync(emailerSetup);
  console.log(
    `Setup email: EmailerSetupAsync in mode '${config.email.mode}' with fallbacks as ${JSON.stringify(config.email.fallbackFrom)}`,
  );
};
