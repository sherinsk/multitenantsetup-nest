import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import knex, { Knex } from 'knex';
import fs from 'fs';
import path from 'path';


@Injectable()
export class DbConfigService implements  OnModuleDestroy {
  private readonly adminConfig = {
    client: process.env.CLIENT,
    connection: {
      host: process.env.HOST,
      user: process.env.USER,
      password: process.env.PASSWORD,
      port: Number(process.env.PORT),
      multipleStatements: true,
    },
  };

  private readonly masterDb = 'master';
  private connections: Map<string, Knex> = new Map();

  /**
   * Runs at app bootstrap → ensure master DB exists
   */
  async onModuleInit() {
    try {
      console.log(`✅ Master DB "${this.masterDb}" is yet to create`);
      const knexAdmin = knex(this.adminConfig);

      // Ensure master DB exists
      await knexAdmin.raw(`CREATE DATABASE IF NOT EXISTS \`${this.masterDb}\``);

      await knexAdmin.destroy();

      // Open and keep connection for master DB
      const masterKnex = knex({
        client: process.env.CLIENT,
        connection: {
          host: process.env.HOST ,
          user: process.env.USER ,
          password: process.env.PASSWORD , // string
          port: Number(process.env.PORT), // number
          database: this.masterDb,
          multipleStatements: true,
        },
      });


      this.connections.set(this.masterDb, masterKnex);

      // ✅ Read SQL file
      const filePath = path.resolve('sqls/master/master.sql');
      const schemaSQL = fs.readFileSync(filePath, 'utf-8');

      // Execute SQL
      await masterKnex.raw(schemaSQL);

      console.log(`✅ Master DB "${this.masterDb}" is ready`);
    } catch (err) {
      console.error(
        `❌ Failed to initialize master DB "${this.masterDb}":`,
        err.message,
      );
      throw err; // rethrow so Nest knows startup failed
    }
  }

  /**
   * Get Knex connection for an existing DB.
   * If DB doesn’t exist, throw error (do not create it).
   */
  async getKnex(dbName: string): Promise<Knex> {
    if (this.connections.has(dbName)) {
      return this.connections.get(dbName)!;
    }

    try {
      const knexInstance = knex({
        ...this.adminConfig,
        connection: { ...this.adminConfig.connection, database: dbName },
      });

      // Test connection (will throw if DB doesn’t exist)
      await knexInstance.raw('SELECT 1');

      this.connections.set(dbName, knexInstance);
      return knexInstance;
    } catch (err) {
      throw new Error(
        `❌ Cannot connect to database "${dbName}": ${err.message}`,
      );
    }
  }

  /**
   * Clean up all connections on shutdown
   */
  async onModuleDestroy() {
    for (const conn of this.connections.values()) {
      await conn.destroy();
    }
  }
}
