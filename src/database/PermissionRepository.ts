import { PermissionClass, PermissionModel } from '@/database/models/PermissionModel';
import { BaseRepository } from '@/database/BaseRepository';

class PermissionRepository extends BaseRepository<PermissionClass> {
  constructor() {
    super(PermissionModel);
  }

  /**
   * Insert a permission only if it doesn't already exist (by code).
   * This preserves existing data and never overwrites.
   * Returns the existing or newly created permission.
   */
  async insertIfNotExists(input: {
    code: string;
    name: string;
    group: string | undefined;
    isCustom: boolean;
  }): Promise<PermissionClass> {
    return this.model.findOneAndUpdate(
      { code: input.code },
      {
        $setOnInsert: input,
      },
      { upsert: true, new: true },
    );
  }

  /**
   * Create a custom permission.
   */
  async create(input: { code: string; name: string; group?: string }): Promise<PermissionClass> {
    const permission = new this.model({
      code: input.code,
      name: input.name,
      group: input.group,
      isCustom: true,
    });
    return permission.save();
  }

  /**
   * Update a permission's name and/or group by ID.
   */
  async update(input: { _id: string; name?: string; group?: string }): Promise<PermissionClass | null> {
    const updates: Record<string, string | undefined> = {};
    if (input.name !== undefined) {
      updates.name = input.name;
    }
    if (input.group !== undefined) {
      updates.group = input.group;
    }

    return this.model.findByIdAndUpdate(input._id, { $set: updates }, { new: true });
  }

  /**
   * Delete a permission by ID.
   * Only custom permissions can be deleted.
   */
  async delete(_id: string): Promise<boolean> {
    const result = await this.model.deleteOne({ _id, isCustom: true });
    return result.deletedCount > 0;
  }

  /**
   * Delete stale API permissions that are no longer in the OpenAPI spec.
   * Only deletes non-custom permissions (isCustom: false or undefined/missing).
   * Returns the count of deleted permissions.
   */
  async deleteStaleApiPermissions(validCodes: string[]): Promise<number> {
    const result = await this.model.deleteMany({
      // Match non-custom permissions: isCustom is false OR doesn't exist
      isCustom: { $ne: true },
      code: { $nin: validCodes },
    });
    return result.deletedCount;
  }

  async doesPermissionExistInGroups(input: { permission: string; groupNames: string[] }): Promise<boolean> {
    return !!(await this.model.findOne({
      code: input.permission,
      group: { $in: input.groupNames },
    }));
  }

  /**
   * Check if a permission code exists in the database.
   */
  async exists(code: string): Promise<boolean> {
    const count = await this.model.countDocuments({ code });
    return count > 0;
  }

  /**
   * Find all permissions with optional pagination and search.
   */
  findAll(input?: { offset?: number; limit?: number; search?: string; excludeAdminPermissions?: boolean }) {
    const { offset = 0, limit = 1000, search, excludeAdminPermissions } = input || {};

    let query: any = {};
    if (search) {
      query = {
        $or: [{ code: { $regex: search, $options: 'i' } }, { name: { $regex: search, $options: 'i' } }],
      };
    }

    if (excludeAdminPermissions) {
      query.code = { $not: /^apiAdmin/ };
    }

    return this.model.find(query).sort({ group: 1, code: 1 }).skip(offset).limit(limit);
  }

  findById(_id: string) {
    return this.model.findById(_id);
  }

  findByCode(code: string) {
    return this.model.findOne({ code });
  }

  /**
   * Get all unique permission group names.
   * Returns distinct group names from all permissions that have a group assigned.
   */
  async getAllGroups(): Promise<string[]> {
    const groups = await this.model.distinct('group', {
      group: { $exists: true, $nin: [null, ''] },
    });
    return groups.filter((g): g is string => typeof g === 'string' && g.length > 0);
  }

  /**
   * Rename a permission group across all permissions.
   * Returns the count of updated permissions.
   */
  async renameGroup(oldName: string, newName: string): Promise<number> {
    const result = await this.model.updateMany({ group: oldName }, { $set: { group: newName } });
    return result.modifiedCount;
  }
}

export default new PermissionRepository();
