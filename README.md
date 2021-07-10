[![npm](https://img.shields.io/npm/v/@rhamzeh/openfga-cli.svg?style=flat)](https://www.npmjs.com/package/@rhamzeh/openfga-cli)
[![Release](https://img.shields.io/github/v/release/rhamzeh/openfga-cli?sort=semver&color=green)](https://github.com/rhamzeh/openfga-cli/releases)
[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](./LICENSE)
[![FOSSA Status](https://app.fossa.com/api/projects/git%2Bgithub.com%2Frhamzeh%2Fopenfga-cli.svg?type=shield)](https://app.fossa.com/projects/git%2Bgithub.com%2Frhamzeh%2Fopenfga-cli?ref=badge_shield)
[![Tests](https://github.com/rhamzeh/openfga-cli/actions/workflows/main.yaml/badge.svg)](https://github.com/rhamzeh/openfga-cli/actions/workflows/main.yaml)

# OpenFGA CLI (Unofficial)

> Note: this is an unofficial CLI for interacting with the OpenFGA API. It is not maintained by the core OpenFGA team, nor does it come with any guarantees from them

This was a hackathon project by @rhamzeh and @adriantam to make interacting with a custom OpenFGA hosted environment, or managed Auth0 FGA environment easier through the CLI.

## Dependencies

Requires [node.js](https://nodejs.org/) and [Typescript](https://www.typescriptlang.org/) to be installed.

## Installation

### From npm
```shell
npm i -g @rhamzeh/openfga-cli
```

### Manual

1. Clone the repo locally
2. Navigate to the directory
3. Run `npm install`
4. Run `npm run build`
5. Run `npm link`

The `openfga-cli-node` command will now be available for you to use.

## Shell completions

The completions are exposed via `openfga-cli-node completion`

To add them to your shell:
* bash
```shell
openfga-cli-node completion >> ~/.bashrc # or openfga-cli-node completion >> ~/.bash_profile
```
* zsh
```shell
openfga-cli-node completion >> ~/.zshrc # or openfga-cli-node completion >> ~/.zsh_profile
```

## Usage

```shell
openfga-cli-node <options> <command>

Options:
--version               Show version number                                      [boolean]
--help                  Show help                                                [boolean]

Commands:
  openfga-cli-node check [storeId]           Check whether a user is related to an object as a certain relation
      Options:
      --help                  Show help                                                [boolean]
      --storeId               OpenFGA Store ID. env var=OPENFGA_STORE_ID           [string] [required]
      --environment           Known Environment. env var=OPENFGA_ENVIRONMENT     [string] [choices: "us", "staging", "playground", "custom"] [default: "custom"]
      --apiScheme             API Scheme. env var=OPENFGA_API_SCHEME [string]
      --apiHost               API Host. env var=OPENFGA_API_HOST [string]
      --clientId              OpenFGA Client Id. env var=OPENFGA_CLIENT_ID         [string]
      --clientSecret          OpenFGA Client Secret. env var=OPENFGA_CLIENT_SECRET [string]
      --apiTokenIssuer          OpenFGA API Token Issuer. env var=OPENFGA_API_TOKEN_ISSUER [string]
      --apiAudience          OpenFGA API Audience. env var=OPENFGA_API_AUDIENCE [string]
      --apiToken          OpenFGA API Token. env var=OPENFGA_API_TOKEN [string]
      --authorizationModelId  Authorization Model ID. env var=OPENFGA_AUTHORIZATION_MODEL_ID
                              [string] [default: "latest"]
                              
      --user                  User. env var=OPENFGA_USER                             [string] [required]
      --relation              Relation. env var=OPENFGA_RELATION                     [string] [required]
      --object                Object. env var=OPENFGA_OBJECT                         [string] [required]
                                          
  openfga-cli-node deploy [configDir]        Deploy Authorization Model
      Options:
      --help                  Show help                                                [boolean]
      --storeId               OpenFGA Store ID. env var=OPENFGA_STORE_ID           [string] [required]
      --environment           Known Environment. env var=OPENFGA_ENVIRONMENT     [string] [choices: "us", "staging", "playground", "custom"] [default: "custom"]
      --apiScheme             API Scheme. env var=OPENFGA_API_SCHEME [string]
      --apiHost               API Host. env var=OPENFGA_API_HOST [string]
      --clientId              OpenFGA Client Id. env var=OPENFGA_CLIENT_ID         [string]
      --clientSecret          OpenFGA Client Secret. env var=OPENFGA_CLIENT_SECRET [string]
      --apiTokenIssuer          OpenFGA API Token Issuer. env var=OPENFGA_API_TOKEN_ISSUER [string]
      --apiAudience          OpenFGA API Audience. env var=OPENFGA_API_AUDIENCE [string]
      --apiToken          OpenFGA API Token. env var=OPENFGA_API_TOKEN [string]
      --configDir              Directory containing the configuration files. It must contain: authorization-model.json, tuples.json and assertions.json. env var=OPENFGA_CONFIG_DIR
                              [string] [required]
    
      --overwriteTuples       WARNING: If set, will overwrite all existing tuples in the store. env var=OPENFGA_OVERWRITE_TUPLES
                              [boolean] [default: false]
                             
      --overwriteAssertions   WARNING: If set, will overwrite all existing assertions in the store. env var=OPENFGA_OVERWRITE_ASSERTIONS
                              [boolean] [default: false]
                                                      
  openfga-cli-node tuple [storeId]  Interact with relationship tuples in the system
      Options:
      --help                  Show help                                                [boolean]
      --storeId               OpenFGA Store ID. env var=OPENFGA_STORE_ID           [string] [required]
      --environment           Known Environment. env var=OPENFGA_ENVIRONMENT     [string] [choices: "us", "staging", "playground", "custom"] [default: "custom"]
      --apiScheme             API Scheme. env var=OPENFGA_API_SCHEME [string]
      --apiHost               API Host. env var=OPENFGA_API_HOST [string]
      --clientId              OpenFGA Client Id. env var=OPENFGA_CLIENT_ID         [string]
      --clientSecret          OpenFGA Client Secret. env var=OPENFGA_CLIENT_SECRET [string]
      --apiTokenIssuer          OpenFGA API Token Issuer. env var=OPENFGA_API_TOKEN_ISSUER [string]
      --apiAudience          OpenFGA API Audience. env var=OPENFGA_API_AUDIENCE [string]
      --apiToken          OpenFGA API Token. env var=OPENFGA_API_TOKEN [string]
      
      write Create a new relationship tuple in the system
      Options:
      --user                  User. env var=OPENFGA_USER                             [string] [required]
      --relation              Relation. env var=OPENFGA_RELATION                     [string] [required]
      --object                Object. env var=OPENFGA_OBJECT                         [string] [required]
      
      delete Delete an existing relationship tuple in the system
      Options:
      --user                  User. env var=OPENFGA_USER                             [string] [required]
      --relation              Relation. env var=OPENFGA_RELATION                     [string] [required]
      --object                Object. env var=OPENFGA_OBJECT                         [string] [required]
      
  openfga-cli-node run-tests [configDir]     Runs tests against the provided directory
      Options:
      --help                  Show help                                                [boolean]
      --storeId               OpenFGA Store ID. env var=OPENFGA_STORE_ID           [string] [required]
      --environment           Known Environment. env var=OPENFGA_ENVIRONMENT     [string] [choices: "us", "staging", "playground", "custom"] [default: "custom"]
      --apiScheme             API Scheme. env var=OPENFGA_API_SCHEME [string]
      --apiHost               API Host. env var=OPENFGA_API_HOST [string]
      --clientId              OpenFGA Client Id. env var=OPENFGA_CLIENT_ID         [string]
      --clientSecret          OpenFGA Client Secret. env var=OPENFGA_CLIENT_SECRET [string]
      --apiTokenIssuer          OpenFGA API Token Issuer. env var=OPENFGA_API_TOKEN_ISSUER [string]
      --apiAudience          OpenFGA API Audience. env var=OPENFGA_API_AUDIENCE [string]
      --apiToken          OpenFGA API Token. env var=OPENFGA_API_TOKEN [string]
      --configDir              Directory containing the configuration files. It must contain: authorization-model.json, tuples.json and assertions.json. env var=OPENFGA_CONFIG_DIR
                              [string] [required]
      --keepState             Whether to keep the tuples after test run.  Otherwise, tuples will be cleared if all tests pass.
                              [boolean] [default: false]
                              
  openfga-cli-node store-config [storeId]    Interact with store configuration
      Options:
      --help                  Show help                                                [boolean]
      --storeId               OpenFGA Store ID. env var=OPENFGA_STORE_ID           [string] [required]
      --environment           Known Environment. env var=OPENFGA_ENVIRONMENT     [string] [choices: "us", "staging", "playground", "custom"] [default: "custom"]
      --apiScheme             API Scheme. env var=OPENFGA_API_SCHEME [string]
      --apiHost               API Host. env var=OPENFGA_API_HOST [string]
      --clientId              OpenFGA Client Id. env var=OPENFGA_CLIENT_ID         [string]
      --clientSecret          OpenFGA Client Secret. env var=OPENFGA_CLIENT_SECRET [string]
      --apiTokenIssuer          OpenFGA API Token Issuer. env var=OPENFGA_API_TOKEN_ISSUER [string]
      --apiAudience          OpenFGA API Audience. env var=OPENFGA_API_AUDIENCE [string]
      --apiToken          OpenFGA API Token. env var=OPENFGA_API_TOKEN [string]
      
      export Export an authorization model
          Options:
          --configDir          Directory containing the configuration files. It must contain: authorization-model.json, tuples.json and assertions.json. env var=OPENFGA_CONFIG_DIR              [string] [required]
          --outputFormat      Choice of format to export the configuration as. env var=OPENFGA_OUTPUT_FORMAT
                                 [string] [choices: "json", "yaml", "yml", "scl", "dsl", "ofga", "openfga"] [default: "json"]
          --includeTuples     Whether to also export tuples. env var=OPENFGA_INCLUDE_TUPLES
                                 [boolean] [default: true]
          --includeAssertions Whether to also export assertions. env var=OPENFGA_INCLUDE_ASSERTIONS
                             [boolean] [default: true]

      version List, show and diff authorization model versions

        diff [configVersionIdA] [configVersionIdB] Diff between two configuration versions

        list Prints the list of authorization model ids in chronological order (latest last)

        show [authorizationModelId] Prints the authorization at a particular id

      migrate Migrate a store to another
         Options:
         --includeTuples      Whether to also migrate tuples. env var=OPENFGA_INCLUDE_TUPLES          [boolean] [default: true]
          --includeAssertions  Whether to also migrate assertions. env var=OPENFGA_INCLUDE_ASSERTIONS [boolean] [default: true]
          --toStoreId          OpenFGA Store ID. env var=OPENFGA_TO_STORE_ID [string]
          --toEnvironment      Known Environment. Defaults to "custom". env var=OPENFGA_TO_ENVIRONMENT
               [string] [choices: "us", "staging", "playground", "custom"] [default: "custom"]
          --toClientId         OpenFGA Client ID. env var=OPENFGA_TO_CLIENT_ID                      [string]
          --toClientSecret     OpenFGA Client Secret. env var=OPENFGA_TO_CLIENT_SECRET              [string]


  openfga-cli-node transform <inputFile>     Transform between OpenFGA JSON API and DSL
      Options:
      --help                  Show help                                               [boolean]
      --inputFile             Configuration file. It must be in dsl, yaml or json syntax. env var=OPENFGA_INPUT_FILE
                              [string]

  openfga-cli-node completion                generate completion script

Options:
  --version  Show version number                                       [boolean]
  --help     Show help                                                 [boolean]

```

## Authors

[@rhamzeh](https://github.com/rhamzeh)
[@adriantam](https://github.com/adriantam)

## License

This project is licensed under the Apache-2.0 license. See the [LICENSE](https://github.com/rhamzeh/openfga-cli/blob/main/LICENSE) file for more info.