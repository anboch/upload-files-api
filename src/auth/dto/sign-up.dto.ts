import { IsString } from 'class-validator';

export class SignUpDto {
	@IsString()
	id: string;

	@IsString()
	password: string;
}
