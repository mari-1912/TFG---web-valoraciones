import Card from './Card'

type Item = {
  id: string
  imgSrc: string
  title: string
  description: string
  rating: number
}

type SectionListProps = {
  title: string
  items: Item[]
}

export default function SectionList({ title, items }: SectionListProps) {
  return (
    <section className="my-8 max-w-5xl mx-auto">
      <h3 className="text-2xl font-semibold mb-6 text-gray-800">{title}</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {items.map((item) => (
          <Card 
            key={item.id}
            imgSrc={item.imgSrc}
            title={item.title}
            description={item.description}
            rating={item.rating}
          />
        ))}
      </div>
    </section>
  )
}
