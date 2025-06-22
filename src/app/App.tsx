import { Routes, Route } from "react-router-dom";
import Terminal from "../components/Terminal";
import "./globals.css";

function App() {
  return (
    <main>
      <Routes>
        <Route path="*" element={<Terminal />} />
      </Routes>
    </main>
  );
}

export default App;
