import { getModelForClass, modelOptions, prop } from '@typegoose/typegoose';
import { randomUUID } from 'crypto';

@modelOptions({
  schemaOptions: {
    collection: 'users',
    timestamps: true,
  },
})
export class UserClass /* implements User */ {
  @prop({ default: () => randomUUID() })
  _id!: string;

  @prop()
  avatar?: string;

  @prop({ required: true })
  createdBy!: string;

  @prop()
  displayName?: string;

  @prop({ required: true, index: true })
  email!: string;

  @prop({ required: true })
  firstName!: string;

  @prop({ required: true })
  lastName!: string;

  @prop({ type: () => [String], required: true, default: [] })
  roles!: string[];

  // Timestamps handled automatically by timestamps: true
  public createdAt!: Date;
  public updatedAt!: Date;
}

export const UserModel = getModelForClass(UserClass);
