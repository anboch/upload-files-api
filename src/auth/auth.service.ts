import 'reflect-metadata';
import { inject, injectable } from 'inversify';
import { compare } from 'bcryptjs';
import { Request } from 'express';

import { IConfigService } from '../config/config.service';
import { TYPES } from '../common/constants';
import { SignUpDto } from './dto/sign-up.dto';
import { User } from '../user/user.entity';
import { IUserService } from '../user/user.service';
import jwt, { JwtPayload, SignOptions } from 'jsonwebtoken';
import { SignInDto } from './dto/sign-in.dto';
import { USER_NOT_FOUND_ERROR } from '../user/user.constants';
import { IAuthRepository } from './auth.repository';
import { Session } from './auth.entity';
import { INVALID_SIGNIN_DATA } from './auth.constants';
import { nanoid } from 'nanoid';

@injectable()
export class AuthService {
	constructor(
		@inject(TYPES.ConfigService) private configService: IConfigService,
		@inject(TYPES.UserService) private userService: IUserService,
		@inject(TYPES.AuthRepository) private authRepository: IAuthRepository,
	) {}

	async signUp(dto: SignUpDto): Promise<User> {
		return this.userService.createUser(dto);
	}

	async signIn(dto: SignInDto): Promise<Session> {
		const isValidSignInData = await this.validateSignInData(dto);
		if (!isValidSignInData) {
			throw new Error(INVALID_SIGNIN_DATA);
		}
		return this.signAndSaveTokensToSession(dto.id);
	}

	async logout(accessToken: string): Promise<void> {
		const session = await this.authRepository.findSessionByAccessToken(accessToken);
		if (!session) {
			throw new Error('Session not found');
		}

		await this.addTokensFromSessionToBlackList(session);

		const { affected } = await this.authRepository.removeSessionByRefreshToken(
			session.refreshToken,
		);
		if (!affected) {
			throw new Error();
		}
	}

	private async addTokensFromSessionToBlackList(session: Session): Promise<void> {
		const accessTokenPayload = this.getPayloadFromJWT(session.accessToken);
		const refreshTokenPayload = this.getPayloadFromJWT(session.refreshToken);

		await this.authRepository.addJWTtoBlacklist(
			session.accessToken,
			accessTokenPayload.exp ?? null,
		);
		await this.authRepository.addJWTtoBlacklist(
			session.refreshToken,
			refreshTokenPayload.exp ?? null,
		);
	}

	async isJWTInBlacklist(token: string): Promise<boolean> {
		await this.authRepository.removeExpiredTokensFromBlackList();
		return this.authRepository.isTokenInBlacklist(token);
	}

	private async validateSignInData({ id, password }: SignInDto): Promise<boolean> {
		const existedUser = await this.userService.getUserById(id);
		if (!existedUser) {
			throw new Error(USER_NOT_FOUND_ERROR);
		}
		return compare(password, existedUser.passwordHash);
	}

	async updateJWTs(req: Request): Promise<Session> {
		const existedUser = await this.userService.getUserById(req.userId);
		if (!existedUser) {
			throw new Error(USER_NOT_FOUND_ERROR);
		}

		if (!req.headers.authorization) {
			throw new Error();
		}
		const refreshToken = req.headers.authorization.split(' ')[1];

		const session = await this.authRepository.findSessionByRefreshToken(refreshToken);
		if (!session) {
			throw new Error('Session not found');
		}
		await this.addTokensFromSessionToBlackList(session);

		const { affected } = await this.authRepository.removeSessionByRefreshToken(refreshToken);
		if (!affected) {
			throw new Error();
		}

		return this.signAndSaveTokensToSession(req.userId);
	}

	private async signAndSaveTokensToSession(userId: string): Promise<Session> {
		const accessToken = await this.signAccessJWT(userId);
		const refreshToken = await this.signRefreshJWT(userId);
		return this.authRepository.savedTokensToSession({ accessToken, refreshToken });
	}

	private signAccessJWT(userId: string): Promise<string> {
		const expiresInSec = this.configService.get('JWT_ACCESS_EXPIRES_IN_SEC');
		return this.signJWT(
			userId,
			this.configService.get('JWT_ACCESS_SECRET') as string,
			expiresInSec ? Number(expiresInSec) : null,
		);
	}

	private signRefreshJWT(userId: string): Promise<string> {
		const expiresInSec = this.configService.get('JWT_REFRESH_EXPIRES_IN_SEC');
		return this.signJWT(
			userId,
			this.configService.get('JWT_REFRESH_SECRET') as string,
			expiresInSec ? Number(expiresInSec) : null,
		);
	}

	private signJWT(userId: string, secret: string, expiresIn: number | null): Promise<string> {
		const payload: Pick<Request, 'userId'> = { userId };
		const signOptions: SignOptions = { algorithm: 'HS256', jwtid: nanoid() };
		if (expiresIn) {
			signOptions.expiresIn = expiresIn;
		}

		return new Promise<string>((resolve, reject) => {
			jwt.sign(payload, secret, signOptions, (err, token) => {
				if (err) {
					reject(err);
				} else if (token) {
					resolve(token);
				}
			});
		});
	}

	private getPayloadFromJWT(token: string): JwtPayload {
		const decoded = jwt.decode(token, { complete: true });
		if (!decoded?.payload || typeof decoded?.payload === 'string') {
			throw new Error('Failed to decode jwt payload');
		}
		return decoded.payload;
	}
}
