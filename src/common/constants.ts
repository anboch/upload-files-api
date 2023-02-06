export const TYPES = {
	Application: Symbol.for('Application'),
	ILogger: Symbol.for('ILogger'),
	ExceptionFilter: Symbol.for('ExceptionFilter'),
	AccessJWTMiddleware: Symbol.for('AccessJWTMiddleware'),
	RefreshJWTMiddleware: Symbol.for('RefreshJWTMiddleware'),
	UploadFileMiddleware: Symbol.for('UploadFileMiddleware'),
	ConfigService: Symbol.for('ConfigService'),
	TypeormService: Symbol.for('TypeormService'),
	MulterService: Symbol.for('MulterService'),
	AuthController: Symbol.for('AuthController'),
	AuthService: Symbol.for('AuthService'),
	AuthRepository: Symbol.for('AuthRepository'),
	UserService: Symbol.for('UserService'),
	UserRepository: Symbol.for('UserRepository'),
	FileController: Symbol.for('FileController'),
	FileService: Symbol.for('FileService'),
	FileRepository: Symbol.for('FileRepository'),
};

export const UPLOAD_DIR_TITLE = 'upload';
