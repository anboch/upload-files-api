import 'reflect-metadata';
import { inject, injectable } from 'inversify';

import { TYPES } from '../common/constants';
import { TypeormService } from '../database/typeorm.service';
import { DeleteResult, Repository } from 'typeorm';
import { JWTBlacklistItem, Session } from './auth.entity';


@injectable()
export class AuthRepository {
	// todo redo authRepository to REDIS for performance
	private jwtBlacklistModel: Repository<JWTBlacklistItem>;
	private sessionModel: Repository<Session>;

	constructor(@inject(TYPES.TypeormService) private typeormService: TypeormService) {
		this.jwtBlacklistModel = this.typeormService.dataSource.getRepository(JWTBlacklistItem);
		this.sessionModel = this.typeormService.dataSource.getRepository(Session);
	}

	async addJWTtoBlacklist(
		token: string,
		tokenExpiresOnSec: number | null,
	): Promise<JWTBlacklistItem> {
		return this.jwtBlacklistModel.save({ token, tokenExpiresOnSec });
	}

	async removeExpiredTokensFromBlackList(): Promise<void> {
		await this.jwtBlacklistModel
			.createQueryBuilder('jwt_blacklist_item')
			.delete()
			.where('jwt_blacklist_item.tokenExpiresOnSec <= :currentDateSec', {
				currentDateSec: Math.floor(Date.now() / 1000),
			})
			.execute();
	}

	async isTokenInBlacklist(token: string): Promise<boolean> {
		return !!(await this.jwtBlacklistModel.findOneBy({ token }));
	}

	async findSessionByAccessToken(accessToken: string): Promise<Session | null> {
		return this.sessionModel.findOneBy({ accessToken });
	}

	async findSessionByRefreshToken(refreshToken: string): Promise<Session | null> {
		return this.sessionModel.findOneBy({ refreshToken });
	}

	async removeSessionByRefreshToken(refreshToken: string): Promise<DeleteResult> {
		return this.sessionModel.delete({ refreshToken });
	}

	async savedTokensToSession({ accessToken, refreshToken }: Session): Promise<Session> {
		return this.sessionModel.save({ accessToken, refreshToken });
	}
}
