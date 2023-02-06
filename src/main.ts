import 'reflect-metadata';
import { Container, ContainerModule, interfaces } from 'inversify';

import { App } from './app';
import { ConfigService, IConfigService } from './config/config.service';
import { ExceptionFilter, IExceptionFilter } from './errors/exception.filter';
import { ILogger, LoggerService } from './logger/logger.service';
import { TYPES } from './common/constants';
import { UserRepository, IUserRepository } from './user/user.repository';
import { UserService, IUserService } from './user/user.service';
import { TypeormService } from './database/typeorm.service';
import { AuthController } from './auth/auth.controller';
import { AuthRepository } from './auth/auth.repository';
import { AuthService } from './auth/auth.service';
import { MulterService } from './storage/multer.service';
import { FileController } from './file/file.controller';
import { FileService } from './file/file.service';
import { FileRepository } from './file/file.repository';
import { AccessJWTMiddleware } from './middlewares/accessJWT.middleware';
import { RefreshJWTMiddleware } from './middlewares/refreshJWT.middleware';
import { UploadFileMiddleware } from './middlewares/upload-file.middleware';

export interface IBootstrapReturn {
	appContainer: Container;
	app: App;
}

const appBindings = new ContainerModule((bind: interfaces.Bind) => {
	bind<IConfigService>(TYPES.ConfigService).to(ConfigService).inSingletonScope();
	bind<IExceptionFilter>(TYPES.ExceptionFilter).to(ExceptionFilter);
	bind<ILogger>(TYPES.ILogger).to(LoggerService).inSingletonScope();
	bind<MulterService>(TYPES.MulterService).to(MulterService).inSingletonScope();
	bind<TypeormService>(TYPES.TypeormService).to(TypeormService).inSingletonScope();
	bind<App>(TYPES.Application).to(App);
});

const userBindings = new ContainerModule((bind: interfaces.Bind) => {
	bind<IUserService>(TYPES.UserService).to(UserService);
	bind<IUserRepository>(TYPES.UserRepository).to(UserRepository).inSingletonScope();
});

const fileBindings = new ContainerModule((bind: interfaces.Bind) => {
	bind<FileController>(TYPES.FileController).to(FileController);
	bind<FileService>(TYPES.FileService).to(FileService);
	bind<FileRepository>(TYPES.FileRepository).to(FileRepository).inSingletonScope();
});

const authBindings = new ContainerModule((bind: interfaces.Bind) => {
	bind<AuthController>(TYPES.AuthController).to(AuthController);
	bind<AuthService>(TYPES.AuthService).to(AuthService);
	bind<AuthRepository>(TYPES.AuthRepository).to(AuthRepository).inSingletonScope();
});

const middlewareBindings = new ContainerModule((bind: interfaces.Bind) => {
	bind<AccessJWTMiddleware>(TYPES.AccessJWTMiddleware).to(AccessJWTMiddleware);
	bind<RefreshJWTMiddleware>(TYPES.RefreshJWTMiddleware).to(RefreshJWTMiddleware);
	bind<UploadFileMiddleware>(TYPES.UploadFileMiddleware).to(UploadFileMiddleware);
});

async function bootstrap(): Promise<IBootstrapReturn> {
	const appContainer = new Container();
	appContainer.load(appBindings, userBindings, fileBindings, authBindings, middlewareBindings);
	const app = appContainer.get<App>(TYPES.Application);
	await app.init();
	return { appContainer, app };
}

export const boot = bootstrap();
