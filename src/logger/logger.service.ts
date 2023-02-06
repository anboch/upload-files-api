import 'reflect-metadata';
import { injectable } from 'inversify';
import { Logger } from 'tslog';

export interface ILogger {
	logger: unknown;
	log: (...args: unknown[]) => void;
	error: (...args: unknown[]) => void;
}

@injectable()
export class LoggerService implements ILogger {
	logger: Logger;

	constructor() {
		this.logger = new Logger({
			displayInstanceName: false,
			displayLoggerName: false,
			displayFilePath: 'hidden',
			displayFunctionName: false,
		});
	}

	log(...args: unknown[]): void {
		this.logger.info(...args);
	}

	error(...args: unknown[]): void {
		// todo send to a error tracker
		this.logger.error(...args);
	}
}
