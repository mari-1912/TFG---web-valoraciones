import type { BackendContenidoListado } from "@/services/lists-service";

export type Lista = {
  listaId: number;
  userId: number;
  nombre: string;
  descripcion?: string | null;
  tipoContenidos?: string;
  visibilidad?: string;
  imagen?: string | null;
};

export type ContenidoItem = BackendContenidoListado & { tipo?: string | null };
