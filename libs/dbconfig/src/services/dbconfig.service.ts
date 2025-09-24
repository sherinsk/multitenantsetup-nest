import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import knex, { Knex } from 'knex';
import fs from 'fs';
import path from 'path';

@Injectable()
export class DbConfigService implements OnModuleDestroy {
  private readonly masterDb = 'master';
  private connections: Map<string, Knex> = new Map();
  private adminConfig = {
    client: process.env.CLIENT,
    connection: {
      host: process.env.HOST,
      user: process.env.USER,
      password: process.env.PASSWORD,
      port: Number(process.env.PORT),
      multipleStatements: true,
    },
  };

  async onModuleInit() {
    try {
      const knexAdmin = knex(this.adminConfig);

      // 🔎 Check if master DB exists
      const result = await knexAdmin.raw(
        `SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = ?`,
        [this.masterDb],
      );

      const dbExists = result[0].length > 0;
      let masterKnex;

      if (!dbExists) {
        console.log(`✅ Welcome, Creating Master DB...`);

        await knexAdmin.raw(`CREATE DATABASE \`${this.masterDb}\``);

        const masterConfig = {
          client: process.env.CLIENT,
          connection: {
            host: process.env.HOST,
            user: process.env.USER,
            password: process.env.PASSWORD,
            port: Number(process.env.PORT),
            database: this.masterDb,
            multipleStatements: true,
          },
        };

        masterKnex = knex(masterConfig);

        const filePath = path.resolve('sqls/master/master.sql');
        const schemaSQL = fs.readFileSync(filePath, 'utf-8');
        await masterKnex.raw(schemaSQL);

        console.log(`✅ Master DB "${this.masterDb}" created`);
        console.log(`✅ Schema applied to "${this.masterDb}"`);
      } else {
        const masterConfig = {
          client: process.env.CLIENT,
          connection: {
            host: process.env.HOST,
            user: process.env.USER,
            password: process.env.PASSWORD,
            port: Number(process.env.PORT),
            database: this.masterDb,
            multipleStatements: true,
          },
        };

        masterKnex = knex(masterConfig);
        console.log(`✅ Hi, welcome back`);
      }

      await knexAdmin.destroy();

      this.connections.set(this.masterDb, masterKnex);

      console.log(`✅ Connected to Master DB "${this.masterDb}"`);
    } catch (err) {
      console.error(
        `❌ Failed to initialize master DB "${this.masterDb}":`,
        err,
      );
      throw err;
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
      const dbConfig = {
        client: process.env.CLIENT,
        connection: {
          host: process.env.HOST,
          user: process.env.USER,
          password: process.env.PASSWORD,
          port: Number(process.env.PORT),
          database: dbName,
          multipleStatements: true,
        },
      };

      const knexInstance = knex(dbConfig);

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

  async createAndApplySchema(dbName) {
    try {
      const knexAdmin = knex(this.adminConfig);

      // 🔎 Check if company DB exists
      const result = await knexAdmin.raw(
        `SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = ?`,
        [dbName],
      );

      const dbExists = result[0].length > 0;

      if (dbExists) {
        return { message: `${dbName} already exists...` };
      }

      console.log(`✅ Welcome, Creating Company DB...`);

      await knexAdmin.raw(`CREATE DATABASE \`${dbName}\``);

      const companyConfig = {
        client: process.env.CLIENT,
        connection: {
          host: process.env.HOST,
          user: process.env.USER,
          password: process.env.PASSWORD,
          port: Number(process.env.PORT),
          database: dbName,
          multipleStatements: true,
        },
      };

      let companyKnex = knex(companyConfig);

      const filePath = path.resolve('sqls/company/company.sql');
      const schemaSQL = fs.readFileSync(filePath, 'utf-8');
      await companyKnex.raw(schemaSQL);

      console.log(`✅ Company DB "${dbName}" created`);
      console.log(`✅ Schema applied to "${dbName}"`);

      return { message: `${dbName} created successfully...` };
    } catch (error) {
      throw new Error(
        `❌ Cannot connect to database "${dbName}": ${error.message}`,
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
