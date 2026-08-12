// The only place the app talks to the network.
// ponytail: no client class, no interceptors, no retry. One wrapper, four verbs.

const BASE = (import.meta.env.VITE_API_URL || 'http://localhost:4000/api').replace(/\/+$/, '');

// One session key. The separate 'ast.adminToken' went with the ops-desk sign-in; /admin/*
// needs no bearer at all now, so there is nothing for the path to pick between.
export const TOKEN_KEY = 'ast.token';
export const USER_KEY = 'ast.user';

async function request(method, path, body) {
  const token = localStorage.getItem(TOKEN_KEY);
  const isForm = body instanceof FormData;
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined && !isForm) headers['Content-Type'] = 'application/json';

  let res;
  try {
    res = await fetch(BASE + path, {
      method,
      headers,
      body: body === undefined ? undefined : isForm ? body : JSON.stringify(body),
    });
  } catch {
    // Network-level failure never reaches the JSON parse below, so it gets its own message.
    throw new Error('Cannot reach the server. Check that the API is running, then try again.');
  }

  const data = await res.json().catch(() => null);
  // Throw the server's own { error } text so a page can show it verbatim. A 400 from /orders
  // also carries `problems: [{ productId, message }]`, and losing it means checkout has to
  // re-ask the server which line was wrong when the 400 already said so.
  if (!res.ok)
    throw Object.assign(new Error(data?.error || `The server returned ${res.status}.`), {
      problems: data?.problems,
    });
  return data;
}

export const get = (path) => request('GET', path);
export const post = (path, body) => request('POST', path, body ?? {});
export const put = (path, body) => request('PUT', path, body ?? {});
export const del = (path) => request('DELETE', path);

/**
 * Single-file upload as multipart/form-data, field name `file`.
 * request() deliberately does not set Content-Type for FormData — the browser has to set it
 * so the multipart boundary is included. Setting it by hand makes the server see no file.
 */
export const upload = (path, file) => {
  const form = new FormData();
  form.append('file', file);
  return request('POST', path, form);
};
