"use client";

import { useEffect, useState } from "react";
import { useSchools } from "@/contexts/schools-context";

/**
 * Hook personalizado que asegura que las escuelas estén siempre actualizadas
 * especialmente útil para formularios que necesitan la lista más reciente
 */
export function useSchoolsWithRefresh() {
  const schoolsContext = useSchools();
  const [hasRefreshed, setHasRefreshed] = useState(false);

  useEffect(() => {
    // Solo refrescar una vez cuando el componente se monta
    if (!hasRefreshed) {
      schoolsContext.refreshData();
      setHasRefreshed(true);
    }
  }, [hasRefreshed, schoolsContext]);

  return {
    ...schoolsContext,
    hasRefreshed,
  };
}
