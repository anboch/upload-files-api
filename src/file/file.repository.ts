import 'reflect-metadata';
import { inject, injectable } from 'inversify';

import { TYPES } from '../common/constants';
import { TypeormService } from '../database/typeorm.service';
import { DeleteResult, Repository, UpdateResult } from 'typeorm';
import { FileInfo } from './file.entity';

export interface IFileRepository {
	saveFileInfo: (fileInfo: Omit<FileInfo, 'uploadDate'>) => Promise<FileInfo>;
	getInfoById: (id: string) => Promise<FileInfo | null>;
	getListOfFilesInfo: (skipSize: number, listSize: number) => Promise<FileInfo[]>;
	removeFileInfoById: (id: string) => Promise<DeleteResult>;
	updateFileInfoById: (id: string, newFileInfo: Omit<FileInfo, 'id'>) => Promise<UpdateResult>;
}

@injectable()
export class FileRepository implements IFileRepository {
	fileModel: Repository<FileInfo>;

	constructor(@inject(TYPES.TypeormService) private typeormService: TypeormService) {
		this.fileModel = this.typeormService.dataSource.getRepository(FileInfo);
	}

	async saveFileInfo(fileInfo: Omit<FileInfo, 'uploadDate'>): Promise<FileInfo> {
		return this.fileModel.save(fileInfo);
	}

	async getInfoById(id: string): Promise<FileInfo | null> {
		return this.fileModel.findOneBy({ id });
	}

	async getListOfFilesInfo(skipSize: number, listSize: number): Promise<FileInfo[]> {
		return this.fileModel.createQueryBuilder().skip(skipSize).take(listSize).getMany();
	}

	async removeFileInfoById(id: string): Promise<DeleteResult> {
		return this.fileModel.delete({ id });
	}

	async updateFileInfoById(id: string, newFileInfo: Omit<FileInfo, 'id'>): Promise<UpdateResult> {
		return this.fileModel.update({ id }, newFileInfo);
	}
}
