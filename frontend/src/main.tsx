import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { createApolloClient } from './GraphQL/URI.ts'
import { ApolloProvider } from '@apollo/client'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import CBoard from './components/ChessBoard/CBoard.tsx'
import ChessProvider from './context/ChessProvider.tsx'
import NotFound from './NotFound.tsx'

const client = createApolloClient()
ReactDOM.createRoot(document.getElementById('root')!).render(
  <ChessProvider>
    <ApolloProvider client={client}>
      <div className="font-russo text-white min-h-screen w-full flex justify-center">
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<App />} />
            <Route path="/chess" element={<CBoard />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </div>
    </ApolloProvider>
  </ChessProvider>
)
