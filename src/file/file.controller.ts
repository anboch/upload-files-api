import 'reflect-metadata';
import { injectable, inject } from 'inversify';
import { NextFunction, Request, Response } from 'express';

import { BaseController } from '../common/base.controller';
import { HTTPError } from '../errors/http-error.class';
import { TYPES } from '../common/constants';
import { FileService } from './file.service';
import { UploadFileMiddleware } from '../middlewares/upload-file.middleware';

@injectable()
export class FileController extends BaseController {
	constructor(
		@inject(TYPES.FileService) private fileService: FileService,
		@inject(TYPES.UploadFileMiddleware) private uploadFileMiddleware: UploadFileMiddleware,
	) {
		super();
		this.bindRoutes([
			{
				path: '/upload',
				method: 'post',
				func: this.upload,
				middlewares: [this.uploadFileMiddleware],
			},
			{
				path: '/list',
				method: 'get',
				func: this.list,
			},
			{
				path: '/delete/:id',
				method: 'delete',
				func: this.delete,
			},
			{
				path: '/:id',
				method: 'get',
				func: this.info,
			},
			{
				path: '/download/:id',
				method: 'get',
				func: this.download,
			},
			{
				path: '/update/:id',
				method: 'put',
				func: this.update,
				middlewares: [this.uploadFileMiddleware],
			},
		]);
	}

	async upload(
		{ fileId, file: rawFileInfo }: Request,
		res: Response,
		next: NextFunction,
	): Promise<void> {
		if (!fileId || !rawFileInfo) {
			return next(new HTTPError(422, 'File required'));
		}
		try {
			const savedFileInfo = await this.fileService.prepareAndSaveFileInfo(fileId, rawFileInfo);
			this.send(res, 200, `File has uploaded with id: '${savedFileInfo.id}'`);
		} catch (error) {
			if (error instanceof Error) {
				return next(error);
			}
		}
	}

	async list({ query }: Request, res: Response, next: NextFunction): Promise<void> {
		const list_size = isNaN(Number(query.list_size)) ? undefined : Number(query.list_size);
		const page = isNaN(Number(query.page)) ? undefined : Number(query.page);
		const filesInfo = await this.fileService.getListOfFilesInfo(list_size, page);

		this.send(res, 200, filesInfo);
	}

	async delete({ params }: Request, res: Response, next: NextFunction): Promise<void> {
		try {
			await this.fileService.removeFileInfoAndFile(params.id);
			this.send(res, 200, 'File and FileInfo have removed');
		} catch (error) {
			return next(error);
		}
	}

	async info({ params }: Request, res: Response, next: NextFunction): Promise<void> {
		try {
			const fileInfo = await this.fileService.getFileInfoById(params.id);
			this.send(res, 200, fileInfo);
		} catch (error) {
			return next(error);
		}
	}

	async download({ params }: Request, res: Response, next: NextFunction): Promise<void> {
		try {
			const filePath = await this.fileService.getFilePathById(params.id);
			res.download(filePath);
		} catch (error) {
			return next(error);
		}
	}

	async update(
		{ params, file: rawFileInfo }: Request,
		res: Response,
		next: NextFunction,
	): Promise<void> {
		if (!rawFileInfo) {
			return next(new HTTPError(422, 'File required'));
		}
		try {
			await this.fileService.updateFileInfoAndFile(params.id, rawFileInfo);
		} catch (error) {
			if (error instanceof Error) {
				return next(error);
			}
		}

		this.send(res, 200, 'File has updated');
	}
}
