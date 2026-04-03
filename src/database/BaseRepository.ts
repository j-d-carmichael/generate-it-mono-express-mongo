import { ReturnModelType } from '@typegoose/typegoose';

/**
 * Abstract base class for all repositories
 * Enforces the repository pattern with a private model property
 */
export abstract class BaseRepository<T> {
  protected readonly model: ReturnModelType<new () => T>;

  constructor(model: ReturnModelType<new () => T>) {
    this.model = model;
  }
}
