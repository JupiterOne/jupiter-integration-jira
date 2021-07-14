import { CreateIssueActionProperties } from '../types';
import JiraClient from './JiraClient';
import { Issue } from './types';

async function getProjectIdFromProvidedProject(
  client: JiraClient,
  project: string,
): Promise<number> {
  const projectId = Number(project);

  if (!isNaN(projectId)) {
    if (project.includes('.')) {
      throw new Error(`Invalid project id provided (projectId=${project})`);
    }

    if (!Number.isInteger(projectId)) {
      throw new Error(`Invalid project id provided (projectId=${projectId})`);
    }

    return projectId;
  }

  return client.projectKeyToProjectId(project);
}

export default async function createJiraIssue(
  client: JiraClient,
  action: { properties: CreateIssueActionProperties; [k: string]: any },
): Promise<Issue> {
  const { summary, classification, project, additionalFields } =
    action.properties;

  const projectId = await getProjectIdFromProvidedProject(client, project);
  const newIssue = await client.addNewIssue(
    summary,
    projectId,
    classification,
    additionalFields,
  );

  return client.findIssue(newIssue.key);
}
