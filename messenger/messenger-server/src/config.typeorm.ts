import { DataSource, DataSourceOptions } from 'typeorm';

import config from './config';

const dataSource = new DataSource(config().dbConfig as DataSourceOptions);

export default dataSource;
