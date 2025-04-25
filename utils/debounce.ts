export const debounce = (func: (...args: any[]) => any, delay: number) => {
    let timeoutId: NodeJS.Timeout;
  
    return (...args: any[]) => {
      clearTimeout(timeoutId);
  
      timeoutId = setTimeout(() => {
        func.apply(this, args);
      }, delay);
    };
  };