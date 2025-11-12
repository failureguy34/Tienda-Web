import React, { useState, useEffect, useRef } from "react";
import ReactDOM from "react-dom/client";
import "./index.css";

// categories
const categories = [
  "Tarjetas Gráficas",
  "Procesadores",
  "Memoria RAM",
  "Motherboards",
  "Periféricos",
  "Fuentes",
  "Almacenamiento",
];

// whatsapp
const WHATSAPP_NUM = "573154054569";

// default products (images expected in public/img or remote URLs)
const DEFAULT_PRODUCTS = [
  {
    id: 1,
    name: "RTX 4070 Ti",
    price: 3200000,
    stock: 5,
    discount: 0,
    img: process.env.PUBLIC_URL + "/img/4070ti.webp",
    desc: "GPU potente para gaming y contenido 4K.",
    category: "Tarjetas Gráficas",
  },
  {
    id: 2,
    name: "Intel Core i7-13700K",
    price: 2500000,
    stock: 3,
    discount: 0,
    img: process.env.PUBLIC_URL + "/img/corei7.webp",
    desc: "Procesador Intel 13ª generación, ideal para gaming y multitarea.",
    category: "Procesadores",
  },
  {
    id: 3,
    name: "Kingston Fury Beast 32GB",
    price: 650000,
    stock: 8,
    discount: 0,
    img: process.env.PUBLIC_URL + "/img/kingston-fury.webp",
    category: "Memoria RAM",
  },
  {
    id: 4,
    name: "ASUS Z790 TUF Gaming",
    price: 1200000,
    stock: 4,
    discount: 0,
    img: process.env.PUBLIC_URL + "/img/Asusz790mb.webp",
    desc: "Placa base robusta para CPUs Intel de última generación.",
    category: "Motherboards",
  },
  {
    id: 5,
    name: "Logitech G Pro X Mouse",
    price: 480000,
    stock: 6,
    discount: 0,
    img: process.env.PUBLIC_URL + "/img/LogiGMouse.webp",
    desc: "Mouse ultraligero y preciso para gaming profesional.",
    category: "Periféricos",
  },
  {
    id: 6,
    name: "Corsair RM850x 850W Gold",
    price: 850000,
    stock: 7,
    discount: 0,
    img: process.env.PUBLIC_URL + "/img/fuente850w.webp",
    desc: "Fuente modular 80+ Gold, silenciosa y confiable.",
    category: "Fuentes",
  },
  {
    id: 7,
    name: "SSD Kingston NV2 2TB",
    price: 700000,
    stock: 10,
    discount: 0,
    img: process.env.PUBLIC_URL + "/img/ssd2tb.webp",
    desc: "Unidad NVMe rápida de 2TB para almacenamiento veloz.",
    category: "Almacenamiento",
  },
];

function App() {
  // core states
  const [products, setProducts] = useState([]);
  const [currentCategory, setCurrentCategory] = useState(null);
  const [search, setSearch] = useState("");
  const [priceRange, setPriceRange] = useState([0, 6000000]);
  const [cart, setCart] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);

  // admin & UI
  const [isAdmin, setIsAdmin] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [credential, setCredential] = useState({ email: "", password: "" });
  const [activeAdminView, setActiveAdminView] = useState("inicio"); // inicio | productos | add
  const [editing, setEditing] = useState(null); // edit object for stock/discount
  const [newProduct, setNewProduct] = useState({
    name: "",
    price: "",
    stock: "",
    discount: "",
    img: "",
    desc: "",
    category: "",
  });

  // UI account menu
  const [accountOpen, setAccountOpen] = useState(false);

  // load products from localStorage or defaults
  useEffect(() => {
    document.title = "Buildify";
    const saved = localStorage.getItem("buildify_products_v2");
    if (saved) {
      try {
        setProducts(JSON.parse(saved));
      } catch {
        setProducts(DEFAULT_PRODUCTS);
      }
    } else {
      setProducts(DEFAULT_PRODUCTS);
    }
  }, []);

  // persist products
  useEffect(() => {
    localStorage.setItem("buildify_products_v2", JSON.stringify(products));
  }, [products]);

  // keep cart qty <= stock if stock changes
  useEffect(() => {
    setCart((prev) =>
      prev
        .map((c) => {
          const prod = products.find((p) => p.id === c.id);
          if (!prod) return null;
          return { ...c, qty: Math.min(c.qty, prod.stock) };
        })
        .filter(Boolean)
    );
  }, [products]);

  // helper: compute discounted price
  const discountedPrice = (p) =>
    Math.round(p.price * (1 - (Number(p.discount || 0) / 100)));

  // ordering algorithm (attractiveness): price * stock, then tie-breaker by discount (more discount = higher)
  const sortProductsByAttractive = (list) =>
    [...list].sort((a, b) => {
      const scoreA = (a.price || 0) * (a.stock || 0) + (a.discount || 0) * 1000;
      const scoreB = (b.price || 0) * (b.stock || 0) + (b.discount || 0) * 1000;
      return scoreB - scoreA;
    });

  // filtered for home/category + ordering by attractive
  const homeProducts = sortProductsByAttractive(
    products.filter(
      (p) =>
        p.name.toLowerCase().includes(search.toLowerCase()) &&
        p.price >= priceRange[0] &&
        p.price <= priceRange[1]
    )
  );

  const categoryFiltered = currentCategory
    ? sortProductsByAttractive(
        products.filter(
          (p) =>
            p.category === currentCategory &&
            p.name.toLowerCase().includes(search.toLowerCase()) &&
            p.price >= priceRange[0] &&
            p.price <= priceRange[1]
        )
      )
    : [];

  // --- CART FUNCTIONS ---
  const addToCart = (p) => {
    const prod = products.find((it) => it.id === p.id);
    if (!prod || prod.stock <= 0) return;
    setCart((prev) => {
      const found = prev.find((i) => i.id === p.id);
      if (found) {
        return prev.map((i) =>
          i.id === p.id ? { ...i, qty: Math.min(i.qty + 1, prod.stock) } : i
        );
      }
      return [...prev, { ...p, qty: 1 }];
    });
    setCartOpen(true);
  };

  const removeFromCart = (id) => setCart((p) => p.filter((x) => x.id !== id));
  const changeQty = (id, qty) =>
    setCart((p) => p.map((x) => (x.id === id ? { ...x, qty: Math.max(1, qty) } : x)));

  const cartTotal = cart.reduce((s, p) => s + (discountedPrice(p) * p.qty || p.price * p.qty), 0);

  const sendWhatsApp = () => {
    if (!cart.length) {
      window.alert("El carrito está vacío");
      return;
    }
    const items = cart.map((c) => `${c.name} x${c.qty}`).join(", ");
    const msg = `Hola, quiero comprar: ${items}. Total: COP ${cartTotal.toLocaleString()}`;
    window.open(`https://wa.me/${WHATSAPP_NUM}?text=${encodeURIComponent(msg)}`, "_blank");
  };

  // --- ADMIN LOGIN ---
  const handleLogin = (e) => {
    e.preventDefault();
    if (credential.email === "admin@buildify.com" && credential.password === "12345") {
      setIsAdmin(true);
      setLoginOpen(false);
      setAccountOpen(false);
      setCredential({ email: "", password: "" });
      setActiveAdminView("inicio");
    } else {
      window.alert("Credenciales incorrectas");
    }
  };

  const handleLogout = () => {
    setIsAdmin(false);
    setAccountOpen(false);
    setActiveAdminView("inicio");
  };

  // --- ADMIN: edit stock & discount only ---
  const openEdit = (product) => {
    // editing object contains stock and discount to limit changes
    setEditing({
      id: product.id,
      stock: product.stock || 0,
      discount: product.discount || 0,
    });
  };

  const saveEdit = () => {
    if (!editing) return;
    setProducts((prev) =>
      prev.map((p) =>
        p.id === editing.id ? { ...p, stock: Number(editing.stock), discount: Number(editing.discount) } : p
      )
    );
    setEditing(null);
  };

  // --- ADMIN: add product (allows setting discount percent) ---
  const addProduct = () => {
    if (!newProduct.name || !newProduct.price || !newProduct.category || !newProduct.img) {
      window.alert("Completa: nombre, precio, categoría e imagen (ruta /img/xxx.webp o URL).");
      return;
    }
    const id = products.length ? Math.max(...products.map((p) => p.id)) + 1 : 1;
    const p = {
      id,
      name: newProduct.name,
      price: Number(newProduct.price),
      stock: Number(newProduct.stock || 0),
      discount: Number(newProduct.discount || 0),
      img: newProduct.img,
      desc: newProduct.desc || "",
      category: newProduct.category,
    };
    setProducts((prev) => [p, ...prev]);
    setNewProduct({
      name: "",
      price: "",
      stock: "",
      discount: "",
      img: "",
      desc: "",
      category: "",
    });
    setActiveAdminView("productos");
  };

  // small util : click outside to close account dropdown
  const accRef = useRef();
  useEffect(() => {
    const onDoc = (e) => {
      if (accRef.current && !accRef.current.contains(e.target)) setAccountOpen(false);
    };
    document.addEventListener("click", onDoc);
    return () => document.removeEventListener("click", onDoc);
  }, []);

  // small safe image fallback handler
  const onImgError = (e) => {
    e.currentTarget.src =
      "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'%3E%3Crect width='100%25' height='100%25' fill='%23111111'/%3E%3Ctext x='50%25' y='50%25' fill='%23888888' font-size='16' font-family='Arial' text-anchor='middle' dy='.3em'%3Eimagen no encontrada%3C/text%3E%3C/svg%3E";
  };
  
  // --- CSS PARA LA ANIMACIÓN DE CATEGORÍAS ---
  // Se inyecta el CSS en el head o se podría usar un styled-component o un archivo global.
  // Aquí se usa un useEffect para asegurar que esté en el DOM.
  useEffect(() => {
    const styleId = "category-marquee-style";
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = `
        @keyframes scrollRight {
          from {
            transform: translateX(0);
          }
          to {
            transform: translateX(calc(100% * -1)); /* Desplaza a la izquierda (la mitad de los duplicados) */
          }
        }
        .animate-scroll {
          animation: scrollRight 60s linear infinite; /* 60s para un desplazamiento lento */
        }
      `;
      document.head.appendChild(style);
    }
  }, []);
  // --- FIN CSS DE ANIMACIÓN ---


  return (
    <div className="min-h-screen bg-[#0d0d0e] text-gray-100 font-sans">
      {/* NAVBAR */}
      <header className="sticky top-0 z-50 bg-[#121214]/95 border-b border-gray-800 shadow-md">
        <div className="max-w-7xl mx-auto flex justify-between items-center px-4 sm:px-6 py-3">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => { setCurrentCategory(null); setSearch(""); }}>
            <img src="/img/logote.webp" alt="logo" className="w-10 h-10 rounded-full object-contain" onError={onImgError} />
            <div className="hidden sm:block">
              <div className="text-cyan-400 font-bold text-lg">Buildify</div>
              <div className="text-xs text-gray-400">Componentes de Computador</div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar..."
              className="bg-[#111113] border border-gray-700 px-3 py-2 rounded-lg w-32 sm:w-56 text-sm focus:outline-none"
            />
            <div className="relative" ref={accRef}>
              {!isAdmin ? (
                <button
                  onClick={() => { setLoginOpen(true); setAccountOpen(false); }}
                  className="text-gray-300 hover:text-white px-3 py-2 text-sm"
                >
                  Iniciar sesión
                </button>
              ) : (
                <>
                  <button
                    onClick={() => setAccountOpen((s) => !s)}
                    className="flex items-center gap-2 bg-[#161618] px-3 py-2 rounded hover:bg-[#1d1d1f] text-sm"
                  >
                    <span className="text-sm">Cuenta</span>
                    <span className="text-xs text-gray-400 hidden sm:inline">Admin</span>
                  </button>
                  {accountOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-[#0f0f10] border border-gray-800 rounded shadow p-3 z-50">
                      <div className="text-sm text-gray-300 font-semibold mb-2">Admin</div>
                      <button
                        onClick={() => { setActiveAdminView("inicio"); setAccountOpen(false); }}
                        className="w-full text-left text-sm px-2 py-1 rounded hover:bg-[#111113]"
                      >
                        🏠 Panel Admin
                      </button>
                      <button
                        onClick={() => { handleLogout(); }}
                        className="w-full text-left mt-2 text-sm px-2 py-1 rounded bg-red-600 text-black font-semibold hover:opacity-90"
                      >
                        Cerrar sesión
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>

            <button
              onClick={() => setCartOpen((s) => !s)}
              className="bg-cyan-500 px-3 sm:px-4 py-2 rounded-full text-black font-semibold shadow text-sm sm:text-base"
            >
              🛒 {cart.reduce((s, p) => s + p.qty, 0)}
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-6 px-4 sm:px-6 py-8">
        {/* Sidebar (only visible for admin) */}
        {isAdmin && (
          <aside className="w-full lg:w-60 bg-[#0f0f10] rounded-xl p-4 lg:sticky lg:top-24 lg:h-fit">
            <div className="mb-4">
              <div className="text-cyan-300 font-bold text-lg">Admin</div>
              <div className="text-xs text-gray-400">buildify@admin</div>
            </div>
            <nav className="flex flex-row lg:flex-col gap-2 overflow-x-auto pb-2">
              <button
                onClick={() => setActiveAdminView("inicio")}
                className={`flex-shrink-0 text-left px-3 py-2 rounded ${activeAdminView === "inicio" ? "bg-[#141416]" : "hover:bg-[#111113]"}`}
              >
                🏠 Inicio
              </button>
              <button
                onClick={() => setActiveAdminView("productos")}
                className={`flex-shrink-0 text-left px-3 py-2 rounded ${activeAdminView === "productos" ? "bg-[#141416]" : "hover:bg-[#111113]"}`}
              >
                📦 Gestión de productos
              </button>
              <button
                onClick={() => setActiveAdminView("add")}
                className={`flex-shrink-0 text-left px-3 py-2 rounded ${activeAdminView === "add" ? "bg-[#141416]" : "hover:bg-[#111113]"}`}
              >
                ➕ Añadir producto
              </button>
            </nav>
          </aside>
        )}

        {/* Main area */}
        <main className="flex-1 w-full">
          {/* ADMIN AREA */}
          {isAdmin ? (
            <>
              {activeAdminView === "inicio" && (
                <section>
                  <h2 className="text-2xl text-cyan-300 font-bold mb-4">Panel Admin — Inicio</h2>
                  <p className="text-gray-400 mb-4">
                    Vista administrativa: aquí se muestran los productos ordenados por atractivo (precio × stock).
                  </p>

                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                    {sortProductsByAttractive(products).map((p) => (
                      <div key={p.id} className="bg-[#141416] rounded-2xl p-4 shadow">
                        <div className="relative">
                          {p.discount > 0 && (
                            <div className="absolute top-2 left-2 bg-red-600 text-xs px-2 py-1 rounded font-bold">-{p.discount}%</div>
                          )}
                          <img src={p.img} alt={p.name} className="w-full h-24 sm:h-32 object-contain rounded" onError={onImgError}/>
                        </div>
                        <div className="mt-3">
                          <div className="font-semibold text-sm sm:text-base truncate">{p.name}</div>
                          <div className="text-xs text-gray-400">{p.category}</div>

                          <div className="mt-2 flex items-end justify-between">
                            <div>
                              {p.discount > 0 ? (
                                <>
                                  <div className="text-xs line-through text-gray-500">COP {p.price.toLocaleString()}</div>
                                  <div className="text-cyan-400 font-bold text-sm">COP {discountedPrice(p).toLocaleString()}</div>
                                </>
                              ) : (
                                <div className="text-cyan-400 font-bold text-sm">COP {p.price.toLocaleString()}</div>
                              )}
                            </div>
                            <div className="text-xs text-gray-400">Stock: {p.stock}</div>
                          </div>
                          <div className="mt-3 flex flex-col sm:flex-row gap-2">
                            <button onClick={() => openEdit(p)} className="px-3 py-1 bg-cyan-500 rounded text-black text-xs sm:text-sm">Editar stock</button>
                            <button onClick={() => setActiveAdminView("productos")} className="px-3 py-1 bg-gray-700 rounded text-xs sm:text-sm">Ver lista</button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* GESTIÓN DE PRODUCTOS */}
              {activeAdminView === "productos" && (
                <section>
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
                    <h2 className="text-2xl text-cyan-300 font-bold">Gestión de productos</h2>
                    <div className="text-sm text-gray-400 mt-2 sm:mt-0">Editar solo stock y descuento</div>
                  </div>

                  <div className="bg-[#0f0f10] rounded-xl p-2 sm:p-4 overflow-x-auto">
                    <table className="min-w-full text-left border-collapse table-auto">
                      <thead className="text-cyan-300 text-sm">
                        <tr>
                          <th className="p-2 sm:p-3 w-40 sm:w-auto">Producto</th>
                          <th className="p-2 sm:p-3 hidden sm:table-cell">Categoría</th>
                          <th className="p-2 sm:p-3">Precio</th>
                          <th className="p-2 sm:p-3">Stock</th>
                          <th className="p-2 sm:p-3 hidden md:table-cell">Descuento</th>
                          <th className="p-2 sm:p-3">Acción</th>
                        </tr>
                      </thead>
                      <tbody className="text-sm">
                        {products.map((p) => (
                          <tr key={p.id} className="border-t border-gray-800">
                            <td className="p-2 sm:p-3 flex items-center gap-3">
                              <img src={p.img} alt={p.name} className="w-12 h-10 object-cover rounded" onError={onImgError}/>
                              <div>
                                <div className="font-semibold">{p.name}</div>
                                <div className="text-xs text-gray-400 truncate w-32 sm:w-auto">{p.desc}</div>
                              </div>
                            </td>
                            <td className="p-2 sm:p-3 hidden sm:table-cell">{p.category}</td>
                            <td className="p-2 sm:p-3">COP {p.price.toLocaleString()}</td>
                            <td className="p-2 sm:p-3">{p.stock}</td>
                            <td className="p-2 sm:p-3 hidden md:table-cell">{p.discount ? `${p.discount}%` : "-"}</td>
                            <td className="p-2 sm:p-3">
                              <button onClick={() => openEdit(p)} className="bg-cyan-500 px-2 py-1 rounded text-black text-xs">Editar</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              )}

              {/* AÑADIR PRODUCTO */}
              {activeAdminView === "add" && (
                <section>
                  <h2 className="text-2xl text-cyan-300 font-bold mb-4">Añadir producto</h2>
                  <div className="bg-[#141416] p-4 rounded-xl">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <input className="p-2 bg-[#1b1b1f] rounded" placeholder="Nombre" value={newProduct.name} onChange={(e)=>setNewProduct({...newProduct, name:e.target.value})}/>
                      <input className="p-2 bg-[#1b1b1f] rounded" placeholder="Categoría" value={newProduct.category} onChange={(e)=>setNewProduct({...newProduct, category:e.target.value})}/>
                      <input className="p-2 bg-[#1b1b1f] rounded" placeholder="Precio (COP)" type="number" value={newProduct.price} onChange={(e)=>setNewProduct({...newProduct, price:e.target.value})}/>
                      <input className="p-2 bg-[#1b1b1f] rounded" placeholder="Stock" type="number" value={newProduct.stock} onChange={(e)=>setNewProduct({...newProduct, stock:e.target.value})}/>
                      <input className="p-2 bg-[#1b1b1f] rounded col-span-1 sm:col-span-2" placeholder="Imagen (/img/xxx.webp o URL)" value={newProduct.img} onChange={(e)=>setNewProduct({...newProduct, img:e.target.value})}/>
                      <input className="p-2 bg-[#1b1b1f] rounded" placeholder="Descuento (%)" type="number" value={newProduct.discount} onChange={(e)=>setNewProduct({...newProduct, discount:e.target.value})}/>
                      <textarea className="p-2 bg-[#1b1b1f] rounded col-span-1 sm:col-span-2" placeholder="Descripción" value={newProduct.desc} onChange={(e)=>setNewProduct({...newProduct, desc:e.target.value})}/>
                    </div>
                    <div className="mt-4 flex gap-2">
                      <button onClick={addProduct} className="bg-cyan-500 px-4 py-2 rounded text-black font-semibold">Añadir producto</button>
                      <button onClick={() => setNewProduct({ name:"", price:"", stock:"", discount:"", img:"", desc:"", category:"" })} className="px-4 py-2 rounded bg-gray-700">Limpiar</button>
                    </div>
                  </div>
                </section>
              )}

              {/* EDIT MODAL for stock & discount */}
              {editing && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
                  <div className="bg-[#111113] p-6 rounded-xl w-full max-w-md">
                    <h3 className="text-xl font-bold text-cyan-300 mb-3">Editar stock y descuento</h3>
                    <div className="mb-2 text-sm text-gray-400">Producto: {products.find(p => p.id === editing.id)?.name}</div>
                    <label className="text-sm text-gray-300">Stock</label>
                    <input className="w-full p-2 mb-3 bg-[#1b1b1f] rounded" type="number" value={editing.stock} onChange={(e)=>setEditing({...editing, stock: Number(e.target.value)})} />
                    <label className="text-sm text-gray-300">Descuento (%)</label>
                    <input className="w-full p-2 mb-3 bg-[#1b1b1f] rounded" type="number" value={editing.discount} onChange={(e)=>setEditing({...editing, discount: Number(e.target.value)})} />
                    <div className="flex justify-end gap-2">
                      <button onClick={() => setEditing(null)} className="px-3 py-2 bg-gray-700 rounded">Cancelar</button>
                      <button onClick={saveEdit} className="px-3 py-2 bg-cyan-500 rounded text-black font-semibold">Guardar</button>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            /* PUBLIC SHOP VIEWS */
            <>
              {/* Hero */}
              <section className="relative text-center bg-cover bg-center py-10 sm:py-20 rounded-xl mb-6" style={{ backgroundImage: "url('/img/fondobanner.webp')" }}>
                <div className="absolute inset-0 bg-gradient-to-t from-[#0d0d0e]/85 to-transparent rounded-xl"></div>
                <div className="relative z-10 max-w-2xl mx-auto py-4 sm:py-8">
                  <h1 className="text-3xl md:text-5xl font-extrabold text-cyan-400">Arma tu PC ideal 🔥</h1>
                  <p className="text-gray-300 mt-2 text-sm sm:text-base">Componentes de alto rendimiento y diseño moderno.</p>
                </div>
              </section>

              {/* categories scroller - ANIMATED */}
              <section className="py-2 sm:py-4 mb-6 border-y border-gray-800 rounded-xl overflow-hidden"> {/* Ocultar overflow */}
                <div className="flex space-x-4 whitespace-nowrap animate-scroll"> {/* Aplicar animación y nowrap */}
                  {/* Duplicar las categorías para el efecto infinito */}
                  {[...categories, ...categories].map((c, i) => (
                    <div key={i} onClick={() => setCurrentCategory(c)} className="flex-shrink-0 bg-[#18181b] px-4 sm:px-6 py-2 rounded-xl cursor-pointer hover:bg-cyan-500 hover:text-black transition-all text-sm sm:text-md font-semibold">
                      {c}
                    </div>
                  ))}
                </div>
              </section>

              {/* filters */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                <div className="flex flex-wrap items-center gap-3">
                  <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar..." className="bg-[#111113] p-2 rounded w-full sm:w-56" />
                  <div className="text-sm text-gray-400 flex items-center gap-2">
                    <label>Mín:</label>
                    <input type="number" value={priceRange[0]} onChange={(e) => setPriceRange([Number(e.target.value), priceRange[1]])} className="w-24 p-1 rounded bg-[#1b1b1f] text-sm" />
                    <label>Máx:</label>
                    <input type="number" value={priceRange[1]} onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])} className="w-24 p-1 rounded bg-[#1b1b1f] text-sm" />
                  </div>
                </div>
                <div className="flex gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                  <button onClick={() => { setCurrentCategory(null); setSearch(""); setPriceRange([0,6000000]); }} className="flex-1 sm:flex-none px-3 py-2 bg-gray-800 rounded text-sm">Ver todo</button>
                  <button onClick={() => setLoginOpen(true)} className="flex-1 sm:flex-none px-3 py-2 bg-cyan-600 rounded text-black font-semibold text-sm">Iniciar sesión</button>
                </div>
              </div>

              {/* products list */}
              <main>
                <h3 className="text-xl sm:text-2xl font-bold text-cyan-400 mb-4">{currentCategory || "Productos destacados"}</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                  {(currentCategory ? categoryFiltered : homeProducts).map((p) => (
                    <div key={p.id} className="bg-[#141416] rounded-2xl p-3 sm:p-4 shadow">
                      <div className="relative">
                        {p.discount > 0 && (
                          <div className="absolute top-2 left-2 bg-red-600 text-xs px-2 py-1 rounded font-bold">-{p.discount}%</div>
                        )}
                        <img src={p.img} alt={p.name} className="w-full h-24 sm:h-40 object-contain rounded" onError={onImgError}/>
                      </div>
                      <div className="mt-3">
                        <div className="font-semibold text-sm sm:text-base truncate">{p.name}</div>
                        <div className="text-xs text-gray-400">{p.category}</div>
                        <div className="mt-2">
                          {p.discount > 0 ? (
                            <>
                              <div className="text-xs line-through text-gray-500">COP {p.price.toLocaleString()}</div>
                              <div className="text-cyan-400 font-bold text-sm">COP {discountedPrice(p).toLocaleString()}</div>
                            </>
                          ) : (
                            <div className="text-cyan-400 font-bold text-sm">COP {p.price.toLocaleString()}</div>
                          )}
                        </div>
                        <p className="text-xs text-gray-400 mt-2 hidden sm:block">{p.desc}</p>
                        {p.stock <= 0 ? (
                          <p className="text-red-400 mt-3 font-semibold text-sm">✖ No hay stock</p>
                        ) : (
                          <div className="mt-3 flex flex-col sm:flex-row gap-2">
                            <button onClick={() => addToCart(p)} className="bg-cyan-500 px-3 py-1 sm:py-2 rounded text-black font-semibold flex-1 text-sm">Añadir</button>
                            <button onClick={() => { setCurrentCategory(p.category); setSearch(p.name); }} className="border px-3 py-1 sm:py-2 rounded text-sm">Ver</button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </main>
            </>
          )}
        </main>
      </div>

      {/* CART drawer */}
      {cartOpen && (
        <aside className="fixed right-2 bottom-2 bg-[#111113] rounded-xl p-4 w-11/12 sm:w-96 shadow-xl border border-gray-700 z-50">
          <div className="flex justify-between mb-3">
            <h4 className="font-semibold text-cyan-300">Tu carrito</h4>
            <button onClick={() => setCartOpen(false)} className="text-gray-400">✖</button>
          </div>
          <div className="max-h-64 overflow-y-auto space-y-3 mb-3">
            {cart.length === 0 && <p className="text-gray-400">Vacío</p>}
            {cart.map((c) => (
              <div key={c.id} className="bg-[#141416] p-2 rounded flex gap-3 items-center">
                <img src={c.img} alt={c.name} className="w-12 h-12 object-contain rounded" onError={onImgError}/>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-semibold text-sm">{c.name}</div>
                      <div className="text-xs text-gray-400">
                        {c.discount > 0 ? `COP ${discountedPrice(c).toLocaleString()}` : `COP ${c.price.toLocaleString()}`}
                      </div>
                    </div>
                    <button onClick={() => removeFromCart(c.id)} className="text-red-400 text-xs ml-2">Eliminar</button>
                  </div>
                  <div className="mt-2 flex items-center gap-2 text-sm">
                    <button onClick={() => changeQty(c.id, c.qty - 1)} className="px-2 bg-gray-700 rounded text-xs">-</button>
                    <span>{c.qty}</span>
                    <button onClick={() => changeQty(c.id, c.qty + 1)} className="px-2 bg-gray-700 rounded text-xs">+</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <p className="text-gray-400 mb-2 text-sm">Total: COP <span className="font-bold">{cartTotal.toLocaleString()}</span></p>
          <div className="flex gap-2">
            <button onClick={sendWhatsApp} className="w-full bg-green-500 py-2 rounded text-black font-semibold text-sm">Enviar por WhatsApp</button>
            <button onClick={() => { setCart([]); setCartOpen(false); }} className="px-3 py-2 rounded bg-gray-700 text-sm">Vaciar</button>
          </div>
        </aside>
      )}

      {/* LOGIN MODAL */}
      {loginOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-[#111113] p-6 rounded-xl w-full max-w-sm sm:max-w-md">
            <h3 className="text-xl font-bold text-cyan-300 mb-3">Iniciar sesión (Admin)</h3>
            <form onSubmit={handleLogin} className="flex flex-col gap-3">
              <input type="email" placeholder="Correo" value={credential.email} onChange={(e)=>setCredential({...credential,email:e.target.value})} className="p-2 bg-[#1b1b1f] rounded"/>
              <input type="password" placeholder="Contraseña" value={credential.password} onChange={(e)=>setCredential({...credential,password:e.target.value})} className="p-2 bg-[#1b1b1f] rounded"/>
              <div className="flex gap-2">
                <button type="submit" className="flex-1 bg-cyan-500 px-4 py-2 rounded text-black font-semibold">Entrar</button>
                <button type="button" onClick={() => setLoginOpen(false)} className="flex-1 px-4 py-2 rounded bg-gray-700">Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <footer className="text-center py-8 border-t border-gray-800 text-gray-500 text-xs sm:text-sm mt-12">
        © {new Date().getFullYear()} Buildify — Proyecto escolar
      </footer>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);