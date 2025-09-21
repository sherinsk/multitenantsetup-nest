import { Injectable } from '@nestjs/common';


@Injectable()
export class AuthService {
  create() {
    return {message : "created successfully"};
  }
}
