import local from './local.json';
import dev from './dev.json';
import staging from './staging.json';

export type EnvironmentConfig = {
  environment: string;
  api_base_url: string;
  backoffice_base_url: string;
  app_base_url: string;
  ppob_nona_webview_base_url?: string;
  note?: string;
};

const configs: Record<string, EnvironmentConfig> = {
  local,
  dev,
  staging,
};

export const env = (process.env.TEST_ENV ?? 'local').toLowerCase();

export const config: EnvironmentConfig = configs[env] ?? local;
