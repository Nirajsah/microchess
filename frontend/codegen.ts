import { CodegenConfig } from '@graphql-codegen/cli'
import 'dotenv/config'
import { APP as app, mainPort as port, mainChainId as chain } from './src/const'

/** 
  Make sure you set the correct chainId, app, and port in your .env file.

  This assumes that all your source files are in a top-level `src/` directory - you might need to adjust this to your file structure
*/

const config: CodegenConfig = {
  schema:
    'http://127.0.0.1:8080/chains/c06f52a2a3cc991e6981d5628c11b03ad39f7509c4486893623a41d1f7ec49a0/applications/c06f52a2a3cc991e6981d5628c11b03ad39f7509c4486893623a41d1f7ec49a0000000000000000000000000c06f52a2a3cc991e6981d5628c11b03ad39f7509c4486893623a41d1f7ec49a0020000000000000000000000',
  documents: ['src/**/*.{ts,tsx}'],
  generates: {
    './src/__generated__/': {
      preset: 'client',
      plugins: [],
      presetConfig: {
        gqlTagName: 'gql',
      },
    },
  },
}

export default config
