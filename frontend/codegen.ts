import { CodegenConfig } from '@graphql-codegen/cli'
import 'dotenv/config'

const config: CodegenConfig = {
  schema:
    'http://localhost:8080/chains/a5a34d5cb0cbe8bf8ed8af8a3c8f4baded14d7afdbd545df5d6f0ed47e9b0213/applications/2c1b823bcd9bded6e6b99bed00667f79ff9d9eb15de54f918b7dbe8357cae1b7',
  generates: {
    './src/graphql/': {
      preset: 'client',
      presetConfig: {
        gqlTagName: 'gql',
      },
    },
  },
  ignoreNoDocuments: true,
}

export default config
