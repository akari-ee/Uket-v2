/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import CustomAxiosError from "@uket/api/error/default";
import { RequestConfig } from "@uket/api/instance";
import { getAccessToken } from "@uket/util/admin-token";
import { isAdminDynamicUrlMatched } from "@uket/util/path";
import axios, { AxiosResponse } from "axios";

const BASE_URL = "https://uketadmin.p-e.kr";
const SERVER_VERSION = "/admin/v1";

const instance = axios.create({
  baseURL: `${BASE_URL}${SERVER_VERSION}`,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

instance.interceptors.request.use(async config => {
  const url = config.url;
  if (url && isAdminDynamicUrlMatched(url)) {
    const accessToken = await getAccessToken();

    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  return config;
});

instance.interceptors.response.use(
  async response => {
    return response;
  },
  async (error: CustomAxiosError) => {
    const { status } = error.response!;
    const config = error.config as RequestConfig;
    return Promise.reject(
      new CustomAxiosError(
        error,
        config.mode === "TOAST_UI" && config.errorContent
          ? config.errorContent
          : null,
        config.mode === "TOAST_UI",
      ),
    );
  },
);

const request = async <T>(promise: Promise<AxiosResponse<T>>) => {
  const response = await promise;
  return response;
};

const defaultConfig: RequestConfig = { mode: "BOUNDARY" };

export const fetcherAdmin = {
  get: <T = any>(pathname: string, config?: RequestConfig) =>
    request<T>(instance.get(pathname, { ...defaultConfig, ...config })),
  post: <T = any>(pathname: string, data?: unknown, config?: RequestConfig) =>
    request<T>(
      instance.post<T>(pathname, data, { ...defaultConfig, ...config }),
    ),
  put: <T = any>(pathname: string, data?: unknown, config?: RequestConfig) =>
    request<T>(
      instance.put<T>(pathname, data, { ...defaultConfig, ...config }),
    ),
  delete: <T = any>(pathname: string, config?: RequestConfig) =>
    request<T>(instance.delete<T>(pathname, { ...defaultConfig, ...config })),
  patch: <T = any>(pathname: string, data?: unknown, config?: RequestConfig) =>
    request<T>(
      instance.patch<T>(pathname, data, { ...defaultConfig, ...config }),
    ),
};
