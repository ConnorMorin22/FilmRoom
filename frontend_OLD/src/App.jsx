import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import VideoDetail from "./pages/VideoDetail";
import MyLibrary from "./pages/MyLibrary";
import Watch from "./pages/Watch";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/video/:id" element={<VideoDetail />} />
        <Route path="/my-library" element={<MyLibrary />} />
        <Route path="/watch/:id" element={<Watch />} />
      </Routes>
    </Router>
  );
}

export default App;
