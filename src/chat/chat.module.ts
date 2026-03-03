import { Module } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { ChatGateway } from './chat.gateway';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule], // imports JwtModule for Gateway token verification
  controllers: [ChatController],
  providers: [ChatService, ChatGateway],
  exports: [ChatGateway],
})
export class ChatModule { }
