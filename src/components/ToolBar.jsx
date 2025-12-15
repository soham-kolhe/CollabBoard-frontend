import { Pencil,Eraser } from 'lucide-react';

const ToolBar = () => {
  return (
    <>
      <div className="flex items-center gap-4 bg-white p-2 shadow-md w-full justify-center">
        <button className="px-3 py-1 rounded">
          <Pencil />Pencil 
        </button>

        <button className="px-3 py-1 rounded">
          <Eraser />Eraser
        </button>

        <div className="flex gap-2"> 
          {["black","red","blue","green"].map(()=>(
           <button className="w-6 h-6 rounded-full border-2">
            C
           </button> 
          ))}
        </div>
       
        <button className="px-3 py-1 bg-teal-500 text-white rounded hover:bg-teal-600 transition">
          Clear Canvas
        </button>
      </div>
    </>
  )
}

export default ToolBar
