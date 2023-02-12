import 'reflect-metadata';
import { Container } from 'inversify';
import fs from 'fs';
import * as path from 'path';

import { TYPES, UPLOAD_DIR_TITLE } from '../common/constants';
import { IFileRepository } from './file.repository';
import { FileService } from './file.service';
import { FileInfo } from './file.entity';
import { PREPARE_FILE_INFO_FAILED } from './file.constants';

const fileRepositoryMock: IFileRepository = {
	saveFileInfo: jest.fn(),
	getInfoById: jest.fn(),
	getListOfFilesInfo: jest.fn(),
	removeFileInfoById: jest.fn(),
	updateFileInfoById: jest.fn(),
};

const container = new Container();
let fileService: FileService;
let fileRepository: IFileRepository;

beforeAll(() => {
	container.bind<FileService>(TYPES.FileService).to(FileService);
	container.bind<IFileRepository>(TYPES.FileRepository).toConstantValue(fileRepositoryMock);

	fileService = container.get<FileService>(TYPES.FileService);
	fileRepository = container.get<IFileRepository>(TYPES.FileRepository);
});

const fileId = '1VaDxdAbTnwqaFCMlK5gW';
const originalFilename = 'file-name.txt';
const rawFileInfo = {
	filename: fileId + '#' + originalFilename,
	mimetype: 'mime/type',
	size: 100,
};
const parsedName = path.parse(rawFileInfo.filename.split('#')[1]);
const fileInfo = {
	id: fileId,
	title: parsedName.name,
	extension: parsedName.ext,
	mimeType: rawFileInfo.mimetype,
	size: rawFileInfo.size,
};
const filePath = path.join(process.cwd(), UPLOAD_DIR_TITLE);
const filePathWithFileName = path.join(filePath, rawFileInfo.filename);

const updateFileInfoAndFileTest = async (newOriginalFilename: string): Promise<void> => {
	const tempFileId = '5suZdCxTtHuoonmL0YR4j';
	const newRawFileInfo = {
		filename: tempFileId + '#' + newOriginalFilename,
		mimetype: 'new-mime/type',
		size: 200,
	};
	const tempFilePathWithFileName = path.join(filePath, newRawFileInfo.filename);
	const filePathWithNewFileName = path.join(filePath, fileId + '#' + newOriginalFilename);

	const fileInfoDB = [{ ...fileInfo, uploadDate: new Date() }];

	if (!fs.existsSync(filePath)) {
		fs.mkdirSync(filePath);
	}
	fs.writeFileSync(filePathWithFileName, 'old file content');
	fs.writeFileSync(tempFilePathWithFileName, 'new file content');

	fileRepository.getInfoById = jest
		.fn()
		.mockImplementationOnce((fileId: string): FileInfo | null => {
			const findRes = fileInfoDB.find((i) => i.id === fileId);
			return findRes ? findRes : null;
		});

	fileRepository.removeFileInfoById = jest
		.fn()
		.mockImplementationOnce((id: string): { affected: number } => {
			const index = fileInfoDB.findIndex((i) => i.id === fileId);
			if (index >= 0) {
				return { affected: fileInfoDB.splice(index, 1).length };
			}
			return { affected: 0 };
		});

	fileRepository.saveFileInfo = jest
		.fn()
		.mockImplementationOnce((fileInfo: Omit<FileInfo, 'uploadDate'>): FileInfo => {
			const savedFileInfo = { ...fileInfo, uploadDate: new Date() };
			fileInfoDB.push(savedFileInfo);
			return savedFileInfo;
		});

	await fileService.updateFileInfoAndFile(fileId, newRawFileInfo as Express.Multer.File);

	const readOldFileResult = () =>
		fs.readFileSync(filePathWithFileName, {
			encoding: 'utf8',
			flag: 'r',
		});
	const readNewFileResult = fs.readFileSync(filePathWithNewFileName, {
		encoding: 'utf8',
		flag: 'r',
	});

	if (originalFilename !== newOriginalFilename) {
		expect(readOldFileResult).toThrowError('ENOENT: no such file or directory, open ');
	}
	expect(readNewFileResult).toBe('new file content');
	const fileInfoInDB = fileInfoDB.filter((i) => i.id === fileId)[0];
	expect(fileInfoInDB.title + fileInfoInDB.extension).toEqual(newOriginalFilename);
	expect(fileInfoInDB.mimeType).toEqual(newRawFileInfo.mimetype);
	expect(fileInfoInDB.size).toEqual(newRawFileInfo.size);

	await fs.promises.unlink(filePathWithNewFileName);
};

describe('Auth Service', () => {
	it('Should prepare and save FileInfo', async () => {
		fileRepository.saveFileInfo = jest
			.fn()
			.mockImplementationOnce((fileInfo: Omit<FileInfo, 'uploadDate'>): FileInfo => {
				return { ...fileInfo, uploadDate: new Date() };
			});

		const savedFileInfo = await fileService.prepareAndSaveFileInfo(
			fileId,
			rawFileInfo as Express.Multer.File,
		);
		expect(savedFileInfo.id).toEqual(fileInfo.id);
		expect(savedFileInfo.title).toEqual(fileInfo.title);
		expect(savedFileInfo.extension).toEqual(fileInfo.extension);
		expect(savedFileInfo.mimeType).toEqual(fileInfo.mimeType);
		expect(savedFileInfo.size).toEqual(fileInfo.size);
		expect(savedFileInfo.uploadDate).toBeInstanceOf(Date);
	});
	it('Should NOT prepare and save FileInfo - wrong rawFileInfo', async () => {
		fileRepository.saveFileInfo = jest
			.fn()
			.mockImplementationOnce((fileInfo: Omit<FileInfo, 'uploadDate'>): FileInfo => {
				return { ...fileInfo, uploadDate: new Date() };
			});

		const wrongFileNameResult = (): Promise<FileInfo> =>
			fileService.prepareAndSaveFileInfo(fileId, {
				...rawFileInfo,
				filename: 'file-name.extension',
			} as Express.Multer.File);

		await expect(wrongFileNameResult).rejects.toThrowError(PREPARE_FILE_INFO_FAILED);

		const wrongMimeTypeResult = (): Promise<FileInfo> =>
			fileService.prepareAndSaveFileInfo(fileId, {
				...rawFileInfo,
				mimetype: '',
			} as Express.Multer.File);

		await expect(wrongMimeTypeResult).rejects.toThrowError(PREPARE_FILE_INFO_FAILED);

		const wrongExtensionResult = (): Promise<FileInfo> =>
			fileService.prepareAndSaveFileInfo(fileId, {
				...rawFileInfo,
				filename: fileId + '#' + 'file-name',
			} as Express.Multer.File);

		await expect(wrongExtensionResult).rejects.toThrowError(PREPARE_FILE_INFO_FAILED);

		const wrongTitleResult = (): Promise<FileInfo> =>
			fileService.prepareAndSaveFileInfo(fileId, {
				...rawFileInfo,
				filename: fileId + '#' + '.extension',
			} as Express.Multer.File);

		await expect(wrongTitleResult).rejects.toThrowError(PREPARE_FILE_INFO_FAILED);
	});
	it('Should return correct file path', async () => {
		fileRepository.getInfoById = jest
			.fn()
			.mockImplementationOnce((fileId: string): FileInfo | null => {
				return fileId === fileInfo.id ? { ...fileInfo, uploadDate: new Date() } : null;
			});

		const filePath = await fileService.getFilePathById(fileId);
		expect(filePath).toEqual(
			path.join(
				process.cwd(),
				UPLOAD_DIR_TITLE,
				fileInfo.id + '#' + fileInfo.title + fileInfo.extension,
			),
		);
	});
	it('Should remove FileInfo and file', async () => {
		if (!fs.existsSync(filePath)) {
			fs.mkdirSync(filePath);
		}
		fs.writeFileSync(filePathWithFileName, 'file content');

		fileRepository.getInfoById = jest
			.fn()
			.mockImplementationOnce((fileId: string): FileInfo | null => {
				return fileId === fileInfo.id ? { ...fileInfo, uploadDate: new Date() } : null;
			});

		fileRepository.removeFileInfoById = jest
			.fn()
			.mockImplementationOnce((id: string): { affected: number } => {
				return id === fileId ? { affected: 1 } : { affected: 0 };
			});

		await fileService.removeFileInfoAndFile(fileId);

		const readFileResult = (): string =>
			fs.readFileSync(filePathWithFileName, { encoding: 'utf8', flag: 'r' });

		expect(fileRepository.removeFileInfoById).toHaveBeenCalledTimes(1);
		expect(readFileResult).toThrowError('ENOENT: no such file or directory, open ');
	});
	it('Should update FileInfo and file with new FileName', async () => {
		await updateFileInfoAndFileTest('new-' + originalFilename);
	});
	it('Should update FileInfo and file with the same FileName', async () => {
		await updateFileInfoAndFileTest(originalFilename);
	});
});
