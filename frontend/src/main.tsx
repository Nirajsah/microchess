import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { createApolloClient } from './GraphQL/URI.ts'
import { ApolloProvider } from '@apollo/client'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import CBoard from './components/ChessBoard/CBoard.tsx'
import ChessProvider from './context/ChessProvider.tsx'

const client = createApolloClient()
ReactDOM.createRoot(document.getElementById('root')!).render(
  <ChessProvider>
    <ApolloProvider client={client}>
      <div className="font-montserrat w-full">
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<App />} />
            <Route path="/chess" element={<CBoard />} />
          </Routes>
        </BrowserRouter>
      </div>
    </ApolloProvider>
  </ChessProvider>
)
