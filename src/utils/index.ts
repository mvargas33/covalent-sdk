import { API_URL } from "../constants";
import { CovalentAPIBaseResponse, CovalentFetchOptions, CovalentParameters } from "../models";
import fetch from "node-fetch";

export async function fetchFromCovalent(options: CovalentFetchOptions) {
  const { key, path, parameters } = options;
  const version = options.version || 'v1';
  const queryString = buildQueryString({ ...parameters, key });

  const url = `${API_URL}/${version}/${path}/?${queryString}`;
  console.log(url);

  try {
    const response = await fetch(url);
    const result = (await response.json()) as CovalentAPIBaseResponse;

    if (result.error) {
      throw new Error(`[${result.error_code}]: ${result.error_message}`);
    }

    return result.data;
  } catch (e) {
    throw e;
  }
}

export const buildQueryString = (parameters: CovalentParameters): string => {
  const queryString = new URLSearchParams();

  Object.entries(parameters).forEach(([key, value]) => {
    if (typeof value === 'string') {
      queryString.set(key, value);
    }
    if (typeof value === 'number') {
      queryString.set(key, String(value));
    }
    if (typeof value === 'boolean') {
      queryString.set(key, value ? '1' : '0');
    }
    if (value === null) {
      queryString.set(key, 'null');
    }
    if (Array.isArray(value)) {
      queryString.set(key, value.join(','));
    }
  });

  return queryString.toString();
};
