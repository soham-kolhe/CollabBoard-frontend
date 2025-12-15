import ToolBar from './ToolBar';

const Whiteboard = () => {
  return (
    <div className="w-screen h-screen flex flex-col items-center bg-gray-100">
      <div className="w-full p-4 bg-gray-300 flex items-center justify-between shadow-md text-center">
        <h1 className="text-xl text-blue-950 font-semibold">
          RoomId:
        </h1>
        <p className="text-sm text-gray-700">Users:</p>
      </div>
    
      <ToolBar />
    </div>
  )
}

export default Whiteboard