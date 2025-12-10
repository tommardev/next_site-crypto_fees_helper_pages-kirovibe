import { ChakraProvider } from "@chakra-ui/react";
import { SWRConfig } from 'swr';

import theme from "../theme";
import { AppProps } from "next/app";

// SWR fetcher function
const fetcher = (url: string) => fetch(url).then(res => res.json());

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <ChakraProvider theme={theme}>
      <SWRConfig 
        value={{
          fetcher,
          revalidateOnFocus: false,
          revalidateOnReconnect: false,
          errorRetryCount: 3,
          errorRetryInterval: 5000,
        }}
      >
        <Component {...pageProps} />
      </SWRConfig>
    </ChakraProvider>
  );
}

export default MyApp;
