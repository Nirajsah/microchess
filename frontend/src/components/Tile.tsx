export default function Tile({ image }: { image: string }) {
  return (
    <div
      style={{
        width: '100%', // set your desired width
        height: '100%', // set your desired height
        backgroundImage: `url(${image})`,
        backgroundSize: 'cover', // make sure the image covers the entire div
        backgroundPosition: 'center', // center the image
        backgroundRepeat: 'no-repeat', // prevent the image from repeating
        cursor: 'pointer', // change the cursor to a grabbing hand
      }}
    ></div>
  )
}
