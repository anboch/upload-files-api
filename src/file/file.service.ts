import 'reflect-metadata';
import { inject, injectable } from 'inversify';
import fs from 'fs';
import * as path from 'path';

import { IConfigService } from '../config/config.service';
import { TYPES, UPLOAD_DIR_TITLE } from '../common/constants';
import { FileInfo } from './file.entity';
import { IFileRepository } from './file.repository';
import {
	FILE_INFO_NOT_FOUND_ERROR,
	PREPARE_FILE_INFO_FAILED,
	REMOVE_FILE_FAILED,
	REMOVE_FILE_INFO_FAILED,
	RENAME_FILE_FAILED,
} from './file.constants';

@injectable()
export class FileService {
	constructor(@inject(TYPES.FileRepository) private fileRepository: IFileRepository) {}

	async prepareAndSaveFileInfo(
		fileId: string,
		rawFileInfo: Express.Multer.File,
	): Promise<FileInfo> {
		const { filename, mimetype: mimeType, size } = rawFileInfo;
		if (!filename.split('#')[1]) {
			throw new Error(PREPARE_FILE_INFO_FAILED);
		}
		const parsedName = path.parse(filename.split('#')[1]);
		const extension = parsedName.ext;
		const title = parsedName.name;
		if (!title || !extension || !mimeType || !size) {
			throw new Error(PREPARE_FILE_INFO_FAILED);
		}
		return this.fileRepository.saveFileInfo({
			id: fileId,
			title,
			extension,
			mimeType,
			size,
		});
	}

	async getListOfFilesInfo(listSize = 10, pageNumber = 1): Promise<FileInfo[]> {
		const skipSize = listSize * (pageNumber - 1);
		return this.fileRepository.getListOfFilesInfo(skipSize, listSize);
	}

	async getFileInfoById(fileId: string): Promise<FileInfo> {
		const fileInfo = await this.fileRepository.getInfoById(fileId);
		if (!fileInfo) {
			throw new Error(FILE_INFO_NOT_FOUND_ERROR);
		}
		return fileInfo;
	}

	private async removeFileInfoById(fileId: string): Promise<void> {
		const { affected } = await this.fileRepository.removeFileInfoById(fileId);
		if (!affected) {
			throw new Error(REMOVE_FILE_INFO_FAILED);
		}
	}

	private getFilePathByFileInfo(fileInfo: FileInfo): string {
		return path.join(
			process.cwd(),
			UPLOAD_DIR_TITLE,
			fileInfo.id + '#' + fileInfo.title + fileInfo.extension,
		);
	}

	async getFilePathById(fileId: string): Promise<string> {
		const fileInfo = await this.getFileInfoById(fileId);
		return this.getFilePathByFileInfo(fileInfo);
	}

	async removeFileInfoAndFile(fileId: string): Promise<void> {
		const filePath = await this.getFilePathById(fileId);
		await this.removeFileInfoById(fileId);

		try {
			await fs.promises.unlink(filePath);
		} catch (error) {
			throw new Error(REMOVE_FILE_FAILED);
		}
	}

	async updateFileInfoAndFile(fileId: string, rawFileInfo: Express.Multer.File): Promise<void> {
		await this.removeFileInfoAndFile(fileId);
		const newFileInfo = await this.prepareAndSaveFileInfo(fileId, rawFileInfo);

		const tempFileNameWithId = rawFileInfo.filename;
		const tempFilePath = path.join(process.cwd(), UPLOAD_DIR_TITLE, tempFileNameWithId);
		const newFilePath = this.getFilePathByFileInfo(newFileInfo);
		try {
			await fs.promises.rename(tempFilePath, newFilePath);
		} catch (error) {
			throw new Error(RENAME_FILE_FAILED);
		}
	}
}
