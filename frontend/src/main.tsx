import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { createApolloClient } from './GraphQL/URI.ts'
import { ApolloProvider } from '@apollo/client'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import CBoard from './components/ChessBoard/CBoard.tsx'
import NotFound from './NotFound.tsx'
import MicroChessProvider from './context/MicroChessProvider.tsx'

const client = createApolloClient()
ReactDOM.createRoot(document.getElementById('root')!).render(
  <MicroChessProvider>
    <ApolloProvider client={client}>
      <div className="font-sansation text-white min-h-screen w-full flex justify-center">
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<App />} />
            <Route path="/chess" element={<CBoard />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </div>
    </ApolloProvider>
  </MicroChessProvider>
)
