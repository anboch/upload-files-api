import 'reflect-metadata';
import { injectable, inject } from 'inversify';
import { NextFunction, Request, Response } from 'express';

import { BaseController } from '../common/base.controller';
import { HTTPError } from '../errors/http-error.class';
import { TYPES } from '../common/constants';
import { SignUpDto } from './dto/sign-up.dto';
import { SignInDto } from './dto/sign-in.dto';
import { AuthService } from './auth.service';
import { USER_ALREADY_EXIST, USER_NOT_FOUND_ERROR } from '../user/user.constants';
import { INVALID_SIGNIN_DATA } from './auth.constants';
import { AuthGuard } from '../middlewares/auth.guard';
import { RefreshJWTMiddleware } from '../middlewares/refreshJWT.middleware';
import { ValidateMiddleware } from '../middlewares/validate.middleware';
import { AccessJWTMiddleware } from '../middlewares/accessJWT.middleware';

@injectable()
export class AuthController extends BaseController {
	constructor(
		@inject(TYPES.AuthService) private authService: AuthService,
		@inject(TYPES.AccessJWTMiddleware) private accessJWTMiddleware: AccessJWTMiddleware,
		@inject(TYPES.RefreshJWTMiddleware) private refreshJWTMiddleware: RefreshJWTMiddleware,
	) {
		super();
		this.bindRoutes([
			{
				path: '/signup',
				method: 'post',
				func: this.signUp,
				middlewares: [new ValidateMiddleware(SignUpDto)],
			},
			{
				path: '/signin',
				method: 'post',
				func: this.signIn,
				middlewares: [new ValidateMiddleware(SignInDto)],
			},
			{
				path: '/signin/new_token',
				method: 'post',
				func: this.refreshTokens,
				middlewares: [this.refreshJWTMiddleware, new AuthGuard()],
			},
			{
				path: '/info',
				method: 'get',
				func: this.getUserInfo,
				middlewares: [this.accessJWTMiddleware, new AuthGuard()],
			},
			{
				path: '/logout',
				method: 'get',
				func: this.logout,
				middlewares: [this.accessJWTMiddleware, new AuthGuard()],
			},
		]);
	}

	async signUp(
		{ body }: Request<{}, {}, SignUpDto>,
		res: Response,
		next: NextFunction,
	): Promise<void> {
		try {
			const createdUser = await this.authService.signUp(body);
			this.send(res, 200, `User with id: ${createdUser.id} has been created`);
		} catch (error) {
			if (error instanceof Error) {
				return next(
					error.message === USER_ALREADY_EXIST
						? new HTTPError(422, error.message, '/signup')
						: error,
				);
			}
		}
	}

	async signIn(
		{ body }: Request<{}, {}, SignInDto>,
		res: Response,
		next: NextFunction,
	): Promise<void> {
		try {
			const { accessToken, refreshToken } = await this.authService.signIn(body);
			this.send(res, 200, { accessToken, refreshToken });
		} catch (error) {
			if (error instanceof Error) {
				return next(
					error.message === USER_NOT_FOUND_ERROR || error.message === INVALID_SIGNIN_DATA
						? new HTTPError(422, error.message, '/signin')
						: error,
				);
			}
		}
	}

	async refreshTokens(req: Request, res: Response, next: NextFunction): Promise<void> {
		try {
			const newJWTs = await this.authService.updateJWTs(req);
			this.send(res, 200, newJWTs);
		} catch (error) {
			if (error instanceof Error) {
				return next(
					error.message === USER_NOT_FOUND_ERROR
						? new HTTPError(422, error.message, '/signin/new_token')
						: error,
				);
			}
		}
	}

	async getUserInfo({ userId }: Request, res: Response, next: NextFunction): Promise<void> {
		this.send(res, 200, { id: userId });
	}

	async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
		if (!req.headers.authorization) {
			return next(new Error());
		}
		const accessToken = req.headers.authorization.split(' ')[1];
		await this.authService.logout(accessToken);
		this.send(res, 200, 'Success logout');
	}
}
