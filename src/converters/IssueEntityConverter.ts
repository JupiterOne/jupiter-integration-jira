import {
  IntegrationLogger,
  parseTimePropertyValue,
} from '@jupiterone/integration-sdk-core';
import camelCase from 'lodash/camelCase';

import {
  CHANGE_ISSUE_ENTITY_CLASS,
  FINDING_ISSUE_ENTITY_CLASS,
  INCIDENT_ISSUE_ENTITY_CLASS,
  ISSUE_ENTITY_CLASS,
  ISSUE_ENTITY_TYPE,
  IssueEntity,
  RISK_ISSUE_ENTITY_CLASS,
  VULN_ISSUE_ENTITY_CLASS,
} from '../entities';
import { Field, Issue } from '../jira';
import parseContent from '../jira/parseContent';
import generateEntityKey from '../utils/generateEntityKey';
import {
  extractValueFromCustomField,
  UNABLE_TO_PARSE_RESPONSE,
} from './extractValueFromCustomField';

const DONE = [
  'done',
  'accepted',
  'closed',
  'canceled',
  'cancelled',
  'completed',
  'finished',
  'mitigated',
  'remediated',
  'resolved',
  'transferred',
];

export function createIssueEntity({
  issue,
  logger,
  fieldsById,
  customFieldsToInclude,
  requestedClass,
}: {
  issue: Issue;
  logger: IntegrationLogger;
  fieldsById?: { [id: string]: Field };
  customFieldsToInclude?: string[];
  requestedClass?: unknown;
}): IssueEntity {
  fieldsById = fieldsById || {};
  customFieldsToInclude = customFieldsToInclude || [];

  const status = issue.fields.status && issue.fields.status.name;
  const issueType = issue.fields.issuetype && issue.fields.issuetype.name;
  const customFields: { [key: string]: any } = {};

  for (const [key, value] of Object.entries(issue.fields)) {
    if (key.startsWith('customfield_') && value && fieldsById[key]) {
      const fieldName = camelCase(fieldsById[key].name);
      if (
        customFieldsToInclude.includes(key) ||
        customFieldsToInclude.includes(fieldName)
      ) {
        const extractedValue = extractValueFromCustomField(value);
        if (extractedValue === UNABLE_TO_PARSE_RESPONSE) {
          logger.warn({ fieldName }, 'Unable to parse custom field');
        } else {
          customFields[fieldName] = extractedValue;
        }
      }
    }
  }

  if (!['string', 'undefined'].includes(typeof requestedClass)) {
    logger.warn(
      { requestedClass },
      'Invalid entity class. Reverting to default.',
    );
    requestedClass = undefined;
  }

  let issueClass: string | string[];

  if (requestedClass) {
    issueClass = ['Record', requestedClass as string];
  } else {
    switch ((issueType || '').toLowerCase()) {
      case 'change':
        issueClass = CHANGE_ISSUE_ENTITY_CLASS;
        break;
      case 'finding':
      case 'exception':
        issueClass = FINDING_ISSUE_ENTITY_CLASS;
        break;
      case 'incident':
        issueClass = INCIDENT_ISSUE_ENTITY_CLASS;
        break;
      case 'risk':
        issueClass = RISK_ISSUE_ENTITY_CLASS;
        break;
      case 'vulnerability':
        issueClass = VULN_ISSUE_ENTITY_CLASS;
        break;
      default:
        issueClass = issue.key.startsWith('PRODCM')
          ? CHANGE_ISSUE_ENTITY_CLASS
          : ISSUE_ENTITY_CLASS;
    }
  }

  const entity = {
    _key: generateEntityKey(ISSUE_ENTITY_TYPE, issue.id),
    _type: ISSUE_ENTITY_TYPE,
    _class: issueClass,
    _rawData: [
      {
        name: 'default',
        rawData: issue as any,
      },
    ],
    ...customFields,
    id: issue.id,
    key: issue.key,
    name: issue.key,
    displayName: issue.key,
    summary: issue.fields.summary,
    description:
      (issue.fields.description &&
        parseContent(issue.fields.description.content)) ||
      'no description available',
    category: 'issue',
    webLink: `https://${issue.self.split('/')[2]}/browse/${issue.key}`,
    status,
    active: DONE.indexOf(status.toLowerCase()) < 0,
    issueType,
    reporter:
      issue.fields.reporter &&
      (issue.fields.reporter.emailAddress || issue.fields.reporter.displayName),
    assignee:
      issue.fields.assignee &&
      (issue.fields.assignee.emailAddress || issue.fields.assignee.displayName),
    creator:
      issue.fields.creator &&
      (issue.fields.creator.emailAddress || issue.fields.creator.displayName),
    createdOn: parseTimePropertyValue(issue.fields.created),
    updatedOn: parseTimePropertyValue(issue.fields.updated),
    resolvedOn: parseTimePropertyValue(issue.fields.resolutiondate),
    dueOn: parseTimePropertyValue(issue.fields.duedate),
    resolution: issue.fields.resolution
      ? issue.fields.resolution.name
      : undefined,
    labels: issue.fields.labels,
    components:
      issue.fields.components && issue.fields.components.map((c) => c.name),
    priority: issue.fields.priority && issue.fields.priority.name,
  };
  if (requestedClass) {
    entity._rawData.push({
      name: 'event',
      rawData: { requestedClass },
    });
  }
  return entity;
}
