import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { NewUserRegistered } from './auth.events';

@Injectable()
export class AuthListeners {
  private logger: Logger = new Logger('AuthListeners');

  @OnEvent('user.registered')
  async handleNewUserRegistration(event: NewUserRegistered) {
    this.logger.log(`Event User ${event.email} Has Been Handled`);
  }
}
