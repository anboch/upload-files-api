import 'reflect-metadata';
import { inject, injectable } from 'inversify';
import { hash } from 'bcryptjs';

import { IConfigService } from '../config/config.service';
import { TYPES } from '../common/constants';
import { User } from './user.entity';
import { IUserRepository } from './user.repository';
import { SignUpDto } from '../auth/dto/sign-up.dto';
import { USER_ALREADY_EXIST } from './user.constants';

export interface IUserService {
	createUser: (dto: SignUpDto) => Promise<User>;
	getUserById: (userId: string) => Promise<User | null>;
}

@injectable()
export class UserService implements IUserService {
	constructor(
		@inject(TYPES.ConfigService) private configService: IConfigService,
		@inject(TYPES.UserRepository) private userRepository: IUserRepository,
	) {}

	async createUser({ id, password }: SignUpDto): Promise<User> {
		const existedUser = await this.getUserById(id);
		if (existedUser) {
			throw new Error(USER_ALREADY_EXIST);
		}
		const salt = Number(this.configService.get('SALT'));
		const passwordHash = await hash(password, salt);
		return this.userRepository.create({ id, passwordHash });
	}

	async getUserById(userId: string): Promise<User | null> {
		return this.userRepository.findById(userId);
	}
}
