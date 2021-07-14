import {
  IntegrationStep,
  IntegrationStepExecutionContext,
  RelationshipClass,
  createDirectRelationship,
  IntegrationMissingKeyError,
} from '@jupiterone/integration-sdk-core';

import { createAPIClient } from '../client';
import { IntegrationConfig } from '../config';
import { createIssueEntity } from '../converters/IssueEntityConverter';
import {
  PROJECT_ISSUE_RELATIONSHIP_TYPE,
  PROJECT_ENTITY_TYPE,
  ProjectEntity,
  ISSUE_ENTITY_TYPE,
  ISSUE_ENTITY_CLASS,
  IssueEntity,
  USER_ENTITY_TYPE,
  USER_CREATED_ISSUE_RELATIONSHIP_TYPE,
  USER_REPORTED_ISSUE_RELATIONSHIP_TYPE,
  UserEntity,
} from '../entities';
import { Field } from '../jira';
import { buildCustomFields } from '../utils/builders';
import generateEntityKey from '../utils/generateEntityKey';

export async function fetchIssues({
  instance,
  logger,
  jobState,
  executionHistory,
}: IntegrationStepExecutionContext<IntegrationConfig>) {
  const config = instance.config;
  const apiClient = createAPIClient(config, logger);

  const projectEntities = await jobState.getData<ProjectEntity[]>(
    'PROJECT_ARRAY',
  );
  if (!projectEntities) {
    throw new IntegrationMissingKeyError(
      `Expected to find projectEntities in jobState.`,
    );
  }

  //used in creation of issue
  const fields = await apiClient.jira.fetchFields();
  const fieldsById: { [id: string]: Field } = {};
  for (const field of fields) {
    fieldsById[field.id] = field;
  }

  //if configured, used in creation of issue
  const customFieldsToInclude = buildCustomFields(
    instance.config.customFields, //okay if falsy
  );

  const lastJobTimestamp = executionHistory.lastSuccessful?.startedOn || 0;
  for (const projectEntity of projectEntities) {
    //do not confuse projectEntity._key with projectEntity.key. They are different here.
    await apiClient.iterateIssues(
      projectEntity.key,
      lastJobTimestamp,
      async (issue) => {
        const issueEntity = (await jobState.addEntity(
          createIssueEntity({
            issue,
            logger,
            fieldsById,
            customFieldsToInclude,
          }),
        )) as IssueEntity;

        await jobState.addRelationship(
          createDirectRelationship({
            _class: RelationshipClass.HAS,
            from: projectEntity,
            to: issueEntity,
          }),
        );

        if (issue.fields.creator && issue.fields.creator.accountId) {
          const creatorUserKey = generateEntityKey(
            USER_ENTITY_TYPE,
            issue.fields.creator.accountId,
          );
          const creatorEntity = (await jobState.findEntity(
            creatorUserKey,
          )) as UserEntity;

          if (!creatorEntity) {
            throw new IntegrationMissingKeyError(
              `Expected user with key to exist (key=${creatorUserKey})`,
            );
          }

          await jobState.addRelationship(
            createDirectRelationship({
              _class: RelationshipClass.CREATED,
              from: creatorEntity,
              to: issueEntity,
            }),
          );
        }

        if (issue.fields.reporter && issue.fields.reporter.accountId) {
          const reporterUserKey = generateEntityKey(
            USER_ENTITY_TYPE,
            issue.fields.reporter.accountId,
          );
          const reporterEntity = (await jobState.findEntity(
            reporterUserKey,
          )) as UserEntity;

          if (!reporterEntity) {
            throw new IntegrationMissingKeyError(
              `Expected user with key to exist (key=${reporterUserKey})`,
            );
          }

          await jobState.addRelationship(
            createDirectRelationship({
              _class: RelationshipClass.REPORTED,
              from: reporterEntity,
              to: issueEntity,
            }),
          );
        }
      },
    );
  }
}

export const issueSteps: IntegrationStep<IntegrationConfig>[] = [
  {
    id: 'fetch-issues',
    name: 'Fetch Issues',
    entities: [
      {
        resourceName: 'Jira Issue',
        _type: ISSUE_ENTITY_TYPE,
        _class: ISSUE_ENTITY_CLASS,
        partial: true,
      },
    ],
    relationships: [
      {
        _type: PROJECT_ISSUE_RELATIONSHIP_TYPE,
        _class: RelationshipClass.HAS,
        sourceType: PROJECT_ENTITY_TYPE,
        targetType: ISSUE_ENTITY_TYPE,
        partial: true,
      },
      {
        _type: USER_CREATED_ISSUE_RELATIONSHIP_TYPE,
        _class: RelationshipClass.CREATED,
        sourceType: USER_ENTITY_TYPE,
        targetType: ISSUE_ENTITY_TYPE,
        partial: true,
      },
      {
        _type: USER_REPORTED_ISSUE_RELATIONSHIP_TYPE,
        _class: RelationshipClass.REPORTED,
        sourceType: USER_ENTITY_TYPE,
        targetType: ISSUE_ENTITY_TYPE,
        partial: true,
      },
    ],
    dependsOn: ['fetch-projects', 'fetch-users'],
    executionHandler: fetchIssues,
  },
];
