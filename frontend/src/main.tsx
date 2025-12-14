import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import NotFound from './NotFound.tsx'
import ChessBoard from './ChessBoard/index.tsx'
import WalletSheet from './components/WalletSheet.tsx'
import ReplayBoard from './ChessBoard/ReplayBoard.tsx'
import TournamentPage from './Tournament/TournamentPage.tsx'
import TournamentList from './Tournament/TournamentList.tsx'
import CreateTournament from './Tournament/CreateTournament.tsx'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <div className="font-sansation text-white min-h-screen w-full flex justify-center">
    <WalletSheet />
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/chess" element={<ChessBoard />} />
        <Route path="/replay" element={<ReplayBoard />} />
        <Route path="/tournament" element={<TournamentPage />} />
        <Route path="/tournaments" element={<TournamentList />} />
        <Route path="/create" element={<CreateTournament />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  </div>
)
