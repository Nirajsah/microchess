import { CodegenConfig } from '@graphql-codegen/cli'
import 'dotenv/config'

const config: CodegenConfig = {
  schema:'http://localhost:8080/chains/6ef519afe269e9e94cd0bab949416496afd3f4a761eedbbe4d4b53c55678b9a8/applications/27465da0721f71c9c6576515314979eff664cad5c1fae4867c7bfe721eb0c455',
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
