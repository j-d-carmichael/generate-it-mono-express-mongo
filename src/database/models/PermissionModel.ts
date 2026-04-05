import { getModelForClass, modelOptions, prop } from '@typegoose/typegoose';
import { randomUUID } from 'crypto';

@modelOptions({
  schemaOptions: {
    collection: 'permissions',
    timestamps: true,
  },
})
export class PermissionClass {
  @prop({ default: () => randomUUID() })
  _id!: string;

  @prop({ required: true, unique: true, index: true })
  code!: string;

  @prop({ required: true })
  name!: string;

  @prop({ index: true })
  group?: string;

  @prop({ required: true, default: false })
  isCustom!: boolean;

  // Timestamps handled automatically by timestamps: true
  public createdAt!: Date;
  public updatedAt!: Date;
}

export const PermissionModel = getModelForClass(PermissionClass);
