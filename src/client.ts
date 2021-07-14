import {
  IntegrationLogger,
  IntegrationValidationError,
  IntegrationProviderAuthenticationError,
} from '@jupiterone/integration-sdk-core';

import { IntegrationConfig } from './config';
import { createJiraClient } from './jira';
import JiraClient from './jira/JiraClient';
import { buildProjectConfigs } from './utils/builders';
import { User, Project, Issue } from './jira/types';

export type ResourceIteratee<T> = (each: T) => Promise<void> | void;

//Jira documentation seems to indicate that max 100 replies will be returned per page
//However, since this has not been experimentally confirmed,
//we can leave USERS_PAGE_SIZE and ISSUES_PAGE_SIZE at the values in the old code
const USERS_PAGE_SIZE = 200;
const ISSUES_PAGE_SIZE = 200;

//As for xxx_PAGE_LIMIT, these are a guard against infinite loops in case of system errors
const USERS_PAGE_LIMIT = 10;
const ISSUES_PAGE_LIMIT = 10;

export class APIClient {
  jira: JiraClient;
  constructor(
    readonly config: IntegrationConfig,
    readonly logger: IntegrationLogger,
  ) {
    this.jira = createJiraClient(config);
  }

  public async verifyAuthentication(): Promise<void> {
    // the most light-weight request possible to validate
    // authentication works with the provided credentials, throw an err if
    // authentication fails
    let fetchedProjectKeys: string[];
    try {
      const fetchedProjects = await this.jira.fetchProjects();
      fetchedProjectKeys = fetchedProjects.map((p) => p.key);
    } catch (err) {
      throw new IntegrationProviderAuthenticationError(err);
    }

    const configProjectKeys = buildProjectConfigs(this.config.projects).map(
      (p) => p.key,
    );

    const invalidConfigProjectKeys = configProjectKeys.filter(
      (k) => !fetchedProjectKeys.includes(k),
    );
    if (invalidConfigProjectKeys.length) {
      throw new IntegrationValidationError(
        `The following project key(s) are invalid: ${JSON.stringify(
          invalidConfigProjectKeys,
        )}. Ensure the authenticated user has access to this project.`,
      );
    }
  }

  /**
   * Iterates each project resource in Jira.
   *
   * @param iteratee receives each resource to produce entities/relationships
   */
  public async iterateProjects(
    iteratee: ResourceIteratee<Project>,
  ): Promise<void> {
    const projects: Project[] = await this.jira.fetchProjects();
    for (const project of projects) {
      await iteratee(project);
    }
  }

  /**
   * Iterates each user resource in Jira.
   * Note that the current code processes a maximum of USERS_PAGE_SIZE * USERS_PAGE_LIMIT users
   * There may be further limitations on page size by the REST API itself
   *
   * @param iteratee receives each resource to produce entities/relationships
   */
  public async iterateUsers(iteratee: ResourceIteratee<User>): Promise<void> {
    let pagesProcessed = 0;
    let startAt: number = 0;
    let users: User[] = [];

    while (pagesProcessed < USERS_PAGE_LIMIT) {
      const usersPage = await this.jira.fetchUsersPage({
        startAt,
        pageSize: USERS_PAGE_SIZE,
      });

      if (usersPage.length === 0) {
        break;
      } else {
        users = users.concat(usersPage);
      }

      this.logger.info(
        { pagesProcessed, usersPageLength: usersPage.length },
        'Fetched page of users',
      );

      startAt += usersPage.length;
      pagesProcessed++;
    }

    if (pagesProcessed === USERS_PAGE_LIMIT) {
      this.logger.warn(
        { pagesProcessed, USERS_PAGE_LIMIT },
        'Reached maximum pages; may not have pulled all users. Consider increasing USERS_PAGE_LIMIT',
      );
    }

    for (const user of users) {
      await iteratee(user);
    }
  }

  /**
   * Iterates each issue (Record) resource in Jira.
   * Note that the current code processes a maximum of ISSUES_PAGE_SIZE * ISSUES_PAGE_LIMIT issues
   * There may be further limitations on page size by the REST API itself
   * But this limit is per project, and is called "since last execution time"
   *
   * @param iteratee receives each resource to produce entities/relationships
   */
  public async iterateIssues(
    projectKey: string,
    lastJobTimestamp: number,
    iteratee: ResourceIteratee<Issue>,
  ): Promise<void> {
    let pagesProcessed = 0;
    let startAt: number = 0;
    let issues: Issue[] = [];

    while (pagesProcessed < ISSUES_PAGE_LIMIT) {
      const issuesPage = await this.jira.fetchIssuesPage({
        project: projectKey,
        sinceAtTimestamp: lastJobTimestamp,
        startAt,
        pageSize: ISSUES_PAGE_SIZE,
      });

      if (issuesPage.length === 0) {
        break;
      } else {
        issues = issues.concat(issuesPage);
      }

      this.logger.info(
        { pagesProcessed, issuesPageLength: issuesPage.length },
        'Fetched page of issues',
      );

      startAt += issuesPage.length;
      pagesProcessed++;
    }

    if (pagesProcessed === ISSUES_PAGE_LIMIT) {
      this.logger.warn(
        { pagesProcessed, ISSUES_PAGE_LIMIT },
        'Reached maximum pages; may not have pulled all issues. Consider increasing ISSUES_PAGE_LIMIT',
      );
    }

    for (const issue of issues) {
      await iteratee(issue);
    }
  }
}

export function createAPIClient(
  config: IntegrationConfig,
  logger: IntegrationLogger,
): APIClient {
  return new APIClient(config, logger);
}
