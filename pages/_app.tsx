import { Layout } from "@/src/components/Layout";
import { ChakraProvider, extendTheme } from "@chakra-ui/react";
import { Global } from "@emotion/react";
import type { AppProps } from "next/app";

export default function App({ Component, pageProps }: AppProps) {
  const theme = extendTheme({
    components: {
      Text: {
        baseStyle: {
          color: "#fff",
          fontSize: "sm",
        },
      },
      Input: {
        baseStyle: {
          field: {
            color: "#fff",
          },
        },
      },
    },
  });

  return (
    <ChakraProvider theme={theme}>
      <Global
        styles={`
          @import url('https://fonts.googleapis.com/css?family=Montserrat&display=swap');
          
          body {
            font-family: 'Montserrat', sans-serif;
          }
          
          .scrollable-container::-webkit-scrollbar {
            width: 2px; /* Adjust the width */
          }
          
          .scrollable-container::-webkit-scrollbar-track {
            background: transparent; /* Background color of the track */
          }
          
          .scrollable-container::-webkit-scrollbar-thumb {
            background-color: #888; /* Color of the scrollbar thumb */
          }

          .blink-text {
            animation: blink 3s infinite; /* 1s duration, infinite loop */
          }

          @keyframes blink {
            0% {
              opacity: 1;
            }
            50% {
              opacity: 0;
            }
            100% {
              opacity: 1;
            }
          }
        `}
      />
      <Layout>
        <Component {...pageProps} />
      </Layout>
    </ChakraProvider>
  );
}
