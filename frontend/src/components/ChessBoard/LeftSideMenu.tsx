import React from 'react'
import Modal from '../Modal'
import { useMicroChess } from '@/context/MicroChessProvider'

const Settings = () => {
  const { chessSettings, setChessSettings } = useMicroChess()

  const setValue = () => {
    if (chessSettings.enableDrag) {
      sessionStorage.setItem('enableDrag', '0')
    } else {
      sessionStorage.setItem('enableDrag', '1')
    }
    setChessSettings({ ...chessSettings, enableDrag: !chessSettings.enableDrag })
  }

  return (
    <div className="w-[400px] bg-white rounded-lg p-4">
      <div className="flex gap-3 items-center">
        <div
          className={`${chessSettings.enableDrag ? 'bg-green-500' : 'bg-gray-300'
            } relative inline-flex h-6 w-11 items-center rounded-full cursor-pointer`}
          onClick={() => setValue()}
        >
          <span
            className={`${chessSettings.enableDrag ? 'translate-x-6' : 'translate-x-1'
              } inline-block h-4 w-4 transform bg-white rounded-full transition-transform duration-200 ease-in-out`}
          />
        </div>
        <h1>Enable Drag and Move</h1>
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
        <button className="text-white">Settings</button>
      </div>
    </div>
  )
}
