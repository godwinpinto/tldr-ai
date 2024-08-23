
export const getUrl=(url:string)=>{
    const useProxy = process.env.VITE_USE_PROXY === 'true';
    return (useProxy ? '/api' : 'http://localhost:5000')+url; 
}

