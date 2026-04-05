import { UserModel, UserClass } from '@/database/models/UserModel';
import { BaseRepository } from '@/database/BaseRepository';

class UserRepository extends BaseRepository<UserClass> {
  constructor() {
    super(UserModel);
  }

  create(input: {
    email: string;
    firstName: string;
    lastName: string;
    createdBy: string;
    avatar?: string;
    displayName?: string;
    externalId?: string;
    roles?: string[];
  }) {
    const newUser = new this.model(input);
    return newUser.save();
  }

  findById(_id: string) {
    return this.model.findById(_id);
  }

  findByIds(ids: string[]) {
    return this.model.find({ _id: { $in: ids } });
  }

  findByEmail(email: string) {
    return this.model.findOne({ email });
  }

  findByExternalId(externalId: string) {
    return this.model.findOne({ externalId });
  }

  findAll() {
    return this.model.find().sort({ createdAt: -1 });
  }

  findByRole(role: string) {
    return this.model.find({ roles: role });
  }

  update(input: { _id: string; updates: Partial<UserClass> }) {
    return this.model.findByIdAndUpdate(input._id, input.updates, { new: true });
  }
}

export default new UserRepository();
