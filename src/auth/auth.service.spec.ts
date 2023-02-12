import 'reflect-metadata';
import { Container } from 'inversify';
import { Request } from 'express';

import { IConfigService } from '../config/config.service';
import { TYPES } from '../common/constants';
import { IAuthRepository } from './auth.repository';
import { SignInDto } from './dto/sign-in.dto';
import { IUserService, UserService } from '../user/user.service';
import { User } from '../user/user.entity';
import { AuthService } from './auth.service';
import { JWTBlacklistItem, Session } from './auth.entity';
import jwt from 'jsonwebtoken';
import { INVALID_SIGNIN_DATA } from './auth.constants';
import { USER_NOT_FOUND_ERROR } from '../user/user.constants';

const ConfigServiceMock: IConfigService = {
	get: jest.fn(),
};

const authRepositoryMock: IAuthRepository = {
	addJWTtoBlacklist: jest.fn(),
	removeExpiredTokensFromBlackList: jest.fn(),
	isTokenInBlacklist: jest.fn(),
	findSessionByAccessToken: jest.fn(),
	findSessionByRefreshToken: jest.fn(),
	removeSessionByRefreshToken: jest.fn(),
	savedTokensToSession: jest.fn(),
};

const userServiceMock: IUserService = {
	createUser: jest.fn(),
	getUserById: jest.fn(),
};

const container = new Container();
let configService: IConfigService;
let authService: AuthService;
let userService: IUserService;
let authRepository: IAuthRepository;

beforeAll(() => {
	container.bind<IConfigService>(TYPES.ConfigService).toConstantValue(ConfigServiceMock);
	container.bind<AuthService>(TYPES.AuthService).to(AuthService);
	container.bind<IUserService>(TYPES.UserService).toConstantValue(userServiceMock);
	container.bind<IAuthRepository>(TYPES.AuthRepository).toConstantValue(authRepositoryMock);

	configService = container.get<IConfigService>(TYPES.ConfigService);
	authService = container.get<AuthService>(TYPES.AuthService);
	userService = container.get<IUserService>(TYPES.UserService);
	authRepository = container.get<IAuthRepository>(TYPES.AuthRepository);
});

let createdUser: User | undefined;

const mockDataForSignIn: SignInDto = {
	id: '+79998887766',
	password: 'password',
};

const mockUser: User = {
	id: '+79998887766',
	passwordHash: '$2a$04$zy5wCw525JhcFc5jZV7D9u/t9BWKxTgxz9BLKCE/BuaCLJt/pWfRy',
};

const ENV = {
	JWT_ACCESS_EXPIRES_IN_SEC: '600',
	JWT_ACCESS_SECRET: 'JWT_ACCESS_SECRET',
	JWT_REFRESH_EXPIRES_IN_SEC: '',
	JWT_REFRESH_SECRET: 'JWT_REFRESH_SECRET',
};

describe('Auth Service', () => {
	it('Should signIn', async () => {
		userService.getUserById = jest.fn().mockImplementationOnce((id: string): User | null => {
			return id === mockUser.id ? mockUser : null;
		});
		configService.get = jest.fn().mockImplementation((key: keyof typeof ENV): string => ENV[key]);

		authRepository.savedTokensToSession = jest
			.fn()
			.mockImplementationOnce((session: Session): Session => session);

		const { accessToken, refreshToken } = await authService.signIn(mockDataForSignIn);

		expect(authRepository.savedTokensToSession).toHaveBeenCalledTimes(1);
		jwt.verify(accessToken, ENV.JWT_ACCESS_SECRET, (err, payload) => {
			expect(err).toBeNull();
			expect(typeof payload).toEqual('object');
			if (typeof payload === 'object') {
				expect(payload?.userId).toEqual(mockDataForSignIn.id);
			}
		});

		jwt.verify(refreshToken, ENV.JWT_REFRESH_SECRET, (err, payload) => {
			expect(err).toBeNull();
			expect(typeof payload).toEqual('object');
			if (typeof payload === 'object') {
				expect(payload?.userId).toEqual(mockDataForSignIn.id);
			}
		});
	});

	it('Should NOT signIn - wrong id', async () => {
		userService.getUserById = jest.fn().mockImplementationOnce((id: string): User | null => {
			return id === mockUser.id ? mockUser : null;
		});

		const signInResult = (): Promise<Session> =>
			authService.signIn({
				...mockDataForSignIn,
				id: mockDataForSignIn.id + '1',
			});
		await expect(signInResult).rejects.toThrowError(USER_NOT_FOUND_ERROR);
	});

	it('Should NOT signIn - wrong password', async () => {
		userService.getUserById = jest.fn().mockImplementationOnce((id: string): User | null => {
			return id === mockUser.id ? mockUser : null;
		});

		const signInResult = (): Promise<Session> =>
			authService.signIn({
				...mockDataForSignIn,
				password: mockDataForSignIn.password + '1',
			});
		await expect(signInResult).rejects.toThrowError(INVALID_SIGNIN_DATA);
	});

	it('Should logout', async () => {
		const sessionDB: Session[] = [];
		const jwtBlackListDB: JWTBlacklistItem[] = [];

		userService.getUserById = jest.fn().mockImplementationOnce((id: string): User | null => {
			return id === mockUser.id ? mockUser : null;
		});
		configService.get = jest.fn().mockImplementation((key: keyof typeof ENV): string => ENV[key]);

		authRepository.savedTokensToSession = jest
			.fn()
			.mockImplementationOnce((session: Session): Session => {
				sessionDB.push(session);
				return session;
			});

		const { accessToken, refreshToken } = await authService.signIn(mockDataForSignIn);

		authRepository.findSessionByAccessToken = jest
			.fn()
			.mockImplementationOnce((accessToken: string): Session | null => {
				return sessionDB.find((i) => i.accessToken === accessToken) ?? null;
			});
		authRepository.addJWTtoBlacklist = jest
			.fn()
			.mockImplementation((token: string, tokenExpiresOnSec: number | null): JWTBlacklistItem => {
				jwtBlackListDB.push({ token, tokenExpiresOnSec });
				return { token, tokenExpiresOnSec };
			});
		authRepository.removeSessionByRefreshToken = jest
			.fn()
			.mockImplementationOnce((refreshToken: string): { affected: number } => {
				const index = sessionDB.findIndex((i) => i.refreshToken === refreshToken);
				if (index >= 0) {
					return { affected: sessionDB.splice(index, 1).length };
				}
				return { affected: 0 };
			});

		await authService.logout(accessToken);
		expect(sessionDB.length).toEqual(0);
		expect(jwtBlackListDB.find((i) => i.token === accessToken)).toBeTruthy();
		expect(jwtBlackListDB.find((i) => i.token === refreshToken)).toBeTruthy();
	});

	it('Should updateJWTs', async () => {
		const sessionDB: Session[] = [];
		const jwtBlackListDB: JWTBlacklistItem[] = [];

		userService.getUserById = jest.fn().mockImplementationOnce((id: string): User | null => {
			return id === mockUser.id ? mockUser : null;
		});

		configService.get = jest.fn().mockImplementation((key: keyof typeof ENV): string => ENV[key]);

		authRepository.savedTokensToSession = jest
			.fn()
			.mockImplementationOnce((session: Session): Session => {
				sessionDB.push(session);
				return session;
			});

		const oldSession = await authService.signIn(mockDataForSignIn);

		const req: Pick<Request, 'userId' | 'headers'> = {
			userId: mockDataForSignIn.id,
			headers: { authorization: 'Barer ' + oldSession.refreshToken },
		};

		userService.getUserById = jest.fn().mockImplementationOnce((id: string): User | null => {
			return id === mockUser.id ? mockUser : null;
		});

		authRepository.findSessionByRefreshToken = jest
			.fn()
			.mockImplementationOnce((refreshToken: string): Session | null => {
				return sessionDB.find((i) => i.refreshToken === refreshToken) ?? null;
			});
		authRepository.addJWTtoBlacklist = jest
			.fn()
			.mockImplementation((token: string, tokenExpiresOnSec: number | null): JWTBlacklistItem => {
				jwtBlackListDB.push({ token, tokenExpiresOnSec });
				return { token, tokenExpiresOnSec };
			});
		authRepository.removeSessionByRefreshToken = jest
			.fn()
			.mockImplementationOnce((refreshToken: string): { affected: number } => {
				const index = sessionDB.findIndex((i) => i.refreshToken === refreshToken);
				if (index >= 0) {
					return { affected: sessionDB.splice(index, 1).length };
				}
				return { affected: 0 };
			});

		authRepository.savedTokensToSession = jest
			.fn()
			.mockImplementationOnce((session: Session): Session => {
				sessionDB.push(session);
				return session;
			});

		const newSession = await authService.updateJWTs(req as Request);

		expect(sessionDB.find((i) => i.accessToken === oldSession.accessToken)).toBeFalsy();
		expect(sessionDB.find((i) => i.refreshToken === oldSession.accessToken)).toBeFalsy();
		expect(jwtBlackListDB.find((i) => i.token === oldSession.accessToken)).toBeTruthy();
		expect(jwtBlackListDB.find((i) => i.token === oldSession.accessToken)).toBeTruthy();
		expect(sessionDB.length).toEqual(1);
		expect(sessionDB.find((i) => i.accessToken === newSession.accessToken)).toBeTruthy();
		expect(sessionDB.find((i) => i.refreshToken === newSession.refreshToken)).toBeTruthy();
	});
});
