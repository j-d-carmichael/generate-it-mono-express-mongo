import path from 'path';
import fs from 'fs/promises';
import fetchPermissionsFromOpenapiFile from '@/http/nodegen/utils/fetchPermissionsFromOpenapiFile';
import PermissionRepository from '@/database/PermissionRepository';
import { DEFAULT_PERMISSIONS } from '@/constants/PERMISSIONS_GROUP_MAPPING';

// PermissionDefinition interface is defined in DEFAULT_PERMISSIONS

const DEFAULT_PERMISSIONS_FILE_PATH = path.resolve(process.cwd(), 'src/constants/DEFAULT_PERMISSIONS.ts');

/**
 * Converts a camelCase permission code to a human-readable name.
 * e.g., "apiAdminCompanyRead" -> "Api Admin Company Read"
 * e.g., "apiCompanyCompanyIdUpdate" -> "Api Company Company Id Update"
 */
function codeToHumanReadable(code: string): string {
  // Insert space before each uppercase letter, then capitalize first letter of each word
  return code
    .replace(/([A-Z])/g, ' $1')
    .trim()
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function toTsString(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

function buildDefaultPermissionsSource(
  permissions: { code: string; isCustom?: boolean; name: string; group: string }[],
): string {
  const lines = permissions.map(
    (permission) =>
      `  { code: '${toTsString(permission.code)}', isCustom: ${permission.isCustom === true}, name: '${toTsString(
        permission.name,
      )}', group: '${toTsString(permission.group)}' },`,
  );

  return [
    'export const DEFAULT_PERMISSIONS: {',
    '  code: string;',
    '  name: string;',
    '  group: string;',
    '  isCustom?: boolean;',
    '}[] = [',
    ...lines,
    '];',
    '',
  ].join('\n');
}

async function writeDefaultPermissionsToDisk(input: { uniqueOpenApiCodes: string[] }): Promise<void> {
  const defaultCustomCodes = DEFAULT_PERMISSIONS.filter((permission) => permission.isCustom === true).map(
    (permission) => permission.code,
  );

  const persistedCodes = new Set([...input.uniqueOpenApiCodes, ...defaultCustomCodes]);

  const allPermissions = await PermissionRepository.findAll({
    offset: 0,
    limit: 10000,
  });

  const skippedWithoutGroup: string[] = [];
  const permissionsForDisk: { code: string; isCustom?: boolean; name: string; group: string }[] = [];

  for (const permission of allPermissions as any[]) {
    if (!persistedCodes.has(permission.code)) {
      continue;
    }

    if (!permission.group || typeof permission.group !== 'string' || !permission.group.trim()) {
      skippedWithoutGroup.push(permission.code);
      continue;
    }

    permissionsForDisk.push({
      code: permission.code,
      name: permission.name,
      group: permission.group,
      isCustom: permission.isCustom === true,
    });
  }

  permissionsForDisk.sort((a, b) => a.code.localeCompare(b.code));

  const nextSource = buildDefaultPermissionsSource(permissionsForDisk);

  let currentSource = '';
  try {
    currentSource = await fs.readFile(DEFAULT_PERMISSIONS_FILE_PATH, 'utf8');
  } catch {
    // File may not exist in some environments; we'll create it.
  }

  if (currentSource === nextSource) {
    console.log('  ✅ DEFAULT_PERMISSIONS.ts already up to date');
    return;
  }

  await fs.writeFile(DEFAULT_PERMISSIONS_FILE_PATH, nextSource, 'utf8');
  console.log(`  ✅ Wrote ${permissionsForDisk.length} permission(s) to src/constants/DEFAULT_PERMISSIONS.ts`);

  if (skippedWithoutGroup.length > 0) {
    console.log(
      `  ⚠️ Skipped ${skippedWithoutGroup.length} permission(s) without group assignment: ${skippedWithoutGroup.join(', ')}`,
    );
  }
}

/**
 * Syncs permissions from DEFAULT_PERMISSIONS.ts and OpenAPI spec to the database.
 *
 * Flow:
 * 1. Load permissions from DEFAULT_PERMISSIONS.ts (has proper group assignments)
 * 2. Insert any permissions that don't exist in the database (preserves existing data)
 * 3. Extract permission codes from OpenAPI spec
 * 4. Insert any new OpenAPI permissions not in DEFAULT_PERMISSIONS.ts (with auto-generated names)
 * 5. Remove stale API permissions no longer in the OpenAPI spec
 *
 * Safe to run multiple times - only inserts missing permissions, never overwrites existing.
 */
export default async function syncPermissions(input?: { writeBackToDisk?: boolean }): Promise<void> {
  console.log('Syncing permissions...');

  // Step 1: Load permissions from DEFAULT_PERMISSIONS.ts (authoritative source with groups)
  const jsonPermissionMap = new Map(DEFAULT_PERMISSIONS.map((p) => [p.code, p]));

  console.log(`  Found ${DEFAULT_PERMISSIONS.length} permissions in DEFAULT_PERMISSIONS.ts`);

  // Step 2: Insert permissions from JSON that don't exist in database
  // Also update existing permissions that are missing their group assignment
  let insertedFromJson = 0;
  let updatedGroups = 0;
  for (const perm of DEFAULT_PERMISSIONS) {
    const existingPermission = await PermissionRepository.findByCode(perm.code);
    if (!existingPermission) {
      await PermissionRepository.insertIfNotExists({
        code: perm.code,
        name: perm.name,
        group: perm.group,
        isCustom: perm.isCustom ?? false,
      });
      insertedFromJson++;
    } else if (!existingPermission.group && perm.group) {
      // Permission exists but has no group - update it with the group from JSON
      await PermissionRepository.update({
        _id: existingPermission._id,
        group: perm.group,
      });
      updatedGroups++;
    }
  }

  if (insertedFromJson > 0) {
    console.log(`  ✅ Inserted ${insertedFromJson} new permission(s) from JSON file`);
  }
  if (updatedGroups > 0) {
    console.log(`  ✅ Updated ${updatedGroups} existing permission(s) with missing group assignments`);
  }

  // Step 3: Extract permission codes from the OpenAPI file
  const openapiFilePath = path.resolve(process.cwd(), 'openapi-nodegen-api-file.yml');
  const permissionCodes = await fetchPermissionsFromOpenapiFile(openapiFilePath);
  const uniqueOpenApiCodes = [...new Set(permissionCodes)];

  console.log(`  Found ${uniqueOpenApiCodes.length} unique permissions in OpenAPI spec`);

  // Step 4: Insert any new OpenAPI permissions not in the JSON file
  let insertedFromOpenApi = 0;
  for (const code of uniqueOpenApiCodes) {
    // Skip if already defined in DEFAULT_PERMISSIONS.ts (already handled above)
    if (jsonPermissionMap.has(code)) {
      continue;
    }

    const exists = await PermissionRepository.exists(code);
    if (!exists) {
      const name = codeToHumanReadable(code);
      await PermissionRepository.insertIfNotExists({
        code,
        name,
        group: undefined,
        isCustom: false,
      });
      insertedFromOpenApi++;
      console.log(`  ⚠️ New permission from OpenAPI not in DEFAULT_PERMISSIONS.ts: ${code}`);
    }
  }

  if (insertedFromOpenApi > 0) {
    console.log(
      `  ⚠️ Inserted ${insertedFromOpenApi} new permission(s) from OpenAPI (consider assigning group in admin and persisting to DEFAULT_PERMISSIONS.ts)`,
    );
  }

  // Step 5: Remove stale API permissions that no longer exist in the OpenAPI spec
  const deletedCount = await PermissionRepository.deleteStaleApiPermissions(uniqueOpenApiCodes);
  if (deletedCount > 0) {
    console.log(`  🗑️ Removed ${deletedCount} stale API permission(s) no longer in OpenAPI spec`);
  }

  console.log(
    `Permissions synced: ${DEFAULT_PERMISSIONS.length} from JSON, ${updatedGroups} groups updated, ${insertedFromOpenApi} new from OpenAPI, ${deletedCount} removed`,
  );

  if (input?.writeBackToDisk) {
    await writeDefaultPermissionsToDisk({ uniqueOpenApiCodes });
  }
}
