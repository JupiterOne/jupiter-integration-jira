import {
  PROJECT_ENTITY_CLASS,
  PROJECT_ENTITY_TYPE,
  ProjectEntity,
} from '../entities';
import { Project } from '../jira';

import generateEntityKey from '../utils/generateEntityKey';

export function createProjectEntity(project: Project): ProjectEntity {
  const projectEntity: ProjectEntity = {
    _key: generateEntityKey(PROJECT_ENTITY_TYPE, project.id),
    _type: PROJECT_ENTITY_TYPE,
    _class: PROJECT_ENTITY_CLASS,
    _rawData: [{ name: 'default', rawData: project }],
    id: project.id,
    displayName: project.name,
    self: project.self,
    key: project.key,
    name: project.name,
    projectTypeKey: project.projectTypeKey,
    simplified: project.simplified,
    style: project.style,
    isPrivate: project.isPrivate,
    webLink:
      project.url ||
      `https://${project.self.split('/')[2]}/browse/${project.key}`,
  };

  return projectEntity;
}
