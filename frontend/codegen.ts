import { CodegenConfig } from '@graphql-codegen/cli'
import 'dotenv/config'

const config: CodegenConfig = {
  schema:
    'http://localhost:8080/chains/410f94a3b88bc789243fc81cc0e9cf635f01f9becd7e43ff0b95e0e520a21712/applications/fca2f56d1281d3f2fe6b8fbb904f77d35402f184f42e9852d1bf54f36cb5d957',
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
