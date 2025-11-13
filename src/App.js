import React from "react";
import { ThemeProvider } from "./context/ThemeContext";
import { CartProvider } from "./context/CartContext";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
// importar rutas o más páginas si haces React Router

function App() {
  return (
    <ThemeProvider>
      <CartProvider>
        <Navbar />
        <Home />
      </CartProvider>
    </ThemeProvider>
  );
}

export default App;
