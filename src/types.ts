export interface ProjectConfig {
  key: string;
}

export interface CreateIssueActionProperties {
  /**
   * The key of the issue project.
   */
  project: string;
  summary: string;
  classification: IssueTypeName;
  additionalFields?: object;
}

export type IssueTypeName =
  | 'Epic'
  | 'Improvement'
  | 'Task'
  | 'Sub-task'
  | 'New Feature';

export interface JiraParams {
  host: string;
  password: string;
  username: string;
}

export interface PaginationOptions {
  startAt?: number;
  pageSize?: number;
}

export interface IssuesOptions extends PaginationOptions {
  project: string;
  sinceAtTimestamp?: number;
}
