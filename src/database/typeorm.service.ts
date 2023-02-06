import 'reflect-metadata';
import { inject, injectable } from 'inversify';

import { ILogger } from '../logger/logger.service';
import { TYPES } from '../common/constants';
import { IConfigService } from '../config/config.service';
import { DataSource } from 'typeorm';
import { User } from '../user/user.entity';
import { JWTBlacklist, Session } from '../auth/auth.entity';
import { FileInfo } from '../file/file.entity';

@injectable()
export class TypeormService {
	dataSource: DataSource;

	constructor(
		@inject(TYPES.ConfigService) private configService: IConfigService,
		@inject(TYPES.ILogger) private logger: ILogger,
	) {
		this.dataSource = new DataSource({
			type: 'mysql',
			host: this.configService.get('MY_SQL_DB_HOST'),
			port: Number(this.configService.get('MY_SQL_DB_PORT')),
			username: this.configService.get('MY_SQL_DB_USER'),
			password: this.configService.get('MY_SQL_DB_PASSWORD'),
			database: this.configService.get('MY_SQL_DB_DATABASE'),
			entities: [User, JWTBlacklist, Session, FileInfo],
			synchronize: true,
			logging: false,
		});
	}

	init = async (): Promise<void> => {
		try {
			await this.dataSource.initialize();

			this.logger.log('[TypeormService] Successful connection to the database');
		} catch (error) {
			if (error instanceof Error) {
				this.logger.error('[TypeormService] Database connection error: ' + error.message);
				throw new Error(error.message);
			}
		}
	};
}
