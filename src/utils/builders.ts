import camelCase from "lodash/camelCase";
import { ProjectConfig } from "../types";

export function buildCustomFields(fields: any): string[] {
    const customFields: string[] = [];
    if (fields) {
      for (const f of Array.isArray(fields) ? fields : [fields]) {
        if (f.startsWith("customfield_")) {
          customFields.push(f);
        } else if (f.match(/\d{5}/)) {
          customFields.push(`customfield_${f}`);
        } else {
          customFields.push(camelCase(f));
        }
      }
    }
    return customFields;
  }
  
  export function buildProjectConfigs(projects: any): ProjectConfig[] {
    const projectConfigs: ProjectConfig[] = [];
  
    if (Array.isArray(projects)) {
      for (const v of projects) {
        if (isProjectKey(v)) {
          projectConfigs.push(buildProjectConfigWithKey(v));
        } else if (isProjectConfig(v)) {
          projectConfigs.push(v);
        }
      }
    } else if (isProjectKey(projects)) {
      projectConfigs.push(buildProjectConfigWithKey(projects));
    }
  
    return projectConfigs;
  }
  
  function buildProjectConfigWithKey(key: string): ProjectConfig {
    return { key };
  }
  
  function isProjectKey(v: any): boolean {
    return typeof v === "string" && v.trim() !== "";
  }
  
  function isProjectConfig(v: any): boolean {
    return v && isProjectKey(v.key);
  }