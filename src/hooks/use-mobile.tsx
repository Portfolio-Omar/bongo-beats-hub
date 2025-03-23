
import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean>(false)

  React.useEffect(() => {
    // Check if we're in a browser environment
    if (typeof window === 'undefined') return;
    
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    
    const handleChange = (e: MediaQueryListEvent | MediaQueryList) => {
      setIsMobile(e.matches)
    }
    
    // Set initial value
    handleChange(mql)
    
    // Modern listener pattern
    if (mql.addEventListener) {
      mql.addEventListener('change', handleChange)
      return () => mql.removeEventListener('change', handleChange)
    } else {
      // Fallback for older browsers
      mql.addListener(handleChange)
      return () => mql.removeListener(handleChange)
    }
  }, [])

  return isMobile
}

// For backward compatibility
export const useMobile = useIsMobile;
