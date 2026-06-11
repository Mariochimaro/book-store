import Navbar from "../components/Navbar";
import { useParams } from "react-router-dom";

function BookDetail() {
  const { id } = useParams();

  return (
    <>
      <Navbar />

      <div style={{ padding: "20px" }}>
        <h1>Book Detail Page</h1>
        <p>Book ID: {id}</p>
      </div>
    </>
  );
}

export default BookDetail;