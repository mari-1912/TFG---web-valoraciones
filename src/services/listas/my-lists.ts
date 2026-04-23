import { getListsByUser, getMyListsWithFallback, type BackendLista } from "@/services/lists-service";

type ResolveListsInput = {
  targetUserId: number | null;
  canManageLists: boolean;
};

export async function resolveBaseLists({
  targetUserId,
  canManageLists,
}: ResolveListsInput): Promise<BackendLista[]> {
  if (canManageLists || targetUserId == null) {
    return getMyListsWithFallback().catch(() => []);
  }
  return getListsByUser(targetUserId).catch(() => []);
}
