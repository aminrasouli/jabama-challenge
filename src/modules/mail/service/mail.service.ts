import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';

@Injectable()
export class MailService {
  private logger: Logger = new Logger(MailService.name);

  constructor(@InjectQueue('MailQueue') private mailQueue: Queue) {}

  async sendConfirmationEmail(email: string, token: string): Promise<void> {
    try {
      await this.mailQueue.add('confirmation', {
        email,
        token,
      });
    } catch (error) {
      this.logger.error(
        `Error during queueing confirmation email to user ${email}`,
      );
    }
  }
}
