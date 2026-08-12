import { useEffect, useState } from 'react';
import { get } from './api';

/** One fetch, three states, plus a retry. Pass null to skip fetching entirely. */
export default function useFetch(path) {
  const [state, setState] = useState({ loading: path !== null });
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    if (path === null) {
      setState({ loading: false });
      return;
    }
    let live = true;
    setState({ loading: true });
    get(path)
      .then((data) => live && setState({ loading: false, data }))
      .catch((err) => live && setState({ loading: false, error: err.message }));
    return () => {
      live = false;
    };
  }, [path, nonce]);

  // `retry` and `reload` are one function under two names: the shop calls it retry (after an
  // error) and the admin calls it reload (after a mutation). `set` writes the fetched data
  // back without a round trip, which is how an admin screen reflects its own PUT.
  const again = () => setNonce((n) => n + 1);
  return { ...state, retry: again, reload: again, set: (data) => setState({ loading: false, data }) };
}
