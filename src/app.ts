import 'reflect-metadata';
import express, { Express } from 'express';
import { Server } from 'http';
import { inject, injectable } from 'inversify';
import { json } from 'body-parser';
import cors from 'cors';

import { ILogger } from './logger/logger.service';
import { TYPES } from './common/constants';
import { IConfigService } from './config/config.service';
import { IExceptionFilter } from './errors/exception.filter';
import { TypeormService } from './database/typeorm.service';
import { AuthController } from './auth/auth.controller';
import { FileController } from './file/file.controller';
import { AccessJWTMiddleware } from './middlewares/accessJWT.middleware';
import { AuthGuard } from './middlewares/auth.guard';

@injectable()
export class App {
	server: Server;
	port: number;
	app: Express;

	constructor(
		@inject(TYPES.ILogger) private logger: ILogger,
		@inject(TYPES.ConfigService) private configService: IConfigService,
		@inject(TYPES.ExceptionFilter) private exceptionFilter: IExceptionFilter,
		@inject(TYPES.AccessJWTMiddleware) private accessJWTMiddleware: AccessJWTMiddleware,
		@inject(TYPES.TypeormService) private typeormService: TypeormService,
		@inject(TYPES.AuthController) private authController: AuthController,
		@inject(TYPES.FileController) private fileController: FileController,
	) {
		this.app = express();
		this.port = Number(this.configService.get('PORT'));
	}

	useMiddleware(): void {
		this.app.use(json());
		this.app.use(cors());
		const authGuard = new AuthGuard();
		this.app.use('/file', [
			this.accessJWTMiddleware.execute.bind(this.accessJWTMiddleware),
			authGuard.execute.bind(authGuard),
		]);
	}

	useRoutes(): void {
		this.app.use('/file', this.fileController.router);
		this.app.use('/', this.authController.router);
	}

	useExceptionFilters(): void {
		this.app.use(this.exceptionFilter.catch.bind(this.exceptionFilter));
	}

	async init(): Promise<void> {
		this.useMiddleware();
		this.useRoutes();
		this.useExceptionFilters();
		await this.typeormService.init();
		this.server = this.app.listen(this.port);
		this.logger.log(`[APP] Server is running on port ${this.port}`);
	}
}
