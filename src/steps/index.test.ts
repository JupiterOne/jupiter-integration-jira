import {
  createMockStepExecutionContext,
  Recording,
} from '@jupiterone/integration-sdk-testing';

import { IntegrationConfig } from '../config';
import { integrationConfig } from '../../test/config';
import { fetchAccountDetails } from './account';
import { fetchUsers } from './users';
import { fetchIssues } from './issues';
import { fetchProjects } from './projects';
import { setupJiraRecording } from '../../test/recording';

let recording: Recording;

afterEach(async () => {
  await recording.stop();
});

test('should collect data', async () => {
  recording = setupJiraRecording({
    directory: __dirname,
    name: 'steps',
  });

  const context = createMockStepExecutionContext<IntegrationConfig>({
    instanceConfig: integrationConfig,
  });

  // Simulates dependency graph execution.
  // See https://github.com/JupiterOne/sdk/issues/262.
  await fetchAccountDetails(context);
  await fetchProjects(context);
  await fetchUsers(context);
  await fetchIssues(context);

  // Review snapshot, failure is a regression
  expect({
    numCollectedEntities: context.jobState.collectedEntities.length,
    numCollectedRelationships: context.jobState.collectedRelationships.length,
    collectedEntities: context.jobState.collectedEntities,
    collectedRelationships: context.jobState.collectedRelationships,
    encounteredTypes: context.jobState.encounteredTypes,
  }).toMatchSnapshot();

  const accounts = context.jobState.collectedEntities.filter((e) =>
    e._class.includes('Account'),
  );
  expect(accounts.length).toBeGreaterThan(0);
  expect(accounts).toMatchGraphObjectSchema({
    _class: ['Account'],
    schema: {
      additionalProperties: true,
      properties: {
        _type: { const: 'jira_account' },
        name: { type: 'string' },
        displayName: { type: 'string' },
        webLink: { type: 'string', format: 'url' },
        _rawData: {
          type: 'array',
          items: { type: 'object' },
        },
      },
      required: ['name', 'displayName', 'webLink'],
    },
  });

  const users = context.jobState.collectedEntities.filter((e) =>
    e._class.includes('User'),
  );
  expect(users.length).toBeGreaterThan(0);
  expect(users).toMatchGraphObjectSchema({
    _class: ['User'],
    schema: {
      additionalProperties: true,
      properties: {
        _type: { const: 'jira_user' },
        name: { type: 'string' },
        displayName: { type: 'string' },
        email: { type: 'string' },
        _rawData: {
          type: 'array',
          items: { type: 'object' },
        },
      },
      required: ['name', 'displayName', 'email'],
    },
  });

  const projects = context.jobState.collectedEntities.filter((e) =>
    e._class.includes('Project'),
  );
  expect(projects.length).toBeGreaterThan(0);
  expect(projects).toMatchGraphObjectSchema({
    _class: ['Project'],
    schema: {
      additionalProperties: true,
      properties: {
        _type: { const: 'jira_project' },
        name: { type: 'string' },
        displayName: { type: 'string' },
        id: { type: 'string' },
        key: { type: 'string' }, //not the same as ._key
        webLink: { type: 'string', format: 'url' },
        _rawData: {
          type: 'array',
          items: { type: 'object' },
        },
      },
      required: ['name', 'displayName', 'id', 'key', 'webLink'],
    },
  });

  const issues = context.jobState.collectedEntities.filter((e) =>
    e._class.includes('Record'),
  );
  expect(issues.length).toBeGreaterThan(0);
  expect(issues).toMatchGraphObjectSchema({
    _class: ['Record'], //this could actually have multiples in some cases
    schema: {
      additionalProperties: true,
      properties: {
        _type: { const: 'jira_issue' },
        name: { type: 'string' },
        displayName: { type: 'string' },
        id: { type: 'string' },
        key: { type: 'string' }, //not the same as ._key
        webLink: { type: 'string', format: 'url' },
        _rawData: {
          type: 'array',
          items: { type: 'object' },
        },
      },
      required: ['name', 'displayName', 'id', 'key', 'webLink'],
    },
  });
});
