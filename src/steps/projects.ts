import {
    IntegrationStep,
    IntegrationStepExecutionContext,
    RelationshipClass,
    createDirectRelationship,
    IntegrationMissingKeyError
  } from '@jupiterone/integration-sdk-core';
  
  import { createAPIClient } from '../client';
  import { IntegrationConfig } from '../config';
  import { DATA_ACCOUNT_ENTITY } from './account';
  import {
    ACCOUNT_ENTITY_TYPE,
    ACCOUNT_PROJECT_RELATIONSHIP_TYPE,
    AccountEntity,
    PROJECT_ENTITY_TYPE,
    PROJECT_ENTITY_CLASS,
    ProjectEntity,
  } from "../entities";
import { createProjectEntity } from '../converters/ProjectEntityConverter';
  
export async function fetchProjects({
  instance,
  logger,
  jobState,
}: IntegrationStepExecutionContext<IntegrationConfig>) {
  const config = instance.config;
  const apiClient = createAPIClient(config, logger);

  const accountEntity = await jobState.getData<AccountEntity>(DATA_ACCOUNT_ENTITY);
  if (!accountEntity) { throw new IntegrationMissingKeyError(`Expected to find Account entity in jobState`)};

  //for use later in Issues
  const projectEntities: ProjectEntity[] = [];

  await apiClient.iterateProjects(async (project) => {
    const projectEntity = (await jobState.addEntity(
      createProjectEntity(project),
    )) as ProjectEntity;
  
  projectEntities.push(projectEntity);

  await jobState.addRelationship(
    createDirectRelationship({
        _class: RelationshipClass.HAS,
        from: accountEntity,
        to: projectEntity,
    }),
  );

  });

  await jobState.setData('PROJECT_ARRAY', projectEntities);
}

export const projectSteps: IntegrationStep<IntegrationConfig>[] = [
  {
    id: 'fetch-projects',
    name: 'Fetch Projects',
    entities: [
      {
        resourceName: 'Jira Project',
        _type: PROJECT_ENTITY_TYPE,
        _class: PROJECT_ENTITY_CLASS,
      },
    ],
    relationships: [
      {
        _type: ACCOUNT_PROJECT_RELATIONSHIP_TYPE,
        _class: RelationshipClass.HAS,
        sourceType: ACCOUNT_ENTITY_TYPE,
        targetType: PROJECT_ENTITY_TYPE,
      }
    ],
    dependsOn: ['fetch-account'],
    executionHandler: fetchProjects,
  },
];