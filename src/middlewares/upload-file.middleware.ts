import 'reflect-metadata';
import { inject, injectable } from 'inversify';
import { IMiddleware } from './middleware.interface';
import { NextFunction, Request, Response } from 'express';
import { nanoid } from 'nanoid';
import { MulterService } from '../storage/multer.service';
import { TYPES } from '../common/constants';

@injectable()
export class UploadFileMiddleware implements IMiddleware {
	constructor(@inject(TYPES.MulterService) private multerService: MulterService) {}

	execute(req: Request, res: Response, next: NextFunction): void {
		req.fileId = nanoid();
		this.multerService.upload.single('file')(req, res, (err) => {
			if (err) {
				return next(err);
			}
			next();
		});
	}
}
