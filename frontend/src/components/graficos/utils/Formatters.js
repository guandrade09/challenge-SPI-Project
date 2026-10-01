// src/components/graficos/utils/Formatters.js

/**
 * Formata o rótulo do eixo X.
 * Retorna no formato "DD/MM às HH:mm" para datas ISO/YYYY-MM-DD ou o valor original (ex: "14:30").
 */
export const formatXAxisTick = (tickItem) => {
  if (!tickItem) return "";

  if (typeof tickItem === "string" && tickItem.includes("-")) {
    const d = new Date(tickItem);
    if (!isNaN(d.getTime())) {
      const dateStr = d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
      const timeStr = d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
      return `${dateStr} às ${timeStr}`;
    }
  }

  return tickItem;
};

/**
 * Encapsula a busca da chave em uma função para evitar ReferenceError no escopo global.
 */
export const getResolvedKey = (data = [], explicitKey) => {
  if (explicitKey) return explicitKey;
  if (!data || data.length === 0) return "hora";

  const availableKeys = ["hora", "time", "fullDate", "timestamp"];
  return availableKeys.find((k) => k in data[0]) || "hora";
};