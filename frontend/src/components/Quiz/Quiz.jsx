import React, { useState,useEffect } from "react";
import MCQCards from "./MCQCards";
import BlankCards from "./BlankCards";
import { formID } from "../../hooks/generateID";
import {
  TextField,
  MenuItem,
  Button,
  CircularProgress,
  Typography,
  Grid,
  Box,
  Card,
  CardContent,
} from "@mui/material";
import { handleApiRequest } from "../../hooks/generateSubmit";
import { getLocalTime } from "../../utils/time";
import {
  mcqQuestionsType,
  grades,
  courses,
  difficulty,
} from "../../utils/formData";
function Quiz() {
  const [formData, setFormData] = useState({
    type: "mcqs",
    grade: "9",
    course: "Physics",
    numberOfQuestions: 1,
    difficulty: "easy",
    topic: "",
  });
  const [content, setContent] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [generateID, setGenerateID] = useState();

    useEffect(() => {
      const generateFormID = async () => {
        try {
          await formID({
            setGenerateID,
          });
        } catch (error) {
          console.error("Error generating ID:", error);
        }
      };
    
      generateFormID(); // Call the async function
    }, [setGenerateID,loading]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setContent([]);
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    const method="objective";
    e.preventDefault();

    const payload = {
      grade: parseInt(formData.grade, 10),
      course: formData.course,
      quantity: parseInt(formData.numberOfQuestions, 10),
      difficulty:
        formData.difficulty.charAt(0).toUpperCase() +
        formData.difficulty.slice(1),
      topic: formData.topic,
    };

    const link =
      formData.type === "mcqs"
        ? "http://127.0.0.1:8000/api/mcqs"
        : "http://127.0.0.1:8000/api/blanks";

    await handleApiRequest({
      link,
      payload,
      formData,
      setError,
      setContent,
      setLoading,
      generateID,
      type: formData.type,
      method
    });
  };

  return (
    <Box p={4} sx={{ backgroundColor: "#f9f9f9", minHeight: "100vh" }}>
      <Grid container spacing={4}>
        {/* Form Section */}
        <Grid item xs={12} md={6}>
          <Box
            sx={{
              p: 3,
              backgroundColor: "#fff",
              borderRadius: 2,
              boxShadow: 3,
            }}
          >
            <Typography variant="h4" gutterBottom>
              MCQs & Blanks Generator
            </Typography>
            <form onSubmit={handleSubmit}>
              <Grid container spacing={2}>
                <Grid item xs={12} md={12}>
                  <TextField
                    fullWidth
                    name="type"
                    select
                    label="Type"
                    value={formData.type}
                    onChange={handleChange}
                  >
                    {mcqQuestionsType.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    name="grade"
                    select
                    label="Grade"
                    value={formData.grade}
                    onChange={handleChange}
                  >
                    {grades.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    name="course"
                    select
                    label="Course"
                    value={formData.course}
                    onChange={handleChange}
                  >
                    {courses.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    name="numberOfQuestions"
                    label="Number of Questions"
                    type="number"
                    value={formData.numberOfQuestions}
                    onChange={handleChange}
                    inputProps={{ min: 1, max: 10 }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    name="difficulty"
                    select
                    label="Difficulty"
                    value={formData.difficulty}
                    onChange={handleChange}
                  >
                    {difficulty.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    name="topic"
                    label="Topic"
                    placeholder="Galileo's Experiments from kinematics"
                    variant="outlined"
                    value={formData.topic}
                    onChange={handleChange}
                    required
                  />
                </Grid>
                <Grid item xs={12}>
                  <Button
                    type="submit"
                    variant="contained"
                    fullWidth
                    sx={{ py: 1.5 }}
                    disabled={loading}
                  >
                    {loading ? <CircularProgress size={24} /> : "Generate"}
                  </Button>
                </Grid>
                <Grid item xs={12} md={12}>
                  <Typography color="info" className="py-3">
                    Topics should be referenced clearly with their corresponding
                    chapters. For example, queries like "Galileo's Experiments
                    from Kinematics" or "Chapter Kinematics" help in focusing on
                    specific content, ensuring targeted and accurate information
                    retrieval.
                  </Typography>
                </Grid>
                {error && (
                  <Grid item xs={12}>
                    <Typography color="error">{error}</Typography>
                  </Grid>
                )}
              </Grid>
            </form>
          </Box>
        </Grid>

        {/* MCQs Display Section */}
        <Grid item xs={12} md={6}>
          <Typography variant="h4" gutterBottom>
            {formData.type === "mcqs" ? "Generated MCQs" : "Generated Blanks"}
          </Typography>
          {formData.type === "mcqs" ? (
            <MCQCards content={content} />
          ) : (
            <BlankCards content={content} />
          )}
        </Grid>
      </Grid>
    </Box>
  );
}

export default Quiz;
