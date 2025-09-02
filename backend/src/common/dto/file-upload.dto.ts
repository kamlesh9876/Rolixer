import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export class FileUploadDto {
  @ApiProperty({ type: 'string', format: 'binary', required: false })
  file?: any;

  @IsString()
  @IsOptional()
  folder?: string;
}

export class MultipleFileUploadDto {
  @ApiProperty({ type: 'array', items: { type: 'string', format: 'binary' } })
  files: any[];

  @IsString()
  @IsOptional()
  folder?: string;

  @IsNumber()
  @Min(1)
  @Max(10)
  @IsOptional()
  maxFiles: number = 5;
}

export class FileResponseDto {
  @ApiProperty()
  url: string;

  @ApiProperty()
  key: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  size: number;

  @ApiProperty()
  mimetype: string;

  @ApiProperty()
  uploadedAt: Date;
}

export class DeleteFilesDto {
  @IsArray()
  @IsString({ each: true })
  keys: string[];
}
