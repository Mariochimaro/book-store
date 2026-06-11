import { Link } from "react-router-dom";

function Navbar() {
  return (
    <nav
      style={{
        padding: "15px",
        borderBottom: "1px solid #ccc",
        display: "flex",
        gap: "15px",
      }}
    >
      <Link to="/">Home</Link>
      <Link to="/cart">Cart</Link>
      <Link to="/profile">Profile</Link>
      <Link to="/notifications">Notifications</Link>

      {/* ტესტისთვის */}
      <Link to="/book/1">Book #1</Link>
    </nav>
  );
}

export default Navbar;