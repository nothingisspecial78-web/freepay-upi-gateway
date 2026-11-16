import { queryOptions } from "@tanstack/react-query";
import { listTransactionsFn } from "./payments.functions";

export const DASHBOARD_PAGE_SIZE = 10;

export const transactionsQueryOptions = (page: number) =>
  queryOptions({
    queryKey: ["transactions", page, DASHBOARD_PAGE_SIZE],
    queryFn: () => listTransactionsFn({ data: { page, limit: DASHBOARD_PAGE_SIZE } }),
  });
