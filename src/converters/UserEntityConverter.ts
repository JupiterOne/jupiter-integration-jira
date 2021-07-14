import { USER_ENTITY_CLASS, USER_ENTITY_TYPE, UserEntity } from '../entities';
import { User } from '../jira';
import generateEntityKey from '../utils/generateEntityKey';

export function createUserEntity(user: User): UserEntity {
  return {
    _key: generateEntityKey(USER_ENTITY_TYPE, user.accountId),
    _type: USER_ENTITY_TYPE,
    _class: USER_ENTITY_CLASS,
    _rawData: [{ name: 'default', rawData: user }],
    id: user.accountId,
    displayName: user.displayName,
    self: user.self,
    name: user.name || user.displayName,
    email: user.emailAddress || 'donotemail@example.com', //some system users in Jira don't have emails, but SDK requires it
    timeZone: user.timeZone,
    active: user.active,
    accountType: user.accountType,
    username: user.emailAddress || user.displayName, //some system users in Jira don't have emails
    webLink: `https://${user.self.split('/')[2]}/jira/people/${user.accountId}`,
  };
}
