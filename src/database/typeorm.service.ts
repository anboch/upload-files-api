import 'reflect-metadata';
import { inject, injectable } from 'inversify';
import { DataSource, DataSourceOptions } from 'typeorm';
import { createDatabase } from 'typeorm-extension';

import { ILogger } from '../logger/logger.service';
import { TYPES } from '../common/constants';
import { IConfigService } from '../config/config.service';
import { User } from '../user/user.entity';
import { JWTBlacklist, Session } from '../auth/auth.entity';
import { FileInfo } from '../file/file.entity';

@injectable()
export class TypeormService {
	dataSource: DataSource;
	dataSourceOptions: DataSourceOptions;

	constructor(
		@inject(TYPES.ConfigService) private configService: IConfigService,
		@inject(TYPES.ILogger) private logger: ILogger,
	) {
		this.dataSourceOptions = {
			type: 'mysql',
			host: this.configService.get('MY_SQL_DB_HOST'),
			port: Number(this.configService.get('MY_SQL_DB_PORT')),
			username: this.configService.get('MY_SQL_DB_USER'),
			password: this.configService.get('MY_SQL_DB_PASSWORD'),
			database: this.configService.get('MY_SQL_DB_DATABASE'),
			entities: [User, JWTBlacklist, Session, FileInfo],
			synchronize: true,
			logging: false,
		};
		this.dataSource = new DataSource(this.dataSourceOptions);
	}

	init = async (): Promise<void> => {
		try {
			await createDatabase({ options: this.dataSourceOptions });
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
