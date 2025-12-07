import NextDocument, { Html, Head, Main, NextScript } from 'next/document';
import { ColorModeScript } from '@chakra-ui/react';
import theme from '../theme';

export default class Document extends NextDocument {
  render() {
    return (
      <Html lang="en">
        <Head>
          <meta charSet="utf-8" />
          <meta name="description" content="Compare cryptocurrency exchange fees across CEX and DEX platforms. Find the best trading fees for Bitcoin, Ethereum, and other cryptocurrencies." />
          <meta name="keywords" content="cryptocurrency, exchange fees, trading fees, CEX, DEX, Bitcoin, Ethereum, crypto comparison" />
          <meta name="author" content="CryptoFees" />
          
          {/* Open Graph / Facebook */}
          <meta property="og:type" content="website" />
          <meta property="og:title" content="CryptoFees - Compare Cryptocurrency Exchange Fees" />
          <meta property="og:description" content="Compare trading fees across centralized and decentralized cryptocurrency exchanges" />
          
          {/* Twitter */}
          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:title" content="CryptoFees - Compare Cryptocurrency Exchange Fees" />
          <meta name="twitter:description" content="Compare trading fees across centralized and decentralized cryptocurrency exchanges" />
          
          {/* Fonts */}
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
          
          {/* Favicon */}
          <link rel="icon" href="/favicon.ico" />
        </Head>
        <body>
          <ColorModeScript initialColorMode={theme.config.initialColorMode} />
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}
