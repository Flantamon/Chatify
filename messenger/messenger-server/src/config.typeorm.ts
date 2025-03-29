import { DataSource, DataSourceOptions } from 'typeorm';

import config from './config';

// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
const dataSource = new DataSource(config().dbConfig as DataSourceOptions);

export default dataSource;
