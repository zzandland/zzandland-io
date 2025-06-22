import { Routes, Route } from "react-router-dom";
import Terminal from "../components/Terminal";
import "./globals.css";
import { root } from "../lib/path";

function App() {
  return (
    <main>
      <Routes>
        <Route path="*" element={<Terminal root={root} />} />
      </Routes>
    </main>
  );
}

export default App;
