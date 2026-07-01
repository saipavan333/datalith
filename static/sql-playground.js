/* Datalith — in-browser SQL playground.
   Runs the same sample shop database as the local app, but entirely client-side
   using SQLite compiled to WebAssembly (sql.js). Each run uses a FRESH database,
   so any query is safe. The engine is loaded lazily the first time you run a query. */
(function () {
  const SCHEMA = `
    CREATE TABLE customers (customer_id INTEGER PRIMARY KEY, name TEXT, country TEXT, signup_date TEXT);
    CREATE TABLE products  (product_id INTEGER PRIMARY KEY, name TEXT, category TEXT, price REAL);
    CREATE TABLE orders    (order_id INTEGER PRIMARY KEY, customer_id INTEGER, order_date TEXT, status TEXT);
    CREATE TABLE order_items (order_id INTEGER, product_id INTEGER, quantity INTEGER);
  `;

  const SEED = `
    INSERT INTO customers VALUES
      (1,'Ava Patel','India','2025-01-12'),(2,'Liam Chen','USA','2025-02-03'),
      (3,'Noah Kim','USA','2025-02-20'),(4,'Mia Garcia','Spain','2025-03-15'),
      (5,'Zoe Muller','Germany','2025-04-01'),(6,'Omar Hassan','UAE','2025-04-18'),
      (7,'Sofia Rossi','Italy','2025-05-09'),(8,'Raj Verma','India','2025-05-22');
    INSERT INTO products VALUES
      (101,'Laptop Pro','Electronics',1899.0),(102,'Wireless Mouse','Electronics',39.5),
      (103,'Mechanical Keyboard','Electronics',129.0),(104,'Standing Desk','Furniture',410.0),
      (105,'Office Chair','Furniture',250.0),(106,'Coffee Beans 1kg','Grocery',24.0),
      (107,'Water Bottle','Grocery',18.0),(108,'Noise-Cancel Headphones','Electronics',299.0);
    INSERT INTO orders VALUES
      (1001,1,'2025-05-01','delivered'),(1002,2,'2025-05-02','delivered'),
      (1003,1,'2025-05-10','shipped'),(1004,3,'2025-05-11','cancelled'),
      (1005,4,'2025-05-15','delivered'),(1006,5,'2025-05-18','shipped'),
      (1007,2,'2025-05-20','delivered'),(1008,8,'2025-06-01','processing'),
      (1009,6,'2025-06-02','delivered'),(1010,1,'2025-06-05','delivered');
    INSERT INTO order_items VALUES
      (1001,101,1),(1001,102,2),(1002,106,3),(1003,103,1),(1003,102,1),(1004,104,1),
      (1005,108,2),(1005,107,4),(1006,105,2),(1007,101,1),(1007,108,1),(1008,106,5),
      (1009,104,1),(1009,105,1),(1010,102,3),(1010,107,2);
  `;

  const STARTER = "SELECT country, COUNT(*) AS customers\nFROM customers\nGROUP BY country\nORDER BY customers DESC;";

  const TABLES = [
    { table: "customers", columns: ["customer_id", "name", "country", "signup_date"] },
    { table: "products", columns: ["product_id", "name", "category", "price"] },
    { table: "orders", columns: ["order_id", "customer_id", "order_date", "status"] },
    { table: "order_items", columns: ["order_id", "product_id", "quantity"] },
  ];

  const CDN = "https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.10.3/";
  let SQL = null, loading = null;

  function loadEngine() {
    if (SQL) return Promise.resolve(SQL);
    if (loading) return loading;
    loading = new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = CDN + "sql-wasm.js";
      s.onload = () => {
        if (typeof initSqlJs !== "function") { reject(new Error("SQL engine failed to load.")); return; }
        initSqlJs({ locateFile: f => CDN + f }).then(mod => { SQL = mod; resolve(mod); }).catch(reject);
      };
      s.onerror = () => reject(new Error("Could not load the SQL engine — check your internet connection."));
      document.head.appendChild(s);
    });
    return loading;
  }

  function freshDb() {
    const db = new SQL.Database();
    db.run(SCHEMA);
    db.run(SEED);
    return db;
  }

  async function run(query, maxRows = 200) {
    if (!query || !query.trim()) return { ok: false, error: "Type a query first." };
    try { await loadEngine(); }
    catch (e) { return { ok: false, error: String(e.message || e) }; }
    let db;
    try {
      db = freshDb();
      const res = db.exec(query); // array of { columns, values } for each statement that returns rows
      if (!res.length) {
        const changes = db.getRowsModified();
        return { ok: true, columns: ["rows_affected"], rows: [[changes]], truncated: false };
      }
      const last = res[res.length - 1];
      const truncated = last.values.length > maxRows;
      const rows = last.values.slice(0, maxRows).map(r => r.slice());
      return { ok: true, columns: last.columns, rows, truncated };
    } catch (e) {
      return { ok: false, error: String(e.message || e) };
    } finally {
      if (db) db.close();
    }
  }

  function schema() { return { tables: TABLES, starter: STARTER }; }

  window.DFA_SQL = { schema, run };
})();
