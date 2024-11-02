import { CodegenConfig } from "@graphql-codegen/cli";
import "dotenv/config";
/** 
  Make sure you set the correct chainId, app, and port in your .env file.

  This assumes that all your source files are in a top-level `src/` directory - you might need to adjust this to your file structure
*/

const config: CodegenConfig = {
  schema:
    "http://localhost:8080/chains/fc9384defb0bcd8f6e206ffda32599e24ba715f45ec88d4ac81ec47eb84fa111/applications/5ebdd6b18dc8a74bd647be10f823ee99b2461045509d2d673191f49d11b27730cf429328605e79c453aab199ca296b9872b04d71f31d19cf20488b70c3510efafc9384defb0bcd8f6e206ffda32599e24ba715f45ec88d4ac81ec47eb84fa111010000000000000000000000",
  documents: ["src/**/*.{ts,tsx}"],
  generates: {
    "./src/GraphQL/": {
      preset: "client",
      presetConfig: {
        gqlTagName: "gql",
      },
    },
  },
  ignoreNoDocuments: true,
};

export default config;
