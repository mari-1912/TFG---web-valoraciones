export const MediaCard = ({ item }: { item: any }) => (
  <div className="bg-white rounded-xl shadow p-2 hover:shadow-lg transition">
    <img src={item.image} alt={item.title} className="rounded-lg" />
    <h3 className="mt-2 text-sm font-semibold">{item.title}</h3>
    <p className="text-yellow-500">⭐ {item.rating}</p>
  </div>
)
