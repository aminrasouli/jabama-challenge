import { MailerService } from '@nestjs-modules/mailer';
import { OnQueueActive, OnQueueCompleted, OnQueueFailed, Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { ConfigService } from '@nestjs/config';

interface ConfirmationMailJob {
  email: string;
  token: string;
}

@Processor('MailQueue')
export class MailProcessor {
  private logger: Logger = new Logger(MailProcessor.name);

  constructor(private readonly configService: ConfigService, private readonly mailerService: MailerService) {}

  @OnQueueActive()
  onActive(job: Job<ConfirmationMailJob>) {
    this.logger.log(`Processing sending mail ${job.id} of type ${job.name}. data: ${JSON.stringify(job.data)}`);
  }

  @OnQueueCompleted()
  async onComplete(job: Job<ConfirmationMailJob>) {
    job.remove().then();
    this.logger.log(`Completed sending mail ${job.id} of type ${job.name}.`);
  }

  @OnQueueFailed()
  async onError(job: Job<ConfirmationMailJob>, error: any) {
    job.retry().then();
    this.logger.error(`Failed sending mail ${job.id} of type ${job.name}: ${error.message}`, error.stack);
  }

  @Process('confirmation')
  async sendWelcomeEmail(job: Job<ConfirmationMailJob>): Promise<any> {
    const { email, token } = job.data;
    this.logger.log(`Sending confirmation email to '${email}'`);

    const link = `${this.configService.get<string>('APP_URL')}/auth/confirm-mail/${token}`;

    try {
      await this.mailerService.sendMail({
        template: 'confirmation',
        context: { link },
        subject: 'Confirm your email',
        to: email,
      });
    } catch (error) {
      this.logger.error(`Failed to send confirmation email to '${email}'`, error.stack);
      throw error;
    }
  }
}
