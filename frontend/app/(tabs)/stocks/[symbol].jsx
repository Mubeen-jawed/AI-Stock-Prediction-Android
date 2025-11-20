import { useLocalSearchParams, useRouter } from "expo-router";
import StockDetailScreen from "../stockPage";

export default function StockPage() {
  const { symbol } = useLocalSearchParams();

  return <StockDetailScreen symbol={symbol} />;
}
