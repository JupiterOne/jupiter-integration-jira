import * as dotenv from 'dotenv';
import * as path from 'path';
import { IntegrationConfig } from '../src/config';

if (process.env.LOAD_ENV) {
  dotenv.config({
    path: path.join(__dirname, '../.env'),
  });
}
const DEFAULT_JIRA_HOST = 'kei-institute.atlassian.net'; //the recordings are under this
const DEFAULT_JIRA_USERNAME = 'fakename';
const DEFAULT_JIRA_PASSWORD = 'fakekey';
const DEFAULT_PROJECTS = 'fakeproject';

export const integrationConfig: IntegrationConfig = {
  jiraHost: process.env.JIRA_HOST || DEFAULT_JIRA_HOST,
  jiraUsername: process.env.JIRA_USERNAME || DEFAULT_JIRA_USERNAME,
  jiraPassword: process.env.JIRA_PASSWORD || DEFAULT_JIRA_PASSWORD,
  projects: process.env.PROJECTS || DEFAULT_PROJECTS,
};
