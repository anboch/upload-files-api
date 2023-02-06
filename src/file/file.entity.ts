import { Entity, Column, PrimaryColumn, CreateDateColumn } from 'typeorm';

@Entity()
export class FileInfo {
	@PrimaryColumn()
	id: string;

	@Column()
	title: string;

	@Column()
	extension: string;

	@Column()
	mimeType: string;

	@Column()
	size: number;

	@CreateDateColumn()
	uploadDate: Date;
}
