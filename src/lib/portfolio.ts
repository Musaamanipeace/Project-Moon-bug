import { api } from "@/lib/api";
import type { PortfolioData } from "@/types";

export function getPortfolio(): Promise<PortfolioData> {
  return api.get<PortfolioData>("/profile/portfolio");
}

export function savePortfolio(data: PortfolioData): Promise<PortfolioData> {
  return api.put<PortfolioData>("/profile/portfolio", data);
}
