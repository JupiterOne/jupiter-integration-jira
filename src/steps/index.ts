import { accountSteps } from './account';
import { projectSteps } from './projects';
import { userSteps } from './users';
import { issueSteps } from './issues';

const integrationSteps = [
  ...accountSteps,
  ...projectSteps,
  ...userSteps,
  ...issueSteps,
];

export { integrationSteps };