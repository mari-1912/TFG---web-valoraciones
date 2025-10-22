import { useParams } from "react-router-dom"
import { useEffect, useState } from "react"
import { getMockItems } from "../services/mock-data"

export const DetailPage = () => {
  const { id } = useParams()
  const [item, setItem] = useState<any>(null)

  useEffect(() => {
    // simulamos obtener el elemento según su id
    const data = getMockItems()
    const selected = data.find((el) => el.id === Number(id))
    setItem(selected)
  }, [id])

  if (!item) return <p>Cargando...</p>

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-md p-6">
      <div className="flex flex-col md:flex-row gap-6">
        <img
          src={item.image}
          alt={item.title}
          className="w-full md:w-1/3 rounded-lg object-cover"
        />

        <div className="flex-1">
          <h2 className="text-3xl font-bold mb-2">{item.title}</h2>
          <p className="text-yellow-500 text-lg mb-4">⭐ {item.rating}</p>

          <p className="text-gray-700 mb-4">
            {item.description ||
              "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer nec odio. Praesent libero. Sed cursus ante dapibus diam."}
          </p>

          <div className="flex gap-2">
            <button className="bg-yellow-500 hover:bg-yellow-600 text-white font-medium px-4 py-2 rounded-lg transition">
              Añadir a favoritos
            </button>
            <button className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium px-4 py-2 rounded-lg transition">
              Valorar ⭐
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
