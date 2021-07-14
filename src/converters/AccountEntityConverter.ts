import {
  ACCOUNT_ENTITY_CLASS,
  ACCOUNT_ENTITY_TYPE,
  AccountEntity,
} from '../entities';
import { parseTimePropertyValue } from '@jupiterone/integration-sdk-core';
import { ServerInfo } from '../jira';
import generateEntityKey from '../utils/generateEntityKey';

export function createAccountEntity(serverInfo: ServerInfo): AccountEntity {
  return {
    _class: ACCOUNT_ENTITY_CLASS,
    _key: generateEntityKey(ACCOUNT_ENTITY_TYPE, serverInfo.baseUrl),
    _type: ACCOUNT_ENTITY_TYPE,
    displayName: serverInfo.serverTitle,
    name: serverInfo.serverTitle,
    webLink: serverInfo.baseUrl,
    baseUrl: serverInfo.baseUrl,
    version: serverInfo.version,
    buildNumber: serverInfo.buildNumber,
    buildDate: parseTimePropertyValue(serverInfo.buildDate)!,
    scmInfo: serverInfo.scmInfo,
    serverTitle: serverInfo.serverTitle,
  };
}
