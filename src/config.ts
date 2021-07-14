import {
  IntegrationExecutionContext,
  IntegrationValidationError,
  IntegrationInstanceConfigFieldMap,
  IntegrationInstanceConfig,
} from '@jupiterone/integration-sdk-core';
import { createAPIClient } from './client';

/**
 * A type describing the configuration fields required to execute the
 * integration for a specific account in the data provider.
 *
 * When executing the integration in a development environment, these values may
 * be provided in a `.env` file with environment variables. For example:
 *
 * - `CLIENT_ID=123` becomes `instance.config.clientId = '123'`
 * - `CLIENT_SECRET=abc` becomes `instance.config.clientSecret = 'abc'`
 *
 * Environment variables are NOT used when the integration is executing in a
 * managed environment. For example, in JupiterOne, users configure
 * `instance.config` in a UI.
 *
 */
export const instanceConfigFields: IntegrationInstanceConfigFieldMap = {
  jiraHost: {
    type: 'string',
    mask: false,
  },
  jiraUsername: {
    type: 'string',
    mask: false,
  },
  jiraPassword: {
    type: 'string',
    mask: true,
  },
  projects: {
    type: 'string', //we wish it were an array. since it can't be, we expect a JSON array as a string
    mask: false,
  },
};

/**
 * Properties provided by the `IntegrationInstance.config`. Normally reflects the
 * same properties defined by `instanceConfigFields`. See note above.
 */
export interface IntegrationConfig extends IntegrationInstanceConfig {
  /**
   * The Jira host
   */
  jiraHost: string;

  /**
   * The Jira username
   */
  jiraUsername: string;

  /**
   * The Jira password
   */
  jiraPassword: string;

  /**
   * Projects, as an array of strings
   */
  projects: string[] | string;

  /**
   * Custom fields for inclusion in issues
   */
  customFields?: string[];
}

export async function validateInvocation(
  context: IntegrationExecutionContext<IntegrationConfig>,
) {
  const { config } = context.instance;

  let parsedProjects: string[] = [];
  if (typeof config.projects === 'string') {
    try {
      parsedProjects = JSON.parse(config.projects);
      config.projects = parsedProjects;
    } catch (err) {
      //if the JSON parsing failed, just leave config.projects alone
    }
  }

  if (!config.jiraHost || !config.jiraPassword || !config.jiraUsername) {
    throw new IntegrationValidationError(
      'config.jiraHost and config.jiraPassword and config.jiraUsername must be provided by the user',
    );
  }

  //this regex matches 'localhost', 'example.com', 'subdomain.example.com'
  //but cannot contain any chars other than letters, numbers, '-' and '.'
  const hostnameRegex =
    /^(([a-zA-Z0-9]|[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9])\.)*([A-Za-z0-9]|[A-Za-z0-9][A-Za-z0-9-]*[A-Za-z0-9])$/;
  if (!config.jiraHost.match(hostnameRegex)) {
    throw new IntegrationValidationError(
      'config.jiraHost must be a valid hostname. (ex: localhost, test.com, sub.test.com)',
    );
  }

  const apiClient = createAPIClient(config, context.logger);
  await apiClient.verifyAuthentication();
}
