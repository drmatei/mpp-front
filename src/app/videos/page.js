"use client";

import { useState, useEffect } from "react";

export default function Videos() {
  const [videos, setVideos] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        const response = await fetch("http://127.0.0.1:8000/api/events/videos/");
        const data = await response.json();
        console.log("API Response:", data); 
        setVideos(Array.isArray(data.results) ? data.results : []); 
      } catch (error) {
        console.error("Error fetching videos:", error);
        setVideos([]); 
      }
    };
  
    fetchVideos();
  }, []);

  // file upload
  const handleFileUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile) return;

    const formData = new FormData();
    formData.append("title", selectedFile.name);
    formData.append("file", selectedFile);

    try {
      const response = await fetch("http://127.0.0.1:8000/api/events/videos/", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const newVideo = await response.json();
        setVideos((prevVideos) => [...prevVideos, newVideo]);
        setSelectedFile(null);
        alert("Video uploaded successfully!");
      } else {
        console.error("Error uploading video:", response.statusText);
      }
    } catch (error) {
      console.error("Error uploading video:", error);
    }
  };

    // video deletion
    const handleDeleteVideo = async (videoId) => {
      try {
        const response = await fetch(`http://127.0.0.1:8000/api/events/videos/${videoId}/`, {
          method: "DELETE",
        });
  
        if (response.ok) {
          setVideos((prevVideos) => prevVideos.filter((video) => video.id !== videoId));
          alert("Video deleted successfully!");
        } else {
          console.error("Error deleting video:", response.statusText);
        }
      } catch (error) {
        console.error("Error deleting video:", error);
      }
    };

    return (
      <main style={{ padding: "20px" }}>
        <h1>Relevant filespace</h1>
  
        <form onSubmit={handleFileUpload} style={{ marginBottom: "20px" }}>
          <input
            type="file"
            onChange={(e) => setSelectedFile(e.target.files[0])}
          />
          <button type="submit" disabled={!selectedFile}>
            Upload File
          </button>
        </form>
  
        <h2>Already Available Files</h2>
        <ul>
          {videos.map((video) => (
            <li key={video.id} style={{ marginBottom: "10px" }}>
              <a
                href={video.file}
                target="_blank"
                rel="noopener noreferrer"
                style={{ marginRight: "10px" }}
              >
                {video.title}
              </a>
              <button
                onClick={() => window.open(video.file, "_blank")}
                style={{
                  marginRight: "10px",
                  backgroundColor: "lightblue",
                  border: "none",
                  padding: "5px 10px",
                  cursor: "pointer",
                }}
              >
                Download
              </button>
              <button
                onClick={() => handleDeleteVideo(video.id)}
                style={{
                  backgroundColor: "red",
                  color: "white",
                  border: "none",
                  padding: "5px 10px",
                  cursor: "pointer",
                }}
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      </main>
    );
  }