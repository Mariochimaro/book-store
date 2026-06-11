import { Link } from "react-router-dom";

function BookCard({ book }) {
  return (
    <div
      style={{
        border: "1px solid gray",
        borderRadius: "8px",
        padding: "10px",
        width: "250px",
      }}
    >
      <img
        src={book.cover_url}
        alt={book.title}
        style={{
          width: "100%",
          height: "250px",
          objectFit: "cover",
        }}
      />

      <h3>{book.title}</h3>

      <p>{book.price} ₾</p>

      <p>{book.language}</p>

      <Link to={`/book/${book.id}`}>
        <button>დეტალები</button>
      </Link>
    </div>
  );
}

export default BookCard;