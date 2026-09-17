// src/features/incidentesPage/components/utils/Utils.js

import { ShieldAlert, UserX, Activity } from 'lucide-react';

export function getIncidentIcons(incident) {
  const icons = [];
  const details = incident?.details;

  if (!details) return icons;

  // 1. EPIs Ausentes agrupados com contagem individual
  if (Array.isArray(details.epi)) {
    const episAusentes = details.epi.filter((e) =>
      e.label?.toLowerCase().includes('ausente')
    );

    if (episAusentes.length > 0) {
      // Agrupa e conta cada tipo de EPI ausente
      const epiCounts = episAusentes.reduce((acc, e) => {
        // Limpa a string (remove '_ausente', ' - ausente', etc) e capitaliza a primeira letra
        let name = e.label
          .replace(/[-_]?ausente/gi, '')
          .trim();
        
        if (!name) name = 'EPI';
        
        // Capitalização (ex: "oculos" -> "Oculos")
        const formattedName = name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();

        acc[formattedName] = (acc[formattedName] || 0) + 1;
        return acc;
      }, {});

      // Formata a lista agrupada: "Oculos (2), Capacete (2), Mascara (1)"
      const itemsFormatted = Object.entries(epiCounts)
        .map(([name, count]) => `${name} (${count})`)
        .join(', ');

      icons.push({
        key: 'epi-ausente',
        icon: ShieldAlert,
        color: 'text-red-500',
        title: `EPI Ausentes: ${itemsFormatted}`,
        animate: true,
      });
    }
  }

  // 2. Invasão de Zona de Risco
  if (Array.isArray(details.zona)) {
    const temInvasao = details.zona.some((z) => z.invadiu === true);
    if (temInvasao) {
      icons.push({
        key: 'zona-invasao',
        icon: UserX,
        color: 'text-red-500',
        title: 'Invasão em Zona de Risco',
        animate: true,
      });
    }
  }

  // 3. Ergonomia / REBA Alto ou Crítico (REBA >= 8) ou Alerta de Queda
  if (Array.isArray(details.ergonomia)) {
    const temQuedaOuRebaAlto = details.ergonomia.some((p) => {
      const score = p.reba_score ?? 0;
      const level = p.reba_level?.toLowerCase() || '';
      const isRebaAlto = score >= 8 || level.includes('alto') || level.includes('critico');
      return p.queda === true || isRebaAlto;
    });

    if (temQuedaOuRebaAlto) {
      icons.push({
        key: 'ergonomia-alerta',
        icon: Activity,
        color: 'text-amber-500',
        title: 'Risco Ergonômico (REBA Alto/Crítico) / Queda',
        animate: true,
      });
    }
  }

  return icons;
}