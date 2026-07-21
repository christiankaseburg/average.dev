import { ApolloProvider } from '@apollo/client/react';
import { ChakraProvider, defaultSystem } from '@chakra-ui/react';
import { RouterProvider } from 'react-router-dom';
import { AuthProvider } from '../context/Auth';
import { ColorModeProvider } from '../context/Theme';
import { client } from '../graphql/client';
import { router } from '../pages/Router';

export function App() {
  return (
    <ChakraProvider value={defaultSystem}>
      <ColorModeProvider>
        <ApolloProvider client={client}>
          <AuthProvider>
            <RouterProvider router={router} />
          </AuthProvider>
        </ApolloProvider>
      </ColorModeProvider>
    </ChakraProvider>
  );
}

export default App;
