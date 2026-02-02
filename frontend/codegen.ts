import { CodegenConfig } from '@graphql-codegen/cli'
import 'dotenv/config'

const config: CodegenConfig = {
  schema: 'http://localhost:8080/chains/8bcf32fb2155cbb5c07fdc71c975ad328b8a9798ff238a237a8b9531f18a7797/applications/762ee72358280fad543c7eee2de24245fb6f3f799b44c45e6c494dcd950eb07e',

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
