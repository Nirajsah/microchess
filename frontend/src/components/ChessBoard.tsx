export default function ChessBoard() {
  const ranks = ['8', '7', '6', '5', '4', '3', '2', '1']
  const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']

  return (
    <div className="flex">
      <div className="flex flex-col">
        {ranks.map((rank) => (
          <div
            key={rank}
            className="h-[100px] p-2 flex justify-center items-center"
          >
            {rank}
          </div>
        ))}
      </div>
      <div className="w-[800px] border h-[800px]">
        {ranks.map((rank) => (
          <div key={rank} className="flex">
            {files.map((file) => (
              <div
                key={file}
                style={{
                  backgroundColor:
                    (files.indexOf(file) + ranks.indexOf(rank)) % 2 === 0
                      ? '#ff685321'
                      : '#ff2a00bf',
                }}
                onClick={() => console.log(file + rank)}
                className="w-[100px] h-[100px]"
              ></div>
            ))}
          </div>
        ))}
        <div className="flex">
          {files.map((file) => (
            <div
              key={file}
              className="w-[100px] p-1 flex justify-center items-center"
            >
              {file}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
