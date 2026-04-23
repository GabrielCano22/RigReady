import { Route, Routes } from "react-router-dom";
import Landing from "./pages/Landing";
import Evaluator from "./pages/Evaluator";
import About from "./pages/About";
import { Header } from "./components/ui/header-1";

function App() {
  return (
    <div className="dark min-h-screen bg-background text-foreground">
      <Header />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/evaluator" element={<Evaluator />} />
        <Route path="/about" element={<About />} />
      </Routes>
    </div>
  );
}

export default App;
