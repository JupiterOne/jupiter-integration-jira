import {
  IntegrationProviderAuthenticationError,
  IntegrationValidationError,
} from '@jupiterone/integration-sdk-core';
import {
  createMockExecutionContext,
  setupRecording,
} from '@jupiterone/integration-sdk-testing';
import { integrationConfig } from '../test/config';
import { IntegrationConfig, validateInvocation } from './config';
import nock from 'nock';

it('requires valid config', async () => {
  const executionContext = createMockExecutionContext<IntegrationConfig>({
    instanceConfig: {} as IntegrationConfig,
  });

  await expect(validateInvocation(executionContext)).rejects.toThrow(
    IntegrationValidationError,
  );
});

it('auth error', async () => {
  const recording = setupRecording({
    directory: '__recordings__',
    name: 'client-auth-error',
  });

  recording.server.any().intercept((req, res) => {
    res.status(401);
  });

  const executionContext = createMockExecutionContext({
    instanceConfig: integrationConfig,
  });

  await expect(validateInvocation(executionContext)).rejects.toThrow(
    IntegrationProviderAuthenticationError,
  );
});

describe('projects', () => {
  beforeAll(() => {
    nock.back.fixtures = `${__dirname}/../test/fixtures/`;
    process.env.CI
      ? nock.back.setMode('lockdown')
      : nock.back.setMode('record');
  });

  test('valid projects', async () => {
    const { nockDone } = await nock.back('invocation-projects.json');

    const executionContext = {
      instance: {
        config: {
          jiraHost: 'fake-hostname.atlassian.net',
          jiraUsername: 'fakeLogin',
          jiraPassword: 'fakePassword',
          projects: ['IR'],
        },
      },
    };

    const result = await validateInvocation(executionContext as any);

    expect(result).toBeUndefined();
    nockDone();
  });

  test('invalid projects', async () => {
    const { nockDone } = await nock.back('invocation-projects.json');

    const executionContext = {
      instance: {
        config: {
          jiraHost: 'fake-hostname.atlassian.net',
          jiraUsername: 'fakeLogin',
          jiraPassword: 'fakePassword',
          projects: ['INVALID_PROJECT'],
        },
      },
    };

    try {
      await validateInvocation(executionContext as any);
    } catch (e) {
      expect(e.message).toMatch(
        'The following project key(s) are invalid: ["INVALID_PROJECT"]. Ensure the authenticated user has access to this project.',
      );
    }
    nockDone();
  });
});
