import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export type S3SettingsConfig = {
  awsAccessKey: string;
  awsSecretKey: string;
  awsS3Endpoint: string;
  awsS3Bucket: string;
  awsS3Region?: string;
};

export type Config = {
  dbConfig: TypeOrmModuleOptions;
  S3Config: S3SettingsConfig;
};
console.log(process.env.PG_HOST);
console.log(process.env.PG_DATABASE);
export default (): Config => ({
  dbConfig: {
    type: 'postgres',
    host: process.env.PG_HOST,
    port: parseInt(process.env.PG_PORT || '5432', 10),
    username: process.env.PG_USER,
    password: process.env.PG_PASSWORD,
    database: process.env.PG_DATABASE,
    entities: [__dirname + '/**/*.entity{.ts,.js}'],
    migrations: [__dirname + '/migrations/**/*{.ts,.js}'],
    synchronize: false,
    ssl: Boolean(process.env.PG_SSL),
    extra: {
      ssl: process.env.PG_SSL ? { rejectUnauthorized: false } : null,
    },
  },
  S3Config: {
    awsAccessKey: process.env.S3_ACCESS || '',
    awsSecretKey: process.env.S3_SECRET || '',
    awsS3Endpoint: process.env.S3_ENDPOINT || '',
    awsS3Bucket: process.env.S3_BUCKET || '',
    awsS3Region: process.env.S3_REGION || '',
  },
});
