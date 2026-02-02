type StatsCard = {
  title: string;
  value: number;
  unit: string;
};

type ProfileStatsSectionProps = {
  cards: StatsCard[];
};

export function ProfileStatsSection({ cards }: ProfileStatsSectionProps) {
  return (
    <section>
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Estadísticas</h2>
        <button
          type="button"
          className="text-sm font-medium text-violet-700 hover:text-violet-800"
        >
          Ver todo
        </button>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <div
            key={card.title}
            className="rounded-2xl border border-violet-100 bg-white p-5 shadow-sm"
          >
            <p className="text-xs uppercase tracking-widest text-violet-700">
              {card.title}
            </p>
            <p className="mt-3 text-2xl font-semibold text-gray-900">
              {card.value}
            </p>
            <p className="mt-1 text-xs text-gray-500">{card.unit}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
