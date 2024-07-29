import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { createApolloClient } from './GraphQL/URI.ts'
import { ApolloProvider } from '@apollo/client'
import { BrowserRouter, Route, Routes } from 'react-router-dom'

const client = createApolloClient()
ReactDOM.createRoot(document.getElementById('root')!).render(
  <ApolloProvider client={client}>
    <div className="min-h-screen">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<App />} />
        </Routes>
      </BrowserRouter>
    </div>
  </ApolloProvider>
)
