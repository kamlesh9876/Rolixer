import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHealth() {
    return {
      status: 'ok',
      info: {
        database: 'connected',
        timestamp: new Date().toISOString(),
      },
    };
  }
}
