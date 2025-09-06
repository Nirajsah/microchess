import { CodegenConfig } from '@graphql-codegen/cli'
import 'dotenv/config'
/** 
  Make sure you set the correct chainId, app, and port in your .env file.

  This assumes that all your source files are in a top-level `src/` directory - you might need to adjust this to your file structure
*/

const config: CodegenConfig = {
  schema:
    'http://localhost:8080/chains/aee928d4bf3880353b4a3cd9b6f88e6cc6e5ed050860abae439e7782e9b2dfe8/applications/f626dcfe4f32c09099b8acdcb33531b25db55d4f62a85a53fcfc79affad3115e',
  documents: ['src/**/*.{ts,tsx}'],
  generates: {
    './src/GraphQL/': {
      preset: 'client',
      presetConfig: {
        gqlTagName: 'gql',
      },
    },
  },
  ignoreNoDocuments: true,
}

export default config
