type CardProps = {
  imgSrc: string
  title: string
  description: string
  rating: number  // 0 a 5, por ejemplo
}

export default function Card({ imgSrc, title, description, rating }: CardProps) {
  return (
    <div className="bg-white rounded-lg shadow-md p-4 flex flex-col cursor-pointer hover:shadow-lg transition">
      <img src={imgSrc} alt={title} className="rounded-md mb-4 object-cover h-48 w-full" />
      <h4 className="text-lg font-semibold mb-1">{title}</h4>
      <p className="text-gray-600 text-sm mb-2 line-clamp-3">{description}</p>
      <div className="text-yellow-500">
        {Array(rating).fill(0).map((_, i) => (
          <span key={i} aria-label="star">⭐</span>
        ))}
      </div>
    </div>
  )
}
