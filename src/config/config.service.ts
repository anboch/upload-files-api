import 'reflect-metadata';
import { config, DotenvConfigOutput, DotenvParseOutput } from 'dotenv';
import { inject, injectable } from 'inversify';
import { ILogger } from '../logger/logger.service';
import { TYPES } from '../common/constants';

export interface IConfigService {
	get: (key: string) => string | undefined;
}

@injectable()
export class ConfigService implements IConfigService {
	private config: DotenvParseOutput = {};
	constructor(@inject(TYPES.ILogger) private logger: ILogger) {
		const result: DotenvConfigOutput = config();
		if (result.error) {
			this.logger.error('[ConfigService] Failed to read .env file or it is missing');
			this.config = {};
		} else {
			this.logger.log('[ConfigService] Config .env loaded');
			this.config = result.parsed as DotenvParseOutput;
		}
	}

	get(key: string): string | undefined {
		let value = this.config[key];

		if (!value && key === 'PORT') {
			value = '5000';
		}

		if (!value && key === 'JWT_ACCESS_SECRET') {
			this.logger.error(
				`[ConfigService] JWT_ACCESS_SECRET required (Has been setting default value)`,
			);
			value = 'ACCESS_SECRET';
		}
		if (!value && key === 'JWT_REFRESH_SECRET') {
			this.logger.error(
				`[ConfigService] JWT_REFRESH_SECRET required (Has been setting default value)`,
			);
			value = 'REFRESH_SECRET';
		}
		if (!value) {
			this.logger.error(`[ConfigService] Failed to read value by key: ${key}`);
		}
		return value;
	}
}
