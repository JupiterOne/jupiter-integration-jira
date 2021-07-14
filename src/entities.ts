import { Entity } from '@jupiterone/integration-sdk-core';

export interface AccountEntity extends Entity {
  baseUrl: string;
  version: string;
  buildNumber: number;
  buildDate: number;
  scmInfo: string;
  serverTitle: string;
}

export const ACCOUNT_ENTITY_TYPE = 'jira_account';
export const ACCOUNT_ENTITY_CLASS = ['Account'];
export const ACCOUNT_PROJECT_RELATIONSHIP_TYPE = 'jira_account_has_project';
export const ACCOUNT_USER_RELATIONSHIP_TYPE = 'jira_account_has_user';

export interface ProjectEntity extends Entity {
  id: string;
  self: string;
  key: string;
  name: string;
  projectTypeKey: string;
  simplified: boolean;
  style: string;
  isPrivate: boolean;
}

export const PROJECT_ENTITY_TYPE = 'jira_project';
export const PROJECT_ENTITY_CLASS = ['Project'];
export const PROJECT_ISSUE_RELATIONSHIP_TYPE = 'jira_project_has_issue';
export const PROJECT_ISSUE_RELATIONSHIP_CLASS = 'HAS';
export interface UserEntity extends Entity {
  id: string;
  self: string;
  name: string;
  email: string;
  timeZone: string;
  active: boolean;
  accountType?: string;
}

export const USER_ENTITY_TYPE = 'jira_user';
export const USER_ENTITY_CLASS = ['User'];
export const USER_CREATED_ISSUE_RELATIONSHIP_TYPE = 'jira_user_created_issue';
export const USER_CREATED_ISSUE_RELATIONSHIP_CLASS = 'CREATED';
export const USER_REPORTED_ISSUE_RELATIONSHIP_TYPE = 'jira_user_reported_issue';
export const USER_REPORTED_ISSUE_RELATIONSHIP_CLASS = 'REPORTED';

export interface IssueEntity extends Entity {
  id: string;
  key: string;
  name: string;
  summary: string;
  description: string;
  category: string;
  webLink: string;
  status: string;
  active: boolean;
  issueType: string;
  reporter?: string;
  assignee?: string;
  creator: string;
  createdOn?: number;
  updatedOn?: number;
  resolvedOn?: number;
  dueOn?: number;
  labels: string[];
  components: string[];
  resolution?: string;
  priority: string;
}

export const ISSUE_ENTITY_TYPE = 'jira_issue';
export const ISSUE_ENTITY_CLASS = ['Record'];
export const CHANGE_ISSUE_ENTITY_CLASS = ['Change', 'Record'];
export const FINDING_ISSUE_ENTITY_CLASS = ['Finding', 'Record'];
export const INCIDENT_ISSUE_ENTITY_CLASS = ['Incident', 'Record'];
export const RISK_ISSUE_ENTITY_CLASS = ['Risk', 'Record'];
export const VULN_ISSUE_ENTITY_CLASS = ['Vulnerability', 'Record'];
