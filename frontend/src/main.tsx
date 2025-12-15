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
import MyTournaments from './Tournament/MyTournaments.tsx'
import MyTournament from './Tournament/MyTournament.tsx'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <div className="font-sansation text-white min-h-screen w-full flex justify-center">
    <WalletSheet />
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/chess" element={<ChessBoard />} />
        <Route path="/replay/:id" element={<ReplayBoard />} />
        <Route path="/tournaments/:id" element={<TournamentPage />} />
        <Route path="/tournaments" element={<TournamentList />} />
        <Route path="/tournaments/create" element={<CreateTournament />} />
        <Route path="/tournaments/my" element={<MyTournaments />} />
        <Route path="/tournaments/my/:id" element={<MyTournament />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  </div>
)
