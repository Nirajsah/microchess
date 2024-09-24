import React from 'react'
import Modal from '../Modal'
import { useChess } from '../../context/ChessProvider'

const Settings = () => {
  const { chessSettings, setChessSettings } = useChess()

  const setValue = () => {
    if (chessSettings.dragNdrop) {
      sessionStorage.setItem('dragNdrop', '0')
    } else {
      sessionStorage.setItem('dragNdrop', '1')
    }
    setChessSettings({ ...chessSettings, dragNdrop: !chessSettings.dragNdrop })
  }

  return (
    <div className="w-[800px] h-[600px] bg-white rounded-lg p-4">
      <div
        className={`${
          chessSettings.dragNdrop ? 'bg-green-500' : 'bg-gray-300'
        } relative inline-flex h-6 w-11 items-center rounded-full cursor-pointer`}
        onClick={() => setValue()}
      >
        <span
          className={`${
            chessSettings.dragNdrop ? 'translate-x-6' : 'translate-x-1'
          } inline-block h-4 w-4 transform bg-white rounded-full transition-transform duration-200 ease-in-out`}
        />
      </div>
    </div>
  )
}

export const LeftSideMenu = () => {
  const [showSettings, setShowSettings] = React.useState(false)
  return (
    <div className="w-full h-full">
      <Modal
        select={showSettings}
        unselect={() => setShowSettings(!showSettings)}
      >
        <Settings />
      </Modal>

      <div
        onClick={(e) => {
          e.preventDefault()
          setShowSettings(true)
        }}
      >
        <button>Settings</button>
      </div>
    </div>
  )
}
