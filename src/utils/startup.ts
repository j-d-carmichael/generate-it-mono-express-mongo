import loadMongoose from 'load-mongoose';
import config from '@/config';
import { runMigrations } from '@/utils/migrationRunner';

export default async () => {
  // Load all database connections
  await loadMongoose(config.mongoDb);
  console.log('Mongo atlas database connection established: ' + config.mongoDb.mongoHost);

  // Run database migrations
  await runMigrations();
};
