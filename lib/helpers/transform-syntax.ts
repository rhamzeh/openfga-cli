/* eslint-disable @typescript-eslint/no-explicit-any */
import _ from 'lodash';
import yaml from 'js-yaml';

import { Keywords } from './dsl';
import { assertNever } from '../utils/assert-never';
import { apiSyntaxToFriendlySyntax, friendlySyntaxToApiSyntax } from '@openfga/syntax-transformer';
import { AuthorizationModel } from './openfga/fga.adapter';

const v1ToApiSyntax = (config: any) => {
  const result: Record<string, any> = {};

  if (config === 'self') {
    return { this: {} };
  }

  for (const entry of Object.entries(config)) {
    let [key, value]: any = entry;

    switch (key) {
      case 'diff':
        key = 'difference';
        break;
      case 'allOf':
        key = 'intersection';
        value = { child: value };
        break;
      case 'usersRelatedToObjectAs':
        key = 'computedUserset';
        value = { relation: value };
        break;
      case 'anyOf':
        key = 'union';
        value = { child: value };
        break;
      case 'fromObjects':
        key = 'tupleToUserset';
        break;
      case 'relatedToObjectAs':
        key = 'tupleset';
        value = { relation: value };
        break;
      case 'name':
        key = 'type';
        break;
      case 'namespaces':
        key = 'type_definitions';
        break;
      default:
        break;
    }

    switch (value) {
      case 'self': {
        value = { this: {} };
        break;
      }
      default:
        break;
    }

    if (Array.isArray(value)) {
      const xs = [];

      for (const item of value) {
        xs.push(v1ToApiSyntax(item));
      }

      result[key] = xs;
      continue;
    }

    if (typeof value === 'object') {
      result[key] = v1ToApiSyntax(value);
      continue;
    }

    result[key] = value;
  }

  return result;
};

export const transformToApiSyntax = (code: string, fromSyntaxFormat: SyntaxFormat): AuthorizationModel => {
  switch (fromSyntaxFormat) {
    case SyntaxFormat.Api:
      return JSON.parse(code);
    case SyntaxFormat.Friendly1:
      return v1ToApiSyntax(yaml.load(code)) as AuthorizationModel;
    case SyntaxFormat.Friendly2:
      return friendlySyntaxToApiSyntax(code);
    default:
      throw new Error('unsupported_syntax_format');
  }
};

const apiToFriendlySyntaxV1 = (config: Record<string, any>) => {
  const result: Record<string, any> = {};

  for (const entry of Object.entries(config)) {
    let [key, value]: any = entry;

    switch (key) {
      case 'difference':
        key = 'diff';
        break;
      case 'intersection':
        key = 'allOf';
        value = value.child;
        break;
      case 'computedUserset':
        key = 'usersRelatedToObjectAs';
        value = value.relation;
        break;
      case 'union':
        key = 'anyOf';
        value = value.child;
        break;
      case 'this':
        return 'self';
      case 'tupleToUserset':
        key = 'fromObjects';
        break;
      case 'tupleset':
        key = 'relatedToObjectAs';
        value = value.relation;
        break;
      default:
        break;
    }

    if (Array.isArray(value)) {
      const xs = [];

      for (const item of value) {
        xs.push(apiToFriendlySyntaxV1(item));
      }

      result[key] = xs;
      continue;
    }

    if (typeof value === 'object') {
      result[key] = apiToFriendlySyntaxV1(value);
      continue;
    }

    result[key] = value;
  }

  return result;
};

const readFrom = (obj: any, define: string[]) => {
  const childKeys = Object.keys(obj);

  _.forEach(childKeys, (childKey: string) => {
    if (childKey === 'this') {
      define.push(Keywords.SELF);
    }

    if (childKey === 'tupleToUserset') {
      define.push(`${obj[childKey].computedUserset.relation} ${Keywords.FROM} ${obj[childKey].tupleset.relation}`);
    }

    if (childKey === 'computedUserset') {
      define.push(`${obj[childKey].relation}`);
    }
  });
};

const apiToFriendlyV2Relation = (
  relation: string,
  relationDefinition: any,
  relations: string[],
  idx: number,
  newSyntax: string[],
) => {
  const define = [`    ${Keywords.DEFINE} ${relation} ${Keywords.AS} `];
  const relationKeys = Object.keys(relationDefinition);

  // Read simple definitions
  readFrom(relationDefinition, define);

  _.forEach(relationKeys, (relationKey: any) => {
    if (relationKey === 'union') {
      const children = relationDefinition[relationKey].child;
      _.forEach(children, (child: any, idx: number) => {
        readFrom(child, define);

        if (idx < children.length - 1) {
          define.push(` ${Keywords.OR} `);
        }
      });
    }

    if (relationKey === 'intersection') {
      const children = relationDefinition[relationKey].child;
      _.forEach(children, (child: any, idx: number) => {
        readFrom(child, define);

        if (idx < children.length - 1) {
          define.push(` ${Keywords.AND} `);
        }
      });
    }

    if (relationKey === 'difference') {
      const { base, subtract } = relationDefinition[relationKey];

      readFrom(base, define);
      define.push(` ${Keywords.BUT_NOT} `);
      readFrom(subtract, define);
    }
  });

  if (relations.length === idx + 1) {
    // define.push("\n");
  }

  newSyntax.push(define.join(''));
};

export enum SyntaxFormat {
  Api = 'api',
  Friendly1 = 'friendly_v1',
  Friendly2 = 'friendly_v2',
}

export enum SupportedFileExtension {
  Json = 'json',
  Yaml = 'yaml',
  Yml = 'yml',
  Scl = 'scl',
  Dsl = 'dsl',
  Fga = 'fga',
  Ofga = 'ofga',
  OpenFga = 'openfga',
}

export function getSyntaxFormatFromFileExtension(fileExtension: SupportedFileExtension): SyntaxFormat {
  switch (fileExtension) {
    case SupportedFileExtension.Json:
      return SyntaxFormat.Api;
    case SupportedFileExtension.Yaml:
    case SupportedFileExtension.Yml:
      return SyntaxFormat.Friendly1;
    case SupportedFileExtension.Dsl:
    case SupportedFileExtension.Scl:
    case SupportedFileExtension.Fga:
    case SupportedFileExtension.Ofga:
    case SupportedFileExtension.OpenFga:
      return SyntaxFormat.Friendly2;
    default:
      assertNever(fileExtension);
  }
}

export const loadSyntax = (authorizationModel: AuthorizationModel, format: SyntaxFormat = SyntaxFormat.Api) => {
  switch (format) {
    case SyntaxFormat.Friendly1:
      return yaml.dump(apiToFriendlySyntaxV1(authorizationModel));
    case SyntaxFormat.Friendly2:
      return apiSyntaxToFriendlySyntax(authorizationModel);
    case SyntaxFormat.Api:
    default:
      return JSON.stringify(_.omit(authorizationModel, ['id']), null, '  ');
  }
};
