import { database, up } from 'migrate-mongo';

/**
 * Runs pending database migrations using migrate-mongo
 */
export const runMigrations = async (): Promise<void> => {
  try {
    console.log('MIGRATE-MONGO: Starting database migrations...');

    // Run migrations
    const { db, client } = await database.connect();

    // With the database connected, call the up command to run all the migrations that have not already been run
    const migrated = await up(db, client);

    // Report to the console
    if (migrated.length > 0) {
      console.log(`MIGRATE-MONGO: Successfully applied ${migrated.length} migration(s):`);
      migrated.forEach((fileName) => {
        console.log(`  - ${fileName}`);
      });
    } else {
      console.log('MIGRATE-MONGO: No pending migrations found');
    }

    await client.close();
    console.log('MIGRATE-MONGO: Database migrations completed successfully');
  } catch (error) {
    console.error('MIGRATE-MONGO: Migration failed!', error);
    throw error;
  }
};
