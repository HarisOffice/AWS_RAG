import {getLocalTime} from "../utils/time"

export const handleApiRequest = async ({
    link,
    payload,
    formData,
    setError,
    setContent,
    setLoading,
    generateID,
    type,
    method
  }) => {
    setError("");
    setLoading(true);
    // Get user email from localStorage
    const userEmail = JSON.parse(localStorage.getItem("user"))?.email || "unknown";
  
    // Capture the start time for the response
    const startTime = performance.now();
  
    try {
      const response = await fetch(link, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
  
      // Calculate the response time after the API call
      const endTime = performance.now();
      const responseTime = ((endTime - startTime) / 1000).toFixed(2); // in seconds
  
      if (!response.ok) {
        throw new Error(
          `HTTP error! Status: ${response.status} - ${response.statusText}`
        );
      }
  
      const data = await response.json();
  
      if (!data.response) {
        throw new Error("Invalid response format from server");
      }
  
      const parsedMcqs = JSON.parse(data.response);
  
      if (!Array.isArray(parsedMcqs) || parsedMcqs.length === 0) {
        throw new Error(
          "No questions were generated. Please try again with different parameters."
        );
      }
      setContent(parsedMcqs);
  
      // Data to send to backend
      const storedData = {
        formData,
        apiResponse: parsedMcqs,
        timestamp: getLocalTime(),
        userEmail: userEmail,
        apiResponseTime: responseTime,
        error: "",
        generateID,
        type,
        method
      };
  
      // Sending the data to the backend API to store in MongoDB
      await fetch("https://ai.myedbox.com/api/store_api_data", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(storedData),
      });
    } catch (err) {
      // Capture error message and store it
      const endTime = performance.now();
      const responseTime = ((endTime - startTime) / 1000).toFixed(2); // in seconds
  
      setError(
        err instanceof Error
          ? err.message
          : "Failed to generate MCQs. Please try again."
      );
  
      const errorData = {
        formData,
        apiResponse: err.message,
        timestamp: getLocalTime(),
        userEmail: userEmail,
        apiResponseTime: responseTime,
        error: err.message,
        generateID,
        type,
        method
      };
  
      // Sending the error data to the backend API to store in MongoDB
      await fetch("https://ai.myedbox.com/api/store_api_data", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(errorData),
      });
    } finally {
      setLoading(false);
    }
  };