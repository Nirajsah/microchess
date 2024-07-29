import {
  ApolloClient,
  InMemoryCache,
  createHttpLink,
  split,
} from '@apollo/client'
import { APP } from '../const'
import { getMainDefinition } from '@apollo/client/utilities'
import { createClient } from 'graphql-ws'
import { GraphQLWsLink } from '@apollo/client/link/subscriptions'

export const createApolloClient = () => {
  const host = 'localhost'
  const port = window.sessionStorage.getItem('port') ?? ''
  const chainId = window.sessionStorage.getItem('chainId') ?? ''
  const wsLink = new GraphQLWsLink(
    createClient({
      url: `ws://${host}:${port}/ws`,
    })
  )
  const httpLink = createHttpLink({
    uri: (operation) => {
      const endpoint = operation.variables.endpoint
      switch (endpoint) {
        case 'chess':
          return `http://localhost:${port}/chains/${chainId}/applications/${APP.chess_id}`
        default:
          return `http://localhost:${port}`
      }
    },
  })
  const splitLink = split(
    ({ query }) => {
      const definition = getMainDefinition(query)
      return (
        definition.kind === 'OperationDefinition' &&
        definition.operation === 'subscription'
      )
    },
    wsLink,
    httpLink
  )

  return new ApolloClient({
    link: splitLink,
    cache: new InMemoryCache(),
  })
}
