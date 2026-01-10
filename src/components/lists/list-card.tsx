export type Lista = {
  id: string;
  name: string;
  description: string;
  items: string[];
  creator?: string;
};

export function ListCard({ lista }: { lista: Lista }) {
  return (
    <article className="border border-gray-300 bg-white">
      {/* “Imagen” placeholder como en la captura */}
      <div className="h-32 bg-gray-200 m-4" />

      <div className="px-4 pb-4">
        <p className="text-sm text-gray-800">{lista.name}</p>
      </div>
    </article>
  );
}
