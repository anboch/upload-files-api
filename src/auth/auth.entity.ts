import { Entity, Column, PrimaryColumn, Index } from 'typeorm';

@Entity()
export class JWTBlacklist {
	@PrimaryColumn()
	token: string;

	@Index()
	@Column({ type: 'int', nullable: true })
	tokenExpiresOnSec: number | null;
}

@Entity()
export class Session {
	@PrimaryColumn()
	accessToken: string;

	@Column()
	refreshToken: string;
}
