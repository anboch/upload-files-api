import 'reflect-metadata';
import { injectable } from 'inversify';
import multer, { Multer, StorageEngine } from 'multer';
import fs from 'fs';
import * as path from 'path';

import { UPLOAD_DIR_TITLE } from '../common/constants';

@injectable()
export class MulterService {
	storage: StorageEngine;
	upload: Multer;

	constructor() {
		this.storage = multer.diskStorage({
			destination: function (req, file, cb) {
				fs.mkdir(path.join(process.cwd(), UPLOAD_DIR_TITLE), () => {
					cb(null, path.join(process.cwd(), UPLOAD_DIR_TITLE));
				});
			},

			filename: function (req, file, cb) {
				cb(null, req.fileId + '#' + file.originalname);
			},
		});
		this.upload = multer({ storage: this.storage });
	}
}
