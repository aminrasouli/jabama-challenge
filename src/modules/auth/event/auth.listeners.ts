import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { NewUserRegistered } from './auth.events';
import { MailService } from '../../mail/service/mail.service';

@Injectable()
export class AuthListeners {
  private logger: Logger = new Logger(AuthListeners.name);

  constructor(private readonly mailService: MailService) {}

  @OnEvent('user.registered')
  async handleNewUserRegistration(event: NewUserRegistered) {
    const { email, confirmationTokenEmail } = event;
    await this.mailService.sendConfirmationEmail(email, confirmationTokenEmail);
    this.logger.log(`Event User ${event.email} Has Been Handled`);
  }
}
