import React from 'react'
import Modal from '../Modal'

const Settings = () => {
  return (
    <div className="w-[400px] bg-white rounded-lg p-4">
      <div className="flex gap-3 items-center">
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
