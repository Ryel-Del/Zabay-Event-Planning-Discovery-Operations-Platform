import { useApp as useAppContext } from '../context/AppContext';

/**
 * Custom React hook to access platform state, domain actions, and simulation engines.
 */
export const useApp = useAppContext;
export default useApp;
