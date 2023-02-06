import 'reflect-metadata';
import { Container } from 'inversify';

import { User } from './user.entity';
import { IUserRepository } from './user.repository';
import { UserService } from './user.service';
import { IUserService } from './user.service';
import { IConfigService } from '../config/config.service';
import { TYPES } from '../common/constants';

// const ConfigServiceMock: IConfigService = {
// 	get: jest.fn(),
// };

// const userRepositoryMock: IUserRepository = {
// 	create: jest.fn(),
// 	findByPhone: jest.fn(),
// 	findById: jest.fn(),
// 	findAll: jest.fn(),
// };

// const container = new Container();
// let configService: IConfigService;
// let userRepository: IUserRepository;
// let userService: IUserService;

// beforeAll(() => {
// 	container.bind<IConfigService>(TYPES.ConfigService).toConstantValue(ConfigServiceMock);
// 	container.bind<IUserRepository>(TYPES.UserRepository).toConstantValue(userRepositoryMock);
// 	container.bind<IUserService>(TYPES.UserService).to(UserService);

// 	configService = container.get<IConfigService>(TYPES.ConfigService);
// 	userRepository = container.get<IUserRepository>(TYPES.UserRepository);
// 	userService = container.get<IUserService>(TYPES.UserService);
// });

// let createdUser: User | undefined;

// const mockDataForRegisterUser: UserRegisterDto = {
// 	fullName: 'Alexander',
// 	role: Role.LAWYER,
// 	phoneNumber: '+79998887766',
// 	password: 'password',
// 	lawArea: ['Административное право', 'Семейное право'],
// };

// describe('User Service', () => {
// 	it('Should create User', async () => {
// 		configService.get = jest.fn().mockReturnValueOnce('1');
// 		userRepository.create = jest.fn().mockImplementationOnce((data: Omit<User, '_id'>): User => {
// 			return { ...data, _id: new mongoose.Types.ObjectId('63c0755b543d376b66093161') };
// 		});

// 		createdUser = await userService.createUser(mockDataForRegisterUser);
// 		expect(createdUser?.passwordHash).not.toEqual(mockDataForRegisterUser.password);
// 	});

// 	it('Should validate User', async () => {
// 		userRepository.findByPhone = jest.fn().mockReturnValueOnce(createdUser);

// 		const user = await userService.validateUser({
// 			phoneNumber: mockDataForRegisterUser.phoneNumber,
// 			password: mockDataForRegisterUser.password,
// 		});
// 		expect(user).toEqual(createdUser);
// 	});

// 	it('Should NOT validate User - wrong password', async () => {
// 		userRepository.findByPhone = jest.fn().mockReturnValueOnce(createdUser);

// 		const user = await userService.validateUser({
// 			phoneNumber: mockDataForRegisterUser.phoneNumber,
// 			password: mockDataForRegisterUser.password + '1',
// 		});
// 		expect(user).toBeNull();
// 	});
// });
