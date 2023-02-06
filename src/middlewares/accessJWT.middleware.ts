import 'reflect-metadata';
import { inject, injectable } from 'inversify';
import { AuthService } from '../auth/auth.service';
import { AuthMiddleware } from './auth.middleware';
import { IConfigService } from '../config/config.service';
import { TYPES } from '../common/constants';

@injectable()
export class AccessJWTMiddleware extends AuthMiddleware {
	constructor(
		@inject(TYPES.ConfigService) configService: IConfigService,
		@inject(TYPES.AuthService) authService: AuthService,
	) {
		super(configService.get('JWT_ACCESS_SECRET') as string, authService);
	}
}
