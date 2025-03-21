export default function HomePage() {
  return (
    <div className="w-full h-full lg:min-h-[880px] flex">
      {/** New UI */}
      <div className="w-full h-full flex flex-col gap-2 p-2">
        <div className="flex w-full gap-2 p-2 justify-between h-full max-h-[600px]">
          <div className="w-[50%] relative flex justify-center items-center rounded-[24px] h-full border-2 border-black">
            <div className="text-[100px] z-50 absolute text-black font-bold bottom-0 left-10">
              MicroChess
            </div>
          </div>
          <div className="p-2 bg-transparent backdrop-blur-lg rounded-[24px] w-[320px] min-h-[200px] relative border">
            <div className="w-full h-[200px] rounded-[18px] relative overflow-hidden">
              <img
                className="object-cover w-full h-full rounded-[18px]"
                src="/public/short_chess_board.svg"
              />
              <div className="absolute inset-0 bg-gradient-to-tr from-red-400 to-purple-400 opacity-30 rounded-[26px] pointer-events-none"></div>
            </div>
            <div className="font-bold text-[40px] absolute top-[30%]">
              RuleBook
            </div>
          </div>
          <div className="border rounded-[18px] w-[320px] h-full"></div>
        </div>

        <div className="p-2 flex gap-3 w-full h-[250px] border-2 border-black">
          <div className="border p-4 flex flex-col justify-between w-1/3 rounded-[30px] h-full">
            <div className="text-4xl">Matches Played</div>
            <div className="text-[100px] leading-[80px] self-end">10000000</div>
          </div>
          <div className="relative border w-1/3 bg-gradient-to-r from-[#2148ed] to-[#3768f1] rounded-[30px] h-full">
            <div className="absolute w-[200px] h-[200px] bg-[#2148ed] shadow-lg z-10 rounded-full"></div>
          </div>
          <div className="border-2 border-black w-1/3 rounded-[30px] h-full"></div>
        </div>
      </div>
    </div>
  )
}
