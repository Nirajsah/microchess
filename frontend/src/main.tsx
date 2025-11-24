import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import NotFound from './NotFound.tsx'
import MicroChessProvider from './context/MicroChessProvider.tsx'
import ChessBoard from './ChessBoard/index.tsx'
import WalletSheet from './components/WalletSheet.tsx'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <MicroChessProvider>
    <div className="font-sansation text-white min-h-screen w-full flex justify-center">
      <WalletSheet />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<App />} />
          <Route path="/chess" element={<ChessBoard />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </div>
  </MicroChessProvider>
)
