import Layout from "./Layout.jsx";
import Home from "./Home";
import Videos from "./Videos";
import VideoDetail from "./VideoDetail";
import Library from "./Library";
import Cart from "./Cart";
import Admin from "./Admin";
import Login from "./Login";
import Register from "./Register";

import {
  BrowserRouter as Router,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";

const PAGES = {
  Home: Home,
  Videos: Videos,
  VideoDetail: VideoDetail,
  Library: Library,
  Cart: Cart,
  Admin: Admin,
  Login: Login,
  Register: Register,
};

function _getCurrentPage(url) {
  if (url.endsWith("/")) {
    url = url.slice(0, -1);
  }
  let urlLastPart = url.split("/").pop();
  if (urlLastPart.includes("?")) {
    urlLastPart = urlLastPart.split("?")[0];
  }

  const pageName = Object.keys(PAGES).find(
    (page) => page.toLowerCase() === urlLastPart.toLowerCase()
  );
  return pageName || Object.keys(PAGES)[0];
}

function PagesContent() {
  const location = useLocation();
  const currentPage = _getCurrentPage(location.pathname);

  const noLayoutPages = ["Login", "Register"];

  if (noLayoutPages.includes(currentPage)) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Routes>
    );
  }

  return (
    <Layout currentPageName={currentPage}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/Home" element={<Home />} />
        <Route path="/Videos" element={<Videos />} />
        <Route path="/VideoDetail" element={<VideoDetail />} />
        <Route path="/Library" element={<Library />} />
        <Route path="/Cart" element={<Cart />} />
        <Route path="/Admin" element={<Admin />} />
      </Routes>
    </Layout>
  );
}

export default function Pages() {
  return (
    <Router>
      <PagesContent />
    </Router>
  );
}
