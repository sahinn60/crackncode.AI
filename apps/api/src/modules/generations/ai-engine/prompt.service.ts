import { Injectable, BadRequestException } from '@nestjs/common';

@Injectable()
export class PromptService {
  /**
   * Replaces {{key}} placeholders in a template with values from input.
   * Throws if a required placeholder has no corresponding input value.
   */
  interpolate(template: string, input: Record<string, unknown>): string {
    return template.replace(/\{\{(\w+)\}\}/g, (match, key: string) => {
      if (!(key in input)) {
        throw new BadRequestException(`Missing required input field: ${key}`);
      }
      return String(input[key]);
    });
  }
}
