import { Link } from "react-router-dom";

export type Lista = {
  listaId: number;
  userId: number;
  tipo?: string;
  tipoContenidos: string;
  nombre: string;
  descripcion?: string | null;
  visibilidad?: string;
};

export function ListCard({
  lista,
  basePath,
}: {
  lista: Lista;
  basePath: string;
}) {
  return (
    <Link
      to={`${basePath}/${lista.listaId}`}
      className="block border border-gray-300 bg-white hover:shadow-md transition"
      aria-label={`Abrir lista ${lista.nombre}`}
    >
      {/* “Imagen” placeholder como en la captura */}
      <div className="h-32 bg-gray-200 m-4 rounded" />

      <div className="px-4 pb-4">
        <p className="text-sm font-semibold text-gray-900 line-clamp-2">
          {lista.nombre}
        </p>

        {lista.descripcion ? (
          <p className="mt-1 text-xs text-gray-600 line-clamp-2">
            {lista.descripcion}
          </p>
        ) : null}

        <p className="mt-2 text-[11px] text-gray-500">
          {String(lista.tipoContenidos ?? "").toUpperCase()} •{" "}
          {lista.visibilidad ?? ""}
        </p>
      </div>
    </Link>
  );
}