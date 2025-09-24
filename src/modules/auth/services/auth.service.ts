import { DbConfigService } from '@app/dbconfig';
import { Injectable } from '@nestjs/common';

@Injectable()
export class AuthService {
  constructor(private readonly db: DbConfigService) {}
  async create(body) {
    try {
      const { username, email, password } = body;

      // Get knex connection to "master" DB
      const db = await this.db.getKnex('master');

      // Insert into users table
      await db('users').insert({
        username,
        email,
        password,
      });

      await this.db.createAndApplySchema(username)

      return {message : "user created successfully"}
    } catch (error) {
      return error;
    }
  }
}
