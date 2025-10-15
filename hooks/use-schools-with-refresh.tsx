"use client";

import { useEffect, useState, useRef } from "react";
import { useSchools } from "@/contexts/schools-context";

/**
 * Hook personalizado que asegura que las escuelas estén siempre actualizadas
 * especialmente útil para formularios que necesitan la lista más reciente
 */
export function useSchoolsWithRefresh() {
  const schoolsContext = useSchools();
  const hasRefreshedRef = useRef(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Solo refrescar una vez cuando el componente se monta
    if (!hasRefreshedRef.current) {
      hasRefreshedRef.current = true;
      schoolsContext.refreshData().finally(() => {
        setIsReady(true);
      });
    } else {
      setIsReady(true);
    }
    // NO incluir schoolsContext como dependencia para evitar loops
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Solo ejecutar una vez al montar

  return {
    ...schoolsContext,
    isReady,
  };
}
