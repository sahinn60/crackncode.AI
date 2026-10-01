import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ConversationStatus } from '@prisma/client';

export class StartConversationDto {
  @IsOptional()
  @IsString()
  subject?: string;
}

export class SendSupportMessageDto {
  @IsString()
  content!: string;

  @IsOptional()
  @IsString()
  fileUrl?: string;

  @IsOptional()
  @IsString()
  fileName?: string;

  @IsOptional()
  @IsString()
  mimeType?: string;
}

export class AssignConversationDto {
  @IsString()
  agentId!: string;
}

export class UpdateStatusDto {
  @IsEnum(ConversationStatus)
  status!: ConversationStatus;
}

export class InternalNoteDto {
  @IsString()
  content!: string;
}

// Legacy — kept for compatibility
export class CreateSessionDto {
  @IsOptional()
  @IsString()
  title?: string;
}

export class SendMessageDto {
  @IsString()
  content!: string;
}
