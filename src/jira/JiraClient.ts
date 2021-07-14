import JiraApi from 'jira-client';
import {
  IssuesOptions,
  IssueTypeName,
  JiraParams,
  PaginationOptions,
} from '../types';
import { Field, Issue, Project, ServerInfo, User } from './types';

export default class JiraClient {
  private client: JiraApi;

  constructor(params: JiraParams) {
    const { host, username, password } = params;
    this.client = new JiraApi({
      protocol: 'https',
      host,
      username,
      password,
      apiVersion: '3',
      strictSSL: true,
    });
  }

  public async addNewIssue(
    summary: string,
    projectId: number,
    issueTypeName: IssueTypeName,
    additionalFields: object = {},
  ): Promise<Issue> {
    const issue: Issue = (await this.client.addNewIssue({
      fields: {
        summary,
        project: {
          id: projectId,
        },
        issuetype: {
          name: issueTypeName,
        },
        ...additionalFields,
      },
    })) as Issue;
    return issue;
  }

  public async findIssue(issueIdOrKey: string): Promise<Issue> {
    const issue: Issue = (await this.client.findIssue(issueIdOrKey)) as Issue;
    return issue;
  }

  public async fetchFields(): Promise<Field[]> {
    const fields: Field[] = (await this.client.listFields()) as Field[];
    return fields;
  }

  public async fetchProjects(): Promise<Project[]> {
    const projects: Project[] = (await this.client.listProjects()) as Project[];
    return projects;
  }

  public async fetchServerInfo(): Promise<ServerInfo> {
    const info: ServerInfo = (await this.client.getServerInfo()) as ServerInfo;
    return info;
  }

  public async fetchIssuesPage({
    project,
    sinceAtTimestamp,
    startAt,
  }: IssuesOptions): Promise<Issue[]> {
    if (!project) {
      return [] as Issue[];
    }

    const projectQuery = `project='${project}'`;
    const sinceAtFilter = sinceAtTimestamp
      ? ` AND updated>=${sinceAtTimestamp}`
      : '';
    const searchString = `${projectQuery}${sinceAtFilter}`;

    const response = await this.client.searchJira(searchString, {
      startAt: startAt || 0,
    });

    return response.issues as Promise<Issue[]>;
  }

  public async fetchUsersPage(
    options: PaginationOptions = {},
  ): Promise<User[]> {
    return (this.client as any).getUsers(
      options.startAt || 0,
      options.pageSize,
    ) as Promise<User[]>;
  }

  /**
   * Converts a Jira project key to a Jira project id.
   *
   * e.g. TEST -> 12345
   */
  public async projectKeyToProjectId(projectKey: string) {
    const project: Project = (await this.client.getProject(
      projectKey,
    )) as Project;
    return Number(project.id);
  }
}
