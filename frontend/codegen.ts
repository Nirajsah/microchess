import { CodegenConfig } from '@graphql-codegen/cli'
import 'dotenv/config'

const config: CodegenConfig = {
  schema:
    'http://localhost:8080/chains/8d1fd1e297f7912a1b1630eebdde01808191db467ded408c77953a7868ebe843/applications/877f5db6037023f44f256aa730857e7b562ceaa17ac459c1321c683c46468db4',
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
