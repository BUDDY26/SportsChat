export const checkAuthAndGetUser = () => {
    const storedUser = localStorage.getItem("user");
    
    if (!storedUser) {
      return null;
    }
    
    try {
      const userData = JSON.parse(storedUser);
      return userData.user || userData;
    } catch (error) {
      console.error("Failed to parse user data:", error);
      localStorage.removeItem("user");
      return null;
    }
  };