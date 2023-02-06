import 'reflect-metadata';
import { inject, injectable } from 'inversify';

import { User } from './user.entity';
import { TYPES } from '../common/constants';
import { TypeormService } from '../database/typeorm.service';
import { Repository } from 'typeorm';

export interface IUserRepository {
	create: (user: Omit<User, '_id'>) => Promise<User>;
	findById: (userId: string) => Promise<User | null>;
}

@injectable()
export class UserRepository implements IUserRepository {
	userModel: Repository<User>;
	constructor(@inject(TYPES.TypeormService) private typeormService: TypeormService) {
		this.userModel = this.typeormService.dataSource.getRepository(User);
	}

	async create(user: User): Promise<User> {
		const newUser = this.userModel.create(user);
		return this.userModel.save(newUser);
	}

	async findById(userId: string): Promise<User | null> {
		return this.userModel.findOneBy({ id: userId });
	}
}
