import { useEffect, useState } from 'react';

const canUseMatchMedia = () =>
  typeof window !== 'undefined' && typeof window.matchMedia === 'function';

const getMatches = (query) =>
  canUseMatchMedia() ? window.matchMedia(query).matches : false;

const useMediaQuery = (query) => {
  const [matches, setMatches] = useState(() => getMatches(query));

  useEffect(() => {
    if (!canUseMatchMedia()) {
      return undefined;
    }

    const mediaQueryList = window.matchMedia(query);
    const handleChange = (event) => {
      setMatches(event.matches);
    };

    if (typeof mediaQueryList.addEventListener === 'function') {
      mediaQueryList.addEventListener('change', handleChange);
      return () => mediaQueryList.removeEventListener('change', handleChange);
    }

    mediaQueryList.addListener(handleChange);
    return () => mediaQueryList.removeListener(handleChange);
  }, [query]);

  return matches;
};

export default useMediaQuery;
