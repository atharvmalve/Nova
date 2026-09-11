import { storeConfig } from "@/src/config/store";
export function formatCurrency(paise: number, maximumFractionDigits = 0) { return new Intl.NumberFormat(storeConfig.commerce.locale, { style: "currency", currency: storeConfig.commerce.currency, maximumFractionDigits }).format(paise / 100); }
