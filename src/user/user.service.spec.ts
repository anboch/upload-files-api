import 'reflect-metadata';
import { Container } from 'inversify';

import { User } from './user.entity';
import { IUserRepository } from './user.repository';
import { UserService } from './user.service';
import { IUserService } from './user.service';
import { IConfigService } from '../config/config.service';
import { TYPES } from '../common/constants';
import { SignUpDto } from '../auth/dto/sign-up.dto';

const ConfigServiceMock: IConfigService = {
	get: jest.fn(),
};

const userRepositoryMock: IUserRepository = {
	create: jest.fn(),
	findById: jest.fn(),
};

const container = new Container();
let configService: IConfigService;
let userRepository: IUserRepository;
let userService: IUserService;

beforeAll(() => {
	container.bind<IConfigService>(TYPES.ConfigService).toConstantValue(ConfigServiceMock);
	container.bind<IUserRepository>(TYPES.UserRepository).toConstantValue(userRepositoryMock);
	container.bind<IUserService>(TYPES.UserService).to(UserService);

	configService = container.get<IConfigService>(TYPES.ConfigService);
	userRepository = container.get<IUserRepository>(TYPES.UserRepository);
	userService = container.get<IUserService>(TYPES.UserService);
});

let createdUser: User | undefined;

const mockDataForSignUp: SignUpDto = {
	id: '+79998887766',
	password: 'password',
};

describe('User Service', () => {
	it('Should create User', async () => {
		configService.get = jest.fn().mockReturnValueOnce('1');
		userRepository.create = jest.fn().mockImplementationOnce((user: User): User => {
			return user;
		});

		createdUser = await userService.createUser(mockDataForSignUp);
		expect(createdUser?.passwordHash).not.toEqual(mockDataForSignUp.password);
	});
});
