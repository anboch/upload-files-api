import 'reflect-metadata';
import { injectable } from 'inversify';
import { IMiddleware } from './middleware.interface';
import { NextFunction, Request, Response } from 'express';
import { verify } from 'jsonwebtoken';
import { AuthService } from '../auth/auth.service';

@injectable()
export class AuthMiddleware implements IMiddleware {
	constructor(private secret: string, private authService: AuthService) {}

	async execute(req: Request, res: Response, next: NextFunction): Promise<void> {
		if (!req.headers.authorization) {
			return next();
		}
		const token = req.headers.authorization.split(' ')[1];
		if (await this.authService.isJWTInBlacklist(token)) {
			return next();
		}
		verify(token, this.secret, (err, payload) => {
			if (err) {
				next();
			} else if (payload && typeof payload === 'object') {
				req.userId = payload.userId;
				next();
			}
		});
	}
}
