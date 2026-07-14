import { Route, Routes } from "react-router-dom";

import Dealer from "./components/Dealers/Dealer";
import Dealers from "./components/Dealers/Dealers";
import PostReview from "./components/Dealers/PostReview";
import Login from "./components/Login/Login";
import Register from "./components/Register/Register";

/**
 * Root application component that defines the main client-side routes.
 *
 * @returns {JSX.Element} The routed React application shell.
 */
function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/dealers" element={<Dealers />} />
      <Route path="/dealer/:id" element={<Dealer />} />
      <Route path="/postreview/:id" element={<PostReview />} />
    </Routes>
  );
}

export default App;
