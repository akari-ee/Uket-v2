/* eslint-disable no-case-declarations */
import { createQueryKeys } from "@lukemorales/query-key-factory";
import { dehydrate, useQuery } from "@tanstack/react-query";
import { formatDate } from "@uket/util/time";
import { fetcherAdmin } from "../admin-instance";
import { getQueryClient } from "../get-query-client";
import {
  SearchRequest,
  SearchType,
  TICKET_STATUS_INFO,
  TicketListResponse,
  USER_TYPE,
} from "../types/admin-ticket";

const DEFAULT_PAGE_NUMBER = 1;
const DEFAULT_PAGE_SIZE = 10;

const getAdminTicketList = async ({
  page = DEFAULT_PAGE_NUMBER,
  size = DEFAULT_PAGE_SIZE,
}) => {
  const { data } = await fetcherAdmin.get<TicketListResponse>(
    `/ticket/search/all`,
    {
      mode: "BOUNDARY",
      params: { page, size },
    },
  );

  return data;
};

export const getAdminSearchRequest = (
  searchType: SearchType,
  value: string,
): SearchRequest | null => {
  const searchRequest: SearchRequest = { type: "", value: "" };

  switch (searchType) {
    case "PHONE_NUMBER":
      searchRequest.type = "phoneNumberLastFourDigits";
      searchRequest.value = value;
      break;

    case "STATUS":
      searchRequest.type = "status";
      const statusValue = TICKET_STATUS_INFO.find(
        status => status.text === value,
      );
      if (!statusValue) return null;
      searchRequest.value = statusValue.value;
      break;

    case "USER_NAME":
      searchRequest.type = "userName";
      searchRequest.value = value;
      break;

    case "SHOW_DATE":
      searchRequest.type = "showDate";
      const dateParts = value.split(".");
      if (dateParts.length !== 3) return null;

      const year = `20${dateParts[0]}`;
      const month = dateParts[1]?.padStart(2, "0");
      const day = dateParts[2]?.padStart(2, "0");
      searchRequest.value = `${year}-${month}-${day}`;
      break;

    case "RESERVATION_USER_TYPE":
      searchRequest.type = "reservationUserType";
      const userTypeValue = USER_TYPE.find(type => type.text === value);
      if (!userTypeValue) return null;
      searchRequest.value = userTypeValue.value;
      break;

    default:
      return null;
  }

  return searchRequest;
};

export const adminTicket = createQueryKeys("admin-ticket", {
  list: ({ page, size }) => ({
    queryKey: ["admin-ticket-list", page],
    queryFn: () => getAdminTicketList({ page, size }),
  }),
  search: ({
    searchType,
    value,
    page = DEFAULT_PAGE_NUMBER,
    size = DEFAULT_PAGE_SIZE,
  }: {
    searchType: SearchType;
    value: string;
    page?: number;
    size?: number;
  }) => ({
    queryKey: ["admin-ticket-search", searchType, value, page],
    queryFn: async () => {
      const searchRequest = getAdminSearchRequest(searchType, value);

      if (searchRequest !== null) {
        const { data } = await fetcherAdmin.get<TicketListResponse>(
          `/ticket/search`,
          {
            mode: "BOUNDARY",
            params: {
              searchType,
              [searchRequest.type]: searchRequest.value,
              page,
              size,
            },
          },
        );

        return data;
      } else {
        return { content: [], totalPages: 0 };
      }
    },
  }),
});

export const useQueryAdminTicketList = ({
  page = DEFAULT_PAGE_NUMBER,
  size = DEFAULT_PAGE_SIZE,
  enabled = true,
}) => {
  return useQuery({
    ...adminTicket.list({ page, size }),
    enabled,
    select: data => {
      const timeData = data.content.map(item => {
        return {
          ...item,
          showTime: formatDate(item.showTime, "fullCompact"),
          updatedDate: formatDate(item.updatedDate, "fullCompact"),
          orderDate: formatDate(item.orderDate, "fullCompact"),
        };
      });

      return {
        ...data,
        timezoneData: timeData,
      };
    },
  });
};

export const useQueryAdminTicketSearch = ({
  searchType,
  value,
  page = DEFAULT_PAGE_NUMBER,
  size = DEFAULT_PAGE_SIZE,
  enabled = false,
}: {
  searchType: SearchType;
  value: string;
  page?: number;
  size?: number;
  enabled?: boolean;
}) => {
  return useQuery({
    ...adminTicket.search({ searchType, value, page, size }),
    enabled,
    select: data => {
      const timeData = data.content.map(item => {
        return {
          ...item,
          showTime: formatDate(item.showTime, "fullCompact"),
          updatedDate: formatDate(item.updatedDate, "fullCompact"),
          orderDate: formatDate(item.orderDate, "fullCompact"),
        };
      });

      return {
        ...data,
        timezoneData: timeData,
      };
    },
  });
};

export const prefetchAdminTicketList = (page: number) => {
  const queryClient = getQueryClient();
  queryClient.prefetchQuery({
    ...adminTicket.list(page),
  });

  return dehydrate(queryClient);
};
