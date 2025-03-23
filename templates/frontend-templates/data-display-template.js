import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "./style.css";

const DataDisplayTemplate = () => {
  // State for data
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // State for filtering/pagination (optional)
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  
  // Fetch data when component mounts
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/your-endpoint');
        
        if (!response.ok) {
          throw new Error(`Server responded with status: ${response.status}`);
        }
        
        const data = await response.json();
        setItems(data);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError(err.message || "Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);
  
  // Handle search input change
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Reset to first page on new search
  };
  
  // Filter items based on search term
  const filteredItems = items.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );
  
  // Calculate pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredItems.slice(indexOfFirstItem, indexOfLastItem);
  
  // Change page
  const paginate = (pageNumber) => setCurrentPage(pageNumber);
  
  // Handle loading state
  if (loading) {
    return (
      <div className="login-page">
        <div className="content-box">
          <h2 className="page-title">Loading Data...</h2>
        </div>
      </div>
    );
  }
  
  // Handle error state
  if (error) {
    return (
      <div className="login-page">
        <div className="content-box">
          <h2 className="page-title">Error Loading Data</h2>
          <div className="error-message">
            <strong>Error:</strong> {error}
          </div>
          <button 
            className="primary-button" 
            onClick={() => window.location.reload()}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="login-page">
      <div className="content-box">
        <h2 className="page-title">Data Display Title</h2>
        
        {/* Search bar */}
        <div className="search-container">
          <input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="search-input"
          />
        </div>
        
        {/* Data display */}
        {currentItems.length > 0 ? (
          <div className="data-list">
            {currentItems.map((item, index) => (
              <div key={index} className="data-item">
                <h3>{item.name}</h3>
                {item.description && <p>{item.description}</p>}
                {/* Add additional fields as needed */}
                <div className="item-actions">
                  <Link to={`/item-details/${item.id}`} className="view-link">
                    View Details
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <p>No items found{searchTerm ? " matching your search" : ""}.</p>
          </div>
        )}
        
        {/* Pagination */}
        {filteredItems.length > itemsPerPage && (
          <div className="pagination">
            {Array.from({ length: Math.ceil(filteredItems.length / itemsPerPage) }, (_, i) => (
              <button
                key={i}
                onClick={() => paginate(i + 1)}
                className={currentPage === i + 1 ? "active" : ""}
              >
                {i + 1}
              </button>
            ))}
          </div>
        )}
        
        <div className="link-row">
          <Link to="/">Back to Home</Link>
        </div>
      </div>
    </div>
  );
};

export default DataDisplayTemplate;