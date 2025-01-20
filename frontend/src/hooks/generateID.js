import React, { useEffect } from 'react'
export const formID = async ({
    setGenerateID,
  }) => {
        const fetchGenerateID = async () => {
          try {
            const response = await fetch("http://127.0.0.1:8000/api/generateID", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
            });
    
            const data = await response.json();
    
            if (!data.response) {
              throw new Error("Invalid response format from server");
            }
            const content = JSON.parse(data.response);
            setGenerateID(content+1)
    
          } catch (err) {
            console.error("Error fetching chapters:", err);
          }
        };
    
        fetchGenerateID();
  }

      

